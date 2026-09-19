'use client';

import React, { useState } from 'react';
import {
  X,
  FolderKanban,
  Plus,
  Trash2,
  ArrowRight,
  FolderOpen,
  Calendar,
  Layers,
  Check,
  MapPin,
  Tag
} from 'lucide-react';
import { Lead } from '@/lib/types';
import { useLanguage } from '@/lib/LanguageContext';

export interface CampaignList {
  id: string;
  name: string;
  category: string;
  city: string;
  createdAt: string;
  leads: Lead[];
}

interface SavedListsModalProps {
  currentLeads: Lead[];
  onLoadList: (list: CampaignList) => void;
  onClose: () => void;
}

export const SavedListsModal: React.FC<SavedListsModalProps> = ({
  currentLeads,
  onLoadList,
  onClose
}) => {
  const { locale, t } = useLanguage();
  const [lists, setLists] = useState<CampaignList[]>(() => {
    try {
      const stored = localStorage.getItem('saved_campaign_lists');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newListName, setNewListName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const saveListsToStorage = (updated: CampaignList[]) => {
    setLists(updated);
    try {
      localStorage.setItem('saved_campaign_lists', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving campaign lists:', e);
    }
  };

  const handleCreateListFromCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const sampleLead = currentLeads[0];
    const newList: CampaignList = {
      id: 'list_' + Date.now(),
      name: newListName.trim(),
      category: sampleLead?.category || 'أنشطة متعددة',
      city: sampleLead?.city || 'مدن مختلفة',
      createdAt: new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      leads: currentLeads
    };

    const updated = [newList, ...lists];
    saveListsToStorage(updated);
    setNewListName('');
    setShowCreateForm(false);
    setActionMessage(`تم حفظ القائمة "${newList.name}" بنجاح (${currentLeads.length} عميل)`);
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleDeleteList = (id: string) => {
    const target = lists.find(l => l.id === id);
    if (!target) return;
    if (confirm(`هل أنت متأكد من حذف قائمة "${target.name}"؟`)) {
      const updated = lists.filter(l => l.id !== id);
      saveListsToStorage(updated);
    }
  };

  const handleSelect = (list: CampaignList) => {
    onLoadList(list);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-header-icon">
              <FolderKanban size={18} />
            </div>
            <div>
              <h3 className="modal-title">إدارة قوائم الحملات والعملاء المحفوظة</h3>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="إغلاق">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {actionMessage && (
            <div className="notification-banner banner-success">
              <div className="flex-align gap-2">
                <Check size={16} />
                <span>{actionMessage}</span>
              </div>
              <button className="btn-close" onClick={() => setActionMessage(null)}>×</button>
            </div>
          )}

          {/* Create Campaign Card */}
          <div className="saved-list-create-card">
            {!showCreateForm ? (
              <div className="flex-between">
                <div>
                  <h4 className="create-card-title">حفظ النتائج الحالية كقائمة حملة جديدة</h4>
                  <p className="create-card-sub">
                    سيتم حفظ {currentLeads.length} عميل حالي في قائمة منفصلة للرجوع إليها في أي وقت.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={currentLeads.length === 0}
                  onClick={() => setShowCreateForm(true)}
                >
                  <Plus size={15} />
                  <span>حفظ النتائج كقائمة</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateListFromCurrent}>
                <label className="modal-label" style={{ marginBottom: '6px' }}>
                  اسم القائمة الجديدة (مثال: أطباء أسنان الرياض - مارس):
                </label>
                <div className="flex-align gap-2">
                  <input
                    type="text"
                    autoFocus
                    className="input-field"
                    placeholder="اكتب اسم القائمة..."
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    حفظ
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowCreateForm(false)}
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Saved Lists Overview */}
          <div>
            <div className="flex-between" style={{ marginBottom: '10px' }}>
              <span className="text-xs font-semibold subtext">
                القوائم المحفوظة لديك ({lists.length}):
              </span>
            </div>

            {lists.length === 0 ? (
              <div className="saved-lists-empty">
                <FolderOpen size={38} className="empty-icon" />
                <h4 className="empty-title">لا توجد قوائم حملات محفوظة حتى الآن</h4>
                <p className="empty-sub">
                  {locale === 'ar' ? 'قم بالبحث وتصفية العملاء ثم اضغط على حفظ النتائج كقائمة لتنظيم جهودك.' : 'Search and filter leads, then click Save Results as List to organize your efforts.'}
                </p>
              </div>
            ) : (
              <div className="saved-lists-stack">
                {lists.map(list => (
                  <div key={list.id} className="saved-list-item-card">
                    <div className="flex-align gap-3">
                      <div className="list-icon-badge">
                        <Layers size={18} />
                      </div>
                      <div>
                        <h4 className="list-name-heading">{list.name}</h4>
                        <div className="list-meta-row">
                          <span className="flex-align gap-1">
                            <MapPin size={11} />
                            <span>{list.city}</span>
                          </span>
                          <span>•</span>
                          <span className="flex-align gap-1">
                            <Tag size={11} />
                            <span>{list.category}</span>
                          </span>
                          <span>•</span>
                          <span className="flex-align gap-1">
                            <Calendar size={11} />
                            <span>{list.createdAt}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-align gap-2">
                      <span className="list-count-badge">
                        {list.leads?.length || 0} محل
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleSelect(list)}
                        title="فتح وتحميل القائمة في الواجهة"
                      >
                        <span>فتح القائمة</span>
                        <ArrowRight size={13} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon btn-delete"
                        onClick={() => handleDeleteList(list.id)}
                        title="حذف القائمة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
