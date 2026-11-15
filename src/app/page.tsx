import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ButtonLink, Card, Eyebrow, Pill } from "@/components/ui";
import { Check, LinesIcon, LockIcon, ShieldIcon } from "@/components/icons";
import { samplePlan } from "@/lib/data";

const steps = [
  {
    title: "Describe it in plain words",
    body: 'Tell our AI scoping assistant what you want to build. It writes a clear plan: features, milestones, what "done" means for each one, and a budget range.',
  },
  {
    title: "Get matched on proof",
    body: "We match your plan to developers and AI engineers who have shipped similar work — and show you exactly why each one fits. No bidding wars, no AI-spam proposals.",
  },
  {
    title: "Build, check, then pay",
    body: "Your money waits in escrow. Each milestone is tested against the plan by a QA reviewer, and payment is released only when it passes.",
  },
];

const referee = [
  { title: "Plan agreed", body: "Both sides sign off on milestones and acceptance criteria." },
  { title: "Funds in escrow", body: "The client funds the next milestone before work starts." },
  { title: "Work delivered", body: "Code lands in the client's own repo with a demo." },
  { title: "QA check", body: "A reviewer tests it against the agreed criteria.", alert: true },
  { title: "Paid automatically", body: "Pass means the developer is paid — no chasing invoices.", final: true },
];

const clientPoints = [
  "A plan written for you, in words you understand",
  "Developers chosen on shipped work, not sales talk",
  "Pay only for milestones that pass QA",
  "Weekly progress updates — and a replacement if anyone goes silent",
  "New ideas mid-project? Approve a new estimate first. No surprise bills.",
];

const devPoints = [
  "Every project arrives with a written spec and acceptance criteria",
  "Funds are locked in escrow before you start",
  "No bidding, no paying to apply, no unpaid test tasks",
  "See why you were — or weren't — matched",
  "Rate clients too: scope clarity, response time, paying on time",
];

const faqs = [
  {
    q: "Who does the QA check?",
    a: "An independent Vouch reviewer tests each milestone against the acceptance criteria both sides agreed on, and shares a short report with screenshots.",
  },
  {
    q: "What if my developer stops responding?",
    a: "Your code is already in your own repository. If a developer goes inactive, we match a replacement and your escrowed funds move with the project.",
  },
  {
    q: "What if the client never reviews my milestone?",
    a: "If QA has passed and the client hasn't responded within the review window, the milestone is approved automatically and you're paid.",
  },
  {
    q: "What kinds of projects fit Vouch?",
    a: "Websites, internal tools, web and mobile apps, and AI products like chatbots, automations and assistants built on your own data.",
  },
];

