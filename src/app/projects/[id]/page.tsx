import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { LockIcon } from "@/components/icons";
import { Avatar, ButtonLink, Card } from "@/components/ui";
import { MilestoneCard } from "@/components/milestone-card";
import { ApprovalPanel, FundButton } from "@/components/delivery-controls";
import { getSession, initialsOf } from "@/lib/session";
import { formatDays, formatMoney, getProjectForClient, listInvitationsForProject, projectStatusLabel } from "@/lib/projects";
import { autoApproveAt, milestoneDetails, recentActivity, runAutoApprovals } from "@/lib/delivery";
import { WithdrawButton } from "./withdraw-button";
import { paymentsEnabled } from "@/lib/paystack";

export const metadata: Metadata = { title: "Project" };

const fmtDay = (d: Date) => new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" }).format(d);

const paymentMessages = {
  funded: { tone: "brand", text: "✓ Payment received — the milestone is funded and your developer can start." },
  failed: { tone: "alert", text: "The payment didn't go through, so nothing was charged. You can try again." },
  pending: { tone: "alert", text: "Your payment is still being confirmed. Refresh this page in a minute." },
} as const;

async function Workspace({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const paymentResult = String((await searchParams).payment ?? "") as keyof typeof paymentMessages;
  const session = await getSession();
  let p = session ? await getProjectForClient(id, session.user.id) : null;
  if (!p) notFound();
  if (p.status === "draft") redirect(`/projects/${p.id}/plan`);

  await runAutoApprovals(p.id);
  p = (await getProjectForClient(id, session!.user.id))!;

  const [milestones, invites, log] = await Promise.all([milestoneDetails(p.id), listInvitationsForProject(p.id), recentActivity(p.id)]);
  const hired = invites.find((i) => i.status === "accepted");
  const total = milestones.reduce((s, m) => s + m.amount, 0);
  const paid = milestones.filter((m) => m.status === "paid").reduce((s, m) => s + m.amount, 0);
  const held = milestones.filter((m) => m.status !== "planned" && m.status !== "paid").reduce((s, m) => s + m.amount, 0);
  const days = milestones.reduce((s, m) => s + m.durationDays, 0);
  const doneCount = milestones.filter((m) => m.status === "paid").length;
  const anyActive = milestones.some((m) => m.status !== "planned" && m.status !== "paid");
  const nextToFund = p.status === "in_progress" && !anyActive ? milestones.find((m) => m.status === "planned") : undefined;

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="text-sm font-semibold text-muted">
            <Link href="/projects" className="text-muted no-underline hover:text-ink">Projects</Link> / {p.title}
          </nav>
          <h1 className="text-[30px] font-bold md:text-[34px]">{p.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={p.status === "open" ? "alert" : p.status === "completed" ? "ink" : "brand"}>{projectStatusLabel[p.status]}</StatusBadge>
            {p.summary && <span className="text-[15px] text-body">{p.summary}</span>}
          </div>
        </div>
        {p.status === "open" && <ButtonLink href={`/projects/${p.id}/matches`}>See your matches</ButtonLink>}
      </div>

      {paymentMessages[paymentResult] && (
        <p
          role="status"
          className={`rounded-[14px] px-5 py-4 text-[15px] font-semibold ${
            paymentMessages[paymentResult].tone === "brand" ? "bg-brand-soft text-brand-deep" : "border border-alert-line bg-alert-soft text-alert-dark"
          }`}
        >
          {paymentMessages[paymentResult].text}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
          {p.status === "open" && (
            <section aria-labelledby="choose-h" className="flex flex-col gap-4 rounded-[18px] border-2 border-alert-light bg-white p-6">
              <div className="flex flex-col gap-1.5">
                <h2 id="choose-h" className="text-xl font-bold">Next: choose your developer</h2>
                <p className="text-[15px] leading-relaxed text-body">
                  Invite people from your matches. The first to accept joins the project and agrees to these exact milestones.
                </p>
              </div>
              {invites.length > 0 && (
                <ul aria-label="Invitations sent" className="flex flex-col gap-2.5">
                  {invites.map((iv) => (
                    <li key={iv.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar initials={initialsOf(iv.name)} size="sm" />
                        <span className="font-semibold">{iv.name}</span>
                        <span className="text-sm text-muted">{iv.score}% match</span>
                      </span>
                      {iv.status === "pending" ? (
                        <span className="flex items-center gap-3">
                          <StatusBadge tone="alert">Waiting for reply</StatusBadge>
                          <WithdrawButton invitationId={iv.id} name={iv.name} />
                        </span>
                      ) : (
                        <StatusBadge tone="neutral">{iv.status === "declined" ? "Declined" : "Withdrawn"}</StatusBadge>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {hired && (
            <section aria-labelledby="dev-h" className="flex flex-wrap items-center gap-4 rounded-[18px] border-2 border-brand bg-white p-6">
              <Avatar initials={initialsOf(hired.name)} size="lg" />
              <div className="flex flex-col gap-1">
                <h2 id="dev-h" className="text-xl font-bold">
                  {hired.name} {p.status === "completed" ? "built this" : "is building this"}
                </h2>
                {hired.headline && <span className="text-[15px] text-body">{hired.headline}</span>}
                <span className="text-sm text-muted">{doneCount} of {milestones.length} milestones done</span>
              </div>
            </section>
          )}

          {p.status === "completed" && (
            <p role="status" className="rounded-[18px] bg-ink px-6 py-5 text-[17px] font-semibold text-white">
              🎉 Every milestone passed QA and was paid. Your project is complete.
            </p>
          )}

          <Card className="flex flex-col gap-4 p-6 md:p-7">
            <section aria-labelledby="ms-h" className="flex flex-col gap-4">
              <h2 id="ms-h" className="text-[22px] font-bold">Milestones</h2>
              <ol className="flex flex-col gap-3.5">
                {milestones.map((m) => {
                  const deadline = autoApproveAt(m);
                  return (
                    <MilestoneCard key={m.id} m={m} currency={p.currency}>
                      {nextToFund?.id === m.id && <FundButton milestoneId={m.id} position={m.position} amount={formatMoney(m.amount, p.currency)} paystack={paymentsEnabled()} />}
                      {m.status === "awaiting_approval" && deadline && (
                        <ApprovalPanel milestoneId={m.id} position={m.position} deadline={fmtDay(deadline)} />
                      )}
                      {m.status === "in_qa" && <p className="text-[15px] text-body">A Vouch reviewer is checking this against your list. You&apos;ll be asked to approve once it passes.</p>}
                      {(m.status === "funded" || m.status === "in_progress") && <p className="text-[15px] text-body">Your developer is working on this. It goes to QA when they hand it in.</p>}
                    </MilestoneCard>
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
              <div className="flex justify-between"><dt className="text-slate-300">Total plan</dt><dd className="font-bold">{formatMoney(total, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Held in escrow</dt><dd className="font-bold" data-testid="escrow-held">{formatMoney(held, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Released so far</dt><dd className="font-bold" data-testid="escrow-released">{formatMoney(paid, p.currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-300">Estimated time</dt><dd className="font-bold">{formatDays(days)}</dd></div>
            </dl>
            <p className="border-t border-slate-700 pt-3.5 text-sm text-slate-300">
              {p.status === "open"
                ? "Nothing is charged until you choose a developer and fund the first milestone."
                : p.status === "completed"
                  ? "Everything has been released. Thank you for building with Vouch."
                  : "You fund one milestone at a time. Money is only released after QA passes and you approve."}
            </p>
            <p className="text-xs text-slate-400">
              {paymentsEnabled() ? "Payments are processed securely by Paystack." : "Payments are simulated until Paystack is connected."}
            </p>
          </section>

          {log.length > 0 && (
            <Card className="flex flex-col gap-3.5 p-6">
              <h2 className="text-lg font-bold">Activity</h2>
              <ul aria-label="Activity" className="flex flex-col gap-3 text-sm text-body">
                {log.map((a) => (
                  <li key={a.id} className="flex flex-col gap-0.5">
                    <span>{a.message}</span>
                    <span className="text-xs text-muted">{fmtDay(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="rounded-[18px] bg-brand-soft px-6 py-5 text-sm leading-relaxed text-brand-deep">
            <strong>Protected.</strong> Your money is only released for work that passes QA against the checks you agreed.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default function ProjectPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <Workspace params={params} searchParams={searchParams} />
      </Protected>
    </>
  );
}
