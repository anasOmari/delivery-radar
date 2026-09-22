import { NextRequest, NextResponse } from 'next/server';
import { generateBotReply } from '@/lib/chatbotEngine';
import { collectBookingDetails, isBookingConfirmation } from '@/lib/orderBooking';
import { bookingStorageAvailable, claimWebhook, completeWebhook, recentChatHistory, releaseWebhook, saveBotMessage, saveConfirmedOrder } from '@/lib/botOrdersDb';
import { getServerWhatsAppConfigAsync } from '../config/route';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/chatbotConfig';

export async function GET() {
  return NextResponse.json({ status: 'online', service: 'WhatsApp booking webhook', bookingStorage: await bookingStorageAvailable() ? 'ready' : 'unavailable' });
}

function incomingMessage(body: Record<string, any>): { text: string; isLocation: boolean } {
  const data = body.messageData || {};
  if (data.typeMessage === 'locationMessage' || data.locationMessageData) {
    const loc = data.locationMessageData || {};
    if (Number.isFinite(Number(loc.latitude)) && Number.isFinite(Number(loc.longitude))) {
      return { text: `موقع جغرافي: https://maps.google.com/?q=${loc.latitude},${loc.longitude}${loc.address ? ` ${loc.address}` : ''}`, isLocation: true };
    }
    return { text: '', isLocation: true };
  }
  if (data.typeMessage === 'buttonsResponseMessage' || data.buttonsResponseMessage || data.templateButtonReplyMessage) {
    return { text: String(data.buttonsResponseMessage?.selectedDisplayText || data.templateButtonReplyMessage?.selectedDisplayText || data.buttonsResponseMessage?.selectedButtonId || data.templateButtonReplyMessage?.selectedId || ''), isLocation: false };
  }
  return { text: String(data.textMessageData?.textMessage || data.extendedTextMessageData?.text || data.textMessage || '').slice(0, 4000), isLocation: false };
}

async function fallbackHistory(phone: string, limit: number): Promise<ChatMessage[]> {
  const { data, error } = await supabase.from('whatsapp_messages')
    .select('message_text,direction,lead_name').eq('phone', phone)
    .order('created_at', { ascending: false }).limit(Math.min(limit, 20));
  if (error) return [];
  return (data || []).filter(row => row.direction === 'inbound' || ['بوت الرد الآلي', 'قطرة الندى AI Bot'].includes(row.lead_name || ''))
    .reverse().map(row => ({ role: row.direction === 'inbound' ? 'user' : 'assistant', text: row.message_text }));
}

