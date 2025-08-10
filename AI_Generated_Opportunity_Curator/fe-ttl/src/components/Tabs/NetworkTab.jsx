// src/components/Tabs/NetworkTab.jsx
import React, { useState } from 'react';
import { Card, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import '../Chat/Chat.css';

const NETWORK_SYSTEM_PROMPT = `You are a network curator that helps users find and connect with professionals 
who can help them with their career goals. Provide specific recommendations for 
people to connect with, including their name, role, related fields, and how they 
can help the user based on their profile and interests. Format fields as **Label:** Value pairs.`;

/* ----------------- shared styling + helpers (no new files) ----------------- */

// Accent + reusable inline styles (keeps CSS in this file)
const ACCENT = '#d92929'; // UW-ish red vibe; tweak if you like
const styles = {
  cardShell: {
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16,
    boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  cardBody: {
    padding: '14px 16px',
    lineHeight: 1.55,
    color: '#1f1f1f',
  },
  accentBar: {
    height: 4,
    background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}66)`,
  },
  label: {
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    color: '#6a6a6a',
    marginBottom: 6,
  },
  value: {
    lineHeight: 1.55,
    color: '#101010',
    whiteSpace: 'pre-line',
  },
  grid: {
    rowGap: '10px',
    columnGap: '10px',
  },
  intro: {
    fontSize: '0.95rem',
    background: '#fafafa',
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: 12,
    padding: 12,
    lineHeight: 1.55,
  },
};

// Labels we want to tile (order = priority)
const KVT_LABELS = [
  'Name','Person','Contact','Role','Title','Department',
  'Related Fields','Expertise','Focus Areas',
  'Why Connect','How They Can Help','Best For','Recommended If',
  'Contact Tip','Suggested Message','Topics to Discuss','Notes'
];

// cleaner (same as Opportunity tab behavior) + inline “ * ” → newline
function cleanText(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*(?=\s|$)/g, ' ')
    .replace(/\s\*\s+/g, '\n')      // inline " * " → newline
    .replace(/^[*•>\-–—]+\s*/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse "**Label:** value" (or "Label: value") blobs → {intro, fields[]}
function parseKeyValues(text = '') {
  const input = String(text)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\s+\*/g, '**')
    .trim();

  const boldRe = /\*\*\s*([A-Za-z][A-Za-z ()/&-]+?)\s*\*\*\s*:\s*/g;
  let matches = [];
  let m;
  while ((m = boldRe.exec(input)) !== null) {
    matches.push({ label: m[1].trim(), start: m.index, after: m.index + m[0].length });
  }
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

  const isKnown = (lab) => KVT_LABELS.some(k => k.toLowerCase() === lab.toLowerCase());
  matches = matches.filter(x => isKnown(x.label));
  if (matches.length === 0) return { intro: cleanText(input), fields: [] };

  const intro = cleanText(input.slice(0, matches[0].start));

  const fields = matches.map((cur, i) => {
    const next = matches[i + 1];
    const raw = input.slice(cur.after, next ? next.start : undefined).trim();
    if (!raw) return null;
    const canonical = KVT_LABELS.find(k => k.toLowerCase() === cur.label.toLowerCase()) || cur.label;
    return { label: canonical, value: cleanText(raw) };
  }).filter(Boolean);

  const order = new Map(KVT_LABELS.map((k, i) => [k.toLowerCase(), i]));
  fields.sort((a, b) => (order.get(a.label.toLowerCase()) ?? 999) - (order.get(b.label.toLowerCase()) ?? 999));

  return { intro, fields };
}

// If we couldn't parse label/value pairs, split the prose into nice sections
function ProseCards({ text }) {
  const chunks = cleanText(text).split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="mb-2">
      {chunks.map((para, i) => (
        <Card key={i} style={{ ...styles.cardShell, marginBottom: 8 }}>
          <div style={styles.accentBar} />
          <Card.Body style={styles.cardBody}>{para}</Card.Body>
        </Card>
      ))}
    </div>
  );
}

// Tile renderer (same look/feel as Opportunity tab, just nicer shell)
function AssistantTiles({ text }) {
  const { intro, fields } = parseKeyValues(text);

  if (fields.length === 0) {
    // no labels detected → show well-styled prose cards
    return <ProseCards text={intro || text} />;
  }

  return (
    <div className="mb-2">
      {intro && (
        <Card className="mb-2" style={styles.cardShell}>
          <div style={styles.accentBar} />
          <Card.Body style={{ ...styles.cardBody, background: '#fafafa' }}>
            {intro}
          </Card.Body>
        </Card>
      )}

      <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3" style={styles.grid}>
        {fields.map((f, i) => (
          <div className="col" key={`${f.label}-${i}`}>
            <Card className="h-100" style={styles.cardShell}>
              <div style={styles.accentBar} />
              <Card.Body style={styles.cardBody}>
                <div style={styles.label}>{f.label}</div>
                <div style={styles.value}>{f.value}</div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
/* ----------------- end helpers ----------------- */

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
      addMessage('network', { id: crypto.randomUUID(), role: 'error', content: 'Sorry, there was an error processing your request.' });
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
          networkMessages.map((msg) =>
            msg.role === 'assistant'
              ? <AssistantTiles key={msg.id ?? Math.random()} text={msg.content} />
              : <Message key={msg.id ?? Math.random()} role={msg.role} content={msg.content} />
          )
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
