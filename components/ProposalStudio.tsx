'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  Printer,
  Building2,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Copy,
  Check,
  Globe,
  Sparkles,
  Phone,
  MapPin,
  Trash2,
  Plus
} from 'lucide-react';
import { Lead, ProposalConfig } from '@/lib/types';
import { PROPOSAL_TEMPLATES } from '@/lib/opportunity';
import { useLanguage } from '@/lib/LanguageContext';

interface ProposalStudioProps {
  lead: Lead;
  onBack: () => void;
  theme?: 'dark' | 'light';
}

export const ProposalStudio: React.FC<ProposalStudioProps> = ({ lead, onBack, theme }) => {
  const { t, locale } = useLanguage();
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
    agencyName: 'وكالة رادار للحلول الرقمية والتسويق',
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

  const handleAddDeliverable = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
📝 تفاصيل العرض: ${config.serviceDescription}

⭐ بنود ومخرجات العمل المشمولة:
${config.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}

💰 إجمالي الاستثمار المطلوب: ${config.price} ${config.currency}
⏳ العرض سارٍ لمدة: ${config.validUntilDays} يوماً من تاريخ اليوم.

للتواصل وتأكيد البدء: ${config.agencyPhone}
شاكرين ومقدرين اهتمامكم!`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const todayStr = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + config.validUntilDays);
  const expiryDateStr = expiryDate.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const refCode = `QT-${lead.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="proposal-studio-screen">
      {/* Top Navigation Bar */}
      <header className="proposal-studio-header no-print">
        <div className="studio-header-left">
          <button className="btn btn-secondary btn-back" onClick={onBack}>
            <ArrowRight size={17} />
            <span>{t('proposal.back')}</span>
          </button>

          <div className="studio-lead-pill">
            <span className="pill-dot"></span>
            <strong>{lead.name}</strong>
            <span className="pill-sep">•</span>
            <span>{lead.city || 'المنطقة'}</span>
            {lead.phone && (
              <>
                <span className="pill-sep">•</span>
                <span className="pill-phone">{lead.phone}</span>
              </>
            )}
          </div>
        </div>

        <div className="studio-header-right">
          <button className="btn btn-secondary" onClick={handleCopyTextProposal}>
            {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            <span>{copied ? t('notify.proposal_copied') : t('proposal.copy_text')}</span>
          </button>

          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>{t('proposal.print_pdf')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace: 2-Column Split */}
      <div className="proposal-studio-workspace">
        {/* Right Panel: Clean Form Customization */}
        <aside className="studio-sidebar-panel no-print">
          <div className="sidebar-scrollable-content">
            {/* Section 1: Presets */}
            <div className="studio-card">
              <div className="card-header-clean">
                <Sparkles size={16} className="text-primary" />
                <h3 className="card-title-clean">1. {t('proposal.sidebar.select_template')}</h3>
              </div>

              <div className="presets-grid-3">
                <button
                  type="button"
                  className={`preset-studio-btn ${selectedPreset === 'web_design' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('web_design')}
                >
                  <Globe size={15} />
                  <span>موقع إلكتروني</span>
                </button>

                <button
                  type="button"
                  className={`preset-studio-btn ${selectedPreset === 'social_media' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('social_media')}
                >
                  <Briefcase size={15} />
                  <span>سوشيال ميديا</span>
                </button>

                <button
                  type="button"
                  className={`preset-studio-btn ${selectedPreset === 'google_maps_seo' ? 'active' : ''}`}
                  onClick={() => handleSelectPreset('google_maps_seo')}
                >
                  <MapPin size={15} />
                  <span>خرائط جوجل</span>
                </button>
              </div>
            </div>

            {/* Section 2: Service Details & Pricing */}
            <div className="studio-card">
              <div className="card-header-clean">
                <DollarSign size={16} className="text-primary" />
                <h3 className="card-title-clean">2. {t('proposal.sidebar.service_details')}</h3>
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.client_name')}</label>
                <input
                  type="text"
                  value={config.leadName}
                  onChange={e => setConfig({ ...config, leadName: e.target.value })}
                />
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.service_title')}</label>
                <input
                  type="text"
                  value={config.serviceType}
                  onChange={e => setConfig({ ...config, serviceType: e.target.value })}
                />
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.service_desc')}</label>
                <textarea
                  rows={2}
                  value={config.serviceDescription}
                  onChange={e => setConfig({ ...config, serviceDescription: e.target.value })}
                />
              </div>

              <div className="grid-2-clean">
                <div className="studio-field">
                  <label>{t('proposal.sidebar.price')}</label>
                  <input
                    type="number"
                    value={config.price}
                    onChange={e => setConfig({ ...config, price: Number(e.target.value) })}
                  />
                </div>

                <div className="studio-field">
                  <label>{t('proposal.sidebar.currency')}</label>
                  <select
                    value={config.currency}
                    onChange={e => setConfig({ ...config, currency: e.target.value })}
                  >
                    <option value="USD">دولار أمريكي (USD $)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="AED">درهم إماراتي (AED)</option>
                    <option value="JOD">دينار أردني (JOD)</option>
                    <option value="KWD">دينار كويتي (KWD)</option>
                    <option value="QAR">ريال قطري (QAR)</option>
                    <option value="EGP">جنيه مصري (EGP)</option>
                  </select>
                </div>
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.validity_days')}</label>
                <input
                  type="number"
                  value={config.validUntilDays}
                  onChange={e => setConfig({ ...config, validUntilDays: Number(e.target.value) })}
                />
              </div>
            </div>

            {/* Section 3: Deliverables */}
            <div className="studio-card">
              <div className="card-header-clean">
                <CheckCircle2 size={16} className="text-primary" />
                <h3 className="card-title-clean">3. {t('proposal.sidebar.deliverables_count')} ({config.deliverables.length})</h3>
              </div>

              <form onSubmit={handleAddDeliverable} className="add-deliverable-form">
                <input
                  type="text"
                  placeholder={t('proposal.sidebar.add_placeholder')}
                  value={newDeliverable}
                  onChange={e => setNewDeliverable(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={15} />
                  <span>{t('proposal.add_deliverable')}</span>
                </button>
              </form>

              <div className="deliverables-stack">
                {config.deliverables.map((item, index) => (
                  <div key={index} className="deliverable-chip">
                    <span className="chip-index">{index + 1}</span>
                    <span className="chip-text">{item}</span>
                    <button
                      type="button"
                      className="chip-delete-btn"
                      onClick={() => handleRemoveDeliverable(index)}
                      title="حذف هذا البند"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 4: Agency Profile */}
            <div className="studio-card">
              <div className="card-header-clean">
                <Building2 size={16} className="text-primary" />
                <h3 className="card-title-clean">4. {t('proposal.sidebar.agency_data')}</h3>
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.agency_name')}</label>
                <input
                  type="text"
                  value={config.agencyName}
                  onChange={e => setConfig({ ...config, agencyName: e.target.value })}
                />
              </div>

              <div className="studio-field">
                <label>{t('proposal.sidebar.agency_phone')}</label>
                <input
                  type="text"
                  value={config.agencyPhone}
                  onChange={e => setConfig({ ...config, agencyPhone: e.target.value })}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Left Area: Live Document Viewer */}
        <main className="studio-document-viewport">
          <div className="document-sheet" id="printable-proposal-doc">
            {/* Header */}
            <div className="sheet-header">
              <div className="sheet-brand">
                <div className="sheet-brand-logo">
                  <Building2 size={26} />
                </div>
                <div>
                  <h1 className="sheet-brand-name">{config.agencyName}</h1>
                  <p className="sheet-brand-tagline">{t('proposal.document.agency_tagline')}</p>
                </div>
              </div>

              <div className="sheet-meta-box">
                <div className="sheet-quotation-badge">{t('proposal.quotation')} • QUOTATION</div>
                <div className="meta-row">
                  <span className="meta-lbl">{t('proposal.document.issue_date')}</span>
                  <span className="meta-val">{todayStr}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl">{t('proposal.document.ref')}</span>
                  <span className="meta-val">{refCode}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-lbl">{t('proposal.document.valid_until')}</span>
                  <span className="meta-val highlight-val">{expiryDateStr}</span>
                </div>
              </div>
            </div>

            <div className="sheet-divider"></div>

            {/* Parties: Client & Agency */}
            <div className="sheet-parties-grid">
              <div className="party-card client-party">
                <span className="party-type-tag">{t('proposal.to')}:</span>
                <h2 className="party-name">{config.leadName}</h2>
                <div className="party-info">
                  <div className="info-item">
                    <MapPin size={13} />
                    <span>{lead.address || lead.city || 'المنطقة الحضرية'}</span>
                  </div>
                  {lead.phone && (
                    <div className="info-item">
                      <Phone size={13} />
                      <span dir="ltr">{lead.phone}</span>
                    </div>
                  )}
                  {lead.category && (
                    <div className="info-item">
                      <Briefcase size={13} />
                      <span>{lead.category}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="party-card agency-party">
                <span className="party-type-tag">{t('proposal.from')}:</span>
                <h2 className="party-name">{config.agencyName}</h2>
                <div className="party-info">
                  <div className="info-item">
                    <Phone size={13} />
                    <span dir="ltr">{config.agencyPhone}</span>
                  </div>
                  <div className="info-item">
                    <CheckCircle2 size={13} />
                      <span>{t('proposal.document.agency_team')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Scope Card */}
            <div className="sheet-scope-box">
              <div className="scope-badge-small">{t('proposal.document.service_offered')}</div>
              <h3 className="scope-title">{config.serviceType}</h3>
              <p className="scope-description">{config.serviceDescription}</p>
            </div>

            {/* Deliverables Table */}
            <div className="sheet-deliverables-wrapper">
              <div className="deliverables-header-bar">
                <span>م</span>
                <span>{t('proposal.document.scope_header')}</span>
                <span style={{ textAlign: 'center' }}>{t('proposal.document.scope_included')}</span>
              </div>
              <div className="deliverables-rows">
                {config.deliverables.map((item, idx) => (
                  <div key={idx} className="deliverable-row-item">
                    <span className="row-counter">{idx + 1}</span>
                    <span className="row-desc">{item}</span>
                    <span className="row-check">
                      <CheckCircle2 size={16} className="text-success" />
                      <span>{t('proposal.document.included_full')}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Summary & Terms */}
            <div className="sheet-pricing-container">
              <div className="terms-column">
                <h4>{t('proposal.document.payment_terms')}</h4>
                <ul>
                  <li>يتم سداد 50% دفعة أولى عند توقيع العرض واعتماد خطة العمل.</li>
                  <li>يتم سداد 50% المتبقية بعد التسليم النهائي والمعاينة التشغيلية.</li>
                  <li>العرض يشمل الدعم الفني المباشر لمدة 30 يوماً من تاريخ التسليم.</li>
                  <li>يبدأ احتساب مدة العمل فور استلام متطلبات النشاط والدفعة الأولى.</li>
                </ul>
              </div>

              <div className="pricing-column">
                <div className="pricing-card-box">
                  <div className="pricing-title">{t('proposal.document.total_investment')}</div>
                  <div className="pricing-amount">
                    {config.price} <span>{config.currency}</span>
                  </div>
                  <div className="pricing-note">{t('proposal.document.price_note')}</div>
                </div>
              </div>
            </div>

            {/* Official Signatures & Stamp */}
            <div className="sheet-signatures-section">
              <div className="signature-box">
                <div className="sig-label">{t('proposal.document.approval_provider')}</div>
                <div className="sig-party">{config.agencyName}</div>
                <div className="sig-line">{t('proposal.document.signature_official')}</div>
              </div>

              <div className="signature-box">
                <div className="sig-label">{t('proposal.document.approval_client')}</div>
                <div className="sig-party">{config.leadName}</div>
                <div className="sig-line">{t('proposal.document.signature_authority')}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
