# Changelog

本文件按阶段记录 `WINS Internal Admin` 的重要改动，方便项目交接、回顾和后续持续追加。

## 2026-06-05

### 登录与注册入口优化

- 登录页升级为正式的左右分栏产品入口，强化 WINS 内部运营后台品牌感、业务说明和安全状态提示。
- 新增登录 / 注册双模式切换，注册表单支持姓名、企业邮箱、内部注册口令、密码和确认密码。
- 注册 action 已补充姓名写入 Supabase user metadata、密码长度校验、确认密码校验和内部注册口令校验。
- 新增 `WINS_SIGNUP_INVITE_CODE` 环境变量，未配置时注册入口保持关闭，避免公开域名被外部人员随意创建账号。

## 2026-06-04

### Vercel 生产部署准备

- 将 `next` 与 `eslint-config-next` 升级到 `16.2.7`，避开 Vercel 构建日志中提示的 `15.3.2` 安全风险版本，并让 `npm audit --omit=dev` 回到 `0 vulnerabilities`。
- 生产构建脚本显式使用 `next build --webpack`，避免 Next 16 默认 Turbopack 在受限构建环境中触发端口绑定类异常。
- 将 ESLint 配置迁移到 `eslint-config-next/core-web-vitals` flat config 直接导入方式，去掉 `FlatCompat` 兼容桥导致的循环引用问题。
- 暂时关闭 `react-hooks/set-state-in-effect` 规则，保留当前工作台选中态同步逻辑，后续可单独做 React 状态模型重构。
- 通过 `overrides` 固定 `postcss@8.5.15`，让 Next 内部依赖也使用安全补丁版。
- 将 Next 请求拦截入口从旧的 `middleware.ts` 文件约定迁移到 `proxy.ts`，消除 Next 16 的文件命名迁移提醒。
- 在 `package.json` 中声明 Node.js `22.x`，避免 Vercel 使用旧 Node 版本构建 Next 16，同时避免 `>=20.9.0` 在未来自动跨主版本升级。
- 从 `tsconfig.json` 的 `include` 中移除 `.next-dev` 开发缓存类型目录，避免本地重复缓存文件影响 `build:clean`。
- 新增 `NEXT_PUBLIC_SITE_URL` 配置，用于生产环境生成 Supabase 邮件确认回跳地址。
- 登录注册 action 已改为优先使用 `NEXT_PUBLIC_SITE_URL`，未配置时再回退到本地站点地址。
- Vercel 上线手册已补充生产站点 URL 说明，方便后续绑定 `admin.winskokusai.com`。

## 2026-05-25

### 正式上线手册

- 新增 [docs/deploy-vercel.md](/Users/jiaxinli/Desktop/公司管理系统/docs/deploy-vercel.md)，整理 `Vercel + Supabase + Squarespace` 的正式上线步骤。
- 文档中已明确区分生产 Supabase、Vercel 环境变量、自定义域名绑定和 Supabase Auth URL 配置。

### 全局 Dialog 与建单弹层统一

- 新增统一 `Dialog` 组件，作为后台 modal / dialog 的基础层，和现有 `SlideOver` 共同组成完整的弹层体系。
- `ConfirmActionButton` 已切换为基于 `Dialog` 的确认交互，不再各处手写危险操作确认框。
- 新增 `OrderCreateDialog`，把订单创建表单封装成可复用的弹层入口。
- `运营日历` 的建单入口已升级为弹层式工作台，支持在不离开日历视角的情况下直接完成一次性建单和重复建单。
- `订单管理` 的建单入口现也升级为弹层式工作台，和日历页保持同一套交互语言，减少整页被长表单打断的问题。
- `车辆管理`、`客户管理`、`报价单管理` 的新增入口现已升级为弹层式工作台，主工作区第一屏更专注于筛选、持续维护和详情处理。
- `回款与对账` 的 `回款登记` 与 `供应商付款登记` 现也升级为弹层式工作台，首页第一屏更聚焦应收、对账与现金流台账。
- `司机管理` 与 `导游管理` 的新增入口现也升级为弹层式工作台，资源管理页第一屏更专注于排班、服务记录与风险判断。

### 订单与日历交互层升级

