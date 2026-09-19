import {
  WhatsAppProviderInterface,
  WhatsAppConfig,
  WhatsAppMessage,
  WhatsAppResponse,
} from '../whatsappProviders';

function cleanPhoneForGreenApi(phone: string): string {
  // Remove non-digit characters
  let digits = phone.replace(/[^\d]/g, '');
  // If starts with 00, replace with nothing
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }
  return digits;
}

function getGreenApiBaseUrl(apiUrl?: string, idInstance?: string): string {
  if (apiUrl && apiUrl.trim()) {
    let url = apiUrl.trim();
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return url;
  }
  if (idInstance && idInstance.length >= 4) {
    const hostPrefix = idInstance.slice(0, 4);
    return `https://${hostPrefix}.api.greenapi.com`;
  }
  return 'https://api.green-api.com';
}

export const GreenApiProvider: WhatsAppProviderInterface = {
  name: 'greenapi',
  displayName: 'Green-API',

  async sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const green = config.greenapi;
    if (!green?.idInstance || !green?.apiTokenInstance) {
      return {
        success: false,
        status: 'failed',
        error: 'Green-API instance ID or API token is missing in Message Settings.',
        provider: 'greenapi',
        timestamp: new Date().toISOString(),
      };
    }

    const idInstance = green.idInstance.trim();
    const token = green.apiTokenInstance.trim();
    const baseUrl = getGreenApiBaseUrl(green.apiUrl, idInstance);
    const cleanPhone = cleanPhoneForGreenApi(message.to);
    const chatId = `${cleanPhone}@c.us`;

    try {
      if (message.mediaUrl) {
        // Send file / media via Green-API sendFileByUrl
        const sendFileUrl = `${baseUrl}/waInstance${idInstance}/sendFileByUrl/${token}`;
        const fileName = message.mediaUrl.split('/').pop()?.split('?')[0] || 'file';
        const filePayload = {
          chatId,
          urlFile: message.mediaUrl,
          fileName,
          caption: message.caption || message.text || '',
        };

        const response = await fetch(sendFileUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(filePayload),
        });

        const data = await response.json();

        if (response.ok && data.idMessage) {
          return {
            success: true,
            messageId: data.idMessage,
            status: 'sent',
            provider: 'greenapi',
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: false,
          status: 'failed',
          error: data.message || data.error || `Green-API error (HTTP ${response.status})`,
          provider: 'greenapi',
          timestamp: new Date().toISOString(),
        };
      }

      // Send plain text message via Green-API sendMessage
      const sendTextUrl = `${baseUrl}/waInstance${idInstance}/sendMessage/${token}`;
      const payload = {
        chatId,
        message: message.text,
      };

      const response = await fetch(sendTextUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.idMessage) {
        return {
          success: true,
          messageId: data.idMessage,
          status: 'sent',
          provider: 'greenapi',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || data.error || `Green-API error (HTTP ${response.status})`,
        provider: 'greenapi',
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Network connection to Green-API failed';
      return {
        success: false,
        status: 'failed',
        error: errorMsg,
        provider: 'greenapi',
        timestamp: new Date().toISOString(),
      };
    }
  },

  async validateConfig(config: WhatsAppConfig): Promise<boolean> {
    const green = config.greenapi;
    if (!green?.idInstance || !green?.apiTokenInstance) return false;

    const idInstance = green.idInstance.trim();
    const token = green.apiTokenInstance.trim();
    const baseUrl = getGreenApiBaseUrl(green.apiUrl, idInstance);

    try {
      const response = await fetch(`${baseUrl}/waInstance${idInstance}/getStateInstance/${token}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) return false;
      const data = await response.json();
      // Green-API returns { stateInstance: "authorized" | "notAuthorized" | "blocked" | "sleepMode" | "starting" }
      return data.stateInstance === 'authorized' || data.stateInstance === 'starting' || data.stateInstance === 'sleepMode';
    } catch {
      return false;
    }
  },

  async checkNumber(config: WhatsAppConfig, phone: string): Promise<boolean> {
    const green = config.greenapi;
    if (!green?.idInstance || !green?.apiTokenInstance) return false;

    const idInstance = green.idInstance.trim();
    const token = green.apiTokenInstance.trim();
    const baseUrl = getGreenApiBaseUrl(green.apiUrl, idInstance);
    const cleanPhone = cleanPhoneForGreenApi(phone);

    try {
      const response = await fetch(`${baseUrl}/waInstance${idInstance}/checkWhatsapp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: Number(cleanPhone) }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.existsWhatsapp === true;
      }
      return false;
    } catch {
      return false;
    }
  },
};
