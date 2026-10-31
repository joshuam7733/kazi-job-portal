import { expect, test } from "@playwright/test";

test("homepage search leads to filtered results", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your Next Opportunity");
  await page.getByRole("searchbox").first().fill("engineer");
  await page.getByRole("button", { name: "Search Jobs" }).click();
  await expect(page).toHaveURL(/\/jobs\?q=engineer/);
  await expect(page.getByText(/jobs? found/)).toBeVisible();
  await expect(page.locator("article").first()).toContainText(/engineer/i);
});

test("filters persist in the URL and survive reload", async ({ page }) => {
  await page.goto("/jobs");
  await page.getByRole("checkbox", { name: "Remote" }).check();
  await expect(page).toHaveURL(/wp=remote/);
  await page.reload();
  await expect(page.getByRole("checkbox", { name: "Remote" })).toBeChecked();
  for (const card of await page.locator("article").all()) await expect(card).toContainText("Remote");
});

test("job detail exposes JobPosting structured data", async ({ page }) => {
  await page.goto("/jobs");
  await page.locator("article h3 a").first().click();
  const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
  expect(JSON.parse(ld!)["@type"]).toBe("JobPosting");
  await expect(page.getByRole("link", { name: "Apply Now" }).first()).toBeVisible();
});

test("private areas redirect to sign-in", async ({ page }) => {
  await page.goto("/employer");
  await expect(page).toHaveURL(/\/signin\?callbackUrl=%2Femployer/);
});

test("no horizontal overflow on key pages @mobile", async ({ page }) => {
  for (const path of ["/", "/jobs", "/companies", "/resources", "/employers"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
  }
});
