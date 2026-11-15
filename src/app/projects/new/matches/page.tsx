import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Stepper } from "@/components/stepper";
import { Avatar, ButtonLink, Card, Pill } from "@/components/ui";
import { Check } from "@/components/icons";
import { candidates, samplePlan } from "@/lib/data";

export const metadata: Metadata = { title: "Your matches" };

export default function MatchesPage() {
  return (
    <>
      <AppHeader active="new" />
      <Protected role="client" returnTo="/projects/new/matches">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-10">
        <Stepper current={3} />
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-col gap-2">
            <Link href="/projects/new" className="text-[15px] font-semibold text-brand no-underline">← Back to plan</Link>
            <h1 className="text-[30px] font-bold md:text-4xl">{candidates.length} matches for your chatbot</h1>
            <p className="text-[17px] text-body">Picked for proven work on projects like yours. Each card shows exactly why they fit.</p>
          </div>
          <label className="flex items-center gap-2.5 text-[15px] font-semibold">
            Sort by
            <select className="rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 font-normal">
              <option>Best fit</option><option>Lowest rate</option><option>Soonest available</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 rounded-[14px] border border-line bg-white px-5 py-4 text-sm">
          <span className="mr-1.5 font-semibold text-muted">Matched against your plan:</span>
          {samplePlan.skills.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-3 py-1.5 font-medium">{s}</span>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {candidates.map((p) => (
            <Card key={p.name} className="flex flex-wrap gap-7 p-6 md:p-7">
              <article className="contents">
                <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar initials={p.initials} size="lg" />
                    <div className="flex min-w-0 flex-col gap-1">
                      <h2 className="text-[22px] font-bold">{p.name}</h2>
                      <span className="text-[15px] text-body">{p.role}</span>
                      <span className="text-sm text-muted">{p.where}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill>✓ Work verified by Vouch</Pill>
                    <Pill tone="neutral">{p.available}</Pill>
                  </div>
                  <dl className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-xl bg-ground px-3.5 py-3"><dt className="text-xs font-semibold text-muted">Rate</dt><dd className="mt-0.5 text-[17px] font-bold">[RATE]/hr</dd></div>
                    <div className="rounded-xl bg-ground px-3.5 py-3"><dt className="text-xs font-semibold text-muted">Milestones passed QA</dt><dd className="mt-0.5 text-[17px] font-bold">[X] of [Y]</dd></div>
                  </dl>
                </div>

                <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-3">
                  <h3 className="text-base font-bold text-brand-dark">Why {p.first} fits</h3>
                  <ul className="flex flex-col gap-2.5 text-[15px] leading-normal text-body">
                    {p.why.map((w) => <li key={w} className="flex gap-2.5"><Check />{w}</li>)}
                  </ul>
                  <p className="rounded-[10px] bg-alert-soft px-3 py-2.5 text-sm text-alert-dark">{p.gap}</p>
                </div>

                <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-3">
                  <h3 className="text-base font-bold">Shipped work</h3>
                  {p.proof.map((pr) => (
                    <a key={pr} href="#" className="flex justify-between gap-2.5 rounded-xl border border-line px-3.5 py-3 text-[15px] font-medium text-ink no-underline hover:border-line-strong">
                      <span>{pr}</span><span aria-hidden="true" className="text-brand">↗</span>
                    </a>
                  ))}
                  <div className="mt-auto flex flex-col gap-2.5 pt-2">
                    <ButtonLink href={`/projects/${samplePlan.id}`} className="rounded-xl py-[13px]">Invite to project</ButtonLink>
                    <ButtonLink href="#" variant="secondary" className="rounded-xl">View full profile</ButtonLink>
                  </div>
                </div>
              </article>
            </Card>
          ))}
        </div>

        <p className="text-center text-[15px] text-muted">
          Not the right fit? <Link href="#" className="font-semibold text-brand">Ask for new matches</Link> — free, and nobody is notified.
        </p>
      </main>
      </Protected>
    </>
  );
}
