import { NextResponse, type NextRequest } from "next/server";
import { fakeStore, isFakePaystack } from "@/lib/paystack";
import { appUrl } from "@/lib/settings";

/** Test-only: completes or cancels a pretend checkout, then returns to the app like Paystack does (full redirect). */
export async function GET(request: NextRequest) {
  if (!isFakePaystack()) return new NextResponse("Not found", { status: 404 });
  const q = request.nextUrl.searchParams;
  const reference = q.get("reference") ?? "";
  const callback = q.get("callback") ?? "";
  const outcome = q.get("outcome") === "success" ? "success" : "abandoned";
  const charge = fakeStore().charges.get(reference);
  if (!charge || !callback.startsWith(appUrl())) return new NextResponse("Bad request", { status: 400 });
  charge.status = outcome;
  const to = new URL(callback);
  to.searchParams.set("reference", reference);
  to.searchParams.set("trxref", reference);
  return NextResponse.redirect(to);
}
