from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# get the env
load_dotenv()

class FeedbackRequest(BaseModel):
    responses: dict

class ChatRequest(BaseModel):
    message: str
    system_prompt: str = ""

# NOTE: Newer public models are often "gemini-1.5-flash" or "gemini-1.5-pro".
# Keep as a constant so it's easy to change.
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    system_prompt: str = ""

# -------- Gemini API config (DON'T hardcode keys) ----------
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Missing GOOGLE_API_KEY environment variable.")
genai.configure(api_key=api_key)
gemini_model = genai.GenerativeModel(GEMINI_MODEL_NAME)

# -------- Embedding model ----------
sentence_model = SentenceTransformer("all-MiniLM-L6-v2")

def _abs_path(rel_path: str) -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), rel_path)

def process_leadership_feedback(responses: dict) -> dict:
    system_prompt = """
        You are an expert leadership coach. Your task is to analyze the provided feedback from a leadership questionnaire.
        Organize the feedback into three distinct sections: "Strengths," "Areas for Growth," and "Actionable Next Steps."
        For each section, provide a short introductory paragraph and a bulleted list of key points.
        The final response MUST be in JSON format with the following structure:
        {
          "report_title": "Your Leadership Feedback Report",
          "introduction": "...",
          "sections": [
            {"title": "Strengths", "intro_paragraph": "...", "points": ["...", "..."]},
            {"title": "Areas for Growth", "intro_paragraph": "...", "points": ["...", "..."]},
            {"title": "Actionable Next Steps", "intro_paragraph": "...", "points": ["...", "..."]}
          ],
          "closing_statement": "..."
        }
    """
    
    prompt_message = f"Here are the questionnaire responses to analyze:\n\n{json.dumps(responses, indent=2)}"
    
    try:
        raw_response = gemini_model.generate_content(
            f"{system_prompt}\n\n{prompt_message}"
        ).text.strip()
        
        return json.loads(raw_response)
        
    except Exception as e:
        print(f"Error processing feedback: {e}")
        return {"error": "Failed to generate structured feedback."}
# -------- Load data (events) ----------
events_path = _abs_path("mock_data/events.json")
with open(events_path, "r", encoding="utf-8") as f:
    events = json.load(f)

event_fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed", "register & more details"]
event_texts = [
    " | ".join(str(e.get(field, "")) for field in event_fields)
    for e in events
]
event_embeddings = sentence_model.encode(event_texts).astype("float32")  # faiss needs float32
event_index = faiss.IndexFlatL2(event_embeddings.shape[1])
event_index.add(event_embeddings)

def retrieve_events(query: str, top_k: int = 3):
    query_emb = sentence_model.encode([query]).astype("float32")
    D, I = event_index.search(query_emb, top_k)
    return [events[i] for i in I[0]]

# -------- Load data (people) ----------
people_path = _abs_path("mock_data/people.json")
with open(people_path, "r", encoding="utf-8") as f:
    people = json.load(f)

people_fields = ["name", "role", "related_fields", "leadership_counseling", "email"]
def _join_field(obj, field):
    val = obj.get(field, "")
    if isinstance(val, list):
        return ", ".join(map(str, val))
    return str(val)

people_texts = [
    " | ".join(_join_field(p, field) for field in people_fields)
    for p in people
]
people_embeddings = sentence_model.encode(people_texts).astype("float32")
people_index = faiss.IndexFlatL2(people_embeddings.shape[1])
people_index.add(people_embeddings)

def retrieve_people(query: str, top_k: int = 3):
    query_emb = sentence_model.encode([query]).astype("float32")
    D, I = people_index.search(query_emb, top_k)
    return [people[i] for i in I[0]]

