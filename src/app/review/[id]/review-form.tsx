"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { FormAlert } from "@/components/form-bits";
import { reviewAction } from "@/app/delivery-actions";

export function ReviewForm({ milestoneId, criteria }: { milestoneId: string; criteria: string[] }) {
  const [state, action, pending] = useActionState(reviewAction.bind(null, milestoneId, criteria), undefined);

  return (
    <form action={action} aria-label="QA review" className="flex flex-col gap-5">
      <h2 className="text-[22px] font-bold">Your review</h2>
      <p className="text-[15px] text-body">Open the demo and test each check yourself. If anything fails, say exactly what&apos;s wrong — the developer sees your note.</p>
      <ol className="flex flex-col gap-4">
        {criteria.map((c, i) => (
          <li key={c} className="flex flex-col gap-3 rounded-[14px] border border-line p-4">
            <fieldset className="flex flex-col gap-2.5">
              <legend className="mb-1 text-[15px] font-semibold">{i + 1}. {c}</legend>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-dark">
                  <input type="radio" name={`check-${i}`} value="pass" required className="mr-2 accent-brand" />Passed
                </label>
                <label className="cursor-pointer rounded-full border border-line-strong px-4 py-2 text-sm font-semibold has-[:checked]:border-alert has-[:checked]:bg-alert-soft has-[:checked]:text-alert-dark">
                  <input type="radio" name={`check-${i}`} value="fail" className="mr-2 accent-alert" />Failed
                </label>
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-semibold">
              Note <span className="font-normal text-muted">Required if it failed</span>
              <input name={`note-${i}`} maxLength={1000} className={inputClass} aria-label={`Note for check ${i + 1}`} />
            </label>
          </li>
        ))}
      </ol>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        <span>Summary <span className="text-[13px] font-normal text-muted">Optional, shown to both sides</span></span>
        <textarea name="summary" maxLength={2000} rows={2} className={`${inputClass} resize-y`} />
      </label>
      <FormAlert>{state?.error}</FormAlert>
      <Button type="submit" size="lg" className="self-start" disabled={pending}>{pending ? "Saving…" : "Submit review"}</Button>
    </form>
  );
}
