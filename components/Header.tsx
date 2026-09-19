'use client';

import React from 'react';
import { Building2, Key, Download, Upload, Sun, Moon, FolderKanban, Globe, MessageCircle, Send, Bot, Menu, LogOut, Mail, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { useBranding } from '@/lib/BrandingContext';
import { BrandSettingsModal } from '@/components/BrandSettingsModal';

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
  const { appName, tagline } = useBranding();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showBrandModal, setShowBrandModal] = React.useState(false);

  const toggleLanguage = () => {
    const next: Locale = locale === 'ar' ? 'en' : 'ar';
    setLocale(next);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header className="header-container">
      <div className="header-brand">
        <div className="brand-logo">
          <Building2 size={20} />
        </div>
        <div>
          <h1 className="brand-title">{appName}</h1>
          {tagline ? <div className="brand-subtitle">{tagline}</div> : null}
        </div>
      </div>

      <div className="header-utilities">
        {user && (
          <span className="auth-user-pill" title={user.email}>
            <Mail size={14} />
            <span dir="ltr">{user.email}</span>
          </span>
        )}
        {user && (
          <button
            className="btn btn-secondary btn-icon"
            onClick={handleLogout}
            title={locale === 'ar' ? 'تسجيل الخروج' : 'Log out'}
            aria-label={locale === 'ar' ? 'تسجيل الخروج' : 'Log out'}
          >
            <LogOut size={17} />
          </button>
        )}
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
          aria-label={theme === 'dark' ? t('header.theme.toggle') : t('header.theme.dark')}
          aria-pressed={theme === 'light'}
          title={theme === 'dark' ? t('header.theme.toggle') : t('header.theme.dark')}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

      </div>
      <details className="header-menu" onKeyDown={event => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false;
          event.currentTarget.querySelector('summary')?.focus();
        }
      }}>
        <summary className="btn btn-secondary" aria-label={locale === 'ar' ? 'الأدوات' : 'Tools'}><Menu size={18} /><span>{locale === 'ar' ? 'الأدوات' : 'Tools'}</span></summary>
        <div className="header-menu-panel" onClick={event => {
          if ((event.target as HTMLElement).closest('button')) {
            const menu = event.currentTarget.closest('details');
            if (menu) menu.open = false;
          }
        }}>
        {/* Actions */}
        <button
          className="btn btn-secondary"
          onClick={() => setShowBrandModal(true)}
          title={locale === 'ar' ? 'تغيير اسم النظام' : 'Change system name'}
        >
          <BadgeCheck size={16} />
          <span>{locale === 'ar' ? 'اسم النظام' : 'System name'}</span>
        </button>
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
          title={locale === 'ar' ? 'تجربة الردود التلقائية' : 'Test auto-replies'}
        >
          <Bot size={16} style={{ color: 'var(--whatsapp-color)' }} />
          <span>{locale === 'ar' ? 'الردود التلقائية' : 'Auto-replies'}</span>
        </button>

        {/* Direct Send to Specific Contact / Phone Number */}
        <button
          className="btn btn-whatsapp"
          onClick={onOpenDirectMessageModal}
          style={{
            background: 'var(--whatsapp-button)',
            color: '#fff',
            borderColor: 'var(--whatsapp-button)',
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
            color: isWhatsAppConfigured ? 'var(--whatsapp-color)' : undefined,
          }}
          title={t('whatsapp.api.settings')}
        >
          <MessageCircle size={16} style={{ color: isWhatsAppConfigured ? 'var(--whatsapp-color)' : undefined }} />
          <span>{t('header.messages.settings')}</span>
          {isWhatsAppConfigured && (
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--whatsapp-button)',
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
        <button
          className={`api-status-pill ${apiKey ? 'status-active' : 'status-demo'}`}
          onClick={onOpenApiKeyModal}
          title={t('header.api.settings')}
        >
          <span className="dot"></span>
          <span>{apiKey ? t('header.api.connected') : t('header.api.demo')}</span>
        </button>

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
      </details>
      {showBrandModal && <BrandSettingsModal onClose={() => setShowBrandModal(false)} />}
    </header>
  );
};
