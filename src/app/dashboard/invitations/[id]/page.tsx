import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { SkillTags } from "@/components/skill-picker";
import { Card } from "@/components/ui";
import { getSession } from "@/lib/session";
import { getInvitationForDeveloper, getProfile } from "@/lib/developers";
import { formatDays, formatMoney, totalsOf } from "@/lib/projects";
import { RespondButtons } from "./respond";

export const metadata: Metadata = { title: "Invitation" };

async function InvitationView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const data = session ? await getInvitationForDeveloper(id, session.user.id) : null;
  if (!data) notFound();
  const profile = await getProfile(session!.user.id);
  const { inv, p, milestones, clientName, company } = data;
  const t = totalsOf(milestones);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-2">
        <Link href="/dashboard" className="text-[15px] font-semibold text-brand no-underline">← Back to dashboard</Link>
        <h1 className="text-[30px] font-bold md:text-[34px]">{p.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-[15px] text-body">
          <span>From {company || clientName}</span>
          <StatusBadge tone="brand">{inv.score}% match</StatusBadge>
          {inv.status === "accepted" && <StatusBadge tone="ink">You&apos;re on this project</StatusBadge>}
          {inv.status === "accepted" && (
            <Link href={`/dashboard/projects/${p.id}`} className="font-semibold text-brand underline underline-offset-2">Open project workspace →</Link>
          )}
          {(inv.status === "declined" || inv.status === "withdrawn") && <StatusBadge tone="neutral">Closed</StatusBadge>}
        </div>
      </div>

      {p.summary && <p className="text-lg leading-relaxed text-body">{p.summary}</p>}

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        {[["Total budget", formatMoney(t.amount, p.currency)], ["Estimated time", formatDays(t.days)], ["Milestones", String(t.count)]].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white p-[18px]">
            <dt className="text-[13px] font-semibold text-muted">{k}</dt>
            <dd className="font-display text-[22px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>

      <Card className="flex flex-col gap-3 p-6">
        <h2 className="text-lg font-bold">Skills needed</h2>
        <SkillTags skills={p.skills} highlight={profile?.skills ?? []} />
        <p className="text-sm text-muted">Highlighted skills are on your profile.</p>
      </Card>

      <Card className="flex flex-col gap-4 p-6 md:p-7">
        <h2 className="text-[22px] font-bold">The plan you&apos;d agree to</h2>
        <ol className="flex flex-col gap-3.5">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-col gap-2.5 rounded-[14px] border border-line p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <h3 className="text-[17px] font-bold">{m.position} · {m.title}</h3>
                <span className="text-[15px] font-semibold text-muted">{formatMoney(m.amount, p.currency)} · {m.durationDays} day{m.durationDays === 1 ? "" : "s"}</span>
              </div>
              <ul className="list-disc pl-5 text-[15px] leading-[1.7] text-body">
                {m.criteria.map((c) => <li key={c}>{c}</li>)}
              </ul>
            </li>
          ))}
        </ol>
        <p className="rounded-[14px] bg-brand-soft px-5 py-4 text-[15px] text-brand-deep">
          Each milestone is funded into escrow before you start and released when it passes QA against these checks.
        </p>
      </Card>

      {inv.status === "pending" && p.status === "open" && <RespondButtons invitationId={inv.id} />}
      {inv.status === "pending" && p.status !== "open" && (
        <p className="rounded-[14px] border border-line bg-white px-5 py-4 text-body">This project has already found a developer.</p>
      )}
    </main>
  );
}

export default function InvitationPage({ params }: PageProps<"/dashboard/invitations/[id]">) {
  return (
    <>
      <AppHeader role="developer" active="dashboard" />
      <Protected role="developer" returnTo="/dashboard">
        <InvitationView params={params} />
      </Protected>
    </>
  );
}
