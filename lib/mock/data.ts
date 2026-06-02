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
  { title: "本月订单数", value: "186", change: "+12.4%", tone: "positive" },
  { title: "进行中行程", value: "42", change: "8 个待确认", tone: "warning" },
  { title: "本月营收", value: "¥24,800,000", change: "+18.2%", tone: "positive" },
  { title: "平均毛利率", value: "31.6%", change: "较上月 +2.1%", tone: "positive" },
];

export const orderRows = [
  {
    orderNo: "WIN-250522-01",
    customer: "Tokyo Sakura Travel",
    itinerary: "Narita Pickup + Tokyo 3D2N",
    date: "2026-05-25",
    assignee: "佐藤美纪",
    status: "待确认",
    amount: "¥320,000",
  },
  {
    orderNo: "WIN-250522-02",
    customer: "Hana Group",
    itinerary: "Mt. Fuji Day Tour",
    date: "2026-05-27",
    assignee: "高桥健太",
    status: "已排车",
    amount: "¥180,000",
  },
  {
    orderNo: "WIN-250522-03",
    customer: "Asia Incentive Co.",
    itinerary: "Corporate Arrival Support",
    date: "2026-05-29",
    assignee: "松本优子",
    status: "进行中",
    amount: "¥540,000",
  },
];

export const fleetRows = [
  {
    plateNo: "品川300 あ 88-21",
    type: "中型巴士",
    seats: "28",
    driver: "田中宏",
    inspection: "2026-06-04",
    status: "可调度",
  },
  {
    plateNo: "足立500 さ 12-43",
    type: "商务车",
    seats: "10",
    driver: "伊藤勇人",
    inspection: "2026-05-30",
    status: "保养中",
  },
  {
    plateNo: "横浜200 ね 76-51",
    type: "大型巴士",
    seats: "45",
    driver: "铃木启介",
    inspection: "2026-06-12",
    status: "可调度",
  },
];

export const driverRows = [
  {
    name: "田中宏",
    language: "日语 / 中文",
    contract: "全职",
    dutyHours: "142h",
    safetyScore: "98",
    status: "可派单",
  },
  {
    name: "伊藤勇人",
    language: "日语 / 英语",
    contract: "全职",
    dutyHours: "126h",
    safetyScore: "95",
    status: "休假中",
  },
  {
    name: "铃木启介",
    language: "日语 / 中文",
    contract: "兼职",
    dutyHours: "94h",
    safetyScore: "96",
    status: "可派单",
  },
];

export const guideRows = [
  {
    name: "佐藤美纪",
    specialty: "机场接送 / 商务团",
    language: "中文 / 日语",
    license: "全国通译案内士",
    rating: "4.9",
    status: "已排班",
  },
  {
    name: "松本优子",
    specialty: "关东周游 / 高端定制",
    language: "英语 / 日语",
    license: "区域导游",
    rating: "4.8",
    status: "待命中",
  },
  {
    name: "中村翔",
    specialty: "团队观光",
    language: "中文 / 英语",
    license: "区域导游",
    rating: "4.7",
    status: "休息中",
  },
];

export const customerRows = [
  {
    company: "Tokyo Sakura Travel",
    contact: "陈小姐",
    market: "中国团体",
    orders: "36",
    balance: "¥1,280,000",
    status: "长期合作",
  },
  {
    company: "Hana Group",
    contact: "Yuki Tan",
    market: "东南亚自由行",
    orders: "14",
    balance: "¥260,000",
    status: "跟进中",
  },
  {
    company: "Asia Incentive Co.",
    contact: "Mr. Lim",
    market: "企业会奖",
    orders: "9",
    balance: "¥0",
    status: "已结清",
  },
];

export const pricingRows = [
  {
    quoteNo: "Q-2026-041",
    client: "Tokyo Sakura Travel",
    product: "东京 3 天 2 夜",
    issueDate: "2026-05-20",
    validUntil: "2026-05-31",
    status: "待确认",
  },
  {
    quoteNo: "Q-2026-042",
    client: "Hana Group",
    product: "富士山一日游",
    issueDate: "2026-05-21",
    validUntil: "2026-05-29",
    status: "已发送",
  },
  {
    quoteNo: "Q-2026-043",
    client: "Asia Incentive Co.",
    product: "VIP Arrival Support",
    issueDate: "2026-05-22",
    validUntil: "2026-06-05",
    status: "已接受",
  },
];

export const profitRows = [
  {
    project: "Narita Pickup + Tokyo 3D2N",
    revenue: "¥320,000",
    cost: "¥214,000",
    profit: "¥106,000",
    margin: "33.1%",
    status: "盈利中",
  },
  {
    project: "Mt. Fuji Day Tour",
    revenue: "¥180,000",
    cost: "¥128,000",
    profit: "¥52,000",
    margin: "28.9%",
    status: "正常",
  },
  {
    project: "Corporate Arrival Support",
    revenue: "¥540,000",
    cost: "¥372,000",
    profit: "¥168,000",
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
    created_at: "2026-05-20T09:00:00Z",
    updated_at: "2026-05-25T09:00:00Z",
  },
  {
    id: "mock-ops-1",
    email: "ops.tokyo@winskokusai.com",
    full_name: "佐藤 美纪",
    role: "operations",
    phone: null,
    active: true,
    created_at: "2026-05-19T09:00:00Z",
    updated_at: "2026-05-25T09:00:00Z",
  },
  {
    id: "mock-sales-1",
    email: "sales@winskokusai.com",
    full_name: "陈顾问",
    role: "sales",
    phone: null,
    active: true,
    created_at: "2026-05-18T09:00:00Z",
    updated_at: "2026-05-24T09:00:00Z",
  },
  {
    id: "mock-finance-1",
    email: "finance@winskokusai.com",
    full_name: "高桥 真理",
    role: "finance",
    phone: null,
    active: true,
    created_at: "2026-05-17T09:00:00Z",
    updated_at: "2026-05-23T09:00:00Z",
  },
];

