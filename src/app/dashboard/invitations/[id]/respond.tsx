"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import { FormAlert } from "@/components/form-bits";
import { respondToInvitation } from "../../actions";

export function RespondButtons({ invitationId }: { invitationId: string }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const respond = (accept: boolean) =>
    startTransition(async () => {
      const res = await respondToInvitation(invitationId, accept);
      if (res?.error) setError(res.error);
    });

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border-2 border-brand-tint bg-white p-6">
      <h2 className="text-xl font-bold">Take this project?</h2>
      <p className="text-[15px] text-body">Accepting means you agree to the milestones and checks above. The business owner is told straight away.</p>
      <FormAlert>{error}</FormAlert>
      <div className="flex flex-wrap gap-3">
        <Button size="lg" disabled={pending} onClick={() => respond(true)}>{pending ? "Saving…" : "Accept & join project"}</Button>
        <Button
          size="lg"
          variant="secondary"
          disabled={pending}
          onClick={() => {
            if (confirm("Decline this invitation?")) respond(false);
          }}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
