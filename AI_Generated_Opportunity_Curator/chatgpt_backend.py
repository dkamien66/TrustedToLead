import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import json

app = FastAPI()

# Allow CORS for Streamlit frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

def query_ollama(message, model="llama2"):
    response = requests.post(
        "http://localhost:11434/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": message}]
        },
        timeout=120  # wait up to 2 minutes
    )
    lines = [line for line in response.text.split('\n') if line.strip()]
    words = []
    for line in lines:
        try:
            obj = json.loads(line)
            content = obj.get("message", {}).get("content")
            if content:
                words.append(content)
        except Exception as e:
            print("Error parsing line:", line, e)
    full_response = ''.join(words)
    return full_response if full_response else "No response from model."

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        answer = query_ollama(request.message)
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)} 