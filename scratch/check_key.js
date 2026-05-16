const fs = require('fs');
const content = fs.readFileSync('c:/Users/PC/Desktop/jobvanta/web/.env.local', 'utf8');
const lines = content.split('\n');
const apiKeyLine = lines.find(l => l.startsWith('DODO_PAYMENTS_API_KEY='));
if (apiKeyLine) {
  const value = apiKeyLine.split('=')[1];
  console.log('Length:', value.length);
  console.log('Value:', JSON.stringify(value));
} else {
  console.log('API Key line not found');
}
