'use client';

import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Building2,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Lead, ProposalConfig } from '@/lib/types';
import { PROPOSAL_TEMPLATES } from '@/lib/opportunity';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput, TextArea } from './ui/Field';

interface ProposalModalProps {
  lead: Lead;
  onClose: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({ lead, onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState<'web_design' | 'social_media' | 'google_maps_seo' | 'custom'>('web_design');
  const [copied, setCopied] = useState(false);

  const initialPreset = PROPOSAL_TEMPLATES['web_design'];

  const [config, setConfig] = useState<ProposalConfig>({
    leadName: lead.name,
    serviceType: initialPreset.serviceType || 'تصميم وتطوير موقع إلكتروني متكامل',
    serviceDescription: initialPreset.serviceDescription || '',
    price: initialPreset.price || 350,
    currency: 'USD',
    deliverables: initialPreset.deliverables || [],
    validUntilDays: 14,
    agencyName: 'وكالة الحلول الرقمية للتسويق والبرمجة',
    agencyPhone: '+962 7 9000 0000'
  });

  const [newDeliverable, setNewDeliverable] = useState('');

  const handleSelectPreset = (key: 'web_design' | 'social_media' | 'google_maps_seo') => {
    setSelectedPreset(key);
    const preset = PROPOSAL_TEMPLATES[key];
    if (preset) {
      setConfig(prev => ({
        ...prev,
        serviceType: preset.serviceType || prev.serviceType,
        serviceDescription: preset.serviceDescription || prev.serviceDescription,
        price: preset.price || prev.price,
        deliverables: preset.deliverables || prev.deliverables,
        validUntilDays: preset.validUntilDays || 14
      }));
    }
  };

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setConfig(prev => ({
      ...prev,
      deliverables: [...prev.deliverables, newDeliverable.trim()]
    }));
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (index: number) => {
    setConfig(prev => ({
      ...prev,
      deliverables: prev.deliverables.filter((_, i) => i !== index)
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextProposal = () => {
    const text = `عزيزي/عزيزتي إدارة ${config.leadName} المحترمين،
تحية طيبة وبعد،

يسرنا في (${config.agencyName}) أن نتقدم لكم بعرض سعر رسمي خاص بنشاطكم:

📌 الخدمة: ${config.serviceType}
📝 الوصف: ${config.serviceDescription}

⭐ البنود ومخرجات العمل المشمولة:
${config.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

💰 الاستثمار الإجمالي: ${config.price} ${config.currency}
⏳ العرض سارٍ لمدة: ${config.validUntilDays} يوماً من تاريخ اليوم.

للتواصل وتأكيد البدء: ${config.agencyPhone}
شاكرين ومقدرين اهتمامكم!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.validUntilDays);
  const expiryDateStr = expiryDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal
      onClose={onClose}
      size="xl"
      icon={<FileText size={18} />}
      iconTone="brand"
      title="إنشاء وتصدير عرض سعر رسمي (Quotation / Proposal)"
      subtitle={<>عرض موجه إلى: <strong>{lead.name}</strong> ({lead.city || 'المنطقة'})</>}
      headerActions={
        <>
          <Button variant="secondary" size="sm" icon={copied ? <Check size={14} /> : <Copy size={14} />} onClick={handleCopyTextProposal}>
            {copied ? 'تم النسخ' : 'نسخ كنص للواتساب'}
          </Button>
          <Button variant="primary" size="sm" icon={<Printer size={15} />} onClick={handlePrint}>
            طباعة / حفظ PDF
          </Button>
        </>
      }
    >
      {/* Body Layout: Form Config on Left, Live PDF Preview on Right */}
      <div className="proposal-modal-body">
        {/* Controls Form - Hidden in Print */}
        <div className="proposal-sidebar no-print">
          <h3 className="audit-section-heading">1. اختيار نوع العرض المسبق</h3>
          <div className="presets-list">
            <button
              type="button"
              className={`preset-chip ${selectedPreset === 'web_design' ? 'chip-active' : ''}`}
              onClick={() => handleSelectPreset('web_design')}
            >
              🌐 موقع إلكتروني
            </button>
            <button
              type="button"
              className={`preset-chip ${selectedPreset === 'social_media' ? 'chip-active' : ''}`}
              onClick={() => handleSelectPreset('social_media')}
            >
              📱 سوشيال ميديا
            </button>
            <button
              type="button"
              className={`preset-chip ${selectedPreset === 'google_maps_seo' ? 'chip-active' : ''}`}
              onClick={() => handleSelectPreset('google_maps_seo')}
            >
              🗺️ خرائط جوجل
            </button>
          </div>

          <h3 className="audit-section-heading">2. تفاصيل العرض والأسعار</h3>
          <Field label="اسم النشاط التجاري (العميل)" htmlFor="proposal-lead-name">
            <TextInput
              id="proposal-lead-name"
              type="text"
              value={config.leadName}
              onChange={e => setConfig({ ...config, leadName: e.target.value })}
            />
          </Field>

          <Field label="عنوان الخدمة" htmlFor="proposal-service-type">
            <TextInput
              id="proposal-service-type"
              type="text"
              value={config.serviceType}
              onChange={e => setConfig({ ...config, serviceType: e.target.value })}
            />
          </Field>

          <Field label="وصف الخدمة" htmlFor="proposal-service-desc">
            <TextArea
              id="proposal-service-desc"
              rows={2}
              value={config.serviceDescription}
              onChange={e => setConfig({ ...config, serviceDescription: e.target.value })}
            />
          </Field>

          <div className="ui-grid-2col">
            <Field label="السعر المطلوب" htmlFor="proposal-price">
              <TextInput
                id="proposal-price"
                type="number"
                value={config.price}
                onChange={e => setConfig({ ...config, price: Number(e.target.value) })}
              />
            </Field>
            <Field label="العملة" htmlFor="proposal-currency">
              <select
                id="proposal-currency"
                className="input-field"
                value={config.currency}
                onChange={e => setConfig({ ...config, currency: e.target.value })}
              >
                <option value="USD">دولار (USD $)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="JOD">دينار أردني (JOD)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="QAR">ريال قطري (QAR)</option>
                <option value="EGP">جنيه مصري (EGP)</option>
              </select>
            </Field>
          </div>

          <Field label="صلاحية العرض (أيام)" htmlFor="proposal-validity">
            <TextInput
              id="proposal-validity"
              type="number"
              value={config.validUntilDays}
              onChange={e => setConfig({ ...config, validUntilDays: Number(e.target.value) })}
            />
          </Field>

          <h3 className="audit-section-heading">3. بنود ومخرجات العمل</h3>
          <div className="flex-align gap-2">
            <TextInput
              type="text"
              className="ui-flex-fill"
              placeholder="أضف بند أو ميزة جديدة..."
              value={newDeliverable}
              onChange={e => setNewDeliverable(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddDeliverable()}
            />
            <Button type="button" variant="secondary" size="sm" onClick={handleAddDeliverable}>
              إضافة
            </Button>
          </div>

          <ul className="proposal-deliverables-list">
            {config.deliverables.map((item, idx) => (
              <li key={idx} className="deliverable-item">
                <span>{item}</span>
                <button
                  type="button"
                  className="btn-remove-deliverable"
                  onClick={() => handleRemoveDeliverable(idx)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>

          <h3 className="audit-section-heading">4. بيانات وكالتك / جهة الإرسال</h3>
          <Field label="اسم وكالتك أو شركتك" htmlFor="proposal-agency-name">
            <TextInput
              id="proposal-agency-name"
              type="text"
              value={config.agencyName}
              onChange={e => setConfig({ ...config, agencyName: e.target.value })}
            />
          </Field>
          <Field label="هاتف التواصل / الواتساب" htmlFor="proposal-agency-phone">
            <TextInput
              id="proposal-agency-phone"
              type="text"
              value={config.agencyPhone}
              onChange={e => setConfig({ ...config, agencyPhone: e.target.value })}
            />
          </Field>
        </div>

        {/* Live Printable Document */}
        <div className="proposal-preview-wrapper">
          <div id="printable-proposal-doc" className="printable-proposal-doc">
            {/* Proposal Header */}
            <div className="doc-header">
              <div className="doc-brand">
                <div className="doc-logo-box">
                  <Building2 size={24} />
                </div>
                <div>
                  <h1 className="doc-company-name">{config.agencyName}</h1>
                  <p className="doc-sub">حلول نمو الأعمال والتسويق الرقمي</p>
                </div>
              </div>
              <div className="doc-meta">
                <div className="doc-badge">عرض سعر رسمي • QUOTATION</div>
                <div className="doc-meta-row">
                  <span className="doc-meta-label">التاريخ:</span>
                  <span className="doc-meta-val">{todayStr}</span>
                </div>
                <div className="doc-meta-row">
                  <span className="doc-meta-label">الرقم المرجعي:</span>
                  <span className="doc-meta-val">QT-{lead.id.slice(0, 6).toUpperCase()}</span>
                </div>
                <div className="doc-meta-row">
                  <span className="doc-meta-label">ساري حتى:</span>
                  <span className="doc-meta-val text-accent">{expiryDateStr}</span>
                </div>
              </div>
            </div>

            <div className="doc-divider"></div>

            {/* Client & Recipient Information */}
            <div className="doc-client-section">
              <div className="client-box">
                <span className="box-tag">مقدّم إلى العميل:</span>
                <h2 className="client-name">{config.leadName}</h2>
                <div className="client-details">
                  <div>📍 {lead.address || lead.city || 'المنطقة'}</div>
                  {lead.phone && <div>📞 {lead.phone}</div>}
                  {lead.category && <div>🏷️ مجال النشاط: {lead.category}</div>}
                </div>
              </div>

              <div className="client-box provider-box">
                <span className="box-tag">مقدّم من:</span>
                <h3 className="provider-name">{config.agencyName}</h3>
                <div className="client-details">
                  <div>📞 للتواصل: {config.agencyPhone}</div>
                  <div>✉️ العرض المعتمد لإدارة المشاريع</div>
                </div>
              </div>
            </div>

            {/* Service Proposal Overview */}
            <div className="doc-service-card">
              <h3 className="doc-section-title">نطاق الخدمة المقترحة</h3>
              <h4 className="service-title-text">{config.serviceType}</h4>
              <p className="service-desc-text">{config.serviceDescription}</p>
            </div>

            {/* Deliverables / Scope of Work */}
            <div className="doc-deliverables-section">
              <h3 className="doc-section-title">مخرجات العمل وبنود التنفيذ (Scope of Work)</h3>
              <div className="doc-deliverables-table">
                {config.deliverables.map((item, index) => (
                  <div key={index} className="deliverable-row">
                    <span className="row-num">{index + 1}</span>
                    <span className="row-text">{item}</span>
                    <CheckCircle2 size={16} className="text-success" />
                  </div>
                ))}
              </div>
            </div>

            {/* Investment & Pricing Summary */}
            <div className="doc-pricing-summary">
              <div className="pricing-notes">
                <h4>شروط الدفع والتسليم:</h4>
                <ul>
                  <li>يتم دفع 50% كدفعة أولى عند بدء المشروع، و 50% عند الاستلام النهائي.</li>
                  <li>العرض شامل الدعم الفني والتعديلات لمدة 30 يوماً بعد التسليم.</li>
                  <li>يبدأ التنفيذ فور اعتماد هذا العرض وتحويل الدفعة الأولى.</li>
                </ul>
              </div>
              <div className="pricing-box">
                <div className="pricing-total-label">إجمالي الاستثمار المطلوب</div>
                <div className="pricing-total-value">
                  {config.price} <span>{config.currency}</span>
                </div>
                <div className="pricing-tax-note">السعر شامل كافة بنود التنفيذ المذكورة أعلاه</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="doc-signature-section">
              <div className="sign-box">
                <div className="sign-title">اعتماد مقدّم العرض</div>
                <div className="sign-org">{config.agencyName}</div>
                <div className="sign-line">التوقيع والختم الرسمي</div>
              </div>
              <div className="sign-box">
                <div className="sign-title">اعتماد وقبول العميل</div>
                <div className="sign-org">{config.leadName}</div>
                <div className="sign-line">التوقيع بالتفويض</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
