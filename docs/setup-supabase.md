# Supabase Setup Guide

这份文档用于把当前项目从“本地预览模式”切换到“真实 Supabase 模式”。

## 1. 创建 Supabase 项目

在 Supabase Dashboard 中创建一个新项目。

建议准备：

- Project URL
- Publishable Key
- 一个用于登录后台的测试账号邮箱

## 2. 执行数据库结构

在 Supabase 的 SQL Editor 中执行：

- [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
- [supabase/seed.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/seed.sql)

如果你之前已经执行过旧版本 `schema.sql`，这次建议重新执行最新版，因为里面新增了：

- `profiles` 自动建档 trigger
- `profiles` 自身插入/更新策略
- 角色链路所需的基础支持

执行后将创建：

- `profiles`
- `customers`
- `vehicles`
- `drivers`
- `guides`
- `quotations`
- `orders`
- `trip_costs`

然后 `seed.sql` 会插入一批可用于演示的数据：

- 客户
- 车辆
- 司机
- 导游
- 报价单
- 订单

## 3. 配置环境变量

在项目根目录创建 `.env.local`：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

参考模板：

- [.env.example](/Users/jiaxinli/Desktop/公司管理系统/.env.example)

## 4. 重启本地开发服务器

```bash
/opt/homebrew/bin/npm run dev -- --hostname 127.0.0.1 --port 3000
```

重启后：

- 登录页会自动从“预览模式”切换到“真实登录模式”
- middleware 会开始检查真实 Supabase 会话
- 各模块 loader 会优先尝试真实查询

## 5. 创建后台用户

推荐做法：

1. 先在 Supabase Auth 中创建一个测试用户
2. 确保该用户能登录
3. 在 `public.profiles` 中插入对应资料与角色

建议角色：

- `admin`
- `operations`
- `sales`
- `finance`
- `dispatch`

## 6. 验证接入成功

成功接入后应看到这些变化：

- 登录页按钮从“进入预览后台”变成“登录并进入后台”
- 系统设置页中的 Supabase 状态区显示已启用
- 系统设置页中的连接健康检查区会显示“Supabase 会话已生效”
- Dashboard 和业务页开始尝试读取真实数据
- 如果真实表为空，部分页面可能显示空数据或继续 fallback

## 7. 推荐接下来的动作

1. 插入一批测试客户、车辆、司机、导游、订单和报价数据
   如果你不想手动插入，可直接执行 [supabase/seed.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/seed.sql)
2. 验证 Dashboard 的统计卡是否变化
3. 验证订单、车辆、客户页是否已不再使用 mock fallback
4. 再继续收紧 RLS 写权限
