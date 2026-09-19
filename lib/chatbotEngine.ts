/**
 * Intelligent AI Chatbot Engine for خدمات قطرة الندى للتوصيل والنقل السريع
 * Powered by Google Gemini / LLM with Hybrid Jordanian Arabic NLP Fallback.
 */

export interface ChatbotConfig {
  enabled: boolean;
  botName?: string;
  greeting?: string;
  managerPhone?: string;
  aiApiKey?: string;
  aiProvider?: 'gemini' | 'openai' | 'groq' | 'builtin';
  aiModel?: string;
}

export interface ChatMessage {
  role: 'user' | 'bot' | 'assistant';
  text: string;
  timestamp: string;
}

// In-memory conversation history buffer for context memory
const conversationHistories: Record<string, Array<{ role: 'user' | 'model' | 'assistant'; text: string }>> = {};

const SYSTEM_PROMPT = `أنت المساعد الذكي الرسمي لـ "خدمات قطرة الندى للتوصيل والنقل السريع" في الأردن.

📌 قواعد وشخصية الرد:
1. الهوية الرسمية: اسمنا "خدمات قطرة الندى للتوصيل والنقل السريع". (تنبيه حاسم: يُمنع منعاً باتاً استخدام كلمة "شركة").
2. الأسطول: يضم أكثر من 700 كابتن وسيارة حديثة متواجدين في كافة مناطق الأردن على مدار الساعة (24/7).
3. قائمة الأسعار الثابتة:
   - توصيل داخلي بنفس المنطقة / الحي: 2 دينار فقط.
   - توصيل لكافة مناطق ومحافظة عمّان: 3 دنانير فقط.
   - توصيل لكافة المحافظات الأخرى (الزرقاء، إربد، السلط، العقبة، مادبا، المفرق...): 5 دنانير فقط.
4. ميزتنا التنافسية الأقوى: "الدفع فوري ومسبق كاش" لأصحاب المحلات والمطاعم لحظة استلام الأوردر من موقعهم مباشرة.
5. الخدمات المتاحة:
   - توصيل ساخن وسريع لوجبات المطاعم والكافيهات.
   - شحن وتوصيل فوري لطرود المتاجر والأونلاين.
   - نقل وتوصيل الكوادر والموظفين بعقود شهرية.
   - مشاوير الركاب والتوصيل الخاص VIP.
   - اشتراكات وعقود شهرية وأسبوعية للمحلات والأنشطة التجارية.
6. التواصل المباشر مع الإدارة: هاتف رقم {MANAGER_PHONE}.
7. لغة وأسلوب الحوار: أجب دائماً بلهجة أردنية ودودة، مهذبة، واثقة، ومباشرة مع استخدام الإيموجيز اللطيفة المناسبة 🚗💨✨، وابتعد عن الإجابات الطويلة والمملة.
8. إذا أراد العميل طلب كابتن، اطلب منه تزويدك بـ: (موقع الاستلام، موقع التسليم، رقم هاتف المستلم، وقيمة المبلغ الكاش إن وجد).`;

/**
 * Query Google Gemini AI directly for a dynamic, human-like response
 */
async function queryGeminiAI(
  prompt: string,
  history: Array<{ role: string; text: string }>,
  apiKey: string,
  managerPhone: string
): Promise<string | null> {
  try {
    const formattedSystem = SYSTEM_PROMPT.replace(/{MANAGER_PHONE}/g, managerPhone);
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

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: formattedSystem }],
        },
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 400,
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
 * Smart Jordanian Arabic NLP Fuzzy Engine (Fallback & High-Speed Engine)
 */
