import { test, expect } from '@playwright/test';

test.describe('Phase 5: Document Reconciliation Engine', () => {
  test('should load Document Reconciliation page and display comparison grid', async ({ page }) => {
    // Navigate to Citizen Analysis / Document Reconciliation
    await page.goto('/citizen/analysis');

    // Verify Page Title and Heading
    await expect(page).toHaveTitle(/BhoomiAI/);
    await expect(page.getByRole('heading', { name: 'Document Reconciliation' })).toBeVisible();

    // Verify Triad selection action is available and click to load canonical Triad
    const triadBtn = page.getByRole('button', { name: /Select Triad/i });
    await expect(triadBtn).toBeVisible();
    await triadBtn.click();

    // Wait for reconciliation comparison report to load
    await expect(page.getByText(/DOCUMENTS COMPARED: 3/i)).toBeVisible({ timeout: 15000 });

    // Verify Summary Cards
    await expect(page.getByText('Cadastral Fields Comparison Grid (17 Core Entities)')).toBeVisible();
    await expect(page.getByText('Total Fields')).toBeVisible();
    await expect(page.getByText('Exact Matches')).toBeVisible();

    // Verify Key Cadastral Fields in Table
    await expect(page.getByText('Owner Name').first()).toBeVisible();
    await expect(page.getByText('Survey Number').first()).toBeVisible();
    await expect(page.getByText('Area').first()).toBeVisible();
    await expect(page.getByText('Village').first()).toBeVisible();
    await expect(page.getByText('District').first()).toBeVisible();
    await expect(page.getByText('Mutation Date').first()).toBeVisible();

    // Verify Owner Name conflict state is visible
    const conflictBadges = page.getByText('Conflict');
    await expect(conflictBadges.first()).toBeVisible();

    // Click inspect on Owner Name row
    const ownerRow = page.locator('tr').filter({ hasText: 'Owner Name' });
    await ownerRow.getByRole('button', { name: /Inspect/i }).click();

    // Modal opens: verify detailed explanation
    await expect(page.getByText(/Owner Name — Cadastral Evidence/i)).toBeVisible();
    await expect(page.getByText(/Potential inconsistency detected/i).first()).toBeVisible();
    await expect(page.getByText(/Manual verification recommended/i).first()).toBeVisible();

    // Ensure non-accusatory language: NEVER say "fraud detected"
    const modalContent = await page.locator('div.fixed.inset-0').innerText();
    expect(modalContent.toLowerCase()).not.toContain('fraud detected');

    // Close modal
    await page.getByRole('button', { name: /Close Inspection/i }).click();

    // Now inspect Area comparison
    const areaRow = page.locator('tr').filter({ hasText: 'Area' });
    await areaRow.getByRole('button', { name: /Inspect/i }).click();

    // Verify Area Conversion & Tolerance Scrutiny
    await expect(page.getByText(/Area Conversion & Tolerance Scrutiny/i)).toBeVisible();
    await expect(page.getByText(/Normalized \(Ha\)/i)).toBeVisible();
    await expect(page.getByText(/Tolerance Status/i)).toBeVisible();
  });

  test('should navigate from My Documents to Document Reconciliation with selected documents', async ({ page }) => {
    // Navigate to Citizen Documents
    await page.goto('/citizen/documents');

    // Check page loaded and wait for document items to populate
    await expect(page.getByText('Indexed Documents')).toBeVisible({ timeout: 10000 });

    // Select first two document checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes.first()).toBeVisible({ timeout: 10000 });
    const count = await checkboxes.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Click first and second document checkboxes (index 1 and 2, since index 0 is select-all)
    await checkboxes.nth(1).check();
    await checkboxes.nth(2).check();

    // Verify Reconcile button appears
    const reconcileBtn = page.getByRole('link', { name: /Reconcile Selected Documents/i });
    await expect(reconcileBtn).toBeVisible();

    // Click Reconcile button and assert navigation to /citizen/analysis
    await reconcileBtn.click();
    await expect(page).toHaveURL(/citizen\/analysis\?doc_ids=/);
    await expect(page.getByText(/DOCUMENTS COMPARED: 2/i)).toBeVisible({ timeout: 15000 });
  });
});
