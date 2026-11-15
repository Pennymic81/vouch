import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Stepper } from "@/components/stepper";
import { ShieldIcon } from "@/components/icons";
import { getSession } from "@/lib/session";
import { formatDays, formatMoney, getProjectForClient, totalsOf } from "@/lib/projects";
import { MilestoneEditor, NewMilestoneForm, ProjectDetailsForm, PublishBar, SkillsForm } from "./plan-editor";
import { AiPanel } from "./ai-panel";
import { MAX_AI_GENERATIONS, aiConfigured } from "@/lib/ai/plan";

export const metadata: Metadata = { title: "Build your plan" };

async function Plan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const p = session ? await getProjectForClient(id, session.user.id) : null;
  if (!p) notFound();
  if (p.status !== "draft") redirect(`/projects/${p.id}`);
  const t = totalsOf(p.milestones);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 pb-20 pt-10">
      <Stepper current={2} />
      <div className="flex flex-wrap items-start gap-7">
        <section aria-labelledby="details-h" className="flex min-w-0 flex-[1_1_380px] flex-col gap-4 rounded-[18px] border border-line bg-white p-6 md:p-7">
          <h2 id="details-h" className="text-[22px] font-bold">Your idea</h2>
          <ProjectDetailsForm key={p.aiGenerations} projectId={p.id} title={p.title} idea={p.idea} summary={p.summary ?? ""} />
        </section>

        <section aria-labelledby="plan-h" className="flex min-w-0 flex-[999_1_620px] flex-col gap-7 rounded-[18px] border border-line bg-white p-6 md:p-8">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-brand">Draft plan</span>
            <h1 id="plan-h" className="text-[30px] font-bold">{p.title}</h1>
            <p className="text-base leading-relaxed text-body">
              Break the work into milestones. Each one is checked against what &quot;done&quot; means before any payment is released.
            </p>
          </div>

          <AiPanel
            projectId={p.id}
            configured={aiConfigured()}
            hasMilestones={p.milestones.length > 0}
            questions={p.aiQuestions ?? []}
            remaining={Math.max(0, MAX_AI_GENERATIONS - p.aiGenerations)}
          />

          {p.summary && (
            <p className="rounded-[14px] border border-line px-5 py-4 text-base leading-relaxed text-body">
              <span className="font-semibold text-ink">Summary: </span>
              {p.summary}
            </p>
          )}

          <dl className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
            {[
              ["Total budget", t.count ? formatMoney(t.amount, p.currency) : "—"],
              ["Estimated time", t.count ? formatDays(t.days) : "—"],
              ["Milestones", String(t.count)],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-ground p-[18px]">
                <dt className="text-[13px] font-semibold text-muted">{k}</dt>
                <dd className="font-display text-[22px] font-bold" data-testid={`total-${k.toLowerCase().replace(/\s/g, "-")}`}>{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3.5">
            <h2 className="text-xl font-bold">Milestones &amp; what &quot;done&quot; means</h2>
            {p.milestones.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-line-strong px-5 py-6 text-center text-body">
                No milestones yet. Add the first piece of work below.
              </p>
            ) : (
              <ol aria-label="Milestones" className="flex flex-col gap-3.5">
                {p.milestones.map((m, i) => (
                  <MilestoneEditor
                    key={m.id}
                    milestone={{ id: m.id, title: m.title, criteria: m.criteria, amount: m.amount, durationDays: m.durationDays }}
                    index={i}
                    count={p.milestones.length}
                    currency={p.currency}
                  />
                ))}
              </ol>
            )}
            <NewMilestoneForm projectId={p.id} />
          </div>

          <div className="flex gap-3 rounded-[14px] bg-brand-soft px-5 py-[18px] text-[15px] leading-relaxed text-brand-deep">
            <ShieldIcon className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>Each milestone is tested against these criteria by a Vouch QA reviewer before any payment is released. Your developer sees and agrees to the same plan.</span>
          </div>

          <div className="rounded-[14px] border border-line p-5">
            <SkillsForm key={p.aiGenerations} projectId={p.id} skills={p.skills} />
          </div>

          <PublishBar projectId={p.id} canPublish={p.milestones.length > 0 && p.skills.length > 0} />
        </section>
      </div>
    </main>
  );
}

export default function PlanPage({ params }: PageProps<"/projects/[id]/plan">) {
  return (
    <>
      <AppHeader active="projects" />
      <Protected role="client" returnTo="/projects">
        <Plan params={params} />
      </Protected>
    </>
  );
}
