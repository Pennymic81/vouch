import { expect, type Page } from "@playwright/test";

export type Role = "client" | "developer";

let counter = 0;
export function uniqueEmail(prefix = "user") {
  counter += 1;
  return `${prefix}-${Date.now()}-${process.pid}-${counter}-${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export const PASSWORD = "correct-horse-battery";

/** Creates an account through the API and leaves the browser signed in. */
export async function signUpViaApi(page: Page, role: Role, name = role === "client" ? "Ada Obi" : "Tunde Bello") {
  const email = uniqueEmail(role);
  const res = await page.request.post("/api/auth/sign-up/email", {
    data: { name, email, password: PASSWORD, role },
  });
  expect(res.ok(), await res.text()).toBeTruthy();
  return { email, name, password: PASSWORD };
}

/** Fills in and submits the real sign-up form. */
export async function signUpViaForm(page: Page, role: Role, name: string, email = uniqueEmail(role)) {
  await page.goto(role === "developer" ? "/signup?role=developer" : "/signup");
  await expect(page.getByRole("radio", { name: role === "client" ? /A business owner/ : /A developer or AI engineer/ })).toBeChecked();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Work email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  return email;
}

export type MilestoneInput = { title: string; criteria: string[]; amount: number; days: number };

/** Creates a draft project through the real form and lands on its plan page. */
export async function createProject(page: Page, title = "Customer support chatbot") {
  await page.goto("/projects/new");
  await page.getByLabel("Project name").fill(title);
  await page
    .getByLabel("Describe your idea")
    .fill("I run an online furniture store. Customers keep asking about delivery and returns on WhatsApp and our website.");
  await page.getByRole("button", { name: "Continue to plan" }).click();
  await expect(page).toHaveURL(/\/projects\/[0-9a-f-]{36}\/plan$/);
  return page.url().split("/").at(-2)!;
}

/** Adds a milestone using the plan page's form. */
export async function addMilestone(page: Page, m: MilestoneInput) {
  const form = page.getByRole("form", { name: "New milestone" });
  if (!(await form.isVisible())) await page.getByRole("button", { name: "+ Add a milestone" }).click();
  await form.getByLabel("Milestone name").fill(m.title);
  await form.getByLabel(/What "done" means/).fill(m.criteria.join("\n"));
  await form.getByLabel("Amount (USD)").fill(String(m.amount));
  await form.getByLabel("Days to complete").fill(String(m.days));
  await form.getByRole("button", { name: "Add milestone" }).click();
  await expect(page.getByRole("list", { name: "Milestones" }).getByRole("heading", { name: new RegExp(m.title) })).toBeVisible();
}

export const sampleMilestones: MilestoneInput[] = [
  { title: "Knowledge base & FAQ import", criteria: ["Policies loaded into the bot", "Answers 20 test questions correctly"], amount: 800, days: 7 },
  { title: "Chat widget on your website", criteria: ["Works on every page and on phones"], amount: 600, days: 5 },
  { title: "WhatsApp and hand-off to staff", criteria: ["Same answers on WhatsApp", "Hard questions go to a staff inbox"], amount: 1200, days: 10 },
];

/** Ticks skills in a SkillPicker inside the given form (or the page). */
export async function pickSkills(scope: Page | import("@playwright/test").Locator, skills: string[]) {
  for (const s of skills) await scope.getByRole("checkbox", { name: s, exact: true }).check({ force: true });
}

/** Saves the project's skills on the plan page. */
export async function setProjectSkills(page: Page, skills: string[]) {
  const form = page.getByRole("form", { name: "Skills needed" });
  await pickSkills(form, skills);
  await form.getByRole("button", { name: "Save skills" }).click();
  await expect(form.getByRole("status")).toContainText("Skills saved");
}

export type DevSetup = {
  name: string;
  headline?: string;
  rate?: number;
  skills: string[];
  available?: boolean;
  proofs?: { title: string; skills: string[] }[];
};

/** Signs up a developer in a fresh browser context and fills in their profile and proof. */
export async function createDeveloper(browser: import("@playwright/test").Browser, d: DevSetup) {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on("dialog", (x) => x.accept());
  const account = await signUpViaApi(page, "developer", d.name);
  await page.goto("/dashboard/profile");
  const form = page.getByRole("form", { name: "Your profile" });
  await form.getByLabel("Headline").fill(d.headline ?? `${d.name} · builds things that work`);
  await form.getByLabel("Hourly rate (USD)").fill(String(d.rate ?? 50));
  await pickSkills(form, d.skills);
  if (d.available === false) await form.getByLabel("Available for new projects").uncheck();
  await form.getByRole("button", { name: /Create profile|Save profile/ }).click();
  await expect(form.getByRole("status")).toContainText("Profile saved");

  for (const p of d.proofs ?? []) {
    const pf = page.getByRole("form", { name: "Add shipped work" });
    await pf.getByLabel("What you built").fill(p.title);
    await pf.getByLabel(/Link/).fill(`https://example.com/${encodeURIComponent(p.title)}`);
    await pickSkills(pf, p.skills);
    await pf.getByRole("button", { name: "Add to my proof" }).click();
    await expect(page.getByRole("list", { name: "Your shipped work" }).getByRole("heading", { name: p.title })).toBeVisible();
  }
  return { context, page, ...account };
}

