"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

type DashboardToastProps = {
  feedback: {
    type: "success" | "error";
    message: string;
    detail?: string;
  } | null;
};

export function DashboardToast({ feedback }: DashboardToastProps) {
  const [open, setOpen] = useState(Boolean(feedback));

  useEffect(() => {
    setOpen(Boolean(feedback));
  }, [feedback]);

  useEffect(() => {
    if (!open || !feedback) return;

    const timer = window.setTimeout(() => {
      setOpen(false);
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [feedback, open]);

  if (!feedback || !open) {
    return null;
  }

  const toneClasses =
    feedback.type === "success"
      ? "border-emerald-200/90 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(209,250,229,0.96))] text-emerald-950 shadow-emerald-950/10"
      : "border-rose-200/90 bg-[linear-gradient(180deg,rgba(255,241,242,0.98),rgba(254,226,226,0.96))] text-rose-950 shadow-rose-950/10";

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[90] w-[min(92vw,420px)] sm:right-6 sm:top-6 xl:right-8 xl:top-8">
      <div className={`pointer-events-auto rounded-[1.75rem] border p-4 shadow-[0_24px_60px] backdrop-blur ${toneClasses}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {feedback.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{feedback.message}</p>
            {feedback.detail ? <p className="mt-1 text-sm leading-6 opacity-85">{feedback.detail}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Close toast"
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-current/65 transition hover:bg-white/50 hover:text-current"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