- 新增统一的 `SlideOver`、`ConfirmActionButton`、`PendingSubmitButton` 与 `EmptyStateCard` 组件，给高频业务页补全更正式的交互层。
- `订单管理` 现已支持侧边抽屉详情，可在不离开工作台的情况下查看当前订单的冲突提醒和推进节点。
- `订单管理` 的状态取消、成本删除等危险动作现已接入确认弹层，减少误操作。
- `订单管理` 的基础资料、调度、成本录入和成本编辑现已显示提交中反馈，不再是无响应提交。
- `运营日历` 的订单编辑、调度、成本录入、完成情况记录和异常记录现已统一接入提交中反馈。
- `运营日历` 的重点日期、当日订单、成本明细和运营留痕补上统一空状态，页面信息密度更高时也更易读。
- `车辆 / 司机 / 导游` 工作台现已补充删除确认、保存中反馈和统一空状态，避免误删与“假提交”体验。
- `客户 / 报价 / 财务` 工作台现已补充保存中反馈和统一空状态，报价转订单、回款登记、付款登记等高频动作更明确。
- 新增固定位置 `DashboardToast`，将车辆、司机、导游、客户、报价、财务等模块的成功/失败反馈从页面内提示条升级为更统一的 toast。
- 新增后台统一 `loading.tsx` 与 `Skeleton` 组件，让切换页面和首次载入时不再出现突兀的空白等待。
- 新增 `FormSection` 与 `StatStrip` 组件，并率先落到订单创建与财务录入表单，开始统一后台的表单分组、节奏和信息层级。

### 运营日历接入订单管理

- 在 `Operations Calendar` 页面接入订单创建入口
- 支持在日历页内直接新建订单，并默认带入当天日期
- 支持在日历页内直接修改订单状态、客户、负责人、服务日期、预计营收和备注
- 订单创建与修改后会留在日历页内，不再强制跳回订单页

### 客户模块真实维护能力

- 删除客户页中的 mock 工作台，统一替换为真实可维护工作台
- 新增客户创建表单，支持录入公司、联系人、市场标签、账期、授信额度与备注
- 新增客户状态切换动作，支持长期合作、跟进中、已结清、已停用
- 新增客户基础资料编辑动作，可直接维护联系人、账期、授信额度和备注
- 新增客户跟进记录动作，会把销售与运营跟进沉淀到客户档案
- 新增客户历史订单时间线，可按客户回看最近订单、服务日期、状态与订单营收
- 新增客户报价单关联视图，可直接查看同客户的报价状态、服务日期、有效期与报价金额
- 新增客户历史订单到订单工作台的直达跳转，进入订单页后会自动定位对应订单
- 为 `customers` 表补充写入与更新策略，允许管理员、运营、销售维护客户资料

### 报价单模块真实维护能力

- 删除报价页中的 mock 工作台，统一替换为真实可维护工作台
- 新增报价创建表单，支持录入客户、标题、服务日期、有效期、状态、报价金额、预计成本与备注
- 新增报价状态切换动作，支持待确认、已发送、已接受、已过期、已拒绝
- 新增报价基础资料编辑动作，可直接维护客户关联、有效期、金额结构和备注
- 新增报价转订单动作，可从已维护的报价直接生成订单，并自动带入客户、标题、服务日期、报价金额与预计成本
- 新增报价已转单回显，如果该报价已经生成过订单，会直接显示对应订单号并支持打开订单详情
- 为运营角色补充 `quotations.write` 权限
- 为 `quotations` 表补充写入与更新策略，允许管理员、运营、销售维护报价资料

### 导游模块真实维护能力

- 删除导游页中的 mock 工作台，统一替换为真实可维护工作台
- 新增导游创建表单，支持录入姓名、语言、专长、资质、评分、状态与备注
- 新增导游状态切换动作，支持待命中、已排班、休息中、停用
- 新增导游基础资料编辑动作，可直接维护专长、语言、资质、评分和备注
- 新增导游服务记录动作，用于沉淀带团表现、客户反馈和特殊处理说明
- 新增导游排班能力，可从导游页直接把导游安排到具体订单
- 新增导游排班冲突拦截，同一天已有带团安排时后端会直接阻止保存
- 新增导游删除动作，支持从工作台直接移除导游资料
- 为运营与调度角色补充 `guides.write` 权限
- 为 `guides` 表补充写入、更新与删除策略，允许管理员、运营、调度维护导游资料

### 利润模块真实分析能力

