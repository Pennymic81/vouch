import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { ButtonLink } from "@/components/ui";
import { getSession } from "@/lib/session";
import { formatDays, formatMoney, listProjectsForClient, projectStatusLabel, totalsOf } from "@/lib/projects";

export const metadata: Metadata = { title: "Your projects" };

async function ProjectList() {
  const session = await getSession();
  const projects = session ? await listProjectsForClient(session.user.id) : [];

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-[18px] border border-dashed border-line-strong bg-white px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">No projects yet</h2>
        <p className="max-w-md text-body">Describe your idea in plain words and we&apos;ll help you turn it into a clear plan with milestones.</p>
        <ButtonLink href="/projects/new" size="lg">Start your first project</ButtonLink>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
      {projects.map((p) => {
        const t = totalsOf(p.milestones);
        const href = p.status === "draft" ? `/projects/${p.id}/plan` : `/projects/${p.id}`;
        return (
          <li key={p.id}>
            <Link
              href={href}
              className="flex h-full flex-col gap-4 rounded-[18px] border border-line bg-white p-6 text-ink no-underline transition-colors hover:border-line-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-bold">{p.title}</h2>
                <StatusBadge tone={p.status === "draft" ? "neutral" : p.status === "open" ? "alert" : "brand"}>
                  {projectStatusLabel[p.status]}
                </StatusBadge>
              </div>
              <p className="line-clamp-3 text-[15px] leading-relaxed text-body">{p.summary || p.idea}</p>
              <dl className="mt-auto flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-4 text-sm">
                <div className="flex gap-1.5"><dt className="text-muted">Milestones</dt><dd className="font-semibold">{t.count}</dd></div>
                <div className="flex gap-1.5"><dt className="text-muted">Budget</dt><dd className="font-semibold">{t.count ? formatMoney(t.amount, p.currency) : "—"}</dd></div>
                <div className="flex gap-1.5"><dt className="text-muted">Time</dt><dd className="font-semibold">{t.count ? formatDays(t.days) : "—"}</dd></div>
              </dl>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function ProjectsPage() {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-[30px] font-bold md:text-4xl">Your projects</h1>
              <p className="text-[17px] text-body">Plans you&apos;re drafting and work in progress.</p>
            </div>
            <ButtonLink href="/projects/new">+ New project</ButtonLink>
          </div>
          <ProjectList />
        </main>
      </Protected>
    </>
  );
}
