# Llama2 Chatbot App - Coded using CursorAI

This folder contains a simple Llama2 chatbot app with a FastAPI backend and a Streamlit frontend.

## Setup

**Install dependencies**

```bash
pip install -r requirements.txt
```

## Running the App

1. **Start the Ollama server, to be listening for requests from backend**

```bash
ollama serve
```

2. **Load Ollama and start running Llama2 model for backend use**

```bash
ollama run llama2
```

3. **Start the backend (FastAPI)**

```bash
uvicorn chatgpt_backend:app --reload --port 8000
```

4. **Start the frontend (Streamlit)**
   In a new terminal:

```bash
streamlit run chatgpt_frontend.py
```

This should open a new window

5. **Use the app**

- Open the Streamlit app in your browser (usually at http://localhost:8501)
- Type a message and chat with Llama2!
