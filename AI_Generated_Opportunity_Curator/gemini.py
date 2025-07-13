# Not part of the app - just a simple api call to show how easy it is to ask Gemini from code
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="From Handshake, can you give me a list of 4 opportunities for a computer science student at UW-Madison?"
)

print(response.text)
