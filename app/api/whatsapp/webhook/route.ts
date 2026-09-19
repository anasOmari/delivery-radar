import { NextRequest, NextResponse } from 'next/server';
import { processChatbotMessage } from '@/lib/chatbotEngine';
import { getWhatsAppConfig } from '@/lib/whatsappProviders';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'online',
    service: 'Green-API WhatsApp Smart Chatbot Webhook',
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

    // Extract text from textMessage or extendedTextMessage
    let incomingText =
      body.messageData?.textMessageData?.textMessage ||
      body.messageData?.extendedTextMessageData?.text ||
      body.messageData?.textMessage ||
      '';

    if (!incomingText || typeof incomingText !== 'string' || !incomingText.trim()) {
      return NextResponse.json({ success: true, message: 'No readable text in message' });
    }

    // Load server/local config
    const config = getWhatsAppConfig();
    const green = config.greenapi;

    if (!green?.idInstance || !green?.apiTokenInstance) {
      console.warn('Green-API credentials not found on server for webhook auto-reply.');
      return NextResponse.json({ success: false, error: 'Green-API not configured' });
    }

    // Process with Smart AI Chatbot Engine
    const botReply = processChatbotMessage(incomingText, chatId, {
      enabled: config.chatbotEnabled !== false,
      managerPhone: config.managerPhone || '0788779463',
    });

    if (!botReply) {
      return NextResponse.json({ success: true, message: 'No reply generated' });
    }

    // Determine Green-API base URL
    let baseUrl = 'https://api.green-api.com';
    if (green.apiUrl && green.apiUrl.trim()) {
      baseUrl = green.apiUrl.trim().replace(/\/$/, '');
    } else if (green.idInstance && green.idInstance.length >= 4) {
      baseUrl = `https://${green.idInstance.slice(0, 4)}.api.greenapi.com`;
    }

    const sendUrl = `${baseUrl}/waInstance${green.idInstance.trim()}/sendMessage/${green.apiTokenInstance.trim()}`;

    // Send the reply back to the customer
    const res = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chatId,
        message: botReply,
      }),
    });

    const sendData = await res.json();

    return NextResponse.json({
      success: true,
      chatId,
      incoming: incomingText,
      replySent: sendData.idMessage ? true : false,
      idMessage: sendData.idMessage,
    });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown webhook error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
