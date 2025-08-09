// src/components/Tabs/PlanTab.jsx
import React, { useState } from 'react';
import { Button, Spinner, Alert, Card, ListGroup } from 'react-bootstrap';
import { FaPaperPlane, FaCalendarAlt, FaUserFriends } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import "../Chat/Chat.css";

const PLAN_SYSTEM_PROMPT = `You are a career planning assistant that helps users create a personalized 
plan to achieve their career goals. Provide specific, actionable steps including 
opportunities to attend and people to connect with. Consider the user's profile, 
interests, and goals when making recommendations.`;

const PlanTab = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { messages, userProfile, addMessage } = useAppContext();
  const planMessages = messages.plan || [];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addMessage('plan', { id: crypto.randomUUID(), role: 'user', content: trimmed });

    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      const fullMessage = userProfile?.text
        ? `${trimmed}\n\nUser Profile: ${userProfile.text}`
        : trimmed;

      const data = await chatWithBot(fullMessage, PLAN_SYSTEM_PROMPT);
      const text = typeof data?.response === 'string' ? data.response : '';

      if (!text) throw new Error('Empty response from server');

      addMessage('plan', { id: crypto.randomUUID(), role: 'assistant', content: text });
    } catch (err) {
      console.error('PlanTab error:', err);
      setError('Sorry, there was an error creating your plan. Please try again.');
      addMessage('plan', { id: crypto.randomUUID(), role: 'error', content: "Sorry, I couldn't create a plan right now." });
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
        {planMessages.length === 0 ? (
          <div className="welcome-message">
            <h4>Plan Curator</h4>
            <p>Let's create a personalized plan to help you achieve your career goals!</p>
            <p>Example: "Help me create a plan to become a marketing manager"</p>
            <Card className="suggestion-card mt-4">
              <Card.Header>Quick Start</Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item action onClick={() => setInput("Help me create a plan to become a marketing manager")}>
                  <FaCalendarAlt className="me-2" /> Marketing Career Plan
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => setInput("What skills do I need for a career in finance?")}>
                  <FaUserFriends className="me-2" /> Finance Career Skills
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => setInput("Create a semester plan for leadership development")}>
                  <FaCalendarAlt className="me-2" /> Leadership Development
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </div>
        ) : (
          planMessages.map((msg) => (
            <Message key={msg.id ?? Math.random()} role={msg.role} content={msg.content} />
          ))
        )}
        {isLoading && (
          <div className="typing-indicator">
            <Spinner animation="border" size="sm" className="me-2" />
            Creating your plan...
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
          placeholder="What's your career goal?"
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

export default PlanTab;
