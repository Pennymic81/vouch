import { expect, test } from "@playwright/test";

test.describe("business owner journey", () => {
  test("landing → plan → matches → project workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start your project" }).first().click();
    await expect(page).toHaveURL("/projects/new");
    await expect(page.getByRole("heading", { name: "Customer support chatbot" })).toBeVisible();

    await page.getByRole("link", { name: "Approve plan & find matches" }).click();
    await expect(page).toHaveURL("/projects/new/matches");
    await expect(page.getByRole("heading", { level: 2, name: "Amara Okafor" })).toBeVisible();

    await page.getByRole("link", { name: "Invite to project" }).first().click();
    await expect(page).toHaveURL("/projects/support-chatbot");
    await expect(page.getByRole("heading", { name: /Milestone 3/ })).toBeVisible();
  });

  test("the plan lists every milestone with acceptance criteria", async ({ page }) => {
    await page.goto("/projects/new");
    const milestones = page.locator("ol").filter({ hasText: "Knowledge base & FAQ import" }).locator("> li");
    await expect(milestones).toHaveCount(4);
    for (const item of await milestones.all()) {
      await expect(item.locator("ul li").first()).toBeVisible();
    }
  });

  test("each match explains why they fit and shows proof", async ({ page }) => {
    await page.goto("/projects/new/matches");
    for (const first of ["Amara", "Daniel", "Priya"]) {
      await expect(page.getByRole("heading", { name: `Why ${first} fits` })).toBeVisible();
    }
    await expect(page.getByRole("link", { name: /live demo/ }).first()).toBeVisible();
  });
});

test.describe("milestone review", () => {
  test("approving releases payment and can be undone", async ({ page }) => {
    await page.goto("/projects/support-chatbot");
    await expect(page.getByText("Needs your review · 4 days left")).toBeVisible();

    await page.getByRole("button", { name: "Approve & release payment" }).click();
    await expect(page.getByText("✓ Approved · payment released")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("Payment released to Amara");

    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByRole("button", { name: "Approve & release payment" })).toBeVisible();
  });

  test("requesting changes keeps the money in escrow", async ({ page }) => {
    await page.goto("/projects/support-chatbot");
    await page.getByRole("button", { name: "Request changes" }).click();
    await expect(page.getByText("Changes requested")).toBeVisible();
    await expect(page.getByRole("status")).toContainText("stays in escrow");
  });
});

test.describe("sign up", () => {
  test("business owners go to the project planner", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("radio", { name: /A business owner/ })).toBeChecked();
    await expect(page.getByLabel(/Company/)).toBeVisible();

    await page.getByLabel("Full name").fill("Ada Obi");
    await page.getByLabel("Work email").fill("ada@example.com");
    await page.getByLabel("Password").fill("supersecret");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/projects/new");
  });

  test("developers go to their dashboard", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("radio", { name: /A developer or AI engineer/ }).check();
    await expect(page.getByLabel(/Portfolio or GitHub/)).toBeVisible();

    await page.getByLabel("Full name").fill("Tunde Bello");
    await page.getByLabel("Work email").fill("tunde@example.com");
    await page.getByLabel("Password").fill("supersecret");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("the form will not submit without the required fields", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/signup");
    const valid = await page.getByLabel("Full name").evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valid).toBe(false);
  });

  test("passwords shorter than 8 characters are rejected", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Ada Obi");
    await page.getByLabel("Work email").fill("ada@example.com");
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/signup");
  });
});

test.describe("navigation", () => {
  test("desktop menu links jump to their sections", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop-only menu");
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pricing" }).click();
    await expect(page.getByRole("heading", { name: "One flat fee. Shown upfront." })).toBeInViewport();
  });

  test("phone menu opens, links work, and it closes", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phone-only menu");
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();

    const toggle = page.getByRole("button", { name: "Open menu" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();

    const menu = page.getByRole("navigation", { name: "Mobile" });
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "How it works" }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { name: "From idea to working product in three steps" })).toBeInViewport();
  });

  test("app header marks the current page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "App" }).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("the logo always leads home", async ({ page }) => {
    await page.goto("/dashboard");
    await page.getByRole("link", { name: "Vouch" }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("FAQ answers expand", async ({ page }) => {
    await page.goto("/");
    const answer = page.getByText(/An independent Vouch reviewer tests each milestone/);
    await expect(answer).toBeHidden();
    await page.getByText("Who does the QA check?").click();
    await expect(answer).toBeVisible();
  });
});
