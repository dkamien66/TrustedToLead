// src/components/Tabs/NetworkTab.jsx
import React, { useState, useContext } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { FaPaperPlane, FaUserTie } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import '../Chat/Chat.css';

const NETWORK_SYSTEM_PROMPT = `You are a network curator that helps users find and connect with professionals 
who can help them with their career goals. Provide specific recommendations for 
people to connect with, including their name, role, related fields, and how they 
can help the user based on their profile and interests.`;

const NetworkTab = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { messages, userProfile, addMessage } = useAppContext();
  const networkMessages = messages.network || [];

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message to UI immediately
    const userMessage = { role: 'user', content: input };
    addMessage('network', userMessage);
    
    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      // Include user profile in the message for context
      const fullMessage = userProfile.text ? `${input} \n\nUser Profile: ${userProfile.text}` : input;
      
      const response = await chatWithBot(fullMessage, NETWORK_SYSTEM_PROMPT);
      
      // Add bot response to UI
      addMessage('network', { 
        role: 'assistant', 
        content: response.message || 'Sorry, I couldn\'t find any relevant connections.'
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Sorry, there was an error finding connections. Please try again.');
      addMessage('network', { 
        role: 'error', 
        content: 'Sorry, there was an error processing your request.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {networkMessages.length === 0 ? (
          <div className="welcome-message">
            <h4>Network Curator</h4>
            <p>Let me help you find professionals to connect with based on your interests and goals!</p>
            <p>Example: "Who can I talk to about careers in marketing?"</p>
          </div>
        ) : (
          networkMessages.map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))
        )}
        {isLoading && (
          <div className="typing-indicator">
            <Spinner animation="border" size="sm" className="me-2" />
            Finding relevant connections...
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
      </div>
      
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about networking opportunities..."
          disabled={isLoading}
        />
        <Button 
          variant="primary" 
          onClick={handleSend} 
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          {isLoading ? (
            <Spinner animation="border" size="sm" />
          ) : (
            <FaPaperPlane />
          )}
        </Button>
      </div>
    </div>
  );
};

export default NetworkTab;
