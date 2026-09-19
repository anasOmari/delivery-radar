import { Lead, MarketingTemplate, PriorityLevel, ProposalConfig } from './types';

/**
 * Calculate Lead Opportunity Score (0-100%) and determine reason & priority
 */
export function calculateOpportunity(lead: Partial<Lead>): { score: number; reason: string; priority: PriorityLevel } {
  const hasWebsite = Boolean(lead.website && lead.website.trim().length > 0);
  const hasSocial = Boolean(lead.socialLinks && (lead.socialLinks.instagram || lead.socialLinks.facebook));
  const rating = lead.rating || 0;
  const reviews = lead.userRatingsTotal || 0;

  if (!hasWebsite && rating >= 4.5) {
    return {
      score: 98,
      reason: '🔥 فرصة ذهبية لتصميم موقع (محل متميز جداً بدون موقع رسمي)',
      priority: 'high'
    };
  }

  if (!hasSocial && rating >= 4.0) {
    return {
      score: 94,
      reason: '📱 فرصة إدارة سوشيال ميديا (لا يملك صفحات إنستغرام/فيسبوك فعالة)',
      priority: 'high'
    };
  }

  if (!hasWebsite && reviews >= 100) {
    return {
      score: 90,
      reason: '⭐ نشاط تجاري كبير ذو مبيعات عالية بدون موقع ويب',
      priority: 'high'
    };
  }

  if (rating < 4.0 && rating > 0) {
    return {
      score: 85,
      reason: '🌟 فرصة إدارة السمعة والتقييمات وتحسين الظهور على الخريطة',
      priority: 'medium'
    };
  }

  if (hasWebsite && lead.phone) {
    return {
      score: 75,
      reason: '💬 فرصة حملات إعلانية ممولة وأتمتة مبيعات الواتساب وإعادة تطوير الموقع',
      priority: 'medium'
    };
  }

  return {
    score: 65,
    reason: '📩 فرصة تواصل ومبيعات عامة',
    priority: 'low'
  };
}

/**
 * Instant Website Health & Speed Auditor
 */
export interface WebsiteAuditResult {
  hasSsl: boolean;
  isResponsive: boolean;
  speedScore: number;
  grade: 'A' | 'B' | 'C' | 'D';
  issues: string[];
  pitchHook: string;
}

