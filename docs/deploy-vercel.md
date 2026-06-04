# Vercel 上线手册

这份文档用于把 `WINS Internal Admin` 正式部署到 `Vercel`，并绑定未来的生产域名：

- `admin.winskokusai.com`

适用场景：

- 前端部署到 `Vercel`
- 数据与认证使用 `Supabase`
- 域名由 `Squarespace` 管理

## 部署前建议

正式上线前，建议不要直接复用当前本地测试用的 Supabase 项目。

更稳妥的做法是准备两套环境：

1. `Development / Staging`
- 用于本地开发和预览分支验证

2. `Production`
- 用于正式后台
- 绑定正式域名
- 单独维护正式管理员账号、真实数据和权限

## 当前项目已具备的上线条件

当前代码已经满足这些基础条件：

- `Next.js` 项目可正常构建
- `npm run verify` 可通过
- `Supabase Auth` 已接入
- `middleware` 已具备受保护路由校验
- 核心模块已具备真实数据入口

## 第一步：准备 Git 仓库

推荐使用 `GitHub` 托管代码，然后由 `Vercel` 直接连接仓库自动部署。

如果你还没有远程仓库，先做：

1. 创建一个 GitHub 仓库
2. 把当前项目推上去
3. 确认默认生产分支是 `main`

## 第二步：在 Vercel 导入项目

进入 [Vercel Dashboard](https://vercel.com/dashboard)，然后：

1. 点击 `New Project`
2. 选择你的 GitHub 仓库
3. Framework 保持 `Next.js`
4. Root Directory 选择当前项目根目录
5. Build Command 保持默认 `next build`
6. Install Command 保持默认 `npm install`
7. 点击 `Deploy`

当前项目的 `main` 分支很适合作为生产分支。

## 第三步：配置 Vercel 环境变量

在 `Vercel Project > Settings > Environment Variables` 里至少添加这两个：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

建议：

- `Production` 环境填写正式 Supabase 项目
- `Preview` 环境可以填写测试 Supabase 项目

如果以后你要做密码重置、邮箱确认跳转或 OAuth 回调，建议同时预留：

```bash
NEXT_PUBLIC_SITE_URL=https://admin.winskokusai.com
```

当前代码会使用这个变量生成 Supabase 邮件确认回跳地址。正式上线时建议把它配置好。

## 第四步：配置 Supabase 生产库

在正式 Supabase 项目里执行：

1. [supabase/schema.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/schema.sql)
2. 可选执行 [supabase/seed.sql](/Users/jiaxinli/Desktop/公司管理系统/supabase/seed.sql)

建议：

- 生产环境通常不要直接导入演示 seed 数据
- 如果你要先演示，可以先导入，再逐步替换成真实业务数据

## 第五步：配置 Supabase Auth URL

进入 `Supabase > Authentication > URL Configuration`

### Site URL

正式环境建议填：

```bash
https://admin.winskokusai.com
```

### Redirect URLs

建议至少加入：

```bash
http://localhost:3000/**
https://admin.winskokusai.com/**
https://*-<your-vercel-team-slug>.vercel.app/**
```

说明：

- `localhost` 用于本地开发
- 正式域名用于生产登录和邮件跳转
- `vercel.app` 通配用于 Preview Deployments

如果未来启用邮箱确认、密码重置或第三方 OAuth，这一步尤其重要。

## 第六步：绑定自定义域名

进入 `Vercel Project > Settings > Domains`

添加：

```bash
admin.winskokusai.com
```

因为这是一个 `subdomain`，通常需要在 `Squarespace DNS` 里配置一条 `CNAME`。

进入 `Squarespace` 的域名 DNS 管理后：

1. 找到 `DNS Settings`
2. 新增一条 `CNAME`
3. Host 填：

```bash
admin
```

4. Value 填 Vercel 提供的目标值

注意：

- 不要自己猜 CNAME 值
- 以 Vercel 域名设置页里给出的目标值为准

当 Vercel 验证通过后，域名状态会显示为可用。

## 第七步：创建生产管理员账号

在正式 Supabase 项目里：

1. 打开 `Authentication > Users`
2. 创建第一个正式管理员账号
3. 到 `public.profiles` 确认：
- `role = admin`
- `active = true`

如果这是新生产库，记得先让 `profiles` 自动建档逻辑已随 `schema.sql` 生效。

## 第八步：上线后检查清单

部署完成后，至少检查这些：

1. 登录页可访问
2. 管理后台受保护路由会拦截未登录用户
3. 登录成功后可进入 `/dashboard`
4. `订单 / 车辆 / 司机 / 导游 / 客户 / 报价 / 财务` 页面能正常读取数据
5. 新建订单、新增客户、新增车辆能真实写入
6. 角色权限控制正常
7. `admin.winskokusai.com` HTTPS 正常

## 推荐上线顺序

建议按这个顺序推进：

1. 先用 `Vercel Preview` 跑通构建
2. 再配置正式 Supabase 生产库
3. 再绑定 `admin.winskokusai.com`
4. 最后创建正式管理员账号并做上线验收

## 当前项目最小上线变量

最少需要：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

推荐额外准备：

```bash
NEXT_PUBLIC_SITE_URL=https://admin.winskokusai.com
```

## 上线后的建议

正式上线后，建议尽快补这三项：

1. 生产与测试 Supabase 分离
2. 操作日志
3. 数据备份与导出策略
