# Llama2 Chatbot App - Coded using CursorAI

This folder contains a simple Llama2 chatbot app with a FastAPI backend and a Streamlit frontend.

## Setup

**Install dependencies**

```bash
pip install -r requirements.txt
```

## Running the App

1. **Start the backend (FastAPI)**

```bash
uvicorn chatgpt_backend:app --reload --port 8000
```

2. **Start the frontend (Streamlit)**

In a new terminal:

```bash
streamlit run chatgpt_frontend.py
```

3. **Use the app**

- Open the Streamlit app in your browser (usually at http://localhost:8501)
- Type a message and chat with Llama2!
