import { test, expect } from '@playwright/test';

test('has title and renders landing page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/BhoomiAI/);
});
