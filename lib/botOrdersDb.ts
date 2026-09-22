const { Pool } = require('pg') as { Pool: new (config: Record<string, unknown>) => BotDatabase };
interface BotDatabase { query(sql: string, params?: unknown[]): Promise<{ rowCount: number | null; rows: Array<Record<string, unknown>> }> };
import type { ChatMessage } from './chatbotConfig';
import type { BookingDetails } from './orderBooking';

let pool: BotDatabase | null = null;
function db(): BotDatabase {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for bot order storage');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: { rejectUnauthorized: false } });
  return pool;
}

export async function claimWebhook(messageId: string): Promise<boolean> {
  const result = await db().query('INSERT INTO public.bot_webhook_receipts(source_message_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING source_message_id', [messageId]);
  return result.rowCount === 1;
}
export async function releaseWebhook(messageId: string): Promise<void> {
  await db().query("DELETE FROM public.bot_webhook_receipts WHERE source_message_id=$1 AND status='processing'", [messageId]);
}
export async function completeWebhook(messageId: string): Promise<void> {
  await db().query("UPDATE public.bot_webhook_receipts SET status='sent' WHERE source_message_id=$1", [messageId]);
}
export async function recentChatHistory(phone: string, limit = 20): Promise<ChatMessage[]> {
  const result = await db().query(`SELECT message_text, direction FROM public.whatsapp_messages
    WHERE phone=$1 AND (direction='inbound' OR lead_name IN ('بوت الرد الآلي','قطرة الندى AI Bot'))
    ORDER BY created_at DESC LIMIT $2`, [phone, Math.min(limit, 20)]);
  return result.rows.reverse().map((row: Record<string, unknown>) => ({ role: row.direction === 'inbound' ? 'user' : 'assistant', text: String(row.message_text) }));
}
export async function saveBotMessage(phone: string, text: string, direction: 'inbound' | 'outbound', name: string): Promise<void> {
  await db().query(`INSERT INTO public.whatsapp_messages(phone, message_text, direction, status, lead_name)
    VALUES($1,$2,$3,$4,$5)`, [phone, text, direction, direction === 'inbound' ? 'delivered' : 'sent', name]);
}
export async function saveConfirmedOrder(details: BookingDetails, options: { customerPhone: string; customerName: string; sourceMessageId: string }): Promise<string> {
  if (!details.origin || !details.destination || !details.when) throw new Error('Incomplete booking');
  const result = await db().query(`INSERT INTO public.bot_orders
    (customer_phone, customer_name, origin, destination, requested_time, item_description, recipient_phone, price_text, source_message_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    ON CONFLICT (source_message_id) DO UPDATE SET source_message_id=EXCLUDED.source_message_id RETURNING id`, [
      options.customerPhone, options.customerName, details.origin, details.destination, details.when,
      details.item || null, details.phone || null, details.price || null, options.sourceMessageId,
    ]);
  return String(result.rows[0].id);
}
