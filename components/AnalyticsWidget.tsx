'use client';

import React from 'react';
import { Lead } from '@/lib/types';
import { BarChart3, TrendingUp, CheckCircle, Globe, MapPin } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface AnalyticsWidgetProps {
  leads: Lead[];
}

export const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ leads }) => {
  const { t } = useLanguage();
  if (!leads.length) return null;

  const total = leads.length;
  const goldenLeads = leads.filter(l => (l.opportunityScore || 0) >= 90);
  const noWebsiteLeads = leads.filter(l => !l.website);
  const convertedLeads = leads.filter(l => l.status === 'converted');
  const contactedLeads = leads.filter(l => l.status === 'contacted' || l.status === 'interested' || l.status === 'converted');

  const cityCounts: Record<string, number> = {};
  leads.forEach(l => {
    const c = l.city || 'Other';
    cityCounts[c] = (cityCounts[c] || 0) + 1;
  });

  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="analytics-widget-card">
      <div className="analytics-header flex-align gap-2">
        <BarChart3 size={18} />
        <h3>{t('analytics.title')}</h3>
      </div>

      <div className="analytics-grid">
        <div className="analytics-item">
          <div className="analytics-icon icon-amber">
            <TrendingUp size={18} />
          </div>
          <div>
            <span className="analytics-label">{t('analytics.high_priority')}</span>
            <h4 className="analytics-value">{goldenLeads.length} {t('analytics.high_priority.sub')}</h4>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill fill-amber"
                style={{ width: `${Math.round((goldenLeads.length / total) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <div className="analytics-icon icon-purple">
            <Globe size={18} />
          </div>
          <div>
            <span className="analytics-label">{t('analytics.no_website')}</span>
            <h4 className="analytics-value">{noWebsiteLeads.length} {t('analytics.no_website.sub')}</h4>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill fill-purple"
                style={{ width: `${Math.round((noWebsiteLeads.length / total) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <div className="analytics-icon icon-green">
            <CheckCircle size={18} />
          </div>
          <div>
            <span className="analytics-label">{t('analytics.conversion_rate')}</span>
            <h4 className="analytics-value">{convertedLeads.length} / {contactedLeads.length} {t('analytics.conversion_rate.sub')}</h4>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill fill-green"
                style={{ width: `${contactedLeads.length ? Math.round((convertedLeads.length / contactedLeads.length) * 100) : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="analytics-item">
          <div className="analytics-icon icon-blue">
            <MapPin size={18} />
          </div>
          <div>
            <span className="analytics-label">{t('analytics.top_cities')}</span>
            <div className="cities-chips-mini">
              {topCities.map(([cityName, count]) => (
                <span key={cityName} className="city-chip-mini">
                  {cityName}: <strong>{count}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
