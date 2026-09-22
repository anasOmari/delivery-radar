'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, Info, FileText } from 'lucide-react';
import { Lead } from '@/lib/types';
import { calculateOpportunity } from '@/lib/opportunity';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextArea } from './ui/Field';
import { Banner } from './ui/StatusPill';

interface ImportModalProps {
  existingLeads: Lead[];
  onImport: (newLeads: Lead[]) => void;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  existingLeads,
  onImport,
  onClose
}) => {
  const [csvText, setCsvText] = useState('');
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [duplicatesCount, setDuplicatesCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessCsv = (content: string) => {
    try {
      const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length < 1) {
        setErrorMsg('الملف فارغ أو لا يحتوي على أسطر صالحة.');
        return;
      }

      const existingPhones = new Set(
        existingLeads.map(l => l.phone.replace(/\D/g, '')).filter(p => p.length > 5)
      );

      const parsedLeads: Lead[] = [];
      let dupes = 0;

      // Check if first line is header
      const startIndex = lines[0].includes('name') || lines[0].includes('الاسم') || lines[0].includes('phone') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const name = parts[0];
          const phone = parts[1];
          const cleanPhoneDigits = phone.replace(/\D/g, '');

          // Check duplicate
          if (cleanPhoneDigits && existingPhones.has(cleanPhoneDigits)) {
            dupes++;
            continue;
          }

          if (cleanPhoneDigits) {
            existingPhones.add(cleanPhoneDigits);
          }

          const city = parts[2] || 'المنطقة';
          const category = parts[3] || 'نشاط تجاري';
          const website = parts[4] || '';

          const partial: Partial<Lead> = {
            id: 'imp_' + Date.now() + '_' + i,
            name,
            phone,
            city,
            category,
            website,
            address: city,
            rating: 4.8,
            userRatingsTotal: 15,
            status: 'new',
            extractedAt: new Date().toISOString()
          };

          const opp = calculateOpportunity(partial);
          const fullLead: Lead = {
            ...(partial as Lead),
            opportunityScore: opp.score,
            opportunityReason: opp.reason,
            priority: opp.priority
          };

          parsedLeads.push(fullLead);
        }
      }

      setImportedCount(parsedLeads.length);
      setDuplicatesCount(dupes);

      if (parsedLeads.length > 0) {
        onImport(parsedLeads);
      } else if (dupes > 0) {
        setErrorMsg(`جميع الأرقام الموجودة بالملف (${dupes} رقم) مضافة مسبقاً وتم منع التكرار.`);
      } else {
        setErrorMsg('لم يتم العثور على أسطر مطابقة للتنسيق المطلوب: الاسم, الهاتف, المدينة, التخصص');
      }
    } catch (e: unknown) {
      setErrorMsg('حدث خطأ في قراءة وتحليل البيانات: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setCsvText(text);
      handleProcessCsv(text);
    };
    reader.readAsText(file);
  };

  return (
    <Modal
      onClose={onClose}
      size="md"
      icon={<Upload size={18} />}
      iconTone="brand"
      title="استيراد جهات اتصال خارجية"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
          <Button
            type="button"
            variant="primary"
            icon={<Check size={16} />}
            disabled={!csvText.trim()}
            onClick={() => handleProcessCsv(csvText)}
          >
            معالجة واستيراد البيانات
          </Button>
        </>
      }
    >
      {errorMsg && (
        <Banner tone="red" icon={<AlertCircle size={16} />}>
          <span className="ui-flex-fill">{errorMsg}</span>
          <button className="btn-close" onClick={() => setErrorMsg(null)}>×</button>
        </Banner>
      )}

      {importedCount !== null && importedCount > 0 && (
        <Banner tone="green" icon={<Check size={16} />}>
          <span className="ui-flex-fill">
            تم استيراد <strong>{importedCount}</strong> جهة اتصال بنجاح!
            {duplicatesCount ? ` (تم استبعاد ${duplicatesCount} رقم مكرر)` : ''}
          </span>
          <button className="btn-close" onClick={() => setImportedCount(null)}>×</button>
        </Banner>
      )}

      {/* Upload Dropzone */}
      <div className="import-dropzone">
        <input
          type="file"
          id="csv-file-input"
          accept=".csv, .txt"
          hidden
          onChange={handleFileUpload}
        />
        <label htmlFor="csv-file-input" className="dropzone-label">
          <div className="dropzone-icon-box">
            <FileSpreadsheet size={32} />
          </div>
          <h4 className="dropzone-title">اضغط لاختيار ملف CSV أو اسحبه هنا</h4>
          <p className="dropzone-sub">يدعم الملفات المصدرة من Excel بترميز UTF-8</p>
        </label>
      </div>

      {/* Format Guide */}
      <div className="import-guide-box">
        <div className="guide-header">
          <Info size={14} />
          <span>التنسيق المطلوب للأعمدة (مفصولة بفواصل):</span>
        </div>
        <code className="guide-code" dir="ltr">
          الاسم, الهاتف, المدينة, التخصص, الموقع
        </code>
        <p className="guide-example">
          مثال: مطعم الأصالة, 0791234567, عمان, مطاعم, https://example.com
        </p>
      </div>

      {/* Direct Paste Area */}
      <Field label="أو الصق محتوى البيانات النصية مباشرة:" icon={<FileText size={14} />} htmlFor="import-csv-text">
        <TextArea
          id="import-csv-text"
          rows={4}
          className="ui-input-phone"
          placeholder="مطعم الأصالة, 0790000000, الرياض, مطاعم, https://example.com"
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
        />
      </Field>
    </Modal>
  );
};
