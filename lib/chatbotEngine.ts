/**
 * Intelligent AI Chatbot Engine for خدمات قطرة الندى للتوصيل والنقل السريع
 * Features:
 * - Real-time Route & City Pricing Analyzer (عمان -> العقبة / إربد / الزرقاء)
 * - Google Gemini LLM Integration with Multi-turn Memory
 * - Robust Jordanian Colloquial Arabic NLP Engine with prioritized intent resolution.
 */

export interface ChatbotConfig {
  enabled: boolean;
  botName?: string;
  greeting?: string;
  managerPhone?: string;
  aiApiKey?: string;
  aiProvider?: 'gemini' | 'openai' | 'groq' | 'builtin';
  aiModel?: string;
  customSystemPrompt?: string;
  businessName?: string;
  servicesText?: string;
  pricingText?: string;
  customRules?: string;
}

export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant';
  text: string;
  timestamp: string;
}

// In-memory conversation history buffer for context memory
const conversationHistories: Record<string, Array<{ role: 'user' | 'model' | 'assistant'; text: string }>> = {};

const JORDAN_GOVERNORATES = [
  'عمان', 'عمّان', 'العقبة', 'عقبة', 'إربد', 'اربد', 'الزرقاء', 'زرقاء',
  'السلط', 'سلط', 'البلقاء', 'بلقاء', 'مادبا', 'المفرق', 'مفرق',
  'جرش', 'عجلون', 'الكرك', 'كرك', 'الطفيلة', 'طفيلة', 'معان', 'البحر الميت',
  'الرمثا', 'رمثا', 'الغور', 'الأغوار', 'الشونة'
];

const AMMAN_AREAS = [
  'الجبيهة', 'جبيهة', 'صويلح', 'خلدا', 'تلاع العلي', 'دابوق', 'عبدون',
  'الصويفية', 'صويفية', 'الشميساني', 'شميساني', 'جبل عمان', 'اللويبدة',
  'ماركا', 'طبربور', 'شفا بدران', 'أبو نصير', 'ابو نصير', 'المقابلين',
  'مرج الحمام', 'سحاب', 'اليادودة', 'الدوار السابع', 'الدوار الثامن',
  'الدوار الخامس', 'شارع الجامعة', 'الجامعة الأردنية', 'مكة مول', 'سيتي مول'
];

export const DEFAULT_SYSTEM_PROMPT = `أنت المساعد الذكي الرسمي لـ "خدمات قطرة الندى للتوصيل والنقل السريع" في الأردن.

📌 معلومات وأسعار خدمات قطرة الندى:
1. الهوية: "خدمات قطرة الندى للتوصيل والنقل السريع" (تنبيه حاسم: يُمنع منعاً باتاً استخدام كلمة "شركة").
2. الأسطول: يضم أكثر من 700 كابتن وسيارة حديثة متواجدين في كافة مناطق المملكة 24/7.
3. قائمة الأسعار الدقيقة:
   - توصيل داخلي (بنفس المنطقة / الحي): 2 دينار فقط.
   - توصيل داخل محافظة عمّان (من أي منطقة لأي منطقة بعمان): 3 دنانير فقط.
   - توصيل بين المحافظات (مثلاً من عمّان إلى العقبة أو إربد أو الزرقاء أو الكرك أو معان...): 5 دنانير فقط لأي محافظة!
4. ميزتنا التنافسية الكبرى: الدفع فوري ومسبق كاش لصاحب المحل لحظة استلام الأوردر من محله مباشرة.
5. الخدمات: توصيل وجبات مطاعم ساخنة، طرود متاجر وتجارة إلكترونية، نقل موظفين، مشاوير ركاب VIP، اشتراكات شهرية.
6. هاتف الإدارة والتواصل المباشر: {MANAGER_PHONE}.

📌 قواعد الإجابة:
- إذا سأل العميل عن سعر مسار محدد (مثل: "من عمان للعقبة كم؟" أو "كم سعر التوصيل لاربد؟"): أجب مباشرة بالسعر الدقيق المحدد أعلاه وبكل وضوح، واعرض عليه إرسال كابتن فوراً.
- تحدث بلهجة أردنية ودودة، محترمة، مهذبة، وسريعة الفهم مع إيموجيز مناسبة 🚗💨✨.`;