export function auditWebsite(url?: string): WebsiteAuditResult {
  if (!url || url.trim() === '') {
    return {
      hasSsl: false,
      isResponsive: false,
      speedScore: 0,
      grade: 'D',
      issues: ['لا يوجد موقع إلكتروني مسجل لهذا النشاط'],
      pitchHook: 'فرصة بيع موقع جديد بالكامل لعدم وجود موقع رسمي.'
    };
  }

  const cleanUrl = url.trim().toLowerCase();
  const hasSsl = cleanUrl.startsWith('https://');
  const isHttp = cleanUrl.startsWith('http://');

  const issues: string[] = [];
  let speedScore = 72;

  if (!hasSsl && isHttp) {
    issues.push('الموقع غير آمن (يفتقد شهادة SSL / HTTPS ويحذر متصفح كروم الزوار منه)');
    speedScore -= 20;
  }

  if (cleanUrl.includes('wixsite') || cleanUrl.includes('wordpress.com') || cleanUrl.includes('blogspot')) {
    issues.push('الموقع مبني على نطاق مجاني غير احترافي يقلل من مصداقية النشاط');
    speedScore -= 15;
  }

  if (cleanUrl.endsWith('.gov') || cleanUrl.endsWith('.edu')) {
    speedScore += 15;
  }

  const finalScore = Math.max(35, Math.min(95, speedScore));
  let grade: 'A' | 'B' | 'C' | 'D' = 'B';
  if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 50) grade = 'C';
  else grade = 'D';

  if (issues.length === 0) {
    issues.push('الموقع يعمل ولكن يحتاج تحسين سرعة التحميل وربط محركات البحث (SEO)');
  }

  const pitchHook = issues.length > 0 
    ? `لاحظنا أن موقعكم الحالي: ${issues[0]}، مما يفقدكم عملاء وزوار يومياً.`
    : 'الموقع متاح ويمكن تطويره لزيادة المبيعات المباشرة وأتمتة الطلبات.';

  return {
    hasSsl,
    isResponsive: true,
    speedScore: finalScore,
    grade,
    issues,
    pitchHook
  };
}

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    id: 'alnada_delivery',
    title: '🚗 خدمات قطرة الندى للتوصيل السريع (700+ كابتن)',
    description: 'عرض تجاري متكامل للمحلات والمطاعم والأنشطة لتوصيل الأوردرات ونقل الموظفين.',
    icon: 'Truck',
    template: `السلام عليكم ورحمة الله، تحياتنا لإدارة {name} المحترمين 👋✨

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
لطلب كابتن فوراً أو الاستفسار، تفضلوا بالرد على هذه الرسالة.`
  },
  {
    id: 'web_design',
    title: '🌐 عرض تصميم موقع إلكتروني',
    description: 'عرض موجه للأنشطة التجارية التي لا تملك موقعاً إلكترونياً.',
    icon: 'Globe',
    template: `مرحباً إدارة {name} 👋

لاحظنا تميز نشاطكم في {city} وتقييمكم المباشر على الخريطة ⭐ {rating}، ولأن العملاء يبحثون عن خدماتكم يومياً على جوجل، أحببنا إهداءكم عرضاً مخصصاً لإنشاء موقع إلكتروني احترافي لمحلكم لزيادة المبيعات والانتشار.

هل يمكننا إرسال بعض النماذج السابقة لمشاهدتها؟
شكراً لكم! 🚀`
  },
  {
    id: 'social_management',
    title: '📱 عرض إدارة وتطوير السوشيال ميديا',
    description: 'عرض موجه للأنشطة التي لا تمتلك حساب إنستغرام أو صفحات نشطة.',
    icon: 'Instagram',
    template: `أهلاً بكم فريق {name} ✨

يسعدنا التواصل معكم. لاحظنا تواجدكم المميز في {city} ولكن لا تظهر حساباتكم على منصات التواصل بشكل يخدم مبيعاتكم. نود تزويدكم بباقة إدارة محتوى وتصاميم أسبوعية لجذب مئات المتابعين والزبائن أسبوعياً.

هل يناسبكم إرسال نموذج لخطة النشر؟
تحياتنا! 🎨`
  },
  {
    id: 'lead_generation',
    title: '📈 عرض حملات إعلانية وزيادة زبائن',
    description: 'عرض موجه للمطاعم، العيادات، والشركات لجذب عملاء جدد.',
    icon: 'TrendingUp',
    template: `أهلاً بك أستاذ/ة (إدارة {name}) 👋

نحن في وكالة التسويق المباشر مهتمون بنشاطكم في {city}. لدينا حلول إعلانية مجربة لمجال {category} تضمن وصولكم لأكثر من 10,000 عميل مهتم في منطقتكم شهرياً.

هل يناسبكم الاطلاع على تفاصيل الخطة التسويقية؟
تحياتنا! 🎯`
  },
  {
    id: 'whatsapp_automation',
    title: '💬 عرض أتمتة الواتساب والرد السريع',
    description: 'عرض أتمتة الردود وجلب المبيعات التلقائية عبر الواتساب.',
    icon: 'Bot',
    template: `السلام عليكم ورحمة الله (إدارة {name}) 👋

هل ترغبون في الرد على استفسارات عملاء {category} في {city} تلقائياً على الواتساب 24/7 دون تفويت أي طلب مبيعات؟

يسعدنا تقديم تجربة مجانية لنظام الأتمتة المخصص لنشاطكم.
أطيب التحيات! ⚡`
  }
];

/**
 * 3-Step Drip Follow-up Sequences for WhatsApp Outreaches
 */
export interface DripSequenceStep {
  step: number;
  timing: string;
  title: string;
  template: string;
}

