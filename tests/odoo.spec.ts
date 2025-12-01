import { test, expect } from '@playwright/test';

test('odoo sales order to invoice', async ({ page }) => {
    await page.goto('https://lincoln-university.odoo.com/odoo/sales');
    await page.getByRole('textbox', { name: 'Email' }).fill('yansongc@gmail.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Hust510@od');
    await page.getByRole('button', { name: 'Log in' }).click();

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
    await page.waitForTimeout(300);
    await firstOption.click();

    // 5. 【关键步骤】模拟键盘按下 Enter 键
    // 大多数自动补全组件在结果列表出现时，敲击 Enter 键会选中当前高亮（或第一个）的选项。
    await customer_input.press('Enter');
    await page.waitForTimeout(300);

    // 6. 验证：断言输入框的值已被选中结果更新，或者页面跳转/出现新的元素
    // 假设选中后输入框的值会变成最终选中的产品名称
    await expect(customer_input).toHaveValue(searchText);


    await page.getByRole('button', { name: 'Add a product' }).click();

    const product_input = page.getByRole('combobox', { name: 'Search a product' });

    await product_input.click();
    const product_searchText = 'product1';
    await product_input.fill(product_searchText);
    const product_firstOption = page.getByRole('option', { name: product_searchText }).first();
    await product_firstOption.waitFor({ state: 'visible' });
    await product_firstOption.click();
    // await product_input.press('Enter');
    await expect(product_input).toHaveValue(product_searchText);


    // await page.getByRole('combobox', { name: 'Search a product' }).click();
    // await page.getByRole('option', { name: 'product1' }).waitFor();
    // await page.getByRole('option', { name: 'product1' }).click();
    // await page.waitForTimeout(300);

    // await page.getByRole('button', { name: 'Save manually' }).click();
    await page.locator('button[aria-label="Save manually"]').click();
    await page.waitForTimeout(300);

    const order_number = await page.locator('.oe_title').innerText();
    expect(order_number).toMatch(/^S\d+/)
    console.log(`Sales order number: ${order_number}`);

    let activeButton = page.locator('.o_statusbar_status button.o_arrow_button_current');
    await expect(activeButton).toHaveText('Quotation');

    await page.getByRole('link', { name: 'Quotations' }).click();

    //confirm the sales order
    await page.getByRole('searchbox').fill(order_number);
    await page.getByRole('menuitem', { name: `Search Order for: ${order_number}` }).click();

    await page.locator('tr.o_data_row').first().click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    activeButton = page.locator('.o_statusbar_status button.o_arrow_button_current');
    await expect(activeButton).toHaveText('Sales Order');

    await page.getByRole('link', { name: 'Quotations' }).click();

    //create a invoice
    await page.getByRole('searchbox').fill(order_number);
    await page.getByRole('menuitem', { name: `Search Order for: ${order_number}` }).click();

    await page.locator('tr.o_data_row').first().click();
    await page.getByRole('button', { name: 'Create Invoice' }).click();
    await page.getByRole('button', { name: 'Create Draft' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    activeButton = page.locator('button.o_arrow_button_current');
    await expect(activeButton).toHaveText('Posted');

    //logout
    await page.locator('.o_user_menu button.dropdown-toggle').click();
    await page.getByRole('menuitem', { name: 'Log out' }).waitFor({ state: 'visible' });
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await page.waitForTimeout(300);
});