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

So... here are some notes to help me understand the tech stack of RAG.

1. 'Embed" the events, converting them into vectors, using a sentence embedding model (sentence-transformers). Store in memory or a vector database
2. Add a retrieval endpoint in backend to load and embed the data at start of app, embed the user's query and retrieve the most relevant events using vector similarity. Pass retrieved events as context and user's question to Gemini for text generation of response!
3. Model processes event texts in tokens and outputs a list of numbers that represent the meaning. Similar events have similar numbers in list output.
4. Using a vector index through faiss, using RAM memory for storage
