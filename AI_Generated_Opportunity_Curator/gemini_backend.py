from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import json

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

# load a pre-trained model that can turn sentences into embeddings (lists of numbers)
model = SentenceTransformer("all-MiniLM-L6-v2")

### Loading and embedding EVENTS at startup
with open("mock_data/events.json") as f:
    events = json.load(f) # turns JSON file into Python dict

# Concatenate all relevant fields for richer embeddings
event_fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
event_texts = [
    " | ".join(str(e.get(field, "")) for field in event_fields)
    for e in events
]
event_embeddings = model.encode(event_texts) # embed descriptions
event_index = faiss.IndexFlatL2(event_embeddings.shape[1]) # create search index to quickly find which event desc most similar to user ques
event_index.add(np.array(event_embeddings)) # convert list of embeddings into numpy array for faiss

# Method for when a query comes in and I want to retreive most similar events
def retrieve_events(query, top_k=3):
    query_emb = model.encode([query])
    D, I = event_index.search(np.array(query_emb), top_k) # find most similar event to user query
    return [events[i] for i in I[0]] # return those entire JSON events

### Loading and embedding PEOPLE at first call
with open("mock_data/people.json") as f:
    people = json.load(f)  # turns JSON file into list of Python dicts

people_fields = ["name", "role", "related_fields", "leadership_counseling"]
people_texts = [
    " | ".join(str(p.get(field, "")) if not isinstance(p.get(field, ""), list)
        else ", ".join(p.get(field, [])) #  if the field is a list, join the list items with commas
        for field in people_fields
    )
    for p in people
]

people_embeddings = model.encode(people_texts)
people_index = faiss.IndexFlatL2(people_embeddings.shape[1])
people_index.add(np.array(people_embeddings))

# Method for when a query comes in and I want to retrieve most similar people to connect with
def retrieve_people(query, top_k=3):
    query_emb = model.encode([query])
    D, I = people_index.search(np.array(query_emb), top_k)
    return [people[i] for i in I[0]]

def query_gemini_with_context(message, system_prompt=""):
    if "opportunity curator" in system_prompt:
        retrieved = retrieve_events(message)
        fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
        context = [
            " | ".join(str(e.get(field, "")) for field in fields)
            for e in retrieved
        ]
    elif "network curator" in system_prompt:
        retrieved = retrieve_people(message)
        fields = ["name", "role", "related_fields", "leadership_counseling"]
        context = [
            " | ".join(str(p.get(field, "")) if not isinstance(p.get(field, ""), list)
            else ", ".join(p.get(field, [])) #  if the field is a list, join the list items with commas
            for field in people_fields
            )
            for p in retrieved
        ]
    else: # plan curator
        plan_events = retrieve_events(message, top_k=5)
        fields = ["event_title", "type", "dates", "description", "related_business_major(s)", "leadership_skill_developed"]
        context = "Opportunities to go to: " + "\n".join(
            " | ".join(str(e.get(field, "")) for field in fields)
            for e in plan_events
        )
        plan_people = retrieve_people(message, top_k=5)
        context += "\nPeople to talk to: " + "\n".join(
            " | ".join(
                str(p.get(field, "")) if not isinstance(p.get(field, ""), list)
                else ", ".join(p.get(field, []))
                for field in people_fields
            )
            for p in plan_people
        )

    full_prompt = f"Context:\n{context}\n\nUser question: {message}"

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