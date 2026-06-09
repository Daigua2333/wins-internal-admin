-- Demo seed data for WINS Internal Admin.
-- Run this after schema.sql in the Supabase SQL Editor.
--
-- Warning:
-- This script resets demo business data only. It intentionally does not delete
-- auth users, public.profiles, or app_settings, so login roles and settings stay intact.

begin;

delete from public.supplier_payments;
delete from public.payment_receipts;
delete from public.trip_costs;
delete from public.driver_incidents;
delete from public.orders;
delete from public.quotations;
delete from public.guides;
delete from public.drivers;
delete from public.vehicles;
delete from public.customers;

insert into public.customers (
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
    'WINS East Asia Partner',
    '王经理',
    'wang.manager@example.com',
    '+86-21-6000-1001',
    '中国华东企业奖励游',
    '月结 30 天',
    1800000,
    'active',
    '企业奖励团重点客户，常用东京市区、箱根和富士山线路。'
  ),
  (
    'Tokyo One Day Repeat Tours',
    '李主管',
    'ops.repeat@example.com',
    '+81-3-6000-1002',
    '中文散拼一日游',
    '每周结算',
    1200000,
    'active',
    '重复一日游合作客户，适合测试连续日期建单和日历排班。'
  ),
  (
    'Hokkaido & Kanto Education Desk',
    'Ms. Chen',
    'education.desk@example.com',
    '+81-3-6000-1003',
    '教育研学',
    '定金 50% / 出团前结清',
    680000,
    'nurturing',
    '研学团队，常需要学校名单、保险和随车老师信息。'
  ),
  (
    'Asia Incentive Circle',
    'Mr. Lim',
    'lim@asiaincentive.example',
    '+65-6000-1004',
    '企业会奖',
    '即期',
    2200000,
    'active',
    '东南亚企业会奖客户，偏好 VIP 接机和晚宴安排。'
  ),
  (
    'Premium FIT Concierge',
    '高桥顾问',
    'concierge.fit@example.com',
    '+81-90-6000-1005',
    '高端定制 FIT',
    '预付 70% / 结束后 7 天内结清',
    500000,
    'nurturing',
    '高端定制客户，适合测试高毛利小团和供应商付款。'
  );

insert into public.vehicles (
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
    '品川300 あ 88-21',
    'WINS 中巴 01',
    '中型巴士',
    28,
    'owned',
    '2026-06-08',
    'assigned',
    '今日已排 VIP 接机和市区团队，可用于测试在途车辆。'
  ),
  (
    '足立500 さ 12-43',
    'WINS 商务车 02',
    '商务车',
    10,
    'owned',
    '2026-06-06',
    'maintenance',
    '进入点检窗口，适合测试车辆保养提醒。'
  ),
  (
    '練馬330 す 45-18',
    'Alphard VIP 03',
    'VIP 商务车',
    6,
    'owned',
    '2026-06-20',
    'available',
    '高端 FIT 和商务接送优先车辆。'
  ),
  (
    '横浜200 ね 76-51',
    '合作大型巴士 A',
    '大型巴士',
    45,
    'partner',
    '2026-06-12',
    'available',
    '富士山、企业奖励团高峰补位车辆。'
  ),
  (
    '多摩500 こ 31-09',
    '合作小巴 B',
    '小型巴士',
    18,
    'partner',
    '2026-06-18',
    'assigned',
    '重复一日游常用合作车辆。'
  );

