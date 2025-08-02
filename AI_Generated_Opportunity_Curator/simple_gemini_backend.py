from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import json
import os
import re
from typing import List, Dict, Any

# FastAPI App Initialization
app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Model for Chat Request
class ChatRequest(BaseModel):
    message: str
    system_prompt: str = ""

# Global variables
MODEL_NAME = None
AVAILABLE_MODELS = []
MAX_OUTPUT_TOKENS = 1500
events_data = []  # Initialize as empty list
networking_data = []  # Initialize as empty list

# Load networking data
try:
    with open("mock_data/networking_data.json") as f:
        networking_data = json.load(f)
    print(f"Loaded {len(networking_data)} networking contacts")
except Exception as e:
    print(f"Error loading networking data: {e}")
    networking_data = []

# Try to load events data, but don't fail if it doesn't exist
try:
    with open("mock_data/events_data.json") as f:
        events_data = json.load(f)
    print(f"Loaded {len(events_data)} events")
except FileNotFoundError:
    print("Events data file not found - continuing without events data")
    # Create some basic finance events as fallback
    events_data = [
        {
            "event_title": "Finance Career Fair",
            "type": "Career Fair",
            "description": "Annual career fair featuring finance companies and recruiters.",
            "leadership_skill_developed": "Networking, Communication"
        },
        {
            "event_title": "Investment Banking Workshop",
            "type": "Workshop",
            "description": "Learn about careers in investment banking.",
            "leadership_skill_developed": "Financial Analysis, Decision Making"
        }
    ]
except Exception as e:
    print(f"Error loading events data: {e}")

# Initialize Gemini API
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable must be set")
    
genai.api_key = api_key

# Get available models
try:
    models = genai.list_models()
    AVAILABLE_MODELS = [model.name for model in models]
    print(f"Available models: {AVAILABLE_MODELS}")
    
    # Try to find a suitable model - prefer models with higher quotas
    for model_prefix in ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.5-flash-lite", "gemini-1.5-pro"]:
        for model in AVAILABLE_MODELS:
            if model_prefix in model:
                MODEL_NAME = model
                print(f"Selected model: {MODEL_NAME}")
                break
        if MODEL_NAME:
            break
            
    if not MODEL_NAME and AVAILABLE_MODELS:
        MODEL_NAME = AVAILABLE_MODELS[0]
        print(f"Using default model: {MODEL_NAME}")
        
except Exception as e:
    print(f"Error getting available models: {e}")
    raise HTTPException(status_code=500, detail=f"Error initializing Gemini API: {e}")

# --- Simple Keyword-Based Search (No NumPy/FAISS needed) ---
def simple_keyword_search(query: str, data_list: List[Dict[Any, Any]], fields: List[str], top_k: int = 3):
    """A basic keyword search that doesn't require NumPy or FAISS"""
    if not data_list:
        return []
        
    # Normalize the query for better matching
    query_terms = set(re.sub(r'[^\w\s]', '', query.lower()).split())
    
    # Score each item based on keyword matches
    scored_items = []
    for item in data_list:
        score = 0
        item_text = ""
        
        # Concatenate the specified fields
        for field in fields:
            if field in item:
                item_text += " " + str(item.get(field, "")).lower()
        
        # Count matching terms
        item_terms = set(re.sub(r'[^\w\s]', '', item_text.lower()).split())
        matching_terms = query_terms.intersection(item_terms)
        score = len(matching_terms)
        
        # Boost score for exact phrase matches
        if query.lower() in item_text.lower():
            score += 5
            
        scored_items.append((score, item))
    
    # Sort by score (descending) and return top_k items
    scored_items.sort(reverse=True, key=lambda x: x[0])
    return [item for score, item in scored_items[:top_k]]

# --- API Endpoints ---
@app.get("/")
def read_root():
    return {
        "status": "API is running", 
        "model": MODEL_NAME,
        "networking_data_loaded": len(networking_data),
        "events_data_loaded": len(events_data)
    }

@app.get("/healthcheck")
def health_check():
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "api_key_configured": api_key is not None,
        "events_loaded": len(events_data),
        "networking_data_loaded": len(networking_data)
    }

