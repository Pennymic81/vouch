"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { FormAlert } from "@/components/form-bits";
import { writePlanWithAi } from "../../actions";

function Sparkle({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
    </svg>
  );
}

export function AiPanel({
  projectId,
  configured,
  hasMilestones,
  questions,
  remaining,
}: {
  projectId: string;
  configured: boolean;
  hasMilestones: boolean;
  questions: { question: string; answer?: string }[];
  remaining: number;
}) {
  const [state, action, pending] = useActionState(writePlanWithAi.bind(null, projectId), undefined);

  if (!configured) {
    return (
      <p className="rounded-[14px] border border-line bg-ground px-5 py-4 text-[15px] text-body">
        AI planning is unavailable right now. You can still add milestones yourself below.
      </p>
    );
  }

  const openQuestions = questions.filter((q) => !q.answer);

  return (
    <section aria-labelledby="ai-h" className="flex flex-col gap-4 rounded-[16px] border-2 border-brand-tint bg-gradient-to-b from-brand-soft to-white p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="ai-h" className="flex items-center gap-2 text-lg font-bold text-brand-deep">
            <Sparkle className="size-5 text-brand" />
            {hasMilestones ? "AI plan assistant" : "Let AI write your plan"}
          </h2>
          <p className="text-[15px] leading-relaxed text-body">
            {hasMilestones
              ? "Answer the questions below or rewrite the plan from your description. You can edit every milestone afterwards."
              : "We'll read your description and draft milestones, checks, prices and timings. You can edit everything afterwards."}
          </p>
        </div>
        <span className="text-sm text-muted">{remaining} rewrite{remaining === 1 ? "" : "s"} left</span>
      </div>

      <form
        action={action}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          if (hasMilestones && openQuestions.length === 0 && !confirm("Rewrite the plan? This replaces your current milestones.")) {
            e.preventDefault();
          }
        }}
      >
        {openQuestions.length > 0 && hasMilestones && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-2 text-[15px] font-semibold">A few questions to sharpen the plan</legend>
            {questions.map((q, i) =>
              q.answer ? null : (
                <label key={q.question} className="flex flex-col gap-1.5 text-[15px] font-medium">
                  {q.question}
                  <input name={`answer-${i}`} maxLength={500} className={inputClass} placeholder="Your answer (optional)" />
                </label>
              ),
            )}
          </fieldset>
        )}

        <FormAlert>{state?.error}</FormAlert>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={pending || remaining <= 0} className="gap-2 disabled:opacity-70">
            <Sparkle className="size-4" />
            {pending
              ? "Writing your plan…"
              : !hasMilestones
                ? "Write my plan with AI"
                : openQuestions.length > 0
                  ? "Update plan with my answers"
                  : "Rewrite with AI"}
          </Button>
          <span role="status" aria-live="polite" className="text-sm text-muted">
            {pending ? "This usually takes 10–30 seconds." : state?.ok ? "✓ Plan updated — check the milestones below." : ""}
          </span>
        </div>
      </form>
    </section>
  );
}
