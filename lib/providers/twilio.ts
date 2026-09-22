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

export const TwilioProvider: WhatsAppProviderInterface = {
  name: 'twilio',
  displayName: 'Twilio SMS',

  async sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse> {
    if (!config.twilio?.accountSid || !config.twilio?.authToken || !config.twilio?.fromNumber) {
      return {
        success: false,
        status: 'failed',
        error: 'Twilio credentials not configured',
        provider: 'twilio',
        timestamp: new Date().toISOString()
      };
    }

    const phone = cleanPhoneForAPI(message.to);
    const toNumber = phone.startsWith('+') ? phone : `+${phone}`;

    try {
      const params = new URLSearchParams();
      params.append('To', toNumber);
      params.append('From', config.twilio.fromNumber);
      params.append('Body', message.text);

      const auth = btoa(`${config.twilio.accountSid}:${config.twilio.authToken}`);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      const data = await response.json();

      if (response.ok && data.sid) {
        return {
          success: true,
          messageId: data.sid,
          status: 'sent',
          provider: 'twilio',
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || data.error_code || `HTTP ${response.status}`,
        provider: 'twilio',
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      return {
        success: false,
        status: 'failed',
        error: errorMsg,
        provider: 'twilio',
        timestamp: new Date().toISOString()
      };
    }
  },

  async validateConfig(config: WhatsAppConfig): Promise<boolean> {
    if (!config.twilio?.accountSid || !config.twilio?.authToken) return false;

    try {
      const auth = btoa(`${config.twilio.accountSid}:${config.twilio.authToken}`);
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilio.accountSid}.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
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
