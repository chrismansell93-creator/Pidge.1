import { test, expect } from "@playwright/test";

test("login lands on a nearby geo grid", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("test@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: /see who/i }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText("PIDGE").first()).toBeVisible();
  await expect(page.getByText("Soho").first()).toBeVisible();
  await expect(page.getByText("ME")).toBeVisible();
  await expect(page.getByText("Alex")).toBeVisible();
  await expect(page.getByText(/ft|mi|Here/).first()).toBeVisible();

  await page.getByRole("button", { name: /online/i }).click();
  await expect(page.getByText("ME")).toHaveCount(0);

  await page.getByRole("button", { name: /^nearby$/i }).click();
  await page.getByRole("button", { name: "Alex" }).click();
  await expect(page.getByRole("heading", { name: /Alex/ })).toBeVisible();
  await page.getByRole("button", { name: "Tap" }).click();
  await expect(page.getByText("Tapped Alex")).toBeVisible();

  await page.getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL("/inbox");
  await expect(page.getByRole("heading", { name: /No chats yet/i })).toBeVisible();

  await page.getByRole("link", { name: "Taps" }).click();
  await expect(page.getByRole("heading", { name: /Nobody has tapped you/i })).toBeVisible();

  await page.getByRole("link", { name: "Me" }).click();
  await expect(page.getByRole("heading", { name: /How you show up nearby/i })).toBeVisible();
});