function buildDynamicSystemPrompt(config?: ChatbotConfig): string {
  const managerPhone = config?.managerPhone || '0788779463';

  if (config?.customSystemPrompt && config.customSystemPrompt.trim().length >= 20) {
    return config.customSystemPrompt.replace(/{MANAGER_PHONE}/g, managerPhone);
  }

  let prompt = DEFAULT_SYSTEM_PROMPT.replace(/{MANAGER_PHONE}/g, managerPhone);

  if (config?.businessName) {
    prompt += `\nاسم المشروع: ${config.businessName}`;
  }
  if (config?.servicesText) {
    prompt += `\n\n📌 تفاصيل الخدمات المخصصة:\n${config.servicesText}`;
  }
  if (config?.pricingText) {
    prompt += `\n\n💰 تفاصيل وتعديلات الأسعار المخصصة:\n${config.pricingText}`;
  }
  if (config?.customRules) {
    prompt += `\n\n⚠️ توجيهات إضافية مخصصة للرد:\n${config.customRules}`;
  }

  return prompt;
}

/**
 * Query Google Gemini AI directly for a dynamic, human-like response
 */
async function queryGeminiAI(
  prompt: string,
  history: Array<{ role: string; text: string }>,
  apiKey: string,
  config?: ChatbotConfig
): Promise<string | null> {
  try {
    const formattedSystem = buildDynamicSystemPrompt(config);
    const contents: any[] = [];

    // Add recent history for context
    const recent = history.slice(-6);
    for (const h of recent) {
      contents.push({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.text }],
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: formattedSystem }],
        },
        contents: contents,
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 450,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Gemini API returned error:', res.status, errText);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate ? candidate.trim() : null;
  } catch (err: any) {
    console.warn('Gemini query exception:', err.message);
    return null;
  }
}

/**
 * Intelligent Route & Price Detection Engine
 */
function analyzeRoutePricing(text: string): { matched: boolean; origin?: string; destination?: string; price?: number; type?: 'intercity' | 'amman' | 'internal' } {
  const norm = text.replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();

  // Check detected cities / governorates
  const matchedGovernorates = JORDAN_GOVERNORATES.filter(g => {
    const gn = g.replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
    return norm.includes(gn);
  });

  const matchedAmmanAreas = AMMAN_AREAS.filter(a => {
    const an = a.replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
    return norm.includes(an);
  });

  // 1. Inter-city Route (e.g. from Amman to Aqaba / Irbid / Zarqa)
  if (matchedGovernorates.length >= 2 || (matchedGovernorates.length >= 1 && (norm.includes('عقبه') || norm.includes('اربد') || norm.includes('زرقاء') || norm.includes('سلط') || norm.includes('كرك') || norm.includes('معان') || norm.includes('مفرق') || norm.includes('جرش') || norm.includes('طفيله')))) {
    // If one is not Amman or two distinct governorates
    return {
      matched: true,
      origin: matchedGovernorates[0] || 'عمان',
      destination: matchedGovernorates[1] || 'المحافظات',
      price: 5,
      type: 'intercity',
    };
  }

  // 2. Specific governorate inquiry (e.g. "كم التوصيل للعقبة" or "توصيل لاربد")
  if (
    norm.includes('عقبه') ||
    norm.includes('اربد') ||
    norm.includes('زرقاء') ||
    norm.includes('سلط') ||
    norm.includes('كرك') ||
    norm.includes('معان') ||
    norm.includes('مفرق') ||
    norm.includes('جرش') ||
    norm.includes('عجلون') ||
    norm.includes('طفيله') ||
    norm.includes('رمثا') ||
    norm.includes('مادبا')
  ) {
    const gov = matchedGovernorates[0] || 'المحافظات';
    return {
      matched: true,
      destination: gov,
      price: 5,
      type: 'intercity',
    };
  }

  // 3. Inside Amman (e.g. "من الجبيهة للعبدلي" or "توصيل في عمان")
  if (norm.includes('عمان') || matchedAmmanAreas.length >= 1) {
    return {
      matched: true,
      origin: matchedAmmanAreas[0] || 'عمّان',
      destination: matchedAmmanAreas[1] || 'عمّان',
      price: 3,
      type: 'amman',
    };
  }

  // 4. Internal same area
  if (norm.includes('داخلي') || norm.includes('بنفس المنطقه') || norm.includes('قريب')) {
    return {
      matched: true,
      price: 2,
      type: 'internal',
    };
  }

  return { matched: false };
}

