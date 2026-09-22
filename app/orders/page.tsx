'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, Search, Phone, MessageCircle, ClipboardList } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';
import { PageHeader, Field, TextInput, Banner, EmptyState, StatusPill, Button } from '@/components/ui';
import type { StatusTone } from '@/components/ui';

type OrderStatus = 'new' | 'reviewing' | 'assigned' | 'completed' | 'cancelled';
interface BotOrder {
  id: string; created_at: string; customer_phone: string; customer_name: string | null;
  origin: string; destination: string; requested_time: string; item_description: string | null;
  recipient_phone: string | null; price_text: string | null; status: OrderStatus; notes: string;
}
const statuses: OrderStatus[] = ['new','reviewing','assigned','completed','cancelled'];
const statusTone: Record<OrderStatus, StatusTone> = {
  new: 'blue', reviewing: 'amber', assigned: 'purple', completed: 'green', cancelled: 'red',
};
const labels: Record<OrderStatus,{ar:string;en:string}> = {
  new:{ar:'جديد',en:'New'}, reviewing:{ar:'قيد المراجعة',en:'Reviewing'},
  assigned:{ar:'تم تعيين كابتن',en:'Captain assigned'}, completed:{ar:'مكتمل',en:'Completed'},
  cancelled:{ar:'ملغي',en:'Cancelled'},
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const router = useRouter();
  const [orders,setOrders] = useState<BotOrder[]>([]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');
  const [query,setQuery] = useState('');
  const [status,setStatus] = useState<OrderStatus | 'all'>('all');
  const [savingId,setSavingId] = useState<string | null>(null);
  const lang = (ar:string,en:string) => locale === 'ar' ? ar : en;

  useEffect(() => { if (!authLoading && !user) router.replace('/login'); }, [authLoading,user,router]);
  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);setError('');
    const result = await supabase.from('bot_orders').select('id,created_at,customer_phone,customer_name,origin,destination,requested_time,item_description,recipient_phone,price_text,status,notes').order('created_at',{ascending:false}).limit(200);
    if (result.error) setError(result.error.message);
    else setOrders((result.data || []) as BotOrder[]);
    setLoading(false);
  },[user]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial orders fetch on mount
    refresh();
  },[refresh]);
  const filtered = useMemo(() => orders.filter(order => (status === 'all' || order.status === status) &&
    `${order.customer_phone} ${order.customer_name || ''} ${order.origin} ${order.destination} ${order.id}`.toLowerCase().includes(query.toLowerCase())),[orders,status,query]);
  const changeStatus = async (order:BotOrder,next:OrderStatus) => {
    setSavingId(order.id);setError('');
    const result = await supabase.from('bot_orders').update({status:next,updated_at:new Date().toISOString()}).eq('id',order.id).select('id').single();
    if (result.error) setError(result.error.message);
    else setOrders(previous => previous.map(item => item.id === order.id ? {...item,status:next} : item));
    setSavingId(null);
  };
  const changeNotes = async (order:BotOrder,next:string) => {
    if (next === order.notes) return;
    setSavingId(order.id);setError('');
    const result = await supabase.from('bot_orders').update({notes:next.slice(0,2000),updated_at:new Date().toISOString()}).eq('id',order.id).select('id').single();
    if (result.error) setError(result.error.message);
    else setOrders(previous => previous.map(item => item.id === order.id ? {...item,notes:next} : item));
    setSavingId(null);
  };
  if (authLoading || !user) return <main className="orders-page"><EmptyState title={lang('جاري التحقق من الحساب…','Checking account…')} /></main>;
  return <main className="orders-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <PageHeader
      icon={<ClipboardList size={18} />}
      iconTone="brand"
      title={lang('طلبات البوت','Bot orders')}
      subtitle={lang('الطلبات التي أكدها العملاء عبر واتساب','Orders confirmed by customers on WhatsApp')}
      actions={<>
        <Button variant="secondary" onClick={() => router.push('/')} icon={<ArrowRight size={17}/>}>{lang('لوحة التحكم','Dashboard')}</Button>
        <Button variant="secondary" onClick={refresh} disabled={loading} icon={<RefreshCw size={17}/>}>{lang('تحديث','Refresh')}</Button>
      </>}
    />
    <div className="orders-filters">
      <Field htmlFor="orders-search-input">
        <label className="orders-search"><Search size={17}/><TextInput id="orders-search-input" value={query} onChange={event=>setQuery(event.target.value)} placeholder={lang('ابحث بالاسم أو الرقم أو المسار','Search name, phone or route')} aria-label={lang('بحث الطلبات','Search orders')}/></label>
      </Field>
      <Field htmlFor="orders-status-filter">
        <select id="orders-status-filter" value={status} onChange={event=>setStatus(event.target.value as OrderStatus | 'all')} aria-label={lang('تصفية الحالة','Filter status')}>
          <option value="all">{lang('جميع الحالات','All statuses')}</option>
          {statuses.map(value=><option value={value} key={value}>{labels[value][locale]}</option>)}
        </select>
      </Field>
      <span className="orders-count">{filtered.length} {lang('طلب','orders')}</span>
    </div>
    {error && <Banner tone="red"><span role="alert">{error}</span></Banner>}
    {loading && <EmptyState icon={<RefreshCw size={20} className="spin" />} title={lang('جاري تحميل الطلبات…','Loading orders…')} />}
    {!loading && filtered.length===0 && <EmptyState icon={<Search size={20} />} title={lang('لا توجد طلبات مؤكدة ضمن هذا البحث.','No confirmed orders match this search.')} action={<Button variant="secondary" size="sm" onClick={refresh} icon={<RefreshCw size={15}/>}>{lang('تحديث','Refresh')}</Button>} />}
    <div className="orders-grid">{!loading && filtered.map(order=><article className="order-card" key={order.id}>
      <div className="order-card-top"><strong>#{order.id.slice(0,8)}</strong><time dateTime={order.created_at}>{new Date(order.created_at).toLocaleString(locale==='ar'?'ar-JO':'en-US')}</time></div>
      <h2>{order.customer_name || lang('عميل واتساب','WhatsApp customer')}</h2>
      <a className="order-phone" href={`tel:${order.customer_phone}`}><Phone size={16}/><span dir="ltr">{order.customer_phone}</span></a>
      <div className="order-route"><span>{lang('من','From')} <strong>{order.origin}</strong></span><span>{lang('إلى','To')} <strong>{order.destination}</strong></span></div>
      <dl className="order-details">
        <div><dt>{lang('الوقت المطلوب','Requested time')}</dt><dd>{order.requested_time}</dd></div>
        <div><dt>{lang('نوع الطلب','Item')}</dt><dd>{order.item_description || lang('لم يذكر','Not provided')}</dd></div>
        <div><dt>{lang('أجرة التوصيل','Delivery price')}</dt><dd>{order.price_text || lang('بحاجة إلى تسعير','Needs pricing')}</dd></div>
        <div><dt>{lang('هاتف المستلم','Recipient phone')}</dt><dd dir="ltr">{order.recipient_phone || '—'}</dd></div>
      </dl>
      <div className="order-actions"><label>{lang('الحالة','Status')}<span className="flex-align gap-2"><select value={order.status} disabled={savingId===order.id} onChange={event=>changeStatus(order,event.target.value as OrderStatus)}>{statuses.map(value=><option value={value} key={value}>{labels[value][locale]}</option>)}</select><StatusPill tone={statusTone[order.status]}>{labels[order.status][locale]}</StatusPill></span></label>
        <a className="btn btn-secondary" href={`https://wa.me/${order.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>{lang('مراسلة العميل','Message customer')}</a>
      </div>
      <label className="order-notes">{lang('ملاحظات الإدارة','Admin notes')}<textarea key={`${order.id}-${order.notes}`} defaultValue={order.notes} rows={2} maxLength={2000} onBlur={event=>changeNotes(order,event.target.value)} placeholder={lang('أضف ملاحظة للمتابعة','Add a follow-up note')}/></label>
    </article>)}</div>
  </main>;
}
