import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { SkillTags } from "@/components/skill-picker";
import { ButtonLink, Card } from "@/components/ui";
import { firstNameOf, getSession } from "@/lib/session";
import { getProfile, invitationsForDeveloper, listProof, profileStrength } from "@/lib/developers";

export const metadata: Metadata = { title: "Developer dashboard" };

const statusTone = { pending: "alert", accepted: "brand", declined: "neutral", withdrawn: "neutral" } as const;
const statusText = { pending: "Waiting for you", accepted: "Accepted", declined: "Declined", withdrawn: "Closed" } as const;

async function Dashboard() {
  const session = await getSession();
  if (!session) return null;
  const me = session.user;
  const [profile, proofs, invites] = await Promise.all([getProfile(me.id), listProof(me.id), invitationsForDeveloper(me.id)]);
  const strength = profileStrength(profile, proofs.length);
  const pending = invites.filter((i) => i.status === "pending");
  const active = invites.filter((i) => i.status === "accepted");
  const past = invites.filter((i) => i.status === "declined" || i.status === "withdrawn");

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold md:text-[34px]">Welcome, {firstNameOf(me.name)}</h1>
        <p className="text-[17px] text-body">
          {pending.length === 0
            ? "No new invitations right now."
            : `${pending.length} new invitation${pending.length === 1 ? "" : "s"} waiting for you.`}
        </p>
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {[
          ["New invitations", String(pending.length), "Projects that want you"],
          ["Active projects", String(active.length), "Plans you've accepted"],
          ["Shipped work", String(proofs.length), "Pieces of proof on your profile"],
          ["Profile strength", `${strength.percent}%`, strength.matchable ? "You're being matched" : "Not matched yet"],
        ].map(([label, value, note]) => (
          <div key={label} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5">
            <dt className="text-sm font-semibold text-muted">{label}</dt>
            <dd className="font-display text-[28px] font-bold">{value}</dd>
            <dd className="text-[13px] text-muted">{note}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap items-start gap-7">
        <div className="flex min-w-0 flex-[999_1_620px] flex-col gap-5">
          <Card className="flex flex-col gap-4 p-6 md:p-7">
            <section aria-labelledby="inv-h" className="flex flex-col gap-4">
              <h2 id="inv-h" className="text-[22px] font-bold">New invitations</h2>
              {pending.length === 0 ? (
                <p className="rounded-[14px] border border-dashed border-line-strong px-5 py-6 text-center text-body">
                  When a business owner invites you, it shows up here with their full plan.
                </p>
              ) : (
                pending.map((iv) => (
                  <article key={iv.id} className="flex flex-col gap-3 rounded-[14px] border border-line p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2.5">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-lg font-bold">{iv.title}</h3>
                        <span className="text-sm text-muted">{iv.company || iv.clientName}</span>
                      </div>
                      <StatusBadge tone="brand">{iv.score}% match</StatusBadge>
                    </div>
                    {iv.summary && <p className="text-[15px] leading-relaxed text-body">{iv.summary}</p>}
                    <SkillTags skills={iv.skills} highlight={profile?.skills ?? []} />
                    <ButtonLink href={`/dashboard/invitations/${iv.id}`} size="sm" className="self-start">Read the plan</ButtonLink>
                  </article>
                ))
              )}
            </section>
          </Card>

          <Card className="flex flex-col gap-4 p-6 md:p-7">
            <section aria-labelledby="act-h" className="flex flex-col gap-4">
              <h2 id="act-h" className="text-[22px] font-bold">Active projects</h2>
              {active.length === 0 ? (
                <p className="text-body">Projects you accept will appear here.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {active.map((iv) => (
                    <li key={iv.id}>
                      <Link href={`/dashboard/projects/${iv.projectId}`} className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-line p-5 text-ink no-underline hover:border-line-strong">
                        <span className="text-[17px] font-bold">{iv.title}</span>
                        <span className="text-sm text-muted">{iv.company || iv.clientName}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Card>

          {past.length > 0 && (
            <Card className="flex flex-col gap-3 p-6 md:p-7">
              <h2 className="text-lg font-bold">Past invitations</h2>
              <ul className="flex flex-col gap-2 text-[15px]">
                {past.map((iv) => (
                  <li key={iv.id} className="flex flex-wrap justify-between gap-2">
                    <span>{iv.title}</span>
                    <StatusBadge tone={statusTone[iv.status]}>{statusText[iv.status]}</StatusBadge>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <Card className="flex flex-col gap-3.5 p-6">
            <h2 className="text-lg font-bold">Get matched more often</h2>
            <ul className="flex flex-col gap-2 text-sm">
              {strength.checks.filter((c) => !c.done).slice(0, 4).map((c) => (
                <li key={c.label} className="flex gap-2 text-body"><span aria-hidden="true" className="text-line-strong">○</span>{c.label}</li>
              ))}
              {strength.checks.every((c) => c.done) && <li className="text-body">Your profile is complete. Nice work.</li>}
            </ul>
            <ButtonLink href="/dashboard/profile" variant="secondary" size="sm" className="self-start">Edit profile &amp; proof</ButtonLink>
          </Card>
          <p className="rounded-[18px] bg-brand-soft px-6 py-5 text-sm leading-relaxed text-brand-deep">
            <strong>No bidding, ever.</strong> You&apos;re matched on your proof. No credits to buy, no unpaid test tasks.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <>
      <AppHeader role="developer" active="dashboard" />
      <Protected role="developer" returnTo="/dashboard">
        <Dashboard />
      </Protected>
    </>
  );
}
