import { NextRequest, NextResponse } from 'next/server';
import { getProvider } from '@/lib/providerRegistry';
import { WhatsAppConfig, WhatsAppProvider } from '@/lib/whatsappProviders';
import { LinkStatus } from '@/lib/types';

interface ValidateRequest {
  action: 'checkNumber' | 'checkUrl' | 'validateLead';
  phone?: string;
  url?: string;
  whatsappConfig?: WhatsAppConfig;
  urls?: string[];
}

async function checkUrl(url: string): Promise<LinkStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeout);

    if (res.ok) return 'valid';
    if (res.status === 404) return 'broken';
    if (res.status >= 400) return 'broken';
    return 'valid';
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') return 'timeout';
    return 'broken';
  }
}

async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body: ValidateRequest = await req.json();
    const { action } = body;

    if (action === 'checkNumber') {
      const { phone, whatsappConfig } = body;
      if (!phone) {
        return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
      }

      if (!whatsappConfig || whatsappConfig.provider === 'none') {
        return NextResponse.json({
          whatsapp: null,
          note: 'No WhatsApp provider configured'
        });
      }

      try {
        const provider = getProvider(whatsappConfig.provider as WhatsAppProvider);
        const exists = await provider.checkNumber(whatsappConfig, phone);
        return NextResponse.json({ whatsapp: exists });
      } catch {
        return NextResponse.json({ whatsapp: null, note: 'Provider check failed' });
      }
    }

    if (action === 'checkUrl') {
      const { url } = body;
      if (!url) {
        return NextResponse.json({ error: 'URL required' }, { status: 400 });
      }
      const status = await checkUrl(url);
      return NextResponse.json({ status });
    }

    if (action === 'validateLead') {
      const { urls, phone, whatsappConfig } = body;

      const results: Record<string, LinkStatus> = {};

      if (urls && urls.length > 0) {
        const checks = urls.map(async (url) => {
          if (!url) return;
          try {
            const urlObj = new URL(url);
            const key = urlObj.hostname.replace('www.', '').split('.')[0];
            results[key] = await checkUrl(url);
          } catch {
            results['invalid'] = 'broken';
          }
        });
        await Promise.allSettled(checks);
      }

      let whatsapp: boolean | null = null;
      if (phone && whatsappConfig && whatsappConfig.provider !== 'none') {
        try {
          const provider = getProvider(whatsappConfig.provider as WhatsAppProvider);
          whatsapp = await provider.checkNumber(whatsappConfig, phone);
        } catch {
          whatsapp = null;
        }
      }

      return NextResponse.json({ links: results, whatsapp });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export { handler as POST, handler as GET };
