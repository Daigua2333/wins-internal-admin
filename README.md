# WINS Internal Admin

WINS International Travel Group 的公司内部管理后台项目。

这个仓库当前处于“高保真可交互原型 + 真实开发底座已就位”的阶段：

- 前端界面已经可以本地运行并浏览
- 所有核心模块都已经搭好页面结构
- 高频业务页已经具备 mock 交互能力
- Supabase / PostgreSQL / Auth 的第一版数据与权限设计已补齐
- 还没有正式连接真实数据库

## 技术栈

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Auth
- PostgreSQL
- Vercel

## 项目定位

这是 `WINS International Travel Group` 的内部运营后台，不是面向游客的官网。

## Latest Update

- `客户管理` 已升级为真实工作台，支持新增客户、编辑联系人与账期、切换合作状态、记录跟进留痕。
- `客户管理` 现已补充历史订单时间线与报价单关联视图，可在客户页内直接回看往来业务。
- `客户管理` 现已支持从历史订单时间线直接跳转到订单工作台并自动定位对应订单。
- `报价单管理` 已升级为真实工作台，支持新增报价、维护有效期、状态、金额结构和客户关联。
- `报价单管理` 现已支持一键转订单，并自动带入客户、标题、服务日期和金额，避免重复录入。
- `导游管理` 已升级为真实工作台，支持新增导游、维护专长与资质、记录服务表现并直接排班到订单。
- `成本与利润` 已升级为真实分析工作台，可按订单查看营收、总成本、毛利率和成本构成。
- `回款与对账` 已升级为真实财务工作台，支持登记订单回款、查看未回款余额、客户对账摘要和供应商付款台账。
- 全局 UI 已完成一轮产品化升级，统一了背景、卡片层级、导航质感、Header、表格和工具栏的颜色与交互反馈。
- `系统设置` 已升级为真实配置中心，支持维护公司信息、通知规则和运营参数。
- `系统设置` 中的运营参数现已接回订单与排班流程，影响默认出发时间提示、提前提醒天数展示、冲突严格模式和自动改状态行为。
- `订单管理` 与 `运营日历` 现已接入主动提醒中心，集中显示近期待出团、报价即将到期和车辆点检到期提醒。
- `运营日历` 页面现已支持直接创建订单。
- `运营日历` 页面现已支持对当天订单进行状态流转和基础信息修改。
- `订单管理` 与 `运营日历` 已补充抽屉详情、确认弹层、提交中反馈和统一空状态，交互体验更接近正式后台产品。
- `车辆 / 司机 / 导游 / 客户 / 报价 / 财务` 工作台已接入提交中反馈、危险操作确认和统一空状态，整体交互层开始成体系。
- 后台已新增固定位置 `toast` 成功/失败反馈，以及统一 `loading skeleton`，切页和保存结果的感知更完整。
- `订单创建` 与 `财务录入` 表单已升级为统一的分组式编辑界面，开始形成稳定的表单设计语言。
- 后台现已补上统一 `Dialog` 基础组件，危险操作确认和高频建单入口开始收口成同一套弹层体系。
- `订单管理` 与 `运营日历` 现已统一使用弹层式建单入口，不再被整块长表单打断主工作台视角。
- `车辆 / 客户 / 报价` 的新增入口现也已升级为弹层式工作台，主页面第一屏更专注于筛选、详情和持续维护。
- `财务` 页的 `回款登记 / 供应商付款登记` 现也已升级为弹层式工作台，首页更聚焦应收、对账和现金流视角。
- `司机 / 导游` 的新增入口现也已升级为弹层式工作台，资源管理页第一屏更专注于排班、服务记录和风险判断。

目标场景：

- 东京入境旅游订单管理
- 车辆与调度管理
- 司机与导游资源管理
- 客户与报价单协同
- 成本与利润分析
- 内部权限与系统设置

未来部署目标：

- 域名：`admin.winskokusai.com`
- 平台：`Vercel`

正式上线手册：

- [docs/deploy-vercel.md](/Users/jiaxinli/Desktop/公司管理系统/docs/deploy-vercel.md)

## 当前完成内容

### 1. 页面模块

已完成以下页面骨架与视觉统一：

- 登录页
- Dashboard 首页
- 订单管理
- 车辆管理
- 司机管理
- 导游管理
- 客户信息
- 报价单管理
- 成本与利润
- 回款与对账
- 系统设置

页面文件位置：

- [app/(auth)/login/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/page.tsx)
- [app/(dashboard)/dashboard/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/dashboard/page.tsx)
- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/guides/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/guides/page.tsx)
- [app/(dashboard)/customers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/customers/page.tsx)
- [app/(dashboard)/pricing/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/pricing/page.tsx)
- [app/(dashboard)/profit/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/profit/page.tsx)
- [app/(dashboard)/finance/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/finance/page.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)

