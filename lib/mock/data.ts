import type { Profile } from "@/lib/types/domain";

export type NavItem = {
  title: string;
  href: string;
};

export type Stat = {
  title: string;
  value: string;
  change: string;
  tone: "positive" | "warning" | "neutral";
  href?: string;
};

export type TableRow = Record<string, string>;

export const navigation: NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "订单管理", href: "/orders" },
  { title: "车辆管理", href: "/fleet" },
  { title: "司机管理", href: "/drivers" },
  { title: "导游管理", href: "/guides" },
  { title: "客户信息", href: "/customers" },
  { title: "报价单管理", href: "/pricing" },
  { title: "成本与利润", href: "/profit" },
  { title: "系统设置", href: "/settings" },
];

export const dashboardStats: Stat[] = [
  { title: "本月订单数", value: "8", change: "本周 5 单", tone: "positive", href: "/orders" },
  { title: "进行中行程", value: "1", change: "3 个待确认", tone: "warning", href: "/orders?status=待确认" },
  { title: "本月营收", value: "¥3,130,000", change: "已回款 ¥1.12M", tone: "positive", href: "/finance" },
  { title: "平均毛利率", value: "32.3%", change: "成本已拆分", tone: "positive", href: "/profit" },
];

export const orderRows = [
  {
    orderNo: "WIN-20260605-001",
    customer: "Asia Incentive Circle",
    itinerary: "VIP 羽田接机 + 银座晚宴",
    date: "2026-06-05",
    assignee: "佐藤 美纪",
    status: "进行中",
    amount: "¥420,000",
    notes: "[schedule][start_time:14:30] 羽田 T3 接机，18:30 银座晚宴，VIP 客户需中英双语接待。",
  },
  {
    orderNo: "WIN-20260606-001",
    customer: "Tokyo One Day Repeat Tours",
    itinerary: "富士山河口湖一日游 A 班",
    date: "2026-06-06",
    assignee: "陈顾问",
    status: "已排车",
    amount: "¥260,000",
    notes: "[schedule][start_time:08:00] 重复一日游第 1 班，东京站集合，河口湖与忍野八海。",
  },
  {
    orderNo: "WIN-20260607-001",
    customer: "Tokyo One Day Repeat Tours",
    itinerary: "富士山河口湖一日游 B 班",
    date: "2026-06-07",
    assignee: "陈顾问",
    status: "待确认",
    amount: "¥260,000",
    notes: "[schedule][start_time:08:00] 重复一日游第 2 班，等待最终人数与午餐确认。",
  },
  {
    orderNo: "WIN-20260608-001",
    customer: "WINS East Asia Partner",
    itinerary: "东京企业奖励三日 Day 1",
    date: "2026-06-08",
    assignee: "佐藤 美纪",
    status: "待确认",
    amount: "¥780,000",
    notes: "[schedule][start_time:09:30] 企业奖励团第一天，浅草、上野与欢迎晚宴，需锁定大型巴士。",
  },
  {
    orderNo: "WIN-20260612-001",
    customer: "Hokkaido & Kanto Education Desk",
    itinerary: "镰仓研学一日",
    date: "2026-06-12",
    assignee: "张调度",
    status: "草稿",
    amount: "¥310,000",
    notes: "[schedule][start_time:08:20] 学生研学团，需确认学校保险名单与随车老师人数。",
  },
  {
    orderNo: "WIN-20260620-001",
    customer: "Premium FIT Concierge",
    itinerary: "箱根温泉两日定制",
    date: "2026-06-20",
    assignee: "松本 优子",
    status: "已排车",
    amount: "¥560,000",
    notes: "[schedule][start_time:10:00] 高端 FIT 两日行程，包含专车、温泉旅馆与美食预约。",
  },
  {
    orderNo: "WIN-20260531-001",
    customer: "WINS East Asia Partner",
    itinerary: "成田接机 + 东京半日",
    date: "2026-05-31",
    assignee: "高桥 真理",
    status: "已完成",
    amount: "¥180,000",
    archivedAt: "2026-06-04T09:30:00Z",
    archiveCode: "ARC-WIN-20260531-001",
    archiveSummary: "成田接机与东京半日游已完成，客户人数、车辆、成本和回款均已核对。",
    archiveKeywords: "成田 接机 东京半日 WINS East Asia Partner 已完成 回款",
    notes: "[schedule][start_time:13:10] 已完成接机与市区半日游，等待财务完成最终对账。",
  },
  {
    orderNo: "WIN-20260603-001",
    customer: "Asia Incentive Circle",
    itinerary: "浅草文化体验 + 团队晚宴",
    date: "2026-06-03",
    assignee: "佐藤 美纪",
    status: "已完成",
    amount: "¥360,000",
    archivedAt: "2026-06-05T11:20:00Z",
    archiveCode: "ARC-WIN-20260603-001",
    archiveSummary: "浅草文化体验与团队晚宴执行结束，客户反馈良好，可作为企业会奖复盘样例。",
    archiveKeywords: "浅草 文化体验 团队晚宴 Asia Incentive Circle 企业会奖 已完成",
    notes: "[schedule][start_time:15:00] 已完成浅草文化体验与晚宴，客户反馈良好。",
  },
];

