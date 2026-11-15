import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "light";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-white text-ink border border-line-strong hover:bg-ground",
  dark: "bg-ink text-white hover:bg-slate-800",
  light: "bg-white text-brand-dark hover:bg-brand-soft",
};

const sizes: Record<Size, string> = {
  sm: "text-sm px-4 py-2.5 rounded-[10px]",
  md: "text-[15px] px-5 py-3 rounded-[10px]",
  lg: "text-[17px] px-[26px] py-4 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `inline-flex items-center justify-center font-semibold no-underline transition-colors cursor-pointer ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link {...props} className={buttonClass(variant, size, className)} />;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} {...props} className={buttonClass(variant, size, className)} />;
}

export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`bg-white border border-line rounded-[18px] ${className}`}>{children}</div>
  );
}

export function Eyebrow({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "alert" | "light";
}) {
  const color = { brand: "text-brand", alert: "text-alert", light: "text-brand-light" }[tone];
  return (
    <span className={`text-sm font-bold uppercase tracking-[0.08em] ${color}`}>{children}</span>
  );
}

export function Pill({
  children,
  tone = "brand",
  className = "",
}: {
  children: ReactNode;
  tone?: "brand" | "alert" | "neutral";
  className?: string;
}) {
  const color = {
    brand: "bg-brand-soft text-brand-dark",
    alert: "bg-alert-soft text-alert-dark",
    neutral: "bg-slate-100 text-body",
  }[tone];
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-[13px] font-semibold ${color} ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({
  initials,
  size = "md",
  tone = "brand",
}: {
  initials: string;
  size?: "sm" | "md" | "lg";
  tone?: "brand" | "alert";
}) {
  const s = { sm: "size-7 text-xs", md: "size-10 text-[15px]", lg: "size-16 text-[22px]" }[size];
  const c = tone === "brand" ? "bg-brand-tint text-brand-dark" : "bg-orange-100 text-alert-dark";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${s} ${c}`}
    >
      {initials}
    </span>
  );
}

export const inputClass =
  "w-full rounded-[10px] border border-line-strong bg-white px-4 py-3.5 font-normal text-ink placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand-tint";