### 2. UI 与布局系统

已完成统一的后台 UI 框架：

- 左侧 sidebar 导航
- 顶部 header
- Dashboard Shell
- 统一卡片、徽标、统计卡、分区容器
- 响应式布局
- 移动端抽屉式导航
- 统一的侧边抽屉、确认弹层、提交中按钮和空状态组件
- 固定位置 toast 提示与后台 loading skeleton
- 统一表单分组与统计条

核心组件位置：

- [components/layout/dashboard-shell.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/dashboard-shell.tsx)
- [components/layout/sidebar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/sidebar.tsx)
- [components/layout/header.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/header.tsx)
- [components/layout/page-intro.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/page-intro.tsx)
- [components/ui/section-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/section-card.tsx)
- [components/ui/stat-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/stat-card.tsx)
- [components/ui/badge.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/badge.tsx)
- [components/ui/summary-grid.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/summary-grid.tsx)
- [components/ui/module-toolbar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/module-toolbar.tsx)
- [components/ui/slide-over.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/slide-over.tsx)
- [components/ui/confirm-action-button.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/confirm-action-button.tsx)
- [components/ui/dialog.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/dialog.tsx)
- [components/ui/pending-submit-button.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/pending-submit-button.tsx)
- [components/ui/empty-state-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/empty-state-card.tsx)
- [components/ui/dashboard-toast.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/dashboard-toast.tsx)
- [components/ui/skeleton.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/skeleton.tsx)
- [app/(dashboard)/loading.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/loading.tsx)
- [components/ui/form-section.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/form-section.tsx)
- [components/ui/stat-strip.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/stat-strip.tsx)
- [components/orders/order-create-dialog.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/orders/order-create-dialog.tsx)

### 3. Mock 交互能力

当前已经不是纯静态页面，以下模块具备基础 mock 交互：

- 订单管理
- 车辆管理
- 司机管理
- 导游管理
- 客户信息
- 报价单管理
- 成本与利润
- 系统设置

已实现的交互包括：

- 搜索过滤
- 状态筛选
- 列表行选中
- 右侧详情面板
- 利润分析联动展示
- 设置项切换与 mock 编辑面板

相关组件：

- [components/ui/data-table.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/data-table.tsx)
- [components/ui/mock-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-workbench.tsx)
- [components/ui/mock-profit-lab.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-profit-lab.tsx)
- [components/ui/mock-settings-studio.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-settings-studio.tsx)

### 4. Mock 数据层

当前所有页面仍然使用 mock data，统一集中在：

- [lib/mock/data.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/mock/data.ts)

同时，以下页面已经接入了“真实数据 loader + mock fallback”结构：

- Dashboard
- 订单管理
- 车辆管理
- 客户信息
- 司机管理
- 导游管理
- 报价单管理
- 成本与利润

对应 loader：

- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)

这意味着：

- 当前可用于演示页面与交互
- 当前不依赖真实 Supabase 数据
- 高频核心页面已经具备切换到真实 Supabase 查询的入口
- Dashboard 的统计卡、最近订单和利润趋势也已接入真实聚合入口
- 客户页现可直接读取客户关联订单与报价摘要，形成更完整的 CRM 视图
- 后续可逐步替换为完整 repository 查询

## 当前登录行为

当前登录页为了方便本地预览，使用的是开发态直达后台方案，而不是正式认证。

当前状态：

- 未配置 Supabase 时，登录页仍可直接进入后台预览
- 配置 Supabase 环境变量后，登录页会自动切换为真实登录模式
- middleware 已切换为 Supabase SSR 会话刷新结构
- 设置页已提供 Supabase 状态卡与连接健康检查
- 之前的 mock 登录接口仍保留，方便兼容过渡

相关文件：

- [app/(auth)/login/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/page.tsx)
- [app/(auth)/login/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/actions.ts)
- [app/(dashboard)/settings/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/actions.ts)
- [middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/middleware.ts)
- [app/api/mock-login/route.ts](/Users/jiaxinli/Desktop/公司管理系统/app/api/mock-login/route.ts)
- [lib/supabase/config.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/config.ts)
- [lib/supabase/middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/middleware.ts)

## Supabase / PostgreSQL 开发底座

当前仓库已经补上真实开发需要的第一版数据结构、类型和权限约定。

### 数据库 schema

- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
- [supabase/seed.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/seed.sql)

已设计的核心表：

