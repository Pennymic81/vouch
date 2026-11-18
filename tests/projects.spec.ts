import { expect, test } from "@playwright/test";
import { addMilestone, createProject, sampleMilestones, setProjectSkills, signUpViaApi, signUpViaForm } from "./helpers";

test.beforeEach(async ({ page }) => {
  page.on("dialog", (d) => d.accept()); // confirm() prompts for deletes
});

test.describe("starting a project", () => {
  test("full journey: landing → sign up → describe → plan → publish → matches → workspace", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Start your project" }).first().click();
    await expect(page).toHaveURL(/\/signin\?next=%2Fprojects%2Fnew/);
    await page.getByRole("link", { name: "Create an account" }).click();
    await signUpViaForm(page, "client", "Ada Obi");
    await expect(page).toHaveURL("/projects/new");

    const id = await createProject(page, "Furniture store chatbot");
    await expect(page.getByRole("heading", { level: 1, name: "Furniture store chatbot" })).toBeVisible();
    for (const m of sampleMilestones) await addMilestone(page, m);
    await setProjectSkills(page, ["AI chatbots", "WhatsApp integration"]);

    await page.getByRole("button", { name: "Approve plan & find matches" }).click();
    await expect(page).toHaveURL(`/projects/${id}/matches`);
    await expect(page.getByRole("heading", { level: 1, name: "Matches for Furniture store chatbot" })).toBeVisible();

    await page.getByRole("link", { name: "← Back to project" }).click();
    await expect(page).toHaveURL(`/projects/${id}`);
    await expect(page.getByRole("main").getByText("Finding a developer")).toBeVisible();
    await expect(page.getByRole("complementary").getByText("$2,600")).toBeVisible();
    for (const m of sampleMilestones) await expect(page.getByRole("main").getByText(m.title)).toBeVisible();
  });

  test("the name and description are required and checked on the server", async ({ page }) => {
    await signUpViaApi(page, "client");
    await page.goto("/projects/new");
    // Bypass the browser's own checks to prove the server validates too.
    await page.locator("form").evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await page.getByLabel("Project name").fill("ab");
    await page.getByLabel("Describe your idea").fill("too short");
    await page.getByRole("button", { name: "Continue to plan" }).click();
    await expect(page.getByText("Give your project a short name")).toBeVisible();
    await expect(page.getByText("Tell us a little more")).toBeVisible();
    await expect(page).toHaveURL("/projects/new");
  });

  test("new accounts see an empty projects list with a way to start", async ({ page }) => {
    await signUpViaApi(page, "client");
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "No projects yet" })).toBeVisible();
    await page.getByRole("link", { name: "Start your first project" }).click();
    await expect(page).toHaveURL("/projects/new");
  });
});

