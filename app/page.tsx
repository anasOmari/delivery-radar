'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { StatsOverview } from '@/components/StatsOverview';
import { AnalyticsWidget } from '@/components/AnalyticsWidget';
import { LeadTable } from '@/components/LeadTable';
import { WhatsAppModal } from '@/components/WhatsAppModal';
import { WhatsAppSettingsModal } from '@/components/WhatsAppSettingsModal';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { ChatbotModal } from '@/components/ChatbotModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ExportModal } from '@/components/ExportModal';
import { ImportModal } from '@/components/ImportModal';
import { WebsiteAuditModal } from '@/components/WebsiteAuditModal';
import { ProposalStudio } from '@/components/ProposalStudio';
import { FollowUpModal } from '@/components/FollowUpModal';
import { SavedListsModal, CampaignList } from '@/components/SavedListsModal';
import { Lead, LeadStatus, SearchParams } from '@/lib/types';
import { INITIAL_MOCK_LEADS } from '@/lib/mockData';
import { calculateOpportunity, applyTemplate } from '@/lib/opportunity';
import { useLanguage } from '@/lib/LanguageContext';
import { useValidation } from '@/lib/useValidation';
import {
  getWhatsAppConfig,
  WhatsAppConfig,
  DEFAULT_AUTO_MESSAGE_TEMPLATE
} from '@/lib/whatsappProviders';
import { AlertTriangle, CheckCircle, Info, RefreshCw, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { 
  getLeadVault, 
  autoSaveLeadsToVault, 
  getSeenPlaceIds 
} from '@/lib/leadVault';
import { syncLeadsToSupabase } from '@/lib/supabase';
import { phoneValidationError } from '@/lib/phone';

export default function Home() {
  const { t, locale, dir } = useLanguage();
  const router = useRouter();
  const { user, loading: authLoading, updatePhone } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCity, setActiveCity] = useState('عمان');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [apiNotification, setApiNotification] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // One-time phone prompt (OAuth users have no phone on their profile)
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [promptPhone, setPromptPhone] = useState('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [promptSaving, setPromptSaving] = useState(false);

  useEffect(() => {
    if (authLoading || !user || user.phone) return;
    try {
      if (localStorage.getItem('phone_prompt_dismissed') === '1') return;
    } catch {}
    setShowPhonePrompt(true);
  }, [authLoading, user]);

  const dismissPhonePrompt = () => {
    setShowPhonePrompt(false);
    try {
      localStorage.setItem('phone_prompt_dismissed', '1');
    } catch {}
  };

  const savePromptPhone = async () => {
    setPromptError(null);
    const err = phoneValidationError(promptPhone, locale);
    if (err) {
      setPromptError(err);
      return;
    }
    setPromptSaving(true);
    const { error } = await updatePhone(promptPhone);
    setPromptSaving(false);
    if (error) {
      setPromptError(error);
      return;
    }
    setShowPhonePrompt(false);
    setApiNotification({
      type: 'success',
      message: locale === 'ar' ? 'تم حفظ رقم الهاتف على حسابك.' : 'Phone number saved to your account.',
    });
  };

  // Vault & Pagination States
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [lastSearchParams, setLastSearchParams] = useState<SearchParams | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
    const syncTheme = (event: StorageEvent) => {
      if (event.key !== 'app_theme' && event.key !== null) return;
      const nextTheme = event.newValue === 'light' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
    };
    window.addEventListener('storage', syncTheme);
    return () => window.removeEventListener('storage', syncTheme);
  }, []);

  // WhatsApp & Settings States
  const [whatsAppLead, setWhatsAppLead] = useState<Lead | null>(null);
  const [whatsAppCustomText, setWhatsAppCustomText] = useState<string | undefined>(undefined);
  const [campaignLeadsList, setCampaignLeadsList] = useState<Lead[]>([]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showWhatsAppSettingsModal, setShowWhatsAppSettingsModal] = useState(false);
  const [showDirectMessageModal, setShowDirectMessageModal] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [whatsAppConfig, setWhatsAppConfig] = useState<WhatsAppConfig>({ provider: 'none' });

  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSavedListsModal, setShowSavedListsModal] = useState(false);
  const [proposalLead, setProposalLead] = useState<Lead | null>(null);
  useEffect(() => {
    if (!proposalLead) return;
    const previousScroll = window.scrollY;
    window.scrollTo(0, 0);
    return () => window.scrollTo(0, previousScroll);
  }, [proposalLead]);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [auditLead, setAuditLead] = useState<Lead | null>(null);

  const { validateLeads, validating, progress } = useValidation();

  // Require auth: mobile-number login. Redirect guests to /login.
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('gmaps_api_key') || '';
      const savedLeads = localStorage.getItem('gmaps_leads');

      setApiKey(savedKey);

      // Load WhatsApp Config
      const waCfg = getWhatsAppConfig();
      setWhatsAppConfig(waCfg);

      // Initialize vault count
      const vault = getLeadVault();
      setVaultCount(vault.length);

      if (savedLeads) {
        const parsed: Lead[] = JSON.parse(savedLeads);
        const scored = parsed.map(l => {
          const opp = calculateOpportunity(l);
          return {
            ...l,
            opportunityScore: l.opportunityScore || opp.score,
            opportunityReason: l.opportunityReason || opp.reason,
            priority: l.priority || opp.priority
          };
        });
        setLeads(scored);
        syncLeadsToSupabase(
          scored.map((l) => ({
            name: l.name,
            phone: l.phone,
            city: l.city || 'عمان',
            category: l.category,
            rating: l.rating,
            address: l.address,
            status: l.status,
            notes: l.notes,
            opportunity_score: l.opportunityScore,
          }))
        );
      } else if (vault.length > 0) {
        // Fallback to vault if saved leads empty
        const initialSlice = vault.slice(0, 30);
        setLeads(initialSlice);
        syncLeadsToSupabase(
          initialSlice.map((l) => ({
            name: l.name,
            phone: l.phone,
            city: l.city || 'عمان',
            category: l.category,
            rating: l.rating,
            address: l.address,
            status: l.status,
            notes: l.notes,
            opportunity_score: l.opportunityScore,
          }))
        );
      } else {
        const scoredInitial = INITIAL_MOCK_LEADS.map(l => {
          const opp = calculateOpportunity(l);
          return { ...l, opportunityScore: opp.score, opportunityReason: opp.reason, priority: opp.priority };
        });
        setLeads(scoredInitial);
        autoSaveLeadsToVault(scoredInitial);
        setVaultCount(scoredInitial.length);
        syncLeadsToSupabase(
          scoredInitial.map((l) => ({
            name: l.name,
            phone: l.phone,
            city: l.city || 'عمان',
            category: l.category,
            rating: l.rating,
            address: l.address,
            status: l.status,
            notes: l.notes,
            opportunity_score: l.opportunityScore,
          }))
        );
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      setLeads(INITIAL_MOCK_LEADS);
    }
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('app_theme', nextTheme);
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  const updateLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    try {
      localStorage.setItem('gmaps_leads', JSON.stringify(newLeads));
    } catch (e) {
      console.error('Error saving leads to localStorage:', e);
    }
    try {
      syncLeadsToSupabase(
        newLeads.map((l) => ({
          name: l.name,
          phone: l.phone,
          city: l.city || activeCity,
          category: l.category,
          rating: l.rating,
          address: l.address,
          status: l.status,
          notes: l.notes,
          opportunity_score: l.opportunityScore,
        }))
      );
    } catch {}
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('gmaps_api_key', key);
    } catch (e) {
      console.error('Error saving API Key:', e);
    }
    setApiNotification({
      type: 'success',
      message: t('notify.apikey_saved')
    });
  };

  const handleClearLeads = () => {
    updateLeads([]);
    setSelectedIds([]);
    setApiNotification({ type: 'warning', message: t('notify.cleared') });
  };

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    setActiveCity(params.city || (locale === 'ar' ? 'المنطقة الحضرية' : 'Urban Area'));
    setApiNotification(null);
    setLastSearchParams(params);

    try {
      const countryParam = params.country ? `&country=${encodeURIComponent(params.country)}` : '';
      const limitParam = `&limit=${params.limit || 50}`;
      
      // Deduplication parameter: pass seen place IDs to skip duplicates
      let dedupeParam = '';
      if (params.skipDuplicates !== false) {
        const seenIds = getSeenPlaceIds();
        if (seenIds.length > 0) {
          dedupeParam = `&skipDuplicates=true&excludePlaceIds=${encodeURIComponent(seenIds.slice(-200).join(','))}`;
        }
      }

      const res = await fetch(`/api/places?query=${encodeURIComponent(params.query)}&city=${encodeURIComponent(params.city)}${countryParam}${limitParam}${dedupeParam}`, {
        headers: {
          'x-google-api-key': apiKey
        }
      });
      const data = await res.json();

      if (data.success && data.leads) {
        setIsLiveApi(data.mode === 'live_google_api');

        if (data.leads.length === 0) {
          const vault = getLeadVault();
          if (vault.length > 0) {
            updateLeads(vault.slice(0, 40));
            setApiNotification({
              type: 'success',
              message: locale === 'ar'
                ? `لا توجد نتائج جديدة. تم عرض السجلات المحفوظة.`
                : `No new results. Showing saved leads.`
            });
          } else {
            setApiNotification({
              type: 'warning',
              message: locale === 'ar' ? 'لم يتم العثور على نتائج جديدة' : 'No new results found'
            });
          }
          return;
        }

        updateLeads(data.leads);
        setSelectedIds([]);

        // Auto-save all retrieved leads into permanent local Lead Vault
        const vaultRes = autoSaveLeadsToVault(data.leads);
        setVaultCount(vaultRes.totalVaultCount);

        // Update pagination token
        setNextPageToken(data.nextPageToken || null);
        setHasMore(Boolean(data.hasMore && data.nextPageToken));

        if (data.mode === 'live_google_api') {
          let msg = `${locale === 'ar' ? 'تم جلب' : 'Fetched'} ${data.count} ${locale === 'ar' ? 'نتيجة وحفظها محلياً.' : 'results and saved them locally.'}`;
          if (data.skippedCount > 0) {
            msg += ` ${locale === 'ar' ? `(تم استبعاد ${data.skippedCount} سجل مكرر)` : `(Skipped ${data.skippedCount} saved leads)`}`;
          }
          setApiNotification({
            type: 'success',
            message: msg
          });
        } else {
          let msg = `${locale === 'ar' ? `تم استخراج ${data.count} سجل تجريبي وحفظها محلياً` : `Extracted ${data.count} demo leads and saved locally`}`;
          if (data.skippedCount > 0) {
            msg += ` ${locale === 'ar' ? `(تم تفادي ${data.skippedCount} سجل مكرر)` : `(Avoided ${data.skippedCount} duplicates)`}`;
          }
          setApiNotification({
            type: 'warning',
            message: msg
          });
        }
      } else {
        setIsLiveApi(false);
        setApiNotification({
          type: 'error',
          message: data.message || t('notify.api_error')
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setApiNotification({
        type: 'error',
        message: t('notify.server_error')
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || !lastSearchParams || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const countryParam = lastSearchParams.country ? `&country=${encodeURIComponent(lastSearchParams.country)}` : '';
      const seenIds = getSeenPlaceIds();
      const dedupeParam = seenIds.length > 0 ? `&skipDuplicates=true&excludePlaceIds=${encodeURIComponent(seenIds.slice(-200).join(','))}` : '';

      const res = await fetch(`/api/places?query=${encodeURIComponent(lastSearchParams.query)}&city=${encodeURIComponent(lastSearchParams.city)}${countryParam}&pagetoken=${encodeURIComponent(nextPageToken)}&limit=20${dedupeParam}`, {
        headers: {
          'x-google-api-key': apiKey
        }
      });
      const data = await res.json();

      if (data.success && data.leads && data.leads.length > 0) {
        const merged = [...leads, ...data.leads];
        updateLeads(merged);
        
        // Auto-save incoming batch into vault
        const vaultRes = autoSaveLeadsToVault(data.leads);
        setVaultCount(vaultRes.totalVaultCount);

        setNextPageToken(data.nextPageToken || null);
        setHasMore(Boolean(data.hasMore && data.nextPageToken));

        setApiNotification({
          type: 'success',
          message: `${locale === 'ar' ? 'تمت إضافة' : 'Added'} ${data.leads.length} ${locale === 'ar' ? 'سجل. الإجمالي:' : 'leads. Total:'} ${merged.length} ${locale === 'ar' ? 'محل' : 'leads'}`
        });
      } else {
        setHasMore(false);
        setApiNotification({
          type: 'warning',
          message: locale === 'ar' ? 'اكتملت نتائج البحث ولا توجد صفحات إضافية متوفرة على الخريطة' : 'No further results available on Google Maps for this query.'
        });
      }
    } catch (e: any) {
      console.error('Load more error:', e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleViewAllVault = () => {
    const vault = getLeadVault();
    if (vault.length === 0) {
      setApiNotification({
        type: 'warning',
        message: locale === 'ar' ? 'قاعدة البيانات المحلية فارغة حالياً. قم بإجراء بحث ليتم حفظ السجلات تلقائياً.' : 'Local vault is empty. Perform a search to auto-save.'
      });
      return;
    }
    updateLeads(vault);
    setSelectedIds([]);
    setActiveCity(locale === 'ar' ? 'الأرشيف المحلي الشامل' : 'Complete Local Vault');
    setHasMore(false);
    setApiNotification({
      type: 'success',
      message: `${locale === 'ar' ? 'تم استعراض كافة السجلات المحفوظة في قاعدة بياناتك المحلية' : 'Viewing all locally saved leads'} (${vault.length} ${locale === 'ar' ? 'جهة اتصال' : 'contacts'}) `
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(leads.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleStatusChange = (id: string, newStatus: LeadStatus) => {
    const updated = leads.map(l => l.id === id ? { ...l, status: newStatus } : l);
    updateLeads(updated);
  };

  const handleNoteChange = (id: string, notes: string) => {
    const updated = leads.map(l => l.id === id ? { ...l, notes } : l);
    updateLeads(updated);
  };

  const handleDeleteLead = (id: string) => {
    const updated = leads.filter(l => l.id !== id);
    setSelectedIds(prev => prev.filter(item => item !== id));
    updateLeads(updated);
  };

  const handleStartCampaign = (selectedLeads: Lead[]) => {
    setCampaignLeadsList(selectedLeads);
  };

  const handleSaveFollowUp = (leadId: string, date: string, notes: string, status: LeadStatus) => {
    const updated = leads.map(l => {
      if (l.id === leadId) {
        return { ...l, followUpDate: date, followUpNotes: notes, status };
      }
      return l;
    });
    updateLeads(updated);
    setApiNotification({
      type: 'success',
      message: `${t('notify.followup_saved')} (${date})`
    });
  };

  const handleLoadCampaignList = (campaignList: CampaignList) => {
    if (campaignList.leads && campaignList.leads.length > 0) {
      updateLeads(campaignList.leads);
      setSelectedIds([]);
      setActiveCity(campaignList.city || (locale === 'ar' ? 'المنطقة' : 'Region'));
      setApiNotification({
        type: 'success',
        message: `${t('notify.list_loaded')} "${campaignList.name}" (${campaignList.leads.length} ${locale === 'ar' ? 'محل' : 'leads'})`
      });
    }
  };

  const handleImportLeads = (newLeads: Lead[]) => {
    const merged = [...newLeads, ...leads];
    updateLeads(merged);
    setApiNotification({
      type: 'success',
      message: `${t('notify.import_merged')} ${newLeads.length} ${locale === 'ar' ? 'جهة اتصال' : 'contacts'}`
    });
  };

  const handleOpenWhatsAppWithText = (lead: Lead, text: string) => {
    setWhatsAppLead(lead);
    setWhatsAppCustomText(text);
    setCampaignLeadsList([]);
    setAuditLead(null);
  };

  const handleOpenWhatsApp = async (lead: Lead) => {
    const cfg = getWhatsAppConfig();
    
    // Direct 1-Click Auto-Send if enabled and Green-API is configured
    if (cfg.provider === 'greenapi' && cfg.autoSendDirectly && lead.phone) {
      const msgTemplate = cfg.autoMessageTemplate || DEFAULT_AUTO_MESSAGE_TEMPLATE;
      const text = applyTemplate(msgTemplate, lead);

      setApiNotification({
        type: 'warning',
        message: locale === 'ar'
          ? `⏳ جاري إرسال الرسالة إلى "${lead.name}" عبر Green-API...`
          : `⏳ Auto-sending message to "${lead.name}" via Green-API...`
      });

      try {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            config: cfg,
            message: { to: lead.phone, text },
            action: 'send'
          })
        });
        const result = await res.json();

        if (result.success) {
          handleStatusChange(lead.id, 'contacted');
          setApiNotification({
            type: 'success',
            message: locale === 'ar'
              ? `✅ تم إرسال الرسالة إلى "${lead.name}" (${lead.phone}) بنجاح.`
              : `✅ Message successfully delivered to "${lead.name}".`
          });
        } else {
          setApiNotification({
            type: 'error',
            message: `${locale === 'ar' ? '❌ تعذر الإرسال عبر Green-API:' : '❌ Green-API Error:'} ${result.error || 'Check settings'}`
          });
          // Fallback: open WhatsApp modal so user can preview or retry
          setWhatsAppLead(lead);
          setWhatsAppCustomText(text);
        }
      } catch {
        setApiNotification({
          type: 'error',
          message: locale === 'ar' ? '❌ خطأ أثناء الاتصال بالخادم' : '❌ Server communication error'
        });
      }
      return;
    }

    // Default flow: open WhatsApp modal
    setWhatsAppLead(lead);
    setWhatsAppCustomText(undefined);
    setCampaignLeadsList([]);
  };

  const handleValidateLeads = (leadsToValidate: Lead[]) => {
    validateLeads(leadsToValidate, (leadId, validation) => {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, validation } : l));
    });
  };

  if (authLoading || !user) {
    return (
      <main className="app-container flex-center" style={{ minHeight: '60vh' }} dir={dir}>
        <span className="subtext">{locale === 'ar' ? 'جاري التحقق من الجلسة...' : 'Checking session...'}</span>
      </main>
    );
  }

  if (proposalLead) {
    return (
      <main className="app-container studio-fullscreen-container" style={{ padding: 0 }}>
        <ProposalStudio
          lead={proposalLead}
          onBack={() => setProposalLead(null)}
          theme={theme}
        />
      </main>
    );
  }

  const isWaActive = Boolean(whatsAppConfig.provider && whatsAppConfig.provider !== 'none');

  return (
    <main className="app-container" dir={dir}>
      <Header
        apiKey={apiKey}
        onOpenApiKeyModal={() => setShowApiKeyModal(true)}
        onOpenMessageSettingsModal={() => setShowWhatsAppSettingsModal(true)}
        onOpenDirectMessageModal={() => setShowDirectMessageModal(true)}
        onOpenChatbotModal={() => setShowChatbotModal(true)}
        onOpenExportModal={() => setShowExportModal(true)}
        onOpenSavedListsModal={() => setShowSavedListsModal(true)}
        onOpenImportModal={() => setShowImportModal(true)}
        leadsCount={leads.length}
        selectedCount={selectedIds.length}
        dueFollowUpsCount={leads.filter(l => l.followUpDate === new Date().toISOString().split('T')[0]).length}
        isLiveApi={isLiveApi}
        isWhatsAppConfigured={isWaActive}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <div className="app-main-content">
        {showPhonePrompt && (
          <div className="notification-banner banner-warning phone-prompt-banner">
            <div className="phone-prompt-body">
              <span>{locale === 'ar' ? 'أضف رقم هاتفك لإكمال حسابك (يُستخدم للتواصل والتنبيهات).' : 'Add your mobile number to complete your account (used for contact & alerts).'}</span>
              <div className="phone-prompt-row">
                <input
                  className="input-field auth-input-ltr phone-prompt-input"
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  placeholder={locale === 'ar' ? 'مثال: 0791234567' : 'e.g. 0791234567'}
                  value={promptPhone}
                  onChange={(e) => setPromptPhone(e.target.value)}
                />
                <button className="btn btn-primary btn-sm" onClick={savePromptPhone} disabled={promptSaving}>
                  {promptSaving ? (locale === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('action.save')}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={dismissPhonePrompt}>
                  {locale === 'ar' ? 'لاحقاً' : 'Later'}
                </button>
              </div>
              {promptError && <span className="phone-prompt-error">{promptError}</span>}
            </div>
            <button className="btn-close" onClick={dismissPhonePrompt}>&times;</button>
          </div>
        )}
        {apiNotification && (
          <div className={`notification-banner banner-${apiNotification.type}`}>
            <div className="flex-align gap-2">
              {apiNotification.type === 'success' && <CheckCircle size={18} />}
              {apiNotification.type === 'error' && <AlertTriangle size={18} />}
              {apiNotification.type === 'warning' && <Info size={18} />}
              <span>{apiNotification.message}</span>
            </div>
            <button className="btn-close" onClick={() => setApiNotification(null)}>&times;</button>
          </div>
        )}

        <SearchBar
          onSearch={handleSearch}
          isLoading={isLoading}
          vaultCount={vaultCount}
          onViewVault={handleViewAllVault}
        />

        <StatsOverview leads={leads} />

        <AnalyticsWidget leads={leads} />

        <LeadTable
          leads={leads}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onStatusChange={handleStatusChange}
          onNoteChange={handleNoteChange}
          onDeleteLead={handleDeleteLead}
          onOpenWhatsApp={handleOpenWhatsApp}
          onStartCampaign={handleStartCampaign}
          onOpenProposal={(lead) => setProposalLead(lead)}
          onOpenFollowUp={(lead) => setFollowUpLead(lead)}
          onOpenAudit={(lead) => setAuditLead(lead)}
          activeCity={activeCity}
          onValidate={handleValidateLeads}
          validating={validating}
          validateProgress={progress}
        />

        {/* Load More Results (+20 Leads from Google Maps Pagination) */}
        {hasMore && (
          <div className="load-more-container">
            <button
              type="button"
              className="btn-load-more"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="spin" size={16} />
                  <span>{locale === 'ar' ? 'جاري جلب الدفعة التالية من جوجل...' : 'Fetching next batch...'}</span>
                </>
              ) : (
                <>
                  <Layers size={16} />
                  <span>{locale === 'ar' ? 'عرض المزيد' : 'Load more'}</span>
                </>
              )}
            </button>
          </div>
        )}

        {leads.length > 0 && (
          <div className="flex-between" style={{ marginTop: '20px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleClearLeads}>
              {locale === 'ar' ? 'مسح نتائج الجدول المعروض' : 'Clear Current Table Results'}
            </button>
            <div className="flex-align gap-2">
              <span className="text-sm subtext">
                {locale === 'ar' ? `المعروض حالياً: ${leads.length} محل` : `Displaying: ${leads.length} leads`}
              </span>
              <span className="subtext">•</span>
              <span className="text-sm text-success" style={{ fontWeight: 600 }}>
                {locale === 'ar' ? `الأرشيف المحلي المحفوظ: ${vaultCount} محل` : `Archived in vault: ${vaultCount} leads`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(whatsAppLead || campaignLeadsList.length > 0) && (
        <WhatsAppModal
          lead={whatsAppLead}
          campaignLeads={campaignLeadsList}
          initialCustomText={whatsAppCustomText}
          onClose={() => {
            setWhatsAppLead(null);
            setWhatsAppCustomText(undefined);
            setCampaignLeadsList([]);
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {showDirectMessageModal && (
        <DirectMessageModal
          onClose={() => setShowDirectMessageModal(false)}
          onSuccess={(phone) => {
            setApiNotification({
              type: 'success',
              message: locale === 'ar'
                ? `تم إرسال الرسالة إلى (${phone}) بنجاح.`
                : `Message sent to (${phone}).`
            });
          }}
        />
      )}

      {showChatbotModal && (
        <ChatbotModal
          onClose={() => setShowChatbotModal(false)}
          onOpenSettings={() => {
            setShowChatbotModal(false);
            setShowWhatsAppSettingsModal(true);
          }}
        />
      )}

      {showWhatsAppSettingsModal && (
        <WhatsAppSettingsModal
          onClose={() => setShowWhatsAppSettingsModal(false)}
          onSaved={(cfg) => {
            setWhatsAppConfig(cfg);
            setApiNotification({
              type: 'success',
              message: locale === 'ar'
                ? 'تم حفظ إعدادات الرسائل.'
                : 'Message settings saved.'
            });
          }}
        />
      )}

      {followUpLead && (
        <FollowUpModal
          lead={followUpLead}
          onSave={handleSaveFollowUp}
          onClose={() => setFollowUpLead(null)}
        />
      )}

      {auditLead && (
        <WebsiteAuditModal
          lead={auditLead}
          onClose={() => setAuditLead(null)}
          onOpenWhatsAppWithText={handleOpenWhatsAppWithText}
        />
      )}

      {showImportModal && (
        <ImportModal
          existingLeads={leads}
          onImport={handleImportLeads}
          onClose={() => setShowImportModal(false)}
        />
      )}

      {showSavedListsModal && (
        <SavedListsModal
          currentLeads={leads}
          onLoadList={handleLoadCampaignList}
          onClose={() => setShowSavedListsModal(false)}
        />
      )}

      {showApiKeyModal && (
        <ApiKeyModal
          currentApiKey={apiKey}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          leads={leads}
          selectedIds={selectedIds}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </main>
  );
}
