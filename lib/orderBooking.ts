import type { BotSettings, ChatMessage } from './chatbotConfig';

export interface BookingDetails {
  origin?: string;
  destination?: string;
  when?: string;
  item?: string;
  phone?: string;
  price?: string;
  priceKind?: 'same-area' | 'amman' | 'intercity';
  active: boolean;
}

const normalize = (value: string) => value.normalize('NFKC').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().trim();
const ammanAreas = ['ماركا', 'طبربور', 'الجبيهه', 'صويلح', 'خلدا', 'عبدون', 'الشميساني', 'الصويفيه', 'جبل عمان', 'الدوار السابع', 'تلاع العلي', 'ابو نصير', 'شفا بدران', 'سحاب', 'المقابلين', 'مرج الحمام', 'اليادوده', 'العبدلي', 'البيادر', 'دابوق'];
const cities = ['عمان', 'اربد', 'الزرقاء', 'العقبه', 'السلط', 'مادبا', 'جرش', 'عجلون', 'الكرك', 'الطفيله', 'معان', 'المفرق', 'الرمثا'];
const allPlaces = [...ammanAreas, ...cities];
const has = (text: string, words: string[]) => words.some(word => text.includes(normalize(word)));
const clean = (value: string) => value.replace(/\s+/g, ' ').trim();

function placeAfter(text: string, prepositions: RegExp): string | undefined {
  const match = text.match(prepositions);
  if (!match) return;
  const tail = normalize(match[1] || '');
  return allPlaces.find(place => tail.startsWith(place)) || undefined;
}

function extractPlaces(text: string): { origin?: string; destination?: string } {
  const origin = placeAfter(text, /(?:^|\s)(?:من|انطلاق(?:ي|نا)?\s*(?:من)?|استلام\s*(?:من)?|البدايه\s*(?:من)?)\s+([^،,.؟?\n]+)/i);
  const destination = placeAfter(text, /(?:^|\s)(?:الى|ل|وجهه\s*(?:الى)?|تسليم\s*(?:الى)?)\s*([^،,.؟?\n]+)/i);
  return { origin, destination };
}

function extractTime(text: string): string | undefined {
  const normalized = normalize(text);
  const date = normalized.match(/(?:بعد\s+بكر[اه]|بكر[اه]|غدا|اليوم|يوم\s+\S+)/);
  const hour = normalized.match(/(?:الساعه|ساعه)\s*(\d{1,2})(?::(\d{2}))?\s*(صباحا?|مساء|مساءً|الصبح|بالليل)?/);
  if (date && hour) return clean(`${date[0].split(/\s*الساعه/)[0]} الساعة ${hour[1]}${hour[2] ? ':' + hour[2] : ''}${hour[3] ? ' ' + hour[3] : ''}`);
  if (hour) return clean(hour[0]);
  if (date) return clean(date[0]);
}

function extractItem(text: string): string | undefined {
  const normalized = normalize(text);
  const item = ['اثاث', 'خزانه', 'طرد', 'طرود', 'وجبه', 'وجبات', 'اغراض', 'موظفين', 'ركاب', 'مستندات', 'ملابس'].find(word => normalized.includes(word));
  return item;
}

function configuredPrice(config: BotSettings, kind: 'same-area' | 'amman' | 'intercity'): string | undefined {
  const lines = (config.pricingText || '').split(/\n|\|/);
  const keywords = kind === 'same-area' ? ['نفس المنطقه', 'داخل المنطقه'] : kind === 'amman' ? ['داخل محافظه عمان', 'داخل عمان'] : ['بين المحافظات'];
  const line = lines.find(entry => has(normalize(entry), keywords));
  const amount = line?.match(/(?:^|\D)(\d+(?:[.,]\d+)?)\s*(?:دينار|دنانير|د\.?ا)/);
  return amount ? `${amount[1]} دنانير${kind === 'intercity' ? ' تبدأ من' : ''}` : undefined;
}

