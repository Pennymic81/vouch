"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./logo";
import { ButtonLink } from "./ui";
import { CloseIcon, MenuIcon } from "./icons";

const links = [
  { href: "/#how", label: "How it works" },
  { href: "/#clients", label: "For business owners" },
  { href: "/#developers", label: "For developers" },
  { href: "/#pricing", label: "Pricing" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-4">
        <Logo />
        <nav aria-label="Main" className="hidden gap-7 text-[15px] font-medium md:flex">
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-body no-underline hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/signin"
            className="hidden px-4 py-3 text-[15px] font-semibold text-ink no-underline md:inline-flex"
          >
            Sign in
          </Link>
          <ButtonLink href="/signup">Get started</ButtonLink>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
            className="inline-flex size-11 items-center justify-center rounded-[10px] border border-line-strong bg-white text-ink md:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="flex flex-col border-t border-line px-6 pb-4 pt-2 text-[17px] font-medium md:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-slate-100 py-3.5 text-ink no-underline"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/signin" className="py-3.5 font-semibold text-brand-dark no-underline">
            Sign in
          </Link>
        </nav>
      )}
    </header>
  );
}
