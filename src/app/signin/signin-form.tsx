"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { signIn } from "@/lib/auth-client";
import { destinationFor } from "@/lib/next-url";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    setPending(true);
    const { data, error } = await signIn.email({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    if (error) {
      setPending(false);
      setError(
        error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? "That email and password don't match. Please try again."
          : (error.message ?? "Something went wrong. Please try again."),
      );
      return;
    }
    const role = (data?.user as { role?: string } | undefined)?.role;
    router.push(destinationFor(role));
    router.refresh();
  }

  return (
    <form className="flex w-full max-w-[460px] flex-col gap-7" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <h1 className="text-[30px] font-bold md:text-[34px]">Sign in to Vouch</h1>
        <p className="text-base text-muted">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand underline underline-offset-2">
            Create an account
          </Link>
        </p>
      </div>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Email
        <input type="email" name="email" required autoComplete="email" placeholder="you@company.com" className={inputClass} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Password
        <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {error && (
        <p role="alert" className="rounded-[10px] border border-alert-line bg-alert-soft px-4 py-3 text-[15px] text-alert-dark">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full disabled:opacity-70" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
