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
business majors, and leadership skills developed). Use the given user profile and 
preferences to provide personalized recommendations. Format fields as **Label:** Value pairs in one paragraph if needed.`;

/* ----------------- helpers (NO new files) ----------------- */

// Known labels to tile; order defines layout priority
const KVT_LABELS = [
  'Opportunity','Title','Type','Date','Dates','Time',
  'Description','Related Business Majors','Related Majors',
  'Related Fields','Leadership Skills','Leadership Skills Developed'
];

// Stronger crumb cleaner + newline normalizer for values
function cleanText(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    // kill triple/double asterisks everywhere
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    // remove single '*' used as separators at edges/whitespace
    .replace(/(^|\s)\*(?=\s|$)/g, ' ')
    // if the model used " * " as inline separators, convert to real line breaks
    .replace(/\s\*\s+/g, '\n')
    // strip leading bullet markers per line
    .replace(/^[*•>\-–—]+\s*/gm, '')
    // collapse excessive spaces + blank lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse assistant text into { intro, fields:[{label,value}] }.
// Works for "**Label:** value" jammed into one paragraph, tolerates stray '*'.
function parseKeyValues(text = '') {
  const input = String(text)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\s+\*/g, '**') // "** * **" → "**"
    .trim();

  // Prefer bold labels: **Label:** value
  const boldRe = /\*\*\s*([A-Za-z][A-Za-z ()/&-]+?)\s*\*\*\s*:\s*/g;
  let matches = [];
  let m;
  while ((m = boldRe.exec(input)) !== null) {
    matches.push({ label: m[1].trim(), start: m.index, after: m.index + m[0].length });
  }

  // Fallback to plain "Label:" if no bold found
  if (matches.length === 0) {
    const plainRe = /(^|[\n\s*•\-–—])([A-Za-z][A-Za-z ()/&-]+?)\s*:\s*/g;
    let p;
    while ((p = plainRe.exec(input)) !== null) {
      matches.push({
        label: p[2].trim(),
        start: p.index + (p[1] ? p[1].length : 0),
        after: p.index + p[0].length
      });
    }
  }

  if (matches.length === 0) return { intro: cleanText(input), fields: [] };

  // keep only known labels (case-insensitive)
  const isKnown = (lab) => KVT_LABELS.some(k => k.toLowerCase() === lab.toLowerCase());
  matches = matches.filter(x => isKnown(x.label));
  if (matches.length === 0) return { intro: cleanText(input), fields: [] };

  const rawIntro = input.slice(0, matches[0].start).trim();
  const intro = cleanText(rawIntro);

  const fields = matches.map((cur, i) => {
    const next = matches[i + 1];
    const raw = input.slice(cur.after, next ? next.start : undefined).trim();
    if (!raw) return null;
    const canonical = KVT_LABELS.find(k => k.toLowerCase() === cur.label.toLowerCase()) || cur.label;

    // Clean value + convert inline separators to lines
    const value = cleanText(raw);
    return { label: canonical, value };
  }).filter(Boolean);

  // sort by our preferred order
  const order = new Map(KVT_LABELS.map((k, i) => [k.toLowerCase(), i]));
  fields.sort((a, b) => (order.get(a.label.toLowerCase()) ?? 999) - (order.get(b.label.toLowerCase()) ?? 999));

  return { intro, fields };
}

// Render assistant message as tiles (Bootstrap only)
function AssistantTiles({ text }) {
  const { intro, fields } = parseKeyValues(text);

  if (fields.length === 0) {
    // Compact fallback: respect single line breaks
    return (
      <Card className="mb-2">
        <Card.Body style={{ lineHeight: 1.45, whiteSpace: 'pre-line' }}>
          {intro || cleanText(text)}
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="mb-2">
      {intro && (
        <Card className="mb-2">
          <Card.Body style={{ lineHeight: 1.45, whiteSpace: 'pre-line' }}>
            {intro}
          </Card.Body>
        </Card>
      )}

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2">
        {fields.map((f, i) => (
          <div className="col" key={`${f.label}-${i}`}>
            <Card className="h-100">
              <Card.Body>
                <div
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '.02em',
                    textTransform: 'uppercase',
                    color: '#6a6a6a',
                    marginBottom: 6
                  }}
                >
                  {f.label}
                </div>
                <div style={{ lineHeight: 1.45, color: '#1f1f1f', whiteSpace: 'pre-line' }}>
                  {f.value}
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
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
      const fullMessage = userProfile?.text
        ? `${trimmed}\n\nUser Profile: ${userProfile.text}`
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
