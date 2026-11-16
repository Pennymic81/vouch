import { NextResponse, type NextRequest } from "next/server";
import { confirmPayment } from "@/lib/payments";

/** Paystack sends the owner back here after checkout. We verify with Paystack before trusting anything. */
export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference") ?? request.nextUrl.searchParams.get("trxref");
  const result = reference ? await confirmPayment(reference) : null;
  if (!result) return NextResponse.redirect(new URL("/projects", request.url));
  const to = new URL(`/projects/${result.projectId}`, request.url);
  to.searchParams.set("payment", result.outcome === "already" ? "funded" : result.outcome);
  return NextResponse.redirect(to);
}
