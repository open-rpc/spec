#!/usr/bin/env node
const fs = require('fs');

const phrases = [
  'MUST',
  'MUST NOT',
  'REQUIRED',
  'SHALL',
  'SHALL NOT',
  'SHOULD',
  'SHOULD NOT',
  'RECOMMENDED',
  'NOT RECOMMENDED',
  'MAY',
  'OPTIONAL'
];

// Build regex pattern
const pattern = new RegExp(`\\b(${phrases.map(p => p.replace(/ /g, '\\s+')).join('|')})\\b`, 'gi');

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('No files specified.');
  process.exit(1);
}

let hasErrors = false;

for (const file of files) {
  if (!fs.existsSync(file)) {
    // Skip nonexistent files (e.g., glob patterns with no matches)
    continue;
  }
  const content = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  content.forEach((line, idx) => {
    let text = line;
    // Remove inline code blocks
    text = text.replace(/`[^`]*`/g, '');
    // If line is a table, ignore first column
    if (text.includes('|')) {
      text = text.split('|').slice(1).join('|');
    }
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const found = match[0];
      const normalized = found.replace(/\s+/g, ' ');
      const expected = phrases.find(p => p.toLowerCase() === normalized.toLowerCase());
      if (found !== expected) {
        const col = match.index + 1;
        console.warn(`${file}:${idx + 1}:${col} RFC2119 keyword should be "${expected}" but found "${found}"`);
        hasErrors = true;
      }
    }
  });
}

if (hasErrors) {
  process.exit(1);
}
