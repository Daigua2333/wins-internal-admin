# Supabase Architecture

本项目面向 `WINS International Travel Group` 东京入境旅游运营后台，当前建议的 Supabase 结构如下。

## Auth Strategy

- 使用 `Supabase Auth` 企业邮箱登录
- `auth.users` 只做认证主体
- 业务角色和显示名称放入 `public.profiles`
- 角色建议：
  - `admin`
  - `operations`
  - `sales`
  - `finance`
  - `dispatch`

## Core Tables

- `profiles`
  - 用户资料与角色
- `customers`
  - 客户公司、联系人、账期、市场信息
- `vehicles`
  - 自有/合作车辆与保养状态
- `drivers`
  - 司机资料、微信 / LINE、月出勤天数、自定义颜色、默认车辆与事故记录
- `guides`
  - 导游资料、语言、专长、资质
- `quotations`
  - 报价单头信息与利润试算
- `orders`
  - 实际订单、分配关系、收入与成本汇总
- `trip_costs`
  - 订单下的单项成本明细

## Recommended Flow

1. 销售创建 `customer`
2. 销售创建 `quotation`
3. 报价确认后生成 `order`
4. 运营/调度给 `order` 分配 `vehicle / driver / guide`
5. 财务或运营录入 `trip_costs`
6. 订单自动或手动汇总利润字段

## RLS Direction

第一阶段先允许 `authenticated` 用户读取。

第二阶段建议加细分写权限：

- `admin`
  - 全部读写
- `operations`
  - 订单、客户、利润可读；订单可写
- `sales`
  - 客户、报价可写；订单只读
- `finance`
  - 利润、订单、客户可读；成本与财务字段可写
- `dispatch`
  - 订单、车辆、司机、导游可写

## Next Build Steps

1. 在 Supabase 控制台执行 [schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
2. 创建开发环境 `.env.local`
3. 把登录页改为真实 `Supabase Auth`
4. 把 `lib/mock/data.ts` 逐步替换为 repository 查询
