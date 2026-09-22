'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  Phone,
  Check,
  Zap,
  HelpCircle,
  Copy,
  ExternalLink,
  MessageSquare,
  X
} from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { processChatbotMessageAI, ChatMessage } from '@/lib/chatbotEngine';
import { getWhatsAppConfig } from '@/lib/whatsappProviders';

interface ChatbotModalProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const ChatbotModal: React.FC<ChatbotModalProps> = ({ onClose, onOpenSettings }) => {
  const { t, locale } = useLanguage();
  const config = getWhatsAppConfig();
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
      });

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
        className="modal-box modal-lg chatbot-dialog"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          height: '85dvh',
          maxHeight: '750px',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="chatbot-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            background: 'var(--bg-surface-elevated, #1a1a24)',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div className="flex-align gap-2">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 10px rgba(37, 211, 102, 0.4)',
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div className="flex-align gap-2">
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {locale === 'ar' ? 'تجربة الردود التلقائية' : 'Test auto-replies'}
                </h3>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    background: 'rgba(37, 211, 102, 0.2)',
                    color: 'var(--whatsapp-color)',
                    fontWeight: 700,
                  }}
                >
                  {locale === 'ar' ? 'محاكاة' : 'Simulation'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-tertiary)' }}>
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
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            background: 'var(--bg-surface, #0f0f14)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((msg, index) => {
            const isBot = msg.role === 'bot';
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: isBot ? 'flex-start' : 'flex-end',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isBot ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                    background: isBot ? 'var(--bg-surface-elevated, #1c1c28)' : '#075E54',
                    color: isBot ? 'var(--text-primary)' : '#fff',
                    border: isBot ? '1px solid var(--border-default)' : 'none',
                    fontSize: '0.86rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    position: 'relative',
                  }}
                >
                  {isBot && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', fontSize: '0.72rem', color: 'var(--whatsapp-color)', fontWeight: 700 }}>
                      <Sparkles size={11} />
                      <span>قطرة الندى AI Bot</span>
                    </div>
                  )}
                  <div>{msg.text}</div>
                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: isBot ? 'var(--text-secondary)' : 'rgba(255,255,255,0.8)',
                      textAlign: isBot ? 'left' : 'right',
                      marginTop: '4px',
                    }}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: '14px',
                  background: 'var(--bg-surface-elevated, #1c1c28)',
                  border: '1px solid var(--border-default)',
                  fontSize: '0.78rem',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span className="spin">&#8635;</span>
                <span>{locale === 'ar' ? 'البوت يكتب رداً...' : 'Bot is typing...'}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div
          style={{
            padding: '8px 14px',
            background: 'var(--bg-surface-elevated, #161622)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(q)}
              style={{
                padding: '4px 10px',
                borderRadius: '14px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-surface-elevated, #1a1a24)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            gap: '8px',
          }}
        >
          <input
            type="text"
            placeholder={locale === 'ar' ? 'اكتب رسالة لتجربة رد الشات بوت...' : 'Type a test message for the AI chatbot...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '24px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
            }}
          />
          <button
            type="button"
            className="btn btn-whatsapp"
            onClick={() => handleSend()}
            disabled={!input.trim()}
            style={{
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--whatsapp-button)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
