import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { Stepper } from "@/components/stepper";
import { ShieldIcon } from "@/components/icons";
import { NewProjectForm } from "./new-project-form";

export const metadata: Metadata = { title: "Start a project" };

export default function NewProjectPage() {
  return (
    <>
      <AppHeader active="new" />
      <Protected role="client" returnTo="/projects/new">
        <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-6 pb-20 pt-10">
          <Stepper current={1} />
          <div className="flex flex-wrap items-start gap-7">
            <section aria-labelledby="new-h" className="flex min-w-0 flex-[999_1_620px] flex-col gap-6 rounded-[18px] border border-line bg-white p-6 md:p-8">
              <div className="flex flex-col gap-2">
                <h1 id="new-h" className="text-[30px] font-bold">What do you want to build?</h1>
                <p className="text-base leading-relaxed text-body">
                  Describe it the way you&apos;d explain it to a friend. No technical words needed — next, you&apos;ll turn it into a
                  plan with milestones.
                </p>
              </div>
              <NewProjectForm />
            </section>
            <aside className="flex min-w-0 flex-[1_1_320px] flex-col gap-4 rounded-[18px] bg-brand-soft p-6 text-brand-deep">
              <h2 className="flex items-center gap-2.5 text-lg font-bold">
                <ShieldIcon className="size-5 text-brand" />
                Tips for a great description
              </h2>
              <ul className="flex list-disc flex-col gap-2.5 pl-5 text-[15px] leading-relaxed">
                <li>Who will use it — your customers, your staff, or both?</li>
                <li>The problem it solves today, and how you handle it now.</li>
                <li>Tools you already use (website builder, WhatsApp, a store system…).</li>
                <li>Anything it must not do, or a deadline you have to hit.</li>
              </ul>
            </aside>
          </div>
        </main>
      </Protected>
    </>
  );
}