export const fleetRows = [
  {
    plateNo: "品川300 あ 88-21",
    type: "中型巴士",
    seats: "28",
    driver: "田中 宏",
    inspection: "2026-06-08",
    status: "已派出",
  },
  {
    plateNo: "足立500 さ 12-43",
    type: "商务车",
    seats: "10",
    driver: "伊藤 勇人",
    inspection: "2026-06-06",
    status: "保养中",
  },
  {
    plateNo: "練馬330 す 45-18",
    type: "VIP 商务车",
    seats: "6",
    driver: "铃木 启介",
    inspection: "2026-06-20",
    status: "可调度",
  },
  {
    plateNo: "横浜200 ね 76-51",
    type: "大型巴士",
    seats: "45",
    driver: "山本 健",
    inspection: "2026-06-12",
    status: "可调度",
  },
  {
    plateNo: "多摩500 こ 31-09",
    type: "小型巴士",
    seats: "18",
    driver: "王 建国",
    inspection: "2026-06-18",
    status: "已派出",
  },
];

export const driverRows = [
  {
    name: "田中 宏",
    language: "日语 / 中文",
    contract: "全职",
    dutyHours: "142h",
    safetyScore: "98",
    status: "已排班",
  },
  {
    name: "伊藤 勇人",
    language: "日语 / 英语",
    contract: "全职",
    dutyHours: "126h",
    safetyScore: "95",
    status: "休假中",
  },
  {
    name: "铃木 启介",
    language: "日语 / 中文",
    contract: "兼职",
    dutyHours: "94h",
    safetyScore: "96",
    status: "可派单",
  },
  {
    name: "山本 健",
    language: "日语 / 中文 / 英语",
    contract: "合作",
    dutyHours: "82h",
    safetyScore: "93",
    status: "已排班",
  },
  {
    name: "王 建国",
    language: "中文 / 日语",
    contract: "合作",
    dutyHours: "76h",
    safetyScore: "97",
    status: "可派单",
  },
];

export const guideRows = [
  {
    name: "佐藤 美纪",
    specialty: "机场接送 / 商务团",
    language: "中文 / 日语",
    license: "全国通译案内士",
    rating: "4.9",
    status: "已排班",
  },
  {
    name: "松本 优子",
    specialty: "高端定制 / 关东周游",
    language: "英语 / 日语",
    license: "区域导游",
    rating: "4.8",
    status: "待命中",
  },
  {
    name: "中村 翔",
    specialty: "团队观光 / 富士山一日游",
    language: "中文 / 英语",
    license: "区域导游",
    rating: "4.7",
    status: "已排班",
  },
  {
    name: "林 小雅",
    specialty: "教育研学 / 浅草文化体验",
    language: "中文 / 日语",
    license: "全国通译案内士",
    rating: "4.9",
    status: "待命中",
  },
  {
    name: "高桥 真由",
    specialty: "VIP 接待 / 美食线路",
    language: "英语 / 日语",
    license: "区域导游",
    rating: "4.8",
    status: "休息中",
  },
];

export const customerRows = [
  {
    company: "WINS East Asia Partner",
    contact: "王经理",
    market: "中国华东企业奖励游",
    orders: "2",
    balance: "¥780,000",
    status: "长期合作",
  },
  {
    company: "Tokyo One Day Repeat Tours",
    contact: "李主管",
    market: "中文散拼一日游",
    orders: "2",
    balance: "¥520,000",
    status: "长期合作",
  },
  {
    company: "Hokkaido & Kanto Education Desk",
    contact: "Ms. Chen",
    market: "教育研学",
    orders: "1",
    balance: "¥310,000",
    status: "跟进中",
  },
  {
    company: "Asia Incentive Circle",
    contact: "Mr. Lim",
    market: "企业会奖",
    orders: "2",
    balance: "¥420,000",
    status: "长期合作",
  },
  {
    company: "Premium FIT Concierge",
    contact: "高桥顾问",
    market: "高端定制 FIT",
    orders: "1",
    balance: "¥560,000",
    status: "跟进中",
  },
];