- 删除利润页中的 mock 分析实验室，统一替换为真实利润工作台
- 新增利润记录 loader，按订单聚合订单号、客户、服务日期、营收、总成本、毛利与毛利率
- 新增成本构成视图，可直接查看车辆、司机、导游、酒店、餐食、门票和其他成本占比
- 利润趋势图现直接复用真实订单收入与总成本数据
- 利润页右侧详情区现会联动显示选中订单的利润快照和成本拆解

### 回款与对账模块真实维护能力

- 新增独立的 `回款与对账` 页面，集中查看订单回款、未回款余额和客户对账摘要
- 新增回款登记动作，可按订单登记到账日期、金额、方式、状态、流水号与备注
- 新增回款更新动作，可直接修改已登记流水的状态和金额
- 新增应收账款 loader，按订单聚合营收、已回款、未回款和账龄标签
- 新增客户对账摘要 loader，按客户聚合累计营收、已回款、未回款和最近回款日期
- 新增 `payment_receipts` 表以及对应索引、更新时间 trigger 和 RLS 策略
- 新增供应商付款登记与更新动作，可按订单记录车辆、司机、导游、酒店等付款
- 新增供应商付款 loader，用于集中查看近期付款台账、付款方式、状态和流水号
- 新增 `supplier_payments` 表以及对应索引、更新时间 trigger 和 RLS 策略
- 财务摘要现已加入本月已付款和本月净现金流视角
- 为运营角色补充 `finance.read` 权限，为财务角色补充 `finance.read / finance.write` 权限

### 全局 UI 产品化升级

- 统一重做全局背景、颜色变量、输入框聚焦态、按钮过渡和滚动条样式
- 升级 Header，新增更完整的玻璃质感、时间信息、CTA 阴影和更清晰的层级
- 升级 Sidebar，强化选中态、品牌区和底部运营状态卡的视觉表现
- 升级 Page Intro、Section Card、Summary Grid、Badge、DataTable、Module Toolbar
- 为表格、筛选按钮、卡片和顶部操作区补充更明显的 hover / selected / read-only 反馈

### 系统设置真实配置中心

- 删除设置页中的 mock 配置编辑器，统一替换为真实配置中心
- 新增 `app_settings` 配置表，用于承载公司信息、通知规则和运营参数
- 新增公司信息维护表单，可保存公司名称、品牌简称、东京办公室地址、结算主体和支持联系方式
- 新增通知规则维护表单，可保存订单、车辆、报价、授信提醒开关和提前提醒天数
- 新增运营参数维护表单，可保存默认货币、目标毛利率、一日游默认出发时间和调度策略
- 为 `app_settings` 表补充管理员读取、写入与更新策略
- 订单创建与运营日历的新建订单表单现会显示默认出发时间、提前提醒天数和目标毛利率提示
- 订单调度、司机排班、导游排班现已接入 `conflictStrictMode` 与 `autoMarkScheduledOnAssignment` 配置
- 新增统一的运营提醒 loader，把近期待出团、报价即将到期和车辆点检到期聚合为主动提醒
- `订单管理` 与 `运营日历` 现已显示提醒中心，可直接跳转到对应订单、报价和车辆页面继续处理

### Next.js 开发稳定性修复

- 确认 UI 频繁崩溃的根因是 `next dev` 与 `next build` 共享默认 `.next` 输出目录
- 将开发态输出目录切换为 `.next-dev`，生产构建继续使用 `.next`
- 避免在本地预览进行中跑 `build` 时覆盖开发态 CSS、manifest 和 chunk
- 新增 `dev:reset`、`build:clean`、`verify` 脚本
- 将 `.next-dev` 加入忽略，并把新的稳定运行方式写入 README

相关文件：

- [next.config.ts](/Users/jiaxinli/Desktop/公司管理系统/next.config.ts)
- [package.json](/Users/jiaxinli/Desktop/公司管理系统/package.json)
- [.gitignore](/Users/jiaxinli/Desktop/公司管理系统/.gitignore)
- [README.md](/Users/jiaxinli/Desktop/公司管理系统/README.md)

### 订单模块第一版真实写入

