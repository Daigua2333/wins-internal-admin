type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,250,252,0.88))] p-6 shadow-[0_18px_36px_rgba(15,23,42,0.06)]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-72 bg-[radial-gradient(circle_at_center,rgba(15,118,110,0.16),transparent_62%)]" />
      <div className="pointer-events-none absolute -left-12 top-0 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl" />
      <p className="relative text-xs uppercase tracking-[0.28em] text-cyan-700">{eyebrow}</p>
      <h2 className="relative mt-3 text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="relative mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}
