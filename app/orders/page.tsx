'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, RefreshCw, Search, Phone, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'new' | 'reviewing' | 'assigned' | 'completed' | 'cancelled';
interface BotOrder {
  id: string; created_at: string; customer_phone: string; customer_name: string | null;
  origin: string; destination: string; requested_time: string; item_description: string | null;
  recipient_phone: string | null; price_text: string | null; status: OrderStatus; notes: string;
}
const statuses: OrderStatus[] = ['new','reviewing','assigned','completed','cancelled'];
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
  useEffect(() => { refresh(); },[refresh]);
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
  if (authLoading || !user) return <main className="orders-page"><p>{lang('جاري التحقق من الحساب…','Checking account…')}</p></main>;
  return <main className="orders-page" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
    <header className="orders-header">
      <button type="button" className="btn btn-secondary" onClick={() => router.push('/')}><ArrowRight size={17}/>{lang('لوحة التحكم','Dashboard')}</button>
      <div><h1>{lang('طلبات البوت','Bot orders')}</h1><p>{lang('الطلبات التي أكدها العملاء عبر واتساب','Orders confirmed by customers on WhatsApp')}</p></div>
      <button type="button" className="btn btn-secondary" onClick={refresh} disabled={loading}><RefreshCw size={17}/>{lang('تحديث','Refresh')}</button>
    </header>
    <div className="orders-filters">
      <label className="orders-search"><Search size={17}/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={lang('ابحث بالاسم أو الرقم أو المسار','Search name, phone or route')} aria-label={lang('بحث الطلبات','Search orders')}/></label>
      <select value={status} onChange={event=>setStatus(event.target.value as OrderStatus | 'all')} aria-label={lang('تصفية الحالة','Filter status')}>
        <option value="all">{lang('جميع الحالات','All statuses')}</option>
        {statuses.map(value=><option value={value} key={value}>{labels[value][locale]}</option>)}
      </select>
      <span className="orders-count">{filtered.length} {lang('طلب','orders')}</span>
    </div>
    {error && <p className="orders-error" role="alert">{error}</p>}
    {loading && <p className="orders-empty">{lang('جاري تحميل الطلبات…','Loading orders…')}</p>}
    {!loading && filtered.length===0 && <p className="orders-empty">{lang('لا توجد طلبات مؤكدة ضمن هذا البحث.','No confirmed orders match this search.')}</p>}
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
      <div className="order-actions"><label>{lang('الحالة','Status')}<select value={order.status} disabled={savingId===order.id} onChange={event=>changeStatus(order,event.target.value as OrderStatus)}>{statuses.map(value=><option value={value} key={value}>{labels[value][locale]}</option>)}</select></label>
        <a className="btn btn-secondary" href={`https://wa.me/${order.customer_phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/>{lang('مراسلة العميل','Message customer')}</a>
      </div>
      <label className="order-notes">{lang('ملاحظات الإدارة','Admin notes')}<textarea key={`${order.id}-${order.notes}`} defaultValue={order.notes} rows={2} maxLength={2000} onBlur={event=>changeNotes(order,event.target.value)} placeholder={lang('أضف ملاحظة للمتابعة','Add a follow-up note')}/></label>
    </article>)}</div>
  </main>;
}
