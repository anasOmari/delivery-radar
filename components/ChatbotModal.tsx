'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { processChatbotMessageAI, ChatMessage } from '@/lib/chatbotEngine';
import { getWhatsAppConfig, WhatsAppConfig } from '@/lib/whatsappProviders';

interface ChatbotModalProps {
  onClose: () => void;
  onOpenSettings?: () => void;
  configOverride?: WhatsAppConfig;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ onClose, onOpenSettings, configOverride }) => {
  const { t, locale } = useLanguage();
  const config = configOverride || getWhatsAppConfig();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      text: locale === 'ar' ? 'أرسل رسالة لتجربة الردود التلقائية.' : 'Send a message to test auto-replies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    const history = messages.filter((_, index) => index > 0);
    if (!text) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Pass the FULL saved brain so the simulator tests the real live behavior.
      const replyText = await processChatbotMessageAI(text, 'simulator_user', {
        ...config,
        chatbotEnabled: true,
        managerPhone: config.managerPhone || '0788779463',
        aiApiKey: config.aiApiKey,
      }, history);

      const botMsg: ChatMessage = {
        role: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.warn('Chatbot AI error:', e);
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        role: 'bot',
        text: `تمت إعادة ضبط المحادثة. كيف يمكنني مساعدتك؟ 🚗✨`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const quickQuestions = [
    'كم سعر التوصيل؟ 💰',
    'بدي كابتن ضروري 🚗',
    'عندكم اشتراكات للمطاعم؟ 📋',
    'كيف نظام الدفع المسبق؟ 💵',
    'توصيل موظفين 👥',
    'بدي احكي مع الإدارة 📞',
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box modal-lg chatbot-dialog ui-chat-shell"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chatbot-header ui-chat-header">
          <div className="flex-align gap-2">
            <div className="ui-chat-avatar">
              <Bot size={20} />
            </div>
            <div>
              <div className="flex-align gap-2">
                <h3 className="ui-chat-title">
                  {locale === 'ar' ? 'تجربة الردود التلقائية' : 'Test auto-replies'}
                </h3>
                <span className="ui-status-pill ui-status-pill--whatsapp">
                  {locale === 'ar' ? 'محاكاة' : 'Simulation'}
                </span>
              </div>
              <p className="ui-chat-sub">
                {locale === 'ar' ? 'محاكاة حية للردود التلقائية التي سيتلقاها عملاؤك' : 'Real-time test of auto-replies for your clients'}
              </p>
            </div>
          </div>

          <div className="flex-align gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-icon btn-xs"
              onClick={handleReset}
              title={locale === 'ar' ? 'إعادة ضبط المحادثة' : 'Reset chat'}
            >
              <RotateCcw size={13} />
            </button>
            <button className="btn-close" onClick={onClose}>&times;</button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="ui-chat-messages">
          {messages.map((msg, index) => {
            const isBot = msg.role === 'bot';
            return (
              <div
                key={index}
                className={`ui-chat-row ${isBot ? 'ui-chat-row--bot' : 'ui-chat-row--user'}`}
              >
                <div className={`ui-chat-bubble ${isBot ? 'ui-chat-bubble--bot' : 'ui-chat-bubble--user'}`}>
                  {isBot && (
                    <div className="ui-chat-botlabel">
                      <Sparkles size={11} />
                      <span>قطرة الندى AI Bot</span>
                    </div>
                  )}
                  <div>{msg.text}</div>
                  <div className={`ui-chat-meta ${isBot ? 'ui-chat-meta--bot' : 'ui-chat-meta--user'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="ui-chat-row ui-chat-row--bot">
              <div className="ui-chat-typing">
                <span className="spin">&#8635;</span>
                <span>{locale === 'ar' ? 'البوت يكتب رداً...' : 'Bot is typing...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="ui-chat-chips">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className="preset-chip"
              onClick={() => handleSend(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="ui-chat-inputbar">
          <input
            type="text"
            className="ui-chat-input"
            placeholder={locale === 'ar' ? 'اكتب رسالة لتجربة رد الشات بوت...' : 'Type a test message for the AI chatbot...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            type="button"
            className="btn btn-whatsapp ui-chat-send"
            onClick={() => handleSend()}
            disabled={!input.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
