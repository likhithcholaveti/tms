# TODO: Implement 12-Hour Time Format Validation and Enforcement

## Tasks to Complete:
- [ ] Update TMS/src/routes/AdhocTransactionForm.jsx - Change time inputs to type="text" with 12hr format validation
- [ ] Update TMS/src/routes/DailyVehicleTransactionForm.jsx - Use existing 12hr utility functions for validation
- [ ] Update TMS/src/routes/FixedTransactionForm.jsx - Change time inputs to type="text" with 12hr format validation
- [ ] Add 12hr utility functions to forms that don't have them
- [ ] Update form submission to convert 12hr to 24hr format before sending to backend
- [ ] Test the forms to ensure 12hr time inputs work correctly
- [ ] Test API calls to ensure time values are correctly converted and processed

## Files to Edit:
1. TMS/src/routes/AdhocTransactionForm.jsx
2. TMS/src/routes/DailyVehicleTransactionForm.jsx
3. TMS/src/routes/FixedTransactionForm.jsx

## Changes Needed:
- Change input type from "time" to "text" for ArrivalTimeAtHub, InTimeByCust, OutTimeFromHub, ReturnReportingTime
- Add 12-hour format validation using regex: /^(0?[1-9]|1[0-2]):([0-5][0-9])\s?(AM|PM|am|pm)$/i
- Add utility functions for 12hr to 24hr conversion
- Update validation logic to enforce 12-hour format input
- Convert 12hr format to 24hr before sending to backend
- Add placeholder text like "HH:MM AM/PM" for user guidance
- Backend already supports HH:MM format, so no changes needed there

## Status: In Progress
