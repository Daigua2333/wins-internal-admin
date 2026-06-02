"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";

type ConfirmActionButtonProps = {
  label?: string;
  children?: ReactNode;
  title: string;
  description: string;
  targetFormId?: string;
  formId?: string;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
  tone?: "danger" | "neutral";
};

export function ConfirmActionButton({
  label,
  children,
  title,
  description,
  targetFormId,
  formId,
  confirmLabel = "确认执行",
  className,
  disabled = false,
  tone = "danger",
}: ConfirmActionButtonProps) {
  const [open, setOpen] = useState(false);
  const resolvedFormId = formId ?? targetFormId;
  const resolvedClassName =
    className ??
    (tone === "danger"
      ? "rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-50");

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={resolvedClassName} disabled={disabled}>
        {children ?? label}
      </button>

      {open ? (
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          title={title}
          description={description}
          eyebrow="Confirm Action"
          maxWidthClassName="max-w-md"
        >
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              再想想
            </button>
            <button
              type="button"
              onClick={() => {
                const target = resolvedFormId ? (document.getElementById(resolvedFormId) as HTMLFormElement | null) : null;
                target?.requestSubmit();
                setOpen(false);
              }}
              className="rounded-2xl bg-[linear-gradient(135deg,#7f1d1d,#be123c)] px-4 py-2 text-sm font-medium text-white shadow-lg shadow-rose-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-950/15"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
