'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  FileText,
  Building2,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Lead, ProposalConfig } from '@/lib/types';
import { PROPOSAL_TEMPLATES } from '@/lib/opportunity';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="proposal-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header - Hidden in Print */}
        <div className="modal-header no-print">
          <div className="flex-align gap-2">
            <div className="brand-logo" style={{ width: '32px', height: '32px' }}>
              <FileText size={18} />
            </div>
            <div>
              <h2 className="modal-title">إنشاء وتصدير عرض سعر رسمي (Quotation / Proposal)</h2>
              <p className="modal-subtitle">عرض موجه إلى: <strong>{lead.name}</strong> ({lead.city || 'المنطقة'})</p>
            </div>
          </div>
          <div className="flex-align gap-2">
            <button className="btn btn-secondary btn-sm" onClick={handleCopyTextProposal}>
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'تم النسخ' : 'نسخ كنص للواتساب'}</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button className="btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body Layout: Form Config on Left, Live PDF Preview on Right */}
        <div className="proposal-modal-body">
          {/* Controls Form - Hidden in Print */}
          <div className="proposal-sidebar no-print">
            <h3 className="section-label">1. اختيار نوع العرض المسبق</h3>
            <div className="proposal-preset-buttons">
              <button
                type="button"
                className={`preset-btn ${selectedPreset === 'web_design' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('web_design')}
              >
                🌐 موقع إلكتروني
              </button>
              <button
                type="button"
                className={`preset-btn ${selectedPreset === 'social_media' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('social_media')}
              >
                📱 سوشيال ميديا
              </button>
              <button
                type="button"
                className={`preset-btn ${selectedPreset === 'google_maps_seo' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('google_maps_seo')}
              >
                🗺️ خرائط جوجل
              </button>
            </div>

            <h3 className="section-label" style={{ marginTop: '16px' }}>2. تفاصيل العرض والأسعار</h3>
            <div className="form-group">
              <label>اسم النشاط التجاري (العميل)</label>
              <input
                type="text"
                value={config.leadName}
                onChange={e => setConfig({ ...config, leadName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>عنوان الخدمة</label>
              <input
                type="text"
                value={config.serviceType}
                onChange={e => setConfig({ ...config, serviceType: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>وصف الخدمة</label>
              <textarea
                rows={2}
                value={config.serviceDescription}
                onChange={e => setConfig({ ...config, serviceDescription: e.target.value })}
              />
            </div>

            <div className="grid-2-cols" style={{ gap: '10px' }}>
              <div className="form-group">
                <label>السعر المطلوب</label>
                <input
                  type="number"
                  value={config.price}
                  onChange={e => setConfig({ ...config, price: Number(e.target.value) })}
                />
              </div>
              <div className="form-group">
                <label>العملة</label>
                <select
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
              </div>
            </div>

            <div className="form-group">
              <label>صلاحية العرض (أيام)</label>
              <input
                type="number"
                value={config.validUntilDays}
                onChange={e => setConfig({ ...config, validUntilDays: Number(e.target.value) })}
              />
            </div>

            <h3 className="section-label" style={{ marginTop: '16px' }}>3. بنود ومخرجات العمل</h3>
            <div className="deliverable-input-row">
              <input
                type="text"
                placeholder="أضف بند أو ميزة جديدة..."
                value={newDeliverable}
                onChange={e => setNewDeliverable(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddDeliverable()}
              />
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddDeliverable}>
                إضافة
              </button>
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

            <h3 className="section-label" style={{ marginTop: '16px' }}>4. بيانات وكالتك / جهة الإرسال</h3>
            <div className="form-group">
              <label>اسم وكالتك أو شركتك</label>
              <input
                type="text"
                value={config.agencyName}
                onChange={e => setConfig({ ...config, agencyName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>هاتف التواصل / الواتساب</label>
              <input
                type="text"
                value={config.agencyPhone}
                onChange={e => setConfig({ ...config, agencyPhone: e.target.value })}
              />
            </div>
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
      </div>
    </div>
  );
};