/** Signs in a client, writes a plan with the AI stand-in, publishes it, and returns the project id. */
export async function publishedProject(page: Page, title: string) {
  await signUpViaApi(page, "client");
  const id = await createProject(page, title);
  await page.getByRole("button", { name: "Write my plan with AI" }).click();
  await expect(page.getByTestId("total-milestones")).toHaveText("3");
  await page.getByRole("button", { name: "Approve plan & find matches" }).click();
  await expect(page).toHaveURL(`/projects/${id}/matches`);
  // Other tests add developers too, so view every match rather than the top 10.
  await page.goto(`/projects/${id}/matches?all=1`);
  return id;
}

/** Signs up a Vouch QA reviewer (any email on the test reviewer domain) in its own browser context. */
export async function createReviewer(browser: import("@playwright/test").Browser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = `qa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@qa.vouch.test`;
  const res = await page.request.post("/api/auth/sign-up/email", {
    data: { name: "Quinn Reviewer", email, password: PASSWORD, role: "client" },
  });
  expect(res.ok()).toBeTruthy();
  return { context, page, email };
}

/**
 * A project that's ready for delivery: the owner (on `page`) published an AI plan
 * (3 milestones: $700, $500, $600) and a matching developer accepted it.
 */
export async function hiredProject(page: Page, browser: import("@playwright/test").Browser) {
  const t = Math.random().toString(36).slice(2, 7).toUpperCase();
  const dev = await createDeveloper(browser, {
    name: `Builder ${t}`,
    skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"],
    proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"] }],
  });
  const id = await publishedProject(page, `Delivery project ${t}`);
  await page.getByRole("button", { name: `Invite Builder ${t} to this project` }).click();
  await expect(page.getByText(`Invited — waiting for Builder`)).toBeVisible();

  await dev.page.goto("/dashboard");
  await dev.page.getByRole("link", { name: "Read the plan" }).first().click();
  await dev.page.getByRole("button", { name: "Accept & join project" }).click();
  await expect(dev.page.getByText("You're on this project")).toBeVisible();

  await page.goto(`/projects/${id}`);
  page.on("dialog", (d) => d.accept());
  return { id, dev, devName: `Builder ${t}`, title: `Delivery project ${t}` };
}

/** Developer hands in a milestone from their project page. */
export async function submitWork(devPage: Page, projectId: string, position: number, note = "Everything on the list is done. Try it with the demo link.") {
  await devPage.goto(`/dashboard/projects/${projectId}`);
  const form = devPage.getByRole("form", { name: `Submit milestone ${position}` });
  await form.getByLabel("What you delivered").fill(note);
  await form.getByLabel("Demo link").fill(`https://demo.example.com/m${position}`);
  await form.getByRole("button", { name: "Submit for QA" }).click();
  await expect(devPage.getByRole("listitem", { name: new RegExp(`^Milestone ${position}:`) })).toContainText("In QA review");
}

/** Reviewer marks every check; pass `fail` with indexes to fail and notes. */
export async function reviewWork(reviewerPage: Page, projectTitle: string, position: number, fail: Record<number, string> = {}) {
  await reviewerPage.goto("/review");
  await reviewerPage.getByRole("link", { name: new RegExp(`${projectTitle} · milestone ${position}`) }).click();
  const form = reviewerPage.getByRole("form", { name: "QA review" });
  await expect(form).toBeVisible(); // wait for the page to open before counting checks
  const groups = form.getByRole("group");
  const count = await groups.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const radio = groups.nth(i).getByRole("radio", { name: fail[i] !== undefined ? "Failed" : "Passed" });
    await radio.check();
    await expect(radio).toBeChecked();
    if (fail[i] !== undefined) await form.getByLabel(`Note for check ${i + 1}`).fill(fail[i]);
  }
  await form.getByRole("button", { name: "Submit review" }).click();
  await expect(reviewerPage).toHaveURL("/review");
}
