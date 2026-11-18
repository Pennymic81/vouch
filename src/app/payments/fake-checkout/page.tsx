import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { fakeStore, isFakePaystack } from "@/lib/paystack";
import { formatMoney, fromMinor } from "@/lib/currency";

export const metadata: Metadata = { title: "Test checkout" };

async function Checkout({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Read the request first so this is decided per visit, not frozen in at build time.
  const sp = await searchParams;
  if (!isFakePaystack()) notFound();
  const reference = String(sp.reference ?? "");
  const callback = String(sp.callback ?? "");
  const charge = fakeStore().charges.get(reference);
  if (!charge) notFound();
  const amount = formatMoney(fromMinor(charge.amountMinor), charge.currency);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white p-8 shadow-lg">
        <p className="rounded-lg bg-alert-soft px-3 py-2 text-center text-xs font-semibold text-alert-dark">TEST CHECKOUT — no real money moves</p>
        <h1 className="text-center text-xl font-bold">Pay {amount}</h1>
        <p className="text-center text-sm text-muted">Stand-in for Paystack&apos;s checkout page, used by automated tests.</p>
        {(["success", "abandoned"] as const).map((outcome) => (
          <form key={outcome} method="get" action="/payments/fake-checkout/complete">
            <input type="hidden" name="reference" value={reference} />
            <input type="hidden" name="callback" value={callback} />
            <input type="hidden" name="outcome" value={outcome} />
            {outcome === "success" ? (
              <button type="submit" className="w-full rounded-xl bg-[#0BA4DB] px-5 py-3.5 font-semibold text-white">Pay {amount}</button>
            ) : (
              <button type="submit" className="w-full rounded-xl border border-line-strong px-5 py-3 font-semibold text-ink">Cancel payment</button>
            )}
          </form>
        ))}
      </div>
    </main>
  );
}

export default function FakeCheckoutPage({ searchParams }: PageProps<"/payments/fake-checkout">) {
  return (
    <Suspense>
      <Checkout searchParams={searchParams} />
    </Suspense>
  );
}
