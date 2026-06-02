"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

type SlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function SlideOver({ open, onClose, title, description, children }: SlideOverProps) {
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
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Close detail panel" className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-2xl border-l border-white/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.94))] shadow-[0_24px_60px_rgba(15,23,42,0.22)] backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-5 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-700">Detail Panel</p>
            <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{title}</h3>
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
        <div className="h-[calc(100%-112px)] overflow-y-auto px-5 py-5">{children}</div>
      </aside>
    </div>
  );
}
