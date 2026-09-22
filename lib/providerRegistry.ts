import {
  WhatsAppProviderInterface,
  WhatsAppProvider,
} from './whatsappProviders';
import { GreenApiProvider } from './providers/greenapi';
import { WhapiProvider } from './providers/whapi';
import { WatiProvider } from './providers/wati';
import { TwilioProvider } from './providers/twilio';

/** Fallback for provider "none" (manual wa.me mode): never attempts an API call. */
const ManualProvider: WhatsAppProviderInterface = {
  name: 'none',
  displayName: 'Manual (wa.me)',
  async sendMessage() {
    return {
      success: false,
      status: 'failed',
      error: 'No provider configured. Set up a WhatsApp API provider in settings.',
      provider: 'none',
      timestamp: new Date().toISOString(),
    };
  },
  async validateConfig() {
    return false;
  },
  async checkNumber() {
    return false;
  },
};

const providers: Record<WhatsAppProvider, WhatsAppProviderInterface> = {
  greenapi: GreenApiProvider,
  whapi: WhapiProvider,
  wati: WatiProvider,
  twilio: TwilioProvider,
  meta: WhapiProvider,
  none: ManualProvider,
};

export function getProvider(name: WhatsAppProvider): WhatsAppProviderInterface {
  return providers[name] || providers.greenapi;
}

export function getAvailableProviders(): WhatsAppProviderInterface[] {
  return [GreenApiProvider, WhapiProvider, WatiProvider, TwilioProvider];
}
