import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_BOT_IDENTITY,
  DEFAULT_BOT_SERVICES,
  DEFAULT_BOT_PRICING,
  DEFAULT_BOT_RULES,
} from '@/lib/chatbotConfig';

let memoryConfig: any = {
  provider: 'greenapi',
  greenapi: {
    idInstance: process.env.GREEN_API_ID_INSTANCE || process.env.NEXT_PUBLIC_GREEN_API_ID_INSTANCE || '710722741021',
    apiTokenInstance: process.env.GREEN_API_TOKEN_INSTANCE || process.env.NEXT_PUBLIC_GREEN_API_TOKEN_INSTANCE || '',
    apiUrl: process.env.GREEN_API_URL || 'https://7107.api.greenapi.com',
  },
  chatbotEnabled: true,
  managerPhone: '0788779463',
  // Default bot brain (order-intake & booking mindset); overridden by saved values.
  businessName: DEFAULT_BOT_IDENTITY,
  servicesText: DEFAULT_BOT_SERVICES,
  pricingText: DEFAULT_BOT_PRICING,
  customRules: DEFAULT_BOT_RULES,
};

export async function getServerWhatsAppConfigAsync() {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'whatsapp_config')
      .single();

    if (!error && data?.value) {
      const merged = { ...memoryConfig, ...data.value };
      memoryConfig = merged;
      return merged;
    }
  } catch (e) {
    console.warn('Failed to fetch config from Supabase:', e);
  }

  return memoryConfig;
}

export function getServerWhatsAppConfig() {
  return memoryConfig;
}

export async function GET() {
  const config = await getServerWhatsAppConfigAsync();
  return NextResponse.json({ success: true, config });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = {
      ...memoryConfig,
      ...body,
      greenapi: {
        ...memoryConfig.greenapi,
        ...(body.greenapi || {}),
      },
    };

    memoryConfig = updated;

    // Persist to Supabase
    try {
      await supabase.from('app_settings').upsert({
        key: 'whatsapp_config',
        value: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn('Failed to save config to Supabase:', dbErr);
    }

    return NextResponse.json({ success: true, config: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
