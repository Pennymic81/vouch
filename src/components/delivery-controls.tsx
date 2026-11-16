"use client";

import { useActionState, useState, useTransition } from "react";
import { Button, inputClass } from "@/components/ui";
import { FieldError, FormAlert } from "@/components/form-bits";
import { approveAction, fundAction, requestChangesAction, submitAction, type ActionResult } from "@/app/delivery-actions";

function useAction(fn: () => Promise<ActionResult>) {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const run = () =>
    start(async () => {
      setError(undefined);
      const res = await fn();
      if (res?.error) setError(res.error);
    });
  return { error, pending, run };
}

// ── Owner ─────────────────────────────────────────────────────────

export function FundButton({ milestoneId, position, amount }: { milestoneId: string; position: number; amount: string }) {
  const { error, pending, run } = useAction(() => fundAction(milestoneId));
  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <p className="text-[15px] text-body">Funding puts {amount} into escrow. Your developer can start straight away, and nothing is released until QA passes and you approve.</p>
      <FormAlert>{error}</FormAlert>
      <Button className="self-start" disabled={pending} onClick={run} aria-label={`Fund milestone ${position}`}>
        {pending ? "Funding…" : `Fund milestone ${position} · ${amount}`}
      </Button>
    </div>
  );
}

export function ApprovalPanel({ milestoneId, position, deadline }: { milestoneId: string; position: number; deadline: string }) {
  const approve = useAction(() => approveAction(milestoneId));
  const [asking, setAsking] = useState(false);
  const [state, action, pending] = useActionState(requestChangesAction.bind(null, milestoneId), undefined);

  return (
    <section aria-label="Your decision" className="flex flex-col gap-3 border-t border-line pt-4">
      <p className="text-[15px] text-body">
        Try the demo and check the QA report. If you don&apos;t respond, this milestone is approved automatically on <strong>{deadline}</strong>.
      </p>
      <FormAlert>{approve.error}</FormAlert>
      {!asking ? (
        <div className="flex flex-wrap gap-3">
          <Button disabled={approve.pending} onClick={approve.run} aria-label={`Approve milestone ${position} and release payment`}>
            {approve.pending ? "Approving…" : "Approve & release payment"}
          </Button>
          <Button variant="secondary" onClick={() => setAsking(true)}>Request changes</Button>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3" aria-label="Request changes">
          <label className="flex flex-col gap-2 text-[15px] font-semibold">
            What needs to change?
            <textarea name="note" required minLength={10} maxLength={2000} rows={3} className={`${inputClass} resize-y`} aria-invalid={!!state?.fieldErrors?.note} />
            <FieldError id="note-error" message={state?.fieldErrors?.note} />
          </label>
          <FormAlert>{state?.error}</FormAlert>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="dark" disabled={pending}>{pending ? "Sending…" : "Send to developer"}</Button>
            <Button variant="secondary" onClick={() => setAsking(false)}>Cancel</Button>
          </div>
        </form>
      )}
    </section>
  );
}

// ── Developer ─────────────────────────────────────────────────────

export function SubmitForm({ milestoneId, position, resubmit }: { milestoneId: string; position: number; resubmit: boolean }) {
  const [state, action, pending] = useActionState(submitAction.bind(null, milestoneId), undefined);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} aria-label={`Submit milestone ${position}`} className="flex flex-col gap-3 border-t border-line pt-4">
      <h4 className="text-[15px] font-bold">{resubmit ? "Fix and resubmit" : "Hand in this milestone"}</h4>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        What you delivered
        <textarea
          name="note"
          required
          minLength={10}
          maxLength={3000}
          rows={3}
          placeholder="What's done, how to try it, anything the reviewer should know"
          aria-invalid={!!e.note}
          className={`${inputClass} resize-y`}
        />
        <FieldError id={`note-${position}-error`} message={e.note} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Demo link
        <input name="demoUrl" type="url" required placeholder="https://" aria-invalid={!!e.demoUrl} className={inputClass} />
        <FieldError id={`demo-${position}-error`} message={e.demoUrl} />
      </label>
      <FormAlert>{state?.error}</FormAlert>
      <Button type="submit" className="self-start" disabled={pending}>{pending ? "Submitting…" : "Submit for QA"}</Button>
    </form>
  );
}