insert into public.drivers (
  full_name,
  languages,
  contract_type,
  phone,
  wechat_id,
  line_id,
  attendance_days_monthly,
  display_color,
  default_vehicle_id,
  duty_hours_monthly,
  safety_score,
  status,
  notes
)
values
  (
    '田中 宏',
    array['日语', '中文'],
    'full_time',
    '+81-90-3200-8821',
    'wins_tanaka',
    null,
    12,
    '#0f766e',
    (select id from public.vehicles where plate_number = '品川300 あ 88-21' limit 1),
    142,
    98,
    'assigned',
    '中文团经验丰富，今日执行羽田 VIP 接机。安全记录：2026-06-01 平稳驾驶 +2。'
  ),
  (
    '伊藤 勇人',
    array['日语', '英语'],
    'full_time',
    '+81-90-5143-1200',
    null,
    'wins.ito',
    8,
    '#2563eb',
    (select id from public.vehicles where plate_number = '足立500 さ 12-43' limit 1),
    126,
    95,
    'off_duty',
    '短期休假，适合测试司机不可排班状态。安全记录：2026-05-28 车内整洁 +1。'
  ),
  (
    '铃木 启介',
    array['日语', '中文'],
    'part_time',
    '+81-90-7651-4450',
    'wins_suzuki',
    null,
    10,
    '#d97706',
    (select id from public.vehicles where plate_number = '練馬330 す 45-18' limit 1),
    94,
    96,
    'available',
    '可接东京市区、机场线与富士山一日游。安全记录：2026-06-03 准点抵达 +1。'
  ),
  (
    '山本 健',
    array['日语', '中文', '英语'],
    'partner',
    '+81-90-8833-2010',
    null,
    'wins.yamamoto',
    11,
    '#be123c',
    (select id from public.vehicles where plate_number = '横浜200 ね 76-51' limit 1),
    82,
    93,
    'assigned',
    '合作司机，熟悉大型巴士与企业团线路。安全记录：2026-05-30 客诉已复盘 -1。'
  ),
  (
    '王 建国',
    array['中文', '日语'],
    'partner',
    '+81-90-6677-9831',
    'wins_wang',
    'wins.wang',
    9,
    '#7c3aed',
    (select id from public.vehicles where plate_number = '多摩500 こ 31-09' limit 1),
    76,
    97,
    'available',
    '中文客户沟通能力强，适合散拼一日游。安全记录：2026-06-02 路线规划优秀 +2。'
  );

insert into public.guides (
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
    '佐藤 美纪',
    array['中文', '日语'],
    array['机场接送', '商务团'],
    '全国通译案内士',
    4.9,
    'assigned',
    '今日负责 VIP 羽田接机，客户沟通稳定。'
  ),
  (
    '松本 优子',
    array['英语', '日语'],
    array['高端定制', '关东周游'],
    '区域导游',
    4.8,
    'available',
    '适合高端 FIT、箱根和美食线路。'
  ),
  (
    '中村 翔',
    array['中文', '英语'],
    array['团队观光', '富士山一日游'],
    '区域导游',
    4.7,
    'assigned',
    '已排富士山重复一日游。'
  ),
  (
    '林 小雅',
    array['中文', '日语'],
    array['教育研学', '浅草文化体验'],
    '全国通译案内士',
    4.9,
    'available',
    '适合学生研学和文化体验线路。'
  ),
  (
    '高桥 真由',
    array['英语', '日语'],
    array['VIP 接待', '美食线路'],
    '区域导游',
    4.8,
    'off_duty',
    '本周末可恢复排班。'
  );

insert into public.quotations (
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
    'Q-20260605-001',
    (select id from public.customers where company_name = 'WINS East Asia Partner' limit 1),
    '东京企业奖励三日',
    '2026-06-08',
    '2026-06-07',
    'draft',
    780000,
    518000,
    '等待客户确认最终人数与晚宴预算。'
  ),
  (
    'Q-20260605-002',
    (select id from public.customers where company_name = 'Tokyo One Day Repeat Tours' limit 1),
    '富士山河口湖每日重复一日游',
    '2026-06-06',
    '2026-06-09',
    'sent',
    260000,
    176000,
    '重复团产品，可复制到连续日期。'
  ),
  (
    'Q-20260605-003',
    (select id from public.customers where company_name = 'Asia Incentive Circle' limit 1),
    'VIP 羽田接机 + 银座晚宴',
    '2026-06-05',
    '2026-06-05',
    'accepted',
    420000,
    282000,
    '客户已接受，已转订单。'
  ),
  (
    'Q-20260605-004',
    (select id from public.customers where company_name = 'Hokkaido & Kanto Education Desk' limit 1),
    '镰仓研学一日',
    '2026-06-12',
    '2026-06-10',
    'draft',
    310000,
    208000,
    '需确认学校保险名单。'
  ),
  (
    'Q-20260605-005',
    (select id from public.customers where company_name = 'Premium FIT Concierge' limit 1),
    '箱根温泉两日定制',
    '2026-06-20',
    '2026-06-14',
    'sent',
    560000,
    386000,
    '高端 FIT 定制报价，包含温泉旅馆与专车。'
  );

