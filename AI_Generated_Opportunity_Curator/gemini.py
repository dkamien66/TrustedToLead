# Not part of the app - just a simple api call to show how easy it is to ask Gemini from code
from google import genai

client = genai.Client()

people_prompt="""
        Hi Gemini. Please randomly generate for me a sample json file of 50 people who are faculty, leadership 
        coaches, teachers, advisors, career coaches, pathway consultants, or leaders in a business school of a university. 
        I want these people 
        to have a name, a role, and a related-fields key with its value as business fields they are involved 
        in. I also want a leadership counseling key with its value as leadership skills they can help 
        develop in students. I also want an email key with a fake email as its value. Please make these people diverse and
        vary.
    """

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents=people_prompt

    )

print(response.text)


event_prompt="""
Please generate for me a random list of 20 events and opportunities on UW-Madison campus or in the Madison area for business
    school students. 
    These events and opportunities should have a short description of the people and activity there. 
    I want an assortment of school lectures, small group discussions, application events, workshops, employer events, socials, networking, student clubs, volunteer activities.
    I want each event to have a connection to at least one business major and at least one leadership skill to be developed at this event.
    These events are not real. Make up this information. Starting August 2025, I want each event to have dates as well.
"""


resources_prompt="""
        Please generate for me a sample json file of 2 links to fake online resources that could be part 
        of the UW-Madison Business School for students who want to learn more about the skills in their
        career field and leadership skills. I want each json object to have a link key with its value as 
        its field. I want a description key and its value as a short, simplified made up description.
    """