- 在订单页新增“新建订单”表单
- 支持选择客户、负责人、服务日期、状态、预计营收与内部备注
- 新增 `createOrder` server action，创建成功后会回流到订单列表、Dashboard 与利润模块
- 新增订单创建所需的客户/负责人选项 loader，并保留 mock fallback
- 为 `orders` 表补充角色写入与更新策略，允许管理员、运营、调度写订单
- 将订单列表升级为专用工作台，支持搜索、筛选和选中订单
- 新增订单基础信息更新与状态流转 action
- 现在可以在同一页完成订单查看、改状态、改客户、改负责人、改日期、改预计营收与改备注
- 新增车辆、司机、导游资源选项 loader
- 新增订单调度保存 action，可回写 `vehicle_id / driver_id / guide_id`
- 新增基础成本录入 action，可写入 `trip_costs` 并同步回写订单总成本
- 为 `trip_costs` 表补充角色写入与更新策略
- 新增同日车辆 / 司机 / 导游资源冲突提醒
- 新增当前订单成本明细列表
- 新增误录成本删除动作，并同步重算订单总成本
- 为 `trip_costs` 表补充删除策略
- 新增待审批队列，把草稿和待确认订单集中到一个版面里处理
- 新增七日排班视图，按服务日期聚合近期订单，支持从日历卡片直接切回详情
- 在订单工作台摘要区加入待审批、七日排班、未补服务日期三个运营指标
- 新增成本明细编辑动作，可直接修改类别、金额、供应商和备注，并自动重算订单总成本
- 新增订单推进时间线，从审批、调度、成本到执行状态统一串联展示
- 为排车与人员指派新增后端冲突校验，同日车辆、司机、导游撞单时会直接阻止保存
- 新增调度冲突专用错误反馈，保存失败时会明确指出被哪类资源、哪张订单占用

### 车辆模块真实维护能力

- 将车辆页从通用 mock 工作台升级为专用的车辆运营工作台
- 新增车辆创建表单，支持录入车牌、车辆名称、车型、座位数、归属、点检日期、状态与备注
- 新增车辆状态切换动作，支持可调度、保养中、已派出、停用四种状态
- 新增车辆基础资料编辑动作，可直接维护主数据并同步影响订单排车资源池
- 为运营角色补充 `vehicles.write` 权限
- 为 `vehicles` 表补充写入与更新策略，允许管理员、运营、调度维护车辆

相关文件：

- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/fleet/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/actions.ts)
- [components/fleet/vehicle-operations-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/fleet/vehicle-operations-workbench.tsx)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [lib/auth/roles.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/roles.ts)
- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)

### 司机模块排班与线路记录视图

- 删除司机页中的 mock 只读工作台，统一替换为真实可维护工作台
- 新增司机排班日程视图，按日期展示未来几天已分配的司机线路
- 新增公平排班视图，按本周排班天数、线路数和月工时帮助运营更均衡地分配任务
- 新增司机每日线路记录面板，可按司机回看每天跑过的线路和对应订单
- 真实模式下会优先读取 `orders.driver_id + service_date` 生成排班视图，没有真实数据时自动回退到 mock 排班数据
- 新增司机创建、状态切换和基础资料编辑能力
- 新增安全评分记录动作，会更新当前评分并把记录写入司机备注历史
- 为运营与调度角色补充 `drivers.write` 权限
- 为 `drivers` 表补充写入与更新策略，允许管理员、运营、调度维护司机资料与安全评分
- 新增司机页直接排班能力，可从司机视角把司机安排到具体订单
- 新增司机排班冲突拦截，同一天已有线路时后端会直接阻止保存

相关文件：

- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/drivers/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/actions.ts)
- [components/drivers/driver-operations-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/drivers/driver-operations-workbench.tsx)
- [components/drivers/driver-schedule-studio.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/drivers/driver-schedule-studio.tsx)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [lib/auth/roles.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/roles.ts)
- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)

相关文件：

- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/orders/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/actions.ts)
- [components/orders/order-create-panel.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/orders/order-create-panel.tsx)
- [components/orders/order-operations-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/orders/order-operations-workbench.tsx)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)

### 设置页角色与账号管理

- 在系统设置页新增“角色与账号管理”工作台
- 管理员现在可以在后台查看 `profiles` 列表并直接分配角色
- 管理员现在也可以直接启用或停用账号
- 为设置页新增角色更新反馈提示
- 新增 `profiles` loader、repository 和 mock fallback，确保未接真实数据时也能预览结构

相关文件：

- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [app/(dashboard)/settings/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/actions.ts)
- [app/(dashboard)/layout.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/layout.tsx)
- [components/ui/account-disabled-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/account-disabled-card.tsx)
- [components/ui/role-management-panel.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/role-management-panel.tsx)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [lib/repositories/contracts.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/contracts.ts)
- [lib/repositories/supabase.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/supabase.ts)
- [lib/repositories/factory.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/factory.ts)
- [lib/mock/data.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/mock/data.ts)
- [lib/auth/session.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/session.ts)