function getPrice(details: BookingDetails, config: BotSettings): Pick<BookingDetails, 'price' | 'priceKind'> {
  if (!details.origin || !details.destination) return {};
  const origin = normalize(details.origin), destination = normalize(details.destination);
  let kind: BookingDetails['priceKind'];
  if (origin === destination) kind = 'same-area';
  else if ([origin, destination].every(place => ammanAreas.includes(place) || place === 'عمان')) kind = 'amman';
  else if ([origin, destination].every(place => cities.includes(place)) && origin !== destination) kind = 'intercity';
  if (!kind) return {};
  const price = configuredPrice(config, kind);
  return price ? { price, priceKind: kind } : {};
}

export function collectBookingDetails(history: ChatMessage[], current: string, config: BotSettings): BookingDetails {
  const details: BookingDetails = { active: false };
  const userMessages = [...history.filter(message => message.role === 'user').map(message => message.text), current].slice(-20);
  for (const text of userMessages) {
    const norm = normalize(text);
    if (has(norm, ['بدي توصيل', 'توصيل', 'حجز', 'كابتن', 'عندي طلب', 'اوردر', 'بدي مشوار']) || /^1$/.test(norm)) details.active = true;
    const places = extractPlaces(text);
    if (places.origin) { details.origin = places.origin; details.active = true; }
    if (places.destination) { details.destination = places.destination; details.active = true; }
    const when = extractTime(text);
    if (when) { details.when = when; details.active = true; }
    const item = extractItem(text);
    if (item) { details.item = item; details.active = true; }
    const phone = text.match(/(?:\+?962|0)7\d{8}/);
    if (phone) details.phone = phone[0];
  }
  return { ...details, ...getPrice(details, config) };
}

export function isBookingConfirmation(text: string, history: ChatMessage[]): boolean {
  const norm = normalize(text).replace(/[.!؟?]/g, '');
  const lastReply = [...history].reverse().find(message => message.role !== 'user')?.text || '';
  return Boolean(lastReply.includes('هل أثبت الطلب') && /^(موافق|نعم|ايوه|ايوا|اكد|اكيد|ثبت|ثبته|احجز|تمام|ok|okay|yes|confirm)(\s+(الطلب|الحجز|نهائيا))?$/.test(norm));
}

export function bookingReply(text: string, config: BotSettings, history: ChatMessage[] = []): string | null {
  const details = collectBookingDetails(history, text, config);
  if (!details.active) return null;
  const confirm = isBookingConfirmation(text, history);
  const summary = [
    details.when && `الوقت: ${details.when}`,
    details.origin && `الانطلاق: ${details.origin}`,
    details.destination && `الوجهة: ${details.destination}`,
    details.price && `الأجرة: ${details.price}`,
    details.item && `نوع الطلب: ${details.item}`,
  ].filter(Boolean).join('، ');
  if (confirm) {
    if (!details.origin || !details.destination || !details.when) return `لإكمال طلبك أحتاج ${!details.origin ? 'موقع الانطلاق' : !details.destination ? 'الوجهة' : 'الوقت المطلوب'} أولًا. ${summary}`;
    return `تمام، ثبتنا تفاصيل طلبك في هذه المحادثة: ${summary}. ${details.phone ? `رقم المستلم: ${details.phone}. ` : ''}الطلب جاهز للمتابعة مع الإدارة، وسنؤكد لك تعيين الكابتن بعد ربط نظام الحجز الرسمي. لم يُرسل كابتن بعد.`;
  }
  const preface = summary ? `تمام يا غالي، سجلت تفاصيل الطلب: ${summary}. ` : 'تمام يا غالي، بسجّل طلبك. ';
  if (!details.destination) return `${preface}وين الوجهة؟`;
  if (!details.origin) return `${preface}من وين الانطلاق؟`;
  if (!details.when) return `${preface}متى بدك التوصيل؟`;
  if (!details.price) return `${preface}المسار يحتاج تسعيرًا حسب التفاصيل. هل أثبت الطلب للمتابعة مع الإدارة؟ وما نوع الأغراض؟`;
  return `${preface}هل أثبت الطلب نهائيًا للمتابعة مع الإدارة؟ وهل في تفاصيل إضافية مثل نوع الأغراض أو رقم المستلم؟`;
}
