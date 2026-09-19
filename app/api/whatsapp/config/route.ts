import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// In-memory runtime cache for server-side config
let serverWhatsAppConfig: any = {
  provider: 'greenapi',
  greenapi: {
    idInstance: process.env.GREEN_API_ID_INSTANCE || process.env.NEXT_PUBLIC_GREEN_API_ID_INSTANCE || '',
    apiTokenInstance: process.env.GREEN_API_TOKEN_INSTANCE || process.env.NEXT_PUBLIC_GREEN_API_TOKEN_INSTANCE || '',
    apiUrl: process.env.GREEN_API_URL || 'https://api.green-api.com',
  },
  chatbotEnabled: true,
  managerPhone: '0788779463',
};

const CONFIG_FILE = path.join(process.cwd(), '.whatsapp_config.json');

// Try loading persisted config on startup
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    serverWhatsAppConfig = { ...serverWhatsAppConfig, ...data };
  }
} catch (e) {
  // Ignored in read-only environments
}

export function getServerWhatsAppConfig() {
  // Always prefer active instance/token from memory or env
  const idInstance =
    serverWhatsAppConfig.greenapi?.idInstance ||
    process.env.GREEN_API_ID_INSTANCE ||
    process.env.NEXT_PUBLIC_GREEN_API_ID_INSTANCE ||
    '710722741021';

  const apiTokenInstance =
    serverWhatsAppConfig.greenapi?.apiTokenInstance ||
    process.env.GREEN_API_TOKEN_INSTANCE ||
    process.env.NEXT_PUBLIC_GREEN_API_TOKEN_INSTANCE ||
    '';

  const apiUrl =
    serverWhatsAppConfig.greenapi?.apiUrl ||
    process.env.GREEN_API_URL ||
    (idInstance && idInstance.length >= 4 ? `https://${idInstance.slice(0, 4)}.api.greenapi.com` : 'https://api.green-api.com');

  return {
    ...serverWhatsAppConfig,
    provider: 'greenapi',
    greenapi: {
      idInstance,
      apiTokenInstance,
      apiUrl,
    },
  };
}

export async function GET() {
  const config = getServerWhatsAppConfig();
  return NextResponse.json({ success: true, config });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    serverWhatsAppConfig = {
      ...serverWhatsAppConfig,
      ...body,
      greenapi: {
        ...serverWhatsAppConfig.greenapi,
        ...(body.greenapi || {}),
      },
    };

    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(serverWhatsAppConfig, null, 2), 'utf-8');
    } catch {}

    return NextResponse.json({ success: true, config: getServerWhatsAppConfig() });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
