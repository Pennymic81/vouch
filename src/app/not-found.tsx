import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <Logo />
      <p className="font-display text-sm font-bold uppercase tracking-[0.08em] text-brand">404</p>
      <h1 className="text-[34px] font-bold md:text-[44px]">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-lg text-body">
        It may have been moved or deleted, or you might not have access to it.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Go to the homepage</ButtonLink>
        <ButtonLink href="/projects" variant="secondary">Your projects</ButtonLink>
      </div>
    </main>
  );
}
