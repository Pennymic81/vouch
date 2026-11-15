"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { inviteDeveloper } from "../../actions";

export function InviteButton({
  projectId,
  developerId,
  name,
  status,
}: {
  projectId: string;
  developerId: string;
  name: string;
  status: string | null;
}) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (status === "pending") return <p role="status" className="rounded-xl bg-brand-soft px-4 py-3 text-center text-[15px] font-semibold text-brand-dark">✓ Invited — waiting for {name.split(" ")[0]}</p>;
  if (status === "declined") return <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-[15px] text-body">{name.split(" ")[0]} declined</p>;
  if (status) return <p className="rounded-xl bg-slate-100 px-4 py-3 text-center text-[15px] text-body">Invitation closed</p>;

  return (
    <div className="flex flex-col gap-2">
      <Button
        className="w-full rounded-xl py-[13px]"
        disabled={pending}
        aria-label={`Invite ${name} to this project`}
        onClick={() =>
          startTransition(async () => {
            const res = await inviteDeveloper(projectId, developerId);
            if (res?.error) setError(res.error);
          })
        }
      >
        {pending ? "Inviting…" : "Invite to project"}
      </Button>
      {error && <p role="alert" className="text-sm text-alert-dark">{error}</p>}
    </div>
  );
}
