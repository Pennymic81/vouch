import type { ReactNode } from "react";
import type { MilestoneDetail } from "@/lib/delivery";
import { formatMoney } from "@/lib/projects";

export const STATUS: Record<MilestoneDetail["status"], { label: string; tone: "muted" | "brand" | "alert" | "done" }> = {
  planned: { label: "Not funded yet", tone: "muted" },
  funded: { label: "Funded · in progress", tone: "brand" },
  in_progress: { label: "In progress", tone: "brand" },
  in_qa: { label: "In QA review", tone: "alert" },
  awaiting_approval: { label: "QA passed · awaiting approval", tone: "alert" },
  changes_requested: { label: "Changes requested", tone: "alert" },
  paid: { label: "✓ Approved · paid", tone: "done" },
};

const toneClass = {
  muted: "bg-slate-100 text-body",
  brand: "bg-brand-soft text-brand-dark",
  alert: "bg-alert-soft text-alert-dark",
  done: "bg-brand text-white",
};

export function MilestoneStatus({ status }: { status: MilestoneDetail["status"] }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold ${toneClass[s.tone]}`}>
      {s.label}
    </span>
  );
}

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
}

/** The QA verdict, check by check. */
export function QaReport({ review }: { review: NonNullable<MilestoneDetail["review"]> }) {
  const passedCount = review.checks.filter((c) => c.passed).length;
  return (
    <section
      aria-label="QA report"
      className={`flex flex-col gap-3 rounded-[14px] p-4 ${review.passed ? "bg-brand-soft" : "bg-alert-soft"}`}
    >
      <h4 className={`text-[15px] font-bold ${review.passed ? "text-brand-deep" : "text-alert-dark"}`}>
        QA report — {review.passed ? "passed" : "issues found"} · {passedCount} of {review.checks.length} checks
      </h4>
      <ul className="flex flex-col gap-2 text-[15px]">
        {review.checks.map((c) => (
          <li key={c.criterion} className="flex flex-col gap-0.5">
            <span className="flex gap-2.5">
              <span aria-hidden="true" className={`font-bold ${c.passed ? "text-brand" : "text-alert"}`}>{c.passed ? "✓" : "✗"}</span>
              <span className="text-ink">
                {c.criterion}
                <span className="sr-only">{c.passed ? " — passed" : " — failed"}</span>
              </span>
            </span>
            {c.note && <span className={`pl-6 text-sm ${c.passed ? "text-body" : "text-alert-dark"}`}>{c.note}</span>}
          </li>
        ))}
      </ul>
      {review.summary && <p className="text-sm text-body"><strong>Reviewer:</strong> {review.summary}</p>}
    </section>
  );
}

export function MilestoneCard({
  m,
  currency,
  children,
  showOwnerFeedback = true,
}: {
  m: MilestoneDetail;
  currency: string;
  children?: ReactNode;
  showOwnerFeedback?: boolean;
}) {
  const active = m.status !== "planned" && m.status !== "paid";
  return (
    <li
      aria-label={`Milestone ${m.position}: ${m.title}`}
      className={`flex flex-col gap-3.5 rounded-[14px] border p-5 ${active ? "border-2 border-brand-tint bg-white" : "border-line bg-white"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="text-[17px] font-bold">{m.position} · {m.title}</h3>
          <span className="text-sm text-muted">
            {formatMoney(m.amount, currency)} · {m.durationDays} day{m.durationDays === 1 ? "" : "s"}
            {m.paidAt && ` · paid ${fmtDate(m.paidAt)}${m.autoApproved ? " (auto-approved)" : ""}`}
          </span>
        </div>
        <MilestoneStatus status={m.status} />
      </div>

      <div className="flex flex-col gap-1.5">
        <h4 className="text-sm font-semibold text-muted">What &quot;done&quot; means</h4>
        <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-body">
          {m.criteria.map((c) => <li key={c}>{c}</li>)}
        </ul>
      </div>

      {m.latest && (
        <section aria-label="Latest delivery" className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-ground p-4 text-[15px]">
          <h4 className="text-sm font-semibold text-muted">
            Delivered{m.latest.round > 1 ? ` (round ${m.latest.round})` : ""} · {fmtDate(m.latest.createdAt)}
          </h4>
          <p className="whitespace-pre-line text-body">{m.latest.note}</p>
          <a href={m.latest.demoUrl} target="_blank" rel="noopener noreferrer nofollow" className="self-start font-semibold text-brand underline underline-offset-2">
            Open the demo ↗
          </a>
        </section>
      )}

      {m.review && <QaReport review={m.review} />}

      {showOwnerFeedback && m.ownerFeedback && m.status === "changes_requested" && (
        <section aria-label="Owner feedback" className="rounded-[14px] bg-alert-soft p-4 text-[15px] text-alert-dark">
          <h4 className="font-bold">The owner asked for changes</h4>
          <p className="mt-1 whitespace-pre-line">{m.ownerFeedback}</p>
        </section>
      )}

      {children}
    </li>
  );
}
