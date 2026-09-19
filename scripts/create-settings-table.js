const { Client } = require('pg');
const conn = 'postgresql://postgres.fiyigxxozeyxiteznwlk:QUI6nrCXgOQyHp8q@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );
  `);
  console.log('✅ app_settings table created successfully in Supabase!');
  await client.end();
}
main();
