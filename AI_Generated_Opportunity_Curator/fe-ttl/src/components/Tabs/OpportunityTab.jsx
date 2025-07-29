// src/components/Tabs/OpportunityTab.jsx
import React, { useState, useContext } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import "../Chat/Chat.css";

const OPPORTUNITY_SYSTEM_PROMPT = `You are an opportunity curator that gives specific opportunity recommendations 
based on the context of retrieved events, so you must include all of the 
information of the event (the title, type, dates, description, related 
business majors, and leadership skills developed). Use the given user profile and 
preferences to provide personalized recommendations.`;

const OpportunityTab = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { messages, userProfile, addMessage } = useAppContext();
  const opportunityMessages = messages.opportunity || [];

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Add user message to UI immediately
    const userMessage = { role: 'user', content: input };
    addMessage('opportunity', userMessage);
    
    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      // Include user profile in the message for context
      const fullMessage = userProfile.text ? `${input} \n\nUser Profile: ${userProfile.text}` : input;
      
      const response = await chatWithBot(fullMessage, OPPORTUNITY_SYSTEM_PROMPT);
      
      // Add bot response to UI
      addMessage('opportunity', { 
        role: 'assistant', 
        content: response.message || 'Sorry, I couldn\'t process your request.'
      });
    } catch (err) {
      console.error('Error:', err);
      setError('Sorry, there was an error processing your request. Please try again.');
      addMessage('opportunity', { 
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
        {opportunityMessages.length === 0 ? (
          <div className="welcome-message">
            <h4>Opportunity Curator</h4>
            <p>Ask me about opportunities that match your interests and goals!</p>
            <p>Example: "What leadership opportunities are available this semester?"</p>
          </div>
        ) : (
          opportunityMessages.map((msg, index) => (
            <Message key={index} role={msg.role} content={msg.content} />
          ))
        )}
        {isLoading && (
          <div className="typing-indicator">
            <Spinner animation="border" size="sm" className="me-2" />
            Finding relevant opportunities...
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
          placeholder="Ask about opportunities..."
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

export default OpportunityTab;
