'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  AlertTriangle,
  Globe,
  Sparkles
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { auditWebsite } from '@/lib/opportunity';
import { formatPhoneForWhatsApp } from '@/lib/exporter';

interface WebsiteAuditModalProps {
  lead: Lead;
  onClose: () => void;
  onOpenWhatsAppWithText?: (lead: Lead, customText: string) => void;
}

export const WebsiteAuditModal: React.FC<WebsiteAuditModalProps> = ({
  lead,
  onClose,
  onOpenWhatsAppWithText
}) => {
  const audit = auditWebsite(lead.website);
  const [copied, setCopied] = useState(false);

  const pitchMessage = `مرحباً إدارة ${lead.name} 👋
أجرينا فحصاً تقنياً سريعاً لموقعكم (${lead.website || 'موقعكم'})، ولاحظنا الآتي:
${audit.issues.map(issue => `⚠️ ${issue}`).join('\n')}

⭐ تقييم السرعة والأمان: ${audit.speedScore}/100 (الدرجة: ${audit.grade})
هذه المشاكل قد تؤدي لخروج الزوار قبل الطلب وتراجع الترتيب في محركات بحث جوجل.

يسعدنا تقديم مقترح تطوير شامل لرفع كفاءة الموقع وتأمينه بالكامل.
هل يناسبكم الاطلاع على التفاصيل؟ 🚀`;

  const handleCopyPitch = () => {
    navigator.clipboard.writeText(pitchMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (onOpenWhatsAppWithText) {
      onOpenWhatsAppWithText(lead, pitchMessage);
    } else {
      const cleanPhone = formatPhoneForWhatsApp(lead.phone);
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(pitchMessage)}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <Gauge size={18} />
            </div>
            <div>
              <h3 className="modal-title">فاحص أداء وصحة الموقع الإلكتروني</h3>
              <p className="modal-subtitle">
                تحليل تقني لنشاط: <strong>{lead.name}</strong>
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="إغلاق">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Target URL Bar */}
          <div className="audit-url-card">
            <div className="flex-align gap-2 text-xs font-semibold">
              <Globe size={15} className="text-primary" />
              <span className="audit-url-text" dir="ltr">{lead.website}</span>
            </div>
            <a
              href={lead.website}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-xs"
            >
              <span>زيارة الموقع</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* 3 Metrics Cards */}
          <div className="audit-metrics-grid">
            {/* Speed Score */}
            <div className="audit-metric-box">
              <div className={`metric-big-score ${audit.speedScore >= 70 ? 'score-good' : 'score-warn'}`}>
                {audit.speedScore}
                <span className="score-total">/100</span>
              </div>
              <span className="metric-label">مؤشر السرعة والأداء</span>
            </div>

            {/* Security SSL */}
            <div className="audit-metric-box">
              <div className="metric-icon-wrap">
                {audit.hasSsl ? (
                  <ShieldCheck size={28} className="text-success" />
                ) : (
                  <ShieldAlert size={28} className="text-danger" />
                )}
              </div>
              <span className={`metric-status-text ${audit.hasSsl ? 'status-safe' : 'status-danger'}`}>
                {audit.hasSsl ? 'موقع مشفر وآمن (HTTPS)' : 'غير مشفر (خطر HTTP)'}
              </span>
              <span className="metric-label">شهادة الأمان SSL</span>
            </div>

            {/* Overall Grade */}
            <div className="audit-metric-box">
              <div className="metric-grade-text">
                الدرجة {audit.grade}
              </div>
              <span className="metric-label">التقييم التقني الإجمالي</span>
            </div>
          </div>

          {/* Detected Issues */}
          <div className="audit-issues-section">
            <h4 className="audit-section-heading">
              <AlertTriangle size={15} className="text-amber" />
              <span>المشاكل المكتشفة التي تتيح فرصة البيع:</span>
            </h4>
            <div className="audit-issues-list">
              {audit.issues.map((issue, idx) => (
                <div key={idx} className="audit-issue-item">
                  <span>•</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tailored Sales Pitch */}
          <div className="modal-form-group">
            <div className="flex-between">
              <label className="modal-label">
                <Sparkles size={14} className="text-primary" />
                <span>رسالة الإقناع الجاهزة للتواصل مع العميل:</span>
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-xs"
                onClick={handleCopyPitch}
              >
                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={4}
              className="textarea-field"
              value={pitchMessage}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            إغلاق
          </button>
          <button type="button" className="btn btn-whatsapp" onClick={handleSendWhatsApp}>
            <MessageCircle size={15} />
            <span>مراسلة العميل بالتقرير عبر الواتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
