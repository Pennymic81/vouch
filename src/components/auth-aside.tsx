import { Logo } from "./logo";

export function AuthAside({ title, body }: { title: string; body: string }) {
  return (
    <aside className="flex min-w-0 flex-[1_1_420px] flex-col justify-between gap-12 bg-ink p-8 text-white md:p-12">
      <Logo dark />
      <div className="flex max-w-[460px] flex-col gap-5">
        <p className="font-display text-[34px] font-bold leading-[1.1] md:text-[44px]">{title}</p>
        <p className="text-lg leading-relaxed text-slate-300">{body}</p>
      </div>
      <ul className="flex flex-col gap-3.5 text-base text-slate-200">
        {["Escrow-protected milestone payments", "Independent QA review on every milestone", "One flat fee, shown upfront"].map((t) => (
          <li key={t} className="flex gap-3">
            <span aria-hidden="true" className="font-bold text-brand-light">✓</span>
            {t}
          </li>
        ))}
      </ul>
    </aside>
  );
}
