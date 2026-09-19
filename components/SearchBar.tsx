'use client';

import React, { useState } from 'react';
import { Search, MapPin, Filter, RefreshCw, Layers, Globe2, Database, ShieldCheck } from 'lucide-react';
import { SearchParams } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';
import { COUNTRIES, COUNTRY_CITIES, COUNTRY_CITIES_AR } from '@/lib/i18n';

interface SearchBarProps {
  onSearch: (params: SearchParams) => void;
  isLoading: boolean;
  vaultCount?: number;
  onViewVault?: () => void;
}

const PRESET_CATEGORIES_AR = [
  'جميع الأنشطة (شامل)',
  'مطاعم ومأكولات',
  'عيادات أسنان',
  'شركات مقاولات',
  'مكاتب عقارات',
  'صيدليات',
  'معارض سيارات',
  'صالونات وتجميل',
  'مؤسسات تصميم وتكييف'
];

const PRESET_CATEGORIES_EN = [
  'All Activities (General)',
  'Restaurants & Food',
  'Dental Clinics',
  'Construction Companies',
  'Real Estate Offices',
  'Pharmacies',
  'Car Showrooms',
  'Salons & Beauty',
  'Design & AC Companies'
];

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, vaultCount = 0, onViewVault }) => {
  const { locale, t } = useLanguage();
  const [query, setQuery] = useState(locale === 'ar' ? PRESET_CATEGORIES_AR[0] : PRESET_CATEGORIES_EN[0]);
  const [country, setCountry] = useState('JO');
  const [city, setCity] = useState('');
  const [hasPhoneOnly, setHasPhoneOnly] = useState(true);

  // New limit and deduplication options (defaulting to 50 for comprehensive coverage)
  const [limit, setLimit] = useState<number>(50);
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);

  const PRESET_CATEGORIES = locale === 'ar' ? PRESET_CATEGORIES_AR : PRESET_CATEGORIES_EN;
  const countries = COUNTRIES[locale] || COUNTRIES.ar;
  const citiesMap = locale === 'ar' ? COUNTRY_CITIES_AR : COUNTRY_CITIES;
  const currentSuggestedCities = citiesMap[country] || (locale === 'ar' ? ['جميع المناطق'] : ['All Regions']);

  const handleCountryChange = (newCountryCode: string) => {
    setCountry(newCountryCode);
    setCity('');
  };

  const getCountryName = () => {
    const selectedCountryObj = countries.find(c => c.code === country);
    return selectedCountryObj && selectedCountryObj.code !== 'ALL' ? selectedCountryObj.name : '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query: query.trim(),
      city: city.trim() === (locale === 'ar' ? 'جميع المناطق' : 'All Regions') ? '' : city.trim(),
      country: getCountryName(),
      hasPhoneOnly,
      limit,
      skipDuplicates
    });
  };

  const handlePresetClick = (presetCategory: string) => {
    setQuery(presetCategory);
    onSearch({
      query: presetCategory,
      city: city.trim() === (locale === 'ar' ? 'جميع المناطق' : 'All Regions') ? '' : city.trim(),
      country: getCountryName(),
      hasPhoneOnly,
      limit,
      skipDuplicates
    });
  };

  const LIMIT_OPTIONS = [
    { value: 25, labelAr: '25 سجل', labelEn: '25 leads' },
    { value: 50, labelAr: '50 سجل', labelEn: '50 leads' },
    { value: 100, labelAr: '100 سجل', labelEn: '100 leads' },
    { value: 150, labelAr: '150 سجل', labelEn: '150 leads' }
  ];

  const handleCityChipClick = (cityName: string) => {
    const isAll = cityName === (locale === 'ar' ? 'جميع المناطق' : 'All Regions');
    const targetCity = isAll ? '' : cityName;
    setCity(targetCity);
    const targetLimit = isAll && limit < 50 ? 50 : limit;
    if (isAll && limit < 50) setLimit(50);
    onSearch({
      query: query.trim(),
      city: targetCity,
      country: getCountryName(),
      hasPhoneOnly,
      limit: targetLimit,
      skipDuplicates
    });
  };

  return (
    <div className="search-card">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group flex-2">
          <label className="input-label">
            <Search size={15} />
            <span>{t('search.category.label')}</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder={t('search.category.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="input-group flex-1">
          <label className="input-label">
            <Globe2 size={15} />
            <span>{t('search.country.label')}</span>
          </label>
          <select
            className="input-field select-field"
            value={country}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="input-group flex-1">
          <label className="input-label">
            <MapPin size={15} />
            <span>{t('search.city.label')}</span>
          </label>
          <input
            type="text"
            className="input-field"
            list="cities-suggestions"
            placeholder={t('search.city.placeholder')}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <datalist id="cities-suggestions">
            {currentSuggestedCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div className="input-group">
          <label className="input-label">
            <Filter size={15} />
            <span>{t('search.filter.label')}</span>
          </label>
          <label className="checkbox-toggle">
            <input
              type="checkbox"
              checked={hasPhoneOnly}
              onChange={(e) => setHasPhoneOnly(e.target.checked)}
            />
            <span>{t('search.filter.phone')}</span>
          </label>
        </div>

        <button type="submit" className="btn btn-search" disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="spin" size={16} />
              <span>{t('search.loading')}</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span>{t('search.submit')}</span>
            </>
          )}
        </button>
      </form>

      {/* Advanced Extraction Controls: Limit, Deduplication & Local Lead Vault Status */}
      <div className="search-controls-row">
        <div className="search-controls-left">
          {/* Record Count / Limit Selector */}
          <div className="limit-selector-group">
            <Layers size={14} className="text-secondary" />
            <span>{locale === 'ar' ? 'عدد النتائج:' : 'Result limit:'}</span>
            <div className="limit-chips">
              {LIMIT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`limit-chip-btn ${limit === opt.value ? 'active' : ''}`}
                  onClick={() => setLimit(opt.value)}
                  title={locale === 'ar' ? `استخراج حتى ${opt.value} نتيجة في هذا البحث` : `Fetch up to ${opt.value} results`}
                >
                  {locale === 'ar' ? opt.labelAr : opt.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Deduplication & Skip Previously Fetched Leads Toggle */}
          <label className="dedupe-toggle-label" title={locale === 'ar' ? 'استبعاد أي محل تم حفظه سابقاً في قاعدة بياناتك لتوفير رصيد الـ API' : 'Skip previously fetched leads to save API quota'}>
            <input
              type="checkbox"
              checked={skipDuplicates}
              onChange={(e) => setSkipDuplicates(e.target.checked)}
            />
            <ShieldCheck size={14} color="#10b981" />
            <span>{locale === 'ar' ? 'استبعاد السجلات المحفوظة' : 'Skip saved leads'}</span>
          </label>
        </div>

        {/* Local Lead Vault Badge & 0-API View Action */}
        <div className="search-controls-right">
          <div className="vault-status-card" title={locale === 'ar' ? 'يتم حفظ جميع النتائج محلياً تلقائياً لتقليل الاتصال مع Google API' : 'All leads are auto-saved locally to minimize API calls'}>
            <Database size={13} />
            <span>
              {locale === 'ar' ? 'المحفوظ:' : 'Saved:'} <strong>{vaultCount}</strong> {locale === 'ar' ? 'جهة اتصال' : 'leads'}
            </span>
            {onViewVault && vaultCount > 0 && (
              <button
                type="button"
                className="btn-vault-action"
                onClick={onViewVault}
                title={locale === 'ar' ? 'عرض كل السجلات المحفوظة في قاعدة بياناتك دون استهلاك الـ API' : 'View all locally saved leads without calling API'}
              >
                {locale === 'ar' ? 'عرض الكل' : 'View all'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="presets-container" style={{ marginTop: '12px' }}>
        <span className="presets-title">
          <MapPin size={13} />
          <span>{t('search.regions')} {countries.find(c => c.code === country)?.name}:</span>
        </span>
        <div className="presets-list">
          {currentSuggestedCities.map((c) => {
            const isSelected = (c === (locale === 'ar' ? 'جميع المناطق' : 'All Regions') && !city) || city === c;
            return (
              <button
                key={c}
                type="button"
                className={`preset-chip ${isSelected ? 'chip-active' : ''}`}
                onClick={() => handleCityChipClick(c)}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      <div className="presets-container">
        <span className="presets-title">
          <Layers size={13} />
          <span>{t('search.categories')}</span>
        </span>
        <div className="presets-list">
          {PRESET_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`preset-chip ${query === cat ? 'chip-active' : ''}`}
              onClick={() => handlePresetClick(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
