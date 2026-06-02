-- Sample seed data for WINS Internal Admin
-- Run this after schema.sql in the Supabase SQL Editor.

insert into public.customers (
  id,
  company_name,
  contact_name,
  contact_email,
  contact_phone,
  market_segment,
  billing_terms,
  credit_limit_jpy,
  status,
  notes
)
values
  (
    gen_random_uuid(),
    'Tokyo Sakura Travel',
    '陈小姐',
    'sales@tokyosakura.example',
    '+81-3-1111-2222',
    '中国团体',
    '月结 30 天',
    1280000,
    'active',
    '重点合作客户'
  ),
  (
    gen_random_uuid(),
    'Hana Group',
    'Yuki Tan',
    'ops@hanagroup.example',
    '+81-3-3333-4444',
    '东南亚自由行',
    '月结 15 天',
    260000,
    'nurturing',
    '有增长潜力'
  ),
  (
    gen_random_uuid(),
    'Asia Incentive Co.',
    'Mr. Lim',
    'hello@asiaincentive.example',
    '+65-6666-7777',
    '企业会奖',
    '即期',
    0,
    'settled',
    '企业会奖客户'
  );

insert into public.vehicles (
  id,
  plate_number,
  label,
  vehicle_type,
  seat_capacity,
  owner_type,
  inspection_due_on,
  status,
  notes
)
values
  (
    gen_random_uuid(),
    '品川300 あ 88-21',
    'Tokyo Mid Bus 01',
    '中型巴士',
    28,
    'owned',
    '2026-06-04',
    'available',
    '东京市区团体用车'
  ),
  (
    gen_random_uuid(),
    '足立500 さ 12-43',
    'Executive Van 02',
    '商务车',
    10,
    'owned',
    '2026-05-30',
    'maintenance',
    '高端接送'
  ),
  (
    gen_random_uuid(),
    '横浜200 ね 76-51',
    'Large Bus 03',
    '大型巴士',
    45,
    'partner',
    '2026-06-12',
    'available',
    '周末富士山团队'
  );

insert into public.drivers (
  id,
  full_name,
  languages,
  contract_type,
  phone,
  duty_hours_monthly,
  safety_score,
  status,
  notes
)
values
  (
    gen_random_uuid(),
    '田中宏',
    array['日语', '中文'],
    'full_time',
    '+81-90-1000-1000',
    142,
    98,
    'available',
    '中文团经验丰富'
  ),
  (
    gen_random_uuid(),
    '伊藤勇人',
    array['日语', '英语'],
    'full_time',
    '+81-90-2000-2000',
    126,
    95,
    'off_duty',
    '短期休假'
  ),
  (
    gen_random_uuid(),
    '铃木启介',
    array['日语', '中文'],
    'part_time',
    '+81-90-3000-3000',
    94,
    96,
    'available',
    '适合团队单'
  );

insert into public.guides (
  id,
  full_name,
  languages,
  specialties,
  license_type,
  rating,
  status,
  notes
)
values
  (
    gen_random_uuid(),
    '佐藤美纪',
    array['中文', '日语'],
    array['机场接送', '商务团'],
    '全国通译案内士',
    4.9,
    'assigned',
    '高频接机安排'
  ),
  (
    gen_random_uuid(),
    '松本优子',
    array['英语', '日语'],
    array['关东周游', '高端定制'],
    '区域导游',
    4.8,
    'available',
    '高端客户线路'
  ),
  (
    gen_random_uuid(),
    '中村翔',
    array['中文', '英语'],
    array['团队观光'],
    '区域导游',
    4.7,
    'off_duty',
    '周末可排班'
  );

with customer_map as (
  select id, company_name from public.customers
),
quote_rows as (
  insert into public.quotations (
    id,
    quote_no,
    customer_id,
    title,
    service_date,
    valid_until,
    status,
    subtotal_jpy,
    total_cost_jpy,
    notes
  )
  values
    (
      gen_random_uuid(),
      'Q-2026-041',
      (select id from customer_map where company_name = 'Tokyo Sakura Travel'),
      '东京 3 天 2 夜',
      '2026-05-25',
      '2026-05-31',
      'draft',
      320000,
      214000,
      '待客户确认'
    ),
    (
      gen_random_uuid(),
      'Q-2026-042',
      (select id from customer_map where company_name = 'Hana Group'),
      '富士山一日游',
      '2026-05-27',
      '2026-05-29',
      'sent',
      180000,
      128000,
      '已发送报价'
    ),
    (
      gen_random_uuid(),
      'Q-2026-043',
      (select id from customer_map where company_name = 'Asia Incentive Co.'),
      'VIP Arrival Support',
      '2026-05-29',
      '2026-06-05',
      'accepted',
      540000,
      372000,
      '客户已接受'
    )
  returning id, quote_no, customer_id, title, service_date, status, subtotal_jpy, total_cost_jpy
)
insert into public.orders (
  id,
  order_no,
  customer_id,
  quote_id,
  title,
  service_date,
  status,
  revenue_jpy,
  total_cost_jpy,
  notes
)
select
  gen_random_uuid(),
  case quote_no
    when 'Q-2026-041' then 'WIN-250522-01'
    when 'Q-2026-042' then 'WIN-250522-02'
    else 'WIN-250522-03'
  end,
  customer_id,
  id,
  case quote_no
    when 'Q-2026-041' then 'Narita Pickup + Tokyo 3D2N'
    when 'Q-2026-042' then 'Mt. Fuji Day Tour'
    else 'Corporate Arrival Support'
  end,
  service_date,
  case quote_no
    when 'Q-2026-041' then 'pending_confirmation'
    when 'Q-2026-042' then 'scheduled'
    else 'in_progress'
  end,
  subtotal_jpy,
  total_cost_jpy,
  title
from quote_rows;
