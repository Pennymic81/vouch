"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { FieldError, FormAlert } from "@/components/form-bits";
import { createProject } from "../actions";

export function NewProjectForm() {
  const [state, action, pending] = useActionState(createProject, undefined);
  const e = state?.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Project name
        <input
          name="title"
          required
          minLength={3}
          maxLength={100}
          placeholder="e.g. Customer support chatbot"
          aria-invalid={!!e.title}
          aria-describedby={e.title ? "title-error" : undefined}
          className={inputClass}
        />
        <FieldError id="title-error" message={e.title} />
      </label>
      <label className="flex flex-col gap-2 text-[15px] font-semibold">
        Describe your idea
        <textarea
          name="idea"
          required
          minLength={20}
          maxLength={5000}
          rows={8}
          placeholder="I run an online furniture store. Customers keep asking the same questions about delivery and returns…"
          aria-invalid={!!e.idea}
          aria-describedby={e.idea ? "idea-error" : undefined}
          className={`${inputClass} resize-y text-base leading-relaxed`}
        />
        <FieldError id="idea-error" message={e.idea} />
      </label>
      <FormAlert>{state?.error}</FormAlert>
      <Button type="submit" size="lg" className="self-start disabled:opacity-70" disabled={pending}>
        {pending ? "Creating…" : "Continue to plan"}
      </Button>
    </form>
  );
}
