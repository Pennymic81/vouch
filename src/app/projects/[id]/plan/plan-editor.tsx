"use client";

import { useActionState, useState, useTransition } from "react";
import { Button, inputClass } from "@/components/ui";
import { FieldError, FormAlert } from "@/components/form-bits";
import {
  addMilestone,
  deleteMilestone,
  deleteProject,
  moveMilestone,
  publishProject,
  updateMilestone,
  updateProjectDetails,
  type FormState,
} from "../../actions";

type MilestoneData = { id: string; title: string; criteria: string[]; amount: number; durationDays: number };

const money = (n: number, currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

// ── Project details ───────────────────────────────────────────────

export function ProjectDetailsForm({ projectId, title, idea, summary }: { projectId: string; title: string; idea: string; summary: string }) {
  const [state, action, pending] = useActionState(updateProjectDetails.bind(null, projectId), undefined);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Project name
        <input name="title" defaultValue={title} required minLength={3} maxLength={100} aria-invalid={!!e.title} className={inputClass} />
        <FieldError id="d-title-error" message={e.title} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Describe it in your own words
        <textarea name="idea" defaultValue={idea} required minLength={20} maxLength={5000} rows={7} aria-invalid={!!e.idea} className={`${inputClass} resize-y text-base leading-relaxed`} />
        <FieldError id="d-idea-error" message={e.idea} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        <span>One-line summary <span className="text-[13px] font-normal text-muted">Optional — shown to developers</span></span>
        <textarea name="summary" defaultValue={summary} maxLength={600} rows={3} className={`${inputClass} resize-y`} />
        <FieldError id="d-summary-error" message={e.summary} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="dark" disabled={pending}>{pending ? "Saving…" : "Save details"}</Button>
        {state?.ok && !pending && <span role="status" className="text-sm font-semibold text-brand-dark">✓ Saved</span>}
      </div>
    </form>
  );
}

// ── Milestone form (add + edit) ───────────────────────────────────

function MilestoneFields({ state, prefix, initial }: { state: FormState; prefix: string; initial?: MilestoneData }) {
  const e = state?.fieldErrors ?? {};
  const id = (f: string) => `${prefix}-${f}`;
  return (
    <>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Milestone name
        <input name="title" defaultValue={initial?.title} required minLength={3} maxLength={120} placeholder="e.g. Chat widget on your website" aria-invalid={!!e.title} aria-describedby={e.title ? id("title") : undefined} className={inputClass} />
        <FieldError id={id("title")} message={e.title} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        <span>What &quot;done&quot; means <span className="text-[13px] font-normal text-muted">One check per line</span></span>
        <textarea
          name="criteria"
          defaultValue={initial?.criteria.join("\n")}
          required
          rows={3}
          placeholder={"Widget appears on every page and works on phones\nMatches your brand colors and logo"}
          aria-invalid={!!e.criteria}
          aria-describedby={e.criteria ? id("criteria") : undefined}
          className={`${inputClass} resize-y`}
        />
        <FieldError id={id("criteria")} message={e.criteria} />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Amount (USD)
          <input name="amount" type="number" inputMode="numeric" min={1} max={1000000} step={1} defaultValue={initial?.amount} required aria-invalid={!!e.amount} aria-describedby={e.amount ? id("amount") : undefined} className={inputClass} />
          <FieldError id={id("amount")} message={e.amount} />
        </label>
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Days to complete
          <input name="durationDays" type="number" inputMode="numeric" min={1} max={365} step={1} defaultValue={initial?.durationDays} required aria-invalid={!!e.durationDays} aria-describedby={e.durationDays ? id("days") : undefined} className={inputClass} />
          <FieldError id={id("days")} message={e.durationDays} />
        </label>
      </div>
      <FormAlert>{state?.error}</FormAlert>
    </>
  );
}