### Supabase 管理员角色更新策略

- 为 `profiles` 新增管理员更新其他账号角色所需的 RLS 策略
- 新增 `current_app_role()` 辅助函数
- 将 policy 段落改为可重复执行，更适合后续在 Supabase 里重新跑 schema

相关文件：

- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)

### 页面级权限与只读模式增强

- 为订单、车辆、司机、导游、客户、报价、利润页面补充页面级访问校验
- 无读取权限时直接显示统一的 `AccessDeniedCard`
- 为工作台和模块工具栏新增“只读模式”表现
- 订单、客户、报价、利润等模块现在会根据角色显示可创建或只读状态
- 利润页的敏感指标展示逻辑已预留为可按权限收口

相关文件：

- [components/ui/mock-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-workbench.tsx)
- [components/ui/module-toolbar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/module-toolbar.tsx)
- [components/ui/mock-profit-lab.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-profit-lab.tsx)
- [components/ui/access-denied-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/access-denied-card.tsx)
- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/guides/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/guides/page.tsx)
- [app/(dashboard)/customers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/customers/page.tsx)
- [app/(dashboard)/pricing/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/pricing/page.tsx)
- [app/(dashboard)/profit/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/profit/page.tsx)

### ESLint ESM 导入修正

- 修正 `eslint.config.mjs` 中 `eslint-config-next` 的 ESM 导入路径
- 切换到兼容 ESLint 9 flat config 的 `FlatCompat` 写法
- 排除 `.next` 生成目录，避免 lint 被构建产物干扰
- 让本地 `npm run lint` 能继续往前执行，而不是卡在模块解析阶段

相关文件：

- [eslint.config.mjs](/Users/jiaxinli/Desktop/公司管理系统/eslint.config.mjs)

### typedRoutes 与 Supabase 类型收口

- 为导航配置补充 `Route` 类型，消除 Sidebar 在生产构建时的路由类型报错
- 为 Supabase SSR cookie 回调补充明确参数类型
- 调整 `ensureCurrentUserProfile` 的 profile upsert 写法，避免登录建档时卡在类型推导
- 补充数据库类型元信息，使手写的 Supabase `Database` 类型更接近真实生成结构
- 本轮改动后，`npm run lint` 与 `npm run build` 已本地通过

相关文件：

- [lib/auth/navigation.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/navigation.ts)
- [lib/auth/session.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/session.ts)
- [lib/types/database.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/types/database.ts)
- [lib/supabase/middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/middleware.ts)
- [lib/supabase/server.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/server.ts)

## 2026-05-22

### 项目初始化

- 初始化 `Next.js + TypeScript + Tailwind CSS` 项目骨架
- 建立 `app router` 目录结构
- 补齐 `package.json`、`tsconfig.json`、`tailwind.config.ts`、`postcss.config.js`
- 建立 `globals.css`、基础布局和首页跳转逻辑
- 预留 `Supabase` client/server 文件

相关文件：

- [package.json](/Users/jiaxinli/Desktop/公司管理系统/package.json)
- [tsconfig.json](/Users/jiaxinli/Desktop/公司管理系统/tsconfig.json)
- [tailwind.config.ts](/Users/jiaxinli/Desktop/公司管理系统/tailwind.config.ts)
- [postcss.config.js](/Users/jiaxinli/Desktop/公司管理系统/postcss.config.js)
- [app/layout.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/layout.tsx)
- [app/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/page.tsx)
- [app/globals.css](/Users/jiaxinli/Desktop/公司管理系统/app/globals.css)
- [lib/supabase/client.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/client.ts)
- [lib/supabase/server.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/server.ts)

### 第一版后台原型

- 创建登录页
- 创建 Dashboard 首页
- 创建订单、车辆、司机、导游、客户、报价、利润、设置模块页面
- 建立统一 mock 数据文件
- 创建基础组件：`Badge`、`StatCard`、`SectionCard`、`DataTable`

相关文件：

