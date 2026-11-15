import Link from "next/link";
import { Logo } from "./logo";

type Tab = { href: string; label: string; key: string };

const clientTabs: Tab[] = [
  { key: "projects", href: "/projects/support-chatbot", label: "Projects" },
  { key: "new", href: "/projects/new", label: "New project" },
  { key: "messages", href: "#", label: "Messages" },
];

const developerTabs: Tab[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "invitations", href: "#", label: "Invitations" },
  { key: "earnings", href: "#", label: "Earnings" },
  { key: "profile", href: "#", label: "Profile & proof" },
];

export function AppHeader({
  role = "client",
  active,
}: {
  role?: "client" | "developer";
  active: string;
}) {
  const tabs = role === "client" ? clientTabs : developerTabs;
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3.5">
        <Logo size={28} textClass="text-xl" />
        <button
          type="button"
          aria-label="Account menu"
          className={`order-2 inline-flex size-10 items-center justify-center rounded-full font-bold md:order-3 ${
            role === "client" ? "bg-brand-tint text-brand-dark" : "bg-orange-100 text-alert-dark"
          }`}
        >
          AO
        </button>
        <nav
          aria-label="App"
          className="order-3 flex basis-full gap-1.5 overflow-x-auto whitespace-nowrap text-[15px] font-medium md:order-2 md:mr-auto md:basis-auto"
        >
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2.5 no-underline ${
                  isActive ? "bg-brand-soft font-semibold text-brand-dark" : "text-body hover:bg-ground"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
