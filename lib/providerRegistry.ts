import {
  WhatsAppProviderInterface,
  WhatsAppProvider,
} from './whatsappProviders';
import { GreenApiProvider } from './providers/greenapi';
import { WhapiProvider } from './providers/whapi';
import { WatiProvider } from './providers/wati';
import { TwilioProvider } from './providers/twilio';

const providers: Record<WhatsAppProvider, WhatsAppProviderInterface> = {
  greenapi: GreenApiProvider,
  whapi: WhapiProvider,
  wati: WatiProvider,
  twilio: TwilioProvider,
  meta: WhapiProvider,
  none: GreenApiProvider,
};

export function getProvider(name: WhatsAppProvider): WhatsAppProviderInterface {
  return providers[name] || providers.greenapi;
}

export function getAvailableProviders(): WhatsAppProviderInterface[] {
  return [GreenApiProvider, WhapiProvider, WatiProvider, TwilioProvider];
}