@app.get("/models")
def list_models():
    return {"available_models": AVAILABLE_MODELS, "selected_model": MODEL_NAME}

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        print(f"Received request: {request.message}")
        
        # Find relevant people using keyword search
        relevant_people = simple_keyword_search(
            request.message,
            networking_data,
            ["name", "role", "related_fields", "leadership_counseling"],
            3
        )
        print(f"Found {len(relevant_people)} relevant people")
        
        # If no relevant people found for finance query, add fallback options
        if "finance" in request.message.lower() and len(relevant_people) < 2:
            print("Adding fallback finance contacts")
            fallback_contacts = [
                {"name": "Professor Sarah Johnson", "role": "Finance Department Chair", "related_fields": "Finance, Investments, Banking"},
                {"name": "Michael Chen", "role": "Alumni - Investment Banking Analyst", "related_fields": "Finance, Investment Banking, Corporate Finance"},
                {"name": "Career Services Office", "role": "Financial Industry Advisor", "related_fields": "Finance, Accounting, Economics"}
            ]
            # Add fallback contacts if not already in results
            for contact in fallback_contacts:
                if not any(p.get("name") == contact["name"] for p in relevant_people):
                    relevant_people.append(contact)
            relevant_people = relevant_people[:3]  # Keep only top 3
        
        # Format context for Gemini
        context = ""
        if events_data:
            # Find relevant events
            relevant_events = simple_keyword_search(
                request.message, 
                events_data, 
                ["event_title", "type", "description", "leadership_skill_developed"],
                3
            )
            print(f"Found {len(relevant_events)} relevant events")
            
            context += "Relevant events:\n"
            for event in relevant_events:
                context += f"- {event.get('event_title', 'Unknown event')}: {event.get('description', '')[:100]}...\n"
            context += "\n"
        
        context += "Relevant people to network with:\n"
        for person in relevant_people:
            context += f"- {person.get('name', 'Unknown')}: {person.get('role', '')}, {person.get('related_fields', '')}\n"
        
        print(f"Context prepared: {context[:200]}...")
        
        system_prompt = """
        You are a helpful assistant providing personalized networking and career development recommendations
        to university students. When asked about who to talk to, suggest specific people from the context provided
        and explain why they would be valuable connections based on the student's interests.
        Be specific, actionable, and encouraging in your advice.
        """
        
        # Create the prompt with context
        user_prompt = f"User query: {request.message}\n\nContext information:\n{context}"
        
        print(f"Calling Gemini API with model: {MODEL_NAME}")
        # Call Gemini API
        model = genai.GenerativeModel(MODEL_NAME)
        
        try:
            # Try with system prompt
            print("Attempting to use system prompt")
            response = model.generate_content(
                contents=[
                    {"role": "system", "parts": [system_prompt]},
                    {"role": "user", "parts": [user_prompt]}
                ],
                generation_config={
                    "temperature": 0.7,
                    "max_output_tokens": MAX_OUTPUT_TOKENS,
                    "top_p": 0.95
                }
            )
            print("System prompt request succeeded")
        except Exception as api_error:
            print(f"System prompt approach failed: {api_error}")
            # Check if it's a rate limit error
            if "429" in str(api_error) or "quota" in str(api_error).lower():
                print("Rate limit detected, creating specific fallback response")
                
                # Create a more personalized fallback based on the data we have
                fallback_response = "Based on your interest in finance, here are some recommended connections:\n\n"
                
                for person in relevant_people:
                    name = person.get("name", "A professional")
                    role = person.get("role", "in finance")
                    fields = person.get("related_fields", "finance")
                    
                    fallback_response += f"• {name} ({role}): They can provide insights about {fields}.\n"
                
                fallback_response += "\nReaching out to these contacts can help you explore different career paths, understand industry trends, and potentially find mentorship opportunities in finance."
                
                return {
                    "response": fallback_response,
                    "is_fallback": True,
                    "reason": "API quota exceeded"
                }
                
            # Fall back to simpler format if system prompts aren't supported
            print("Falling back to combined prompt")
            combined_prompt = f"{system_prompt}\n\n{user_prompt}"
            try:
                response = model.generate_content(
                    combined_prompt,
                    generation_config={
                        "temperature": 0.7,
                        "max_output_tokens": MAX_OUTPUT_TOKENS,
                        "top_p": 0.95
                    }
                )
                print("Combined prompt request succeeded")
            except Exception as fallback_error:
                print(f"Fallback approach also failed: {fallback_error}")
                
                # Personalized response based on what we know
                contacts_text = ""
                for person in relevant_people:
                    contacts_text += f"- {person.get('name', 'Unknown')}: {person.get('role', '')}\n"
                
                return {
                    "response": f"Based on your interest in finance, here are some key people to connect with:\n\n{contacts_text}\nThese contacts can help guide your career path in finance and provide valuable industry insights.",
                    "is_fallback": True,
                    "reason": "API unavailable"
                }
        
        # Extract the text from the response with detailed logging
        print(f"Response type: {type(response)}")
        print(f"Response attributes: {dir(response)}")
        
        if hasattr(response, 'text'):
            print(f"Found response.text: {response.text[:100]}...")
            return {"response": response.text}
        elif hasattr(response, 'parts') and response.parts:
            print(f"Found response.parts: {response.parts[0].text[:100]}...")
            return {"response": response.parts[0].text}
        else:
            print("No standard response format found, trying to extract from candidates")
            try:
                if hasattr(response, 'candidates') and response.candidates:
                    content = response.candidates[0].content
                    if hasattr(content, 'parts') and content.parts:
                        print(f"Extracted from candidates: {content.parts[0].text[:100]}...")
                        return {"response": content.parts[0].text}
            except Exception as extract_error:
                print(f"Error extracting from candidates: {extract_error}")
            
            # Use networking data for fallback response
            contacts_text = ""
            for person in relevant_people:
                contacts_text += f"- {person.get('name', 'Unknown')}: {person.get('role', '')}\n"
            
            return {
                "response": f"Here are some recommended contacts in finance:\n\n{contacts_text}\nThese professionals can provide guidance on career opportunities and industry insights.",
                "is_fallback": True,
                "reason": "Response format issue"
            }
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        # Create a response from available data if possible
        if relevant_people:
            contacts_text = ""
            for person in relevant_people[:3]:
                contacts_text += f"- {person.get('name', 'Unknown')}: {person.get('role', '')}\n"
                
            return {
                "response": f"I recommend connecting with these finance professionals:\n\n{contacts_text}\nThey can help you navigate career paths in finance and provide valuable industry insights.",
                "is_fallback": True,
                "reason": "Processing error"
            }
        else:
            return {
                "response": "For finance students, I recommend connecting with professors in your finance department, visiting your university's career center for finance-specific resources, and reaching out to alumni working in financial institutions for practical advice.",
                "is_fallback": True,
                "reason": "General error"
            }