import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthAside } from "@/components/auth-aside";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen flex-wrap bg-ground">
      <AuthAside
        title="An agreed plan. Checked work. Guaranteed pay."
        body="Whichever side you're on, Vouch holds the agreement and checks it — so you never have to trust blindly."
      />
      <div className="flex min-w-0 flex-[999_1_560px] items-center justify-center px-6 py-16">
        <Suspense fallback={<div aria-busy="true" className="h-[640px] w-full max-w-[560px] animate-pulse rounded-[18px] bg-white" />}>
          <SignUpForm />
        </Suspense>
      </div>
    </main>
  );
}
