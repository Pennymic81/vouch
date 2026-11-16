"use client";

import { useActionState, useState } from "react";
import { Button, inputClass } from "@/components/ui";
import { FieldError, FormAlert } from "@/components/form-bits";
import { checkBankAction, saveBankAction } from "../actions";

export function BankAccountForm({ banks, hasAccount }: { banks: { name: string; code: string }[]; hasAccount: boolean }) {
  const [check, checkAction, checking] = useActionState(checkBankAction, undefined);
  const [save, saveAction, saving] = useActionState(saveBankAction, undefined);
  const [editing, setEditing] = useState(!hasAccount);
  const [seen, setSeen] = useState(save);
  if (save !== seen) {
    setSeen(save);
    if (save?.ok) setEditing(false);
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setEditing(true)}>Change bank account</Button>
        {save?.ok && <span role="status" className="text-sm font-semibold text-brand-dark">✓ Bank account saved</span>}
      </div>
    );
  }

  const e = check?.fieldErrors ?? {};
  const confirmed = check?.accountName && check.accountNumber && check.bankCode;

  return (
    <div className="flex flex-col gap-4">
      <form action={checkAction} aria-label="Bank account" className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start gap-4">
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Bank
          <select name="bankCode" required defaultValue={check?.bankCode ?? ""} aria-invalid={!!e.bankCode} className={inputClass}>
            <option value="" disabled>Choose your bank</option>
            {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
          </select>
          <FieldError id="bank-error" message={e.bankCode} />
        </label>
        <label className="flex flex-col gap-2 text-[15px] font-semibold">
          Account number
          <input name="accountNumber" inputMode="numeric" pattern="\d{10}" maxLength={10} required defaultValue={check?.accountNumber} aria-invalid={!!e.accountNumber} className={inputClass} placeholder="10 digits" />
          <FieldError id="acct-error" message={e.accountNumber} />
        </label>
        <div className="col-span-full flex flex-col gap-3">
          <FormAlert>{check?.error}</FormAlert>
          <Button type="submit" variant="dark" className="self-start" disabled={checking}>{checking ? "Checking…" : "Check account"}</Button>
        </div>
      </form>

      {confirmed && (
        <form action={saveAction} className="flex flex-col gap-3 rounded-[14px] border-2 border-brand-tint bg-ground p-5">
          <input type="hidden" name="bankCode" value={check.bankCode} />
          <input type="hidden" name="accountNumber" value={check.accountNumber} />
          <p className="text-[15px]">
            Account name: <strong data-testid="resolved-name">{check.accountName}</strong>
          </p>
          <p className="text-sm text-muted">Is this your account? Payouts will be sent here.</p>
          <FormAlert>{save?.error}</FormAlert>
          <Button type="submit" className="self-start" disabled={saving}>{saving ? "Saving…" : "Yes, save this account"}</Button>
        </form>
      )}
    </div>
  );
}
