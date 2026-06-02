import Link from "next/link";
import { ArrowRight, Building2, LockKeyhole, Sparkles } from "lucide-react";
import { login, signup } from "@/app/(auth)/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const errorMap: Record<string, string> = {
  auth_required: "请先登录后再进入管理后台。",
  missing_credentials: "请输入企业邮箱和密码。",
  invalid_credentials: "邮箱或密码不正确，请检查后重试。",
  signup_failed: "创建账号失败。可能是邮箱已存在，或当前 Auth 设置不允许该注册方式。",
};

const messageMap: Record<string, string> = {
  check_email: "账号已创建，请检查邮箱完成确认；如果你的 Supabase 关闭了邮箱确认，也可以直接尝试登录。",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; message?: string; detail?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const authEnabled = isSupabaseConfigured();
  const errorMessage = params.error ? errorMap[params.error] : null;
  const infoMessage = params.message ? messageMap[params.message] : null;
  const errorDetail = params.detail ? decodeURIComponent(params.detail) : null;

  return (
    <main className="min-h-screen bg-mesh-radial px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-panel sm:px-8 lg:px-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.16),transparent_20%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Sparkles className="h-4 w-4 text-cyan-300" />
              Tokyo Inbound Operations System
            </div>

            <div className="mt-8 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">WINS International Travel Group</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                为东京入境旅游运营团队打造的
                <span className="block text-cyan-300">内部管理后台</span>
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                统一管理订单、车辆、司机、导游、客户、报价与利润分析，后续可平滑接入 Supabase Auth、PostgreSQL 与 Vercel 部署流程。
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                ["订单协同", "状态流转、排车、派导游一屏管理"],
                ["利润可视", "按行程追踪营收、成本和毛利率"],
                ["权限预留", "后续接 Supabase Auth 与角色控制"],
              ].map(([title, desc]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-2 text-xs leading-6 text-slate-300">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-panel backdrop-blur sm:p-8">
          <div className="w-full max-w-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <Building2 className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900">管理后台登录</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {authEnabled
                ? "当前已接入 Supabase Auth 登录结构。配置好环境变量后，可直接使用企业邮箱密码登录。"
                : "当前处于预览模式。由于还未配置 Supabase 环境变量，点击按钮会直接进入 Dashboard。"}
            </p>

            <form className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">企业邮箱</label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@winskokusai.com"
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 outline-none transition focus:border-cyan-400 focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">密码</label>
                <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-cyan-400 focus-within:bg-white">
                  <LockKeyhole className="h-4 w-4 text-slate-400" />
                  <input type="password" name="password" placeholder="请输入登录密码" className="w-full bg-transparent outline-none" />
                </div>
              </div>

              {authEnabled ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    formAction={login}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-medium text-white transition hover:bg-cyan-800"
                  >
                    登录
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    formAction={signup}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-medium text-slate-800 transition hover:border-cyan-300 hover:text-cyan-700"
                  >
                    创建测试账号
                  </button>
                </div>
              ) : (
                <Link
                  href="/dashboard"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-medium text-white transition hover:bg-cyan-800"
                >
                  进入预览后台
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </form>

            {errorMessage ? (
              <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <div>{errorMessage}</div>
                {errorDetail ? <div className="mt-2 text-xs leading-5 text-rose-600">{errorDetail}</div> : null}
              </div>
            ) : null}

            {infoMessage ? (
              <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">{infoMessage}</div>
            ) : null}

            <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {authEnabled
                ? "Supabase 已启用：后续可以继续补充邀请制开户、Magic Link、密码重置与 MFA。"
                : "预览模式：配置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 后，这里会自动切换成真实登录。"}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