export const monthlyProfit = [
  { label: "Jan", revenue: 12, cost: 8 },
  { label: "Feb", revenue: 15, cost: 10 },
  { label: "Mar", revenue: 18, cost: 12 },
  { label: "Apr", revenue: 16, cost: 11 },
  { label: "May", revenue: 24, cost: 16 },
  { label: "Jun", revenue: 21, cost: 14 },
];

export const operationsSnapshots = [
  {
    title: "今日接机",
    value: "26 班次",
    note: "成田 14 / 羽田 12",
  },
  {
    title: "在途车辆",
    value: "11 台",
    note: "商务车 6 / 巴士 5",
  },
  {
    title: "待处理报价",
    value: "8 份",
    note: "其中 3 份今日到期",
  },
];

export const dashboardTimeline = [
  {
    time: "09:00",
    title: "机场接机订单确认",
    description: "3 个接机订单等待最终人数与航班号确认。",
  },
  {
    time: "11:30",
    title: "车辆保养窗口提醒",
    description: "商务车 足立500 さ 12-43 进入保养周期，建议锁定调度。",
  },
  {
    time: "15:00",
    title: "报价单到期提醒",
    description: "富士山一日游报价单 Q-2026-042 今日需要客户回复。",
  },
];

export const dashboardPipeline = [
  {
    phase: "待确认",
    count: "12",
    detail: "客户确认 / 航班信息补全",
  },
  {
    phase: "已排资源",
    count: "28",
    detail: "车辆与导游已锁定",
  },
  {
    phase: "本周出团",
    count: "41",
    detail: "东京市区与富士山为主",
  },
];

export const orderSummary = [
  { title: "待确认订单", value: "12", detail: "优先补齐航班、人数与接送时间" },
  { title: "已排车订单", value: "28", detail: "车辆已锁定，待司机最终确认" },
  { title: "本周出团", value: "41", detail: "东京市区与富士山线路最集中" },
  { title: "待回款订单", value: "9", detail: "建议财务和销售同步跟进账期" },
];

export const fleetSummary = [
  { title: "自有车辆", value: "18 台", detail: "中巴、商务车和大型巴士混合配置" },
  { title: "合作车队", value: "11 家", detail: "高峰期补位资源充足" },
  { title: "本周保养预警", value: "3 台", detail: "建议提前锁定替补车辆" },
  { title: "今日可调度", value: "14 台", detail: "适合东京市区与机场接送" },
];

export const driverSummary = [
  { title: "可派单司机", value: "22 人", detail: "其中 9 人可执行中文团接待" },
  { title: "休假中", value: "4 人", detail: "周末高峰排班需提前调整" },
  { title: "本月平均工时", value: "128h", detail: "接近旺季标准负载" },
  { title: "安全均分", value: "96.3", detail: "整体维持高水平服务稳定性" },
];

export const pricingSummary = [
  { title: "待确认报价", value: "8 份", detail: "其中 3 份今天到期" },
  { title: "本周新建", value: "17 份", detail: "企业团与富士山产品最多" },
  { title: "平均成交率", value: "42%", detail: "比上周提升 6 个百分点" },
  { title: "预计签单额", value: "¥4.8M", detail: "需重点跟进高价值客户" },
];

export const customerSummary = [
  { title: "活跃客户", value: "34 家", detail: "本月有订单或报价往来的客户" },
  { title: "重点跟进", value: "7 家", detail: "高潜力或账期敏感客户" },
  { title: "未结余额", value: "¥1.54M", detail: "需财务与销售联动跟进" },
  { title: "本月新增", value: "5 家", detail: "以东南亚与企业团客户为主" },
];

export const guideSummary = [
  { title: "可排班导游", value: "19 人", detail: "其中 8 人可服务中文市场" },
  { title: "高分导游", value: "11 人", detail: "评分 4.8 以上，可优先用于高端单" },
  { title: "本周已排班", value: "14 人", detail: "东京市区与富士山线路占多数" },
  { title: "待更新资质", value: "2 人", detail: "适合后续接入证照提醒功能" },
];

export const profitSummary = [
  { title: "本月总营收", value: "¥24.8M", detail: "较上月增长 18.2%" },
  { title: "本月总成本", value: "¥16.1M", detail: "车辆与人力为主要成本项" },
  { title: "本月毛利润", value: "¥8.7M", detail: "利润结构整体健康" },
  { title: "平均毛利率", value: "31.6%", detail: "高于上月 2.1 个百分点" },
];

export const settingsSummary = [
  { title: "启用角色", value: "5 类", detail: "管理员、运营、销售、财务、调度" },
  { title: "通知规则", value: "12 条", detail: "覆盖订单、保养、报价与账期提醒" },
  { title: "待配置项", value: "6 项", detail: "适合后续逐步接入真实系统参数" },
  { title: "部署目标", value: "Vercel", detail: "未来绑定 admin.winskokusai.com" },
];
