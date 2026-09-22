'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { getWhatsAppConfig, saveWhatsAppConfig } from '@/lib/whatsappProviders';
import { saveWhatsAppConfigToSupabase } from '@/lib/supabase';

/** Fired whenever the WhatsApp/bot config changes so all widgets stay in sync. */
export const BOT_CONFIG_EVENT = 'whatsapp-config-changed';

export function notifyBotConfigChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(BOT_CONFIG_EVENT));
}

/**
 * Prominent instant kill-switch for the WhatsApp auto-reply bot.
 * Toggles chatbotEnabled and persists immediately (localStorage + Supabase +
 * server memory) — no need to open settings and press Save.
 */
export const BotToggle: React.FC = () => {
  const { locale } = useLanguage();
  const [enabled, setEnabled] = useState<boolean>(() => getWhatsAppConfig().chatbotEnabled !== false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    setEnabled(getWhatsAppConfig().chatbotEnabled !== false);
  }, []);

  useEffect(() => {
    // Initial state already reflects localStorage; only subscribe to outside changes.
    window.addEventListener(BOT_CONFIG_EVENT, refresh);
    return () => window.removeEventListener(BOT_CONFIG_EVENT, refresh);
  }, [refresh]);

  const toggle = async () => {
    if (saving) return;
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    try {
      const merged = { ...getWhatsAppConfig(), chatbotEnabled: next };
      saveWhatsAppConfig(merged);
      notifyBotConfigChanged();
      try {
        await saveWhatsAppConfigToSupabase(merged);
        await fetch('/api/whatsapp/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatbotEnabled: next }),
        });
      } catch (e) {
        console.warn('Bot toggle sync failed:', e);
      }
    } finally {
      setSaving(false);
      refresh();
    }
  };

  return (
    <button
      type="button"
      className={`api-status-pill ${enabled ? 'status-active' : 'status-demo'}`}
      onClick={toggle}
      disabled={saving}
      aria-pressed={enabled}
      title={
        locale === 'ar'
          ? enabled
            ? 'البوت يعمل — اضغط لإيقاف الرد التلقائي فوراً'
            : 'البوت متوقف — اضغط لتفعيل الرد التلقائي'
          : enabled
            ? 'Bot is ON — click to stop auto-replies immediately'
            : 'Bot is OFF — click to enable auto-replies'
      }
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      {saving ? <Loader2 size={14} className="spin" /> : <Bot size={14} />}
      <span className="dot"></span>
      <span>{enabled ? (locale === 'ar' ? 'البوت يعمل' : 'Bot ON') : (locale === 'ar' ? 'البوت متوقف' : 'Bot OFF')}</span>
    </button>
  );
};
