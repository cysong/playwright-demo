# Odoo Sales Order to Invoice Test Cases

## Business Process Overview
This test suite covers the complete sales order fulfillment workflow in Odoo ERP system: from quotation creation to final invoice validation. This is the most critical business process in Odoo as it represents the entire order-to-cash cycle.

## Why This Process
- **End-to-End Coverage**: Tests the complete sales workflow across multiple modules (Sales, Inventory, Accounting)
- **High Business Impact**: Directly affects revenue recognition and customer delivery
- **Cross-Module Integration**: Validates data flow between Sales, Warehouse, and Invoicing modules
- **Common Usage**: Represents the most frequent business operation in commercial ERP systems
- **Automation Value**: High ROI due to repetitive nature and critical importance

## Test Case 1: Create Sales Order
**Preconditions:**
- User logged into Odoo
- Sales module installed
- At least one customer exists
- At least one product exists with available stock

**Steps:**
1. Navigate to Sales module
2. Click "Create" button
3. Select customer from dropdown
4. Click "Add a product" in order lines
5. Select product from dropdown
6. Set quantity to 1
7. Click "Save" button

**Expected Result:**
- Sales order created with status "Quotation"
- Order number generated
- Total amount calculated correctly

---

## Test Case 2: Confirm Sales Order
**Preconditions:**
- Sales order exists in "Quotation" status

**Steps:**
1. Open the sales order created in Test Case 1
2. Click "Confirm" button

**Expected Result:**
- Order status changes to "Sales Order"
- "Delivery" smart button appears with count "1"
- Order is locked for editing

---

## Test Case 3: Process Delivery
**Preconditions:**
- Sales order confirmed
- Delivery order created

**Steps:**
1. From sales order view, click "Delivery" smart button
2. Click "Validate" button
3. Click "Apply" in the confirmation dialog

**Expected Result:**
- Delivery status changes to "Done"
- All products marked as delivered
- "Create Invoice" button appears in sales order

---

## Test Case 4: Create Invoice
**Preconditions:**
- Sales order confirmed
- Delivery completed

**Steps:**
1. Navigate back to sales order
2. Click "Create Invoice" button
3. Select "Regular Invoice" option
4. Click "Create Draft Invoice" button

**Expected Result:**
- Invoice created in "Draft" status
- Invoice smart button appears with count "1"
- Invoice amount matches order amount

---

## Test Case 5: Validate Invoice
**Preconditions:**
- Invoice created in "Draft" status

**Steps:**
1. From sales order view, click "Invoices" smart button
2. Click "Confirm" button

**Expected Result:**
- Invoice status changes to "Posted"
- Invoice number generated
- Payment status shows "Not Paid"
- Invoice can no longer be edited
