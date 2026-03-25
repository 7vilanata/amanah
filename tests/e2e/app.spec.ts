import { expect, test } from "@playwright/test";

const runE2E = process.env.E2E_DATABASE_READY === "1";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Masuk ke Workspace/i }).click();
}

test.describe.serial("Amanah Project Hub", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!runE2E, "Set E2E_DATABASE_READY=1 dan seed MySQL sebelum menjalankan Playwright.");
    await login(page, "owner@amanah.local", "Password123!");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("owner can create project and task, then open board and calendar", async ({ page }) => {
    const stamp = Date.now();
    const projectName = `Project E2E ${stamp}`;
    const taskName = `Task E2E ${stamp}`;

    await page.goto("/projects");
    await page.getByPlaceholder("Website Retainer April").fill(projectName);
    await page.getByPlaceholder("PT Contoh Makmur").fill("Client E2E");
    await page.locator("input[name='startDate']").first().fill("2026-03-24");
    await page.locator("input[name='dueDate']").first().fill("2026-03-31");
    await page.getByRole("button", { name: /Tambah project/i }).click();
    await expect(page.getByText(projectName)).toBeVisible();

    await page.getByRole("link", { name: /Buka project/i }).first().click();
    await expect(page).toHaveURL(/\/projects\//);

    await page.getByRole("link", { name: "Tasks" }).click();
    await page.getByPlaceholder("Siapkan headline hero section").fill(taskName);
    await page.locator("input[name='startDate']").last().fill("2026-03-24");
    await page.locator("input[name='dueDate']").last().fill("2026-03-27");
    await page.getByRole("button", { name: /Tambah task/i }).click();
    await expect(page.getByText(taskName)).toBeVisible();

    await page.getByRole("link", { name: "Board" }).click();
    await expect(page.getByText("Kanban board")).toBeVisible();

    await page.getByRole("link", { name: "Calendar" }).click();
    await expect(page.getByText("Calendar view")).toBeVisible();
  });

  test("member is redirected away from team page", async ({ browser }) => {
    test.skip(!runE2E, "Set E2E_DATABASE_READY=1 dan seed MySQL sebelum menjalankan Playwright.");

    const context = await browser.newContext();
    const memberPage = await context.newPage();

    await login(memberPage, "member@amanah.local", "Password123!");
    await expect(memberPage).toHaveURL(/\/dashboard/);

    await memberPage.goto("/team");
    await expect(memberPage).toHaveURL(/\/dashboard/);

    await context.close();
  });
});