- [app/(auth)/login/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/page.tsx)
- [app/(dashboard)/dashboard/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/dashboard/page.tsx)
- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/guides/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/guides/page.tsx)
- [app/(dashboard)/customers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/customers/page.tsx)
- [app/(dashboard)/pricing/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/pricing/page.tsx)
- [app/(dashboard)/profit/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/profit/page.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [components/ui/badge.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/badge.tsx)
- [components/ui/stat-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/stat-card.tsx)
- [components/ui/section-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/section-card.tsx)
- [components/ui/data-table.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/data-table.tsx)
- [lib/mock/data.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/mock/data.ts)

### 后台视觉升级

- 建立统一后台框架：sidebar、header、dashboard shell
- 新增移动端抽屉式导航
- 升级 Dashboard 的运营驾驶舱、订单漏斗、提醒区和协同建议区
- 优化全局背景、渐变和卡片质感

相关文件：

- [components/layout/dashboard-shell.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/dashboard-shell.tsx)
- [components/layout/sidebar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/sidebar.tsx)
- [components/layout/header.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/header.tsx)
- [components/layout/page-intro.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/page-intro.tsx)
- [components/charts/profit-overview.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/charts/profit-overview.tsx)
- [app/(dashboard)/layout.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/layout.tsx)
- [app/(dashboard)/dashboard/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/dashboard/page.tsx)
- [app/globals.css](/Users/jiaxinli/Desktop/公司管理系统/app/globals.css)

### 模块统一升级

- 为订单、车辆、司机、导游、客户、报价、利润、设置页面补充摘要卡与模块工具栏
- 新增 `SummaryGrid` 与 `ModuleToolbar`
- 各业务页整体风格统一到同一套后台视觉语言

相关文件：

- [components/ui/summary-grid.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/summary-grid.tsx)
- [components/ui/module-toolbar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/module-toolbar.tsx)
- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/guides/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/guides/page.tsx)
- [app/(dashboard)/customers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/customers/page.tsx)
- [app/(dashboard)/pricing/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/pricing/page.tsx)
- [app/(dashboard)/profit/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/profit/page.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)

### 本地运行与预览

- 通过 Homebrew 安装正式版 `node` / `npm`
- 安装项目依赖
- 成功启动本地 Next.js 开发服务器
- 将开发环境登录改为可直接进入后台的预览模式
- 修正 mock 登录相关重定向问题

相关文件：

- [app/api/mock-login/route.ts](/Users/jiaxinli/Desktop/公司管理系统/app/api/mock-login/route.ts)
- [middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/middleware.ts)
- [app/(auth)/login/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/page.tsx)

### Mock 交互增强

- 让高频业务页从静态列表升级为可交互工作台
- 支持 mock 搜索、筛选、选中行和详情联动
- 新增利润联动分析面板
- 新增设置项切换与 mock 配置面板
- 将 `DataTable` 改为客户端组件以支持点击交互

相关文件：

- [components/ui/data-table.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/data-table.tsx)
- [components/ui/mock-workbench.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-workbench.tsx)
- [components/ui/mock-profit-lab.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-profit-lab.tsx)
- [components/ui/mock-settings-studio.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/mock-settings-studio.tsx)

### Supabase 开发底座

- 设计第一版数据库 schema
- 补齐领域模型与数据库类型
- 定义角色与权限常量
- 建立 repository 契约层
- 将 Supabase client/server 改为 typed 版本
- 新增 Supabase 架构文档与数据映射文档

相关文件：

- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
- [lib/types/domain.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/types/domain.ts)
- [lib/types/database.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/types/database.ts)
- [lib/auth/roles.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/roles.ts)
- [lib/repositories/contracts.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/contracts.ts)
- [lib/repositories/index.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/index.ts)
- [lib/supabase/client.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/client.ts)
- [lib/supabase/server.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/server.ts)
- [docs/supabase-architecture.md](/Users/jiaxinli/Desktop/公司管理系统/docs/supabase-architecture.md)
- [docs/data-mapping.md](/Users/jiaxinli/Desktop/公司管理系统/docs/data-mapping.md)

### Supabase Auth 骨架接入

- 新增 Supabase 环境变量解析与启用判断
- 登录页支持“未配置时预览 / 已配置时真实登录”双模式
- 新增 `login` server action
- middleware 切换为 Supabase SSR 会话刷新结构
- `.env.example` 改为使用 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

相关文件：

- [app/(auth)/login/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/actions.ts)
- [app/(auth)/login/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/page.tsx)
- [lib/supabase/config.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/config.ts)
- [lib/supabase/middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/middleware.ts)
- [lib/supabase/client.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/client.ts)
- [lib/supabase/server.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/supabase/server.ts)
- [middleware.ts](/Users/jiaxinli/Desktop/公司管理系统/middleware.ts)
- [.env.example](/Users/jiaxinli/Desktop/公司管理系统/.env.example)

