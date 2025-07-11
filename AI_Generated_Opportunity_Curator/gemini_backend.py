import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types

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

client = genai.Client()

def query_gemini(message, system_prompt=""):
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt
        ),
    )
    return response.text if hasattr(response, "text") else str(response)

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    try:
        answer = query_gemini(request.message, request.system_prompt)
        return {"response": answer}
    except Exception as e:
        return {"error": str(e)}