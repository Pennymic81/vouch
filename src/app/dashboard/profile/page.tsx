import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { getSession } from "@/lib/session";
import { getProfile, listProof, profileStrength } from "@/lib/developers";
import { ProfileForm, ProofForm, ProofList } from "./profile-forms";
import { appCurrency } from "@/lib/settings";

export const metadata: Metadata = { title: "Profile & proof" };

async function Profile() {
  const session = await getSession();
  if (!session) return null;
  const [profile, proofs] = await Promise.all([getProfile(session.user.id), listProof(session.user.id)]);
  const strength = profileStrength(profile, proofs.length);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold md:text-[34px]">Profile &amp; proof</h1>
        <p className="text-[17px] text-body">Clients are matched to you on the skills you list and the work you&apos;ve shipped.</p>
      </div>

      {!strength.matchable && (
        <p role="note" className="rounded-[14px] border border-alert-line bg-alert-soft px-5 py-4 text-[15px] text-alert-dark">
          <strong>You&apos;re not being matched yet.</strong> Save your profile, mark yourself available and add at least one piece of shipped work.
        </p>
      )}

      <div className="flex flex-wrap items-start gap-7">
        <section aria-labelledby="profile-h" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 rounded-[18px] border border-line bg-white p-6 md:p-7">
          <h2 id="profile-h" className="text-[22px] font-bold">Your profile</h2>
          <ProfileForm
            currency={appCurrency()}
            initial={
              profile
                ? { headline: profile.headline, bio: profile.bio, location: profile.location, hourlyRate: profile.hourlyRate, available: profile.available, skills: profile.skills }
                : null
            }
          />
        </section>

        <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          <section aria-labelledby="strength-h" className="flex flex-col gap-3.5 rounded-[18px] border border-line bg-white p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 id="strength-h" className="text-lg font-bold">Profile strength</h2>
              <span className="font-display text-xl font-bold text-brand-dark">{strength.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Profile strength" aria-valuenow={strength.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-brand" style={{ width: `${strength.percent}%` }} />
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {strength.checks.map((c) => (
                <li key={c.label} className={`flex gap-2 ${c.done ? "text-muted line-through" : "text-body"}`}>
                  <span aria-hidden="true" className={c.done ? "text-brand" : "text-line-strong"}>{c.done ? "✓" : "○"}</span>
                  <span>{c.label}{c.done ? <span className="sr-only"> (done)</span> : null}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section aria-labelledby="proof-h" className="flex flex-col gap-5 rounded-[18px] border border-line bg-white p-6 md:p-7">
        <div className="flex flex-col gap-1">
          <h2 id="proof-h" className="text-[22px] font-bold">Shipped work</h2>
          <p className="text-[15px] text-body">Live demos, repos or case studies. Proof counts most when we match you — tag each with the skills it shows.</p>
        </div>
        <ProofList proofs={proofs.map((p) => ({ id: p.id, title: p.title, url: p.url, description: p.description, skills: p.skills }))} />
        <ProofForm />
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <>
      <AppHeader role="developer" active="profile" />
      <Protected role="developer" returnTo="/dashboard/profile">
        <Profile />
      </Protected>
    </>
  );
}
