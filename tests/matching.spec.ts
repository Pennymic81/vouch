import { expect, test, type Page } from "@playwright/test";
import { createDeveloper, PASSWORD, publishedProject, uniqueEmail } from "./helpers";

// The AI stand-in gives every project these skills:
// "AI chatbots", "Knowledge base / RAG", "Website chat widget".
// Other tests create developers too, so every name here is made unique.

// These tests set up several accounts each, so give them more time under parallel load.
test.describe.configure({ timeout: 90_000 });

const tag = () => Math.random().toString(36).slice(2, 7).toUpperCase();

function matchCard(page: Page, name: string) {
  return page.getByRole("list", { name: "Matches" }).getByRole("listitem").filter({ has: page.getByRole("heading", { level: 2, name }) });
}

test.describe("developer profile", () => {
  test("a new developer is told how to start being matched", async ({ page }) => {
    await page.request.post("/api/auth/sign-up/email", {
      data: { name: "New Dev", email: uniqueEmail("dev"), password: PASSWORD, role: "developer" },
    });
    await page.goto("/dashboard");
    await expect(page.getByText("Not matched yet")).toBeVisible();
    await page.getByRole("link", { name: "Edit profile & proof" }).click();
    await expect(page.getByRole("note")).toContainText("You're not being matched yet");
  });

  test("profile and proof are validated", async ({ page }) => {
    await page.request.post("/api/auth/sign-up/email", {
      data: { name: "Val Dev", email: uniqueEmail("dev"), password: PASSWORD, role: "developer" },
    });
    await page.goto("/dashboard/profile");
    const form = page.getByRole("form", { name: "Your profile" });
    await form.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await form.getByLabel("Headline").fill("Hi");
    await form.getByRole("button", { name: "Create profile" }).click();
    await expect(form.getByText("Add a short headline")).toBeVisible();
    await expect(form.getByText("Enter your hourly rate.")).toBeVisible();
    await expect(form.getByText("Pick at least one skill.")).toBeVisible();

    const pf = page.getByRole("form", { name: "Add shipped work" });
    await pf.evaluate((f: HTMLFormElement) => (f.noValidate = true));
    await pf.getByLabel("What you built").fill("Insecure demo");
    await pf.getByLabel(/Link/).fill("http://example.com/demo");
    await pf.getByRole("button", { name: "Add to my proof" }).click();
    await expect(pf.getByText("Links must start with https://")).toBeVisible();
    await expect(pf.getByText("Pick at least one skill this work shows.")).toBeVisible();
  });

  test("a complete profile with proof reaches full strength and can remove proof", async ({ browser }) => {
    const dev = await createDeveloper(browser, {
      name: `Full Dev ${tag()}`,
      skills: ["AI chatbots", "Mobile apps"],
      proofs: [
        { title: "Helpdesk bot", skills: ["AI chatbots"] },
        { title: "Clinic app", skills: ["Mobile apps"] },
      ],
    });
    const page = dev.page;
    await page.getByRole("form", { name: "Your profile" }).getByLabel(/About you/).fill(
      "I build chatbots and mobile apps for small businesses, and I write clear weekly updates.",
    );
    await page.getByRole("form", { name: "Your profile" }).getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByRole("progressbar", { name: "Profile strength" })).toHaveAttribute("aria-valuenow", "100");

    await page.getByRole("button", { name: "Remove Clinic app" }).click();
    await expect(page.getByRole("list", { name: "Your shipped work" }).getByRole("heading")).toHaveCount(1);
    await dev.context.close();
  });
});

