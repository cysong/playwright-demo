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
- Odoo ERP instance with access credentials
- **Pre-created test data in Odoo:**
  - Customer: `Lincoln University`
  - Product: `product1`

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

# View test report (after test execution)
npm run test:report
```

### View Test Results
After running tests, Playwright generates detailed HTML reports:

```bash
# Generate and open HTML report
npx playwright show-report

# Reports include:
# - Test execution timeline
# - Screenshots and videos (on failure)
# - Console logs
# - Test steps with duration
# - Attached data (order numbers, invoice numbers)
```

**Report Features:**
- **Attachments**: Order and invoice numbers are attached to each test
- **Test Steps**: Structured steps show operation flow (e.g., "Select Customer: Lincoln University")
- **Console Output**: All `console.log` messages are captured
- **Traces**: Full execution traces for debugging failures

### Run Specific Test
```bash
# Run single test case
npx playwright test tests/odoo.spec.ts -g "Test Case 1"
```

### Record New Tests with Codegen
Playwright provides a built-in test generator to record user interactions and generate test scripts:

```bash
# Start recording a new test
npx playwright codegen

# Record with specific browser
npx playwright codegen --browser=chromium

# Record with target URL
npx playwright codegen https://your-odoo-instance.odoo.com

# Record with device emulation
npx playwright codegen --device="iPhone 13"

# Record with custom viewport
npx playwright codegen --viewport-size=1280,720
```

**Codegen Features:**
- Records clicks, inputs, and navigation
- Generates locators automatically
- Supports assertions through inspector
- Exports to test file format

**Usage Tips:**
1. Start codegen with your target URL
2. Perform actions in the browser
3. Use "Assert" button to add verifications
4. Copy generated code to your test file
5. Refine selectors and add custom logic as needed

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
ODOO_EMAIL=your-email@example.com
ODOO_PASSWORD=your-password
```

## Browser Configuration

### Default Browser
By default, tests run on **Chromium**. To change or add browsers, edit `playwright.config.ts`:

```typescript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

### Run Tests on Specific Browser
```bash
# Run on Chromium (default)
npx playwright test

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on all configured browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Codegen with Specific Browser
```bash
# Generate tests with Chromium
npx playwright codegen --browser=chromium

# Generate tests with Firefox
npx playwright codegen --browser=firefox

# Generate tests with WebKit
npx playwright codegen --browser=webkit
```


## Project Structure
```
playwright-demo/
├── .github/
│   └── workflows/
│       ├── playwright.yml             # GitHub Actions workflow
│       └── generate-index.js          # Report index generator
├── tests/
│   └── odoo.spec.ts                   # Main test suite
├── playwright.config.ts               # Playwright configuration
├── package.json                       # Dependencies and scripts
├── .env                               # Environment variables (not in git)
├── .env.example                       # Environment variables template
├── README.md                          # Project documentation
```

## Features
- **Sequential Testing**: Uses `test.describe.serial()` for ordered test execution
- **Hooks**: `beforeEach` for login, `afterEach` for logout
- **Environment Configuration**: Credentials stored securely in `.env` file
- **State Management**: Global variable to share order number across tests
- **Assertions**: Validates status changes, order numbers, and invoice generation
- **Smart Waiting**: Uses `page.waitForURL()` instead of arbitrary timeouts for reliable tests
- **Structured Reporting**: Test steps and attachments for detailed reports

## CI/CD with GitHub Actions

### Setup GitHub Actions

This project includes automated testing via GitHub Actions. The workflow runs on:
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch
- Manual trigger via GitHub UI

### Configure Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following **Repository secrets**:
   - `ODOO_EMAIL`: Your Odoo login email
   - `ODOO_PASSWORD`: Your Odoo password

### Enable GitHub Pages

To view test reports online:

1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: Select **`gh-pages`** and **`/ (root)`**
4. Click **Save**

### View Test Reports

After workflow runs:

1. **Artifacts**: Download from workflow run summary
   - `playwright-report`: HTML report
   - `test-results`: Raw test results

2. **GitHub Pages**: Access reports at:
   ```
   https://<username>.github.io/<repository>/reports/<run-number>/
   ```

3. **Workflow Status Badge**: Add to README:
   ```markdown
   ![Playwright Tests](https://github.com/<username>/<repository>/actions/workflows/playwright.yml/badge.svg)
   ```

### Manual Trigger

Run tests manually:
1. Go to **Actions** tab
2. Select **Playwright Tests** workflow
3. Click **Run workflow**

## Notes
- Tests must run sequentially due to data dependencies
- Each test includes automatic login/logout via hooks
- Order number is shared across test cases using a global variable
- Sensitive credentials are loaded from `.env` file (not committed to git)
- **Important**: Customer (`Lincoln University`) and Product (`product1`) must be manually created in your Odoo instance before running tests



