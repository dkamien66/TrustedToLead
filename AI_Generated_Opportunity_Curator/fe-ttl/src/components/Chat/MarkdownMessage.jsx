// src/components/Chat/MarkdownMessage.jsx
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownMessage.css';

function cleanLLMText(text = '') {
  let t = String(text);

  // Merge split bold markers like "** * **" -> "**"
  t = t.replace(/\*\s+\*/g, '**');

  // Normalize bullet styles
  t = t.replace(/^\s*-\s+/gm, '• ');
  t = t.replace(/^\s*\*\s+/gm, '• ');

  // Compress blank lines
  t = t.replace(/\n{3,}/g, '\n\n');

  // Trim weird leading punctuation on the first line only (but keep bullets)
  t = t.replace(/^(?!•\s)[\s*_.-]+(?=\w|\*)/, '');

  return t.trim();
}

export default function MarkdownMessage({ text }) {
  const cleaned = cleanLLMText(text);

  return (
    <div className="md-message">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        breaks={true} // <-- keep single line breaks as <br>
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
