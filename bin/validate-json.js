#!/usr/bin/env node
const fs = require('fs');

const files = process.argv.slice(2);
let hadError = false;

files.forEach((file) => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /```json\n([\s\S]*?)```/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      JSON.parse(match[1]);
    } catch (err) {
      console.error(`Invalid JSON in ${file}: ${err.message}`);
      hadError = true;
    }
  }
});

if (hadError) {
  process.exit(1);
}
