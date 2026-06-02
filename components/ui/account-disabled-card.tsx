import { signOut } from "@/app/(dashboard)/settings/actions";

export function AccountDisabledCard() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-2xl rounded-[2rem] border border-rose-200 bg-white p-8 shadow-panel">
        <p className="text-xs uppercase tracking-[0.24em] text-rose-500">Account Disabled</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">当前账号已被停用</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          该账号目前不能进入 WINS 内部管理后台。请联系管理员在“系统设置 / 角色与账号管理”中重新启用此账号，或使用其他可用账号登录。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={signOut}>
            <button className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-cyan-800">
              返回登录页
            </button>
          </form>
          <div className="inline-flex h-11 items-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm text-slate-600">
            联系管理员恢复账号后即可继续访问
          </div>
        </div>
      </section>
    </main>
  );
}