export const pricingRows = [
  {
    quoteNo: "Q-20260605-001",
    client: "WINS East Asia Partner",
    product: "东京企业奖励三日",
    issueDate: "2026-06-05",
    validUntil: "2026-06-07",
    status: "待确认",
  },
  {
    quoteNo: "Q-20260605-002",
    client: "Tokyo One Day Repeat Tours",
    product: "富士山河口湖每日重复一日游",
    issueDate: "2026-06-05",
    validUntil: "2026-06-09",
    status: "已发送",
  },
  {
    quoteNo: "Q-20260605-003",
    client: "Asia Incentive Circle",
    product: "VIP 羽田接机 + 银座晚宴",
    issueDate: "2026-06-04",
    validUntil: "2026-06-05",
    status: "已接受",
  },
  {
    quoteNo: "Q-20260605-004",
    client: "Hokkaido & Kanto Education Desk",
    product: "镰仓研学一日",
    issueDate: "2026-06-05",
    validUntil: "2026-06-10",
    status: "待确认",
  },
  {
    quoteNo: "Q-20260605-005",
    client: "Premium FIT Concierge",
    product: "箱根温泉两日定制",
    issueDate: "2026-06-05",
    validUntil: "2026-06-14",
    status: "已发送",
  },
];

export const profitRows = [
  {
    project: "VIP 羽田接机 + 银座晚宴",
    revenue: "¥420,000",
    cost: "¥282,000",
    profit: "¥138,000",
    margin: "32.9%",
    status: "盈利中",
  },
  {
    project: "富士山河口湖一日游 A 班",
    revenue: "¥260,000",
    cost: "¥176,000",
    profit: "¥84,000",
    margin: "32.3%",
    status: "正常",
  },
  {
    project: "东京企业奖励三日 Day 1",
    revenue: "¥780,000",
    cost: "¥518,000",
    profit: "¥262,000",
    margin: "33.6%",
    status: "待确认",
  },
  {
    project: "箱根温泉两日定制",
    revenue: "¥560,000",
    cost: "¥386,000",
    profit: "¥174,000",
    margin: "31.1%",
    status: "盈利中",
  },
];

export const systemSettings = [
  {
    title: "公司信息",
    description: "统一维护 WINS International Travel Group 的公司名称、东京办公室地址与结算主体信息。",
  },
  {
    title: "权限与角色",
    description: "预留运营、财务、调度、销售与管理员角色，后续可接 Supabase Auth + RLS。",
  },
  {
    title: "通知规则",
    description: "订单状态更新、车辆保养到期、报价单有效期提醒等消息规则。",
  },
];

export const teamProfiles: Profile[] = [
  {
    id: "mock-admin-1",
    email: "admin@winskokusai.com",
    full_name: "WINS Admin",
    role: "admin",
    phone: null,
    active: true,
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-05T09:00:00Z",
  },
  {
    id: "mock-ops-1",
    email: "ops.tokyo@winskokusai.com",
    full_name: "佐藤 美纪",
    role: "operations",
    phone: null,
    active: true,
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-05T09:00:00Z",
  },
  {
    id: "mock-sales-1",
    email: "sales@winskokusai.com",
    full_name: "陈顾问",
    role: "sales",
    phone: null,
    active: true,
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-05T09:00:00Z",
  },
  {
    id: "mock-finance-1",
    email: "finance@winskokusai.com",
    full_name: "高桥 真理",
    role: "finance",
    phone: null,
    active: true,
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-05T09:00:00Z",
  },
  {
    id: "mock-dispatch-1",
    email: "dispatch@winskokusai.com",
    full_name: "张调度",
    role: "dispatch",
    phone: null,
    active: true,
    created_at: "2026-06-01T09:00:00Z",
    updated_at: "2026-06-05T09:00:00Z",
  },
];

export const monthlyProfit = [
  { label: "Jan", revenue: 8.6, cost: 5.9 },
  { label: "Feb", revenue: 9.8, cost: 6.6 },
  { label: "Mar", revenue: 11.4, cost: 7.8 },
  { label: "Apr", revenue: 12.1, cost: 8.4 },
  { label: "May", revenue: 14.8, cost: 10.1 },
  { label: "Jun", revenue: 3.13, cost: 2.12 },
];

