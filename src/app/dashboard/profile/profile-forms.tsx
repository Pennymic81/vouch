"use client";

import { useActionState, useState, useTransition } from "react";
import { Button, inputClass } from "@/components/ui";
import { FieldError, FormAlert } from "@/components/form-bits";
import { SkillPicker, SkillTags } from "@/components/skill-picker";
import { addProof, deleteProof, saveProfile } from "../actions";

type ProfileData = { headline: string; bio: string; location: string; hourlyRate: number; available: boolean; skills: string[] };

export function ProfileForm({ initial }: { initial: ProfileData | null }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const e = state?.fieldErrors ?? {};
  return (
    <form action={action} aria-label="Your profile" className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Headline
        <input name="headline" defaultValue={initial?.headline} required minLength={5} maxLength={120} placeholder="AI engineer · chatbots on your own data" aria-invalid={!!e.headline} className={inputClass} />
        <FieldError id="headline-error" message={e.headline} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        <span>About you <span className="text-[13px] font-normal text-muted">What you build and how you work with clients</span></span>
        <textarea name="bio" defaultValue={initial?.bio} maxLength={1500} rows={4} className={`${inputClass} resize-y`} />
        <FieldError id="bio-error" message={e.bio} />
      </label>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Location &amp; time zone
          <input name="location" defaultValue={initial?.location} maxLength={80} placeholder="Lagos · GMT+1" className={inputClass} />
        </label>
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Hourly rate (USD)
          <input name="hourlyRate" type="number" inputMode="numeric" min={1} max={1000} step={1} required defaultValue={initial?.hourlyRate} aria-invalid={!!e.hourlyRate} className={inputClass} />
          <FieldError id="rate-error" message={e.hourlyRate} />
        </label>
      </div>
      <SkillPicker selected={initial?.skills ?? []} legend="Your skills" hint="Pick up to 10" error={e.skills} />
      <label className="flex items-center gap-3 text-[15px] font-semibold">
        <input type="checkbox" name="available" defaultChecked={initial ? initial.available : true} className="size-5 accent-brand" />
        Available for new projects
      </label>
      <FormAlert>{state?.error}</FormAlert>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : initial ? "Save profile" : "Create profile"}</Button>
        {state?.ok && !pending && <span role="status" className="text-sm font-semibold text-brand-dark">✓ Profile saved</span>}
      </div>
    </form>
  );
}

export function ProofForm() {
  const [state, action, pending] = useActionState(addProof, undefined);
  const [seen, setSeen] = useState(state);
  const [formKey, setFormKey] = useState(0);
  if (state !== seen) {
    setSeen(state);
    if (state?.ok) setFormKey((k) => k + 1);
  }
  const e = state?.fieldErrors ?? {};
  return (
    <form key={formKey} action={action} aria-label="Add shipped work" className="flex flex-col gap-4 rounded-[14px] border-2 border-brand-tint bg-ground p-5">
      <h3 className="text-lg font-bold">Add shipped work</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          What you built
          <input name="title" required minLength={3} maxLength={120} placeholder="Retail FAQ chatbot" aria-invalid={!!e.title} className={inputClass} />
          <FieldError id="proof-title-error" message={e.title} />
        </label>
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Link (demo, repo or case study)
          <input name="url" type="url" required placeholder="https://" aria-invalid={!!e.url} className={inputClass} />
          <FieldError id="proof-url-error" message={e.url} />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        <span>What it does <span className="text-[13px] font-normal text-muted">Optional</span></span>
        <textarea name="description" maxLength={600} rows={2} className={`${inputClass} resize-y`} />
      </label>
      <SkillPicker selected={[]} legend="Skills this work shows" error={e.skills} />
      <FormAlert>{state?.error}</FormAlert>
      <Button type="submit" className="self-start" disabled={pending}>{pending ? "Adding…" : "Add to my proof"}</Button>
    </form>
  );
}

export function ProofList({ proofs }: { proofs: { id: string; title: string; url: string; description: string; skills: string[] }[] }) {
  const [pending, startTransition] = useTransition();
  if (proofs.length === 0) {
    return <p className="rounded-[14px] border border-dashed border-line-strong px-5 py-6 text-center text-body">No shipped work yet.</p>;
  }
  return (
    <ul aria-label="Your shipped work" className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4" aria-busy={pending}>
      {proofs.map((p) => (
        <li key={p.id} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-5">
          <h3 className="text-[17px] font-bold">{p.title}</h3>
          <a href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="truncate text-sm font-medium text-brand underline underline-offset-2">
            {p.url}
          </a>
          {p.description && <p className="text-sm leading-relaxed text-body">{p.description}</p>}
          <SkillTags skills={p.skills} highlight={p.skills} />
          <Button
            variant="secondary"
            size="sm"
            className="mt-1 self-start text-alert-dark"
            aria-label={`Remove ${p.title}`}
            onClick={() => {
              if (confirm(`Remove “${p.title}” from your proof?`)) startTransition(() => deleteProof(p.id));
            }}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  );
}
