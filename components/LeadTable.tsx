'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  MessageCircle,
  ExternalLink,
  Star,
  Search,
  Globe,
  MapPin,
  CheckSquare,
  Square,
  ArrowUpDown,
  Edit3,
  Check,
  LayoutGrid,
  List,
  Columns,
  Map as MapIcon,
  Trash2,
  PhoneCall,
  Send,
  Mail,
  Calendar,
  Clock,
  FileText,
  Gauge,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  MessageSquareOff
} from 'lucide-react';
import { InstagramIcon, FacebookIcon } from './SocialIcons';
import { Lead, LeadStatus, FilterState } from '@/lib/types';
import { getStatusLabel, formatPhoneForWhatsApp } from '@/lib/exporter';
import { useLanguage } from '@/lib/LanguageContext';
import { MapView } from './MapView';
import { checkPhoneWhatsAppEligibility } from '@/lib/opportunity';
import { Button, Field, TextInput, StatusPill, Banner, EmptyState } from './ui';
import type { StatusTone } from './ui';

interface LeadTableProps {
  leads: Lead[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onStatusChange: (id: string, newStatus: LeadStatus) => void;
  onNoteChange: (id: string, notes: string) => void;
  onDeleteLead: (id: string) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onStartCampaign: (selectedLeads: Lead[]) => void;
  onOpenProposal: (lead: Lead) => void;
  onOpenFollowUp: (lead: Lead) => void;
  onOpenAudit: (lead: Lead) => void;
  activeCity: string;
  onValidate?: (leads: Lead[]) => void;
  validating?: boolean;
  validateProgress?: { done: number; total: number };
}

const STATUS_TONE: Record<LeadStatus, StatusTone> = {
  new: 'purple',
  contacted: 'blue',
  interested: 'amber',
  converted: 'green',
  rejected: 'red'
};

const KANBAN_STAGES: { id: LeadStatus; titleKey: string; tone: StatusTone }[] = [
  { id: 'new', titleKey: 'kanban.new', tone: 'purple' },
  { id: 'contacted', titleKey: 'kanban.contacted', tone: 'blue' },
  { id: 'interested', titleKey: 'kanban.interested', tone: 'amber' },
  { id: 'converted', titleKey: 'kanban.converted', tone: 'green' },
  { id: 'rejected', titleKey: 'kanban.rejected', tone: 'red' }
];

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onStatusChange,
  onNoteChange,
  onDeleteLead,
  onOpenWhatsApp,
  onStartCampaign,
  onOpenProposal,
  onOpenFollowUp,
  onOpenAudit,
  activeCity,
  onValidate,
  validating = false,
  validateProgress
}) => {
  const { t, locale } = useLanguage();

  const [preferredView, setViewMode] = useState<'table' | 'cards' | 'kanban' | 'map' | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const viewMode = preferredView ?? (isMobile ? 'cards' : 'table');
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    status: 'all',
    hasPhoneOnly: false,
    websiteFilter: 'all',
    socialFilter: 'all',
    hasEmailOnly: false,
    priorityFilter: 'all',
    followUpFilter: 'all',
    tagFilter: 'all',
    minRating: 0,
    sortBy: 'opportunityScore',
    sortOrder: 'desc'
  });

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  // Table Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const todayStr = new Date().toISOString().split('T')[0];

  // Reset to page 1 whenever filters or leads count changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination to first page when filters or result count change
    setCurrentPage(1);
  }, [filters, leads.length]);

  // Filter and Sort leads
  const filteredLeads = leads
    .filter(lead => {
      const matchesSearch =
        lead.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        lead.phone.includes(filters.searchTerm) ||
        (lead.email && lead.email.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
        lead.category.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        lead.address.toLowerCase().includes(filters.searchTerm.toLowerCase());

      const matchesStatus = filters.status === 'all' || lead.status === filters.status;
      const matchesPhone = !filters.hasPhoneOnly || (lead.phone && lead.phone.length > 5);

      const matchesWebsite =
        filters.websiteFilter === 'all' ||
        (filters.websiteFilter === 'has_website' && Boolean(lead.website)) ||
        (filters.websiteFilter === 'no_website' && !lead.website);

      const hasSocials = Boolean(
        lead.socialLinks && (lead.socialLinks.instagram || lead.socialLinks.facebook)
      );
      const matchesSocial =
        filters.socialFilter === 'all' ||
        (filters.socialFilter === 'has_social' && hasSocials) ||
        (filters.socialFilter === 'no_social' && !hasSocials);

      const matchesEmail = !filters.hasEmailOnly || Boolean(lead.email);

      const matchesPriority =
        filters.priorityFilter === 'all' || lead.priority === filters.priorityFilter;

      let matchesFollowUp = true;
      if (filters.followUpFilter === 'due_today') {
        matchesFollowUp = Boolean(lead.followUpDate && lead.followUpDate === todayStr);
      } else if (filters.followUpFilter === 'scheduled') {
        matchesFollowUp = Boolean(lead.followUpDate);
      }

      const matchesRating = (lead.rating || 0) >= filters.minRating;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPhone &&
        matchesWebsite &&
        matchesSocial &&
        matchesEmail &&
        matchesPriority &&
        matchesFollowUp &&
        matchesRating
      );
    })
    .sort((a, b) => {
      const key = filters.sortBy;
      let valA: string | number = (a[key] as string | number | undefined) ?? 0;
      let valB: string | number = (b[key] as string | number | undefined) ?? 0;

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });

  // Calculate pagination boundaries
  const totalItems = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const allSelected = filteredLeads.length > 0 && filteredLeads.every(l => selectedIds.includes(l.id));

  const handleStartEditNote = (lead: Lead) => {
    setEditingNoteId(lead.id);
    setTempNote(lead.notes || '');
  };

  const handleSaveNote = (id: string) => {
    onNoteChange(id, tempNote);
    setEditingNoteId(null);
  };

  const selectedLeadsList = leads.filter(l => selectedIds.includes(l.id));

  // Quick move lead stage in Kanban
  const handleMoveStage = (leadId: string, currentStatus: LeadStatus, direction: 'next' | 'prev') => {
    const stageOrder: LeadStatus[] = ['new', 'contacted', 'interested', 'converted'];
    const currentIndex = stageOrder.indexOf(currentStatus);
    if (currentIndex === -1) return;

    if (direction === 'next' && currentIndex < stageOrder.length - 1) {
      onStatusChange(leadId, stageOrder[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      onStatusChange(leadId, stageOrder[currentIndex - 1]);
    }
  };

  const validatePercent =
    validateProgress && validateProgress.total > 0
      ? Math.round((validateProgress.done / validateProgress.total) * 100)
      : 0;

  return (
    <section className="lead-table-wrapper" aria-labelledby="leads-title">
      <div className="section-heading"><h2 id="leads-title" className="section-title">{locale === 'ar' ? 'العملاء' : 'Leads'}</h2><span className="count-label">{filteredLeads.length}</span></div>
      {/* Controls Bar */}
      <div className="table-controls-bar">
        <div className="search-filter-box">
          <Field label={t('table.search_placeholder')} icon={<Search size={15} />} htmlFor="lead-search">
            <TextInput
              id="lead-search"
              type="text"
              aria-label={t('table.search_placeholder')}
              placeholder={t('table.search_placeholder')}
              value={filters.searchTerm}
              onChange={e => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </Field>

          <details className="lead-filters disclosure">
            <summary>{locale === 'ar' ? 'تصفية وترتيب' : 'Filter and sort'}</summary>
            <div className="lead-filter-fields">
          {/* Status Filter */}
          <Field label={t('table.filter.status')} htmlFor="lead-filter-status">
          <select
            id="lead-filter-status"
            className="filter-select"
            aria-label={t('table.filter.status')}
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value as FilterState['status'] })}
          >
            <option value="all">{t('table.filter.status')}: {t('table.filter.all')} ({leads.length})</option>
            <option value="new">{t('table.filter.new')}</option>
            <option value="contacted">{t('table.filter.contacted')}</option>
            <option value="interested">{t('table.filter.interested')}</option>
            <option value="converted">{t('table.filter.converted')}</option>
            <option value="rejected">{t('table.filter.rejected')}</option>
          </select>
          </Field>

          {/* Website Filter */}
          <Field label={t('table.filter.website')} htmlFor="lead-filter-website">
          <select
            id="lead-filter-website"
            className="filter-select"
            aria-label={t('table.filter.website')}
            value={filters.websiteFilter}
            onChange={e => setFilters({ ...filters, websiteFilter: e.target.value as FilterState['websiteFilter'] })}
          >
            <option value="all">{t('table.filter.website')}: {t('table.filter.all')}</option>
            <option value="no_website">{t('table.filter.no_website')}</option>
            <option value="has_website">{t('table.filter.has_website')}</option>
          </select>
          </Field>

          {/* Social Filter */}
          <Field label={t('table.filter.social')} htmlFor="lead-filter-social">
          <select
            id="lead-filter-social"
            className="filter-select"
            aria-label={t('table.filter.social')}
            value={filters.socialFilter}
            onChange={e => setFilters({ ...filters, socialFilter: e.target.value as FilterState['socialFilter'] })}
          >
            <option value="all">{t('table.filter.social')}: {t('table.filter.all')}</option>
            <option value="has_social">{t('table.filter.has_social')}</option>
            <option value="no_social">{t('table.filter.no_social')}</option>
          </select>
          </Field>

          {/* Follow-up Filter */}
          <Field label={t('action.followup')} htmlFor="lead-filter-followup">
          <select
            id="lead-filter-followup"
            className="filter-select"
            aria-label={t('action.followup')}
            value={filters.followUpFilter}
            onChange={e => setFilters({ ...filters, followUpFilter: e.target.value as FilterState['followUpFilter'] })}
          >
            <option value="all">{t('action.followup')}: {t('table.filter.all')}</option>
            <option value="due_today">{t('action.followup')} {t('followup.quick.today')}</option>
            <option value="scheduled">{t('action.followup')} {t('table.filter.all')}</option>
          </select>
          </Field>

          {/* Priority Filter */}
          <Field label={t('table.filter.priority')} htmlFor="lead-filter-priority">
          <select
            id="lead-filter-priority"
            className="filter-select"
            aria-label={t('table.filter.priority')}
            value={filters.priorityFilter}
            onChange={e => setFilters({ ...filters, priorityFilter: e.target.value as FilterState['priorityFilter'] })}
          >
            <option value="all">{t('table.filter.priority')}: {t('table.filter.all')}</option>
            <option value="high">{t('table.filter.priority')} 🔥</option>
            <option value="medium">{t('table.filter.priority')}</option>
            <option value="low">{t('table.filter.priority')}</option>
          </select>
          </Field>

          {/* Sort Control */}
          <Field
            label={locale === 'ar' ? 'ترتيب حسب' : 'Sort by'}
            icon={<ArrowUpDown size={14} />}
            htmlFor="lead-sort-by"
          >
            <select
              id="lead-sort-by"
              className="filter-select"
              aria-label={locale === 'ar' ? 'ترتيب حسب' : 'Sort by'}
            value={filters.sortBy}
              onChange={e => setFilters({ ...filters, sortBy: e.target.value as FilterState['sortBy'] })}
            >
              <option value="opportunityScore">{t('table.col.opportunity')}</option>
              <option value="rating">{t('table.filter.rating')}</option>
              <option value="userRatingsTotal">{t('table.col.rating')}</option>
              <option value="name">{t('common.name')}</option>
            </select>
          </Field>
            </div>
          </details>
        </div>

        {/* View Switcher */}
        <div className="view-switcher flex-align gap-2">
          <div className="toggle-group">
            <Button
              variant="ghost"
              size="sm"
              className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              title={t('table.view.table')}
              icon={<List size={15} />}
            >
              <span>{t('table.view.table')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
              title={t('table.view.cards')}
              icon={<LayoutGrid size={15} />}
            >
              <span>{t('table.view.cards')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`toggle-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              aria-pressed={viewMode === 'kanban'}
              onClick={() => setViewMode('kanban')}
              title={t('table.view.kanban')}
              icon={<Columns size={15} />}
            >
              <span>{t('table.view.kanban')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              aria-pressed={viewMode === 'map'}
              onClick={() => setViewMode('map')}
              title={t('table.view.map')}
              icon={<MapIcon size={15} />}
            >
              <span>{t('table.view.map')}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Selection & Campaign Bar */}
      <div className="selection-bar">
        <div className="flex-align gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="checkbox-button"
            onClick={() => onSelectAll(!allSelected)}
            icon={allSelected ? <CheckSquare size={16} className="text-purple" /> : <Square size={16} />}
          >
            <span>{t('table.select_all')} ({filteredLeads.length})</span>
          </Button>

          {selectedIds.length > 0 && (
            <>
              <StatusPill tone="purple">
                {t('table.selected')}: {selectedIds.length} / {leads.length}
              </StatusPill>
              <Button
                variant="whatsapp"
                size="sm"
                onClick={() => onStartCampaign(selectedLeadsList)}
                icon={<Send size={14} />}
              >
                <span>{t('table.start_campaign')} ({selectedIds.length})</span>
              </Button>
            </>
          )}
        </div>

        <div className="results-count flex-align gap-2">
          {onValidate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onValidate(selectedIds.length > 0 ? selectedLeadsList : filteredLeads)}
              disabled={validating}
              loading={validating}
              icon={<ShieldCheck size={14} />}
            >
              <span>
                {validating
                  ? `${validateProgress?.done || 0}/${validateProgress?.total || 0}`
                  : t('action.validate') || 'Validate'}
              </span>
            </Button>
          )}
          <span>{locale === 'ar' ? 'النتائج' : 'Results'}: {filteredLeads.length}</span>
        </div>
      </div>

      {validating && validateProgress && validateProgress.total > 0 && (
        <Banner tone="blue" icon={<ShieldCheck size={14} />}>
          <span>
            {validateProgress.done}/{validateProgress.total}
          </span>
          <span className="ui-progress-track">
            <span className="ui-progress-fill" style={{ width: `${validatePercent}%` }} />
          </span>
        </Banner>
      )}

      {/* Render View Modes */}
      {viewMode === 'map' ? (
        <MapView leads={filteredLeads} activeCity={activeCity} onOpenWhatsApp={onOpenWhatsApp} />
      ) : viewMode === 'kanban' ? (
        /* CRM Kanban Pipeline View */
        <div className="kanban-board-container">
          {KANBAN_STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.status === stage.id);
            const stageValue = stageLeads.length * 350;

            return (
              <div key={stage.id} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="flex-align gap-2">
                    <h4 className="kanban-stage-title">{t(stage.titleKey)}</h4>
                    <StatusPill tone={stage.tone}>{stageLeads.length}</StatusPill>
                  </div>
                  <span className="kanban-val-pill">${stageValue.toLocaleString()} {t('kanban.pipeline_value')}</span>
                </div>

                <div className="kanban-cards-stack">
                  {stageLeads.length === 0 ? (
                    <EmptyState title={t('kanban.empty')} />
                  ) : (
                    stageLeads.map(lead => {
                      const isSelected = selectedIds.includes(lead.id);

                      return (
                        <div key={lead.id} className={`kanban-lead-card ${isSelected ? 'selected' : ''}`}>
                          <div className="flex-between">
                            <Button variant="ghost" size="icon" className="check-btn" aria-label={`${t('table.selected')}: ${lead.name}`} aria-pressed={isSelected} onClick={() => onToggleSelect(lead.id)} icon={isSelected ? <CheckSquare size={14} className="text-purple" /> : <Square size={14} />} />
                            <StatusPill tone="blue">{lead.opportunityScore || 90}% {t('table.col.opportunity')}</StatusPill>
                          </div>

                          <div className="kanban-card-info">
                            <h5 className="kanban-business-name">{lead.name}</h5>
                            <div className="text-xs subtext">{lead.category} • {lead.city}</div>

                            {lead.phone && (
                              <div className="kanban-phone-row">
                                <Phone size={11} />
                                <span>{lead.phone}</span>
                              </div>
                            )}

                            {lead.followUpDate && (
                              <div
                                className="kanban-followup-tag"
                                onClick={() => onOpenFollowUp(lead)}
                                title={t('action.followup')}
                              >
                                <StatusPill tone="amber" icon={<Clock size={11} />}>
                                  {t('action.followup')}: {lead.followUpDate}
                                </StatusPill>
                              </div>
                            )}
                          </div>

                          {/* Action Bar */}
                          <div className="kanban-card-actions">
                            {lead.phone ? (
                              <Button
                                variant="whatsapp"
                                size="xs"
                                onClick={() => onOpenWhatsApp(lead)}
                                title={t('action.whatsapp')}
                                icon={<MessageCircle size={12} />}
                              >
                                <span>{t('action.whatsapp')}</span>
                              </Button>
                            ) : null}

                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => onOpenProposal(lead)}
                              title={t('action.proposal')}
                              icon={<FileText size={11} />}
                            >
                              <span>{t('action.proposal')}</span>
                            </Button>

                            {lead.website && (
                              <Button
                                variant="secondary"
                                size="xs"
                                onClick={() => onOpenAudit(lead)}
                                title={t('action.audit')}
                                icon={<Gauge size={11} className="text-primary" />}
                              >
                                <span>{t('action.audit')}</span>
                              </Button>
                            )}
                          </div>

                          {/* Quick Stage Mover */}
                          <div className="kanban-stage-mover">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="stage-move-btn"
                              onClick={() => handleMoveStage(lead.id, lead.status, 'prev')}
                              title={t('action.previous')}
                              disabled={stage.id === 'new'}
                              icon={<ArrowRight size={12} />}
                            />
                            <span className="text-xs subtext">{t('action.edit')}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="stage-move-btn"
                              onClick={() => handleMoveStage(lead.id, lead.status, 'next')}
                              title={t('action.next')}
                              disabled={stage.id === 'converted'}
                              icon={<ArrowLeft size={12} />}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="cards-grid">
          {paginatedLeads.length === 0 && <EmptyState icon={<Search size={18} />} title={t('table.no_results')} />}
          {paginatedLeads.map(lead => {
            const isSelected = selectedIds.includes(lead.id);
            const cleanNum = formatPhoneForWhatsApp(lead.phone);

            return (
              <div key={lead.id} className={`lead-card ${isSelected ? 'selected' : ''}`}>
                <div className="card-top">
                  <Button variant="ghost" size="icon" className="check-btn" aria-label={`${t('table.selected')}: ${lead.name}`} aria-pressed={isSelected} onClick={() => onToggleSelect(lead.id)} icon={isSelected ? <CheckSquare size={16} className="text-purple" /> : <Square size={16} />} />
                  <span title={lead.opportunityReason}>
                    <StatusPill tone="blue">{lead.opportunityScore || 90}% {t('table.col.opportunity')}</StatusPill>
                  </span>
                </div>

                <div className="card-main">
                  <h3 className="card-title">{lead.name}</h3>
                  <span className="card-category">{lead.category}</span>

                  <div className="card-info-item">
                    <MapPin size={13} />
                    <span>{lead.address || lead.city}</span>
                  </div>

                  {lead.phone && (
                    <div className="card-info-item text-phone">
                      <Phone size={13} />
                      <span>{lead.phone}</span>
                      {lead.validation?.whatsapp === true && (
                        <span title="WhatsApp ✓"><ShieldCheck size={12} color="var(--status-green)" /></span>
                      )}
                      {lead.validation?.whatsapp === false && (
                        <span title="No WhatsApp"><ShieldAlert size={12} color="var(--status-red)" /></span>
                      )}
                    </div>
                  )}

                  {lead.email && (
                    <div className="card-info-item">
                      <Mail size={13} />
                      <a href={`mailto:${lead.email}`} className="text-xs hover-link">
                        {lead.email}
                      </a>
                    </div>
                  )}

                  <div className="card-info-item flex-align gap-2">
                    <Globe size={13} />
                    {lead.website ? (
                      <div className="flex-align gap-1">
                        <a href={lead.website} target="_blank" rel="noreferrer" className="website-tag website-available">
                          {t('table.filter.has_website')} ↗
                        </a>
                        {lead.validation?.website === 'broken' && (
                          <span title="Website down"><AlertTriangle size={12} color="var(--status-amber)" /></span>
                        )}
                        {lead.validation?.website === 'valid' && (
                          <span title="Website OK"><Check size={12} color="var(--status-green)" /></span>
                        )}
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onOpenAudit(lead)}
                          title={t('action.audit')}
                          icon={<Gauge size={11} className="text-primary" />}
                        >
                          <span>{t('action.audit')}</span>
                        </Button>
                      </div>
                    ) : (
                      <span className="website-tag website-none">{t('table.filter.no_website')}</span>
                    )}

                    {lead.socialLinks?.instagram && (
                      <a
                        href={lead.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="social-icon-badge"
                        title="Instagram"
                      >
                        <InstagramIcon size={13} />
                      </a>
                    )}
                    {lead.socialLinks?.facebook && (
                      <a
                        href={lead.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="social-icon-badge"
                        title="Facebook"
                      >
                        <FacebookIcon size={13} />
                      </a>
                    )}
                  </div>

                  {/* Follow-up reminder banner if set */}
                  {lead.followUpDate && (
                    <div
                      className="follow-up-pill"
                      onClick={() => onOpenFollowUp(lead)}
                      title={t('action.followup')}
                    >
                      <StatusPill tone="amber" icon={<Calendar size={12} />}>
                        {t('action.followup')}: {lead.followUpDate}
                      </StatusPill>
                    </div>
                  )}
                </div>

                <div className="card-status-select">
                  <StatusPill tone={STATUS_TONE[lead.status]}>
                    <select
                      className={`status-badge status-${lead.status}`}
                      value={lead.status}
                      onChange={e => onStatusChange(lead.id, e.target.value as LeadStatus)}
                    >
                      <option value="new">{getStatusLabel('new', locale)}</option>
                      <option value="contacted">{getStatusLabel('contacted', locale)}</option>
                      <option value="interested">{getStatusLabel('interested', locale)}</option>
                      <option value="converted">{getStatusLabel('converted', locale)}</option>
                      <option value="rejected">{getStatusLabel('rejected', locale)}</option>
                    </select>
                  </StatusPill>
                </div>

                <div className="card-actions">
                  {lead.phone ? (
                    <>
                      {(lead.hasWhatsApp !== false && (lead.hasWhatsApp === true || checkPhoneWhatsAppEligibility(lead.phone, lead.country))) ? (
                        <Button variant="whatsapp" size="sm" onClick={() => onOpenWhatsApp(lead)} icon={<MessageCircle size={14} />}>
                          <span>{t('action.whatsapp')}</span>
                        </Button>
                      ) : (
                        <span
                          title={locale === 'ar' ? 'هذا الرقم أرضي أو غير مسجل في واتساب' : 'Not on WhatsApp'}
                        >
                          <StatusPill tone="red" icon={<MessageSquareOff size={12} />}>
                            {locale === 'ar' ? 'غير مسجل في واتساب' : 'Not on WhatsApp'}
                          </StatusPill>
                        </span>
                      )}
                      <a href={`tel:${cleanNum}`} className="btn btn-call btn-sm">
                        <PhoneCall size={14} />
                        <span>{t('action.call')}</span>
                      </a>
                    </>
                  ) : null}

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenProposal(lead)}
                    title={t('action.proposal')}
                    icon={<FileText size={13} />}
                  >
                    <span>{t('action.proposal')}</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => onOpenFollowUp(lead)}
                    title={t('action.followup')}
                    icon={<Clock size={14} />}
                  />

                  {lead.googleMapsUrl && (
                    <a
                      href={lead.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-icon"
                      title={t('action.maps')}
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="table-responsive">
          <table className="custom-lead-table">
            <thead>
              <tr>
                <th>
                  <Button variant="ghost" size="icon" className="checkbox-button" onClick={() => onSelectAll(!allSelected)} icon={allSelected ? <CheckSquare size={15} /> : <Square size={15} />} />
                </th>
                <th>{t('table.col.opportunity')}</th>
                <th>{t('table.col.business')}</th>
                <th>{t('table.col.phone')}</th>
                <th>{t('table.col.social')}</th>
                <th>{t('table.col.website')}</th>
                <th>{t('action.followup')}</th>
                <th>{t('table.col.rating')}</th>
                <th>{t('table.col.status')}</th>
                <th>{t('table.col.notes')}</th>
                <th>{t('table.col.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={11} className="empty-row">
                    <EmptyState icon={<Search size={18} />} title={t('table.no_results')} />
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => {
                  const isSelected = selectedIds.includes(lead.id);
                  const cleanNum = formatPhoneForWhatsApp(lead.phone);
                  const isFollowUpDue = lead.followUpDate === todayStr;

                  return (
                    <tr key={lead.id} className={isSelected ? 'row-selected' : ''}>
                      <td>
                        <Button variant="ghost" size="icon" className="checkbox-button" onClick={() => onToggleSelect(lead.id)} icon={isSelected ? <CheckSquare size={15} className="text-purple" /> : <Square size={15} />} />
                      </td>

                      {/* Opportunity Score */}
                      <td className="cell-opp">
                        <span title={lead.opportunityReason}>
                          <StatusPill tone="blue">{lead.opportunityScore || 90}% {t('table.col.opportunity')}</StatusPill>
                        </span>
                      </td>

                      <td className="cell-business-name">
                        <div className="business-name-box">
                          <strong className="name-title">{lead.name}</strong>
                          <span className="name-category">{lead.category}</span>
                          <span className="city-tag">
                            {lead.city}
                          </span>
                        </div>
                      </td>

                      <td className="cell-phone">
                        {lead.phone ? (
                          <div className="phone-box">
                            <span className="phone-number">{lead.phone}</span>
                            {lead.validation?.whatsapp === true && (
                              <span
                                title={locale === 'ar' ? 'الرقم موجود على واتساب' : 'Number has WhatsApp'}
                              >
                                <StatusPill tone="whatsapp" icon={<ShieldCheck size={10} />}>WA</StatusPill>
                              </span>
                            )}
                            {lead.validation?.whatsapp === false && (
                              <span
                                title={locale === 'ar' ? 'الرقم غير موجود على واتساب' : 'Number not on WhatsApp'}
                              >
                                <StatusPill tone="red" icon={<ShieldAlert size={10} />}>No WA</StatusPill>
                              </span>
                            )}
                            <div className="phone-quick-actions">
                              {(lead.hasWhatsApp !== false && (lead.hasWhatsApp === true || checkPhoneWhatsAppEligibility(lead.phone, lead.country))) ? (
                                <Button
                                  variant="whatsapp"
                                  size="xs"
                                  className="action-pill pill-whatsapp"
                                  onClick={() => onOpenWhatsApp(lead)}
                                  title={t('action.whatsapp')}
                                  icon={<MessageCircle size={12} />}
                                >
                                  <span>{t('action.whatsapp')}</span>
                                </Button>
                              ) : (
                                <span
                                  title={locale === 'ar' ? 'هذا الرقم أرضي أو غير مسجل في تطبيق واتساب' : 'This number is not registered on WhatsApp'}
                                >
                                  <StatusPill tone="red" icon={<MessageSquareOff size={11} />}>
                                    {locale === 'ar' ? 'غير مسجل في واتساب' : 'Not on WhatsApp'}
                                  </StatusPill>
                                </span>
                              )}
                              <a
                                href={`tel:${cleanNum}`}
                                className="action-pill pill-call"
                                title={t('action.call')}
                              >
                                <PhoneCall size={12} />
                                <span>{t('action.call')}</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <span className="badge-none">{t('table.filter.no_website')}</span>
                        )}
                      </td>

                      {/* Email & Social Links */}
                      <td className="cell-social">
                        <div className="ui-field">
                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="email-pill"
                              title={`${t('common.email')}: ${lead.email}`}
                            >
                              <Mail size={12} />
                              <span>{lead.email}</span>
                            </a>
                          ) : (
                            <span className="text-xs subtext">{t('common.no_data')}</span>
                          )}

                          <div className="flex-align gap-1">
                            {lead.socialLinks?.instagram ? (
                              <a
                                href={lead.socialLinks.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="social-badge insta-badge"
                                title="Instagram"
                              >
                                <InstagramIcon size={11} />
                                <span>Instagram</span>
                              </a>
                            ) : null}

                            {lead.socialLinks?.facebook ? (
                              <a
                                href={lead.socialLinks.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="social-badge fb-badge"
                                title="Facebook"
                              >
                                <FacebookIcon size={11} />
                                <span>Facebook</span>
                              </a>
                            ) : null}

                            {!lead.socialLinks?.instagram && !lead.socialLinks?.facebook && (
                              <span className="badge-none">
                                {t('table.filter.no_social')}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Website Column */}
                      <td className="cell-website">
                        {lead.website ? (
                          <div className="flex-align gap-1">
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noreferrer"
                              className="website-tag website-available flex-align gap-1"
                              title={lead.website}
                            >
                              <Globe size={12} />
                              <span>{t('table.filter.has_website')} ↗</span>
                            </a>
                            {lead.validation?.website === 'broken' && (
                              <span title={locale === 'ar' ? 'الموقع غير متاح' : 'Website down'}><AlertTriangle size={12} color="var(--status-amber)" /></span>
                            )}
                            {lead.validation?.website === 'valid' && (
                              <span title={locale === 'ar' ? 'الموقع يعمل' : 'Website OK'}><Check size={12} color="var(--status-green)" /></span>
                            )}
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => onOpenAudit(lead)}
                              title={t('action.audit')}
                              icon={<Gauge size={11} className="text-primary" />}
                            >
                              <span>{t('action.audit')}</span>
                            </Button>
                          </div>
                        ) : (
                          <span className="website-tag website-none" title={t('table.filter.no_website')}>
                            {t('table.filter.no_website')}
                          </span>
                        )}
                      </td>

                      {/* CRM Follow-Up Reminder */}
                      <td className="cell-followup">
                        {lead.followUpDate ? (
                          <div
                            className={`followup-badge ${isFollowUpDue ? 'due-today' : ''}`}
                            onClick={() => onOpenFollowUp(lead)}
                            title={lead.followUpNotes || t('action.followup')}
                          >
                            <StatusPill tone={isFollowUpDue ? 'amber' : 'blue'} icon={<Clock size={12} />}>
                              {lead.followUpDate}
                            </StatusPill>
                            {isFollowUpDue && <span className="due-dot" title={t('action.followup')}></span>}
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="btn-add-followup"
                            onClick={() => onOpenFollowUp(lead)}
                            title={t('action.followup')}
                            icon={<Calendar size={12} />}
                          >
                            <span>{t('action.followup')}</span>
                          </Button>
                        )}
                      </td>

                      {/* Rating */}
                      <td className="cell-rating">
                        <StatusPill tone="amber" icon={<Star size={12} fill="var(--status-amber)" color="var(--status-amber)" />}>
                          <><strong>{lead.rating}</strong><span className="rating-count">({lead.userRatingsTotal})</span></>
                        </StatusPill>
                      </td>

                      {/* Status */}
                      <td className="cell-status">
                        <StatusPill tone={STATUS_TONE[lead.status]}>
                          <select
                            className={`status-select-dropdown status-${lead.status}`}
                            value={lead.status}
                            onChange={e => onStatusChange(lead.id, e.target.value as LeadStatus)}
                          >
                            <option value="new">{getStatusLabel('new', locale)}</option>
                            <option value="contacted">{getStatusLabel('contacted', locale)}</option>
                            <option value="interested">{getStatusLabel('interested', locale)}</option>
                            <option value="converted">{getStatusLabel('converted', locale)}</option>
                            <option value="rejected">{getStatusLabel('rejected', locale)}</option>
                          </select>
                        </StatusPill>
                      </td>

                      {/* Notes */}
                      <td className="cell-notes">
                        {editingNoteId === lead.id ? (
                          <div className="note-edit-box">
                            <TextInput
                              type="text"
                              className="input-sm"
                              value={tempNote}
                              onChange={e => setTempNote(e.target.value)}
                              autoFocus
                            />
                            <Button variant="secondary" size="icon" onClick={() => handleSaveNote(lead.id)} icon={<Check size={14} />} />
                          </div>
                        ) : (
                          <div className="note-display-box" onClick={() => handleStartEditNote(lead)}>
                            <span className="note-text">{lead.notes || t('common.notes')}</span>
                            <Edit3 size={11} className="edit-icon" />
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="cell-actions">
                        <div className="flex-align justify-center gap-1">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => onOpenProposal(lead)}
                            title={t('action.proposal')}
                            icon={<FileText size={12} />}
                          >
                            <span>{t('action.proposal')}</span>
                          </Button>

                          {lead.googleMapsUrl && (
                            <a
                              href={lead.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-icon"
                              title={t('action.maps')}
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}

                          <Button
                            variant="danger"
                            size="icon"
                            className="btn-delete"
                            onClick={() => onDeleteLead(lead.id)}
                            title={t('action.delete')}
                            icon={<Trash2 size={13} />}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Table & Cards Pagination Bar */}
      {viewMode !== 'kanban' && viewMode !== 'map' && totalItems > 0 && (
        <div className="table-pagination-bar">
          <div className="pagination-left">
            <div className="pagination-info">
              {locale === 'ar' ? (
                <span>
                  عرض <strong>{startIndex + 1}</strong> إلى <strong>{endIndex}</strong> من إجمالي <strong>{totalItems}</strong> عميل
                </span>
              ) : (
                <span>
                  Showing <strong>{startIndex + 1}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> leads
                </span>
              )}
            </div>

            <div className="page-size-selector">
              <Field label={locale === 'ar' ? 'لكل صفحة:' : 'Per page:'} htmlFor="lead-page-size">
                <select
                  id="lead-page-size"
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="pagination-nav">
            <Button
              variant="ghost"
              size="icon"
              className="page-nav-btn"
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage === 1}
              title={locale === 'ar' ? 'الصفحة الأولى' : 'First page'}
              icon={<ChevronsRight size={15} />}
            />

            <Button
              variant="ghost"
              size="icon"
              className="page-nav-btn"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={safeCurrentPage === 1}
              title={locale === 'ar' ? 'الصفحة السابقة' : 'Previous page'}
              icon={<ChevronRight size={15} />}
            />

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) => {
                if (p === '...') {
                  return <span key={`ell-${idx}`} className="page-ellipsis">…</span>;
                }
                const pageNum = Number(p);
                return (
                  <Button
                    key={pageNum}
                    variant="ghost"
                    size="icon"
                    className={`page-nav-btn ${pageNum === safeCurrentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}

            <Button
              variant="ghost"
              size="icon"
              className="page-nav-btn"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={safeCurrentPage === totalPages}
              title={locale === 'ar' ? 'الصفحة التالية' : 'Next page'}
              icon={<ChevronLeft size={15} />}
            />

            <Button
              variant="ghost"
              size="icon"
              className="page-nav-btn"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage === totalPages}
              title={locale === 'ar' ? 'الصفحة الأخيرة' : 'Last page'}
              icon={<ChevronsLeft size={15} />}
            />
          </div>
        </div>
      )}
    </section>
  );
};