test.describe("building the plan", () => {
  test.beforeEach(async ({ page }) => {
    await signUpViaApi(page, "client");
    await createProject(page);
  });

  test("totals add up as milestones are added", async ({ page }) => {
    await expect(page.getByTestId("total-milestones")).toHaveText("0");
    await addMilestone(page, sampleMilestones[0]);
    await expect(page.getByTestId("total-total-budget")).toHaveText("$800");
    await expect(page.getByTestId("total-estimated-time")).toHaveText("7 days");
    await addMilestone(page, sampleMilestones[1]);
    await addMilestone(page, sampleMilestones[2]);
    await expect(page.getByTestId("total-total-budget")).toHaveText("$2,600");
    await expect(page.getByTestId("total-estimated-time")).toHaveText("about 3 weeks");
    await expect(page.getByTestId("total-milestones")).toHaveText("3");
  });

  test("each acceptance criterion is saved as its own check", async ({ page }) => {
    await addMilestone(page, sampleMilestones[0]);
    const item = page.getByRole("list", { name: "Milestones" }).getByRole("listitem").first();
    await expect(item.getByRole("listitem")).toHaveCount(2);
    await expect(item).toContainText("Answers 20 test questions correctly");
  });

  test("milestone fields are validated on the server", async ({ page }) => {
    await page.getByRole("button", { name: "+ Add a milestone" }).click();
    const form = page.getByRole("form", { name: "New milestone" });
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await form.getByLabel("Milestone name").fill("x");
    await form.getByLabel(/What "done" means/).fill("   ");
    await form.getByLabel("Amount (USD)").fill("0");
    await form.getByLabel("Days to complete").fill("400");
    await form.getByRole("button", { name: "Add milestone" }).click();
    await expect(form.getByText("Name this milestone")).toBeVisible();
    await expect(form.getByText("Add at least one line")).toBeVisible();
    await expect(form.getByText("The amount must be at least 1")).toBeVisible();
    await expect(form.getByText("Split anything over a year")).toBeVisible();
    await expect(page.getByTestId("total-milestones")).toHaveText("0");
  });

  test("a milestone can be edited", async ({ page }) => {
    await addMilestone(page, sampleMilestones[0]);
    await page.getByRole("button", { name: "Edit milestone 1" }).click();
    const form = page.getByRole("form", { name: "Edit milestone 1" });
    await form.getByLabel("Milestone name").fill("Knowledge base import");
    await form.getByLabel("Amount (USD)").fill("950");
    await form.getByRole("button", { name: "Save milestone" }).click();
    await expect(page.getByRole("heading", { name: "1 · Knowledge base import" })).toBeVisible();
    await expect(page.getByTestId("total-total-budget")).toHaveText("$950");
  });

  test("milestones can be reordered and deleted, and numbering stays in order", async ({ page }) => {
    for (const m of sampleMilestones) await addMilestone(page, m);
    const headings = page.getByRole("list", { name: "Milestones" }).getByRole("heading", { level: 3 });

    await page.getByRole("button", { name: "Move milestone 3 up" }).click();
    await expect(headings.nth(1)).toHaveText(`2 · ${sampleMilestones[2].title}`);
    await expect(page.getByRole("button", { name: "Move milestone 1 up" })).toBeDisabled();

    await page.getByRole("button", { name: "Delete milestone 1" }).click();
    await expect(headings).toHaveCount(2);
    await expect(headings.nth(0)).toHaveText(`1 · ${sampleMilestones[2].title}`);
    await expect(headings.nth(1)).toHaveText(`2 · ${sampleMilestones[1].title}`);
  });

  test("project details can be updated", async ({ page }) => {
    await page.getByRole("textbox", { name: "Project name" }).fill("Store helper bot");
    await page.getByRole("textbox", { name: /One-line summary/ }).fill("Answers customer questions day and night.");
    await page.getByRole("button", { name: "Save details" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: "Store helper bot" })).toBeVisible();
  });

  test("you can't publish without milestones and skills", async ({ page }) => {
    const publish = page.getByRole("button", { name: "Approve plan & find matches" });
    await expect(publish).toBeDisabled();
    await expect(page.getByText("Add at least one milestone and pick the skills it needs first.")).toBeVisible();
    await addMilestone(page, sampleMilestones[0]);
    await expect(publish).toBeDisabled();
    await setProjectSkills(page, ["AI chatbots"]);
    await expect(publish).toBeEnabled();
  });

  test("a published plan is locked from editing", async ({ page }) => {
    const id = page.url().split("/").at(-2);
    await addMilestone(page, sampleMilestones[0]);
    await setProjectSkills(page, ["AI chatbots"]);
    await page.getByRole("button", { name: "Approve plan & find matches" }).click();
    await expect(page).toHaveURL(`/projects/${id}/matches`);
    await page.goto(`/projects/${id}/plan`);
    await expect(page).toHaveURL(`/projects/${id}`);
  });

  test("a draft can be deleted", async ({ page }) => {
    await page.getByRole("button", { name: "Delete draft" }).click();
    await expect(page).toHaveURL("/projects");
    await expect(page.getByRole("heading", { name: "No projects yet" })).toBeVisible();
  });

  test("drafts appear in the projects list and open the plan", async ({ page }) => {
    await addMilestone(page, sampleMilestones[0]);
    await page.goto("/projects");
    const card = page.getByRole("link", { name: /Customer support chatbot/ });
    await expect(card).toContainText("Draft plan");
    await expect(card).toContainText("$800");
    await card.click();
    await expect(page).toHaveURL(/\/plan$/);
  });
});

test.describe("privacy between accounts", () => {
  test("another business owner can't see your project", async ({ page, browser }) => {
    await signUpViaApi(page, "client");
    const id = await createProject(page, "Secret project");

    const other = await browser.newContext();
    const otherPage = await other.newPage();
    await signUpViaApi(otherPage, "client", "Other Owner");
    for (const path of [`/projects/${id}`, `/projects/${id}/plan`, `/projects/${id}/matches`]) {
      await otherPage.goto(path);
      await expect(otherPage.getByRole("heading", { name: "We couldn't find that page" }), path).toBeVisible();
      await expect(otherPage.getByText("Secret project"), path).toHaveCount(0);
    }
    await otherPage.goto("/projects");
    await expect(otherPage.getByText("Secret project")).toHaveCount(0);
    await other.close();
  });

  test("developers can't open a business owner's project", async ({ page, browser }) => {
    await signUpViaApi(page, "client");
    const id = await createProject(page);

    const dev = await browser.newContext();
    const devPage = await dev.newPage();
    await signUpViaApi(devPage, "developer");
    await devPage.goto(`/projects/${id}`);
    await expect(devPage).toHaveURL("/dashboard");
    await dev.close();
  });

  test("made-up project ids show the 404 page", async ({ page }) => {
    await signUpViaApi(page, "client");
    await page.goto("/projects/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});

test("large naira-sized amounts are accepted", async ({ page }) => {
  await signUpViaApi(page, "client");
  await createProject(page);
  await addMilestone(page, { title: "Big milestone", criteria: ["Works"], amount: 2_500_000, days: 20 });
  await expect(page.getByTestId("total-milestones")).toHaveText("1");
});
