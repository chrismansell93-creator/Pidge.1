import { test, expect } from "@playwright/test";

test("login lands on a nearby geo grid", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /see who/i }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("PIDGE").first()).toBeVisible();
  await expect(page.getByText("Soho").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Edit your profile" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Open Alex/i })).toBeVisible();
  await expect(page.getByText(/ft|mi|Here|m away|km away/).first()).toBeVisible();

  await page.getByRole("button", { name: /online/i }).click();
  await expect(page.getByRole("button", { name: "Edit your profile" })).toHaveCount(0);

  await page.getByRole("button", { name: /^nearby$/i }).click();
  await page.getByRole("button", { name: /Open Alex/i }).click();
  await expect(page.getByRole("heading", { name: /Alex/ })).toBeVisible();
  await page.getByRole("button", { name: "Tap" }).click();
  await expect(page.getByText(/Tapped Alex|Already tapped Alex/)).toBeVisible();

  await page.getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL("/inbox");
  await expect(page.getByRole("heading", { name: /No chats yet|Inbox/i })).toBeVisible();

  await page.getByRole("link", { name: "Taps" }).click();
  await expect(page).toHaveURL("/taps");
  await expect(page.getByText(/Taps/i).first()).toBeVisible();

  await page.getByRole("link", { name: "Me" }).click();
  await expect(page.getByRole("heading", { name: /How you show up nearby/i })).toBeVisible();
});
