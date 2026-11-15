"use client";

import { useState } from "react";
import { Button, Pill } from "@/components/ui";
import type { Milestone } from "@/lib/data";

const qaChecks = [
  "Bot answers the 20 test questions on your WhatsApp Business number",
  '"Talk to a person" sends the chat to your staff inbox in under a minute',
  "Full chat history is attached to every hand-off",
];

export function MilestoneReview({ milestone }: { milestone: Milestone }) {
  const [state, setState] = useState<"pending" | "approved" | "changes">("pending");

  return (
    <section
      aria-labelledby="qa-h"
      className={`flex flex-col gap-5 rounded-[18px] border-2 bg-white p-6 md:p-7 ${
        state === "approved" ? "border-brand" : "border-alert-light"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          {state === "pending" && <Pill tone="alert" className="self-start font-bold">Needs your review · 4 days left</Pill>}
          {state === "approved" && <Pill className="self-start font-bold">✓ Approved · payment released</Pill>}
          {state === "changes" && <Pill tone="alert" className="self-start font-bold">Changes requested</Pill>}
          <h2 id="qa-h" className="text-2xl font-bold">Milestone {milestone.n} · {milestone.title}</h2>
        </div>
        <span className="font-display text-[22px] font-bold">{milestone.amount}</span>
      </div>

      <div className="flex flex-col gap-3 rounded-[14px] bg-ground p-5">
        <div className="flex flex-wrap justify-between gap-2">
          <h3 className="text-[17px] font-bold">QA report — passed</h3>
          <a href="#" className="text-sm font-semibold text-brand">Full report &amp; screenshots</a>
        </div>
        <ul className="flex flex-col gap-2.5 text-[15px] text-body">
          {qaChecks.map((c) => (
            <li key={c} className="flex gap-2.5"><span aria-hidden="true" className="font-bold text-brand">✓</span>{c}</li>
          ))}
        </ul>
        <span className="text-sm text-muted">Reviewed by a Vouch QA engineer · 3 of 3 criteria passed</span>
      </div>

      {state === "pending" ? (
        <>
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="secondary" className="rounded-xl px-5 py-3.5 text-base" onClick={() => setState("changes")}>
              Request changes
            </Button>
            <Button className="rounded-xl px-[22px] py-3.5 text-base" onClick={() => setState("approved")}>
              Approve &amp; release payment
            </Button>
          </div>
          <p className="text-sm text-muted">
            If you don&apos;t respond within the review window, this milestone is approved automatically because QA passed.
          </p>
        </>
      ) : (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 text-[15px] text-body">
          <span>
            {state === "approved"
              ? "Payment released to Amara. Milestone 4 is ready to fund."
              : "Amara has been notified with your notes. The payment stays in escrow."}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setState("pending")}>Undo</Button>
        </div>
      )}
    </section>
  );
}
