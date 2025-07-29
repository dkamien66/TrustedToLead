// src/services/api.js
const API_BASE_URL = 'http://localhost:8000'; // FastAPI backend URL

export const chatWithBot = async (message, systemPrompt = '') => {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        system_prompt: systemPrompt,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Add other API calls as needed