### 首批真实数据 loader 接入

- 为 `orders / vehicles / customers` 新增服务端数据 loader
- 未配置 Supabase 时自动回退到 `mock data`
- 已配置 Supabase 时可直接切换为真实查询路径
- 三个页面已改为通过 loader 获取列表数据

相关文件：

- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [app/(dashboard)/orders/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/orders/page.tsx)
- [app/(dashboard)/fleet/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/fleet/page.tsx)
- [app/(dashboard)/customers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/customers/page.tsx)

### 扩展剩余高频模块的真实 loader 入口

- 为 `drivers / guides / quotations / profit` 新增真实 loader 路径
- 利润页明细区已支持从真实订单利润字段映射
- 所有这些模块在未配置 Supabase 时仍自动回退到 mock data

相关文件：

- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)
- [app/(dashboard)/drivers/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/drivers/page.tsx)
- [app/(dashboard)/guides/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/guides/page.tsx)
- [app/(dashboard)/pricing/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/pricing/page.tsx)
- [app/(dashboard)/profit/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/profit/page.tsx)

### Repository 分层落地

- 将数据访问从单纯 loader 进一步整理到 repository 层
- 新增 Supabase repository 实现
- 新增 repository factory
- loader 现在通过 repository 获取业务数据，再映射到 UI 行数据

相关文件：

- [lib/repositories/contracts.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/contracts.ts)
- [lib/repositories/factory.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/factory.ts)
- [lib/repositories/supabase.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/supabase.ts)
- [lib/repositories/index.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/repositories/index.ts)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)

### Dashboard 真实聚合入口

- 为 Dashboard 新增统计卡聚合逻辑
- 为运营快照增加真实数据入口
- 为利润趋势图增加真实数据序列入口
- 为最近订单区改为通过 loader 获取
- 保留未配置 Supabase 时的 mock fallback

相关文件：

- [app/(dashboard)/dashboard/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/dashboard/page.tsx)
- [components/charts/profit-overview.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/charts/profit-overview.tsx)
- [lib/loaders/admin.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/loaders/admin.ts)

### Supabase 接入可视化与说明补齐

- 新增 Supabase 接入说明文档
- 在设置页加入 Supabase 状态卡
- 可以直接在后台界面确认当前是否仍为预览模式

相关文件：

