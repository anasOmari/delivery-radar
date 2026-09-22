'use client';

import React, { useState } from 'react';
import {
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
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field, TextInput } from './ui/Field';
import { Banner } from './ui/StatusPill';

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
  const { locale } = useLanguage();
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
    <Modal
      onClose={onClose}
      size="lg"
      icon={<FolderKanban size={18} />}
      iconTone="brand"
      title="إدارة قوائم الحملات والعملاء المحفوظة"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          إغلاق
        </Button>
      }
    >
      {actionMessage && (
        <Banner tone="green" icon={<Check size={16} />}>
          <span className="ui-flex-fill">{actionMessage}</span>
          <button className="btn-close" onClick={() => setActionMessage(null)}>×</button>
        </Banner>
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
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              disabled={currentLeads.length === 0}
              onClick={() => setShowCreateForm(true)}
            >
              حفظ النتائج كقائمة
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCreateListFromCurrent}>
            <Field label="اسم القائمة الجديدة (مثال: أطباء أسنان الرياض - مارس):" htmlFor="new-list-name">
              <div className="flex-align gap-2">
                <TextInput
                  id="new-list-name"
                  type="text"
                  autoFocus
                  className="ui-flex-fill"
                  placeholder="اكتب اسم القائمة..."
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                />
                <Button type="submit" variant="primary" size="sm">
                  حفظ
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  إلغاء
                </Button>
              </div>
            </Field>
          </form>
        )}
      </div>

      {/* Saved Lists Overview */}
      <div>
        <div className="flex-between ui-mb-2">
          <span className="subtext">
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
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelect(list)}
                    title="فتح وتحميل القائمة في الواجهة"
                  >
                    <span>فتح القائمة</span>
                    <ArrowRight size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="btn-delete"
                    onClick={() => handleDeleteList(list.id)}
                    title="حذف القائمة"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
