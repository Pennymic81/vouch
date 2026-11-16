import type { Metadata } from "next";
import { AppHeader } from "@/components/app-header";
import { Protected } from "@/components/protected";
import { StatusBadge } from "@/components/form-bits";
import { Card } from "@/components/ui";
import { getSession } from "@/lib/session";
import { formatMoney } from "@/lib/currency";
import { listBanks, paymentsEnabled } from "@/lib/paystack";
import { getPayoutAccount, listPayouts, refreshPayouts } from "@/lib/payments";
import { appCurrency, platformFeePercent } from "@/lib/settings";
import { BankAccountForm } from "./bank-form";

export const metadata: Metadata = { title: "Payouts" };

const label = {
  awaiting_bank_details: { text: "Add bank details", tone: "alert" },
  processing: { text: "On its way", tone: "brand" },
  success: { text: "✓ Sent", tone: "ink" },
  failed: { text: "Failed", tone: "alert" },
} as const;

const fmt = (d: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);

async function Payouts() {
  const session = await getSession();
  if (!session) return null;
  if (!paymentsEnabled()) {
    return (
      <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-4 px-6 pb-20 pt-9">
        <h1 className="text-[30px] font-bold md:text-[34px]">Payouts</h1>
        <p className="rounded-[14px] border border-line bg-white px-5 py-4 text-body">Payments are simulated on this site, so there are no real payouts yet.</p>
      </main>
    );
  }
  await refreshPayouts(session.user.id);
  const currency = appCurrency();
  const [account, payouts, banks] = await Promise.all([getPayoutAccount(session.user.id), listPayouts(session.user.id), listBanks(currency)]);
  const sent = payouts.filter((x) => x.po.status === "success").reduce((s, x) => s + x.po.net, 0);
  const waiting = payouts.filter((x) => x.po.status !== "success").reduce((s, x) => s + x.po.net, 0);

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 px-6 pb-20 pt-9">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-[30px] font-bold md:text-[34px]">Payouts</h1>
        <p className="text-[17px] text-body">
          When a milestone is approved, your share is sent to your bank automatically. Vouch keeps a {platformFeePercent()}% platform fee.
        </p>
      </div>

      {!account && payouts.some((x) => x.po.status === "awaiting_bank_details") && (
        <p role="alert" className="rounded-[14px] border border-alert-line bg-alert-soft px-5 py-4 text-[15px] text-alert-dark">
          <strong>You have money waiting.</strong> Add your bank account below and it&apos;s sent straight away.
        </p>
      )}

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5"><dt className="text-sm font-semibold text-muted">Sent to your bank</dt><dd className="font-display text-[28px] font-bold" data-testid="payouts-sent">{formatMoney(sent, currency)}</dd></div>
        <div className="flex flex-col gap-1.5 rounded-2xl border border-line bg-white p-5"><dt className="text-sm font-semibold text-muted">On its way or waiting</dt><dd className="font-display text-[28px] font-bold">{formatMoney(waiting, currency)}</dd></div>
      </dl>

      <Card className="flex flex-col gap-4 p-6 md:p-7">
        <section aria-labelledby="bank-h" className="flex flex-col gap-4">
          <h2 id="bank-h" className="text-[22px] font-bold">Bank account</h2>
          {account && (
            <p className="rounded-[14px] bg-brand-soft px-5 py-4 text-[15px] text-brand-deep" data-testid="saved-account">
              Payouts go to <strong>{account.accountName}</strong> · {account.bankName} · ••••{account.last4}
            </p>
          )}
          <BankAccountForm banks={banks} hasAccount={!!account} />
          <p className="text-sm text-muted">Your account number goes to Paystack to set up transfers. Vouch only keeps the last 4 digits.</p>
        </section>
      </Card>

      <Card className="flex flex-col gap-4 p-6 md:p-7">
        <h2 className="text-[22px] font-bold">History</h2>
        {payouts.length === 0 ? (
          <p className="text-body">Approved milestones will appear here.</p>
        ) : (
          <ul aria-label="Payouts" className="flex flex-col gap-3">
            {payouts.map(({ po, m, title }) => (
              <li key={po.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-line p-4">
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{title} · milestone {m.position}</span>
                  <span className="text-sm text-muted">
                    {formatMoney(po.gross, po.currency)} − {formatMoney(po.fee, po.currency)} fee = <strong className="text-ink">{formatMoney(po.net, po.currency)}</strong>
                    {po.sentAt && ` · sent ${fmt(po.sentAt)}`}
                  </span>
                  {po.status === "failed" && po.failureReason && <span className="text-sm text-alert-dark">{po.failureReason}. Check your bank details and save them again to retry.</span>}
                </span>
                <StatusBadge tone={label[po.status].tone}>{label[po.status].text}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </main>
  );
}

export default function PayoutsPage() {
  return (
    <>
      <AppHeader role="developer" active="payouts" />
      <Protected role="developer" returnTo="/dashboard/payouts">
        <Payouts />
      </Protected>
    </>
  );
}
