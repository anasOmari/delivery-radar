-- Orders recorded by the WhatsApp booking bot. Every signed-in account can
-- review/update status; incoming webhooks insert through the server connection.
CREATE TABLE IF NOT EXISTS public.bot_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  customer_phone text NOT NULL,
  customer_name text,
  origin text NOT NULL,
  destination text NOT NULL,
  requested_time text NOT NULL,
  item_description text,
  recipient_phone text,
  price_text text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','assigned','completed','cancelled')),
  source_message_id text NOT NULL UNIQUE,
  notes text NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS bot_orders_created_at_idx ON public.bot_orders (created_at DESC);
ALTER TABLE public.bot_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.bot_orders TO authenticated;
REVOKE ALL ON public.bot_orders FROM anon;
DROP POLICY IF EXISTS "Signed-in users can view bot orders" ON public.bot_orders;
CREATE POLICY "Signed-in users can view bot orders" ON public.bot_orders
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Signed-in users can update bot orders" ON public.bot_orders;
CREATE POLICY "Signed-in users can update bot orders" ON public.bot_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.bot_webhook_receipts (
  source_message_id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','sent'))
);
ALTER TABLE public.bot_webhook_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bot_webhook_receipts FROM anon, authenticated;
