import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPinned,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { login, signup } from "@/app/(auth)/login/actions";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const errorMap: Record<string, string> = {
  auth_required: "请先登录后再进入管理后台。",
  missing_credentials: "请输入企业邮箱和密码。",
  missing_signup_fields: "请完整填写姓名、企业邮箱、内部注册口令、密码和确认密码。",
  invalid_credentials: "邮箱或密码不正确，请检查后重试。",
  invalid_invite_code: "内部注册口令不正确，请向管理员确认。",
  password_mismatch: "两次输入的密码不一致，请重新确认。",
  weak_password: "密码至少需要 8 位，建议包含字母、数字和符号。",
  signup_closed: "注册入口暂未开放。请先在 Vercel 环境变量中配置 WINS_SIGNUP_INVITE_CODE。",
  signup_failed: "创建账号失败。可能是邮箱已存在，或当前 Auth 设置不允许该注册方式。",
};

const messageMap: Record<string, string> = {
  check_email: "账号已提交，请检查邮箱完成确认；如果 Supabase 关闭了邮箱确认，也可以直接尝试登录。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string; detail?: string; mode?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const authEnabled = isSupabaseConfigured();
  const activeMode = params.mode === "signup" ? "signup" : "login";
  const errorMessage = params.error ? errorMap[params.error] : null;
  const infoMessage = params.message ? messageMap[params.message] : null;
  const errorDetail = params.detail ? decodeURIComponent(params.detail) : null;
  const inputClass =
    "h-12 w-full rounded-2xl border border-slate-200/90 bg-slate-50/85 px-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,118,110,0.12)]";

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(15,118,110,0.18),transparent_26%),radial-gradient(circle_at_82%_12%,rgba(217,119,6,0.12),transparent_22%),radial-gradient(circle_at_72%_88%,rgba(190,77,93,0.08),transparent_24%),linear-gradient(180deg,#f5f8f8_0%,#eef3f4_48%,#f8fafc_100%)]" />
      <div className="absolute left-8 top-10 hidden h-52 w-52 rounded-full border border-white/80 bg-white/45 blur-3xl lg:block" />
      <div className="absolute bottom-8 right-10 hidden h-64 w-64 rounded-full bg-teal-600/10 blur-3xl lg:block" />

      <div className="relative mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-[1500px] gap-5 lg:grid-cols-[1.03fr_0.97fr]">
        <section className="sidebar-panel relative overflow-hidden rounded-[2.25rem] p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,118,110,0.1),transparent_36%),radial-gradient(circle_at_82%_18%,rgba(245,158,11,0.1),transparent_24%),radial-gradient(circle_at_12%_88%,rgba(20,184,166,0.1),transparent_28%)]" />
          <div className="soft-grid absolute inset-x-8 bottom-8 top-24 rounded-[2rem] border border-white/70 bg-white/18 opacity-70" />

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#0f766e)] text-white shadow-lg shadow-teal-950/15">
                    <Building2 className="h-6 w-6" />
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-[0.28em] text-teal-700">WINS</p>
                    <p className="text-xs font-medium text-slate-600">International Travel Group</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Internal Live
                </span>
              </div>

              <div className="mt-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-white/75 px-4 py-2 text-xs font-medium text-teal-800 shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  Tokyo inbound operations command center
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  让东京入境业务
                  <span className="mt-1 block text-teal-800">从登录开始就稳定清晰</span>
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
                  面向内部运营、调度、销售与财务团队的统一后台。账号通过 Supabase Auth 管理，注册后默认进入运营角色，后续可由管理员在系统设置中调整权限。
                </p>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  ["订单", "重复一日游、排车、状态推进"],
                  ["资源", "车辆、司机、导游统一调度"],
                  ["财务", "报价、成本、回款与利润追踪"],
                ].map(([title, desc]) => (
                  <div key={title} className="panel-hover rounded-3xl border border-white/90 bg-white/68 p-4 shadow-[0_12px_28px_rgba(15,23,42,.055)] backdrop-blur">
                    <p className="text-sm font-semibold text-slate-950">{title}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-12 grid gap-3 rounded-[2rem] border border-white/90 bg-white/70 p-4 shadow-[0_16px_34px_rgba(15,23,42,.06)] backdrop-blur sm:grid-cols-3">
              <div>
                <p className="text-2xl font-semibold text-slate-950">24/7</p>
                <p className="mt-1 text-xs text-slate-500">云端运营访问</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-950">Auth</p>
                <p className="mt-1 text-xs text-slate-500">Supabase 会话保护</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-950">Tokyo</p>
                <p className="mt-1 text-xs text-slate-500">入境旅游业务场景</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel relative flex items-center justify-center overflow-hidden rounded-[2.25rem] p-5 sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.13),transparent_66%)]" />
          <div className="w-full max-w-[30rem]">
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-700">Secure Access</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {activeMode === "signup" ? "注册内部账号" : "登录管理后台"}
                </h2>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#0f766e)] text-white shadow-lg shadow-teal-950/15">
                {activeMode === "signup" ? <UserRound className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {authEnabled
                ? activeMode === "signup"
                  ? "请使用公司认可的邮箱注册。账号创建后会自动生成个人档案，角色默认是运营，管理员可后续调整。"
                  : "使用 Supabase Auth 保护后台入口，登录成功后会进入受权限控制的运营工作台。"
                : "当前处于预览模式。由于还未配置 Supabase 环境变量，点击按钮会直接进入 Dashboard。"}
            </p>

            <div className="mt-7 grid grid-cols-2 rounded-2xl border border-slate-200/70 bg-slate-100/75 p-1 shadow-inner">
              <Link
                href="/login"
                className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                  activeMode === "login"
                    ? "bg-[linear-gradient(135deg,#0f172a,#115e59)] text-white shadow-md"
                    : "text-slate-500 hover:bg-white/65 hover:text-slate-800"
                }`}
              >
                登录
              </Link>
              <Link
                href="/login?mode=signup"
                className={`rounded-xl px-4 py-3 text-center text-sm font-semibold transition ${
                  activeMode === "signup"
                    ? "bg-[linear-gradient(135deg,#0f172a,#115e59)] text-white shadow-md"
                    : "text-slate-500 hover:bg-white/65 hover:text-slate-800"
                }`}
              >
                注册账号
              </Link>
            </div>

            {authEnabled && activeMode === "login" ? (
              <form className="mt-8 space-y-4" action={login}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">企业邮箱</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="email" autoComplete="email" required placeholder="admin@winskokusai.com" className={`${inputClass} pl-11`} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">密码</label>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="password" name="password" autoComplete="current-password" required placeholder="请输入登录密码" className={`${inputClass} pl-11`} />
                  </div>
                </div>

                <PendingSubmitButton pendingLabel="正在验证账号..." className="h-12 w-full">
                  登录后台
                  <ArrowRight className="h-4 w-4" />
                </PendingSubmitButton>
              </form>
            ) : null}

            {authEnabled && activeMode === "signup" ? (
              <form className="mt-8 space-y-4" action={signup}>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">姓名</label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="text" name="fullName" autoComplete="name" required placeholder="例如：Li Jiaxin" className={`${inputClass} pl-11`} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">企业邮箱</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="email" name="email" autoComplete="email" required placeholder="name@winskokusai.com" className={`${inputClass} pl-11`} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">内部注册口令</label>
                  <div className="relative">
                    <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input type="password" name="inviteCode" autoComplete="off" required placeholder="由管理员提供" className={`${inputClass} pl-11`} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">密码</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="password" name="password" autoComplete="new-password" required placeholder="至少 8 位" className={`${inputClass} pl-11`} />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">确认密码</label>
                    <div className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="password" name="confirmPassword" autoComplete="new-password" required placeholder="再次输入" className={`${inputClass} pl-11`} />
                    </div>
                  </div>
                </div>

                <PendingSubmitButton pendingLabel="正在创建账号..." className="h-12 w-full">
                  创建账号
                  <ArrowRight className="h-4 w-4" />
                </PendingSubmitButton>
              </form>
            ) : null}

            {!authEnabled ? (
              <div className="mt-8 space-y-4">
                <Link
                  href="/dashboard"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] text-sm font-semibold text-white shadow-lg shadow-teal-950/15 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  进入预览后台
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                  预览模式下不会创建真实账号。配置 Supabase 环境变量后，会自动切换为真实登录与注册流程。
                </div>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
                <div>{errorMessage}</div>
                {errorDetail ? <div className="mt-2 text-xs leading-5 text-rose-600">{errorDetail}</div> : null}
              </div>
            ) : null}

            {infoMessage ? (
              <div className="mt-6 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-800">
                {infoMessage}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 text-xs leading-5 text-slate-500 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-white/72 p-4 shadow-sm">
                <CheckCircle2 className="mb-2 h-4 w-4 text-teal-700" />
                注册账号默认进入运营角色，管理员可在系统设置中分配财务、调度、销售或管理员权限。
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/72 p-4 shadow-sm">
                <MapPinned className="mb-2 h-4 w-4 text-amber-700" />
                后台当前绑定东京入境业务场景，建议仅向内部成员开放注册入口。
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs text-slate-500 shadow-sm">
              <span className="inline-flex items-center gap-2">
                <PlaneTakeoff className="h-4 w-4 text-teal-700" />
                admin.winskokusai.com
              </span>
              <span>{authEnabled ? "Supabase Auth 已启用" : "本地预览模式"}</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
