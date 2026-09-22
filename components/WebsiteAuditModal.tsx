'use client';

import React, { useState } from 'react';
import {
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
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { TextArea } from './ui/Field';

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
    <Modal
      onClose={onClose}
      size="md"
      icon={<Gauge size={18} />}
      iconTone="brand"
      title="فاحص أداء وصحة الموقع الإلكتروني"
      subtitle={<>تحليل تقني لنشاط: <strong>{lead.name}</strong></>}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
          <Button type="button" variant="whatsapp" icon={<MessageCircle size={15} />} onClick={handleSendWhatsApp}>
            مراسلة العميل بالتقرير عبر الواتساب
          </Button>
        </>
      }
    >
      {/* Target URL Bar */}
      <div className="audit-url-card">
        <div className="flex-align gap-2">
          <Globe size={15} />
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
              <ShieldCheck size={28} />
            ) : (
              <ShieldAlert size={28} />
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
          <label className="modal-label" htmlFor="audit-pitch">
            <Sparkles size={14} />
            <span>رسالة الإقناع الجاهزة للتواصل مع العميل:</span>
          </label>
          <Button
            type="button"
            variant="secondary"
            size="xs"
            icon={copied ? <Check size={13} /> : <Copy size={13} />}
            onClick={handleCopyPitch}
          >
            {copied ? 'تم النسخ' : 'نسخ النص'}
          </Button>
        </div>
        <TextArea
          id="audit-pitch"
          readOnly
          rows={4}
          value={pitchMessage}
        />
      </div>
    </Modal>
  );
};
