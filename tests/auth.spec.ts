import { expect, test } from "@playwright/test";
import { PASSWORD, signUpViaApi, signUpViaForm, uniqueEmail } from "./helpers";

test.describe("sign up", () => {
  test("business owners land on the project planner, signed in", async ({ page }) => {
    await signUpViaForm(page, "client", "Ada Obi");
    await expect(page).toHaveURL("/projects/new");
    await expect(page.getByRole("button", { name: "AO, account menu" })).toBeVisible();
  });

  test("developers land on their dashboard, greeted by name", async ({ page }) => {
    await signUpViaForm(page, "developer", "Tunde Bello");
    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome, Tunde" })).toBeVisible();
    await expect(page.getByRole("button", { name: "TB, account menu" })).toBeVisible();
  });

  test("the role switch changes the optional field", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByLabel(/Company/)).toBeVisible();
    await page.getByRole("radio", { name: /A developer or AI engineer/ }).check();
    await expect(page.getByLabel(/Portfolio or GitHub/)).toBeVisible();
  });

  test("an email can only be used once", async ({ page }) => {
    const email = uniqueEmail("dup");
    await signUpViaForm(page, "client", "First Person", email);
    await expect(page).toHaveURL("/projects/new");
    await page.context().clearCookies();

    await signUpViaForm(page, "client", "Second Person", email);
    await expect(page.locator("form").getByRole("alert")).toContainText("already exists");
    await expect(page).toHaveURL(/\/signup/);
  });

  test("required fields are enforced", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/signup");
    expect(await page.getByLabel("Full name").evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
  });

  test("passwords shorter than 8 characters are rejected", async ({ page }) => {
    await page.goto("/signup");
    await page.getByLabel("Full name").fill("Ada Obi");
    await page.getByLabel("Work email").fill(uniqueEmail());
    await page.getByLabel("Password").fill("short");
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page).toHaveURL("/signup");
  });

  test("the server rejects short passwords even without the browser check", async ({ request }) => {
    const res = await request.post("/api/auth/sign-up/email", {
      data: { name: "Api User", email: uniqueEmail(), password: "short", role: "client" },
    });
    expect(res.ok()).toBe(false);
  });

  test("the server rejects made-up roles", async ({ request }) => {
    const res = await request.post("/api/auth/sign-up/email", {
      data: { name: "Api User", email: uniqueEmail(), password: PASSWORD, role: "admin" },
    });
    expect(res.ok()).toBe(false);
  });

  test("nobody can switch their role after signing up", async ({ page }) => {
    await signUpViaApi(page, "developer");
    const res = await page.request.post("/api/auth/update-user", { data: { role: "client" } });
    expect(res.ok()).toBe(false);
    await page.goto("/projects/new");
    await expect(page).toHaveURL("/dashboard");
  });
});

test.describe("sign in and out", () => {
  test("correct details sign you in to your own side of the app", async ({ page }) => {
    const { email } = await signUpViaApi(page, "developer");
    await page.context().clearCookies();

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/dashboard");
  });

  test("a wrong password shows a clear error", async ({ page }) => {
    const { email } = await signUpViaApi(page, "client");
    await page.context().clearCookies();

    await page.goto("/signin");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("don't match");
    await expect(page).toHaveURL("/signin");
  });

  test("an unknown email shows the same error (no account fishing)", async ({ page }) => {
    await page.goto("/signin");
    await page.getByLabel("Email").fill(uniqueEmail("nobody"));
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form").getByRole("alert")).toContainText("don't match");
  });

  test("signing out ends the session", async ({ page }) => {
    await signUpViaApi(page, "client");
    await page.goto("/projects/new");
    await page.getByRole("button", { name: /account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL("/");

    await page.goto("/projects/new");
    await expect(page).toHaveURL(/\/signin\?next=%2Fprojects%2Fnew/);
  });
});

test.describe("protected pages", () => {
  for (const path of ["/projects/new", "/projects/new/matches", "/projects/support-chatbot", "/dashboard"]) {
    test(`${path} sends signed-out visitors to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(`/signin?next=${encodeURIComponent(path)}`);
    });
  }

  test("after signing in you return to the page you wanted", async ({ page }) => {
    const { email } = await signUpViaApi(page, "client");
    await page.context().clearCookies();

    await page.goto("/projects/support-chatbot");
    await expect(page).toHaveURL(/\/signin/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/projects/support-chatbot");
  });

  test("?next cannot send people to another website", async ({ page }) => {
    const { email } = await signUpViaApi(page, "client");
    await page.context().clearCookies();

    await page.goto("/signin?next=//evil.example.com");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/projects/new");
  });

  test("developers can't open business-owner pages", async ({ page }) => {
    await signUpViaApi(page, "developer");
    await page.goto("/projects/new");
    await expect(page).toHaveURL("/dashboard");
  });

  test("business owners can't open the developer dashboard", async ({ page }) => {
    await signUpViaApi(page, "client");
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/projects/new");
  });

  test("a forged session cookie is not accepted", async ({ page, baseURL }) => {
    await page.context().addCookies([
      { name: "better-auth.session_token", value: "forged.value", url: baseURL! },
    ]);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin/);
  });
});
