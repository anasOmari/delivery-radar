'use client';

import React, { useState } from 'react';
import {
  Users,
  PhoneCall,
  Globe,
  TrendingUp,
  DollarSign,
  CalendarCheck,
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

interface StatsOverviewProps {
  leads: Lead[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ leads }) => {
  const { t, locale } = useLanguage();
  const [dealAvgPrice, setDealAvgPrice] = useState(350);
  const [closeRate, setCloseRate] = useState(10);

  const totalLeads = leads.length;
  const withPhone = leads.filter(l => l.phone && l.phone.length > 5).length;
  const withWebsite = leads.filter(l => Boolean(l.website)).length;
  const noWebsite = totalLeads - withWebsite;
  const contacted = leads.filter(l => l.status === 'contacted' || l.status === 'interested' || l.status === 'converted').length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const followupsDue = leads.filter(l => l.followUpDate === todayStr).length;

  const realizedRevenue = converted * dealAvgPrice;
  const expectedForecastRevenue = Math.round((totalLeads * (closeRate / 100)) * dealAvgPrice);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
      <div className="stats-grid" style={{ marginBottom: 0 }}>
        <div className="stat-card">
          <div className="stat-icon icon-purple">
            <Users size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.total_leads')}</span>
            <h3 className="stat-value">{totalLeads}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green">
            <PhoneCall size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.with_phone')}</span>
            <h3 className="stat-value">{withPhone}</h3>
            <span className="stat-sub">{t('stats.with_phone.sub')} {totalLeads ? Math.round((withPhone / totalLeads) * 100) : 0}%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <Globe size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.no_website')}</span>
            <h3 className="stat-value">{noWebsite}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue">
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.converted')}</span>
            <h3 className="stat-value">{converted}</h3>
            <span className="stat-sub">{contacted} {t('stats.converted.sub')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-cyan">
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.pipeline_value')}</span>
            <h3 className="stat-value" style={{ color: 'var(--brand-primary)' }}>
              ${realizedRevenue.toLocaleString()}
            </h3>
            <span className="stat-sub">{t('stats.pipeline_value.sub')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-amber">
            <CalendarCheck size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">{t('stats.followups_due')}</span>
            <h3 className="stat-value">{followupsDue}</h3>
          </div>
        </div>
      </div>

      {totalLeads > 0 && (
        <div className="revenue-forecast">
          <div className="revenue-grid">
            <div className="revenue-item">
              <span className="revenue-label">{t('stats.revenue.forecast')}</span>
              <div className="revenue-value">${expectedForecastRevenue.toLocaleString()}</div>
              <span className="stat-sub">{closeRate}% {locale === 'ar' ? 'من' : 'of'} {totalLeads} {locale === 'ar' ? 'عميل' : 'leads'}</span>
            </div>
            <div className="revenue-item">
              <span className="revenue-label">{t('stats.revenue.realized')}</span>
              <div className="revenue-value" style={{ color: 'var(--status-green)' }}>${realizedRevenue.toLocaleString()}</div>
              <span className="stat-sub">{converted} {locale === 'ar' ? 'صفقات مكتملة' : 'deals closed'}</span>
            </div>
            <div className="revenue-controls">
              <div className="revenue-item">
                <span className="revenue-label">{t('stats.service.price')}</span>
                <select
                  className="revenue-select"
                  value={dealAvgPrice}
                  onChange={e => setDealAvgPrice(Number(e.target.value))}
                >
                  <option value={150}>$150 (SEO Maps)</option>
                  <option value={250}>$250 (Social Media)</option>
                  <option value={350}>$350 (Website)</option>
                  <option value={500}>$500 (Full Package)</option>
                </select>
              </div>
              <div className="revenue-item">
                <span className="revenue-label">{t('stats.close.rate')}</span>
                <select
                  className="revenue-select"
                  value={closeRate}
                  onChange={e => setCloseRate(Number(e.target.value))}
                >
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={25}>25%</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
