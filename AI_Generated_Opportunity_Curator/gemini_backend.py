from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import json
import os

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    raise RuntimeError("Missing GOOGLE_API_KEY in environment")

client = genai.Client(api_key=api_key)

app = FastAPI()

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

# initialize Gemini
client = genai.Client()

# Load and embed events at startup
with open("mock_data/networking_data.json") as f:
    events = json.load(f) # turns JSON file into Python dict

model = SentenceTransformer("all-MiniLM-L6-v2") # load a pre-trained model that can turn sentences into embeddings (lists of numbers)
# Concatenate all relevant fields for richer embeddings
fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
event_texts = [
    " | ".join(str(e.get(field, "")) for field in fields)
    for e in events
]

event_embeddings = model.encode(event_texts) # embed descriptions
index = faiss.IndexFlatL2(event_embeddings.shape[1]) # create search index to quickly find which event desc most similar to user ques
index.add(np.array(event_embeddings)) # convert list of embeddings into numpy array for faiss

def retrieve_events(query, top_k=3):
    query_emb = model.encode([query])
    D, I = index.search(np.array(query_emb), top_k) # find most similar event to user query
    return [events[i] for i in I[0]] # return those entire JSON events

def query_gemini_with_context(message, system_prompt=""):
    retrieved = retrieve_events(message)

    fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
    context = [
        " | ".join(str(e.get(field, "")) for field in fields)
        for e in retrieved
    ]

    full_prompt = f"Context:\n{context}\n\nUser question: {message}"
    print(full_prompt)

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=full_prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt
        ),
    )
    return response.text if hasattr(response, "text") else str(response)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        answer = query_gemini_with_context(request.message, request.system_prompt)
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}
