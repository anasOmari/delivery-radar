'use client';

import React, { useState } from 'react';
import { Calendar, Clock, Check, MessageSquare, AlertCircle } from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { getStatusLabel } from '@/lib/exporter';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput, TextArea } from './ui/Field';

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
    <Modal
      onClose={onClose}
      size="md"
      icon={<Calendar size={18} />}
      iconTone="brand"
      title={t('followup.title')}
      subtitle={<>{lead.name} • {lead.city || 'المنطقة'}</>}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button type="submit" form="followup-form" variant="primary" icon={<Check size={16} />}>
            {t('followup.save')}
          </Button>
        </>
      }
    >
      <form id="followup-form" onSubmit={handleSubmit}>
        {/* Quick Date Presets */}
        <Field label="اختيار سريع لموعد المتابعة:" icon={<Clock size={14} />}>
          <div className="presets-list">
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
        </Field>

        {/* Date Picker Input */}
        <Field label={t('followup.date')} icon={<Calendar size={14} />} htmlFor="followup-date">
          <TextInput
            id="followup-date"
            type="date"
            required
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </Field>

        {/* Status Select */}
        <Field label={t('followup.status')} icon={<AlertCircle size={14} />} htmlFor="followup-status">
          <select
            id="followup-status"
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
        </Field>

        {/* Notes Textarea */}
        <Field label={t('followup.notes')} icon={<MessageSquare size={14} />} htmlFor="followup-notes">
          <TextArea
            id="followup-notes"
            rows={3}
            placeholder="مثلاً: تحدثنا مع المدير وطلب معاودة الاتصال لإرسال العرض المعتمد..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
