// src/components/Chat/HardBreakCleanMessage.jsx
import React from 'react';

// Match positions where a bullet marker starts a new "field"
const BULLET_SPLIT_RE = /(?=[*•\-–—]\s*\S)/g;

export default function HardBreakCleanMessage({ text = '' }) {
  const normalized = String(text)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  const hasInlineBullets = /[*•\-–—]\s*\S/.test(normalized);

  const parts = hasInlineBullets
    ? normalized.split(BULLET_SPLIT_RE).filter(Boolean)
    : normalized.split(/\n/);

  return (
    <span>
      {parts.map((chunk, i) => {
        // Remove the bullet marker and any following spaces
        const cleaned = chunk.replace(/^[*•\-–—]\s*/, '').trim();
        return (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {cleaned}
          </React.Fragment>
        );
      })}
    </span>
  );
}
