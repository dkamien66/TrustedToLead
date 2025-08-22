// src/components/Tabs/OpportunityTab.jsx
import React, { useState } from 'react';
import { Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import '../Chat/Chat.css';

const OPPORTUNITY_SYSTEM_PROMPT = `You are an opportunity curator that gives specific opportunity recommendations 
based on the context of retrieved events, so you must include all of the 
information of the event (the title, type, dates, description, related 
business majors, leadership skills developed, and register & more details). Use the given user profile and 
preferences to provide personalized recommendations.
Include an explanation field like the other fields that explains why this opportunity fits the user.`;

/* ----------------- helpers (NO new files) ----------------- */

// Function to clean JSON text by removing markdown code blocks
function cleanJsonText(text = '') {
  let cleanedText = String(text).trim();
  
  // Remove ```json at the beginning
  if (cleanedText.startsWith('```json')) {
    cleanedText = cleanedText.substring(7);
  } else if (cleanedText.startsWith('```')) {
    cleanedText = cleanedText.substring(3);
  }
  
  // Remove ``` at the end
  if (cleanedText.endsWith('```')) {
    cleanedText = cleanedText.substring(0, cleanedText.length - 3);
  }
  
  return cleanedText.trim();
}

// Parse JSON text into structured data
function parseJsonOpportunities(text = '') {
  try {
    const cleanedText = cleanJsonText(text);
    const data = JSON.parse(cleanedText);
    
    const result = {
      intro: data.Intro || '',
      opportunities: []
    };
    
    // Find all opportunity keys (Opportunity 1, Opportunity 2, etc.)
    const opportunityKeys = Object.keys(data).filter(key => 
      key.toLowerCase().startsWith('opportunity')
    );
    
    opportunityKeys.forEach(key => {
      const opportunity = data[key];
      if (typeof opportunity === 'object' && opportunity !== null) {
        const fields = Object.entries(opportunity).map(([fieldKey, fieldValue]) => ({
          label: fieldKey,
          value: String(fieldValue)
        }));
        
        result.opportunities.push({
          id: key,
          fields: fields
        });
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error parsing JSON opportunities:', error);
    // Fallback to empty result
    return {
      intro: '',
      opportunities: []
    };
  }
}

// Render assistant message as JSON-based opportunity tiles
function AssistantTiles({ text }) {
  const { intro, opportunities } = parseJsonOpportunities(text);

  return (
    <div className="mb-2">
      {/* Intro Container */}
      {intro && (
        <Card className="mb-3" style={{
          border: '2px solid #d92929',
          borderRadius: '12px',
          backgroundColor: '#fff5f5'
        }}>
          <Card.Body style={{ 
            lineHeight: 1.6, 
            whiteSpace: 'pre-line',
            fontSize: '1.1rem',
            color: '#2c3e50'
          }}>
            {intro}
          </Card.Body>
        </Card>
      )}

      {/* Opportunity Containers */}
      {opportunities.map((opportunity) => (
        <div key={opportunity.id} className="opportunity-container mb-4" style={{
          border: '2px solid #e0e0e0',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
          backgroundColor: '#ffffff'
        }}>
          {/* Opportunity Header */}
          <div style={{
            fontSize: '1.3rem',
            fontWeight: 700,
            color: '#2c3e50',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '3px solid #d92929',
            textAlign: 'center'
          }}>
            {opportunity.id}
          </div>
          
          {/* 8 Tiles Grid */}
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-3">
            {opportunity.fields.map((field, fieldIndex) => (
              <div className="col" key={`${field.label}-${fieldIndex}`}>
                <Card className="h-100" style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  transition: 'transform 0.2s ease-in-out',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }}>
                  <Card.Body style={{ padding: '16px' }}>
                    <div
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        letterSpacing: '.03em',
                        textTransform: 'uppercase',
                        color: '#d92929',
                        marginBottom: '8px',
                        borderBottom: '1px solid #e9ecef',
                        paddingBottom: '6px'
                      }}
                    >
                      {field.label}
                    </div>
                    <div style={{ 
                      lineHeight: 1.5, 
                      color: '#495057', 
                      whiteSpace: 'pre-line',
                      fontSize: '0.9rem',
                      minHeight: '40px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {field.value}
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Fallback for non-JSON text */}
      {opportunities.length === 0 && (
        <Card className="mb-2">
          <Card.Body style={{ lineHeight: 1.45, whiteSpace: 'pre-line' }}>
            {text}
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

/* ----------------- end helpers ----------------- */

const OpportunityTab = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { messages, userProfile, addMessage } = useAppContext();
  const opportunityMessages = messages.opportunity || [];

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    addMessage('opportunity', { id: crypto.randomUUID(), role: 'user', content: trimmed });

    setIsLoading(true);
    setInput('');
    setError(null);

    try {
      const profileText = `The student's major is ${userProfile.major}. The student is interested in developing the following leadership skills: ${userProfile.leadershipSkills}. The student has the following big picture goals: ${userProfile.bigPictureGoals}. The student has already had the following experiences: ${userProfile.experiences}. The student's resume contains the following information: ${userProfile.resumeContent}`;
      const fullMessage = profileText
        ? `${trimmed}\n\nUser Profile: ${profileText}`
        : trimmed;

      const data = await chatWithBot(fullMessage, OPPORTUNITY_SYSTEM_PROMPT);
      const text = typeof data?.response === 'string' ? data.response : '';
      if (!text) throw new Error('Empty response from server');

      addMessage('opportunity', { id: crypto.randomUUID(), role: 'assistant', content: text });
    } catch (err) {
      console.error('OpportunityTab error:', err);
      setError('Sorry, there was an error processing your request.');
      addMessage('opportunity', {
        id: crypto.randomUUID(),
        role: 'error',
        content: 'Sorry, there was an error processing your request. Please try again.'
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
        {opportunityMessages.length === 0 ? (
          <div className="welcome-message">
            <h4>Opportunity Curator</h4>
            <p>Ask me about opportunities that match your interests and goals!</p>
            <p>Example: "What leadership opportunities are available this semester?"</p>
          </div>
        ) : (
          opportunityMessages.map((msg) =>
            msg.role === 'assistant'
              ? <AssistantTiles key={msg.id ?? Math.random()} text={msg.content} />
              : <Message key={msg.id ?? Math.random()} role={msg.role} content={msg.content} />
          )
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
          onKeyDown={handleKeyDown}
          placeholder="Ask about opportunities..."
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

export default OpportunityTab;
