"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils/cn";

type PendingSubmitButtonProps = {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function PendingSubmitButton({
  children,
  pendingLabel = "提交中...",
  className,
  disabled = false,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a,#115e59)] px-5 text-sm font-medium text-white shadow-lg shadow-cyan-950/10 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-950/15 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none",
        className,
      )}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      <span>{pending ? pendingLabel : children}</span>
    </button>
  );
}
