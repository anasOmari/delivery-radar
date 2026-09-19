'use client';

import React, { useState } from 'react';
import { X, Calendar, Clock, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { getStatusLabel } from '@/lib/exporter';

interface FollowUpModalProps {
  lead: Lead;
  onSave: (leadId: string, date: string, notes: string, status: LeadStatus) => void;
  onClose: () => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({ lead, onSave, onClose }) => {
  const { t, locale } = useLanguage();
  const [date, setDate] = useState(lead.followUpDate || '');
  const [notes, setNotes] = useState(lead.followUpNotes || '');
  const [status, setStatus] = useState<LeadStatus>(lead.status || 'contacted');

  const handleQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    const str = d.toISOString().split('T')[0];
    setDate(str);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(lead.id, date, notes, status);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="modal-title">{t('followup.title')}</h3>
              <p className="modal-subtitle">
                {lead.name} • {lead.city || 'المنطقة'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t('action.close')}>
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <div className="modal-body">
            {/* Quick Date Presets */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Clock size={14} />
                <span>اختيار سريع لموعد المتابعة:</span>
              </label>
              <div className="flex-align gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => handleQuickDate(0)}
                >
                  {t('followup.quick.today')}
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => handleQuickDate(1)}
                >
                  {t('followup.quick.tomorrow')}
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => handleQuickDate(3)}
                >
                  {t('followup.quick.3days')}
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => handleQuickDate(7)}
                >
                  {t('followup.quick.week')}
                </button>
              </div>
            </div>

            {/* Date Picker Input */}
            <div className="modal-form-group">
              <label className="modal-label">
                <Calendar size={14} />
                <span>{t('followup.date')}</span>
              </label>
              <input
                type="date"
                required
                className="input-field"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            {/* Status Select */}
            <div className="modal-form-group">
              <label className="modal-label">
                <AlertCircle size={14} />
                <span>{t('followup.status')}</span>
              </label>
              <select
                className="input-field"
                value={status}
                onChange={e => setStatus(e.target.value as LeadStatus)}
              >
                <option value="new">{getStatusLabel('new', locale)}</option>
                <option value="contacted">{getStatusLabel('contacted', locale)}</option>
                <option value="interested">{getStatusLabel('interested', locale)} (ساخن 🔥)</option>
                <option value="converted">{getStatusLabel('converted', locale)} 🎉</option>
                <option value="rejected">{getStatusLabel('rejected', locale)}</option>
              </select>
            </div>

            {/* Notes Textarea */}
            <div className="modal-form-group">
              <label className="modal-label">
                <MessageSquare size={14} />
                <span>{t('followup.notes')}</span>
              </label>
              <textarea
                rows={3}
                className="textarea-field"
                placeholder="مثلاً: تحدثنا مع المدير وطلب معاودة الاتصال لإرسال العرض المعتمد..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('action.cancel')}
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>{t('followup.save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
