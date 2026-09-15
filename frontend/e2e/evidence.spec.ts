 import { test, expect } from '@playwright/test';

test.describe('Phase 6: Explainable Evidence-Linked AI & Split-Screen Viewer', () => {
  test('should load Evidence Viewer and render split-screen interface', async ({ page }) => {
    // Navigate directly to Evidence Viewer
    await page.goto('/citizen/evidence');

    // Verify page title and header
    await expect(page).toHaveTitle(/BhoomiAI/);
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Verify Left Viewport: document tabs & canvas
    await expect(page.getByText('Document:', { exact: false })).toBeVisible();
    await expect(page.locator('#document-viewport-image')).toBeVisible();

    // Verify Right Pane: Explainable AI Inspector
    await expect(page.getByText(/WHAT\? \(What is different across documents\?\)/i)).toBeVisible();
    await expect(page.getByText(/WHY\? \(Explainable AI Rationale\)/i)).toBeVisible();
    await expect(page.getByText(/WHERE\? \(Verifiable Source Citations\)/i)).toBeVisible();
  });

  test('should support page navigation and zoom controls in left document viewport', async ({ page }) => {
    await page.goto('/citizen/evidence');
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Verify initial page indicator
    await expect(page.getByText(/Page 1/i).first()).toBeVisible();

    // Click Next Page button
    const nextPageBtn = page.getByTitle('Next Page');
    await expect(nextPageBtn).toBeVisible();
    await nextPageBtn.click();
    await expect(page.getByText(/Page 2/i).first()).toBeVisible();

    // Click Previous Page button
    const prevPageBtn = page.getByTitle('Previous Page');
    await expect(prevPageBtn).toBeVisible();
    await prevPageBtn.click();
    await expect(page.getByText(/Page 1/i).first()).toBeVisible();

    // Test Zoom In (+)
    const zoomInBtn = page.getByTitle('Zoom In');
    await zoomInBtn.click();
    await expect(page.getByText('115%')).toBeVisible();

    // Test Reset Zoom (100%)
    const resetZoomBtn = page.getByTitle('Reset to 100%');
    await resetZoomBtn.click();
    await expect(page.getByText('100%')).toBeVisible();

    // Test Zoom Out (-)
    const zoomOutBtn = page.getByTitle('Zoom Out');
    await zoomOutBtn.click();
    await expect(page.getByText('85%')).toBeVisible();
  });

  test('should switch documents across the cadastral triad', async ({ page }) => {
    await page.goto('/citizen/evidence');
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Document buttons in the top left tabs
    const docButtons = page.locator('div.border-b.border-slate-200 button').filter({ hasText: /(Sale Deed|Mutation|7\/12)/i });
    const count = await docButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Switch to second document
    await docButtons.nth(1).click();
    await expect(page.locator('#document-viewport-image')).toBeVisible();

    // Switch to first document
    await docButtons.nth(0).click();
    await expect(page.locator('#document-viewport-image')).toBeVisible();
  });

  test('should inspect conflicts with WHAT? WHY? WHERE? and highlighted bounding box', async ({ page }) => {
    await page.goto('/citizen/evidence?field=owner_name');
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Verify Owner Name field header
    await expect(page.getByRole('heading', { name: 'Owner Name' })).toBeVisible();

    // Verify Bounding Box overlay is rendered on the document viewport
    const boundingBox = page.locator('#highlighted-source-region');
    await expect(boundingBox).toBeVisible();
    await expect(boundingBox).toHaveClass(/animate-pulse/);

    // Verify WHAT? answers what is different
    const whatCard = page.locator('div').filter({ hasText: /WHAT\? \(What is different/i });
    await expect(whatCard.first()).toBeVisible();
    await expect(page.getByText(/Rajesh Kumar/i).first()).toBeVisible();
    await expect(page.getByText(/Rakesh Kumar/i).first()).toBeVisible();

    // Verify WHY? answers why it was flagged in non-accusatory language
    const whyCard = page.locator('div').filter({ hasText: /WHY\? \(Explainable AI Rationale\)/i });
    await expect(whyCard.first()).toBeVisible();
    await expect(page.getByText(/The owner names differ between/i).first()).toBeVisible();
    await expect(page.getByText(/Manual verification is recommended/i).first()).toBeVisible();

    // Ensure NO accusatory language ("fraud detected")
    const pageContent = await page.innerText('body');
    expect(pageContent.toLowerCase()).not.toContain('fraud detected');

    // Verify WHERE? provides source citations and focus button
    const whereCard = page.locator('div').filter({ hasText: /WHERE\? \(Verifiable Source Citations\)/i });
    await expect(whereCard.first()).toBeVisible();
    await expect(page.getByText(/Page 1/i).first()).toBeVisible();

    // Click "Focus in Viewer" button
    const focusBtn = page.getByRole('button', { name: /Focus in Viewer/i }).first();
    if (await focusBtn.isVisible()) {
      await focusBtn.click();
      await expect(page.getByText(/Viewing in Left Pane/i).first()).toBeVisible();
    }
  });

  test('should clearly separate Extraction Confidence from Operational Risk', async ({ page }) => {
    await page.goto('/citizen/evidence?field=owner_name');
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Verify Extraction Confidence section
    await expect(page.getByText('Extraction Confidence')).toBeVisible();
    await expect(page.getByText(/High/i).first()).toBeVisible();
    await expect(page.getByText(/Optical character clarity/i)).toBeVisible();

    // Verify Operational Risk section
    await expect(page.getByText('Operational Risk')).toBeVisible();
    await expect(page.getByText(/CRITICAL RISK|HIGH RISK/i).first()).toBeVisible();
    await expect(page.getByText(/Cadastral title integrity/i)).toBeVisible();

    // Open and inspect the 6 Operational Risk Dimensions
    const riskDimensionsBtn = page.getByRole('button', { name: /View 6 Risk Dimensions/i });
    await expect(riskDimensionsBtn).toBeVisible();
    await riskDimensionsBtn.click();

    // Verify all 6 dimensions are displayed
    await expect(page.getByText(/Cadastral Operational Risk Architecture/i)).toBeVisible();
    await expect(page.getByText('Conflicting Owner').first()).toBeVisible();
    await expect(page.getByText('Conflicting Survey / Gat Number').first()).toBeVisible();
    await expect(page.getByText('Area Discrepancy').first()).toBeVisible();
    await expect(page.getByText('Missing Supporting Document').first()).toBeVisible();
    await expect(page.getByText('OCR Quality Assessment').first()).toBeVisible();
    await expect(page.getByText('Chronology Inconsistency').first()).toBeVisible();
  });

  test('should allow citizen review action on conflict', async ({ page }) => {
    await page.goto('/citizen/evidence?field=owner_name');
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible({ timeout: 15000 });

    // Verify Confirm / Verify action button
    const verifyBtn = page.getByRole('button', { name: /Confirm \/ Verify/i });
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      // Verify success feedback
      await expect(page.getByText(/Field status updated to VERIFIED/i)).toBeVisible({ timeout: 8000 });
    }
  });

  test('should navigate seamlessly to Evidence Viewer from Analysis conflict banner and modal', async ({ page }) => {
    await page.goto('/citizen/analysis');

    // Select triad
    const triadBtn = page.getByRole('button', { name: /Select Triad/i });
    await expect(triadBtn).toBeVisible();
    await triadBtn.click();

    // Wait for reconciliation report
    await expect(page.getByText(/Cadastral Inconsistency Advisory/i)).toBeVisible({ timeout: 15000 });

    // Click "Inspect in Evidence Viewer" on first conflict
    const inspectEvidenceBtn = page.getByRole('link', { name: /Inspect in Evidence Viewer/i }).first();
    await expect(inspectEvidenceBtn).toBeVisible();
    await inspectEvidenceBtn.click();

    // Verify URL and Evidence Viewer loaded
    await expect(page).toHaveURL(/\/citizen\/evidence/);
    await expect(page.getByRole('heading', { name: 'Cross-Document Evidence Inspector' })).toBeVisible();
    await expect(page.locator('#highlighted-source-region')).toBeVisible();
  });
});
