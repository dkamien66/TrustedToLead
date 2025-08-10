// src/components/Tabs/NetworkTab.jsx
import React, { useState } from 'react';
import { Card, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaPaperPlane } from 'react-icons/fa';
import { chatWithBot } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import Message from '../Chat/Message';
import '../Chat/Chat.css';

const NETWORK_SYSTEM_PROMPT = `You are a network curator that helps users find and connect with professionals 
who can help them with their career goals. Provide specific recommendations for 
people to connect with, including their name, role, related fields, and how they 
can help the user based on their profile and interests. Format fields as **Label:** Value pairs.`;

/* ----------------- helpers (no new files) ----------------- */

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
  label: {
    fontSize: '0.78rem',
    fontWeight: 800,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    color: '#6a6a6a',
    marginBottom: 6
  },
  value: {
    lineHeight: 1.55,
    color: '#101010',
    whiteSpace: 'pre-line'
  }
};

const KVT_LABELS = [
  'Name','Person','Contact','Role','Title','Department',
  'Related Fields','Expertise','Focus Areas',
  'Why Connect','How They Can Help','Best For','Recommended If',
  'Contact Tip','Suggested Message','Topics to Discuss','Notes'
];

function cleanText(s = '') {
  return String(s)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/(^|\s)\*(?=\s|$)/g, ' ')
    .replace(/\s\*\s+/g, '\n')
    .replace(/^[*•>\-–—]+\s*/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

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

  return { intro, fields };
}

/**
 * Smart grouping:
 *  - If we see consecutive Names first, create N people, then
 *    assign subsequent fields in contiguous groups of length N (round-robin).
 *  - Otherwise fall back to the simple “new person at each Name” approach.
 */
// Replace your current groupIntoPeople with this one
function groupIntoPeople(fields) {
  if (!fields.length) return [];

  const isName = (l) => ['name','person','contact'].includes(l.toLowerCase());

  // 1) Pull out all names in order → create people
  const names = fields.filter(f => isName(f.label));
  const people = names.length
    ? names.map(n => ({ name: n.value, fields: [] }))
    : [{ name: '', fields: [] }];

  const n = people.length;

  // 2) For everything that's NOT a name, assign by label-specific round-robin.
  //    This handles the “columns” layout: Name A,B,C then Role x3 then Fields x3...
  const perLabelCounts = Object.create(null);
  for (const f of fields) {
    if (isName(f.label)) continue;

    const key = f.label.toLowerCase();
    const i = perLabelCounts[key] ?? 0;     // how many of this label we've placed
    const who = i % n;                      // which person gets this occurrence
    people[who].fields.push(f);
    perLabelCounts[key] = i + 1;
  }

  return people;
}


function ProseCards({ text }) {
  const chunks = cleanText(text).split(/\n\s*\n/).filter(Boolean);
  return (
    <div className="mb-2">
      {chunks.map((para, i) => (
        <Card key={i} style={{ ...styles.shell, marginBottom: 8 }}>
          <div style={styles.accent} />
          <Card.Body style={styles.body}>{para}</Card.Body>
        </Card>
      ))}
    </div>
  );
}

function AssistantPeopleTabs({ text }) {
  const { intro, fields } = parseKeyValues(text);
  if (!fields.length) return <ProseCards text={intro || text} />;

  const people = groupIntoPeople(fields);

  return (
    <div className="mb-2">
      {intro && (
        <Card className="mb-2" style={styles.shell}>
          <div style={styles.accent} />
          <Card.Body style={{ ...styles.body, background: '#fafafa' }}>{intro}</Card.Body>
        </Card>
      )}

      <Card style={styles.shell}>
        <div style={styles.accent} />
        <Card.Body style={styles.body}>
          <Tabs defaultActiveKey="0" id="network-people-tabs" justify>
            {people.map((p, idx) => (
              <Tab eventKey={String(idx)} title={p.name || `Person ${idx + 1}`} key={idx}>
                <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-2" style={{ marginTop: 10 }}>
                  {p.fields.map((f, i2) => (
                    <div className="col" key={`${p.name || idx}-${f.label}-${i2}`}>
                      <Card className="h-100" style={{ borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)' }}>
                        <Card.Body>
                          <div style={styles.label}>{f.label}</div>
                          <div style={styles.value}>{f.value}</div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Tab>
            ))}
          </Tabs>
        </Card.Body>
      </Card>
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
              ? <AssistantPeopleTabs key={msg.id ?? Math.random()} text={msg.content} />
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