const heroStatus = {
  paid: { label: "✓ Verified · Paid", row: "bg-white border-line", text: "text-brand-dark" },
  awaiting: { label: "In QA review", row: "bg-alert-soft border-alert-line", text: "text-alert-dark" },
  unfunded: { label: "Upcoming", row: "bg-white border-line", text: "text-muted" },
} as const;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-14 px-6 pb-24 pt-16 md:pt-[88px]">
            <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-7">
              <Pill className="self-start px-3.5 py-2 text-sm">For business owners who aren&apos;t technical</Pill>
              <h1 className="text-[40px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[60px]">
                Get your project built — and know it&apos;s built right.
              </h1>
              <p className="text-lg leading-relaxed text-body md:text-xl">
                Describe your idea in plain words. Vouch turns it into a clear plan, matches you with a
                proven developer or AI engineer, and checks every milestone before you pay.
              </p>
              <div className="flex flex-wrap gap-3">
                <ButtonLink href="/projects/new" size="lg">Start your project</ButtonLink>
                <ButtonLink href="/signup" size="lg" variant="secondary">Join as a developer</ButtonLink>
              </div>
              <ul className="flex flex-wrap gap-6 text-[15px] font-medium text-body">
                <li className="flex items-center gap-2"><LockIcon className="size-[18px] text-brand" />Payments held in escrow</li>
                <li className="flex items-center gap-2"><ShieldIcon className="size-[18px] text-brand" />Every milestone QA-checked</li>
                <li className="flex items-center gap-2"><LinesIcon className="size-[18px] text-brand" />You own the code from day one</li>
              </ul>
            </div>

            <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-[18px] rounded-[20px] border border-line bg-ground p-7 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">Project plan</div>
                  <div className="mt-1 font-display text-[22px] font-bold">{samplePlan.title}</div>
                </div>
                <Pill>2 of 4 verified</Pill>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} aria-label="Milestones verified">
                <div className="h-full w-1/2 bg-brand" />
              </div>
              <ol className="flex flex-col gap-2.5">
                {samplePlan.milestones.map((m) => {
                  const s = heroStatus[m.status as keyof typeof heroStatus] ?? heroStatus.unfunded;
                  return (
                    <li key={m.n} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 ${s.row}`}>
                      <span className={`font-medium ${m.status === "unfunded" ? "text-muted" : ""}`}>
                        {m.n}. {m.title}
                      </span>
                      <span className={`shrink-0 text-sm font-semibold ${s.text}`}>{s.label}</span>
                    </li>
                  );
                })}
              </ol>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4 text-[15px]">
                <span className="text-muted">Held in escrow for milestone 3</span>
                <span className="font-bold">[AMOUNT]</span>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1200px] scroll-mt-20 px-6 py-24">
          <div className="mb-12 flex max-w-[680px] flex-col gap-3.5">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="text-[34px] font-bold leading-[1.1] tracking-[-0.01em] md:text-[44px]">
              From idea to working product in three steps
            </h2>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
            {steps.map((s, i) => (
              <Card key={s.title} className="flex flex-col gap-3.5 p-8">
                <div className="flex size-12 items-center justify-center rounded-xl bg-brand-soft font-display text-xl font-bold text-brand-dark">
                  {i + 1}
                </div>
                <h3 className="text-2xl font-bold">{s.title}</h3>
                <p className="text-[17px] leading-relaxed text-body">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Referee */}
        <section className="bg-ink text-white">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6 py-24">
            <div className="flex max-w-[760px] flex-col gap-4">
              <Eyebrow tone="light">The referee in the middle</Eyebrow>
              <h2 className="text-[34px] font-bold leading-[1.1] md:text-[44px]">
                An agreed plan. Checked work. Guaranteed pay.
              </h2>
              <p className="text-lg leading-relaxed text-slate-300">
                Neither side has to trust the other blindly. Vouch holds the agreement and checks it — so
                business owners get what they asked for, and developers get paid for what they delivered.
              </p>
            </div>
            <ol className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
              {referee.map((r, i) => (
                <li
                  key={r.title}
                  className={`flex flex-col gap-2 rounded-2xl border p-6 ${
                    r.final ? "border-indigo-500 bg-indigo-950" : "border-slate-700"
                  }`}
                >
                  <span className={`text-sm font-bold ${r.alert ? "text-alert-light" : "text-brand-light"}`}>
                    STEP {i + 1}
                  </span>
                  <span className="text-[19px] font-semibold">{r.title}</span>
                  <span className="text-[15px] leading-normal text-slate-300">{r.body}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Audiences */}
        <section id="clients" className="mx-auto max-w-[1200px] scroll-mt-20 px-6 py-24">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
            <Card className="flex flex-col gap-5 rounded-[20px] p-8 md:p-10">
              <Eyebrow>For business owners</Eyebrow>
              <h2 className="text-[30px] font-bold leading-[1.15] md:text-[34px]">No technical background needed</h2>
              <ul className="flex flex-col gap-3.5 text-[17px] leading-normal text-body">
                {clientPoints.map((p) => (
                  <li key={p} className="flex gap-3"><Check />{p}</li>
                ))}
              </ul>
              <ButtonLink href="/projects/new" className="self-start">Describe your project</ButtonLink>
            </Card>
            <Card className="flex scroll-mt-20 flex-col gap-5 rounded-[20px] p-8 md:p-10">
              <span id="developers" className="sr-only">For developers</span>
              <Eyebrow tone="alert">For developers &amp; AI engineers</Eyebrow>
              <h2 className="text-[30px] font-bold leading-[1.15] md:text-[34px]">Clear scope. Guaranteed pay.</h2>
              <ul className="flex flex-col gap-3.5 text-[17px] leading-normal text-body">
                {devPoints.map((p) => (
                  <li key={p} className="flex gap-3"><Check className="text-alert" />{p}</li>
                ))}
              </ul>
              <ButtonLink href="/signup?role=developer" variant="dark" className="self-start">Apply with your work</ButtonLink>
            </Card>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-y border-line bg-white">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-6 py-24">
            <div className="flex max-w-[680px] flex-col gap-3.5 text-center">
              <Eyebrow>Pricing</Eyebrow>
              <h2 className="text-[34px] font-bold leading-[1.1] md:text-[44px]">One flat fee. Shown upfront.</h2>
              <p className="text-lg leading-relaxed text-body">
                No hidden markup, no subscriptions, no per-proposal charges. Both sides see exactly what Vouch takes.
              </p>
            </div>
            <div className="grid w-full max-w-[880px] grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              <div className="flex flex-col gap-3 rounded-[20px] border-2 border-brand p-9">
                <span className="font-semibold text-brand-dark">Business owners</span>
                <span className="font-display text-4xl font-bold sm:text-5xl">[YOUR FEE]%</span>
                <span className="text-base text-muted">of each milestone, added on top. Includes scoping, matching, escrow and QA review.</span>
              </div>
              <div className="flex flex-col gap-3 rounded-[20px] border border-line p-9">
                <span className="font-semibold text-alert-dark">Developers &amp; AI engineers</span>
                <span className="font-display text-4xl font-bold sm:text-5xl">[YOUR FEE]%</span>
                <span className="text-base text-muted">platform fee. Free to join, free to be matched, nothing to pay before you earn.</span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto flex max-w-[880px] flex-col gap-4 px-6 py-24">
          <h2 className="mb-3 text-center text-[34px] font-bold md:text-[40px]">Questions</h2>
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-[14px] border border-line bg-white px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {f.q}
                <span aria-hidden="true" className="text-2xl font-normal text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3.5 text-base leading-relaxed text-body">{f.a}</p>
            </details>
          ))}
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-[1200px] px-6 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-7 rounded-3xl bg-brand px-8 py-14 text-white md:px-12 md:py-16">
            <div className="flex flex-[1_1_420px] flex-col gap-3">
              <h2 className="text-[30px] font-bold leading-[1.15] md:text-[38px]">Have an idea? Get a real plan in minutes.</h2>
              <p className="text-lg text-indigo-100">Free to describe your project. You only pay when work starts.</p>
            </div>
            <ButtonLink href="/projects/new" variant="light" size="lg" className="font-bold">Start your project</ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
