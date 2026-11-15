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
