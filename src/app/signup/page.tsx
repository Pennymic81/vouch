import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-wrap bg-ground">
      <aside className="flex min-w-0 flex-[1_1_420px] flex-col justify-between gap-12 bg-ink p-8 text-white md:p-12">
        <Logo dark />
        <div className="flex max-w-[460px] flex-col gap-5">
          <h1 className="text-[34px] font-bold leading-[1.1] md:text-[44px]">An agreed plan. Checked work. Guaranteed pay.</h1>
          <p className="text-lg leading-relaxed text-slate-300">
            Whichever side you&apos;re on, Vouch holds the agreement and checks it — so you never have to trust blindly.
          </p>
        </div>
        <ul className="flex flex-col gap-3.5 text-base text-slate-200">
          {["Escrow-protected milestone payments", "Independent QA review on every milestone", "One flat fee, shown upfront"].map((t) => (
            <li key={t} className="flex gap-3"><span aria-hidden="true" className="font-bold text-brand-light">✓</span>{t}</li>
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-[999_1_560px] items-center justify-center px-6 py-16">
        <SignUpForm />
      </div>
    </main>
  );
}
