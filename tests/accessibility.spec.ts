import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const paths = ["/", "/signup", "/projects/new", "/projects/new/matches", "/projects/support-chatbot", "/dashboard"];

for (const path of paths) {
  test(`${path} has no WCAG A/AA accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    expect(summary).toEqual([]);
  });
}

test("every page has exactly one h1", async ({ page }) => {
  for (const path of paths) {
    await page.goto(path);
    await expect(page.locator("h1"), path).toHaveCount(1);
  }
});

test("buttons and links are big enough to tap on phones", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone check");
  await page.goto("/");
  for (const name of ["Get started", "Open menu", "Start your project"]) {
    const el = page.getByRole(name === "Open menu" ? "button" : "link", { name }).first();
    const box = await el.boundingBox();
    expect(box?.height, name).toBeGreaterThanOrEqual(40);
  }
});
