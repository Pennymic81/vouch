import type { Metadata } from "next";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { Card } from "@/components/ui";
import { MilestoneCard } from "@/components/milestone-card";
import { SubmitForm } from "@/components/delivery-controls";
import { db } from "@/db";
import { project, user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { formatMoney, projectStatusLabel } from "@/lib/projects";
import { milestoneDetails, recentActivity, runAutoApprovals } from "@/lib/delivery";

export const metadata: Metadata = { title: "Your project" };

const fmtDay = (d: Date) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d);

async function DevProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) notFound();
  await runAutoApprovals(id);
  const [row] = await db
    .select({ p: project, clientName: user.name, company: user.company })
    .from(project)
    .innerJoin(user, eq(user.id, project.clientId))
    .where(and(eq(project.id, id), eq(project.developerId, session.user.id)))
    .limit(1);
  if (!row) notFound();
  const { p } = row;
  const [milestones, log] = await Promise.all([milestoneDetails(p.id), recentActivity(p.id)]);
  const earned = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
  const inEscrow = milestones.filter((m) => m.status !== "planned" && m.status !== "paid").reduce((s, m) => s + m.amount, 0);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-[15px] font-semibold text-brand no-underline">← Back to dashboard</Link>
        <h1 className="text-[30px] font-bold md:text-[34px]">{p.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-[15px] text-body">
          <span>For {row.company || row.clientName}</span>
          <StatusBadge tone={p.status === "completed" ? "ink" : "brand"}>{projectStatusLabel[p.status]}</StatusBadge>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <Card className="flex min-w-0 flex-[999_1_620px] flex-col gap-4 p-6 md:p-7">
          <h2 className="text-[22px] font-bold">Milestones</h2>
          <ol className="flex flex-col gap-3.5">
            {milestones.map((m) => (
              <MilestoneCard key={m.id} m={m} currency={p.currency}>
                {m.status === "planned" && <p className="text-[15px] text-muted">Waiting for the owner to fund this milestone.</p>}
                {(m.status === "funded" || m.status === "in_progress" || m.status === "changes_requested") && (
                  <SubmitForm milestoneId={m.id} position={m.position} resubmit={m.status === "changes_requested"} />
                )}
                {m.status === "in_qa" && <p className="text-[15px] text-body">A Vouch reviewer is checking your work against the list.</p>}
                {m.status === "awaiting_approval" && <p className="text-[15px] text-body">QA passed. The owner approves it, or it&apos;s approved automatically when the review window ends.</p>}
              </MilestoneCard>
            ))}
          </ol>
        </Card>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section aria-labelledby="pay-h" className="flex flex-col gap-4 rounded-[18px] bg-ink p-6 text-white">
            <h2 id="pay-h" className="text-lg font-bold">Your pay</h2>
            <dl className="flex flex-col gap-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-slate-300">Locked in escrow for you</dt><dd className="font-bold">{formatMoney(inEscrow, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Paid to you</dt><dd className="font-bold" data-testid="dev-earned">{formatMoney(earned, p.currency)}</dd></div>
            </dl>
            <p className="text-xs text-slate-400">Payments are simulated until card payments are switched on.</p>
          </section>
          {log.length > 0 && (
            <Card className="flex flex-col gap-3.5 p-6">
              <h2 className="text-lg font-bold">Activity</h2>
              <ul aria-label="Activity" className="flex flex-col gap-3 text-sm text-body">
                {log.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5"><span>{a.message.replace(/^You /, "The owner ")}</span><span className="text-xs text-muted">{fmtDay(a.createdAt)}</span></li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>
    </main>
  );
}

export default function DevProjectPage({ params }: PageProps<"/dashboard/projects/[id]">) {
  return (
    <>
      <AppHeader role="developer" active="dashboard" />
      <Protected role="developer" returnTo="/dashboard">
        <DevProject params={params} />
      </Protected>
    </>
  );
}
