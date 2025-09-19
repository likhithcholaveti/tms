# TODO List for TMS Fixes

## 1. Fix Location Dropdown in Project Details
- [x] Add debugging logs to ProjectForm.jsx to verify customer change and location loading
- [x] Clear locations in resetForm to prevent stale data
- [x] Fixed potential stale location data issue

## 2. Fix Login with Different Accounts
- [x] Identified issue: Login.jsx redirects if already authenticated, preventing account switching
- [x] Add logout functionality or modify login flow to allow account switching
- [ ] Test login with different accounts

## 3. Add GST Rate Column to Billing Records Table
- [x] Added TotalAmount, GSTRate, and GSTAmount columns to the DataTable in BillingForm.jsx
- [x] GST Rate and GST Amount now display in the billing records table

## 4. Replace Billing Period Dates with Billing Tenure
- [x] Updated database schema to replace BillingPeriodStart/BillingPeriodEnd with BillingTenure
- [x] Modified backend billing routes to handle BillingTenure field
- [x] Updated frontend form to use single text field for billing tenure
- [x] Updated data table to display BillingTenure column
- [x] Created database migration script for existing installations

## General
- [ ] Test both fixes after implementation
- [ ] Verify no regressions in other functionality