export function NewMilestoneForm({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addMilestone.bind(null, projectId), undefined);
  const [seen, setSeen] = useState(state);
  const [formKey, setFormKey] = useState(0);

  // After a successful add, remount the form so it's empty for the next milestone.
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setFormKey((k) => k + 1);
  }

  if (!open) {
    return (
      <Button variant="secondary" className="self-start" onClick={() => setOpen(true)}>
        + Add a milestone
      </Button>
    );
  }
  return (
    <form key={formKey} action={action} aria-label="New milestone" className="flex flex-col gap-4 rounded-[14px] border-2 border-brand-tint bg-ground p-5">
      <h3 className="text-lg font-bold">New milestone</h3>
      <MilestoneFields state={state} prefix="new" />
      <div className="flex flex-wrap gap-2.5">
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add milestone"}</Button>
        <Button variant="secondary" onClick={() => setOpen(false)}>Done</Button>
      </div>
    </form>
  );
}

export function MilestoneEditor({ milestone, index, count, currency }: { milestone: MilestoneData; index: number; count: number; currency: string }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateMilestone.bind(null, milestone.id), undefined);
  const [busy, startTransition] = useTransition();

  const [seen, setSeen] = useState(state);
  // Close the editor once a save succeeds.
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setEditing(false);
  }

  const n = index + 1;

  if (editing) {
    return (
      <li className="rounded-[14px] border-2 border-brand-tint p-5">
        <form action={action} aria-label={`Edit milestone ${n}`} className="flex flex-col gap-4">
          <MilestoneFields state={state} prefix={`m${n}`} initial={milestone} />
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save milestone"}</Button>
            <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2.5 rounded-[14px] border border-line p-5" aria-busy={busy}>
      <div className="flex flex-wrap justify-between gap-2">
        <h3 className="text-[17px] font-bold">{n} · {milestone.title}</h3>
        <span className="text-[15px] font-semibold text-muted">
          {money(milestone.amount, currency)} · {milestone.durationDays} day{milestone.durationDays === 1 ? "" : "s"}
        </span>
      </div>
      <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-body">
        {milestone.criteria.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)} aria-label={`Edit milestone ${n}`}>Edit</Button>
        <Button variant="secondary" size="sm" disabled={index === 0 || busy} onClick={() => startTransition(() => moveMilestone(milestone.id, "up"))} aria-label={`Move milestone ${n} up`}>↑</Button>
        <Button variant="secondary" size="sm" disabled={index === count - 1 || busy} onClick={() => startTransition(() => moveMilestone(milestone.id, "down"))} aria-label={`Move milestone ${n} down`}>↓</Button>
        <Button
          variant="secondary"
          size="sm"
          className="text-alert-dark"
          disabled={busy}
          aria-label={`Delete milestone ${n}`}
          onClick={() => {
            if (confirm(`Delete milestone ${n}, “${milestone.title}”?`)) startTransition(() => deleteMilestone(milestone.id));
          }}
        >
          Delete
        </Button>
      </div>
    </li>
  );
}

// ── Publish / delete ──────────────────────────────────────────────

export function PublishBar({ projectId, canPublish }: { projectId: string; canPublish: boolean }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-6">
      <FormAlert>{error}</FormAlert>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          className="text-alert-dark"
          disabled={pending}
          onClick={() => {
            if (confirm("Delete this draft project? This can't be undone.")) startTransition(() => deleteProject(projectId));
          }}
        >
          Delete draft
        </Button>
        <div className="flex flex-col items-end gap-1.5">
          <Button
            size="lg"
            className="rounded-xl px-[22px] py-3.5 text-base disabled:opacity-60"
            disabled={pending || !canPublish}
            aria-describedby={!canPublish ? "publish-hint" : undefined}
            onClick={() =>
              startTransition(async () => {
                const res = await publishProject(projectId);
                if (res?.error) setError(res.error);
              })
            }
          >
            {pending ? "Publishing…" : "Approve plan & find matches"}
          </Button>
          {!canPublish && <span id="publish-hint" className="text-sm text-muted">Add at least one milestone first.</span>}
        </div>
      </div>
    </div>
  );
}
