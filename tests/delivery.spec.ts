import Database from "better-sqlite3";
import { expect, test, type Page } from "@playwright/test";
import { createReviewer, hiredProject, reviewWork, signUpViaApi, submitWork } from "./helpers";

// Each test hires a developer and walks milestones through funding, delivery, QA and approval.
// AI stand-in plan: 1 · Collect your content and rules ($700, 2 checks) · 2 · Website chat widget ($500) · 3 · Hand-off to your staff ($600)
test.describe.configure({ timeout: 120_000 });

const card = (page: Page, position: number) => page.getByRole("listitem", { name: new RegExp(`^Milestone ${position}:`) });

test("happy path: fund → deliver → QA passes → owner approves → developer is paid", async ({ page, browser }) => {
  const { id, dev, devName, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);

  // Only the first milestone can be funded.
  await expect(page.getByRole("button", { name: /^Fund milestone/ })).toHaveCount(1);
  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded · in progress");
  await expect(page.getByTestId("escrow-held")).toHaveText("$700");
  await expect(page.getByRole("button", { name: /^Fund milestone/ })).toHaveCount(0);

  await submitWork(dev.page, id, 1);
  await page.reload();
  await expect(card(page, 1)).toContainText("In QA review");

  await reviewWork(qa.page, title, 1);

  await page.reload();
  await expect(card(page, 1)).toContainText("QA passed · awaiting approval");
  await expect(card(page, 1).getByRole("region", { name: "QA report" })).toContainText("passed · 2 of 2 checks");
  await expect(card(page, 1)).toContainText("approved automatically on");
  await page.getByRole("button", { name: "Approve milestone 1 and release payment" }).click();

  await expect(card(page, 1)).toContainText("✓ Approved · paid");
  await expect(page.getByTestId("escrow-released")).toHaveText("$700");
  await expect(page.getByTestId("escrow-held")).toHaveText("$0");
  await expect(page.getByRole("list", { name: "Activity" })).toContainText("payment released to Builder");
  // The next milestone can now be funded.
  await expect(page.getByRole("button", { name: "Fund milestone 2" })).toBeVisible();

  await dev.page.goto(`/dashboard/projects/${id}`);
  await expect(dev.page.getByTestId("dev-earned")).toHaveText("$700");
  expect(devName).toContain("Builder");
  await dev.context.close();
  await qa.context.close();
});

test("QA failure sends work back with notes; the developer fixes and resubmits", async ({ page, browser }) => {
  const { id, dev, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);
  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded");

  await submitWork(dev.page, id, 1);
  await reviewWork(qa.page, title, 1, { 1: "Only 14 of the 20 test questions were answered correctly." });

  await dev.page.goto(`/dashboard/projects/${id}`);
  const m1 = card(dev.page, 1);
  await expect(m1).toContainText("Changes requested");
  await expect(m1.getByRole("region", { name: "QA report" })).toContainText("issues found · 1 of 2 checks");
  await expect(m1).toContainText("Only 14 of the 20 test questions");
  await expect(m1.getByRole("form", { name: "Submit milestone 1" })).toContainText("Fix and resubmit");

  await submitWork(dev.page, id, 1, "Fixed the remaining answers — all 20 now pass.");
  await expect(card(dev.page, 1).getByRole("region", { name: "Latest delivery" })).toContainText("round 2");
  await reviewWork(qa.page, title, 1);

  await page.reload();
  await expect(card(page, 1)).toContainText("QA passed · awaiting approval");
  await dev.context.close();
  await qa.context.close();
});

test("the owner can request changes after QA, and the developer sees why", async ({ page, browser }) => {
  const { id, dev, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);
  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded");
  await submitWork(dev.page, id, 1);
  await reviewWork(qa.page, title, 1);

  await page.reload();
  await card(page, 1).getByRole("button", { name: "Request changes" }).click();
  const form = page.getByRole("form", { name: "Request changes" });
  await form.getByLabel("What needs to change?").fill("Please use our store's real return policy wording.");
  await form.getByRole("button", { name: "Send to developer" }).click();
  await expect(card(page, 1)).toContainText("Changes requested");
  await expect(page.getByTestId("escrow-released")).toHaveText("$0");

  await dev.page.goto(`/dashboard/projects/${id}`);
  await expect(card(dev.page, 1).getByRole("region", { name: "Owner feedback" })).toContainText("real return policy wording");
  await dev.context.close();
  await qa.context.close();
});

test("milestones auto-approve when the owner doesn't respond in time", async ({ page, browser }) => {
  const { id, dev, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);
  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded");
  await submitWork(dev.page, id, 1);
  await reviewWork(qa.page, title, 1);

  // Pretend QA passed 6 days ago (the window is 5 days).
  const sqlite = new Database("test.db");
  sqlite
    .prepare("update milestone set qa_passed_at = ? where project_id = ? and position = 1")
    .run(Date.now() - 6 * 86_400_000, id);
  sqlite.close();

  await page.reload();
  await expect(card(page, 1)).toContainText("✓ Approved · paid");
  await expect(card(page, 1)).toContainText("(auto-approved)");
  await expect(page.getByRole("list", { name: "Activity" })).toContainText("approved automatically");
  await dev.context.close();
  await qa.context.close();
});

