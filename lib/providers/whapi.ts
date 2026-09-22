import {
  WhatsAppProviderInterface,
  WhatsAppConfig,
  WhatsAppMessage,
  WhatsAppResponse,
} from '../whatsappProviders';

import { normalizeToInternational } from '../phone';

function cleanPhoneForAPI(phone: string): string {
  return normalizeToInternational(phone || '');
}

export const WhapiProvider: WhatsAppProviderInterface = {
  name: 'whapi',
  displayName: 'Whapi.Cloud',

  async sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!config.whapi?.token) {
      return {
        success: false,
        status: 'failed',
        error: 'Whapi token not configured',
        provider: 'whapi',
        timestamp: new Date().toISOString()
      };
    }

    const phone = cleanPhoneForAPI(message.to);
    const baseUrl = config.whapi.baseUrl || 'https://gate.whapi.cloud';

    try {
      const payload: Record<string, unknown> = {
        to: phone,
        body: message.text,
      };

      if (message.mediaUrl) {
        payload.media = message.mediaUrl;
        if (message.caption) payload.caption = message.caption;
      }

      const response = await fetch(`${baseUrl}/messages/text`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whapi.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.id) {
        return {
          success: true,
          messageId: data.id,
          status: 'sent',
          provider: 'whapi',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || data.error || `HTTP ${response.status}`,
        provider: 'whapi',
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        status: 'failed',
        error: errorMsg,
        provider: 'whapi',
        timestamp: new Date().toISOString()
      };
    }
  },

  async validateConfig(config: WhatsAppConfig): Promise<boolean> {
    if (!config.whapi?.token) return false;

    const baseUrl = config.whapi.baseUrl || 'https://gate.whapi.cloud';
    try {
      const response = await fetch(`${baseUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${config.whapi.token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async checkNumber(config: WhatsAppConfig, phone: string): Promise<boolean> {
    if (!config.whapi?.token) return false;

    const cleanPhone = cleanPhoneForAPI(phone);
    const baseUrl = config.whapi.baseUrl || 'https://gate.whapi.cloud';

    try {
      const response = await fetch(`${baseUrl}/contacts/${cleanPhone}`, {
        headers: {
          'Authorization': `Bearer ${config.whapi.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        return data.whatsapp === true || data.status === 'valid';
      }
      return false;
    } catch {
      return false;
    }
  }
};
