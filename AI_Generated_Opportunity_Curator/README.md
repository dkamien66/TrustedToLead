# Gemini Chatbot App - Coded using CursorAI

This folder contains a simple Gemini chatbot app with a FastAPI backend and a Streamlit frontend.

## Setup

**Install dependencies**

```bash
pip install -r requirements.txt
```

## Running the App

1. **Set an environmental variable for the Gemini API key**

```bash
export GEMINI_API_KEY="your_actual_key"
```

2. **Start the backend (FastAPI)**

```bash
uvicorn gemini_backend:app --reload --port 8000
```

3. **Start the frontend (Streamlit)**
   In a new terminal:

```bash
streamlit run streamlit_frontend.py
```

This should open a new window

5. **Use the app**

- Open the Streamlit app in your browser (usually at http://localhost:8501)
- Type a message and chat with Llama2!
