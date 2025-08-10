// src/components/Chat/OpportunityResponse.jsx
import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { FaCalendarAlt, FaUserFriends, FaInfoCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './OpportunityResponse.css';
import HardBreakCleanMessage from '../Chat/HardBreakCleanMessage';

function md(text = '') {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} breaks={true}>
      {text}
    </ReactMarkdown>
  );
}

/** Normalize and lightly clean model output */
function normalize(text = '') {
  return String(text)
    .replace(/\r/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\*\s+\*/g, '**')     // "** * **" -> "**"
    .replace(/^\*(?=\w)/gm, '* ')  // "*Heading" -> "* Heading" (valid bullet)
    .trim();
}

/** Read a "Key: value" line (bullet prefixes tolerated, case-insensitive) */
function take(src, key) {
  const re = new RegExp(
    String.raw`^[\s>*•\-–—]*\*?${key}\*?\s*:\s*(.+)$`,
    'im'
  );
  const m = src.match(re);
  return m ? m[1].trim() : '';
}

/** Title + (Type) often live on the first line */
function parseTitleType(block) {
  const firstLineRaw = (block.split('\n')[0] || '').trim();
  // Remove leading bullets/arrows, keep inner content
  const firstLine = firstLineRaw.replace(/^[\s>*•\-–—]+/, '').trim();

  // Prefer **Title** (Type)
  const bold = firstLine.match(/\*\*(.+?)\*\*/);
  const parenAtEnd = firstLine.match(/\(([^)]+)\)\s*$/);

  if (bold) {
    return {
      title: bold[1].trim(),
      type: parenAtEnd ? parenAtEnd[1].trim() : ''
    };
  }

  // Fallback: take the text up to any trailing "(Type)"
  const title = firstLine.replace(/\(([^)]+)\)\s*$/, '').replace(/^[\-\u2013]\s*/, '').trim();
  return {
    title,
    type: parenAtEnd ? parenAtEnd[1].trim() : ''
  };
}

/** Parse the whole assistant reply into summary + items */
function parseOpportunityText(text) {
  const cleaned = normalize(text);

  // Summary between "Summary" and Recommendations/first numbered item
  let summary = '';
  const summaryMatch = cleaned.match(
    /\*{0,2}Summary\*{0,2}[:\-]?\s*(.+?)(?=\n\s*(?:\*{0,2}Top Recommendations\*{0,2}|Recommendations|1\.)|\n{2,}|$)/is
  );
  if (summaryMatch) summary = summaryMatch[1].trim();

  // Find recommendations block
  let recBlock = '';
  const recStart = cleaned.search(/(\*{0,2}Top Recommendations\*{0,2}|Recommendations)/i);
  if (recStart !== -1) {
    recBlock = cleaned.slice(recStart);
  } else {
    const firstNum = cleaned.search(/^\s*1\.\s/m);
    if (firstNum !== -1) recBlock = cleaned.slice(firstNum);
  }

  // Split items: numbered list "1.", "2.", ...
  let rawItems = [];
  if (recBlock) {
    rawItems = recBlock
      .split(/\n(?=\s*\d+\.\s)/)
      .map(s => s.replace(/^\s*\d+\.\s*/, '').trim())
      .filter(Boolean);
  }

  const items = rawItems.map(block => {
    const { title, type } = parseTitleType(block);

    const dates = take(block, 'Dates');
    const time = take(block, 'Time');

    const description =
      take(block, 'Description') ||
      take(block, 'Desc') ||
      block.split('\n').slice(1).join('\n').trim();

    const majors =
      take(block, 'Related Business Majors') ||
      take(block, 'Related Majors') ||
      take(block, 'Related Fields');

    const skills =
      take(block, 'Leadership Skills') ||
      take(block, 'Leadership Skills Developed') ||
      take(block, 'Skills');

    return { title, type, dates, time, description, majors, skills, raw: block };
  });

  return { summary, items, raw: cleaned };
}

const FieldRow = ({ icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="opp-field">
      {icon}
      <span className="opp-label">{label}:</span>
      <span className="opp-value">{value}</span>
    </div>
  );
};

export default function OpportunityResponse({ text }) {
  const { summary, items, raw } = parseOpportunityText(text);
  const showFallback = (!summary && (!items || items.length === 0));

  if (showFallback) {
    return (
      <Card className="opp-card opp-raw">
        <Card.Body>
          <div className="opp-pre">{md(raw || text)}</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="opp-response">
      {summary ? (
        <Card className="opp-card opp-summary">
          <Card.Body>
            <div className="opp-section-title">
              <FaInfoCircle className="opp-icon" />
              Summary
            </div>
            <div className="opp-summary-text">{md(summary)}</div>
          </Card.Body>
        </Card>
      ) : null}

      {items?.length ? (
        <div className="opp-grid">
          {items.map((it, idx) => (
            <Card className="opp-card opp-item" key={`${it.title || 'opp'}-${idx}`}>
              <Card.Body>
                <div className="opp-item-header">
                  <div className="opp-title">{it.title || `Opportunity ${idx + 1}`}</div>
                  {it.type ? <Badge bg="secondary" className="opp-badge">{it.type}</Badge> : null}
                </div>

                <FieldRow
                  icon={<FaCalendarAlt className="opp-icon" />}
                  label="Dates"
                  value={[it.dates, it.time].filter(Boolean).join(' · ')}
                />

                {/* Render description as Markdown to keep bullets/line breaks */}
                {it.description ? (
                  <div className="opp-field">
                    <FaInfoCircle className="opp-icon" />
                    <span className="opp-label">Description:</span>
                    <div className="opp-value">{md(it.description)}</div>
                  </div>
                ) : null}

                <FieldRow
                  icon={<FaUserFriends className="opp-icon" />}
                  label="Related Majors"
                  value={it.majors}
                />

                <FieldRow
                  icon={<FaUserFriends className="opp-icon" />}
                  label="Leadership Skills"
                  value={it.skills}
                />
              </Card.Body>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
