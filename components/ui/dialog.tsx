"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  maxWidthClassName?: string;
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  eyebrow = "Dialog",
  children,
  maxWidthClassName = "max-w-3xl",
}: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full ${maxWidthClassName} overflow-hidden rounded-[1.9rem] border border-white/40 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(248,250,252,0.96))] shadow-[0_24px_60px_rgba(15,23,42,0.22)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">{eyebrow}</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{title}</h3>
            {description ? <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-11rem)] overflow-y-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
