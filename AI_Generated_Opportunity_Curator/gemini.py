# Not part of the app - just a simple api call to show how easy it is to ask Gemini from code
from google import genai

client = genai.Client()

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="""
    Please generate for me a random list of 20 events and opportunities on UW-Madison campus or in the Madison area for business
    school students. 
    These events and opportunities should have a short description of the people and activity there. 
    I want an assortment of school lectures, small group discussions, application events, workshops, employer events, socials, networking, student clubs, volunteer activities.
    I want each event to have a connection to at least one business major and at least one leadership skill to be developed at this event.
    These events are not real. Make up this information. Starting August 2025, I want each event to have dates as well.
    """

    )

print(response.text)
