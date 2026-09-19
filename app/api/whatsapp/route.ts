import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providerRegistry';
import { WhatsAppConfig, WhatsAppMessage } from '@/lib/whatsappProviders';

async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { config, message, action } = body as {
      config: WhatsAppConfig;
      message: WhatsAppMessage;
      action: 'send' | 'validate' | 'checkNumber';
    };

    if (!config || !config.provider) {
      return NextResponse.json({ error: 'Provider configuration required' }, { status: 400 });
    }

    if (config.provider === 'none') {
      return NextResponse.json({
        success: false,
        error: 'No provider configured. Set up a WhatsApp API provider in settings.',
        status: 'failed',
        provider: 'none',
        timestamp: new Date().toISOString()
      });
    }

    const provider = getProvider(config.provider);

    if (action === 'validate') {
      const isValid = await provider.validateConfig(config);
      return NextResponse.json({ success: isValid, provider: config.provider });
    }

    if (action === 'checkNumber') {
      if (!message?.to) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }
      const exists = await provider.checkNumber(config, message.to);
      return NextResponse.json({ success: exists, whatsapp: exists });
    }

    if (action === 'send' || !action) {
      if (!message?.to || !message?.text) {
        return NextResponse.json({ error: 'Phone number and message text required' }, { status: 400 });
      }

      const result = await provider.sendMessage(config, message);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({
      success: false,
      error: errorMsg,
      status: 'failed',
      provider: 'none',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