/**
 * Smart Jordanian Arabic NLP Engine with Precise Intent Hierarchy
 */
function processSmartLocalNLP(userText: string, managerPhone: string): string {
  const norm = userText
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '')
    .toLowerCase()
    .trim();

  // --- 1. SPECIFIC ROUTE PRICING INQUIRY (Highest Priority: من عمان للعقبة كم السعر) ---
  const isPriceQuery =
    norm.includes('كم') ||
    norm.includes('قديش') ||
    norm.includes('سعر') ||
    norm.includes('اسعار') ||
    norm.includes('تكلفه') ||
    norm.includes('تعرفه') ||
    norm.includes('حساب') ||
    norm.includes('اجره') ||
    norm.includes('من') ||
    norm.includes('الى') ||
    norm.includes('لـ') ||
    norm === '2';

  if (isPriceQuery) {
    const route = analyzeRoutePricing(userText);

    // Specific Inter-Governorate Route (e.g. Amman -> Aqaba / Irbid / Zarqa)
    if (route.matched && route.type === 'intercity') {
      const destName = route.destination ? `إلى **${route.destination}**` : 'للمحافظات';
      const origName = route.origin && route.origin !== 'المحافظات' ? `من **${route.origin}** ` : '';

      return `سعر التوصيل ${origName}${destName} هو **5 دنانير فقط** 🚗💨

📦 *ميزات خدمات قطرة الندى لنقل وتوصيل المحافظات:*
• تسليم سريع وأسطول يضم أكثر من 700 سيارة يغطي كافة محافظات المملكة 24/7 ⏱️
• **دفع فوري ومسبق كاش** لقيمة الطلب لك في محلك قبل الانطلاق 💵
• التزام تام بأمان وسلامة الشحنات والبضائع 🛡️

هل تحب نرسلك كابتن يستلم الطلب الآن؟ أرسل (موقع الاستلام، ورقم هاتف المستلم) وبنخدمك فوراً! 🤝`;
    }

    // Inside Amman Route
    if (route.matched && route.type === 'amman') {
      return `سعر التوصيل داخل محافظة **عمّان** هو **3 دنانير فقط** 🚗💨

📦 *ميزات خدمات قطرة الندى للتوصيل في عمّان:*
• وصول أسرع كابتن لموقعك خلال دقائق معدودة ⚡
• **دفع كاش مسبق** لقيمة الطلب من محلك مباشرة 💵
• تغطية لكافة مناطق وأحياء عمّان (شرقية وغربية) 24/7.

لطلب كابتن فوراً، أرسل تفاصيل الطلب وبنوجهلك أقرب سيارة حالاً! 🤝`;
    }

    // Internal Route
    if (route.matched && route.type === 'internal') {
      return `سعر التوصيل الداخلي (بنفس منطقتك / حيك) هو **2 دينار فقط** 🚗💨
مع دفع فوري وكاش مسبق لقيمة الطلب من محلك مباشرة! 💵

هل ترغب بطلب كابتن الآن؟ أرسل تفاصيل الأوردر وبنكون عندك فوراً 🤝`;
    }

    // General Full Price Menu
    return `💰 *قائمة أسعار خدمات قطرة الندى للتوصيل السريع:*

📍 *توصيل داخلي (بنفس المنطقة):* **2 دينار فقط**
📍 *توصيل لكافة مناطق ومحافظة عمّان:* **3 دنانير فقط**
📍 *توصيل إلى كافة المحافظات (العقبة، إربد، الزرقاء، الكرك، السلط...):* **5 دنانير فقط**

🛡️ *ميزتنا الذهبية:* الدفع فوري ومسبق كاش عند استلام الطلب من موقعك مباشرة! 💵
جاهزون لخدمتكم على مدار 24 ساعة. هل تحب تطلب كابتن هسا؟ أرسل التفاصيل وبنخدمك بعيونا! 🤝`;
  }

  // --- 2. DIRECT CAPTAIN ORDER (طلب كابتن أو إرسال أوردر مباشر) ---
  if (
    norm.includes('كابتن') ||
    norm.includes('ارسل') ||
    norm.includes('ابعت') ||
    norm.includes('بدي سياره') ||
    norm.includes('عندي اوردر') ||
    norm.includes('عندي طلب') ||
    norm === '1'
  ) {
    return `أهلاً بك! كباتن *خدمات قطرة الندى (700+ سيارة)* جاهزون لخدمتك فوراً 🚗💨

لنوجه لك أقرب كابتن حالاً، يرجى تزويدنا بـ:
1️⃣ *موقع الاستلام (اسم وموقع محلك)*:
2️⃣ *موقع التسليم (منطقة الزبون)*:
3️⃣ *رقم هاتف المستلم*:
4️⃣ *المبلغ المطلوب تحصيله كاش (إن وجد)*:

⚡ الكابتن بيدفعلك المبلغ كاش فور استلام الطلب من موقعك مباشرة! 💵`;
  }

  // --- 3. BUSINESS & RESTAURANT SUBSCRIPTIONS (الاشتراكات الشهرية والعقود) ---
  if (
    norm.includes('اشتراك') ||
    norm.includes('عقد') ||
    norm.includes('شهري') ||
    norm.includes('اسبوعي') ||
    norm.includes('باقه') ||
    norm.includes('عروض المحلات') ||
    norm === '3'
  ) {
    return `📋 *باقات واشتراكات خدمات قطرة الندى للأعمال والمطاعم والمتاجر:*

✨ نوفر اشتراكات مخصصة مع كباتن مخصصين لمحلك:
• التزام تام بأوقات الذروة وتسليم الطلبات ساخنة 🍔🍕
• تسوية يومية ودفع كاش مسبق لكافة الأوردرات 💵
• أولوية توجيه الكباتن وأسعار مخفضة للكميات اليومية 📊

لترتيب اشتراك شهري مخصص لمحلك، تواصل مع الإدارة مباشرة على: ${managerPhone} 📞`;
  }

  // --- 4. STAFF & PASSENGER TRANSPORT (نقل الموظفين والركاب) ---
  if (
    norm.includes('موظف') ||
    norm.includes('ركاب') ||
    norm.includes('مشوار') ||
    norm.includes('نقل كوادر') ||
    norm.includes('توصيل ركاب')
  ) {
    return `👥 *خدمة نقل الكوادر والمشاوير الخاصة:*

🚗 سيارات حديثة ومكيفة مع كباتن ذوي خبرة وأخلاق عالية.
⏰ التزام دقيق بالمواعيد اليومية ونقل الموظفين (صباحي / مسائي).
📍 تغطية لكافة مناطق عمّان والمحافظات.

لتنسيق جدول نقل الموظفين أو المشاوير، تواصل معنا هاتفياً على: ${managerPhone} 🤝`;
  }

  // --- 5. CASH ADVANCE & PAYMENT (الدفع والتحصيل والكاش المسبق) ---
  if (
    norm.includes('دفع') ||
    norm.includes('كاش') ||
    norm.includes('مسبق') ||
    norm.includes('فلوس') ||
    norm.includes('تحصيل') ||
    norm.includes('مصاري')
  ) {
    return `💵 *نظام الدفع الفوري في خدمات قطرة الندى:*

🛡️ الكابتن يدفعلك كامل قيمة الطلب **كاش مسبقاً لحظة استلامه من محلك**، ثم يقوم بتحصيله من الزبون عند التسليم.
لا داعي للقلق أو الانتظار لتحصيل أموالك! ✅`;
  }

  // --- 6. MANAGEMENT & ESCALATION (التحدث مع الإدارة) ---
  if (
    norm.includes('مسؤول') ||
    norm.includes('مدير') ||
    norm.includes('تلفون') ||
    norm.includes('رقمكم') ||
    norm.includes('اتصال') ||
    norm.includes('احكي مع') ||
    norm === '4'
  ) {
    return `أهلاً بك! يمكنك التواصل المباشر مع إدارة *خدمات قطرة الندى*:
📞 *الهاتف المباشر:* ${managerPhone}
🕒 *أوقات الخدمة:* متواجدون على مدار الساعة (24/7) لخدمتكم 🌟`;
  }

  // --- 7. GREETINGS (التحيات والترحيب) ---
  if (
    norm.includes('مرحبا') ||
    norm.includes('سلام') ||
    norm.includes('هلا') ||
    norm.includes('صباح') ||
    norm.includes('مساء') ||
    norm.includes('يعطيك') ||
    norm.includes('الوو') ||
    norm.includes('الو')
  ) {
    return `يا هلا ومية مرحبا فيك في *خدمات قطرة الندى للتوصيل والنقل السريع* 👋✨
أسطول أكثر من *700 كابتن وسيارة* بخدمتكم 24/7!

تفضل، كيف بنقدر نخدمك اليوم؟
1️⃣ لطلب كابتن فوراً (أرسل *1*)
2️⃣ للاستفسار عن الأسعار والمحافظات (أرسل *2*)
3️⃣ لباقات واشتراكات المحلات (أرسل *3*)
4️⃣ للتواصل المباشر مع الإدارة (أرسل *4*)

أو اكتب سؤالك وبنجاوبك فوراً! 🚗💨`;
  }

  // --- 8. THANKS & APPRECIATION (الشكر والإنهاء) ---
  if (
    norm.includes('شكر') ||
    norm.includes('تسلم') ||
    norm.includes('ما قصرت') ||
    norm.includes('يسلمو') ||
    norm.includes('حبيبي')
  ) {
    return `تكرم عيونك يا غالي! دائماً في خدمتكم في أي وقت 🌟
مع تحيات فريق *خدمات قطرة الندى للتوصيل السريع* 🚗💨`;
  }

  // --- DEFAULT MENU ---
  return `أهلاً بك في *خدمات قطرة الندى للتوصيل والنقل السريع* (700+ سيارة بخدمتكم) 🚗✨

يسعدنا خدمتك فوراً في:
1️⃣ *طلب كابتن فوري*: ابعت تفاصيل الطلب وبنوجهلك أقرب كابتن حالاً.
2️⃣ *الأسعار*: داخلي 2 د.أ | عمّان 3 د.أ | المحافظات 5 د.أ (الدفع كاش مسبق).
3️⃣ *الاشتراكات*: باقات شهرية للمطاعم والمحلات.
4️⃣ *الإدارة المباشرة*: هاتف ${managerPhone} 📞

أرسل رقم الخيار أو اكتب استفسارك مباشرة وسنرد عليك فوراً! 🤝`;
}

