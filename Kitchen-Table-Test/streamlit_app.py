import streamlit as st
import requests

st.title("Kitchen Table Test – Leadership Scenario")

# Example scenario
default_scenario = "Your team is overworked and you need to implement weekend shifts. Company finances are tight, morale is low, and customers are complaining about delays."
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
            feedback = resp.json()
            st.subheader("What you did well")
            st.write(feedback.get("well_done", "No feedback."))
            st.subheader("What was lacking")
            st.write(feedback.get("lacking", "No feedback."))
            st.subheader("Suggestions for improvement")
            st.write(feedback.get("suggestions", "No feedback."))
        except Exception as e:
            st.error(f"Error parsing feedback: {e}")
            st.write(resp.text) 