'use client';

import { useState, useCallback } from 'react';
import { Lead, ValidationState, LinkStatus } from '@/lib/types';
import { getWhatsAppConfig, WhatsAppConfig } from '@/lib/whatsappProviders';

export function useValidation() {
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const validateLead = useCallback(async (lead: Lead): Promise<ValidationState> => {
    const config = getWhatsAppConfig();
    const urlsToCheck: string[] = [];

    if (lead.website) urlsToCheck.push(lead.website);
    if (lead.socialLinks?.instagram) urlsToCheck.push(lead.socialLinks.instagram);
    if (lead.socialLinks?.facebook) urlsToCheck.push(lead.socialLinks.facebook);
    if (lead.socialLinks?.tiktok) urlsToCheck.push(lead.socialLinks.tiktok);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'validateLead',
          phone: lead.phone,
          urls: urlsToCheck,
          whatsappConfig: config,
        }),
      });
      const data = await res.json();

      const state: ValidationState = {
        validatedAt: new Date().toISOString(),
      };

      if (typeof data.whatsapp === 'boolean') {
        state.whatsapp = data.whatsapp;
      }

      if (data.links) {
        if (lead.website) state.website = data.links[extractKey(lead.website)] || 'unknown';
        if (lead.socialLinks?.instagram) state.instagram = data.links.instagram || 'unknown';
        if (lead.socialLinks?.facebook) state.facebook = data.links.facebook || 'unknown';
        if (lead.socialLinks?.tiktok) state.tiktok = data.links.tiktok || 'unknown';
      }

      return state;
    } catch {
      return { validatedAt: new Date().toISOString() };
    }
  }, []);

  const validateLeads = useCallback(async (
    leads: Lead[],
    onUpdate: (leadId: string, validation: ValidationState) => void
  ) => {
    setValidating(true);
    setProgress({ done: 0, total: leads.length });

    const BATCH_SIZE = 3;
    for (let i = 0; i < leads.length; i += BATCH_SIZE) {
      const batch = leads.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map(async (lead) => {
          const validation = await validateLead(lead);
          onUpdate(lead.id, validation);
          setProgress(prev => ({ ...prev, done: prev.done + 1 }));
        })
      );
    }

    setValidating(false);
  }, [validateLead]);

  return { validateLead, validateLeads, validating, progress };
}

function extractKey(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname.split('.')[0];
  } catch {
    return 'unknown';
  }
}
