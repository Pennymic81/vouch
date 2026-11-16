import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { ReviewerOnly } from "@/components/reviewer-gate";
import { qaQueue } from "@/lib/delivery";

export const metadata: Metadata = { title: "QA queue" };

const fmt = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d) : "—");

async function Queue() {
  const items = await qaQueue();
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold md:text-[34px]">QA queue</h1>
        <p className="text-[17px] text-body">Milestones waiting for review, oldest first. Check each one against exactly what both sides agreed.</p>
      </div>
      {items.length === 0 ? (
        <p className="rounded-[18px] border border-dashed border-line-strong bg-white px-6 py-14 text-center text-body">Nothing waiting for review. 🎉</p>
      ) : (
        <ul aria-label="Waiting for QA" className="flex flex-col gap-3">
          {items.map(({ m, p }) => (
            <li key={m.id}>
              <Link href={`/review/${m.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line bg-white p-5 text-ink no-underline hover:border-line-strong">
                <span className="flex flex-col gap-1">
                  <span className="text-[17px] font-bold">{p.title} · milestone {m.position}</span>
                  <span className="text-[15px] text-body">{m.title} · {m.criteria.length} check{m.criteria.length === 1 ? "" : "s"}</span>
                </span>
                <span className="text-sm text-muted">Submitted {fmt(m.submittedAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function QueuePage() {
  return (
    <>
      <AppHeader role="reviewer" active="queue" />
      <ReviewerOnly returnTo="/review">
        <Queue />
      </ReviewerOnly>
    </>
  );
}
