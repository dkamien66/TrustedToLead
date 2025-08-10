// src/components/Chat/FieldTiles.jsx
import React from 'react';
import './FieldTiles.css';

// Labels we want to recognize and order (you can add/remove freely)
const KNOWN_LABELS = [
  'Title',
  'Type',
  'Dates',
  'Time',
  'Description',
  'Major(s)',
  'Majors',
  'Year',
  'Career Interests',
  'Skill Level',
  'Leadership Experience',
  'Leadership Skills',
  'Leadership Skills Developed',
  'Time Commitment',
  'Networking Goals',
  'Related Business Majors',
  'Related Majors',
  'Related Fields'
];

// Build a regex that matches any of the labels with optional punctuation/spaces
const LABEL_RE = new RegExp(
  String.raw`(^|\n)\s*[*•>\-–—]?\s*(?:` +
    KNOWN_LABELS.map(l =>
      l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape label text
    ).join('|') +
  String.raw`)\s*:\s*`,
  'i'
);

// Normalize the raw model text (remove weird spaces, compress blank lines)
function normalize(text = '') {
  return String(text)
    .replace(/\r/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Parse the message into { intro, fields: [{label, value}] }
function parseFields(text) {
  const input = normalize(text);

  // Find all label positions
  const labelMatches = [];
  const labelAnyRe = new RegExp(
    String.raw`(^|\n)\s*[*•>\-–—]?\s*([A-Za-z][A-Za-z ()/]+?)\s*:\s*`,
    'g'
  );

  let m;
  while ((m = labelAnyRe.exec(input)) !== null) {
    const full = m[0];
    const label = m[2].trim();
    const startIndex = m.index + m[1].length; // after optional leading newline
    labelMatches.push({ label, index: startIndex, fullMatchLen: full.length });
  }

  // No labels → single intro block
  if (labelMatches.length === 0) {
    return { intro: input, fields: [] };
  }

  // Intro is anything before first label occurrence
  const firstIdx = labelMatches[0].index;
  const intro = input.slice(0, firstIdx).trim();

  // Slice values between labels
  const fields = [];
  for (let i = 0; i < labelMatches.length; i++) {
    const cur = labelMatches[i];
    const next = labelMatches[i + 1];
    const rawLabel = cur.label;

    // Keep only labels we know (case-insensitive)
    const canonical = KNOWN_LABELS.find(
      l => l.toLowerCase() === rawLabel.toLowerCase()
    ) || rawLabel;

    const valueStart = cur.index + cur.fullMatchLen - (cur.label.length + 1); 
    // safer recompute: find the colon after this label occurrence
    const afterColon = input.indexOf(':', cur.index) + 1;
    const valueAreaStart = Math.max(afterColon, cur.index);

    const value = input
      .slice(valueAreaStart, next ? next.index : undefined)
      .replace(/^\s+/, '')     // trim leading space/newlines
      .replace(/\n{3,}/g, '\n')// compress excessive gaps
      .trim();

    // Skip empty values
    if (value) {
      fields.push({ label: canonical, value });
    }
  }

  // Sort fields by our preferred order; unknown labels go to the end
  const order = new Map(KNOWN_LABELS.map((l, i) => [l.toLowerCase(), i]));
  fields.sort((a, b) => {
    const ai = order.has(a.label.toLowerCase()) ? order.get(a.label.toLowerCase()) : 999;
    const bi = order.has(b.label.toLowerCase()) ? order.get(b.label.toLowerCase()) : 999;
    return ai - bi;
  });

  return { intro, fields };
}

export default function FieldTiles({ text }) {
  const { intro, fields } = parseFields(text);

  return (
    <div className="ft-wrap">
      {intro && (
        <div className="ft-intro">
          {intro}
        </div>
      )}

      <div className="ft-grid">
        {fields.map((f, i) => (
          <div className="ft-tile" key={`${f.label}-${i}`}>
            <div className="ft-label">{f.label}</div>
            <div className="ft-value">
              {f.value.split(/\n+/).map((line, idx) => (
                <div key={idx} className="ft-line">{line}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
