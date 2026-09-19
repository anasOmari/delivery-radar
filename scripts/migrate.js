const { Client } = require('pg');

const sql = `
-- 1. جدول العملاء المحتملين (Leads)
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    category TEXT,
    city TEXT,
    rating NUMERIC,
    address TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    opportunity_score NUMERIC
);

-- 2. جدول سجل رسائل الواتساب والردود الذكية (WhatsApp Messages)
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    phone TEXT NOT NULL,
    lead_name TEXT,
    message_text TEXT NOT NULL,
    direction TEXT NOT NULL,
    status TEXT DEFAULT 'sent'
);
`;

async function runMigration() {
  const connectionString = process.env.DATABASE_URL || process.argv[2];
  if (!connectionString) {
    console.error('Error: Please provide a database connection string or DATABASE_URL environment variable.');
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Successfully connected to database!');
    console.log('Executing table creation SQL...');
    await client.query(sql);
    console.log('ALL TABLES CREATED SUCCESSFULLY! ✅');
  } catch (err) {
    console.error('Migration failed with error:', err.message);
  } finally {
    await client.end();
  }
}

runMigration();
