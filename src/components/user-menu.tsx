"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/lib/auth-client";

export function UserMenu({
  name,
  email,
  initials,
  role,
}: {
  name: string;
  email: string;
  initials: string;
  role: "client" | "developer";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`${initials}, account menu`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`inline-flex size-10 items-center justify-center rounded-full font-bold ${
          role === "client" ? "bg-brand-tint text-brand-dark" : "bg-orange-100 text-alert-dark"
        }`}
      >
        {initials}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-line bg-white p-2 shadow-[0_16px_40px_-16px_rgba(15,23,42,0.25)]"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <div className="font-semibold">{name}</div>
            <div className="truncate text-sm text-muted">{email}</div>
            <div className="mt-1.5 text-xs font-semibold uppercase tracking-wide text-brand-dark">
              {role === "client" ? "Business owner" : "Developer / AI engineer"}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={busy}
            className="mt-1 w-full rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-ink hover:bg-ground disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
