import { cn } from "@/lib/utils/cn";

type FormSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function FormSection({
  title,
  description,
  children,
  className,
  contentClassName,
}: FormSectionProps) {
  return (
    <section className={cn("rounded-[1.5rem] border border-slate-200/90 bg-white/88 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)]", className)}>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold tracking-tight text-slate-900">{title}</p>
        {description ? <p className="text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      <div className={cn("mt-4", contentClassName)}>{children}</div>
    </section>
  );
}
