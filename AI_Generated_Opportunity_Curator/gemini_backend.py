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

# -------- Load data (events) ----------
events_path = _abs_path("mock_data/events.json")
with open(events_path, "r", encoding="utf-8") as f:
    events = json.load(f)

event_fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
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

people_fields = ["name", "role", "related_fields", "leadership_counseling"]
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

    elif "network curator" in system_prompt:
        retrieved = retrieve_people(message)
        fields = people_fields
        context_lines = [
            " | ".join(_join_field(p, field) for field in fields)
            for p in retrieved
        ]
        context = "\n".join(context_lines)

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

    prompt = f"{system_prompt}\nIf the user already has attended an event or talked to a person, 
    you should skip the event or person given in the following context in your answer\n
    Context:\n{context}\n\nUser question: {message}"

    try:
        resp = gemini_model.generate_content(prompt)
        return getattr(resp, "text", "").strip() or "[No text returned]"
    except Exception as e:
        return f"Error generating response: {e}"

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        answer = query_gemini_with_context(request.message, request.system_prompt)
        print(answer)
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Start the FastAPI server if run as a script
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
