import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

test.describe.configure({ mode: "serial" });

test("job seeker applies to a job and duplicate applications are blocked", async ({ page }) => {
  await signIn(page, "seeker@kazi.test");
  await page.goto("/jobs?q=Audit%20Associate");
  await page.locator("article h3 a").first().click();
  await page.getByRole("link", { name: "Apply Now" }).first().click();
  await expect(page).toHaveURL(/\/apply$/);

  await page.getByLabel(/cover letter/i).fill("I have three years of audit-adjacent finance work and would love to grow with your team.");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review your application" })).toBeVisible();
  const applyUrl = page.url();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("heading", { name: "Application sent" })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/applications\/\w+\?applied=1/);
  await expect(page.getByText("Submitted").first()).toBeVisible();

  // Re-opening the apply page goes straight to the existing application instead of a second form.
  await page.goto(applyUrl);
  await expect(page).toHaveURL(/\/dashboard\/applications\/\w+$/);
});

test("employer moves a candidate through the pipeline and candidate sees the update", async ({ page, browser }) => {
  await signIn(page, "hr@nileledger.test");
  await page.goto("/employer/jobs");
  await page.getByRole("link", { name: "Audit Associate" }).click();
  const column = page.getByRole("region", { name: /^Applied/ });
  await column.getByRole("button", { name: /Move Alex Mukasa/ }).click();
  await page.getByRole("menuitem", { name: "Interview" }).click();
  await expect(page.getByText("Alex Mukasa moved to Interview")).toBeVisible();

  const seeker = await browser.newPage();
  await signIn(seeker, "seeker@kazi.test");
  await seeker.goto("/notifications");
  await expect(seeker.getByText("Your application is now: Interview").first()).toBeVisible();
  await seeker.close();
});

test("admin approves a job waiting for review", async ({ page }) => {
  await signIn(page, "admin@kazi.test");
  await page.goto("/admin/jobs?tab=review");
  const item = page.locator("li", { hasText: "Store Manager" }).first();
  await item.getByRole("button", { name: "Approve and publish" }).click();
  await expect(page.getByText("Job approved and published.")).toBeVisible();
  await page.goto("/jobs?q=Store%20Manager");
  await expect(page.locator("article").first()).toContainText("Store Manager");
});

test("suspicious listing stays out of public search", async ({ page }) => {
  await page.goto("/jobs?q=Dubai");
  await expect(page.getByText("No jobs match this search")).toBeVisible();
});
