import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { LockIcon } from "@/components/icons";
import { ButtonLink, Card } from "@/components/ui";
import { getSession } from "@/lib/session";
import {
  formatDays,
  formatMoney,
  getProjectForClient,
  milestoneStatusLabel,
  projectStatusLabel,
  totalsOf,
} from "@/lib/projects";
import type { Milestone } from "@/db/schema";

export const metadata: Metadata = { title: "Project" };

const rowStyle: Record<Milestone["status"], { row: string; color: string }> = {
  planned: { row: "border-line", color: "text-muted" },
  funded: { row: "border-line", color: "text-brand-dark" },
  in_progress: { row: "border-line", color: "text-brand-dark" },
  in_qa: { row: "border-alert-line bg-alert-soft", color: "text-alert-dark" },
  awaiting_approval: { row: "border-alert-line bg-alert-soft", color: "text-alert-dark" },
  changes_requested: { row: "border-alert-line bg-alert-soft", color: "text-alert-dark" },
  paid: { row: "border-line", color: "text-brand-dark" },
};

async function Workspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const p = session ? await getProjectForClient(id, session.user.id) : null;
  if (!p) notFound();
  if (p.status === "draft") redirect(`/projects/${p.id}/plan`);

  const t = totalsOf(p.milestones);
  const paid = p.milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-muted">
            <Link href="/projects" className="text-muted no-underline hover:text-ink">Projects</Link> / {p.title}
          </nav>
          <h1 className="text-[30px] font-bold md:text-[34px]">{p.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={p.status === "open" ? "alert" : "brand"}>{projectStatusLabel[p.status]}</StatusBadge>
            {p.summary && <span className="text-[15px] text-body">{p.summary}</span>}
          </div>
        </div>
        {p.status === "open" && <ButtonLink href={`/projects/${p.id}/matches`}>See your matches</ButtonLink>}
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
          {p.status === "open" && (
            <section className="flex flex-col gap-2 rounded-[18px] border-2 border-alert-light bg-white p-6">
              <h2 className="text-xl font-bold">Next: choose your developer</h2>
              <p className="text-[15px] leading-relaxed text-body">
                Your plan is published. Pick someone from your matches — they&apos;ll see the same milestones and agree to them before any work starts.
              </p>
            </section>
          )}
          <Card className="flex flex-col gap-4 p-6 md:p-7">
            <section aria-labelledby="ms-h" className="flex flex-col gap-4">
              <h2 id="ms-h" className="text-[22px] font-bold">Milestones</h2>
              <ol className="flex flex-col gap-2.5">
                {p.milestones.map((m) => {
                  const s = rowStyle[m.status];
                  return (
                    <li key={m.id} className={`flex flex-col gap-2 rounded-xl border px-[18px] py-4 ${s.row}`}>
                      <div className="flex flex-wrap justify-between gap-2.5">
                        <span className="font-semibold">{m.position} · {m.title}</span>
                        <span className={`text-sm font-semibold ${s.color}`}>{milestoneStatusLabel[m.status]}</span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 text-sm text-muted">
                        <span>{formatMoney(m.amount, p.currency)}</span>
                        <span>{m.durationDays} day{m.durationDays === 1 ? "" : "s"}</span>
                        <span>{m.criteria.length} check{m.criteria.length === 1 ? "" : "s"}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section aria-labelledby="esc-h" className="flex flex-col gap-4 rounded-[18px] bg-ink p-6 text-white">
            <h2 id="esc-h" className="flex items-center gap-2.5 text-lg font-bold"><LockIcon className="size-5 text-brand-light" />Budget &amp; escrow</h2>
            <dl className="flex flex-col gap-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-slate-300">Total plan</dt><dd className="font-bold">{formatMoney(t.amount, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Released so far</dt><dd className="font-bold">{formatMoney(paid, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Estimated time</dt><dd className="font-bold">{formatDays(t.days)}</dd></div>
            </dl>
            <p className="border-t border-slate-700 pt-3.5 text-sm text-slate-300">Nothing is charged until you choose a developer and fund the first milestone.</p>
          </section>
          <p className="rounded-[18px] bg-brand-soft px-6 py-5 text-sm leading-relaxed text-brand-deep">
            <strong>Protected.</strong> If your developer goes inactive for 7 days, we match a replacement and your escrow moves with the project.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <Workspace params={params} />
      </Protected>
    </>
  );
}
