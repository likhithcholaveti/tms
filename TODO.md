# TMS Missing Features Implementation

## 1. Fix Export.js Query Issues
- [ ] Fix missing 'BillingMonthStartDate' column error in customer export
- [ ] Update export query to handle optional database columns
- [ ] Test export functionality for all entities

## 2. Create Notification/Reminder System
- [ ] Create Notification component for expiry alerts
- [ ] Implement date comparison logic for expiry dates
- [ ] Add reminder system for Agreement, BG, PO expiry dates
- [ ] Create popup/modal system for notifications

## 3. Add Import/Export UI Components
- [ ] Add export buttons to CustomerForm and BillingForm
- [ ] Create import functionality for customer data
- [ ] Add file upload UI for bulk data import
- [ ] Implement progress indicators for import/export operations

## 4. Implement Expiry Date Alerts
- [ ] Add expiry date tracking for customer agreements
- [ ] Create alert system for approaching expiry dates
- [ ] Add visual indicators (colors, icons) for expiry status
- [ ] Implement email notifications for critical expiries

## 5. Daily Transaction Time Format Validation (12-hour)
- [ ] Implement 12-hour time format validation for DailyVehicleTransactionForm
- [ ] Add time format conversion utilities (12h ↔ 24h)
- [ ] Update time input fields to accept 12-hour format (HH:MM AM/PM)
- [ ] Add real-time validation for time format
- [ ] Update duty hours calculation to work with 12-hour format
- [ ] Test time format validation across all time fields

## 6. Testing and Validation
- [ ] Test all new notification features
- [ ] Validate import/export functionality
- [ ] Test expiry date calculations
- [ ] Perform end-to-end testing of all features
