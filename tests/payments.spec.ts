import { createHmac } from "node:crypto";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import { createReviewer, fundViaCheckout, hiredProject, reviewWork, submitWork } from "./helpers";

// Runs against a pretend Paystack (PAYSTACK_FAKE=1). The webhook key below matches playwright.config.ts.
const WEBHOOK_KEY = "sk_test_e2e_only_webhook_signing_key";
test.describe.configure({ timeout: 150_000 });

const card = (page: Page, n: number) => page.getByRole("listitem", { name: new RegExp(`^Milestone ${n}:`) });

function sendWebhook(request: APIRequestContext, body: unknown, key = WEBHOOK_KEY) {
  const raw = JSON.stringify(body);
  const signature = createHmac("sha512", key).update(raw).digest("hex");
  return request.post("/api/webhooks/paystack", { data: raw, headers: { "content-type": "application/json", "x-paystack-signature": signature } });
}

/** Takes milestone 1 all the way to approved, so a payout is created. */
async function approveFirstMilestone(page: Page, browser: import("@playwright/test").Browser) {
  const ctx = await hiredProject(page, browser);
  const qa = await createReviewer(browser);
  await fundViaCheckout(page, 1);
  await submitWork(ctx.dev.page, ctx.id, 1);
  await reviewWork(qa.page, ctx.title, 1);
  await page.goto(`/projects/${ctx.id}`);
  await page.getByRole("button", { name: "Approve milestone 1 and release payment" }).click();
  await expect(card(page, 1)).toContainText("✓ Approved · paid");
  await qa.context.close();
  return ctx;
}

async function addBankAccount(devPage: Page, accountNumber: string) {
  await devPage.goto("/dashboard/payouts");
  const change = devPage.getByRole("button", { name: "Change bank account" });
  const form = devPage.getByRole("form", { name: "Bank account" });
  await expect(form.or(change)).toBeVisible(); // wait for the page to load
  if (await change.isVisible()) await change.click();
  await form.getByLabel("Bank").selectOption({ label: "Guaranty Trust Bank" });
  await form.getByLabel("Account number").fill(accountNumber);
  await form.getByRole("button", { name: "Check account" }).click();
}

test.describe("paying into escrow", () => {
  test("the owner pays through checkout and the milestone is funded", async ({ page, browser }) => {
    const { id, dev } = await hiredProject(page, browser);
    await fundViaCheckout(page, 1);
    await expect(page.getByRole("status").filter({ hasText: "Payment received" })).toBeVisible();
    await expect(page.getByTestId("escrow-held")).toHaveText("$700");
    await expect(page.getByRole("list", { name: "Activity" })).toContainText("paid $700 via Paystack");

    await dev.page.goto(`/dashboard/projects/${id}`);
    await expect(dev.page.getByRole("form", { name: "Submit milestone 1" })).toBeVisible();
    await dev.context.close();
  });

  test("cancelling checkout charges nothing and the milestone stays unfunded", async ({ page, browser }) => {
    const { dev } = await hiredProject(page, browser);
    await page.getByRole("button", { name: "Fund milestone 1" }).click();
    await page.getByRole("button", { name: "Cancel payment" }).click();
    await expect(page).toHaveURL(/payment=failed$/);
    await expect(page.getByRole("status").filter({ hasText: "didn't go through" })).toBeVisible();
    await expect(card(page, 1)).toContainText("Not funded yet");
    await expect(page.getByRole("button", { name: "Fund milestone 1" })).toBeVisible();
    await dev.context.close();
  });

  test("opening the return link again doesn't fund twice; unknown references go nowhere", async ({ page, browser }) => {
    const { id, dev } = await hiredProject(page, browser);
    await page.getByRole("button", { name: "Fund milestone 1" }).click();
    await page.waitForURL(/\/payments\/fake-checkout\?/);
    const reference = new URL(page.url()).searchParams.get("reference")!;
    await page.getByRole("button", { name: /^Pay / }).click();
    await expect(page).toHaveURL(/payment=funded$/);

    await page.goto(`/payments/paystack/callback?reference=${reference}`);
    await expect(page).toHaveURL(`/projects/${id}?payment=funded`);
    await expect(page.getByTestId("escrow-held")).toHaveText("$700");
    await expect(page.getByRole("list", { name: "Activity" }).getByText(/paid \$700 via Paystack/)).toHaveCount(1);

    await page.goto("/payments/paystack/callback?reference=made_up_reference");
    await expect(page).toHaveURL("/projects");
    await dev.context.close();
  });

  test("a signed Paystack webhook can confirm a payment on its own", async ({ page, browser }) => {
    const { id, dev } = await hiredProject(page, browser);
    // Pay, but block the return link — as if the owner closed the tab after paying.
    await page.route("**/payments/paystack/callback**", (r) => r.abort());
    await page.getByRole("button", { name: "Fund milestone 1" }).click();
    await page.waitForURL(/\/payments\/fake-checkout\?/);
    const reference = new URL(page.url()).searchParams.get("reference")!;
    await page.getByRole("button", { name: /^Pay / }).click().catch(() => {});
    await page.unroute("**/payments/paystack/callback**");

    const res = await sendWebhook(page.request, { event: "charge.success", data: { reference } });
    expect(res.status()).toBe(200);
    await page.goto(`/projects/${id}`);
    await expect(card(page, 1)).toContainText("Funded");
    await dev.context.close();
  });

  test("webhooks with a wrong or missing signature are rejected", async ({ request }) => {
    const forged = await sendWebhook(request, { event: "charge.success", data: { reference: "anything" } }, "sk_test_wrong_key");
    expect(forged.status()).toBe(401);
    const unsigned = await request.post("/api/webhooks/paystack", { data: { event: "charge.success", data: { reference: "x" } } });
    expect(unsigned.status()).toBe(401);
  });
});

