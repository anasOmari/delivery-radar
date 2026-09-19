import { NextRequest, NextResponse } from 'next/server';
import { processChatbotMessageAI } from '@/lib/chatbotEngine';
import { logWhatsAppMessageToSupabase, syncLeadsToSupabase } from '@/lib/supabase';
import { getServerWhatsAppConfigAsync } from '../config/route';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'Green-API WhatsApp Smart Chatbot Webhook (Location & Interactive Enabled)',
    timestamp: new Date().toISOString(),
    instructions: 'Set this endpoint URL as the Incoming Webhook URL in your Green-API Console.',
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Only process incoming messages from users
    if (body.typeWebhook !== 'incomingMessageReceived') {
      return NextResponse.json({ success: true, message: 'Ignored non-incoming webhook event' });
    }

    const chatId = body.senderData?.chatId || body.senderData?.sender;
    if (!chatId || chatId.endsWith('@g.us')) {
      // Ignore group chats or invalid chat IDs
      return NextResponse.json({ success: true, message: 'Ignored group or empty sender' });
    }

    const senderPhone = chatId.replace('@c.us', '');
    const senderName = body.senderData?.senderName || 'عميل واتساب';
    const messageData = body.messageData || {};

    let incomingText = '';
    let isLocation = false;
    let locationData: { latitude: number; longitude: number; name?: string; address?: string } | null = null;

    // 1. Check for incoming Location Map Pin (مشاركة الموقع الجغرافي)
    if (
      messageData.typeMessage === 'locationMessage' ||
      messageData.locationMessageData
    ) {
      isLocation = true;
      const loc = messageData.locationMessageData || {};
      locationData = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        name: loc.name || loc.nameLocation || '',
        address: loc.address || '',
      };
      const mapUrl = `https://maps.google.com/?q=${loc.latitude},${loc.longitude}`;
      incomingText = `📍 موقع جغرافي على الخريطة: ${mapUrl} ${loc.address ? `(${loc.address})` : ''}`;

      // Save / Update Lead in Supabase with location coordinates
      syncLeadsToSupabase([
        {
          name: senderName,
          phone: senderPhone,
          address: loc.address || mapUrl,
          notes: `موقع GPS: ${mapUrl}`,
          status: 'interested',
        },
      ]).catch(() => {});
    }
    // 2. Check for Button Responses (استجابة الأزرار التفاعلية)
    else if (
      messageData.typeMessage === 'buttonsResponseMessage' ||
      messageData.buttonsResponseMessage ||
      messageData.templateButtonReplyMessage
    ) {
      incomingText =
        messageData.buttonsResponseMessage?.selectedButtonId ||
        messageData.buttonsResponseMessage?.selectedDisplayText ||
        messageData.templateButtonReplyMessage?.selectedId ||
        messageData.templateButtonReplyMessage?.selectedDisplayText ||
        '';
    }
    // 3. Normal text / media caption message
    else {
      incomingText =
        messageData.textMessageData?.textMessage ||
        messageData.extendedTextMessageData?.text ||
        messageData.textMessage ||
        '';
    }

    if (!incomingText || typeof incomingText !== 'string' || !incomingText.trim()) {
      return NextResponse.json({ success: true, message: 'No readable text or location in message' });
    }

    // Load server config from Supabase / env
    const config = await getServerWhatsAppConfigAsync();
    const green = config.greenapi;

    if (!green?.idInstance || !green?.apiTokenInstance) {
      console.warn('Green-API credentials missing on server. idInstance:', green?.idInstance);
      return NextResponse.json({ success: false, error: 'Green-API credentials missing on server' });
    }

    // Determine Green-API base URL
    let baseUrl = 'https://api.green-api.com';
    if (green.apiUrl && green.apiUrl.trim()) {
      baseUrl = green.apiUrl.trim().replace(/\/$/, '');
    } else if (green.idInstance && green.idInstance.length >= 4) {
      baseUrl = `https://${green.idInstance.slice(0, 4)}.api.greenapi.com`;
    }

    const managerPhone = config.managerPhone || '0788779463';
    let botReply = '';

    // If customer sent a Location Pin on WhatsApp
    if (isLocation && locationData) {
      const mapUrl = `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`;
      botReply = `📍 *تم استلام موقعك الجغرافي بنجاح!* 🚗💨
🗺️ *رابط الخريطة:* ${mapUrl}

جاري الآن تحديد وتوجيه أقرب كابتن من أسطول *خدمات قطرة الندى (700+ سيارة)* لموقعكم فوراً!

يرجى تزويدنا في رسالة واحدة بـ:
1️⃣ *موقع التسليم (منطقة الزبون)*:
2️⃣ *رقم هاتف المستلم*:
3️⃣ *قيمة الطلب الكاش المطلوب تحصيلها (إن وجدت)*:

⚡ الكابتن سيدفع لك كامل المبلغ كاش مسبقاً لحظة استلام الطلب من موقعك! 💵`;
    } else {
      // Process with Smart AI Chatbot Engine (LLM + NLP)
      botReply = await processChatbotMessageAI(incomingText, chatId, {
        enabled: config.chatbotEnabled !== false,
        managerPhone: managerPhone,
        aiApiKey: config.aiApiKey || process.env.GEMINI_API_KEY,
      });
    }

    if (!botReply) {
      return NextResponse.json({ success: true, message: 'No reply generated' });
    }

    // Log inbound customer message to Supabase
    logWhatsAppMessageToSupabase({
      phone: senderPhone,
      messageText: incomingText,
      direction: 'inbound',
      status: 'delivered',
      leadName: senderName,
    }).catch(() => {});

    // Try sending native Green-API Interactive Buttons if user greeted or requested menu
    const isMenuTrigger =
      incomingText.includes('مرحبا') ||
      incomingText.includes('سلام') ||
      incomingText.includes('الوو') ||
      incomingText.includes('الو') ||
      incomingText.includes('قائمة') ||
      incomingText.includes('خيارات');

    let sendSuccess = false;
    let sendId = '';

    if (isMenuTrigger) {
      // Try sending with Green-API sendButtons
      try {
        const buttonsUrl = `${baseUrl}/waInstance${green.idInstance.trim()}/sendButtons/${green.apiTokenInstance.trim()}`;
        const buttonRes = await fetch(buttonsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            message: botReply,
            buttons: [
              { buttonId: '1', buttonText: '🚗 طلب كابتن فوري' },
              { buttonId: '2', buttonText: '💰 قائمة الأسعار' },
              { buttonId: '3', buttonText: '📋 اشتراكات المحلات' },
            ],
          }),
        });

        const btnData = await buttonRes.json();
        if (btnData.idMessage) {
          sendSuccess = true;
          sendId = btnData.idMessage;
        }
      } catch {}
    }

    // Fallback to standard text message if buttons not applicable or failed
    if (!sendSuccess) {
      const sendTextUrl = `${baseUrl}/waInstance${green.idInstance.trim()}/sendMessage/${green.apiTokenInstance.trim()}`;
      const res = await fetch(sendTextUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: botReply,
        }),
      });

      const sendData = await res.json();
      sendId = sendData.idMessage || '';
      sendSuccess = !!sendData.idMessage;
    }

    // Log outbound bot reply to Supabase
    if (sendId) {
      logWhatsAppMessageToSupabase({
        phone: senderPhone,
        messageText: botReply,
        direction: 'outbound',
        status: 'sent',
        leadName: 'قطرة الندى AI Bot',
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      chatId,
      incoming: incomingText,
      replySent: sendSuccess,
      idMessage: sendId,
      isLocation,
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown webhook error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
