# Playwright Demo - Odoo ERP Testing

## Overview
Automated E2E testing suite for Odoo ERP system using Playwright. This project demonstrates the complete sales order to invoice workflow, covering critical business processes across Sales, Inventory, and Accounting modules.

## Test Cases

### Test Case 1: Create Sales Order
- Navigate to Sales module
- Create new quotation with customer and product
- Verify order number generation (format: `S\d+`)
- Validate status: **Quotation**

### Test Case 2: Confirm Sales Order
- Search and open the created sales order
- Confirm the order
- Validate status change: **Quotation** → **Sales Order**

### Test Case 3: Create Invoice
- Search and open the confirmed order
- Generate draft invoice
- Confirm invoice to post
- Verify invoice number (format: `INV/*`)
- Validate final status: **Posted**

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd playwright-demo

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Configure environment variables
cp .env.example .env
# Edit .env file and add your Odoo credentials
```

## Usage

### Run Tests
```bash
# Run all tests (headless)
npm test

# Run with browser UI visible
npm run test:headed

# Run in interactive UI mode
npm run test:ui

# View test report
npm run test:report
```

### Run Specific Test
```bash
# Run single test case
npx playwright test tests/odoo.spec.ts -g "Test Case 1"
```

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
ODOO_EMAIL=your-email@example.com
ODOO_PASSWORD=your-password
ODOO_URL=https://your-odoo-instance.odoo.com/odoo/sales
```


## Project Structure
```
playwright-demo/
├── tests/
│   └── odoo.spec.ts          # Main test suite
├── playwright.config.ts       # Playwright configuration
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment variables template
├── README.md                 # Project documentation
└── Specifics.md              # Test case specifications
```

## Features
- **Sequential Testing**: Uses `test.describe.serial()` for ordered test execution
- **Hooks**: `beforeEach` for login, `afterEach` for logout
- **Environment Configuration**: Credentials stored securely in `.env` file
- **State Management**: Global variable to share order number across tests
- **Assertions**: Validates status changes, order numbers, and invoice generation

## Notes
- Tests must run sequentially due to data dependencies
- Each test includes automatic login/logout via hooks
- Order number is shared across test cases using a global variable
- Sensitive credentials are loaded from `.env` file (not committed to git)



