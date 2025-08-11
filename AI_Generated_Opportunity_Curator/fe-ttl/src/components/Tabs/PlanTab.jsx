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
interests, and goals when making recommendations. Format with numbered steps where each step has a short title and description.`;

/* ----------------- helpers (no new files) ----------------- */

// Accent + inline styles (same vibe as other tabs)
const ACCENT = '#d92929';
const styles = {
  shell: {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: 10
  },
  body: {
    padding: '14px 16px',
    color: '#101010',
    lineHeight: 1.55
  },
  accent: {
    height: 4,
    background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}66)`
  },
  stepHeader: {
    fontWeight: 800,
    fontSize: '0.98rem',
    marginBottom: 6
  },
  stepNum: {
    display: 'inline-block',
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    textAlign: 'center',
    lineHeight: '26px',
    fontWeight: 800,
    fontSize: '0.8rem',
    color: '#fff',
    background: ACCENT,
    marginRight: 8
  },
  meta: {
    fontSize: '0.9rem',
    color: '#2a2a2a',
    background: '#fafafa',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    whiteSpace: 'pre-line'
  },
  subtitle: {
    fontWeight: 700,
    letterSpacing: '.02em',
    textTransform: 'uppercase',
    color: '#6a6a6a',
    fontSize: '0.78rem',
    marginBottom: 6
  }
};

// crumb cleaner + light normalization
function clean(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\s\*\s+/g, '\n')      // inline " * " → newline
    .replace(/^[*•>\-–—]+\s*/gm, '')// strip bullets
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse a plan blob into { title, intro, phases[], steps[] }
// We’re generous: it works with “## headers”, “**Goal:**”, and plain “1. Step …”
function parsePlan(text = '') {
  const input = clean(text);

  // Optional title (e.g., "## Career Plan: …")
  const titleMatch = input.match(/^#{1,3}\s*(.+)$/m);
  const title = titleMatch ? clean(titleMatch[1]) : '';

  // Find where steps likely start
  const stepsStart =
    input.search(/(^|\n)\s*Actionable Steps/i) !== -1
      ? input.search(/(^|\n)\s*Actionable Steps/i)
      : input.search(/(^|\n)\s*\d+\.\s+/m);

  let intro = '';
  let stepsBlock = input;

  if (stepsStart > 0) {
    intro = clean(input.slice(0, stepsStart));
    stepsBlock = input.slice(stepsStart);
  }

  // If an "Actionable Steps" header exists, chop after it
  const afterHeader = stepsBlock.replace(/(^|\n)\s*Actionable Steps\s*[:\-]?\s*/i, '\n');

  // Split numbered steps: 1. ..., 2. ...
  const rawSteps = afterHeader
    .split(/\n(?=\s*\d+\.\s)/)
    .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
    .filter(Boolean);

  const steps = rawSteps.map(block => {
    // Title: prefer leading bold up to colon (**Title:** ...)
    let stepTitle = '';
    let desc = block;

    const boldTitle = block.match(/^\s*\*{0,2}([^*:]+?)\*{0,2}\s*:\s*/);
    if (boldTitle) {
      stepTitle = clean(boldTitle[1]);
      desc = block.slice(boldTitle[0].length);
    } else {
      // fallback: take sentence up to first period as title
      const firstSentence = block.match(/^(.+?)([.!?])(\s|$)/);
      if (firstSentence) {
        stepTitle = clean(firstSentence[1]);
        desc = block.slice(firstSentence[0].length);
      }
    }

    // Clean description; keep natural line breaks
    desc = clean(desc);

    // Squeeze out leftover emphasis markers
    stepTitle = stepTitle.replace(/\*/g, '').trim();

    return { title: stepTitle || 'Step', desc };
  });

  return {
    title,
    intro,
    steps
  };
}

// Pretty vertical renderer
function PlanRenderer({ text }) {
  const { title, intro, steps } = parsePlan(text);

  // Title card (optional)
  const showTitle = Boolean(title);
  // If no steps detected, just show one readable card
  if (!steps.length) {
    return (
      <Card style={styles.shell}>
        <div style={styles.accent} />
        <Card.Body style={styles.body}>
          {showTitle && <div style={{ ...styles.stepHeader, marginBottom: 10 }}>{title}</div>}
          <div style={{ whiteSpace: 'pre-line' }}>{intro || clean(text)}</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="mb-2">
      {/* Title / intro */}
      {showTitle && (
        <Card style={styles.shell}>
          <div style={styles.accent} />
          <Card.Body style={styles.body}>
            <div style={styles.stepHeader}>{title}</div>
            {intro && <div style={styles.meta}>{intro}</div>}
            <div style={styles.subtitle}>Plan Steps</div>
          </Card.Body>
        </Card>
      )}
      {!showTitle && intro && (
        <Card style={styles.shell}>
          <div style={styles.accent} />
          <Card.Body style={styles.body}>
            <div style={styles.subtitle}>Overview</div>
            <div style={{ whiteSpace: 'pre-line' }}>{intro}</div>
          </Card.Body>
        </Card>
      )}

      {/* Steps (vertical, separated) */}
      {steps.map((s, i) => (
        <Card key={i} style={styles.shell}>
          <div style={styles.accent} />
          <Card.Body style={styles.body}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNum}>{i + 1}</span>
              <span>{s.title || `Step ${i + 1}`}</span>
            </div>
            {s.desc && <div style={{ whiteSpace: 'pre-line' }}>{s.desc}</div>}
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
/* ----------------- end helpers ----------------- */

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
                <ListGroup.Item action onClick={() => setInput("I want to prepare for an internship. Here is its description:")}>
                  <FaCalendarAlt className="me-2" /> Internship Preparation 
                </ListGroup.Item>
              </ListGroup>
            </Card>
          </div>
        ) : (
          planMessages.map((msg) =>
            msg.role === 'assistant'
              ? <PlanRenderer key={msg.id ?? Math.random()} text={msg.content} />
              : <Message key={msg.id ?? Math.random()} role={msg.role} content={msg.content} />
          )
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
