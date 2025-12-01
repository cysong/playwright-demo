import { test, expect } from '@playwright/test';

// Global variable to store order number across tests
let orderNumber: string;

// Load environment variables
const ODOO_EMAIL = process.env.ODOO_EMAIL || '';
const ODOO_PASSWORD = process.env.ODOO_PASSWORD || '';
const ODOO_URL = process.env.ODOO_URL || '';

test.describe.serial('Odoo Sales Order to Invoice Workflow', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto(ODOO_URL);
        await page.getByRole('textbox', { name: 'Email' }).fill(ODOO_EMAIL);
        await page.getByRole('textbox', { name: 'Password' }).fill(ODOO_PASSWORD);
        await page.getByRole('button', { name: 'Log in' }).click();
    });

    test.afterEach(async ({ page }) => {
        // Logout after each test
        await page.locator('.o_user_menu button.dropdown-toggle').click();
        await page.getByRole('menuitem', { name: 'Log out' }).waitFor({ state: 'visible' });
        await page.getByRole('menuitem', { name: 'Log out' }).click();
        await page.waitForTimeout(300);
    });

    test('Test Case 1: Create Sales Order', async ({ page }) => {
        await page.getByRole('button', { name: 'New' }).click();

        const customer_input = page.getByRole('combobox', { name: 'Customer' });
        await customer_input.click();
        const searchText = 'Lincoln University';
        await customer_input.pressSequentially(searchText);
        const firstOption = page.getByRole('option', { name: searchText }).first();
        await firstOption.waitFor({ state: 'visible' });
        await firstOption.click();
        await expect(customer_input).toHaveValue(searchText);

        await page.getByRole('button', { name: 'Add a product' }).click();

        const product_input = page.getByRole('combobox', { name: 'Search a product' });
        await product_input.click();
        const product_searchText = 'product1';
        await product_input.fill(product_searchText);
        const product_firstOption = page.getByRole('option', { name: product_searchText }).first();
        await product_firstOption.waitFor({ state: 'visible' });
        await product_firstOption.click();
        await expect(product_input).toHaveValue(product_searchText);


        await page.locator('button[aria-label="Save manually"]').click();
        await page.waitForTimeout(300);

        orderNumber = await page.locator('.oe_title').innerText();
        expect(orderNumber).toMatch(/^S\d+/)
        console.log(`Sales order number: ${orderNumber}`);

        let activeButton = page.locator('.o_statusbar_status button.o_arrow_button_current');
        await expect(activeButton).toHaveText('Quotation');
    });

    test('Test Case 2: Confirm Sales Order', async ({ page }) => {
        await page.getByRole('searchbox').fill(orderNumber);
        await page.getByRole('menuitem', { name: `Search Order for: ${orderNumber}` }).click();

        await page.locator('tr.o_data_row').first().click();

        await expect(page.locator('.oe_title')).toHaveText(orderNumber);
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Quotation');

        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Sales Order');
    });

    test('Test Case 3: Create Invoice', async ({ page }) => {
        await page.getByRole('searchbox').fill(orderNumber);
        await page.getByRole('menuitem', { name: `Search Order for: ${orderNumber}` }).click();

        await page.locator('tr.o_data_row').first().click();

        await expect(page.locator('.oe_title')).toHaveText(orderNumber);
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Sales Order');

        await page.getByRole('button', { name: 'Create Invoice' }).click();
        await page.getByRole('button', { name: 'Create Draft' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Posted');
        const invoiceNumber = await page.locator('.oe_title h1').innerText();
        expect(invoiceNumber).toMatch(/^INV/)
        console.log(`Invoice number: ${invoiceNumber}`);
    });

});