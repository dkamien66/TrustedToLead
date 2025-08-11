# Trusted to Lead

## A Gemini RAG Chatbot App for Students - coded with the help of AI tools

- Last updated 8/10/25

This folder contains a Gemini chatbot app with a FastAPI Python backend and a React frontend.
React Frontend ←→ HTTP/JSON API ←→ Python Backend

## Setup

**Install dependencies**

(8/10/25) Update the requirements.txt (there's a lot more now)

```bash
pip install -r requirements.txt
```

## Running the App

1. **Write your Gemini API key in the .env file**

2. **Start the backend (FastAPI)**
   From the current directory:

```bash
python gemini_backend.py
```

3. **Start the frontend (React) in the **
   In a new terminal, in the fe-ttl directory:

```bash
npm run dev
```

A link to a locahost site should appear in the terminal.

So... here are some notes to help me understand the tech stack of RAG.

1. 'Embed" the events, converting them into vectors, using a sentence embedding model (sentence-transformers). Store in memory or a vector database
2. Add a retrieval endpoint in backend to load and embed the data at start of app, embed the user's query and retrieve the most relevant events using vector similarity. Pass retrieved events as context and user's question to Gemini for text generation of response!
3. Model processes event texts in tokens and outputs a list of numbers that represent the meaning. Similar events have similar numbers in list output.
4. Using a vector index through faiss, using RAM memory for storage
