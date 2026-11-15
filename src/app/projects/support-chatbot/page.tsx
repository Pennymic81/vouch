import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Avatar, Button, Card, Pill } from "@/components/ui";
import { Check, LockIcon } from "@/components/icons";
import { samplePlan, type MilestoneStatus } from "@/lib/data";
import { MilestoneReview } from "./milestone-review";

export const metadata: Metadata = { title: "Customer support chatbot" };

const statusLabel: Record<MilestoneStatus, { text: string; row: string; color: string }> = {
  paid: { text: "✓ QA passed · Paid", row: "border-line", color: "text-brand-dark" },
  awaiting: { text: "Awaiting your approval", row: "border-alert-line bg-alert-soft", color: "text-alert-dark" },
  in_qa: { text: "In QA review", row: "border-alert-line bg-alert-soft", color: "text-alert-dark" },
  upcoming: { text: "Upcoming", row: "border-line", color: "text-muted" },
  unfunded: { text: "Not funded yet", row: "border-line", color: "text-muted" },
};

export default function ProjectPage() {
  const plan = samplePlan;
  const current = plan.milestones.find((m) => m.status === "awaiting")!;
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects/support-chatbot">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-col gap-2">
            <nav aria-label="Breadcrumb" className="text-sm font-semibold text-muted">Projects / {plan.title}</nav>
            <h1 className="text-[30px] font-bold md:text-[34px]">{plan.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-[15px] text-body">
              <span className="flex items-center gap-2"><Avatar initials="AO" size="sm" />Amara Okafor · AI engineer</span>
              <span className="flex items-center gap-1.5"><span aria-hidden="true" className="size-2 rounded-full bg-brand" />Active · last commit 3 hours ago</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button variant="secondary">Message Amara</Button>
            <Button variant="secondary">Open your repo ↗</Button>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-7">
          <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
            <MilestoneReview milestone={current} />

            <Card className="flex flex-col gap-4 p-6 md:p-7">
              <section aria-labelledby="ms-h" className="flex flex-col gap-4">
                <h2 id="ms-h" className="text-[22px] font-bold">All milestones</h2>
                <ol className="flex flex-col gap-2.5">
                  {plan.milestones.map((m) => {
                    const s = statusLabel[m.status];
                    const dim = m.status === "unfunded" || m.status === "upcoming";
                    return (
                      <li key={m.n} className={`flex flex-wrap justify-between gap-2.5 rounded-xl border px-[18px] py-4 ${s.row}`}>
                        <span className={`font-semibold ${dim ? "text-muted" : ""}`}>{m.n} · {m.title}</span>
                        <span className={`text-sm font-semibold ${s.color}`}>{s.text}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </Card>

            <Card className="flex flex-col gap-4 p-6 md:p-7">
              <section aria-labelledby="cr-h" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <h2 id="cr-h" className="text-[22px] font-bold">Change requests</h2>
                  <Button variant="secondary" size="sm">+ New request</Button>
                </div>
                <div className="flex flex-col gap-3 rounded-[14px] border border-line p-5">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-bold">Also answer Instagram DMs</span>
                    <span className="text-sm font-semibold text-muted">Estimate from Amara: [AMOUNT] · [X] days</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-body">
                    Adds Instagram as a third channel using the same answers. Becomes a new milestone 5 — nothing in the current plan changes.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <Button variant="dark" size="sm">Approve &amp; add milestone</Button>
                    <Button variant="secondary" size="sm">Decline</Button>
                  </div>
                </div>
              </section>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <section aria-labelledby="esc-h" className="flex flex-col gap-4 rounded-[18px] bg-ink p-6 text-white">
              <h2 id="esc-h" className="flex items-center gap-2.5 text-lg font-bold"><LockIcon className="size-5 text-brand-light" />Escrow</h2>
              <dl className="flex flex-col gap-4 text-[15px]">
                {[["Held for milestone 3", "[AMOUNT]"], ["Released so far", "[AMOUNT]"], ["Remaining in plan", "[AMOUNT]"]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><dt className="text-slate-300">{k}</dt><dd className="font-bold">{v}</dd></div>
                ))}
                <div className="flex justify-between border-t border-slate-700 pt-3.5"><dt className="text-slate-300">Vouch fee ([YOUR FEE]%)</dt><dd className="font-bold">[AMOUNT]</dd></div>
              </dl>
            </section>

            <Card className="flex flex-col gap-3.5 p-6">
              <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold">Weekly update</h2><span className="text-[13px] font-semibold text-muted">Friday</span></div>
              <p className="text-[15px] leading-relaxed text-body">WhatsApp is live on your number and hand-off works. Next week I&apos;ll start the analytics dashboard once milestone 4 is funded.</p>
              <span className="text-sm text-muted">— Amara</span>
            </Card>

            <Card className="flex flex-col gap-3.5 p-6">
              <h2 className="text-lg font-bold">Activity</h2>
              <ul className="flex flex-col gap-3 text-sm text-body">
                {[["QA passed milestone 3", "Today"], ["Amara pushed 6 commits to your repo", "Today"], ["Milestone 3 submitted for QA", "Yesterday"], ["You funded milestone 3", "Last week"]].map(([a, t]) => (
                  <li key={a} className="flex justify-between gap-2.5"><span>{a}</span><span className="shrink-0 text-muted">{t}</span></li>
                ))}
              </ul>
            </Card>

            <p className="rounded-[18px] bg-brand-soft px-6 py-5 text-sm leading-relaxed text-brand-deep">
              <strong>Protected.</strong> If your developer goes inactive for 7 days, we match a replacement and your escrow moves with the project.
            </p>
            <Pill tone="neutral" className="self-start"><Check className="mr-1.5 text-brand" />Code lives in your own repo</Pill>
          </aside>
        </div>
      </main>
      </Protected>
    </>
  );
}