export const operationsSnapshots = [
  {
    title: "今日接机",
    value: "2 班次",
    note: "羽田 VIP / 成田半日回访",
  },
  {
    title: "在途车辆",
    value: "2 台",
    note: "中巴 1 / 小巴 1",
  },
  {
    title: "待处理报价",
    value: "4 份",
    note: "其中 1 份今日到期",
  },
];

export const dashboardTimeline = [
  {
    time: "08:00",
    title: "富士山重复一日游 A 班出发",
    description: "车辆、司机与导游已锁定，需跟进集合点到客情况。",
  },
  {
    time: "14:30",
    title: "羽田 VIP 接机开始",
    description: "客户航班预计 14:30 抵达，晚宴预约需要 18:00 前最终确认。",
  },
  {
    time: "17:00",
    title: "企业奖励团报价到期",
    description: "Q-20260605-001 需要销售确认客户是否进入排车阶段。",
  },
];

export const dashboardPipeline = [
  {
    phase: "待确认",
    count: "3",
    detail: "客户确认 / 人数与餐食补全",
  },
  {
    phase: "已排资源",
    count: "2",
    detail: "车辆、司机与导游已锁定",
  },
  {
    phase: "本周出团",
    count: "5",
    detail: "富士山、羽田接机与企业奖励团",
  },
];

export const orderSummary = [
  { title: "待确认订单", value: "3", detail: "优先补齐人数、餐食与集合时间" },
  { title: "已排车订单", value: "2", detail: "车辆已锁定，待司机最终确认" },
  { title: "本周出团", value: "5", detail: "富士山重复团与企业奖励团最集中" },
  { title: "待回款订单", value: "5", detail: "建议财务和销售同步跟进账期" },
];

export const fleetSummary = [
  { title: "自有车辆", value: "3 台", detail: "中巴、商务车和 VIP 商务车" },
  { title: "合作车辆", value: "2 台", detail: "大型巴士与小巴补位资源" },
  { title: "本周保养预警", value: "2 台", detail: "足立商务车与品川中巴需重点关注" },
  { title: "今日可调度", value: "2 台", detail: "适合东京市区与临时接送" },
];

export const driverSummary = [
  { title: "可派单司机", value: "2 人", detail: "其中 2 人可执行中文团接待" },
  { title: "已派单", value: "2 人", detail: "今日集中在机场接送与富士山线路" },
  { title: "本月平均工时", value: "104h", detail: "仍有余量，可承接新增一日游" },
  { title: "安全均分", value: "95.8", detail: "已接入安全评分记录演示" },
];

export const pricingSummary = [
  { title: "待确认报价", value: "2 份", detail: "企业奖励团与研学团需销售跟进" },
  { title: "本周新建", value: "5 份", detail: "重复一日游与高端定制需求上升" },
  { title: "平均成交率", value: "40%", detail: "5 份报价中 2 份已进入订单阶段" },
  { title: "预计签单额", value: "¥2.33M", detail: "重点跟进企业奖励与箱根定制" },
];

export const customerSummary = [
  { title: "活跃客户", value: "5 家", detail: "本月均有订单或报价往来" },
  { title: "重点跟进", value: "2 家", detail: "研学与 FIT 客户仍在报价阶段" },
  { title: "未结余额", value: "¥2.59M", detail: "需财务与销售联动跟进" },
  { title: "本月新增", value: "1 家", detail: "新增高端 FIT 定制客户" },
];

export const guideSummary = [
  { title: "可排班导游", value: "2 人", detail: "可临时补位中文或日语线路" },
  { title: "高分导游", value: "4 人", detail: "评分 4.8 以上，可优先用于高端单" },
  { title: "本周已排班", value: "2 人", detail: "机场接送与富士山线路为主" },
  { title: "待更新资质", value: "0 人", detail: "当前演示数据资质均完整" },
];

export const profitSummary = [
  { title: "本月总营收", value: "¥3.13M", detail: "覆盖 6 月已建演示订单" },
  { title: "本月总成本", value: "¥2.12M", detail: "车辆、人力和餐食为主要成本项" },
  { title: "本月毛利润", value: "¥1.01M", detail: "利润结构整体健康" },
  { title: "平均毛利率", value: "32.3%", detail: "适合测试利润页与 Dashboard 卡片" },
];

export const settingsSummary = [
  { title: "启用角色", value: "5 类", detail: "管理员、运营、销售、财务、调度" },
  { title: "通知规则", value: "12 条", detail: "覆盖订单、保养、报价与账期提醒" },
  { title: "演示数据版本", value: "2026-06", detail: "已替换旧 5 月 mock 数据" },
  { title: "部署目标", value: "Vercel", detail: "未来绑定 admin.winskokusai.com" },
];
