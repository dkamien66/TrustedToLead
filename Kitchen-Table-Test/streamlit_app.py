import streamlit as st
import requests
import json

st.title("Kitchen Table Test – Leadership Scenario")

# Example scenario
scenario_bank = [
    "Your team is overworked and you need to implement weekend shifts. Company finances are tight, morale is low, and customers are complaining about delays.",
    "Layoffs",
    "Demanding remote work to change to in person",
    ""
]
default_scenario = scenario_bank[0]
scenario = st.text_area("Scenario", value=default_scenario)

decision = st.text_input("What decision would you make?")
explanation = st.text_area("Explain your decision (as if at the kitchen table)")

if st.button("Submit for AI Feedback"):
    with st.spinner("Analyzing..."):
        resp = requests.post(
            "http://localhost:8000/analyze",
            json={
                "scenario": scenario,
                "decision": decision,
                "explanation": explanation
            }
        )
        try:
            # Try to parse the model's output as JSON
            st.subheader("What you did well")
            st.write(resp.get("well_done", "No feedback."))
            st.subheader("What was lacking")
            st.write(resp.get("lacking", "No feedback."))
            st.subheader("Suggestions for improvement")
            st.write(resp.get("suggestions", "No feedback."))
        except Exception as e:
            st.error(f"Error parsing feedback: {e}")
            st.write(resp.text) 