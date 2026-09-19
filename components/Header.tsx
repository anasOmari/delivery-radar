'use client';

import React from 'react';
import { Building2, Key, Download, Upload, Sun, Moon, FolderKanban, Globe, MessageCircle, Send, Bot } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { Locale } from '@/lib/i18n';

interface HeaderProps {
  apiKey: string;
  onOpenApiKeyModal: () => void;
  onOpenMessageSettingsModal: () => void;
  onOpenDirectMessageModal: () => void;
  onOpenChatbotModal: () => void;
  onOpenExportModal: () => void;
  onOpenSavedListsModal: () => void;
  onOpenImportModal: () => void;
  leadsCount: number;
  selectedCount: number;
  dueFollowUpsCount: number;
  isLiveApi: boolean;
  isWhatsAppConfigured?: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiKey,
  onOpenApiKeyModal,
  onOpenMessageSettingsModal,
  onOpenDirectMessageModal,
  onOpenChatbotModal,
  onOpenExportModal,
  onOpenSavedListsModal,
  onOpenImportModal,
  selectedCount,
  isWhatsAppConfigured = false,
  theme,
  onToggleTheme
}) => {
  const { locale, setLocale, t } = useLanguage();

  const toggleLanguage = () => {
    const next: Locale = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
  };

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="brand-logo">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="brand-title">{t('app.name')}</h1>
          <p className="brand-subtitle">{t('app.tagline')}</p>
        </div>
      </div>

      <div className="header-nav">
        <button className="nav-item active">
          <span>{t('nav.dashboard')}</span>
        </button>
        <button className="nav-item">
          <span>{t('nav.leads')}</span>
        </button>
        <button className="nav-item">
          <span>{t('nav.campaigns')}</span>
        </button>
        <button className="nav-item">
          <span>{t('nav.proposals')}</span>
        </button>
      </div>

      <div className="header-actions">
        {/* Language Toggle */}
        <button
          className="lang-toggle"
          onClick={toggleLanguage}
          title={locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Globe size={15} />
          <span>{locale === 'ar' ? 'EN' : 'AR'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleTheme}
          title={theme === 'dark' ? t('header.theme.toggle') : t('header.theme.dark')}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Smart AI Chatbot Live Simulator */}
        <button
          className="btn btn-secondary"
          onClick={onOpenChatbotModal}
          style={{
            borderColor: 'rgba(37, 211, 102, 0.4)',
            background: 'rgba(37, 211, 102, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-primary)',
          }}
          title={locale === 'ar' ? 'شات بوت قطرة الندى الذكي (محاكي الردود الحية)' : 'AI Chatbot Live Simulator'}
        >
          <Bot size={16} style={{ color: '#25D366' }} />
          <span>{locale === 'ar' ? 'الشات بوت الذكي 🤖' : 'AI Chatbot 🤖'}</span>
        </button>

        {/* Direct Send to Specific Contact / Phone Number */}
        <button
          className="btn btn-whatsapp"
          onClick={onOpenDirectMessageModal}
          style={{
            background: '#25D366',
            color: '#fff',
            borderColor: '#25D366',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
          }}
          title={locale === 'ar' ? 'إرسال رسالة واتساب لرقم أو جهة محددة' : 'Send WhatsApp to Specific Number'}
        >
          <Send size={15} />
          <span>{locale === 'ar' ? 'إرسال لرقم محدد' : 'Direct Send'}</span>
        </button>

        {/* Message Settings (Green-API) */}
        <button
          className="btn btn-secondary"
          onClick={onOpenMessageSettingsModal}
          style={{
            borderColor: isWhatsAppConfigured ? 'rgba(37, 211, 102, 0.4)' : undefined,
            background: isWhatsAppConfigured ? 'rgba(37, 211, 102, 0.08)' : undefined,
            color: isWhatsAppConfigured ? '#25D366' : undefined,
          }}
          title={t('whatsapp.api.settings')}
        >
          <MessageCircle size={16} style={{ color: isWhatsAppConfigured ? '#25D366' : undefined }} />
          <span>{t('header.messages.settings')}</span>
          {isWhatsAppConfigured && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#25D366',
                display: 'inline-block',
                boxShadow: '0 0 6px #25D366',
              }}
            />
          )}
        </button>

        {/* Saved Campaigns */}
        <button className="btn btn-secondary" onClick={onOpenSavedListsModal}>
          <FolderKanban size={16} />
          <span>{t('header.campaigns')}</span>
        </button>

        {/* Import */}
        <button className="btn btn-secondary" onClick={onOpenImportModal}>
          <Upload size={16} />
          <span>{t('header.import')}</span>
        </button>

        {/* API Status */}
        <div
          className={`api-status-pill ${apiKey ? 'status-active' : 'status-demo'}`}
          onClick={onOpenApiKeyModal}
          title={t('header.api.settings')}
        >
          <span className="dot"></span>
          <span>{apiKey ? t('header.api.connected') : t('header.api.demo')}</span>
        </div>

        {/* Export */}
        <button className="btn btn-secondary" onClick={onOpenExportModal}>
          <Download size={16} />
          <span>{t('header.export')}</span>
          {selectedCount > 0 && <span className="badge-count">{selectedCount}</span>}
        </button>

        {/* Google API Settings */}
        <button className="btn btn-primary" onClick={onOpenApiKeyModal}>
          <Key size={16} />
          <span>{t('header.api.settings')}</span>
        </button>
      </div>
    </header>
  );
};
