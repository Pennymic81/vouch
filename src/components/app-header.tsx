import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";
import { getSession, initialsOf } from "@/lib/session";
import { isReviewer } from "@/lib/delivery";

type Tab = { href: string; label: string; key: string };

const clientTabs: Tab[] = [
  { key: "projects", href: "/projects", label: "Projects" },
  { key: "new", href: "/projects/new", label: "New project" },
];

const developerTabs: Tab[] = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "profile", href: "/dashboard/profile", label: "Profile & proof" },
  { key: "payouts", href: "/dashboard/payouts", label: "Payouts" },
];

async function CurrentUser() {
  const session = await getSession();
  if (!session) return <AvatarPlaceholder />;
  const { name, email, role } = session.user;
  return (
    <UserMenu
      name={name}
      email={email}
      initials={initialsOf(name)}
      role={role === "developer" ? "developer" : "client"}
      reviewer={isReviewer(email)}
    />
  );
}

function AvatarPlaceholder() {
  return <span aria-hidden="true" className="inline-block size-10 rounded-full bg-slate-100" />;
}

const reviewerTabs: Tab[] = [{ key: "queue", href: "/review", label: "QA queue" }];

export function AppHeader({
  role = "client",
  active,
}: {
  role?: "client" | "developer" | "reviewer";
  active: string;
}) {
  const tabs = role === "reviewer" ? reviewerTabs : role === "client" ? clientTabs : developerTabs;
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3.5">
        <Logo size={28} textClass="text-xl" />
        <div className="order-2 md:order-3">
          <Suspense fallback={<AvatarPlaceholder />}>
            <CurrentUser />
          </Suspense>
        </div>
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
