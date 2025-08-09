// src/components/Tabs/NetworkTab.jsx
import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
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
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addMessage('network', { id: crypto.randomUUID(), role: 'user', content: trimmed });

    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      const fullMessage = userProfile?.text
        ? `${trimmed}\n\nUser Profile: ${userProfile.text}`
        : trimmed;

      const data = await chatWithBot(fullMessage, NETWORK_SYSTEM_PROMPT);
      const text = typeof data?.response === 'string' ? data.response : '';

      if (!text) throw new Error('Empty response from server');

      addMessage('network', { id: crypto.randomUUID(), role: 'assistant', content: text });
    } catch (err) {
      console.error('NetworkTab error:', err);
      setError('Sorry, there was an error finding connections. Please try again.');
      addMessage('network', {
        id: crypto.randomUUID(),
        role: 'error',
        content: 'Sorry, there was an error processing your request.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
          networkMessages.map((msg) => (
            <Message key={msg.id ?? Math.random()} role={msg.role} content={msg.content} />
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
          onKeyDown={handleKeyDown}
          placeholder="Ask about networking opportunities..."
          disabled={isLoading}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="send-button"
        >
          {isLoading ? <Spinner animation="border" size="sm" /> : <FaPaperPlane />}
        </Button>
      </div>
    </div>
  );
};

export default NetworkTab;