- `profiles`
- `customers`
- `vehicles`
- `drivers`
- `guides`
- `quotations`
- `orders`
- `trip_costs`
- `payment_receipts`
- `supplier_payments`

### 领域类型与数据库类型

- [lib/types/domain.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/types/domain.ts)
- [lib/types/database.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/types/database.ts)

### 角色与权限常量

- [lib/auth/roles.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/roles.ts)
- [lib/auth/navigation.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/navigation.ts)
- [lib/auth/session.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/session.ts)

当前预留角色：

- `admin`
- `operations`
- `sales`
- `finance`
- `dispatch`

当前已经具备的权限能力：

- 当前用户 profile 自动建档
- 当前角色读取
- `hasPermission()` 权限判断入口
- 左侧导航按角色隐藏
- 设置页按权限访问控制
- 系统设置页内可直接调整 `profiles.role`
- 系统设置页内可直接启用或停用内部账号

### Repository 契约

- [lib/repositories/contracts.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/contracts.ts)
- [lib/repositories/index.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/index.ts)
- [lib/repositories/factory.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/factory.ts)
- [lib/repositories/supabase.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/supabase.ts)

当前已经包含：

- repository 契约接口
- Supabase repository 实现
- repository factory
- loader -> repository -> Supabase 的基础调用链
- 当前用户 profile 自动建档与角色读取基础

### Typed Supabase Client

- [lib/supabase/client.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/client.ts)
- [lib/supabase/server.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/server.ts)
- [lib/supabase/config.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/config.ts)
- [lib/supabase/middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/middleware.ts)

这两个文件已经接入 `Database` 类型，后续写查询时可以直接获得类型提示。
同时当前已经补上：

- Supabase 环境变量读取与启用判断
- 登录 server action
- SSR middleware 会话刷新与受保护路由重定向

## 文档说明

当前仓库已经包含两份核心说明文档：

- [docs/supabase-architecture.md](/Users/jiaxinli/Desktop/公司管理系统/docs/supabase-architecture.md)
- [docs/data-mapping.md](/Users/jiaxinli/Desktop/公司管理系统/docs/data-mapping.md)
- [docs/setup-supabase.md](/Users/jiaxinli/Desktop/公司管理系统/docs/setup-supabase.md)
- [CHANGELOG.md](/Users/jiaxinli/Desktop/公司管理系统/CHANGELOG.md)

用途：

- `supabase-architecture.md`
  - 说明认证策略、角色设计、表结构关系、RLS 方向
- `data-mapping.md`
  - 说明前端模块与未来数据库表之间的映射关系
- `setup-supabase.md`
  - 说明如何把当前项目切换到真实 Supabase 模式
- `CHANGELOG.md`
  - 记录阶段性开发与改动时间线

## 目录结构

```text
app/
  (auth)/login/              登录页
  (auth)/login/actions.ts    Supabase 登录 server action
  (dashboard)/               后台模块页面
  api/mock-login/            旧 mock 登录接口保留
components/
  layout/                    整体后台布局
  ui/                        通用 UI 与交互型 mock 组件
  charts/                    图表组件
docs/
  supabase-architecture.md   Supabase 架构说明
  data-mapping.md            页面与数据映射说明
lib/
  auth/                      角色与权限常量
  loaders/                   页面级数据加载与 fallback
  mock/                      Mock 数据
  repositories/              repository 契约、工厂与 Supabase 实现
  supabase/config.ts         环境变量与启用判断
  supabase/middleware.ts     SSR 会话刷新与受保护路由逻辑
  supabase/                  typed Supabase client/server
  types/                     领域模型与数据库类型
  utils/                     通用工具
supabase/
  schema.sql                 第一版数据库结构
  seed.sql                   示例测试数据
middleware.ts                当前开发态放行逻辑
```

## 本地运行

安装依赖：

```bash
/opt/homebrew/bin/npm install
```

启动开发服务器：

```bash
/opt/homebrew/bin/npm run dev -- --hostname 127.0.0.1 --port 3000
```

如果本地热更新后出现样式丢失、页面只剩纯文字、`_next` 资源 404/500，优先使用：

```bash
/opt/homebrew/bin/npm run dev:reset -- --hostname 127.0.0.1 --port 3000
```

原因是本项目开发态使用 `.next-dev`，生产构建使用 `.next`，已经避免 `dev` 与 `build` 互相覆盖；`dev:reset` 则用于在本地缓存已经损坏时快速重建开发产物。

浏览器访问：

```text
http://127.0.0.1:3000/login
http://127.0.0.1:3000/dashboard
```

本地验证：

```bash
/opt/homebrew/bin/npm run verify
```

如果只想在验证前清理生产构建缓存：

