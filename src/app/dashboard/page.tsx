import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Button, ButtonLink, Card, Pill } from "@/components/ui";
import { invitations, samplePlan } from "@/lib/data";

export const metadata: Metadata = { title: "Developer dashboard" };

const stats = [
  { label: "Locked in escrow for you", value: "[AMOUNT]", note: "Guaranteed once QA passes" },
  { label: "Paid this month", value: "[AMOUNT]", note: "After [YOUR FEE]% platform fee" },
  { label: "Milestones passed QA", value: "[X] of [Y]", note: "Shown to clients on your profile" },
  { label: "Match rate (30 days)", value: "[X]%", note: "Of projects you were considered for" },
];

const misses = [
  { project: "Booking app for a clinic", reason: "No shipped mobile app in your proof" },
  { project: "Invoice automation", reason: "Client needed full US-hours overlap" },
];

const ratingQuestions = ["Clear scope", "Response time", "Reviewed on time"];

export default function DashboardPage() {
  return (
    <>
      <AppHeader role="developer" active="dashboard" />
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[30px] font-bold md:text-[34px]">Good morning, Amara</h1>
            <p className="text-[17px] text-body">1 milestone waiting on a client, {invitations.length} new invitations.</p>
          </div>
          <label className="flex items-center gap-2.5 text-[15px] font-semibold">
            Available for new work
            <input type="checkbox" defaultChecked className="size-[22px] accent-brand" />
          </label>
        </div>

        <dl className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5">
              <dt className="text-sm font-semibold text-muted">{s.label}</dt>
              <dd className="font-display text-[28px] font-bold">{s.value}</dd>
              <dd className="text-[13px] text-muted">{s.note}</dd>
            </div>
          ))}
        </dl>

        <div className="flex flex-wrap items-start gap-7">
          <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
            <Card className="flex flex-col gap-4 p-6 md:p-7">
              <section aria-labelledby="inv-h" className="flex flex-col gap-4">
                <h2 id="inv-h" className="text-[22px] font-bold">New invitations</h2>
                {invitations.map((iv) => (
                  <article key={iv.title} className="flex flex-col gap-3 rounded-[14px] border border-line p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div className="flex flex-col gap-1"><h3 className="text-lg font-bold">{iv.title}</h3><span className="text-sm text-muted">{iv.client}</span></div>
                      <Pill>Spec ready · {iv.milestones} milestones</Pill>
                    </div>
                    <p className="text-[15px] leading-relaxed text-body">{iv.summary}</p>
                    <div className="flex flex-wrap gap-x-[18px] gap-y-1 text-sm text-body">
                      <span><strong>Budget:</strong> [MIN] – [MAX]</span>
                      <span><strong>Timeline:</strong> [X] weeks</span>
                      <span><strong>Why you:</strong> {iv.why}</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <Button size="sm">Read spec &amp; accept</Button>
                      <Button size="sm" variant="secondary">Decline</Button>
                    </div>
                  </article>
                ))}
              </section>
            </Card>

            <Card className="flex flex-col gap-4 p-6 md:p-7">
              <section aria-labelledby="act-h" className="flex flex-col gap-4">
                <h2 id="act-h" className="text-[22px] font-bold">Active projects</h2>
                <div className="flex flex-col gap-3.5 rounded-[14px] border border-line p-5">
                  <div className="flex flex-wrap justify-between gap-2.5">
                    <span className="text-[17px] font-bold">{samplePlan.title}</span>
                    <span className="text-sm text-muted">Furniture store · 3 of 4 milestones</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={75} aria-valuemin={0} aria-valuemax={100} aria-label="Project progress">
                    <div className="h-full w-3/4 bg-brand" />
                  </div>
                  <div className="flex flex-wrap justify-between gap-2 rounded-[10px] bg-alert-soft px-3.5 py-3 text-sm text-alert-dark">
                    <span>Milestone 3 passed QA — waiting on client approval</span>
                    <span className="font-semibold">Auto-approves in 4 days</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <ButtonLink href={`/projects/${samplePlan.id}`} variant="secondary" size="sm">Open project</ButtonLink>
                    <Button variant="secondary" size="sm">Post weekly update</Button>
                  </div>
                </div>
              </section>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
            <Card className="flex flex-col gap-3.5 p-6">
              <h2 className="text-lg font-bold">Why you weren&apos;t matched</h2>
              <p className="text-sm leading-relaxed text-muted">Projects you were considered for this month, and what decided it.</p>
              <ul className="flex flex-col gap-3 text-sm text-body">
                {misses.map((m) => (
                  <li key={m.project} className="flex flex-col gap-1 rounded-xl border border-line px-3.5 py-3"><strong className="text-ink">{m.project}</strong><span>{m.reason}</span></li>
                ))}
              </ul>
              <a href="#" className="text-sm font-semibold text-brand">Add proof to your profile →</a>
            </Card>

            <Card className="flex flex-col gap-3.5 p-6">
              <h2 className="text-lg font-bold">Rate your last client</h2>
              <span className="text-sm text-muted">Event ticketing site · completed</span>
              <fieldset className="flex flex-col gap-2.5">
                <legend className="mb-2.5 text-sm font-semibold">How did they do?</legend>
                {ratingQuestions.map((q) => (
                  <label key={q} className="flex items-center justify-between gap-2.5 text-sm">
                    {q}
                    <select className="rounded-lg border border-line-strong bg-white px-2.5 py-2">
                      <option>Choose</option><option>Great</option><option>OK</option><option>Poor</option>
                    </select>
                  </label>
                ))}
              </fieldset>
              <Button variant="dark" size="sm">Submit rating</Button>
            </Card>

            <p className="rounded-[18px] bg-brand-soft px-6 py-5 text-sm leading-relaxed text-brand-deep">
              <strong>No bidding, ever.</strong> You&apos;re matched on your proof. No credits to buy, no unpaid test tasks.
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
