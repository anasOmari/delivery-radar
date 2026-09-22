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

export const WatiProvider: WhatsAppProviderInterface = {
  name: 'wati',
  displayName: 'WATI',

  async sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!config.wati?.apiToken || !config.wati?.instanceId) {
      return {
        success: false,
        status: 'failed',
        error: 'WATI credentials not configured',
        provider: 'wati',
        timestamp: new Date().toISOString()
      };
    }

    const phone = cleanPhoneForAPI(message.to);

    try {
      const response = await fetch(
        `https://live-server-${config.wati.instanceId}.wati.io/api/v1/sendSessionMessage/${phone}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.wati.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageText: message.text,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.data?.messageId,
          status: 'sent',
          provider: 'wati',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || data.error || `HTTP ${response.status}`,
        provider: 'wati',
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        status: 'failed',
        error: errorMsg,
        provider: 'wati',
        timestamp: new Date().toISOString()
      };
    }
  },

  async validateConfig(config: WhatsAppConfig): Promise<boolean> {
    if (!config.wati?.apiToken || !config.wati?.instanceId) return false;

    try {
      const response = await fetch(
        `https://live-server-${config.wati.instanceId}.wati.io/api/v1/health`,
        {
          headers: {
            'Authorization': `Bearer ${config.wati.apiToken}`,
          },
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  async checkNumber(_config: WhatsAppConfig, _phone: string): Promise<boolean> {
    return true;
  }
};
