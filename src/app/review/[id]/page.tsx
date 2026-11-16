import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { ReviewerOnly } from "@/components/reviewer-gate";
import { MilestoneCard } from "@/components/milestone-card";
import { Card } from "@/components/ui";
import { DeliveryError, loadForReview } from "@/lib/delivery";
import { getSession } from "@/lib/session";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "QA review" };

async function Review({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  let data;
  try {
    data = await loadForReview(id);
  } catch (err) {
    if (err instanceof DeliveryError) notFound();
    throw err;
  }
  const { m, p } = data;
  if (!m) notFound();
  const conflict = session && (session.user.id === p.clientId || session.user.id === p.developerId);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-2">
        <Link href="/review" className="text-[15px] font-semibold text-brand no-underline">← Back to queue</Link>
        <h1 className="text-[30px] font-bold md:text-[34px]">Review: {p.title}</h1>
        {p.summary && <p className="text-[17px] text-body">{p.summary}</p>}
      </div>
      <ol className="flex flex-col">
        <MilestoneCard m={{ ...m, review: m.status === "in_qa" ? null : m.review }} currency={p.currency} showOwnerFeedback={false} />
      </ol>
      {m.status !== "in_qa" ? (
        <p className="rounded-[14px] border border-line bg-white px-5 py-4 text-body">This milestone has already been reviewed.</p>
      ) : conflict ? (
        <p className="rounded-[14px] border border-alert-line bg-alert-soft px-5 py-4 text-alert-dark">You can&apos;t review a project you&apos;re part of.</p>
      ) : (
        <Card className="p-6 md:p-7">
          <ReviewForm milestoneId={m.id} criteria={m.criteria} />
        </Card>
      )}
    </main>
  );
}

export default function ReviewPage({ params }: PageProps<"/review/[id]">) {
  return (
    <>
      <AppHeader role="reviewer" active="queue" />
      <ReviewerOnly returnTo="/review">
        <Review params={params} />
      </ReviewerOnly>
    </>
  );
}
