import { expect, test } from "@playwright/test";
import { addMilestone, createProject, sampleMilestones, signUpViaApi } from "./helpers";

// These run against a predictable stand-in for the AI (AI_FAKE=1 in playwright.config.ts).

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept());
  await signUpViaApi(page, "client");
  await createProject(page, "Store helper bot");
});

const milestoneHeadings = (page: import("@playwright/test").Page) =>
  page.getByRole("list", { name: "Milestones" }).getByRole("heading", { level: 3 });

test("AI writes a full plan from the description", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Let AI write your plan" })).toBeVisible();
  await page.getByRole("button", { name: "Write my plan with AI" }).click();

  await expect(milestoneHeadings(page)).toHaveCount(3);
  await expect(milestoneHeadings(page).first()).toHaveText("1 · Collect your content and rules");
  await expect(page.getByTestId("total-total-budget")).toHaveText("$1,800");
  await expect(page.getByText("Summary:")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /One-line summary/ })).toHaveValue(/A plan for “Store helper bot”/);
  await expect(page.getByRole("status").filter({ hasText: "Plan updated" })).toBeVisible();
});

test("answering the AI's questions updates the plan", async ({ page }) => {
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(page.getByText("A few questions to sharpen the plan")).toBeVisible();

  await page.getByLabel("Which channels should it answer on?").fill("Website and WhatsApp");
  await page.getByRole("button", { name: "Update plan with my answers" }).click();

  await expect(milestoneHeadings(page)).toHaveCount(4);
  await expect(page.getByRole("heading", { name: "3 · WhatsApp channel" })).toBeVisible();
  await expect(page.getByText("A few questions to sharpen the plan")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Rewrite with AI" })).toBeVisible();
});

test("rewriting replaces milestones you added by hand (after confirming)", async ({ page }) => {
  await addMilestone(page, sampleMilestones[0]);
  await expect(page.getByRole("heading", { name: "AI plan assistant" })).toBeVisible();

  // The stand-in asks questions first; skip answering and submit to rewrite.
  await page.getByRole("button", { name: /Rewrite with AI|Update plan with my answers/ }).click();
  await expect(milestoneHeadings(page)).toHaveCount(3);
  await expect(page.getByText(sampleMilestones[0].title)).toHaveCount(0);
});

test("AI milestones can still be edited by hand", async ({ page }) => {
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(milestoneHeadings(page)).toHaveCount(3);
  await page.getByRole("button", { name: "Edit milestone 2" }).click();
  const form = page.getByRole("form", { name: "Edit milestone 2" });
  await form.getByLabel("Amount (USD)").fill("650");
  await form.getByRole("button", { name: "Save milestone" }).click();
  await expect(page.getByTestId("total-total-budget")).toHaveText("$1,950");
});

test("each project has a limited number of AI rewrites", async ({ page }) => {
  test.slow();
  await expect(page.getByText("10 rewrites left")).toBeVisible();
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(page.getByText("9 rewrites left")).toBeVisible();
  for (let left = 8; left >= 0; left--) {
    await page.getByRole("button", { name: /Rewrite with AI|Update plan with my answers/ }).click();
    await expect(page.getByText(`${left} rewrite${left === 1 ? "" : "s"} left`)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: /Rewrite with AI|Update plan with my answers/ })).toBeDisabled();
});

test("the AI panel is gone once the plan is published", async ({ page }) => {
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(milestoneHeadings(page)).toHaveCount(3);
  await page.getByRole("button", { name: "Approve plan & find matches" }).click();
  await expect(page).toHaveURL(/\/matches$/);
  await page.getByRole("link", { name: "← Back to project" }).click();
  await expect(page.getByRole("main").getByText("Collect your content and rules")).toBeVisible();
  await expect(page.getByRole("button", { name: /with AI/ })).toHaveCount(0);
});
