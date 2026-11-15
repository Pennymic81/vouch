import { SKILLS } from "@/lib/skills";

/** Checkbox chips for the shared skill list. Works inside any <form>; values arrive as `name` entries. */
export function SkillPicker({
  name = "skills",
  selected,
  legend,
  hint,
  error,
}: {
  name?: string;
  selected: string[];
  legend: string;
  hint?: string;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2.5" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1 text-[15px] font-semibold">
        {legend} {hint && <span className="text-[13px] font-normal text-muted">{hint}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((s) => (
          <label
            key={s}
            className="cursor-pointer rounded-full border border-line-strong bg-white px-3.5 py-2 text-sm font-medium text-body transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-soft has-[:checked]:text-brand-dark has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand-tint"
          >
            <input type="checkbox" name={name} value={s} defaultChecked={selected.includes(s)} className="sr-only" />
            {s}
          </label>
        ))}
      </div>
      {error && (
        <span id={`${name}-error`} className="text-sm font-medium text-alert-dark">
          {error}
        </span>
      )}
    </fieldset>
  );
}

export function SkillTags({ skills, highlight = [] }: { skills: string[]; highlight?: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
      {skills.map((s) => (
        <li
          key={s}
          className={`rounded-full px-2.5 py-1 text-[13px] font-medium ${
            highlight.includes(s) ? "bg-brand-soft text-brand-dark" : "bg-slate-100 text-body"
          }`}
        >
          {s}
        </li>
      ))}
    </ul>
  );
}