insert into public.orders (
  order_no,
  customer_id,
  quote_id,
  title,
  service_date,
  status,
  assignee_profile_id,
  vehicle_id,
  driver_id,
  guide_id,
  revenue_jpy,
  total_cost_jpy,
  notes
)
values
  (
    'WIN-20260605-001',
    (select id from public.customers where company_name = 'Asia Incentive Circle' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-003' limit 1),
    'VIP 羽田接机 + 银座晚宴',
    '2026-06-05',
    'in_progress',
    (select id from public.profiles where email = 'ops.tokyo@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '品川300 あ 88-21' limit 1),
    (select id from public.drivers where full_name = '田中 宏' limit 1),
    (select id from public.guides where full_name = '佐藤 美纪' limit 1),
    420000,
    282000,
    '[schedule][start_time:14:30] 羽田 T3 接机，18:30 银座晚宴，VIP 客户需中英双语接待。'
  ),
  (
    'WIN-20260606-001',
    (select id from public.customers where company_name = 'Tokyo One Day Repeat Tours' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-002' limit 1),
    '富士山河口湖一日游 A 班',
    '2026-06-06',
    'scheduled',
    (select id from public.profiles where email = 'sales@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '多摩500 こ 31-09' limit 1),
    (select id from public.drivers where full_name = '王 建国' limit 1),
    (select id from public.guides where full_name = '中村 翔' limit 1),
    260000,
    176000,
    '[schedule][start_time:08:00] 重复一日游第 1 班，东京站集合，河口湖与忍野八海。'
  ),
  (
    'WIN-20260607-001',
    (select id from public.customers where company_name = 'Tokyo One Day Repeat Tours' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-002' limit 1),
    '富士山河口湖一日游 B 班',
    '2026-06-07',
    'pending_confirmation',
    (select id from public.profiles where email = 'sales@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '横浜200 ね 76-51' limit 1),
    (select id from public.drivers where full_name = '山本 健' limit 1),
    (select id from public.guides where full_name = '中村 翔' limit 1),
    260000,
    176000,
    '[schedule][start_time:08:00] 重复一日游第 2 班，等待最终人数与午餐确认。'
  ),
  (
    'WIN-20260608-001',
    (select id from public.customers where company_name = 'WINS East Asia Partner' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-001' limit 1),
    '东京企业奖励三日 Day 1',
    '2026-06-08',
    'pending_confirmation',
    (select id from public.profiles where email = 'ops.tokyo@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '横浜200 ね 76-51' limit 1),
    (select id from public.drivers where full_name = '山本 健' limit 1),
    (select id from public.guides where full_name = '佐藤 美纪' limit 1),
    780000,
    518000,
    '[schedule][start_time:09:30] 企业奖励团第一天，浅草、上野与欢迎晚宴，需锁定大型巴士。'
  ),
  (
    'WIN-20260612-001',
    (select id from public.customers where company_name = 'Hokkaido & Kanto Education Desk' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-004' limit 1),
    '镰仓研学一日',
    '2026-06-12',
    'draft',
    (select id from public.profiles where email = 'dispatch@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '練馬330 す 45-18' limit 1),
    (select id from public.drivers where full_name = '铃木 启介' limit 1),
    (select id from public.guides where full_name = '林 小雅' limit 1),
    310000,
    208000,
    '[schedule][start_time:08:20] 学生研学团，需确认学校保险名单与随车老师人数。'
  ),
  (
    'WIN-20260620-001',
    (select id from public.customers where company_name = 'Premium FIT Concierge' limit 1),
    (select id from public.quotations where quote_no = 'Q-20260605-005' limit 1),
    '箱根温泉两日定制',
    '2026-06-20',
    'scheduled',
    (select id from public.profiles where email = 'ops.tokyo@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '練馬330 す 45-18' limit 1),
    (select id from public.drivers where full_name = '铃木 启介' limit 1),
    (select id from public.guides where full_name = '松本 优子' limit 1),
    560000,
    386000,
    '[schedule][start_time:10:00] 高端 FIT 两日行程，包含专车、温泉旅馆与美食预约。'
  ),
  (
    'WIN-20260531-001',
    (select id from public.customers where company_name = 'WINS East Asia Partner' limit 1),
    null,
    '成田接机 + 东京半日',
    '2026-05-31',
    'completed',
    (select id from public.profiles where email = 'finance@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '品川300 あ 88-21' limit 1),
    (select id from public.drivers where full_name = '田中 宏' limit 1),
    (select id from public.guides where full_name = '林 小雅' limit 1),
    180000,
    122000,
    '[schedule][start_time:13:10] 已完成接机与市区半日游，等待财务完成最终对账。'
  ),
  (
    'WIN-20260603-001',
    (select id from public.customers where company_name = 'Asia Incentive Circle' limit 1),
    null,
    '浅草文化体验 + 团队晚宴',
    '2026-06-03',
    'completed',
    (select id from public.profiles where email = 'ops.tokyo@winskokusai.com' limit 1),
    (select id from public.vehicles where plate_number = '多摩500 こ 31-09' limit 1),
    (select id from public.drivers where full_name = '王 建国' limit 1),
    (select id from public.guides where full_name = '佐藤 美纪' limit 1),
    360000,
    242000,
    '[schedule][start_time:15:00] 已完成浅草文化体验与晚宴，客户反馈良好。'
  );

insert into public.driver_incidents (
  driver_id,
  order_id,
  occurred_on,
  severity,
  title,
  description,
  status
)
values
  (
    (select id from public.drivers where full_name = '山本 健' limit 1),
    (select id from public.orders where order_no = 'WIN-20260608-001' limit 1),
    '2026-06-08',
    'minor',
    '酒店停车场倒车擦碰',
    '车辆低速倒车时与停车场立柱发生轻微擦碰，无人员受伤，已完成现场确认和内部复盘。',
    'reviewed'
  ),
  (
    (select id from public.drivers where full_name = '田中 宏' limit 1),
    null,
    '2026-05-18',
    'minor',
    '道路碎石造成车身轻微损伤',
    '行驶途中被前车带起碎石击中车身，无驾驶责任，已完成车辆检查。',
    'closed'
  );

insert into public.trip_costs (order_id, category, label, amount_jpy, supplier_name, notes)
values
  ((select id from public.orders where order_no = 'WIN-20260605-001' limit 1), 'vehicle', '品川中巴车辆费用', 142800, 'WINS 自有车辆', '羽田接机与市区晚宴用车。'),
  ((select id from public.orders where order_no = 'WIN-20260605-001' limit 1), 'driver', '田中宏司机服务费', 37800, '田中 宏', '当日基础工时与等待补贴。'),
  ((select id from public.orders where order_no = 'WIN-20260605-001' limit 1), 'guide', '佐藤美纪导游服务费', 42000, '佐藤 美纪', '中英双语 VIP 接待。'),
  ((select id from public.orders where order_no = 'WIN-20260605-001' limit 1), 'misc', '晚宴协调与停车杂费', 59400, 'WINS Operations', '餐厅协调、停车与现场杂费。'),
  ((select id from public.orders where order_no = 'WIN-20260606-001' limit 1), 'vehicle', '合作小巴车辆费用', 88000, '合作小巴 B', '富士山一日游往返。'),
  ((select id from public.orders where order_no = 'WIN-20260606-001' limit 1), 'driver', '王建国司机服务费', 23400, '王 建国', '含早出补贴。'),
  ((select id from public.orders where order_no = 'WIN-20260606-001' limit 1), 'guide', '中村翔导游服务费', 26000, '中村 翔', '中文团队观光。'),
  ((select id from public.orders where order_no = 'WIN-20260606-001' limit 1), 'misc', '停车与门票预留', 38600, 'WINS Operations', '忍野八海停车与杂费预留。'),
  ((select id from public.orders where order_no = 'WIN-20260607-001' limit 1), 'vehicle', '合作大型巴士车辆费用', 88000, '合作大型巴士 A', '重复团第 2 班车辆预留。'),
  ((select id from public.orders where order_no = 'WIN-20260607-001' limit 1), 'driver', '山本健司机服务费', 23400, '山本 健', '大型巴士司机费用。'),
  ((select id from public.orders where order_no = 'WIN-20260607-001' limit 1), 'guide', '中村翔导游服务费', 26000, '中村 翔', '中文导游服务。'),
  ((select id from public.orders where order_no = 'WIN-20260607-001' limit 1), 'misc', '午餐与停车预留', 38600, 'WINS Operations', '待客户确认最终人数。'),
  ((select id from public.orders where order_no = 'WIN-20260608-001' limit 1), 'vehicle', '大型巴士整日费用', 265200, '合作大型巴士 A', '企业奖励团 Day 1。'),
  ((select id from public.orders where order_no = 'WIN-20260608-001' limit 1), 'driver', '山本健司机服务费', 70200, '山本 健', '含晚宴结束后返程。'),
  ((select id from public.orders where order_no = 'WIN-20260608-001' limit 1), 'guide', '佐藤美纪导游服务费', 78000, '佐藤 美纪', '商务团全天服务。'),
  ((select id from public.orders where order_no = 'WIN-20260608-001' limit 1), 'meal', '欢迎晚宴预留成本', 104600, 'Ginza Partner Restaurant', '等待最终菜单确认。'),
  ((select id from public.orders where order_no = 'WIN-20260612-001' limit 1), 'vehicle', 'VIP 商务车费用', 105400, 'WINS 自有车辆', '镰仓研学一日用车。'),
  ((select id from public.orders where order_no = 'WIN-20260612-001' limit 1), 'driver', '铃木启介司机服务费', 27900, '铃木 启介', '市区至镰仓往返。'),
  ((select id from public.orders where order_no = 'WIN-20260612-001' limit 1), 'guide', '林小雅导游服务费', 31000, '林 小雅', '研学讲解服务。'),
  ((select id from public.orders where order_no = 'WIN-20260612-001' limit 1), 'ticket', '研学体验预留成本', 43700, 'Kamakura Workshop', '课程与材料费用预留。'),
  ((select id from public.orders where order_no = 'WIN-20260620-001' limit 1), 'vehicle', '箱根两日专车费用', 190400, 'WINS 自有车辆', '两日专车费用。'),
  ((select id from public.orders where order_no = 'WIN-20260620-001' limit 1), 'driver', '铃木启介司机服务费', 50400, '铃木 启介', '两日工时。'),
  ((select id from public.orders where order_no = 'WIN-20260620-001' limit 1), 'guide', '松本优子导游服务费', 56000, '松本 优子', '高端 FIT 双语服务。'),
  ((select id from public.orders where order_no = 'WIN-20260620-001' limit 1), 'hotel', '温泉旅馆预留成本', 89200, 'Hakone Ryokan Partner', '房间与餐食预留。'),
  ((select id from public.orders where order_no = 'WIN-20260531-001' limit 1), 'vehicle', '成田接机车辆费用', 61200, 'WINS 自有车辆', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260531-001' limit 1), 'driver', '田中宏司机服务费', 16200, '田中 宏', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260531-001' limit 1), 'guide', '林小雅导游服务费', 18000, '林 小雅', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260531-001' limit 1), 'misc', '停车与高速费', 26600, 'WINS Operations', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260603-001' limit 1), 'vehicle', '合作小巴车辆费用', 122400, '合作小巴 B', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260603-001' limit 1), 'driver', '王建国司机服务费', 32400, '王 建国', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260603-001' limit 1), 'guide', '佐藤美纪导游服务费', 36000, '佐藤 美纪', '已完成。'),
  ((select id from public.orders where order_no = 'WIN-20260603-001' limit 1), 'misc', '文化体验与晚宴协调费', 51200, 'WINS Operations', '已完成。');

insert into public.payment_receipts (
  order_id,
  customer_id,
  received_on,
  amount_jpy,
  method,
  status,
  reference_no,
  notes
)
values
  (
    (select id from public.orders where order_no = 'WIN-20260531-001' limit 1),
    (select customer_id from public.orders where order_no = 'WIN-20260531-001' limit 1),
    '2026-06-02',
    180000,
    'bank_transfer',
    'reconciled',
    'RCPT-20260602-001',
    '已完成对账。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260603-001' limit 1),
    (select customer_id from public.orders where order_no = 'WIN-20260603-001' limit 1),
    '2026-06-04',
    360000,
    'bank_transfer',
    'reconciled',
    'RCPT-20260604-001',
    '客户已全额回款。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260605-001' limit 1),
    (select customer_id from public.orders where order_no = 'WIN-20260605-001' limit 1),
    '2026-06-05',
    210000,
    'bank_transfer',
    'received',
    'RCPT-20260605-001',
    '收到 50% 预付款。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260606-001' limit 1),
    (select customer_id from public.orders where order_no = 'WIN-20260606-001' limit 1),
    '2026-06-06',
    130000,
    'bank_transfer',
    'pending',
    'RCPT-20260606-001',
    '客户承诺出团后完成尾款。'
  );

insert into public.supplier_payments (
  order_id,
  supplier_name,
  category,
  paid_on,
  amount_jpy,
  method,
  status,
  reference_no,
  notes
)
values
  (
    (select id from public.orders where order_no = 'WIN-20260531-001' limit 1),
    'WINS 自有车辆',
    'vehicle',
    '2026-06-02',
    61200,
    'bank_transfer',
    'reconciled',
    'PAY-20260602-001',
    '成田接机车辆费用已核销。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260603-001' limit 1),
    '合作小巴 B',
    'vehicle',
    '2026-06-04',
    122400,
    'bank_transfer',
    'paid',
    'PAY-20260604-001',
    '合作车队费用已付款。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260605-001' limit 1),
    'Ginza Partner Restaurant',
    'meal',
    '2026-06-05',
    59400,
    'credit_card',
    'pending',
    'PAY-20260605-001',
    '等待晚宴最终消费确认。'
  ),
  (
    (select id from public.orders where order_no = 'WIN-20260620-001' limit 1),
    'Hakone Ryokan Partner',
    'hotel',
    '2026-06-10',
    89200,
    'bank_transfer',
    'pending',
    'PAY-20260610-001',
    '温泉旅馆订金待支付。'
  );

update public.orders
set
  archived_at = '2026-06-04 09:30:00+09',
  archive_code = 'ARC-WIN-20260531-001',
  archive_summary = '成田接机与东京半日游已完成，客户人数、车辆、成本和回款均已核对。',
  archive_keywords = '成田 接机 东京半日 WINS East Asia Partner 已完成 回款'
where order_no = 'WIN-20260531-001';

update public.orders
set
  archived_at = '2026-06-05 11:20:00+09',
  archive_code = 'ARC-WIN-20260603-001',
  archive_summary = '浅草文化体验与团队晚宴执行结束，客户反馈良好，可作为企业会奖复盘样例。',
  archive_keywords = '浅草 文化体验 团队晚宴 Asia Incentive Circle 企业会奖 已完成'
where order_no = 'WIN-20260603-001';

commit;
