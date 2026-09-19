/**
 * Smart AI Chatbot Engine for خدمات قطرة الندى للتوصيل والنقل السريع
 * Handles customer intent recognition, multi-turn order flows, FAQs, and pricing queries.
 */

export interface ChatbotConfig {
  enabled: boolean;
  botName?: string;
  greeting?: string;
  managerPhone?: string;
  workingHours?: string;
}

export interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

// In-memory conversation state for multi-turn booking requests
const userSessions: Record<string, { step: string; data: Record<string, string> }> = {};

export function processChatbotMessage(
  userText: string,
  senderPhone: string = 'customer',
  config?: ChatbotConfig
): string {
  const cleanInput = userText.trim().toLowerCase();
  const session = userSessions[senderPhone] || { step: 'idle', data: {} };
  const managerPhone = config?.managerPhone || '0788779463';

  // --- Step 1: Handle Multi-Step Order Flow (إذا كان العميل في طور طلب كابتن) ---
  if (session.step === 'awaiting_order_details') {
    userSessions[senderPhone] = { step: 'idle', data: {} };
    return `✅ تم استلام تفاصيل الطلب بنجاح! 🚗💨

📍 تفاصيل الإرسالية:
"${userText}"

جاري الآن توجيه أقرب كابتن من أسطول *خدمات قطرة الندى (700+ سيارة)* لموقع الاستلام.
سيتواصل معك الكابتن هاتفياً خلال دقائق معدودة فور وصوله لاستلام الطلب ودفع قيمته كاش 💵

لأي استفسار إضافي، يمكنك الاتصال المباشر على: ${managerPhone} 📞`;
  }

  // --- Step 2: Intent Classification & Smart Responses ---

  // 1. طلب كابتن أو توصيل طلب فوري
  if (
    cleanInput.includes('طلب كابتن') ||
    cleanInput.includes('بدي كابتن') ||
    cleanInput.includes('توصيل طلب') ||
    cleanInput.includes('بدي اوصل') ||
    cleanInput.includes('بدي أوصل') ||
    cleanInput.includes('ارسل كابتن') ||
    cleanInput.includes('أرسل كابتن') ||
    cleanInput.includes('ابعت كابتن') ||
    cleanInput.includes('ابعتوا كابتن') ||
    cleanInput.includes('عندي طلب') ||
    cleanInput.includes('عندي اوردر') ||
    cleanInput.includes('عندي أوردر') ||
    cleanInput === '1'
  ) {
    userSessions[senderPhone] = { step: 'awaiting_order_details', data: {} };
    return `أهلاً بك! كباتن *خدمات قطرة الندى (700+ سيارة)* جاهزون لخدمتك فوراً 🚗✨

يرجى تزويدنا بالتفاصيل في رسالة واحدة:
1️⃣ *موقع الاستلام (موقع محلك / اسم المحل)*:
2️⃣ *موقع التسليم (منطقة الزبون)*:
3️⃣ *رقم هاتف المستلم*:
4️⃣ *قيمة الطلب الكاش المطلوب تحصيلها (إن وجدت)*:

⚡ سيصلك الكابتن مباشرة فور إرسال التفاصيل ويدفع لك المبلغ كاش مسبقاً! 💵`;
  }

  // 2. الاستفسار عن الأسعار والمناطق
  if (
    cleanInput.includes('كم السعر') ||
    cleanInput.includes('قديش السعر') ||
    cleanInput.includes('قديش التوصيل') ||
    cleanInput.includes('كم التوصيل') ||
    cleanInput.includes('الاسعار') ||
    cleanInput.includes('الأسعار') ||
    cleanInput.includes('التعرفة') ||
    cleanInput.includes('قائمة الاسعار') ||
    cleanInput === '2'
  ) {
    return `💰 *قائمة أسعار خدمات قطرة الندى للتوصيل السريع:*

📍 *توصيل داخلي (بنفس المنطقة):* **2 دينار فقط**
📍 *توصيل لكافة مناطق عمّان:* **3 دنانير فقط**
📍 *توصيل للمحافظات (الزرقاء، إربد، السلط، العقبة...):* **5 دنانير فقط**

🛡️ *ميزاتنا الخاصة:*
• دفع مسبق وفوري لقيمة الطلب كاش عند استلامه من محلك 💵
• أسطول أكثر من 700 سيارة يغطي كافة المناطق 24/7 🚗
• سرعة فائقة في التسليم والتزام بالمواعيد ⏱️

هل ترغب في طلب كابتن الآن؟ أرسل "1" أو تفاصيل الطلب مباشرة! 🤝`;
  }

  // 3. الاستفسار عن الاشتراكات الشهرية والعقود
  if (
    cleanInput.includes('اشتراك') ||
    cleanInput.includes('اشتراكات') ||
    cleanInput.includes('شهري') ||
    cleanInput.includes('اسبوعي') ||
    cleanInput.includes('عقد') ||
    cleanInput.includes('عقود') ||
    cleanInput === '5'
  ) {
    return `📋 *الاشتراكات الشهرية والأسبوعية في خدمات قطرة الندى:*

نقدم باقات مخصصة لأصحاب المتاجر، المطاعم، والشركات:
🌟 *باقة المتاجر والمطاعم:* كباتن مخصصين لنشاطك بأولوية قصوى وأسعار مخفضة على حجم الطلبات اليومي.
👥 *باقة نقل وتوصيل الموظفين:* مواعيد دقيقة صباحاً ومساءً لكوادر العمل.
📦 *اشتراكات النقل المنتظم:* تسوية أسبوعية أو يومية مرنة.

لترتيب باقة مخصصة تناسب حجم عملك أو الاجتماع مع مسؤول الفريق، تواصل معنا مباشرة على: ${managerPhone} 📞✨`;
  }

  // 4. توصيل الطعام والوجبات الساخنة للمطاعم
  if (
    cleanInput.includes('مطعم') ||
    cleanInput.includes('وجبات') ||
    cleanInput.includes('طعام') ||
    cleanInput.includes('اكل') ||
    cleanInput.includes('أكل') ||
    cleanInput.includes('سندويشات')
  ) {
    return `🍔🍕 *خدمة التوصيل السريع للمطاعم والكافيهات:*

نضمن لك:
🔥 وصول الوجبات ساخنة وبأعلى جودة.
⏱️ سرعة وصول الكابتن لمطعمك خلال دقائق.
💵 دفع قيمة الوجبات كاش مقدماً عند استلامها من المطعم!

هل لديك طلب جاهز للتوصيل الآن؟ أرسل موقع الاستلام والتسليم وسنوجه لك أقرب كابتن فوراً! 🚗💨`;
  }

  // 5. توصيل الموظفين أو الركاب
  if (
    cleanInput.includes('موظفين') ||
    cleanInput.includes('نقل موظفين') ||
    cleanInput.includes('توصيل ركاب') ||
    cleanInput.includes('مشوار') ||
    cleanInput.includes('مشاوير') ||
    cleanInput === '3' ||
    cleanInput === '4'
  ) {
    return `👥 *خدمات نقل الموظفين والمشاوير الخاصة:*

🚗 سيارات حديثة ومكيفة مع كباتن ذوي خبرة وأخلاق عالية.
⏰ التزام تام بالمواعيد اليومية صباحاً ومساءً.
📍 تغطية كاملة لكافة مناطق عمّان والمحافظات.

لترتيب جدول المشاوير أو مواعيد نقل الموظفين، أرسل التفاصيل أو تواصل معنا هاتفياً على: ${managerPhone} 🤝`;
  }

  // 6. الاستفسار عن الدفع المسبق والكاش
  if (
    cleanInput.includes('الدفع') ||
    cleanInput.includes('كاش') ||
    cleanInput.includes('مسبق') ||
    cleanInput.includes('فلوس') ||
    cleanInput.includes('التحصيل')
  ) {
    return `💵 *نظام الدفع والتحصيل في خدمات قطرة الندى:*

🛡️ *الدفع فوري ومسبق:* يقوم الكابتن بدفع قيمة الطلب كاملاً نقداً (كاش) لك في محلك لحظة استلامه للأوردر مباشرة، ثم يقوم بتحصيل المبلغ من زبونك عند التسليم.
لا داعي للانتظار أو القلق على أموالك! ✅`;
  }

  // 7. التحدث مع مسؤول أو إنسان
  if (
    cleanInput.includes('مسؤول') ||
    cleanInput.includes('مدير') ||
    cleanInput.includes('اتصال') ||
    cleanInput.includes('رقم هاتف') ||
    cleanInput.includes('بدي احكي') ||
    cleanInput.includes('تلفون') ||
    cleanInput.includes('رقمكم')
  ) {
    return `أهلاً بك! يمكنك التواصل المباشر مع إدارة *خدمات قطرة الندى* هاتفياً أو عبر واتساب:
📞 *الهاتف المباشر:* ${managerPhone}
🕒 *أوقات العمل:* متواجدون بخدمتكم 24 ساعة على مدار الأسبوع (24/7) 🌟`;
  }

  // 8. تحيات وسلام
  if (
    cleanInput.includes('مرحبا') ||
    cleanInput.includes('مرحباً') ||
    cleanInput.includes('السلام عليكم') ||
    cleanInput.includes('صباح الخير') ||
    cleanInput.includes('مساء الخير') ||
    cleanInput.includes('هلا') ||
    cleanInput.includes('يعطيك العافية') ||
    cleanInput.includes('يعطيكم العافيه')
  ) {
    return `أهلاً وسهلاً بك في *خدمات قطرة الندى للتوصيل والنقل السريع* 👋✨
أسطول يضم أكثر من *700 سيارة وكابتن* بخدمتكم على مدار الساعة (24/7).

كيف يمكننا مساعدتكم اليوم؟
1️⃣ لطلب كابتن فوراً (أرسل *1*)
2️⃣ للاطلاع على قائمة الأسعار (أرسل *2*)
3️⃣ للاستفسار عن الاشتراكات الشهرية (أرسل *3*)
4️⃣ للتحدث مع الإدارة مباشرة (أرسل *4*)

أو اكتب استفسارك مباشرة وسنجيبك فوراً! 🚗💨`;
  }

  // 9. الشكر والإنهاء
  if (
    cleanInput.includes('شكرا') ||
    cleanInput.includes('شكراً') ||
    cleanInput.includes('تسلم') ||
    cleanInput.includes('تمام') ||
    cleanInput.includes('ما قصرت')
  ) {
    return `على الرحب والسعة! دائماً في خدمتكم على مدار الساعة (24/7) 🌟
مع تحيات فريق *خدمات قطرة الندى للتوصيل السريع*. 🚗💨`;
  }

  // Default Smart Fallback Menu
  return `أهلاً بك في *خدمات قطرة الندى للتوصيل والنقل السريع* (700+ سيارة بخدمتكم) 🚗✨

يسعدنا مساعدتك في:
1️⃣ *طلب كابتن فوري*: أرسل تفاصيل الطلب وسنوجه لك أقرب كابتن فوراً.
2️⃣ *الأسعار*: داخلي 2 د.أ | عمّان 3 د.أ | المحافظات 5 د.أ (الدفع كاش مسبق).
3️⃣ *الاشتراكات*: باقات يومية وشهرية للمطاعم والمحلات.
4️⃣ *التواصل المباشر*: هاتف ${managerPhone} 📞

أرسل رقم الخيار أو اكتب استفسارك مباشرة وسنرد عليك فوراً! 🤝`;
}
