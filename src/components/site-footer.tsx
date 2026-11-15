import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-6 py-10 text-[15px] text-muted">
        <span className="font-display text-lg font-bold text-ink">Vouch</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-6">
          <Link href="/#how" className="text-muted no-underline hover:text-ink">How it works</Link>
          <Link href="/#pricing" className="text-muted no-underline hover:text-ink">Pricing</Link>
          <Link href="/signup" className="text-muted no-underline hover:text-ink">Join as a developer</Link>
          <Link href="#" className="text-muted no-underline hover:text-ink">Terms</Link>
          <Link href="#" className="text-muted no-underline hover:text-ink">Privacy</Link>
        </nav>
        <span>© 2026 Vouch</span>
      </div>
    </footer>
  );
}
