import { Lead } from './types';
import { STATUS_LABELS, Locale } from './i18n';

export function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '');
  return cleaned;
}

export function exportToCSV(leads: Lead[], filename = 'leads.csv', locale: Locale = 'ar') {
  if (!leads.length) return;

  const isAr = locale === 'ar';

  const headers = isAr ? [
    'اسم المحل / الشركة',
    'رقم الهاتف',
    'المدينة',
    'العنوان التفصيلي',
    'الفئة / التصنيف',
    'التقييم',
    'عدد المراجعات',
    'الموقع الإلكتروني',
    'رابط خريطة جوجل',
    'حالة التواصل',
    'ملاحظات',
    'تاريخ الاستخراج'
  ] : [
    'Business Name',
    'Phone',
    'City',
    'Address',
    'Category',
    'Rating',
    'Reviews',
    'Website',
    'Google Maps URL',
    'Status',
    'Notes',
    'Extracted At'
  ];

  const rows = leads.map(lead => [
    `"${(lead.name || '').replace(/"/g, '""')}"`,
    `"${(lead.phone || '').replace(/"/g, '""')}"`,
    `"${(lead.city || '').replace(/"/g, '""')}"`,
    `"${(lead.address || '').replace(/"/g, '""')}"`,
    `"${(lead.category || '').replace(/"/g, '""')}"`,
    lead.rating || 0,
    lead.userRatingsTotal || 0,
    `"${(lead.website || '').replace(/"/g, '""')}"`,
    `"${(lead.googleMapsUrl || '').replace(/"/g, '""')}"`,
    `"${getStatusLabel(lead.status, locale)}"`,
    `"${(lead.notes || '').replace(/"/g, '""')}"`,
    `"${lead.extractedAt}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToVCF(leads: Lead[], filename = 'contacts.vcf') {
  if (!leads.length) return;

  let vcfContent = '';

  leads.forEach(lead => {
    if (!lead.phone) return;
    const cleanNum = formatPhoneForWhatsApp(lead.phone);
    vcfContent += `BEGIN:VCARD\n`;
    vcfContent += `VERSION:3.0\n`;
    vcfContent += `FN:${lead.name} (${lead.city})\n`;
    vcfContent += `ORG:${lead.name}\n`;
    vcfContent += `TEL;TYPE=CELL,VOICE:+${cleanNum}\n`;
    vcfContent += `ADR;TYPE=WORK:;;${lead.address};${lead.city};;;;\n`;
    if (lead.website) vcfContent += `URL:${lead.website}\n`;
    if (lead.notes) vcfContent += `NOTE:${lead.notes} - Rating: ${lead.rating}\n`;
    vcfContent += `END:VCARD\n`;
  });

  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function copyPhonesToClipboard(leads: Lead[]): boolean {
  const phones = leads
    .map(l => l.phone)
    .filter(Boolean)
    .join('\n');

  if (!phones) return false;

  navigator.clipboard.writeText(phones);
  return true;
}

export function getStatusLabel(status: string, locale: Locale = 'ar'): string {
  return STATUS_LABELS[locale]?.[status] || STATUS_LABELS.ar[status] || status;
}
