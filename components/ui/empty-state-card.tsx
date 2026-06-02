type EmptyStateCardProps = {
  title: string;
  description: string;
};

export function EmptyStateCard({ title, description }: EmptyStateCardProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-slate-300/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(248,250,252,0.82))] p-6 text-center shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