```bash
/opt/homebrew/bin/npm run build:clean
```

## 当前已知状态

### 已完成

- 后台整体视觉风格统一
- 各业务模块页面已可浏览
- 大部分核心模块有 mock 交互
- 本地开发服务器可运行
- Supabase schema / 类型 / 权限方向已落地
- Supabase Auth 登录骨架已接入
- Dashboard 已接入首批真实聚合查询入口
- 订单 / 车辆 / 客户 / 司机 / 导游 / 报价 / 利润 已接入真实 loader 结构
- repository 层已开始承接真实 Supabase 查询
- `profiles` 自动建档与当前角色读取已接入
- 左侧导航和设置页已接入第一版角色权限控制
- 订单 / 车辆 / 客户 / 司机 / 导游 / 报价 / 利润页面已接入页面级访问控制
- 订单、客户、报价、利润等模块已能按角色切换“可创建”与“只读模式”
- ESLint flat config、导航 typed routes 和 Supabase 会话建档相关类型问题已修正
- 系统设置页已新增“角色与账号管理”工作台
- 停用账号后会被后台布局统一拦截，不能继续访问后台
- 订单模块已接入第一版真实新建能力，可通过后台表单写入 `orders` 表
- 订单模块已接入详情、基础编辑与状态流转工作台
- 订单模块已接入排车、指派司机/导游与基础成本录入
- 订单模块已接入资源冲突提醒与成本明细删除
- 订单模块已接入待审批队列与七日排班视图，方便运营快速审批并查看近期服务分布
- 订单模块已接入成本明细编辑与订单推进时间线，便于持续维护与复盘
- 订单模块已接入调度硬限制，同日车辆、司机、导游冲突时后端会直接阻止保存
- 车辆模块已接入真实新增车辆、状态切换与基础资料维护，可同步影响订单排车资源池
- 司机模块已切换到真实工作台，并新增司机排班日程、公平排班视图和每日线路记录
- 司机模块已额外落地真实司机台账维护，并新增安全评分记录功能
- 司机模块已支持在司机页直接安排司机到订单，并在同日撞单时由后端拦截
- 已隔离开发态与生产构建输出目录，减少每次验证后 UI 崩溃的风险

### 尚未完成

- Supabase 项目环境变量实际配置
- 真实数据库读写
- RLS 细粒度写权限
- 开发/测试 seed 数据
- 生产部署配置

## 下一步建议

建议按以下顺序继续：

1. 在 Supabase 控制台执行 [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
2. 配置 `.env.local`
3. 创建后台管理员账户并验证真实登录
4. 在 Supabase 重新执行最新版 [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)，启用管理员更新其他用户角色的策略
5. 继续补司机排班写入、车辆保养记录和更完整的操作日志
6. 将 Dashboard 的聚合逻辑继续从 loader 下沉到更清晰的 analytics/repository 层
7. 继续把编辑弹窗、提交按钮、批量操作进一步接到 `hasPermission`
8. 在 Vercel 配置环境变量并绑定 `admin.winskokusai.com`
## Latest Update

- `订单创建` 现已支持重复规则，可按每天、每周或每月批量生成未来订单，适合公司高频的一日游业务。
- 新增 `统一运营日历` 模块，可按日期追溯订单、客户、负责人、车辆、司机、导游、营收、成本与备注。
- `车辆管理` 现已支持删除车辆，删除后订单中的 `vehicle_id` 会自动置空。
- `司机管理` 现已支持删除司机，删除后订单中的 `driver_id` 会自动置空。
- 如果要测试真实删除，请在 Supabase 重新执行最新版 [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)，让 `role_delete_vehicles` 和 `role_delete_drivers` 生效。
- 后台已新增统一交互层，包括 `确认弹层 / 提交中按钮 / 抽屉详情 / 空状态 / toast / loading skeleton`，高频操作体验已明显产品化。
- 订单创建与财务录入已切到统一的 `FormSection + StatStrip` 表单语言，减少大块散表单的阅读负担。
- 车辆、司机、导游、客户、报价页的新增表单与详情摘要也已开始切到同一套分组表单和统计条风格，后台 UI 正在收口为一致的设计系统。
- `订单管理 / 运营日历 / 财务` 的详情编辑区也已开始切到同一套分组表单语言，基础编辑、调度、录成本和回款/付款维护的交互层级更统一。
- `客户 / 报价 / 车辆` 已新增统一的侧边详情抽屉入口，可以在不离开当前工作台的情况下快速查看摘要、关系信息和维护说明。
- `司机 / 导游 / 财务` 也已接入统一的侧边详情抽屉入口，便于在当前工作台里快速判断人员可用性与财务流水背景。
