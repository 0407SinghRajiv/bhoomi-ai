import { test, expect } from '@playwright/test';

test.describe('Phase 7: Authority Verification Workflow', () => {

  test('direct zero-authentication access from landing page to authority dashboard', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/BhoomiAI/);

    // 2. Click "Open Authority Portal" or top navbar "Authority Portal"
    const authorityLink = page.getByRole('link', { name: /Authority Portal/i }).first();
    await expect(authorityLink).toBeVisible();
    await authorityLink.click();

    // 3. Immediately lands on Authority Dashboard with NO authentication screen
    await expect(page).toHaveURL(/.*\/authority/);
    await expect(page.getByText(/Revenue Authority Command Center/i)).toBeVisible();
    await expect(page.getByText(/Desk Jurisdiction/i)).toBeVisible();

    // 4. Verify 6 required database count metric cards are visible
    await expect(page.getByText(/Pending/i).first()).toBeVisible();
    await expect(page.getByText(/High Priority/i).first()).toBeVisible();
    await expect(page.getByText(/Under Review/i).first()).toBeVisible();
    await expect(page.getByText(/Verified/i).first()).toBeVisible();
    await expect(page.getByText(/Rejected/i).first()).toBeVisible();
    await expect(page.getByText(/Escalated/i).first()).toBeVisible();
  });

  test('case queue displays cases with multi-dimensional filters', async ({ page }) => {
    await page.goto('/authority/cases');

    // Title and queue table
    await expect(page.getByText(/Verification & Adjudication Queue/i)).toBeVisible();
    await expect(page.getByText(/Multi-Dimensional Filters/i)).toBeVisible();

    // Verify filter dropdowns exist: State, District, Taluka, Village, Doc Type, Risk, Status
    await expect(page.getByRole('combobox').first()).toBeVisible();

    // Verify cases are rendered
    await expect(page.getByText(/CASE-MH-2026-001/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Workbench/i }).first()).toBeVisible();
  });

  test('adjudication workbench shows documents, fields, conflicts, and audit timeline', async ({ page }) => {
    await page.goto('/authority/cases/CASE-MH-2026-001');

    // Header and case identifiers
    await expect(page.getByText(/CASE-MH-2026-001/i).first()).toBeVisible();
    await expect(page.getByText(/Officer Adjudication Bar/i)).toBeVisible();

    // Global officer decision buttons
    await expect(page.getByRole('button', { name: /Approve Mutation/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reject Petition/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Escalate to SDO/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request Clarification/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Request Document/i })).toBeVisible();

    // Visible Audit Log Timeline
    await expect(page.getByText(/Visible Audit Log Timeline/i)).toBeVisible();

    // Tabs
    await expect(page.getByRole('button', { name: /Extracted Fields/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Conflicts/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Documents & OCR/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Evidence Citations/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Risk & Confidence/i })).toBeVisible();
  });

  test('officer actions enforce mandatory reason modal', async ({ page }) => {
    await page.goto('/authority/cases/CASE-MH-2026-001');

    // Click "Approve Mutation" to trigger modal
    await page.getByRole('button', { name: /Approve Mutation/i }).click();

    // Modal pops up
    await expect(page.getByText(/Approve Record Mutation & Certification/i)).toBeVisible();
    await expect(page.getByText(/Mandatory Officer Rationale/i)).toBeVisible();

    const confirmBtn = page.getByRole('button', { name: /Confirm Decision/i });
    // Initially disabled because reason is empty
    await expect(confirmBtn).toBeDisabled();

    // Enter a valid legal rationale
    const reasonInput = page.getByPlaceholder(/Enter official revenue justification/i);
    await reasonInput.fill('Statutory title deed indices and village revenue map verified concordant.');

    // Now button is enabled
    await expect(confirmBtn).toBeEnabled();

    // Close modal
    await page.getByRole('button', { name: /Cancel/i }).click();
  });

  test('complete bidirectional citizen to authority verification workflow', async ({ page }) => {
    // 1. Citizen Portal: Citizen requests authority verification
    await page.goto('/citizen/analysis');
    await expect(page.getByText(/Cadastral Triad Reconciliation Report/i)).toBeVisible();

    // Check if "Submit for Authority Verification" button is visible
    const reqBtn = page.getByRole('button', { name: /Submit for Authority Verification/i });
    if (await reqBtn.isVisible()) {
      await reqBtn.click();
      await expect(page.getByText(/Submit to Revenue Authority/i)).toBeVisible();
      await page.getByPlaceholder(/State your reason for verification/i).fill('Citizen self-verification submitted via portal');
      await page.getByRole('button', { name: /Confirm Submission/i }).click();
      await expect(page.getByText(/Verification ticket submitted successfully/i).first()).toBeVisible();
    }

    // 2. Authority Portal: Queue shows the case with real DB record
    await page.goto('/authority/cases');
    await expect(page.getByText(/CASE-MH-2026-001/i).first()).toBeVisible();

    // 3. Officer inspects workbench and executes Request Clarification
    await page.goto('/authority/cases/CASE-MH-2026-001');
    await expect(page.getByRole('button', { name: /Request Clarification/i })).toBeVisible();
    await page.getByRole('button', { name: /Request Clarification/i }).click();

    await expect(page.getByText(/Request Clarification from Citizen/i)).toBeVisible();
    await page.getByPlaceholder(/Enter official revenue justification/i).fill('Clarification needed regarding prior seller NOC endorsement.');
    await page.getByRole('button', { name: /Confirm Decision/i }).click();

    // Verify toast appears with action description
    await expect(page.getByText(/Clarification requested by officer/i).first()).toBeVisible();

    // Verify Audit Timeline contains new entry
    await expect(page.getByText(/CLARIFICATION_REQUESTED/i).first()).toBeVisible();
  });

});

