import { ReactNode } from "react";

type SectionCardProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionCard({ title, description, action, children }: SectionCardProps) {
  return (
    <section className="glass-panel panel-hover rounded-3xl p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-900">{title}</h2>
          {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
        </div>
        {action ? <div className="min-w-0 max-w-full shrink-0 md:max-w-[45%]">{action}</div> : null}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  );
}
