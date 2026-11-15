"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui";
import { withdrawInvitation } from "../actions";

export function WithdrawButton({ invitationId, name }: { invitationId: string; name: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-label={`Withdraw invitation to ${name}`}
      onClick={() => {
        if (confirm(`Withdraw your invitation to ${name}?`)) startTransition(() => withdrawInvitation(invitationId));
      }}
    >
      Withdraw
    </Button>
  );
}