/**
 * Main Entry: Process Incoming Chatbot Message with AI + NLP Engine
 */
export async function processChatbotMessageAI(
  userText: string,
  senderPhone: string = 'customer',
  config?: ChatbotConfig
): Promise<string> {
  const managerPhone = config?.managerPhone || '0788779463';
  const apiKey = config?.aiApiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '';

  // Get or initialize history
  if (!conversationHistories[senderPhone]) {
    conversationHistories[senderPhone] = [];
  }
  const history = conversationHistories[senderPhone];

  // Try AI first if API Key is configured
  if (apiKey && apiKey.trim().length > 10) {
    const aiReply = await queryGeminiAI(userText, history, apiKey.trim(), config);
    if (aiReply && aiReply.length > 5) {
      history.push({ role: 'user', text: userText });
      history.push({ role: 'model', text: aiReply });
      if (history.length > 12) history.splice(0, history.length - 12);
      return aiReply;
    }
  }

  // Smart High-Speed Jordanian NLP Engine with Route Price Analyzer
  const nlpReply = processSmartLocalNLP(userText, managerPhone);
  history.push({ role: 'user', text: userText });
  history.push({ role: 'model', text: nlpReply });
  if (history.length > 12) history.splice(0, history.length - 12);

  return nlpReply;
}

// Synchronous wrapper for backwards-compatibility
export function processChatbotMessage(
  userText: string,
  senderPhone: string = 'customer',
  config?: ChatbotConfig
): string {
  const managerPhone = config?.managerPhone || '0788779463';
  return processSmartLocalNLP(userText, managerPhone);
}
