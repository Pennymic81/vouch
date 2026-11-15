export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  const items = ["Describe", "Review plan", "Get matched"];
  return (
    <ol aria-label="Progress" className="flex flex-wrap items-center gap-3 text-[15px] font-semibold">
      {items.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const now = n === current;
        return (
          <li key={label} aria-current={now ? "step" : undefined} className="flex items-center gap-3">
            {i > 0 && <span aria-hidden="true" className="text-line-strong">—</span>}
            <span className={`flex items-center gap-2.5 ${done ? "text-brand-dark" : now ? "text-ink" : "text-muted"}`}>
              <span
                className={`flex size-7 items-center justify-center rounded-full text-[13px] ${
                  done ? "bg-brand text-white" : now ? "border-2 border-brand text-brand-dark" : "border-2 border-line-strong"
                }`}
              >
                {done ? "✓" : n}
              </span>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