export async function POST(req: NextRequest) {
  let messageId = '';
  let claimed = false;
  try {
    const body = await req.json();
    if (body.typeWebhook !== 'incomingMessageReceived') return NextResponse.json({ success: true, ignored: true });
    const chatId = String(body.senderData?.chatId || body.senderData?.sender || '');
    if (!/^\d{8,18}@c\.us$/.test(chatId)) return NextResponse.json({ success: true, ignored: true });
    messageId = String(body.idMessage || '');
    if (!/^[a-zA-Z0-9_-]{8,128}$/.test(messageId)) return NextResponse.json({ success: false, error: 'Invalid message id' }, { status: 400 });
    const customerPhone = chatId.replace('@c.us', '');
    const customerName = String(body.senderData?.senderName || 'عميل واتساب').slice(0, 120);
    const { text, isLocation } = incomingMessage(body);
    if (!text.trim()) return NextResponse.json({ success: true, ignored: true });
    const config = await getServerWhatsAppConfigAsync();
    if (config.chatbotEnabled === false) return NextResponse.json({ success: true, ignored: true, reason: 'bot_disabled' });
    const green = config.greenapi;
    if (!green?.idInstance || !green?.apiTokenInstance) return NextResponse.json({ success: false, error: 'Green-API is not configured' }, { status: 503 });
    if (body.instanceData?.idInstance && String(body.instanceData.idInstance) !== String(green.idInstance)) return NextResponse.json({ success: false, error: 'Wrong instance' }, { status: 403 });
    let storageReady = false;
    try {
      claimed = await claimWebhook(messageId);
      if (!claimed) return NextResponse.json({ success: true, duplicate: true });
      storageReady = true;
    } catch (error) {
      console.error('Booking storage unavailable; continuing WhatsApp reply:', error);
    }

    let history: ChatMessage[] = [];
    if (storageReady) {
      try { history = await recentChatHistory(customerPhone, config.historyMessages ?? 16); }
      catch (error) { console.error('Booking history unavailable:', error); }
    }
    if (!history.length) history = await fallbackHistory(customerPhone, config.historyMessages ?? 16).catch(() => []);
    const details = collectBookingDetails(history, text, config);
    const confirmingOrder = !isLocation && isBookingConfirmation(text, history) && Boolean(details.origin && details.destination && details.when);
    let reply = isLocation
      ? 'وصلني الموقع. هل هو موقع الاستلام أم التسليم؟ اكتب المنطقة الأخرى والوقت المطلوب حتى أكمل تسجيل الطلب.'
      : (await generateBotReply(text, { ...config, customerPhone }, history)).text;
    if (!reply) { if (claimed) await releaseWebhook(messageId).catch(() => {}); return NextResponse.json({ success: true, ignored: true }); }

    let orderId: string | null = null;
    if (confirmingOrder && storageReady) {
      try {
        orderId = await saveConfirmedOrder(details, { customerPhone, customerName, sourceMessageId: messageId });
        reply += `\nرقم الطلب: ${orderId.slice(0, 8)}. ستراجعه الإدارة عبر شاشة الطلبات.`;
      } catch (error) {
        console.error('Could not save confirmed booking:', error);
      }
    }
    if (confirmingOrder && !orderId) {
      reply = `استلمت تفاصيل طلبك، لكن تعذر تثبيته رسميًا الآن. رجاءً تواصل مع الإدارة على ${config.managerPhone || 'رقم التواصل المعتاد'} للتأكيد، وسأحاول مجددًا عند توفر النظام.`;
    }

    const baseUrl = String(green.apiUrl || `https://${String(green.idInstance).slice(0, 4)}.api.greenapi.com`).replace(/\/$/, '');
    const response = await fetch(`${baseUrl}/waInstance${String(green.idInstance).trim()}/sendMessage/${String(green.apiTokenInstance).trim()}`, {
      method: 'POST', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message: reply }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.idMessage) {
      if (claimed) await releaseWebhook(messageId).catch(() => {});
      return NextResponse.json({ success: false, error: 'WhatsApp send failed' }, { status: 502 });
    }
    if (storageReady) {
      await completeWebhook(messageId).catch(error => console.error('Could not complete webhook receipt:', error));
      await saveBotMessage(customerPhone, text, 'inbound', customerName).catch(error => console.error('Could not log inbound message:', error));
      await saveBotMessage(customerPhone, reply, 'outbound', 'بوت الرد الآلي').catch(error => console.error('Could not log outbound message:', error));
    } else {
      await supabase.from('whatsapp_messages').insert([
        { phone: customerPhone, message_text: text, direction: 'inbound', status: 'delivered', lead_name: customerName },
        { phone: customerPhone, message_text: reply, direction: 'outbound', status: 'sent', lead_name: 'بوت الرد الآلي' },
      ]).then(({ error }) => { if (error) console.error('Fallback message log failed:', error); });
    }
    return NextResponse.json({ success: true, replySent: true, orderId, idMessage: result.idMessage });
  } catch (error) {
    if (claimed && messageId) await releaseWebhook(messageId).catch(() => {});
    console.error('WhatsApp booking webhook error:', error);
    return NextResponse.json({ success: false, error: 'Booking webhook failed' }, { status: 500 });
  }
}