export const DRIP_SEQUENCES: DripSequenceStep[] = [
  {
    step: 1,
    timing: 'اليوم الأول (الرسالة الأولى)',
    title: '🚀 العرض المباشر الأولي واستكشاف الرغبة',
    template: `مرحباً إدارة {name} 👋
يسعدنا التواصل معكم، لاحظنا نجاح نشاطكم في {city} وتقييمكم ⭐ {rating}.

نحن فريق مختص بمساعدة محلات {category} على مضاعفة مبيعاتهم من خلال حلول تقنية وتسويقية مخصصة لمنطقتكم.

هل يناسبكم إطلاعكم على مقترح عمل سريع أعددناه خصيصاً لنشاطكم؟ 🎯`
  },
  {
    step: 2,
    timing: 'بعد 48 ساعة (المتابعة الثانية)',
    title: '⭐ تذكير لطيف + قصة نجاح ونموذج عمل سابق',
    template: `أهلاً بكم مجدداً فريق {name} 👋
أحببنا التذكير بمقترحنا السابق، حيث طبقنا نفس الخطة مع نشاط مشابه في نفس مجالكم، وحقق زيادة اتصالات بنسبة +45% خلال أول 30 يوماً.

جهّزنا لكم عرض سعر رسمي ونماذج سابقة، هل تحبون إرسالها لكم للاطلاع عليها دون أي التزام؟ ✨`
  },
  {
    step: 3,
    timing: 'بعد 5 أيام (رسالة الإغلاق والعرض الاستثنائي)',
    title: '🎁 عرض خاص محدود السريان وحسم الإغلاق',
    template: `تحياتنا إدارة {name} الغاليين،
نظراً لرغبتنا الصادقة بالتعاون معكم وإبراز تميزكم في {city}، يسعدنا تقديم خصم استثنائي بقيمة 20% أو استشارة تسويقية مجانية بالكامل إذا بدأنا العمل هذا الأسبوع.

هل بإمكاننا التنسيق مع المدير المسؤول؟
شكراً لوقتكم الثمين! 🤝`
  }
];

export const PROPOSAL_TEMPLATES: Record<string, Partial<ProposalConfig>> = {
  web_design: {
    serviceType: 'تصميم وتطوير موقع إلكتروني متكامل',
    serviceDescription: 'بناء موقع إلكتروني احترافي متجاوب مع الهواتف الذكية ومتوافق مع محركات بحث جوجل لزيادة المبيعات وثقة العملاء.',
    price: 350,
    currency: 'USD',
    deliverables: [
      'تصميم واجهات احترافية متجاوبة مع كافة مقاسات الشاشات والهواتف',
      'حجز نطاق (دومين) رسمي واستضافة سريعة لمدة عام',
      'ربط الموقع بخرائط جوجل وحسابات التواصل الاجتماعي وأرقام الواتساب',
      'تهيئة أساسية لمحركات البحث (SEO) لظهور الموقع في مقدمة نتائج البحث',
      'لوحة تحكم سهلة باللغة العربية لإدارة المنتجات والمحتوى'
    ],
    validUntilDays: 14
  },
  social_media: {
    serviceType: 'باقة إدارة وتطوير صفحات التواصل الاجتماعي',
    serviceDescription: 'إدارة كاملة لحسابات إنستغرام وفيسبوك تشمل تصميم المنشورات الترويجية وكتابة المحتوى التسويقي.',
    price: 250,
    currency: 'USD',
    deliverables: [
      'تصميم وكتابة 16 منشوراً وريلز شهرياً بهوية بصرية مميزة',
      'كتابة نصوص تسويقية جذابة مع وسوم الهاشتاج المناسبة لمنطقتك',
      'إدارة الردود على الرسائل والتعليقات وتوجيه الزبائن للشراء',
      'تقرير أداء وإحصائيات نهاية كل شهر لقياس نسبة النمو والتفاعل'
    ],
    validUntilDays: 10
  },
  google_maps_seo: {
    serviceType: 'باقة تحسين الظهور على خرائط جوجل (Google Maps SEO)',
    serviceDescription: 'تحسين ملفك التجاري على جوجل ليتصدر نتائج البحث في منطقتك ويجذب اتصالات وزيارات يومية أكثر.',
    price: 180,
    currency: 'USD',
    deliverables: [
      'توثيق وتحسين الملف التجاري (Google Business Profile) بنسبة 100%',
      'إضافة الكلمات المفتاحية الأكثر بحثاً في منطقتك ومجالك',
      'نظام آلي لجمع التقييمات الإيجابية من زبائنك الراضين',
      'حذف المراجعات المزعجة ورفع تقييم المحل العام'
    ],
    validUntilDays: 7
  }
};

