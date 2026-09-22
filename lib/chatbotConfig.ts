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
  /** Transient sender phone (filled from WhatsApp chatId) for the confirmed-order summary. */
  customerPhone?: string;
}

export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant';
  text: string;
  timestamp?: string;
}

export const BOT_TEXT_LIMITS = {
  managerPhone: 40, chatbotGreeting: 600, aiApiKey: 512, aiModel: 100,
  customSystemPrompt: 5000, businessName: 2000, servicesText: 6000,
  pricingText: 6000, customRules: 6000, businessHours: 1000,
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

/** Short display name used in greetings (the identity field below is a full persona text). */
export const SHORT_BUSINESS_NAME = 'قطرة الندى للتوصيل والنقل السريع';

/**
 * Default bot "brain": official booking-system mindset.
 * Used whenever the matching settings field is empty (or still holds a
 * superseded older default), so the bot behaves as a professional order
 * registrar even before the owner saves anything.
 */

/** Field 1 — اسم وهوية المشروع الرسمية */
export const DEFAULT_BOT_IDENTITY = `أنت نظام ذكي ومسؤول مبيعات واستقبال طلبات رسمي لشركة "قطرة الندى للتوصيل والنقل السريع". دورك ليس الرد على المعلومات العامة، بل "تسجيل طلبات التوصيل وحجز المواعيد للعملاء" خطوة بخطوة وربطهم بالكابتن.

ممنوع منعاً باتاً قول: "لا تتوفر لدي معلومات مؤكدة".

عندما يذكر العميل تفصيلاً (مثل: وقت، مكان انطلاق، وجهة)، اعتبره فوراً جزءاً من "تسجيل الطلب" وقم بالرد بناءً على المعطيات المتاحة دون تردد.`;

/** Field 2 — الخدمات المتاحة وتفاصيلها */
export const DEFAULT_BOT_SERVICES = `الشركة: قطرة الندى للتوصيل والنقل (أكثر من 700 كابتن وسيارة 24/7).

الخدمات: توصيل طلبات، وجبات، طرود، أثاث، ونقل موظفين ومشاوير.

آلية تسجيل الطلبات: عندما يعطيك العميل نقطة الانطلاق ونقطة الوصول والوقت، قم بجمعها فوراً كطلب جديد جاهز للترحيل للإدارة.`;

/** Field 3 — قاعدة البيانات والأسعار القياسية */
export const DEFAULT_BOT_PRICING = `توصيل داخل المنطقة (مثل الجبيهة): 2 دينار.

توصيل داخل محافظة عمان (مثل من ماركا إلى طبربور): 3 دنانير.

توصيل بين المحافظات: تبدأ من 5 دنانير.

(قاعدة الطلب): إذا حدد العميل الانطلاق والوصول داخل عمان (مثلاً من ماركا إلى طبربور)، احسب السعر فوراً بـ 3 دنانير ولا تقل لا أعرف شيئاً.`;

/** Field 4 — بروتوكول جمع وتأكيد الطلبات + صيغة الإخراج */
export const DEFAULT_BOT_RULES = `بروتوكول تفاعل الحجز: عندما يعطيك العميل تفاصيل الطلب تدريجياً (مثلاً: يريد توصيل لبكرة الساعة 8، ثم يحدد الانطلاق من ماركا)، لا تسأله سؤالاً غريباً ولا تعتذر، بل أكمل التسلسل:

اجمع المعطيات: (الوقت: بكرة الساعة 8، الانطلاق: ماركا، الوجهة: طبربور).

حدد السعر بناءً على الجدول (من ماركا إلى طبربور داخل عمان = 3 دنانير).

رد عليه بصيغة تأكيد الطلب المباشر: "تمام يا غالي، تم تسجيل تفاصيل الطلب: التوصيل بكرة الساعة 8 صباحاً من ماركا إلى طبربور، وأجرة التوصيل ضمن عمان 3 دنانير. هل أثبت الطلب نهائياً وأبعث الكابتن، وهل توجد أي تفاصيل أخرى للطلب (مثل نوع الأغراض)؟"

هذه التعليمات تمنع البوت من "النسيان" أو "الهروب"، وتجعله يمسك بسياق الحوار كمنظومة حجز متكاملة تنتظر الخطوة النهائية لتسجيل الطلب وإرساله للإدارة بنجاح!`;

/**
 * Migration markers: texts saved from the previous brain version are
 * auto-upgraded to the new defaults (genuine owner customizations — texts
 * containing none of these markers — are never touched).
 */
const NEW_BRAIN_MARKERS = ['بروتوكول تفاعل الحجز', 'دورك ليس الرد على المعلومات العامة', 'توصيل داخل المنطقة (مثل الجبيهة)'];
const OLD_BRAIN_MARKERS = [
  'مسؤول مبيعات واستقبال طلبات',
  'جاهز للترحيل للإدارة',
  'تم تسجيل تفاصيل الطلب: التوصيل بكرة',
  'بروتوكول تفاعل الحجز',
];

function needsBrainRefresh(value: unknown): boolean {
  if (typeof value !== 'string' || !value.trim()) return true;
  const text = value.trim();
  if (NEW_BRAIN_MARKERS.some(m => text.includes(m))) return false;
  return OLD_BRAIN_MARKERS.some(m => text.includes(m));
}

/** Fill empty-or-superseded brain fields with the current defaults (pure, non-mutating). */
export function applyBrainDefaults<T extends BotSettings>(config: T): T {
  const base = config as BotSettings;
  // The two rule fields mirror each other in the settings screen: keep each
  // genuine customization, refresh legacy/empty ones, and guarantee that at
  // least one of them carries the current default rules.
  const freshRule = (v: unknown) => (needsBrainRefresh(v) ? '' : String(v).trim());
  const keptRules = freshRule(base.customRules);
  const keptPrompt = freshRule(base.customSystemPrompt);
  const effectiveRules = keptRules || keptPrompt || DEFAULT_BOT_RULES;
  return {
    ...config,
    businessName: needsBrainRefresh(base.businessName) ? DEFAULT_BOT_IDENTITY : base.businessName,
    servicesText: needsBrainRefresh(base.servicesText) ? DEFAULT_BOT_SERVICES : base.servicesText,
    pricingText: needsBrainRefresh(base.pricingText) ? DEFAULT_BOT_PRICING : base.pricingText,
    customRules: effectiveRules,
    customSystemPrompt: keptPrompt || (keptRules ? '' : DEFAULT_BOT_RULES),
  };
}