test.describe("paying developers", () => {
  test("approval creates a payout that's sent once the developer adds a bank account", async ({ page, browser }) => {
    const { id, dev } = await approveFirstMilestone(page, browser);

    await dev.page.goto("/dashboard/payouts");
    await expect(dev.page.getByRole("alert").filter({ hasText: "You have money waiting" })).toBeVisible();
    const row = dev.page.getByRole("list", { name: "Payouts" }).getByRole("listitem").first();
    await expect(row).toContainText("$700 − $70 fee = $630");
    await expect(row).toContainText("Add bank details");

    await addBankAccount(dev.page, "0123456789");
    await expect(dev.page.getByTestId("resolved-name")).toHaveText("TEST ACCOUNT HOLDER");
    await dev.page.getByRole("button", { name: "Yes, save this account" }).click();

    await expect(dev.page.getByTestId("saved-account")).toContainText("Guaranty Trust Bank · ••••6789");
    await expect(row).toContainText("✓ Sent");
    await expect(dev.page.getByTestId("payouts-sent")).toHaveText("$630");

    await page.goto(`/projects/${id}`);
    await expect(page.getByRole("list", { name: "Activity" })).toContainText("$630 sent to the developer's bank for milestone 1");
    await dev.context.close();
  });

  test("with a bank account already saved, approval pays out straight away", async ({ page, browser }) => {
    const ctx = await hiredProject(page, browser);
    await addBankAccount(ctx.dev.page, "0123456789");
    await ctx.dev.page.getByRole("button", { name: "Yes, save this account" }).click();
    await expect(ctx.dev.page.getByTestId("saved-account")).toBeVisible();

    const qa = await createReviewer(browser);
    await fundViaCheckout(page, 1);
    await submitWork(ctx.dev.page, ctx.id, 1);
    await reviewWork(qa.page, ctx.title, 1);
    await page.goto(`/projects/${ctx.id}`);
    await page.getByRole("button", { name: "Approve milestone 1 and release payment" }).click();
    await expect(card(page, 1)).toContainText("✓ Approved · paid");

    await ctx.dev.page.goto("/dashboard/payouts");
    await expect(ctx.dev.page.getByTestId("payouts-sent")).toHaveText("$630");
    await ctx.dev.context.close();
    await qa.context.close();
  });

  test("a failed transfer can be retried by saving a working account", async ({ page, browser }) => {
    const { dev } = await approveFirstMilestone(page, browser);
    // In the pretend Paystack, accounts ending 9999 always fail transfers.
    await addBankAccount(dev.page, "1234569999");
    await dev.page.getByRole("button", { name: "Yes, save this account" }).click();
    const row = dev.page.getByRole("list", { name: "Payouts" }).getByRole("listitem").first();
    await expect(row).toContainText("Failed");
    await expect(row).toContainText("Account could not be credited");

    await addBankAccount(dev.page, "0123456789");
    await dev.page.getByRole("button", { name: "Yes, save this account" }).click();
    await expect(row).toContainText("✓ Sent");
    await dev.context.close();
  });

  test("bank details are checked before saving", async ({ page, browser }) => {
    const { dev } = await hiredProject(page, browser);
    await addBankAccount(dev.page, "0001112223");
    await expect(dev.page.getByRole("form", { name: "Bank account" }).getByRole("alert")).toContainText("couldn't find that account");

    const form = dev.page.getByRole("form", { name: "Bank account" });
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await form.getByLabel("Account number").fill("12345");
    await form.getByRole("button", { name: "Check account" }).click();
    await expect(form.getByText("Enter your 10-digit account number.")).toBeVisible();
    await dev.context.close();
  });
});
