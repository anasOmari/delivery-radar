const fs = require('fs');
const { Client } = require('pg');
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(fs.readFileSync('scripts/bot-orders.sql', 'utf8'));
    console.log('Bot orders schema is ready.');
  } finally {
    await client.end();
  }
}
main().catch(error => { console.error('Migration failed:', error.code || error.name, error.message, error.errors?.map(entry => `${entry.code}: ${entry.message}`).join('; ') || ''); process.exitCode = 1; });
