from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import random
from typing import List, Dict, Any

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    system_prompt: str = ""

# Mock data for responses
MOCK_RESPONSES = [
    "I'm a mock response for testing. The actual Gemini API would provide a more detailed answer.",
    "This is a test response. The real system would analyze your query and provide relevant information.",
    "Thanks for your message! In a real implementation, I'd use AI to generate a response.",
    "This is a placeholder response. The actual system would understand and respond to your query.",
]

# Mock events data
MOCK_EVENTS = [
    {
        "title": "Leadership Workshop",
        "date": "2023-11-15",
        "description": "Learn essential leadership skills in this interactive workshop.",
        "type": "Workshop"
    },
    {
        "title": "Networking Mixer",
        "date": "2023-11-20",
        "description": "Connect with professionals in your field.",
        "type": "Networking"
    }
]

# Mock people data
MOCK_PEOPLE = [
    {
        "name": "John Doe",
        "title": "Senior Developer",
        "company": "Tech Corp",
        "interests": ["AI", "Machine Learning", "Leadership"]
    },
    {
        "name": "Jane Smith",
        "title": "Product Manager",
        "company": "Innovate Inc",
        "interests": ["Product Development", "UX Design", "Agile"]
    }
]

@app.get("/")
async def root():
    return {"message": "Mock backend is running. Use /chat endpoint for testing."}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # Simple keyword matching for mock responses
    message = request.message.lower()
    response = {"message": random.choice(MOCK_RESPONSES)}
    
    # Add mock data based on keywords
    if any(word in message for word in ["event", "workshop", "meeting"]):
        response["events"] = MOCK_EVENTS
    if any(word in message for word in ["connect", "network", "people"]):
        response["people"] = MOCK_PEOPLE
    
    return response

# Add other endpoints that your frontend might be calling
@app.get("/events")
async def get_events():
    return {"events": MOCK_EVENTS}

@app.get("/people")
async def get_people():
    return {"people": MOCK_PEOPLE}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