- [docs/setup-supabase.md](/Users/jiaxinli/Desktop/公司管理系统/docs/setup-supabase.md)
- [components/ui/supabase-status-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/supabase-status-card.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [README.md](/Users/jiaxinli/Desktop/公司管理系统/README.md)

### Seed 数据与接入引导增强

- 新增可直接执行的 `supabase/seed.sql`
- 为设置页新增“真实接入下一步”提示卡
- 更新 setup 文档，使接通 Supabase 后能快速看到真实后台效果

相关文件：

- [supabase/seed.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/seed.sql)
- [components/ui/setup-next-steps-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/setup-next-steps-card.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [docs/setup-supabase.md](/Users/jiaxinli/Desktop/公司管理系统/docs/setup-supabase.md)
- [README.md](/Users/jiaxinli/Desktop/公司管理系统/README.md)

### 连接健康检查与退出登录动作

- 在设置页新增 Supabase 连接健康检查卡
- 新增退出登录 server action
- 接通真实环境后可以直接在界面里确认当前会话是否已经生效

相关文件：

- [components/ui/supabase-health-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/supabase-health-card.tsx)
- [app/(dashboard)/settings/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/actions.ts)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [docs/setup-supabase.md](/Users/jiaxinli/Desktop/公司管理系统/docs/setup-supabase.md)

### Profiles 自动建档与角色链基础

- 新增当前用户会话与 profile 读取工具
- 登录/注册成功后自动尝试补齐 `profiles` 档案
- 设置页新增“当前角色”卡片
- `schema.sql` 新增 `auth.users -> profiles` 自动建档 trigger
- `profiles` 新增自助插入/更新策略

相关文件：

- [lib/auth/session.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/session.ts)
- [components/ui/current-role-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/current-role-card.tsx)
- [app/(auth)/login/actions.ts](/Users/jiaxinli/Desktop/公司管理系统/app/(auth)/login/actions.ts)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)
- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
- [docs/setup-supabase.md](/Users/jiaxinli/Desktop/公司管理系统/docs/setup-supabase.md)

### 第一版页面级权限控制

- 新增导航权限配置
- Dashboard 布局按角色隐藏左侧菜单
- Header 显示真实登录邮箱与角色标签
- 设置页加入访问受限提示
- 为后续页面级按钮权限控制打好基础

相关文件：

- [lib/auth/navigation.ts](/Users/jiaxinli/Desktop/公司管理系统/lib/auth/navigation.ts)
- [components/ui/access-denied-card.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/access-denied-card.tsx)
- [components/layout/sidebar.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/sidebar.tsx)
- [components/layout/header.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/header.tsx)
- [components/layout/dashboard-shell.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/layout/dashboard-shell.tsx)
- [app/(dashboard)/layout.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/layout.tsx)
- [app/(dashboard)/settings/page.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/settings/page.tsx)

### 文档更新

- 将 `README.md` 升级为项目总览 + 当前状态 + 运行方式 + 接入路线的交接文档
- 新增 `CHANGELOG.md` 记录阶段性改动

相关文件：

- [README.md](/Users/jiaxinli/Desktop/公司管理系统/README.md)
- [CHANGELOG.md](/Users/jiaxinli/Desktop/公司管理系统/CHANGELOG.md)
## 2026-05-26

- 订单创建支持 `单次 / 每天 / 每周 / 每月` 的重复生成，并可设置重复次数，适配高频一日游订单批量建单。
- 新增 `运营日历` 页面，按 `service_date` 聚合订单并提供月视图、日期详情追溯和状态/关键词筛选。
- 运营日历支持查看当日的客户、负责人、车辆、司机、导游、营收、成本、毛利和内部备注。
- 新增 `车辆删除` 功能，已接入车辆详情维护区和 server action。
- 新增 `司机删除` 功能，已接入司机详情维护区和 server action。
- 为 `vehicles` 与 `drivers` 补充 Supabase RLS 删除策略：
  - `role_delete_vehicles`
  - `role_delete_drivers`

## 2026-06-01

- 新增统一交互层组件：
  - `PendingSubmitButton`
  - `ConfirmActionButton`
  - `SlideOver`
  - `EmptyStateCard`
- `订单管理` 与 `运营日历` 已接入抽屉详情、确认弹层、提交中反馈和更完整的空状态。
- `车辆 / 司机 / 导游 / 客户 / 报价 / 财务` 已统一接入提交中反馈、危险操作确认和空状态组件。
- 新增全局 `toast` 成功/失败反馈与后台统一 `loading skeleton`：
  - [components/ui/dashboard-toast.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/dashboard-toast.tsx)
  - [components/ui/skeleton.tsx](/Users/jiaxinli/Desktop/公司管理系统/components/ui/skeleton.tsx)
  - [app/(dashboard)/loading.tsx](/Users/jiaxinli/Desktop/公司管理系统/app/(dashboard)/loading.tsx)
- 新增统一表单系统组件：
  - `FormSection`
  - `StatStrip`
- `订单创建` 与 `财务录入` 已切换到统一的分组表单语言。
- `车辆 / 司机 / 导游 / 客户 / 报价` 的新增表单与详情摘要已继续切换到统一的 `FormSection + StatStrip` 风格，后台视觉语言进一步收口。
- `订单管理 / 运营日历 / 财务` 的详情编辑区已进一步切换到统一分组表单语言：
  - 订单详情中的基础编辑、调度和成本录入已重组
  - 日历中的当天订单管理区已重组
  - 财务中的回款详情与供应商付款详情已重组
- `客户 / 报价 / 车辆` 已新增统一的 `SlideOver` 详情入口：
  - 客户抽屉支持快速查看合作摘要、最近跟进和最近订单
  - 报价抽屉支持快速查看金额结构、转单关系和备注
  - 车辆抽屉支持快速查看状态、点检信息和维护说明
- `司机 / 导游 / 财务` 也已新增统一的 `SlideOver` 详情入口：
  - 司机抽屉支持快速查看工时、安全评分和最近评分记录
  - 导游抽屉支持快速查看语言、专长、评分和最近服务记录
  - 财务抽屉支持快速查看回款与供应商付款的状态、金额、方式和追溯信息
- 开发验证通过：
  - `/opt/homebrew/bin/npm run verify`
