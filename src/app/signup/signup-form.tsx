"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { signUp } from "@/lib/auth-client";
import { destinationFor } from "@/lib/next-url";

type Role = "client" | "developer";

const roles: { value: Role; title: string; body: string }[] = [
  { value: "client", title: "A business owner", body: "I have a project and need someone to build it" },
  { value: "developer", title: "A developer or AI engineer", body: "I build products and want vetted, paid projects" },
];

export function SignUpForm() {
  const router = useRouter();
  // Links like "Apply with your work" open this page with ?role=developer.
  const params = useSearchParams();
  const [role, setRole] = useState<Role>(params.get("role") === "developer" ? "developer" : "client");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const extra = String(form.get("extra") ?? "").trim();
    setPending(true);
    const { error } = await signUp.email({
      name: String(form.get("name")).trim(),
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
      role,
      ...(extra ? (role === "client" ? { company: extra } : { portfolioUrl: extra }) : {}),
    });
    if (error) {
      setPending(false);
      setError(
        error.code === "USER_ALREADY_EXISTS" || error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
          ? "An account with this email already exists. Try signing in instead."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    router.push(destinationFor(role));
    router.refresh();
  }

  return (
    <form className="flex w-full max-w-[560px] flex-col gap-7" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-bold md:text-[34px]">Create your account</h1>
        <p className="text-base text-muted">
          Already have one?{" "}
          <Link href="/signin" className="font-semibold text-brand underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-[15px] font-semibold">I&apos;m joining as</legend>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          {roles.map((r) => {
            const selected = role === r.value;
            return (
              <label
                key={r.value}
                className={`flex cursor-pointer gap-3.5 rounded-[14px] p-5 transition-colors ${
                  selected ? "border-2 border-brand bg-brand-soft" : "border-2 border-line-strong/60 bg-white hover:border-line-strong"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={selected}
                  onChange={() => setRole(r.value)}
                  className="mt-1 size-[18px] accent-brand"
                />
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-bold">{r.title}</span>
                  <span className="text-sm leading-normal text-body">{r.body}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Full name
          <input type="text" name="name" required autoComplete="name" placeholder="Your name" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          <span>
            {role === "client" ? "Company" : "Portfolio or GitHub"}{" "}
            <span className="text-[13px] font-normal text-muted">Optional</span>
          </span>
          <input
            type={role === "client" ? "text" : "url"}
            name="extra"
            placeholder={role === "client" ? "Business name" : "https://github.com/you"}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Work email
        <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Password
        <input
          type="password"
          name="password"
          required
          minLength={8}
          maxLength={128}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className={inputClass}
        />
      </label>

      {error && (
        <p role="alert" className="rounded-[10px] border border-alert-line bg-alert-soft px-4 py-3 text-[15px] text-alert-dark">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full disabled:opacity-70" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>

      <p className="text-[13px] leading-relaxed text-muted">
        By creating an account you agree to the{" "}
        <Link href="#" className="text-brand underline underline-offset-2">Terms</Link> and{" "}
        <Link href="#" className="text-brand underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </form>
  );
}
