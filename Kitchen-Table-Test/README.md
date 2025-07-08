John Leffin mentioned a "Kitchen Table Test" as a part of leadership. What could that look like?
Cursor used a lot here!

Some notes for running and my understanding of the tech stack:
I am NOT calling a cloud API
I'm running the Llama2 model locally; my backend FastAPI send a POST request to the local Ollama server I run. Ollama receives the request, runs the LLama 2model, and returns a response to my backend, which passes to my frontend.
