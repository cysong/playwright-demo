import { test, expect, Page } from '@playwright/test';

// Global variable to store order number across tests
let orderNumber: string;

// Load environment variables
const ODOO_EMAIL = process.env.ODOO_EMAIL || '';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || '';
const ODOO_URL = process.env.ODOO_URL || '';

// Test data constants
const CUSTOMER_NAME = 'Lincoln University';
const PRODUCT_NAME = 'product1';

// Helper functions
async function selectComboboxOption(page: Page, comboboxLabel: string, optionValue: string) {
    await test.step(`Select ${comboboxLabel}: ${optionValue}`, async () => {
        const input = page.getByRole('combobox', { name: comboboxLabel });
        await input.click();
        await input.fill(optionValue);
        const option = page.getByRole('option', { name: optionValue }).first();
        await option.waitFor({ state: 'visible' });
        await option.click();
        await expect(input).toHaveValue(optionValue);
    });
}

async function verifyOrderStatus(page: Page, expectedStatus: string) {
    await expect(page.locator('.o_statusbar_status button.o_arrow_button_current'))
        .toHaveText(expectedStatus);
}

async function getAndVerifyDocumentNumber(page: Page, pattern: RegExp, label: string): Promise<string> {
    const documentNumber = await page.locator('.oe_title h1').innerText();
    expect(documentNumber).toMatch(pattern);

    // Log to console
    console.log(`${label}: ${documentNumber}`);

    // Attach to test report
    await test.info().attach(label, {
        body: documentNumber,
        contentType: 'text/plain'
    });

    return documentNumber;
}

async function searchAndOpenOrder(page: Page, orderNumber: string) {
    await test.step(`Search and open order: ${orderNumber}`, async () => {
        await page.getByRole('searchbox').fill(orderNumber);
        await page.getByRole('menuitem', { name: `Search Order for: ${orderNumber}` }).click();
        await page.locator('tr.o_data_row').first().click();
    });
}

async function verifyDocumentTitle(page: Page, expectedTitle: string) {
    await expect(page.locator('.oe_title h1')).toHaveText(expectedTitle);
}

test.describe.serial('Odoo Sales Order to Invoice Workflow', () => {

    test.beforeEach(async ({ page }) => {
        await test.step('Login', async () => {
            await page.goto(ODOO_URL);
            await page.getByRole('textbox', { name: 'Email' }).fill(ODOO_EMAIL);
            await page.getByRole('textbox', { name: 'Password' }).fill(ODOO_PASSWORD);
            await page.getByRole('button', { name: 'Log in' }).click();
        });
    });

    test.afterEach(async ({ page }) => {
        await test.step('Logout', async () => {
            await page.locator('.o_user_menu button.dropdown-toggle').click();
            await page.getByRole('menuitem', { name: 'Log out' }).waitFor({ state: 'visible' });
            await page.getByRole('menuitem', { name: 'Log out' }).click();
            // Wait for URL to change to login page
            await page.waitForURL(/\/web\/login/);
        });
    });

    test('Test Case 1: Create Sales Order', async ({ page }) => {
        await test.step('Create new sales order', async () => {
            await page.getByRole('button', { name: 'New' }).click();
            // Wait for URL to change from list view to new order form
            await page.waitForURL(/\/odoo\/sales\/new/);

            await selectComboboxOption(page, 'Customer', CUSTOMER_NAME);

            await page.getByRole('button', { name: 'Add a product' }).click();
            await selectComboboxOption(page, 'Search a product', PRODUCT_NAME);
        });


        await test.step('Save sales order', async () => {
            await page.locator('button[aria-label="Save manually"]').click();
            // Wait for URL to change from /new to actual order ID (e.g., /74)
            await page.waitForURL(/\/odoo\/sales\/\d+/);
        });

        orderNumber = await getAndVerifyDocumentNumber(page, /^S\d+/, 'Sales order number');
        await verifyOrderStatus(page, 'Quotation');
    });

    test('Test Case 2: Confirm Sales Order', async ({ page }) => {
        await searchAndOpenOrder(page, orderNumber);

        await verifyDocumentTitle(page, orderNumber);
        await verifyOrderStatus(page, 'Quotation');

        await test.step('Confirm sales order', async () => {
            await page.getByRole('button', { name: 'Confirm' }).click();
        });

        await verifyOrderStatus(page, 'Sales Order');
    });

    test('Test Case 3: Create Invoice', async ({ page }) => {
        await searchAndOpenOrder(page, orderNumber);

        await verifyDocumentTitle(page, orderNumber);
        await verifyOrderStatus(page, 'Sales Order');

        await test.step('Create invoice from sales order', async () => {
            await page.getByRole('button', { name: 'Create Invoice' }).click();
            await page.getByRole('button', { name: 'Create Draft' }).click();
        });

        await test.step('Confirm invoice', async () => {
            await page.getByRole('button', { name: 'Confirm' }).click();
        });

        await verifyOrderStatus(page, 'Posted');
        await getAndVerifyDocumentNumber(page, /^INV/, 'Invoice number');
    });

});