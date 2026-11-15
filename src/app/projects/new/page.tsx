import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { AlertIcon, ShieldIcon } from "@/components/icons";
import { Button, ButtonLink, Card, inputClass } from "@/components/ui";
import { samplePlan } from "@/lib/data";
import { Stepper } from "@/components/stepper";

export const metadata: Metadata = { title: "Plan your project" };


export default function NewProjectPage() {
  const plan = samplePlan;
  return (
    <>
      <AppHeader active="new" />
      <Protected role="client" returnTo="/projects/new">
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 pb-20 pt-10">
        <Stepper current={2} />
        <div className="flex flex-wrap items-start gap-7">
          <section aria-labelledby="idea-h" className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
            <Card className="flex flex-col gap-4 p-7">
              <h1 id="idea-h" className="text-[26px] font-bold">Your idea</h1>
              <label className="flex flex-col gap-2 text-[15px] font-semibold">
                Describe it in your own words
                <textarea rows={8} defaultValue={plan.idea} className={`${inputClass} resize-y text-base leading-relaxed`} />
              </label>
              <div className="flex flex-wrap gap-2.5">
                <Button variant="secondary">Attach files</Button>
                <Button variant="dark">Regenerate plan</Button>
              </div>
            </Card>

            <div className="flex flex-col gap-4 rounded-[18px] border border-alert-line bg-alert-soft p-6">
              <div className="flex items-center gap-2.5">
                <AlertIcon className="size-5 text-alert" />
                <h2 className="text-lg font-bold">2 quick questions to sharpen the plan</h2>
              </div>
              <label className="flex flex-col gap-2 text-[15px] font-semibold">
                Which channels should the bot answer on?
                <select className="rounded-[10px] border border-alert-light bg-white px-3.5 py-3 font-normal">
                  <option>Website and WhatsApp</option><option>Website only</option><option>WhatsApp only</option>
                </select>
              </label>
              <label className="flex flex-col gap-2 text-[15px] font-semibold">
                Should it check live stock levels?
                <select className="rounded-[10px] border border-alert-light bg-white px-3.5 py-3 font-normal">
                  <option>Yes — from our store system</option><option>No — policies only</option><option>Not sure yet</option>
                </select>
              </label>
            </div>
          </section>

          <Card className="flex min-w-0 flex-[999_1_620px] flex-col gap-7 p-6 md:p-8">
            <section aria-labelledby="plan-h" className="flex flex-col gap-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-brand">Draft plan · written by Vouch AI</span>
                  <h2 id="plan-h" className="text-[30px] font-bold">{plan.title}</h2>
                  <p className="max-w-[640px] text-base leading-relaxed text-body">{plan.summary}</p>
                </div>
                <Button variant="secondary" size="sm">Edit plan</Button>
              </div>

              <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
                {[["Budget range", plan.budget], ["Estimated time", plan.weeks], ["Best fit", plan.bestFit]].map(([k, v]) => (
                  <div key={k} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-ground p-[18px]">
                    <dt className="text-[13px] font-semibold text-muted">{k}</dt>
                    <dd className="font-display text-[22px] font-bold">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-col gap-3.5">
                <h3 className="text-xl font-bold">Milestones &amp; what &quot;done&quot; means</h3>
                <ol className="flex flex-col gap-3.5">
                  {plan.milestones.map((m) => (
                    <li key={m.n} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-5">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-[17px] font-bold">{m.n} · {m.title}</span>
                        <span className="text-[15px] font-semibold text-muted">{m.amount} · {m.days}</span>
                      </div>
                      <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-body">
                        {m.criteria.map((c) => <li key={c}>{c}</li>)}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3 rounded-[14px] bg-brand-soft px-5 py-[18px] text-[15px] leading-relaxed text-brand-deep">
                <ShieldIcon className="mt-0.5 size-5 shrink-0 text-brand" />
                <span>Each milestone is tested against these criteria by a Vouch QA reviewer before any payment is released. Your developer sees and agrees to the same plan.</span>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-6">
                <Button variant="secondary" className="rounded-xl px-5 py-3.5 text-base">Save draft</Button>
                <ButtonLink href="/projects/new/matches" className="rounded-xl px-[22px] py-3.5 text-base">Approve plan &amp; find matches</ButtonLink>
              </div>
            </section>
          </Card>
        </div>
      </main>
      </Protected>
    </>
  );
}