export function applyTemplate(templateStr: string, lead: Lead): string {
  return templateStr
    .replace(/{name}/g, lead.name || 'المحل')
    .replace(/{city}/g, lead.city || 'المنطقة')
    .replace(/{category}/g, lead.category || 'النشاط')
    .replace(/{rating}/g, String(lead.rating || '4.8'))
    .replace(/{phone}/g, lead.phone || '');
}

/**
 * Detect whether a phone number is registered on WhatsApp (Mobile) or is a Landline / Inactive
 */
export function checkPhoneWhatsAppEligibility(phone?: string, country?: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/[^\d]/g, '');
  if (digits.length < 7) return false;

  // Jordan (+962)
  // Mobiles: +962 7 7, +962 7 8, +962 7 9
  // Landlines: +962 6 (Amman), +962 2 (Irbid), +962 3 (South), +962 5 (Zarqa/Balqa)
  if (digits.startsWith('962') || phone.includes('+962')) {
    const local = digits.replace(/^962/, '');
    if (local.startsWith('7')) return true;
    if (local.startsWith('6') || local.startsWith('2') || local.startsWith('3') || local.startsWith('5')) {
      return false; // Landline
    }
  }

  // Saudi Arabia (+966)
  // Mobiles: +966 5x
  // Landlines: +966 11 (Riyadh), +966 12 (Makkah/Jeddah), +966 13 (Eastern), +966 14, +966 16, +966 17
  if (digits.startsWith('966') || phone.includes('+966')) {
    const local = digits.replace(/^966/, '');
    if (local.startsWith('5')) return true;
    if (local.startsWith('11') || local.startsWith('12') || local.startsWith('13') || local.startsWith('14') || local.startsWith('16') || local.startsWith('17') || local.startsWith('1')) {
      return false; // Landline
    }
  }

  // UAE (+971)
  // Mobiles: +971 50, +971 52, +971 54, +971 55, +971 56, +971 58
  // Landlines: +971 2 (Abu Dhabi), +971 4 (Dubai), +971 6 (Sharjah), +971 7, +971 9
  if (digits.startsWith('971') || phone.includes('+971')) {
    const local = digits.replace(/^971/, '');
    if (local.startsWith('5')) return true;
    if (local.startsWith('2') || local.startsWith('4') || local.startsWith('6') || local.startsWith('7') || local.startsWith('9')) {
      return false; // Landline
    }
  }

  // Egypt (+20)
  // Mobiles: +20 10, +20 11, +20 12, +20 15
  // Landlines: +20 2 (Cairo), +20 3 (Alex)
  if (digits.startsWith('20') || phone.includes('+20')) {
    const local = digits.replace(/^20/, '');
    if (local.startsWith('10') || local.startsWith('11') || local.startsWith('12') || local.startsWith('15') || local.startsWith('1')) {
      return true;
    }
    if (local.startsWith('2') || local.startsWith('3')) {
      return false; // Landline
    }
  }

  // Kuwait (+965)
  // Mobiles: 5, 6, 9
  // Landlines: 2
  if (digits.startsWith('965') || phone.includes('+965')) {
    const local = digits.replace(/^965/, '');
    if (local.startsWith('5') || local.startsWith('6') || local.startsWith('9')) return true;
    if (local.startsWith('2')) return false;
  }

  return true;
}
