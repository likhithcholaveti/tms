# TODO - Implement Missing Features in TMS

## 1. Fix Export.js Query Issues
- [x] Fix export.js query to handle missing 'BillingMonthStartDate' column in database
- [x] Add conditional column selection for optional database fields
- [ ] Test export functionality for customers, billing, and other entities
- [ ] Ensure export works with current database schema

## 2. Create Notification/Reminder System
- [x] Create NotificationManager component for expiry alerts
- [x] Implement date comparison logic for agreement, BG, PO expiry dates
- [x] Add popup/modal system for notifications
- [x] Create reminder scheduling system (daily checks)
- [x] Add notification preferences and settings
- [x] Create backend notifications route for checking expiring documents

## 3. Add Import/Export UI Components
- [x] Create ImportModal component for file uploads
- [x] Add import functionality to CustomerForm for annexures, MIS, KPI, SLA
- [x] Add import functionality to BillingForm for commercial rates
- [x] Create ExportButton component with format selection
- [x] Integrate import/export UI with existing forms
- [x] Create backend import route for handling file uploads

## 4. Implement Expiry Date Alerts
- [ ] Add expiry date validation in CustomerForm
- [ ] Implement red flag popups for expiring agreements/BG/PO
- [ ] Add email/SMS/WhatsApp notification system (backend)
- [ ] Create dashboard alerts for upcoming expiries
- [ ] Add reminder settings and frequency options

## 5. Testing and Validation
- [ ] Test all new notification and reminder features
- [ ] Validate import/export functionality with sample data
- [ ] Test expiry date alerts and popup system
- [ ] Perform end-to-end testing of all implemented features
- [ ] Fix any bugs or issues found during testing

## 6. Additional Requirements Check
- [ ] Verify GST rate column implementation (18%, 5%, etc.)
- [ ] Check billing tenure format (25th to 24th, 1st to 31st)
- [ ] Validate date sequence validations across all forms
- [ ] Ensure loading capacity is in KG with unit display
- [ ] Check vehicle freight rates structure (fix, fuel, handling charges)
- [ ] Verify driver link to vendor/customer functionality
- [ ] Test daily transaction auto-population from master data
- [ ] Validate Odometer KM verification system
- [ ] Check advance request auto-generation
- [ ] Test trip number column in adhoc vehicle
- [ ] Verify revenue and margin capture from CRM rate master
