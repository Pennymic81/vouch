import type { ReactNode } from "react";

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span id={id} className="text-sm font-medium text-alert-dark">
      {message}
    </span>
  );
}

export function FormAlert({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-[10px] border border-alert-line bg-alert-soft px-4 py-3 text-[15px] text-alert-dark">
      {children}
    </p>
  );
}

export function StatusBadge({ tone, children }: { tone: "brand" | "alert" | "neutral" | "ink"; children: ReactNode }) {
  const c = {
    brand: "bg-brand-soft text-brand-dark",
    alert: "bg-alert-soft text-alert-dark",
    neutral: "bg-slate-100 text-body",
    ink: "bg-ink text-white",
  }[tone];
  return <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${c}`}>{children}</span>;
}
