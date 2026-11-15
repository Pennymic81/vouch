import { expect, test, type Page } from "@playwright/test";
import { signUpViaApi, type Role } from "./helpers";

type PageCase = { path: string; heading: string | RegExp; role?: Role };

const pages: PageCase[] = [
  { path: "/", heading: "Get your project built — and know it's built right." },
  { path: "/signup", heading: "Create your account" },
  { path: "/signin", heading: "Sign in to Vouch" },
  { path: "/projects", heading: "Your projects", role: "client" },
  { path: "/projects/new", heading: "What do you want to build?", role: "client" },
  { path: "/dashboard", heading: /^Welcome, Tunde$/, role: "developer" },
];

async function open(page: Page, c: PageCase) {
  if (c.role) await signUpViaApi(page, c.role);
  return page.goto(c.path);
}

for (const c of pages) {
  test.describe(`page ${c.path}`, () => {
    test("loads with its heading and no console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));

      const res = await open(page, c);
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { level: 1, name: c.heading, ...(typeof c.heading === "string" ? { exact: true } : {}) }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });

    test("has a page title", async ({ page }) => {
      await open(page, c);
      await expect(page).toHaveTitle(/Vouch/);
    });

    test("does not scroll sideways", async ({ page }) => {
      await open(page, c);
      await page.locator("h1").waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}

test("unknown routes show the 404 page", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist");
  expect(res?.status()).toBe(404);
});
