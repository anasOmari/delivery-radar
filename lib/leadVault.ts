import { Lead } from './types';

const VAULT_STORAGE_KEY = 'gmaps_leads_vault';
const CACHE_STORAGE_KEY = 'gmaps_search_cache';
const SEEN_IDS_KEY = 'gmaps_seen_place_ids';

/**
 * Get all permanently archived leads from the local vault.
 */
export function getLeadVault(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(VAULT_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to read lead vault from localStorage:', e);
    return [];
  }
}

/**
 * Get the set of all place IDs and unique keys ever retrieved.
 */
export function getSeenPlaceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SEEN_IDS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Fallback to extracting from existing vault
    const vault = getLeadVault();
    const ids = vault.map(l => l.placeId || l.id).filter(Boolean);
    return ids;
  } catch (e) {
    return [];
  }
}

/**
 * Auto-save leads to the vault.
 * Automatically de-duplicates by placeId, phone, or name+city.
 * Preserves user edits (notes, status, follow-up dates).
 */
export function autoSaveLeadsToVault(newLeads: Lead[]): {
  addedCount: number;
  updatedCount: number;
  totalVaultCount: number;
} {
  if (typeof window === 'undefined' || !newLeads || newLeads.length === 0) {
    const current = getLeadVault();
    return { addedCount: 0, updatedCount: 0, totalVaultCount: current.length };
  }

  try {
    const existingVault = getLeadVault();
    const vaultMap = new Map<string, Lead>();

    // Index existing vault by placeId and phone
    existingVault.forEach(l => {
      const key = getLeadDedupeKey(l);
      vaultMap.set(key, l);
    });

    let addedCount = 0;
    let updatedCount = 0;

    newLeads.forEach(incoming => {
      const key = getLeadDedupeKey(incoming);
      if (vaultMap.has(key)) {
        // Update without overwriting user-edited CRM data
        const current = vaultMap.get(key)!;
        vaultMap.set(key, {
          ...incoming,
          // Preserve CRM modifications
          status: current.status !== 'new' ? current.status : incoming.status,
          notes: current.notes || incoming.notes,
          followUpDate: current.followUpDate || incoming.followUpDate,
          followUpNotes: current.followUpNotes || incoming.followUpNotes,
          tag: current.tag || incoming.tag,
          isNew: false
        });
        updatedCount++;
      } else {
        vaultMap.set(key, { ...incoming, isNew: true });
        addedCount++;
      }
    });

    const merged = Array.from(vaultMap.values());
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(merged));

    // Update seen IDs set
    const seenIds = merged.map(l => l.placeId || l.id).filter(Boolean);
    localStorage.setItem(SEEN_IDS_KEY, JSON.stringify(seenIds));

    return {
      addedCount,
      updatedCount,
      totalVaultCount: merged.length
    };
  } catch (e) {
    console.error('Error auto-saving leads to vault:', e);
    return { addedCount: 0, updatedCount: 0, totalVaultCount: 0 };
  }
}

/**
 * Helper to generate a unique key for deduplication.
 */
export function getLeadDedupeKey(lead: Partial<Lead>): string {
  if (lead.placeId && lead.placeId.length > 5) return `pid_${lead.placeId}`;
  if (lead.formattedPhone && lead.formattedPhone.length >= 7) return `ph_${lead.formattedPhone}`;
  if (lead.phone && lead.phone.replace(/[^\d]/g, '').length >= 7) return `ph_${lead.phone.replace(/[^\d]/g, '')}`;
  return `nc_${(lead.name || '').trim().toLowerCase()}_${(lead.city || '').trim().toLowerCase()}`;
}

/**
 * Check if a lead has already been retrieved previously.
 */
export function isLeadAlreadySeen(lead: Partial<Lead>, seenIdsSet: Set<string>): boolean {
  if (lead.placeId && seenIdsSet.has(lead.placeId)) return true;
  if (lead.id && seenIdsSet.has(lead.id)) return true;
  return false;
}

/**
 * Search cache helper: get cached leads if matching query+city+country exists.
 */
export function getCachedSearch(query: string, city: string, country: string): Lead[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const key = `${query.trim()}|${city.trim()}|${country.trim()}`.toLowerCase();
    return cache[key] || null;
  } catch {
    return null;
  }
}

/**
 * Search cache helper: store search results.
 */
export function setCachedSearch(query: string, city: string, country: string, leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    const key = `${query.trim()}|${city.trim()}|${country.trim()}`.toLowerCase();
    cache[key] = leads;
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to set search cache:', e);
  }
}
