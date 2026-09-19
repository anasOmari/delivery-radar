const { createClient } = require('@supabase/supabase-js');

const url = 'https://fiyigxxozeyxiteznwlk.supabase.co';
const key = 'sb_publishable_1dQumI46aVa4-O41Gd20WQ_jznxNvYe';
const supabase = createClient(url, key);

async function seed() {
  console.log('Seeding initial data and settings to Supabase...');

  // 1. Seed Green-API & Chatbot Settings
  const defaultConfig = {
    provider: 'greenapi',
    greenapi: {
      idInstance: '710722741021',
      apiTokenInstance: '', // Will be completed on save
      apiUrl: 'https://7107.api.greenapi.com'
    },
    chatbotEnabled: true,
    managerPhone: '0788779463',
    sendDelaySeconds: 2,
    autoSendDirectly: true,
    chatbotGreeting: 'أهلاً بك في خدمات قطرة الندى للتوصيل والنقل السريع'
  };

  const { data: settingData, error: settingError } = await supabase
    .from('app_settings')
    .upsert({
      key: 'whatsapp_config',
      value: defaultConfig,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })
    .select();

  if (settingError) {
    console.warn('Setting upsert error:', settingError.message);
  } else {
    console.log('✅ app_settings populated in Supabase:', settingData);
  }

  // 2. Seed Initial Leads
  const initialLeads = [
    {
      name: 'مطعم ومأكولات ورد الشام',
      phone: '0788779463',
      city: 'عمان',
      category: 'مطاعم ومأكولات',
      rating: 4.8,
      address: 'عمان - الجبيهة شارع الجامعة',
      status: 'new',
      notes: 'مهتمون بخدمة التوصيل السريع والاشتراك الشهري',
      opportunity_score: 95
    },
    {
      name: 'صيدلية الرعاية الحديثة',
      phone: '0791234567',
      city: 'عمان',
      category: 'صيدليات ومستلزمات طبية',
      rating: 4.6,
      address: 'عمان - خلدا قرب دوار الواحة',
      status: 'new',
      notes: 'توصيل أدوية فوري على مدار 24 ساعة',
      opportunity_score: 88
    },
    {
      name: 'متجر ستايل للأزياء والأونلاين',
      phone: '0772345678',
      city: 'إربد',
      category: 'متاجر وملابس',
      rating: 4.9,
      address: 'إربد - شارع الجامعة',
      status: 'new',
      notes: 'شحن وتوصيل للمحافظات مع كاش مقدم',
      opportunity_score: 92
    },
    {
      name: 'حلويات النجمة الذهبية',
      phone: '0783456789',
      city: 'الزرقاء',
      category: 'حلويات ومخابز',
      rating: 4.7,
      address: 'الزرقاء الجديدة - شارع 36',
      status: 'new',
      notes: 'توصيل هدايا وتواصي بنفس اليوم',
      opportunity_score: 85
    }
  ];

  const { data: leadsData, error: leadsError } = await supabase
    .from('leads')
    .upsert(initialLeads, { onConflict: 'phone' })
    .select();

  if (leadsError) {
    console.warn('Leads upsert error:', leadsError.message);
  } else {
    console.log('✅ Leads populated in Supabase:', leadsData?.length, 'rows');
  }

  // 3. Seed welcome message in whatsapp_messages
  const { data: msgData, error: msgError } = await supabase
    .from('whatsapp_messages')
    .insert([
      {
        phone: '0788779463',
        lead_name: 'خدمات قطرة الندى',
        message_text: 'تم تهيئة وتفعيل النظام الذكي وقاعدة البيانات السحابية بنجاح 🚀',
        direction: 'outbound',
        status: 'delivered'
      }
    ])
    .select();

  if (msgError) {
    console.warn('Message insert error:', msgError.message);
  } else {
    console.log('✅ Initial message logged in Supabase:', msgData);
  }
}

seed();
