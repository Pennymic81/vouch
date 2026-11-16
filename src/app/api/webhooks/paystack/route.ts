import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { applyTransferStatus, confirmPayment } from "@/lib/payments";

type Event = { event?: string; data?: { reference?: string; transfer_code?: string; reason?: string } };

/**
 * Paystack's server-to-server notifications. Add this URL in the Paystack dashboard:
 *   Settings → API Keys & Webhooks → Webhook URL → https://<your-domain>/api/webhooks/paystack
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!verifyWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: Event;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const reference = body.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  switch (body.event) {
    case "charge.success":
      // Re-verified with Paystack inside — the webhook alone never funds anything.
      await confirmPayment(reference);
      break;
    case "transfer.success":
      await applyTransferStatus(reference, "success", body.data?.transfer_code);
      break;
    case "transfer.failed":
    case "transfer.reversed":
      await applyTransferStatus(reference, body.event.split(".")[1], body.data?.transfer_code, body.data?.reason);
      break;
  }
  return NextResponse.json({ ok: true });
}