function processSmartLocalNLP(userText: string, managerPhone: string): string {
  // Normalize Arabic letters
  const normalized = userText
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
    .toLowerCase()
    .trim();

  // 1. طلب كابتن وتوصيل أوردر
  if (
    normalized.includes('كابتن') ||
    normalized.includes('اوصل') ||
    normalized.includes('توصيل') ||
    normalized.includes('طلب') ||
    normalized.includes('اوردر') ||
    normalized.includes('ارسل') ||
    normalized.includes('ابعت') ||
    normalized.includes('سائق') ||
    normalized.includes('سياره') ||
    normalized === '1'
  ) {
    return `أهلاً بك! أسطول كباتن *خدمات قطرة الندى (700+ سيارة)* جاهز لخدمتك فوراً 🚗💨

لنوجه لك أقرب كابتن حالاً، يرجى تزويدنا بـ:
1️⃣ *موقع الاستلام (اسم وموقع محلك)*:
2️⃣ *موقع التسليم (منطقة الزبون)*:
3️⃣ *رقم هاتف المستلم*:
4️⃣ *المبلغ المطلوب تحصيله كاش (إن وجد)*:

⚡ الكابتن بيدفعلك المبلغ كاش فور استلام الطلب من موقعك مباشرة! 💵`;
  }

  // 2. الأسعار والتعرفة
  if (
    normalized.includes('سعر') ||
    normalized.includes('اسعار') ||
    normalized.includes('قديش') ||
    normalized.includes('كم') ||
    normalized.includes('تكلفه') ||
    normalized.includes('تعرفه') ||
    normalized.includes('اجره') ||
    normalized === '2'
  ) {
    return `💰 *أسعار خدمات قطرة الندى للتوصيل السريع:*

📍 *توصيل داخلي (بنفس المنطقة):* **2 دينار فقط**
📍 *توصيل لكافة مناطق عمّان:* **3 دنانير فقط**
📍 *توصيل للمحافظات (إربد، الزرقاء، السلط، العقبة...):* **5 دنانير فقط**

🛡️ *ميزتنا الذهبية:* الدفع فوري ومسبق كاش عند استلام الطلب من عندك! 💵
جاهزون لخدمتكم 24 ساعة. هل تحب تطلب كابتن هسا؟ أرسل تفاصيل الطلب وبنخدمك بعيونا! 🤝`;
  }

  // 3. الاشتراكات والعقود للمحلات والمطاعم
  if (
    normalized.includes('اشتراك') ||
    normalized.includes('عقد') ||
    normalized.includes('شهري') ||
    normalized.includes('اسبوعي') ||
    normalized.includes('باقه') ||
    normalized.includes('عرض') ||
    normalized.includes('مطعم') ||
    normalized.includes('محل') ||
    normalized === '3'
  ) {
    return `📋 *باقات واشتراكات خدمات قطرة الندى للأعمال والمطاعم:*

✨ نوفر اشتراكات مخصصة مع كباتن متفرغين لمحلك أو مطعمك:
• التزام تام بأوقات الذروة وتسليم الطلبات ساخنة 🍔
• تسوية يومية ودفع كاش مسبق لكافة الطلبات 💵
• تقارير شهرية وأسعار تفضيلية خاصة للكميات العالية 📊

لترتيب باقة شهرية تناسب حجم طلباتك، تواصل مع الإدارة مباشرة على: ${managerPhone} 📞`;
  }

  // 4. توصيل ونقل الموظفين والركاب
  if (
    normalized.includes('موظف') ||
    normalized.includes('ركاب') ||
    normalized.includes('مشوار') ||
    normalized.includes('نقل') ||
    normalized.includes('توصيله') ||
    normalized.includes('دوام')
  ) {
    return `👥 *خدمة نقل الكوادر والمشاوير الخاصة:*

🚗 سيارات حديثة ومكيفة مع كباتن ذوي خبرة وأخلاق عالية.
⏰ التزام دقيق بالمواعيد اليومية (صباحي / مسائي).
📍 تغطية لكافة مناطق عمّان والمحافظات.

لتنسيق مواعيد نقل الموظفين أو المشاوير، تواصل معنا هاتفياً على: ${managerPhone} 🤝`;
  }

  // 5. استفسارات الدفع والكاش والتحصيل
  if (
    normalized.includes('دفع') ||
    normalized.includes('كاش') ||
    normalized.includes('مسبق') ||
    normalized.includes('فلوس') ||
    normalized.includes('تحصيل') ||
    normalized.includes('مصاري')
  ) {
    return `💵 *نظام الدفع الفوري في خدمات قطرة الندى:*

🛡️ الكابتن يدفعلك كامل قيمة الطلب **كاش مسبقاً فور استلامه من محلك**، ثم يقوم بتحصيله من الزبون عند التسليم.
لا يوجد أي تأخير أو قلق على أموالك! ✅`;
  }

  // 6. التحدث مع الإدارة
  if (
    normalized.includes('مسؤول') ||
    normalized.includes('مدير') ||
    normalized.includes('تلفون') ||
    normalized.includes('رقم') ||
    normalized.includes('اتصال') ||
    normalized.includes('احكي') ||
    normalized === '4'
  ) {
    return `أهلاً بك! يمكنك التواصل المباشر مع إدارة *خدمات قطرة الندى*:
📞 *الهاتف المباشر:* ${managerPhone}
🕒 *أوقات الخدمة:* متواجدون على مدار الساعة (24/7) لخدمتكم 🌟`;
  }

  // 7. تحيات واستفسارات عامة
  if (
    normalized.includes('مرحبا') ||
    normalized.includes('سلام') ||
    normalized.includes('هلا') ||
    normalized.includes('صباح') ||
    normalized.includes('مساء') ||
    normalized.includes('يعطيك') ||
    normalized.includes('الوو') ||
    normalized.includes('الو')
  ) {
    return `يا هلا ومية مرحبا فيك في *خدمات قطرة الندى للتوصيل والنقل السريع* 👋✨
أسطول أكثر من *700 كابتن وسيارة* جاهز لخدمتك 24/7!

تفضل، كيف بنقدر نخدمك اليوم؟
1️⃣ لطلب كابتن فوراً (أرسل *1*)
2️⃣ للاستفسار عن الأسعار (أرسل *2*)
3️⃣ لباقات واشتراكات المحلات (أرسل *3*)
4️⃣ للتواصل مع الإدارة (أرسل *4*)

أو اكتب سؤالك وبنجاوبك فوراً! 🚗💨`;
  }

  // 8. شكر وتقدير
  if (
    normalized.includes('شكر') ||
    normalized.includes('تسلم') ||
    normalized.includes('ما قصرت') ||
    normalized.includes('تمام') ||
    normalized.includes('يسلمو') ||
    normalized.includes('حبيبي')
  ) {
    return `تكرم عيونك يا غالي! دائماً في خدمتكم في أي وقت 🌟
مع تحيات فريق *خدمات قطرة الندى للتوصيل السريع* 🚗💨`;
  }

  // Default Contextual Menu
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
    const aiReply = await queryGeminiAI(userText, history, apiKey.trim(), managerPhone);
    if (aiReply && aiReply.length > 5) {
      // Save history for context
      history.push({ role: 'user', text: userText });
      history.push({ role: 'model', text: aiReply });
      if (history.length > 12) history.splice(0, history.length - 12);
      return aiReply;
    }
  }

  // Fallback to advanced Smart Jordanian NLP Engine
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
