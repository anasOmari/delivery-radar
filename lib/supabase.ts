import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fiyigxxozeyxiteznwlk.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_1dQumI46aVa4-O41Gd20WQ_jznxNvYe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Log a WhatsApp message to Supabase
 */
export async function logWhatsAppMessageToSupabase(params: {
  phone: string;
  messageText: string;
  direction: 'inbound' | 'outbound';
  status?: string;
  leadName?: string;
}) {
  try {
    const { error } = await supabase.from('whatsapp_messages').insert([
      {
        phone: params.phone,
        message_text: params.messageText,
        direction: params.direction,
        status: params.status || 'sent',
        lead_name: params.leadName || null,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      console.warn('Supabase log message error:', error.message);
    }
  } catch (e) {
    console.warn('Failed to log message to Supabase:', e);
  }
}

/**
 * Save / Sync leads to Supabase
 */
export async function syncLeadsToSupabase(leads: Array<{
  name: string;
  phone: string;
  city?: string;
  category?: string;
  rating?: number;
  address?: string;
  status?: string;
  notes?: string;
  opportunity_score?: number;
}>) {
  try {
    if (!leads || leads.length === 0) return;
    const { error } = await supabase.from('leads').upsert(leads, { onConflict: 'phone' });
    if (error) {
      console.warn('Supabase sync leads error:', error.message);
    }
  } catch (e) {
    console.warn('Failed to sync leads to Supabase:', e);
  }
}

/**
 * Fetch leads from Supabase
 */
export async function fetchLeadsFromSupabase() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch leads error:', error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('Failed to fetch leads from Supabase:', e);
    return [];
  }
}
