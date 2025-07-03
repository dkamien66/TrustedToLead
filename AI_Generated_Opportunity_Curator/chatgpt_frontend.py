import streamlit as st
import requests

st.title("ChatGPT Chatbot (OpenAI)")

if "messages" not in st.session_state:
    st.session_state["messages"] = []

user_input = st.text_input("You:", "", key="input")

if st.button("Send") and user_input:
    st.session_state["messages"].append(("user", user_input))
    try:
        response = requests.post(
            "http://localhost:8000/chat",
            json={"message": user_input},
            timeout=30
        )
        data = response.json()
        bot_reply = data.get("response") or data.get("error", "No response")
    except Exception as e:
        bot_reply = f"Error: {e}"
    st.session_state["messages"].append(("bot", bot_reply))

# Display chat history
for role, msg in st.session_state["messages"]:
    if role == "user":
        st.markdown(f"**You:** {msg}")
    else:
        st.markdown(f"**ChatGPT:** {msg}") 