def query_gemini_with_context(message: str, system_prompt: str = "") -> str:
    # Build contextual string (always a string, never a list)
    if "opportunity curator" in system_prompt:
        retrieved = retrieve_events(message)
        fields = event_fields
        context_lines = [
            " | ".join(str(e.get(field, "")) for field in fields)
            for e in retrieved
        ]
        context = "\n".join(context_lines)
        prompt = f"""
        Return a json object of json objects as your answer.
        For example, follow this flow:
        Question: You are an opportunity curator. This is the given context: Summer Internship Search Strategy Session | Application Event / Workshop | Tuesday, May 20, 2026 (4:00 PM - 5:30 PM) | Geared towards rising sophomores and juniors, this session by the Business Career Center provides essential strategies for launching a successful summer 2027 internship search. Topics include identifying target industries, crafting compelling applications, leveraging career fairs, and interview preparation. | All Business Majors | Goal Setting, Planning, Initiative | https://events.wisc.edu/register/summer-internship-search-strategy-session-77724
"Marketing Your Story" Personal Branding Workshop | Workshop | Saturday, October 4, 2025 (10:00 AM - 1:00 PM) | Led by a professional development consultant from the Business Career Center, this interactive workshop helps students define their personal brand and effectively communicate their unique value proposition for internships and job applications. Activities include group exercises, resume review tips, and LinkedIn profile optimization strategies. | Marketing, Management & Human Resources (applicable to all) | Communication (Self-Promotion), Strategic Thinking | https://events.wisc.edu/register/marketing-your-story-personal-branding-workshop-77724
        Answer: {{
            "Intro": "Based on your profile as a Human Resources and Management major interested in developing communication skills and preparing for internships, I recommend the following opportunities:"
            "Opportunity 1": {{
                "Title": "Summer Internship Search Strategy Session",
                "Type": "Application Event / Workshop",
                "Dates": "Tuesday, May 20, 2026 (4:00 PM - 5:30 PM)",
                "Description": "This session provides essential strategies for launching a successful summer 2027 internship search. Topics include identifying target industries, crafting compelling applications, leveraging career fairs, and interview preparation.",
                "Related Business Majors": "All Business Majors (including Human Resources and Management)",
                "Leadership Skills Developed": "Goal Setting, Planning, Initiative",
		        “Register & More Details”: “https://events.wisc.edu/register/summer-internship-search-strategy-session-77724”,
                "Explanation": "This workshop directly addresses your goal of preparing for an internship.  The skills developed (goal setting, planning, and initiative) are highly valuable for internship applications and success. While it doesn't focus specifically on communication, strong planning and initiative are foundational to effective communication in a professional setting."
            }},
            "Opportunity 2": {{
                "Title": "\"Marketing Your Story\" Personal Branding Workshop",
                "Type": "Workshop",
                "Dates": "Saturday, October 4, 2025 (10:00 AM - 1:00 PM)",
                "Description": "This interactive workshop helps students define their personal brand and effectively communicate their unique value proposition for internships and job applications. Activities include group exercises, resume review tips, and LinkedIn profile optimization strategies.",
                "Related Business Majors": "Marketing, Management & Human Resources (applicable to all)",  
                "Leadership Skills Developed": "Communication (Self-Promotion), Strategic Thinking",
		        “Register & More Details”: “https://events.wisc.edu/register/marketing-your-story-personal-branding-workshop-77724”
                "Explanation": "This workshop directly addresses your interest in developing communication skills, specifically focusing on self-promotion – a crucial aspect of securing internships.  The focus on personal branding and resume/LinkedIn optimization will significantly improve your application materials.  The strategic thinking component will further enhance your professional skill set."
            }}
        }}

        Question: {system_prompt}
        \nHere is the relevant context information you are to use in your response. Context: {context}
        \nThis is what the user is requesting: {message}
        If the user request contains information that they have already experienced an event that is
        also in the context or they have already spoken with someone that is also in the context, do not
        include that event or person again in your recommendation response.
        Answer:
    """

    elif "network curator" in system_prompt:
        retrieved = retrieve_people(message)
        fields = people_fields
        context_lines = [
            " | ".join(_join_field(p, field) for field in fields)
            for p in retrieved
        ]
        context = "\n".join(context_lines)
        prompt = f"""
        Return a json object of json objects as your answer.
            For example, follow this flow:
            Question: You are a network curator. This is the given context: Emily Cox | Faculty | Accounting, Business Law, Taxation | Accountability, Ethical Leadership, Attention to Detail, Problem Solving | emily.cox@businessuni.edu
    Scarlett Hill | Advisor | Accounting, Business Law | Ethical Leadership, Accountability, Attention to Detail | scarlett.hill@leadingedge.edu
        Answer: {{
            “Intro”: “Based on your profile as an Accounting major interested in developing problem solving skills, I recommend connecting with the following individuals:”
            “Contact 1”: {{
                “Name”: “Emily Cox”,
                “Role”: “Faculty”,
                “Related Fields”: “Accounting, Business Law, Taxation”,
                “Leadership Counseling”: “Accountability, Ethical Leadership, Attention to Detail, Problem Solving”,
                “Email”: “emily.cox@businessuni.edu”
                "Explanation": "As a faculty member specializing in Account, Emily Cox can offer tailored advice on building your problem solving skills for your future career. Their expertise in mentorship and coaching for growth will be particularly beneficial in helping you develop and refine your problem solving skills abilities within a professional context. They can provide guidance on networking, interviewing, and overall career planning within the Accounting field."
            }},
            “Contact 2”: {{
                “Name”: “Scarlett Hill”,
                “Role”: “Advisor”,
                “Related Fields”: “Accounting, Business Law”,
                “Leadership Counseling”: “Ethical Leadership, Accountability, Attention to Detail”,
                “Email”: “scarlett.hill@leadingedge.edu”
                "Explanation": “Scarlet’s guidance as an advisor can also be helpful. Speak with her about attention to detail within accounting and to learn about ethical leadership in a professional context”
            }}
        }}

        Question: {system_prompt}
        \nHere is the relevant context information you are to use in your response. Context: {context}
        \nThis is what the user is requesting: {message}
        If the user request contains information that they have already experienced an event that is
        also in the context or they have already spoken with someone that is also in the context, do not
        include that event or person again in your recommendation response.
        Answer:
    """

    else:  # plan curator (default)
        plan_events = retrieve_events(message, top_k=5)
        events_block = "\n".join(
            " | ".join(str(e.get(field, "")) for field in event_fields)
            for e in plan_events
        )
        plan_people = retrieve_people(message, top_k=5)
        people_block = "\n".join(
            " | ".join(_join_field(p, field) for field in people_fields)
            for p in plan_people
        )
        context = f"Opportunities to go to:\n{events_block}\n\nPeople to talk to:\n{people_block}"
        prompt = f"""{system_prompt}
        \nHere is the relevant context information you are to use in your response. Context: {context}
        \nThis is what the user is requesting: {message}
        If the user request contains information that they have already experienced an event that is
        also in the context or they have already spoken with someone that is also in the context, do not
        include that event or person again in your recommendation response.
    """

    print(prompt)
    try:
        resp = gemini_model.generate_content(prompt)
        return getattr(resp, "text", "").strip() or "[No text returned]"
    except Exception as e:
        return f"Error generating response: {e}"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        answer = query_gemini_with_context(request.message, request.system_prompt)
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/feedback")
async def feedback_endpoint(request: FeedbackRequest):
    try:
        structured_feedback = process_leadership_feedback(request.responses)
        return structured_feedback
    except Exception as e:
        return {"error": str(e)}
    
if __name__ == "__main__":
    # Start the FastAPI server if run as a script
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
