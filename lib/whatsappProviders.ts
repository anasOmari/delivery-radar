export type WhatsAppProvider = 'greenapi' | 'whapi' | 'wati' | 'twilio' | 'meta' | 'none';

export interface CustomMessageTemplate {
  id: string;
  title: string;
  template: string;
}

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  greenapi?: {
    idInstance: string;
    apiTokenInstance: string;
    apiUrl?: string;
  };
  whapi?: {
    token: string;
    baseUrl: string;
  };
  wati?: {
    apiToken: string;
    instanceId: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  meta?: {
    phoneNumberId: string;
    accessToken: string;
    apiVersion: string;
  };
  autoMessageTemplate?: string;
  autoSendDirectly?: boolean;
  sendDelaySeconds?: number;
  customTemplates?: CustomMessageTemplate[];
  chatbotEnabled?: boolean;
  managerPhone?: string;
  chatbotGreeting?: string;
  aiApiKey?: string;
  aiProvider?: 'gemini' | 'openai' | 'groq' | 'builtin';
}

export interface WhatsAppMessage {
  to: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'audio';
  caption?: string;
}

export interface WhatsAppResponse {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  error?: string;
  provider: WhatsAppProvider;
  timestamp: string;
}

export interface WhatsAppDeliveryStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  timestamp: string;
  error?: string;
}

export interface WhatsAppProviderInterface {
  name: WhatsAppProvider;
  displayName: string;
  sendMessage(config: WhatsAppConfig, message: WhatsAppMessage): Promise<WhatsAppResponse>;
  validateConfig(config: WhatsAppConfig): Promise<boolean>;
  checkNumber(config: WhatsAppConfig, phone: string): Promise<boolean>;
  sendLocation?(
    config: WhatsAppConfig,
    to: string,
    latitude: number,
    longitude: number,
    nameLocation?: string,
    address?: string
  ): Promise<boolean>;
  sendButtons?(
    config: WhatsAppConfig,
    to: string,
    message: string,
    buttons: Array<{ buttonId: string; buttonText: string }>
  ): Promise<boolean>;
}

export const DEFAULT_AUTO_MESSAGE_TEMPLATE = `السلام عليكم ورحمة الله، تحياتنا لإدارة {name} المحترمين 👋✨

تبحثون عن خدمة توصيل سريعة وموثوقة لطلباتكم وزبائنكم بدون أي تأخير؟ 🚗💨

يسعدنا في *خدمات قطرة الندى للتوصيل والنقل السريع* أن نكون في خدمتكم من خلال فريق متكامل يضم أكثر من *700 كابتن وسيارة* جاهزين على مدار الساعة (24/7):

📦 *خدماتنا المتاحة لنشاطكم:*
1️⃣ توصيل فوري لطلبات المتاجر والأونلاين 🛍️
2️⃣ توصيل ساخن وسريع للوجبات والأطعمة 🍔🍕
3️⃣ نقل وتوصيل الكوادر والموظفين 👥
4️⃣ توصيل الركاب والمشاوير الخاصة 🚘
5️⃣ اشتراكات شهرية وأسبوعية مخصصة للمحلات والمطاعم 📋

💰 *أسعارنا التوفيرية والثابتة:*
📍 توصيل داخلي بنفس منطقتكم في {city}: *2 دينار فقط*
📍 توصيل لكافة مناطق ومحافظة عمّان: *3 دنانير فقط*
📍 توصيل إلى كافة المحافظات: *5 دنانير فقط*

🛡️ *ميزتنا الأهم:* دفع فوري ومسبق لقيمة الطلب كاش عند الاستلام من موقعكم مباشرة!

يسعدنا بدء التعاون معكم وتجربة أول طلب اليوم 🤝
لطلب كابتن فوراً أو الاستفسار، تفضلوا بالرد على هذه الرسالة.`;

export const PROVIDER_INFO: Record<WhatsAppProvider, { name: string; description: string; website: string; recommended?: boolean }> = {
  greenapi: {
    name: 'GREEN-API',
    description: 'بوابة إرسال واتساب مستقرة وسريعة مع ربط مباشر برقم الواتساب وواجهة تحكم فورية.',
    website: 'https://green-api.com',
    recommended: true,
  },
  whapi: {
    name: 'Whapi.Cloud',
    description: 'REST API with fixed pricing, no per-message fees. Send text, media, interactive messages.',
    website: 'https://whapi.cloud',
  },
  wati: {
    name: 'WATI',
    description: 'WhatsApp Business API platform with template management and broadcast capabilities.',
    website: 'https://www.wati.io',
  },
  twilio: {
    name: 'Twilio SMS',
    description: 'SMS messaging via Twilio. Supports bulk sends, delivery tracking, and two-way messaging.',
    website: 'https://www.twilio.com',
  },
  meta: {
    name: 'Meta Official API',
    description: 'Official WhatsApp Business API via Meta. Requires business verification and template approvals.',
    website: 'https://developers.facebook.com/docs/whatsapp',
  },
  none: {
    name: 'الوضع اليدوي (wa.me)',
    description: 'فتح رابط wa.me للإرسال اليدوي عبر تطبيق الواتساب مباشرة دون اشتراك API.',
    website: '',
  },
};

export function getWhatsAppConfig(): WhatsAppConfig {
  try {
    if (typeof window === 'undefined') return { provider: 'none', autoMessageTemplate: DEFAULT_AUTO_MESSAGE_TEMPLATE };
    const saved = localStorage.getItem('whatsapp_api_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        autoMessageTemplate: parsed.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE,
        sendDelaySeconds: parsed.sendDelaySeconds ?? 2,
      };
    }
  } catch {}
  return {
    provider: 'none',
    autoMessageTemplate: DEFAULT_AUTO_MESSAGE_TEMPLATE,
    sendDelaySeconds: 2,
    autoSendDirectly: false,
  };
}

export function saveWhatsAppConfig(config: WhatsAppConfig): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('whatsapp_api_config', JSON.stringify(config));
    }
  } catch {}
}
