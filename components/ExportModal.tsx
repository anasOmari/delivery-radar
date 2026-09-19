'use client';

import React, { useState } from 'react';
import { Download, X, FileSpreadsheet, Smartphone, Copy, Check, CheckSquare, Users } from 'lucide-react';
import { Lead } from '@/lib/types';
import { exportToCSV, exportToVCF, copyPhonesToClipboard } from '@/lib/exporter';
import { useLanguage } from '@/lib/LanguageContext';

interface ExportModalProps {
  leads: Lead[];
  selectedIds: string[];
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  leads,
  selectedIds,
  onClose
}) => {
  const { t, locale } = useLanguage();
  const [exportOption, setExportOption] = useState<'selected' | 'all'>(
    selectedIds.length > 0 ? 'selected' : 'all'
  );
  const [copied, setCopied] = useState(false);

  const targetLeads = exportOption === 'selected' && selectedIds.length > 0
    ? leads.filter(l => selectedIds.includes(l.id))
    : leads;

  const handleExportCSV = () => {
    exportToCSV(targetLeads, `leads_export_${new Date().toISOString().slice(0, 10)}.csv`, locale);
    onClose();
  };

  const handleExportVCF = () => {
    exportToVCF(targetLeads, `contacts_${new Date().toISOString().slice(0, 10)}.vcf`);
    onClose();
  };

  const handleCopyPhones = () => {
    const ok = copyPhonesToClipboard(targetLeads);
    if (ok) {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#a855f7' }}>
              <Download size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('export.title')}</h3>
              <p className="modal-subtitle">تصدير بيانات المحلات والشركات بصيغ متعددة جاهزة للاستخدام</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t('action.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Target Selection Pills */}
          <div className="export-target-selector">
            <label className={`target-option ${exportOption === 'all' ? 'active' : ''}`}>
              <input
                type="radio"
                name="target"
                style={{ display: 'none' }}
                checked={exportOption === 'all'}
                onChange={() => setExportOption('all')}
              />
              <Users size={16} className="text-primary" />
              <div>
                <strong>{t('export.all')}</strong>
                <span className="subtext" style={{ marginRight: '6px' }}>({leads.length} محل)</span>
              </div>
            </label>

            <label className={`target-option ${exportOption === 'selected' ? 'active' : ''} ${selectedIds.length === 0 ? 'disabled' : ''}`}>
              <input
                type="radio"
                name="target"
                style={{ display: 'none' }}
                disabled={selectedIds.length === 0}
                checked={exportOption === 'selected'}
                onChange={() => setExportOption('selected')}
              />
              <CheckSquare size={16} className="text-purple" />
              <div>
                <strong>{t('export.selected')}</strong>
                <span className="subtext" style={{ marginRight: '6px' }}>({selectedIds.length} محل)</span>
              </div>
            </label>
          </div>

          {/* Export Action Cards */}
          <div className="export-cards-grid">
            <div className="export-action-card" onClick={handleExportCSV}>
              <div className="flex-align gap-3">
                <div className="card-icon icon-excel">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="card-info">
                  <h4>{t('export.csv')} (Excel)</h4>
                  <p>{t('export.csv.desc')} بتنسيق UTF-8 المنظم</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">{t('action.download')}</button>
            </div>

            <div className="export-action-card" onClick={handleExportVCF}>
              <div className="flex-align gap-3">
                <div className="card-icon icon-vcf">
                  <Smartphone size={24} />
                </div>
                <div className="card-info">
                  <h4>{t('export.vcf')} (جهات اتصال الهاتف)</h4>
                  <p>{t('export.vcf.desc')} للحفظ المباشر في سجل الهاتف</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">{t('action.download')}</button>
            </div>

            <div className="export-action-card" onClick={handleCopyPhones}>
              <div className="flex-align gap-3">
                <div className="card-icon icon-copy">
                  {copied ? <Check size={24} className="text-success" /> : <Copy size={24} />}
                </div>
                <div className="card-info">
                  <h4>{t('export.copy_phones')}</h4>
                  <p>{t('export.copy_phones.desc')} مفصولة بأسطر</p>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">
                {copied ? t('notify.copied') : 'نسخ الأرقام'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {t('action.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
