import { expect, test } from "@playwright/test";
import { signUpViaApi } from "./helpers";

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
    await signUpViaApi(page, "developer");
    await page.goto("/dashboard");
    await expect(page.getByRole("navigation", { name: "App" }).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("the account menu shows who is signed in and closes with Escape", async ({ page }) => {
    await signUpViaApi(page, "developer", "Tunde Bello");
    await page.goto("/dashboard");
    await page.getByRole("button", { name: "TB, account menu" }).click();
    const menu = page.getByRole("menu", { name: "Account" });
    await expect(menu).toContainText("Tunde Bello");
    await expect(menu).toContainText("Developer / AI engineer");
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
  });

  test("the logo always leads home", async ({ page }) => {
    await signUpViaApi(page, "developer");
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
