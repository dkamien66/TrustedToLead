from fastapi import FastAPI
from pydantic import BaseModel
from google import genai
from google.genai import types
import json

app = FastAPI()

class AnalyzeRequest(BaseModel):
    scenario: str
    decision: str
    explanation: str

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

Respond in JSON, so do not have ```json in the start of your response and ``` in the end of your response.
Your JSON object should have keys: \"well_done\", \"lacking\", \"suggestions\".
"""
    answer = query_gemini(prompt, "Respond ONLY in valid JSON. Do not include any text before or after the JSON.")
    # in case Gemini's response still includes ```json...```
    print(answer)
    if "```json" in answer:
        answer = answer[7:-3]
    print(answer)
    answer.strip()
    try:
        feedback = json.loads(answer)
    except Exception:
        # Fallback: put the raw answer in all fields
        feedback = {
            "well_done": answer,
            "lacking": answer,
            "suggestions": answer
        }
    return feedback