test("delivering every milestone completes the project", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const { id, dev, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);
  for (const n of [1, 2, 3]) {
    await page.goto(`/projects/${id}`);
    await page.getByRole("button", { name: `Fund milestone ${n}` }).click();
    await expect(card(page, n)).toContainText("Funded");
    await submitWork(dev.page, id, n);
    await reviewWork(qa.page, title, n);
    await page.reload();
    await page.getByRole("button", { name: `Approve milestone ${n} and release payment` }).click();
    await expect(card(page, n)).toContainText("✓ Approved · paid");
  }
  await expect(page.getByRole("status").filter({ hasText: "Your project is complete" })).toBeVisible();
  await expect(page.getByTestId("escrow-released")).toHaveText("$1,800");
  await expect(page.getByRole("main").getByText("Completed", { exact: true })).toBeVisible();
  await dev.context.close();
  await qa.context.close();
});

test("inputs are validated and rules can't be skipped", async ({ page, browser }) => {
  const { id, dev, title } = await hiredProject(page, browser);
  const qa = await createReviewer(browser);

  // Developer can't hand in before funding.
  await dev.page.goto(`/dashboard/projects/${id}`);
  await expect(card(dev.page, 1)).toContainText("Waiting for the owner to fund this milestone.");
  await expect(dev.page.getByRole("form", { name: "Submit milestone 1" })).toHaveCount(0);

  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded");

  // Demo links must be https, checked on the server.
  await dev.page.reload();
  const form = dev.page.getByRole("form", { name: "Submit milestone 1" });
  await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
  await form.getByLabel("What you delivered").fill("Done.");
  await form.getByLabel("Demo link").fill("http://insecure.example.com");
  await form.getByRole("button", { name: "Submit for QA" }).click();
  await expect(form.getByText("Describe what you delivered")).toBeVisible();
  await expect(form.getByText("Links must start with https://")).toBeVisible();

  // A failed check needs a note.
  await submitWork(dev.page, id, 1);
  await qa.page.goto("/review");
  await qa.page.getByRole("link", { name: new RegExp(`${title} · milestone 1`) }).click();
  const review = qa.page.getByRole("form", { name: "QA review" });
  await review.getByRole("group").nth(0).getByRole("radio", { name: "Failed" }).check();
  await review.getByRole("group").nth(1).getByRole("radio", { name: "Passed" }).check();
  await review.getByRole("button", { name: "Submit review" }).click();
  await expect(review.getByRole("alert")).toContainText("Explain what's wrong");
  await dev.context.close();
  await qa.context.close();
});

test("only QA reviewers can open the review queue", async ({ page }) => {
  await signUpViaApi(page, "client");
  await page.goto("/review");
  await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
});

test("reviewers can't review their own projects", async ({ page, browser }) => {
  // The owner signs up with a reviewer email, so they're staff *and* the client.
  const res = await page.request.post("/api/auth/sign-up/email", {
    data: { name: "Staff Owner", email: `owner-${Date.now()}@qa.vouch.test`, password: "correct-horse-battery", role: "client" },
  });
  expect(res.ok()).toBeTruthy();
  const { createProject, createDeveloper } = await import("./helpers");
  const t = Math.random().toString(36).slice(2, 7).toUpperCase();
  const dev = await createDeveloper(browser, {
    name: `Solo ${t}`,
    skills: ["AI chatbots"],
    proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots"] }],
  });
  const id = await createProject(page, `Own project ${t}`);
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(page.getByTestId("total-milestones")).toHaveText("3");
  await page.getByRole("button", { name: "Approve plan & find matches" }).click();
  await page.goto(`/projects/${id}/matches?all=1`);
  await page.getByRole("button", { name: `Invite Solo ${t} to this project` }).click();
  await expect(page.getByText("Invited — waiting for Solo")).toBeVisible();
  await dev.page.goto("/dashboard");
  await dev.page.getByRole("link", { name: "Read the plan" }).first().click();
  await dev.page.getByRole("button", { name: "Accept & join project" }).click();
  await expect(dev.page.getByText("You're on this project")).toBeVisible();

  await page.goto(`/projects/${id}`);
  await page.getByRole("button", { name: "Fund milestone 1" }).click();
  await expect(card(page, 1)).toContainText("Funded");
  await submitWork(dev.page, id, 1);

  await page.goto("/review");
  await page.getByRole("link", { name: new RegExp(`Own project ${t} · milestone 1`) }).click();
  await expect(page.getByText("You can't review a project you're part of.")).toBeVisible();
  await expect(page.getByRole("form", { name: "QA review" })).toHaveCount(0);
  await dev.context.close();
});

test("developers can only open projects they're building", async ({ page, browser }) => {
  const { id, dev } = await hiredProject(page, browser);
  const ctx = await browser.newContext();
  const other = await ctx.newPage();
  await signUpViaApi(other, "developer", "Someone Else");
  await other.goto(`/dashboard/projects/${id}`);
  await expect(other.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  await ctx.close();
  await dev.context.close();
});
