// src/services/api.js
// Using relative path with /api prefix which will be proxied to the backend
const API_BASE_URL = '/api'; // This will be proxied to http://localhost:8000

export const chatWithBot = async (message, systemPrompt = '') => {
  try {
    console.log('Sending request to:', `${API_BASE_URL}/chat`);
    console.log('Request payload:', { message, system_prompt: systemPrompt });
    
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

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error in chatWithBot:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

// Add other API calls as needed
