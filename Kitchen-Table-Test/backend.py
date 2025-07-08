import os
import requests
from fastapi import FastAPI
from pydantic import BaseModel
import json

app = FastAPI()

class AnalyzeRequest(BaseModel):
    scenario: str
    decision: str
    explanation: str

def query_ollama(message, model="llama2"):
    response = requests.post(
        "http://localhost:11434/api/chat",
        json={
            "model": model,
            "messages": [{"role": "user", "content": message}]
        },
        timeout=120
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

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    prompt = f"""
Given the following leadership scenario and user response, analyze the explanation for:
- Ethical considerations (fairness, empathy, integrity)
- Alignment with company/team values
- Support for employee well-being
- Reasoning style (clarity, honesty, humanity)
- Would a loved one feel this was handled thoughtfully?

Then, provide:
- What they did well
- What was lacking
- Suggestions for improvement

Scenario: {req.scenario}
Decision: {req.decision}
Explanation: {req.explanation}

Respond in JSON with keys: \"well_done\", \"lacking\", \"suggestions\".
"""
    answer = query_ollama(prompt)
    return {"response": answer} 