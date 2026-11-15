import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", heading: "Get your project built — and know it's built right." },
  { path: "/signup", heading: "Create your account" },
  { path: "/projects/new", heading: "Your idea" },
  { path: "/projects/new/matches", heading: "3 matches for your chatbot" },
  { path: "/projects/support-chatbot", heading: "Customer support chatbot" },
  { path: "/dashboard", heading: "Good morning, Amara" },
];

for (const { path, heading } of pages) {
  test.describe(`page ${path}`, () => {
    test("loads with its heading and no console errors", async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));

      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    });

    test("has a page title", async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(/Vouch/);
    });

    test("does not scroll sideways", async ({ page }) => {
      await page.goto(path);
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
