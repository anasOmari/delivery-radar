export interface BotSettings {
  chatbotEnabled?: boolean;
  managerPhone?: string;
  chatbotGreeting?: string;
  aiApiKey?: string;
  aiKeyConfigured?: boolean;
  aiProvider?: 'gemini' | 'openai' | 'groq' | 'builtin';
  aiModel?: string;
  customSystemPrompt?: string;
  businessName?: string;
  servicesText?: string;
  pricingText?: string;
  customRules?: string;
  businessHours?: string;
  coverageText?: string;
  paymentPolicy?: string;
  faqText?: string;
  fallbackMessage?: string;
  botTone?: 'jordanian' | 'formal';
  replyLength?: 'short' | 'balanced';
  historyMessages?: number;
}

export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant';
  text: string;
  timestamp?: string;
}

export const BOT_TEXT_LIMITS = {
  managerPhone: 40, chatbotGreeting: 600, aiApiKey: 512, aiModel: 100,
  customSystemPrompt: 5000, businessName: 160, servicesText: 6000,
  pricingText: 6000, customRules: 4000, businessHours: 1000,
  coverageText: 2000, paymentPolicy: 2000, faqText: 6000, fallbackMessage: 600,
} as const;

/** Only these fields may affect the bot; never copy provider credentials into its prompt. */
export function validateBotSettings(input: unknown): BotSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('إعدادات البوت غير صالحة.');
  const raw = input as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, max] of Object.entries(BOT_TEXT_LIMITS)) {
    if (raw[key] === undefined) continue;
    if (typeof raw[key] !== 'string' || raw[key].length > max) throw new Error(`الحقل ${key} يجب ألا يتجاوز ${max} حرفًا.`);
    result[key] = raw[key].trim();
  }
  if (raw.chatbotEnabled !== undefined) {
    if (typeof raw.chatbotEnabled !== 'boolean') throw new Error('حالة تشغيل البوت غير صالحة.');
    result.chatbotEnabled = raw.chatbotEnabled;
  }
  const choices = { aiProvider: ['gemini', 'builtin', 'openai', 'groq'], botTone: ['jordanian', 'formal'], replyLength: ['short', 'balanced'] };
  for (const [key, allowed] of Object.entries(choices)) {
    if (raw[key] !== undefined) {
      if (typeof raw[key] !== 'string' || !allowed.includes(raw[key])) throw new Error(`قيمة ${key} غير صالحة.`);
      result[key] = raw[key];
    }
  }
  if (raw.historyMessages !== undefined) {
    if (!Number.isInteger(raw.historyMessages) || Number(raw.historyMessages) < 0 || Number(raw.historyMessages) > 20) throw new Error('ذاكرة المحادثة يجب أن تكون بين 0 و20 رسالة.');
    result.historyMessages = raw.historyMessages;
  }
  if (result.aiModel && !/^[a-zA-Z0-9._-]+$/.test(String(result.aiModel))) throw new Error('اسم النموذج غير صالح.');
  return result as BotSettings;
}
