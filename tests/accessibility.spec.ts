import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUpViaApi, type Role } from "./helpers";

const cases: { path: string; role?: Role }[] = [
  { path: "/" },
  { path: "/signup" },
  { path: "/signin" },
  { path: "/projects", role: "client" },
  { path: "/projects/new", role: "client" },
  { path: "/dashboard", role: "developer" },
];

for (const { path, role } of cases) {
  test(`${path} has no WCAG A/AA accessibility violations`, async ({ page }) => {
    if (role) await signUpViaApi(page, role);
    await page.goto(path);
    await page.locator("h1").waitFor();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
    expect(summary).toEqual([]);
  });

  test(`${path} has exactly one h1`, async ({ page }) => {
    if (role) await signUpViaApi(page, role);
    await page.goto(path);
    await page.locator("h1").first().waitFor();
    await expect(page.locator("h1")).toHaveCount(1);
  });
}

test("buttons and links are big enough to tap on phones", async ({ page, isMobile }) => {
  test.skip(!isMobile, "phone check");
  await page.goto("/");
  for (const name of ["Get started", "Open menu", "Start your project"]) {
    const el = page.getByRole(name === "Open menu" ? "button" : "link", { name }).first();
    const box = await el.boundingBox();
    expect(box?.height, name).toBeGreaterThanOrEqual(40);
  }
});
