import { test, expect } from '@playwright/test';

// Global variable to store order number across tests
let orderNumber: string;

test.describe.serial('Odoo Sales Order to Invoice Workflow', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('https://lincoln-university.odoo.com/odoo/sales');
        await page.getByRole('textbox', { name: 'Email' }).fill('yansongc@gmail.com');
        await page.getByRole('textbox', { name: 'Password' }).fill('Hust510@od');
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

        //create a sales order
        await page.getByRole('button', { name: 'New' }).click();
        // 1. 定位到组合框 (输入框)
        const customer_input = page.getByRole('combobox', { name: 'Customer' });

        // 2. 确保输入框聚焦（如果直接 fill 无法触发下拉菜单，则需要先 click）
        await customer_input.click();

        // 3. 填充文本（触发搜索）
        const searchText = 'Lincoln University';
        await customer_input.pressSequentially(searchText);

        // 4. 等待结果出现 (通常是等待第一个选项出现)
        // 假设第一个结果是 'product1'
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
        // await page.getByRole('link', { name: 'Quotations' }).click();

        //confirm the sales order
        await page.getByRole('searchbox').fill(orderNumber);
        await page.getByRole('menuitem', { name: `Search Order for: ${orderNumber}` }).click();

        await page.locator('tr.o_data_row').first().click();

        await expect(page.locator('.oe_title')).toHaveText(orderNumber);
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Quotation');

        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Sales Order');
    });

    test('Test Case 3: Create Invoice', async ({ page }) => {
        // await page.getByRole('link', { name: 'Quotations' }).click();

        //create a invoice
        await page.getByRole('searchbox').fill(orderNumber);
        await page.getByRole('menuitem', { name: `Search Order for: ${orderNumber}` }).click();

        await page.locator('tr.o_data_row').first().click();

        await expect(page.locator('.oe_title')).toHaveText(orderNumber);
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Sales Order');

        await page.getByRole('button', { name: 'Create Invoice' }).click();
        await page.getByRole('button', { name: 'Create Draft' }).click();
        await page.getByRole('button', { name: 'Confirm' }).click();
        await expect(page.locator('.o_statusbar_status button.o_arrow_button_current')).toHaveText('Posted');
        const invoiceNumber = await page.locator('.oe_title').innerText();
        expect(invoiceNumber).toMatch(/^INV/)
        console.log(`Invoice number: ${invoiceNumber}`);
    });

});