import type { Metadata } from "next";
import { AuthAside } from "@/components/auth-aside";
import { SignInForm } from "./signin-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="flex min-h-screen flex-wrap bg-ground">
      <AuthAside title="Welcome back." body="Pick up where you left off — your plans, milestones and payments are waiting." />
      <div className="flex min-w-0 flex-[999_1_560px] items-center justify-center px-6 py-16">
        <SignInForm />
      </div>
    </main>
  );
}