test.describe("matching", () => {
  test("developers are ranked by skills and shipped proof, with reasons and gaps", async ({ page, browser }) => {
    const t = tag();
    const best = await createDeveloper(browser, {
      name: `Best Match ${t}`,
      skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"],
      proofs: [
        { title: `Retail FAQ bot ${t}`, skills: ["AI chatbots", "Knowledge base / RAG"] },
        { title: `Store widget ${t}`, skills: ["Website chat widget"] },
      ],
    });
    const partial = await createDeveloper(browser, {
      name: `Partial Match ${t}`,
      skills: ["AI chatbots", "Mobile apps"],
      proofs: [{ title: `Simple bot ${t}`, skills: ["AI chatbots"] }],
    });
    const noProof = await createDeveloper(browser, { name: `No Proof ${t}`, skills: ["AI chatbots", "Knowledge base / RAG"] });
    const away = await createDeveloper(browser, {
      name: `Away Dev ${t}`,
      skills: ["AI chatbots"],
      available: false,
      proofs: [{ title: `Away bot ${t}`, skills: ["AI chatbots"] }],
    });
    const offTopic = await createDeveloper(browser, {
      name: `Mobile Only ${t}`,
      skills: ["Mobile apps"],
      proofs: [{ title: `Clinic app ${t}`, skills: ["Mobile apps"] }],
    });

    await publishedProject(page, `Bot project ${t}`);

    const bestCard = matchCard(page, `Best Match ${t}`);
    const partialCard = matchCard(page, `Partial Match ${t}`);
    await expect(bestCard).toContainText("100% match");
    await expect(bestCard).toContainText(`Shipped “Retail FAQ bot ${t}” — shows AI chatbots and Knowledge base / RAG`);
    await expect(partialCard).toBeVisible();
    await expect(partialCard).toContainText("No Knowledge base / RAG and Website chat widget experience yet");

    // Best fit is ranked above the partial match.
    const names = await page.getByRole("list", { name: "Matches" }).getByRole("heading", { level: 2 }).allTextContents();
    expect(names.indexOf(`Best Match ${t}`)).toBeLessThan(names.indexOf(`Partial Match ${t}`));

    // Not matched: no proof, unavailable, or unrelated skills.
    for (const n of [`No Proof ${t}`, `Away Dev ${t}`, `Mobile Only ${t}`]) {
      await expect(page.getByRole("heading", { level: 2, name: n })).toHaveCount(0);
    }
    for (const d of [best, partial, noProof, away, offTopic]) await d.context.close();
  });

  test("invite → developer reads the plan → accepts → joins the project", async ({ page, browser }) => {
    const t = tag();
    const first = await createDeveloper(browser, {
      name: `Amara ${t}`,
      skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"],
      proofs: [{ title: `FAQ bot ${t}`, skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"] }],
    });
    const second = await createDeveloper(browser, {
      name: `Daniel ${t}`,
      skills: ["AI chatbots"],
      proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots"] }],
    });

    const id = await publishedProject(page, `Hiring project ${t}`);
    await page.getByRole("button", { name: `Invite Amara ${t} to this project` }).click();
    await expect(matchCard(page, `Amara ${t}`).getByRole("status")).toContainText("Invited");
    await page.getByRole("button", { name: `Invite Daniel ${t} to this project` }).click();
    await expect(matchCard(page, `Daniel ${t}`).getByRole("status")).toContainText("Invited");

    await page.goto(`/projects/${id}`);
    await expect(page.getByRole("list", { name: "Invitations sent" }).getByRole("listitem")).toHaveCount(2);

    // Amara sees the invitation with the full plan, then accepts.
    const dev = first.page;
    await dev.goto("/dashboard");
    await expect(dev.getByRole("heading", { name: `Hiring project ${t}` })).toBeVisible();
    await dev.getByRole("link", { name: "Read the plan" }).first().click();
    await expect(dev.getByRole("heading", { name: "The plan you'd agree to" })).toBeVisible();
    await expect(dev.getByText("Collect your content and rules")).toBeVisible();
    await dev.getByRole("button", { name: "Accept & join project" }).click();
    await expect(dev.getByText("You're on this project")).toBeVisible();

    // The business owner sees who is building it.
    await page.reload();
    await expect(page.getByRole("heading", { name: `Amara ${t} is building this` })).toBeVisible();
    await expect(page.getByRole("main").getByText("In progress")).toBeVisible();

    // Daniel's invitation is closed automatically.
    await second.page.goto("/dashboard");
    await expect(second.page.getByRole("heading", { name: "Past invitations" })).toBeVisible();
    await expect(second.page.getByText("Closed")).toBeVisible();

    await first.context.close();
    await second.context.close();
  });

  test("a developer can decline, and the owner sees it", async ({ page, browser }) => {
    const t = tag();
    const dev = await createDeveloper(browser, {
      name: `Priya ${t}`,
      skills: ["AI chatbots"],
      proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots"] }],
    });
    const id = await publishedProject(page, `Decline project ${t}`);
    await page.getByRole("button", { name: `Invite Priya ${t} to this project` }).click();
    await expect(matchCard(page, `Priya ${t}`).getByRole("status")).toBeVisible();

    await dev.page.goto("/dashboard");
    await dev.page.getByRole("link", { name: "Read the plan" }).first().click();
    await dev.page.getByRole("button", { name: "Decline" }).click();
    await expect(dev.page).toHaveURL("/dashboard");

    await page.goto(`/projects/${id}/matches?all=1`);
    await expect(matchCard(page, `Priya ${t}`)).toContainText(`Priya declined`);
    await dev.context.close();
  });

  test("the owner can withdraw a pending invitation", async ({ page, browser }) => {
    page.on("dialog", (d) => d.accept());
    const t = tag();
    const dev = await createDeveloper(browser, {
      name: `Kofi ${t}`,
      skills: ["AI chatbots"],
      proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots"] }],
    });
    const id = await publishedProject(page, `Withdraw project ${t}`);
    await page.getByRole("button", { name: `Invite Kofi ${t} to this project` }).click();
    await expect(matchCard(page, `Kofi ${t}`).getByRole("status")).toBeVisible();

    await page.goto(`/projects/${id}`);
    await page.getByRole("button", { name: `Withdraw invitation to Kofi ${t}` }).click();
    await expect(page.getByRole("list", { name: "Invitations sent" })).toContainText("Withdrawn");

    await dev.page.goto("/dashboard");
    await expect(dev.page.getByText("No new invitations right now.")).toBeVisible();
    await dev.context.close();
  });

  test("invitations are private to the developer they were sent to", async ({ page, browser }) => {
    const t = tag();
    const invited = await createDeveloper(browser, {
      name: `Invited ${t}`,
      skills: ["AI chatbots"],
      proofs: [{ title: `Bot ${t}`, skills: ["AI chatbots"] }],
    });
    const other = await createDeveloper(browser, { name: `Other ${t}`, skills: ["AI chatbots"] });
    await publishedProject(page, `Private project ${t}`);
    await page.getByRole("button", { name: `Invite Invited ${t} to this project` }).click();
    await expect(matchCard(page, `Invited ${t}`).getByRole("status")).toBeVisible();

    await invited.page.goto("/dashboard");
    await invited.page.getByRole("link", { name: "Read the plan" }).first().click();
    await invited.page.waitForURL(/\/dashboard\/invitations\//);
    const url = invited.page.url();

    await other.page.goto(url);
    await expect(other.page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
    await expect(other.page.getByText(`Private project ${t}`)).toHaveCount(0);
    await invited.context.close();
    await other.context.close();
  });
});

test("long match lists show the top 10 first, with a way to see everyone", async ({ page, browser }) => {
  test.slow();
  const t = tag();
  const devs = [];
  for (let i = 0; i < 11; i++) {
    devs.push(
      await createDeveloper(browser, {
        name: `Crowd ${t} ${i}`,
        skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"],
        proofs: [{ title: `Crowd bot ${t} ${i}`, skills: ["AI chatbots", "Knowledge base / RAG", "Website chat widget"] }],
      }),
    );
  }
  const id = await publishedProject(page, `Crowded project ${t}`);
  await page.goto(`/projects/${id}/matches`);
  await expect(page.getByRole("list", { name: "Matches" }).getByRole("heading", { level: 2 })).toHaveCount(10);
  await page.getByRole("link", { name: /Show all \d+ matches/ }).click();
  await expect(page).toHaveURL(/\?all=1$/);
  expect(await page.getByRole("list", { name: "Matches" }).getByRole("heading", { level: 2 }).count()).toBeGreaterThan(10);
  for (const d of devs) await d.context.close();
});
