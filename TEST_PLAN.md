# Transport Management System (TMS) Comprehensive Test Plan

## Objective
To perform complete coverage testing of the TMS application including all frontend forms, backend APIs, file uploads, data validation, and edge cases to ensure robustness and correctness.

## Scope
- User Authentication (Login, Registration, Token Verification)
- Customer Management (CRUD)
- Vendor Management (CRUD)
- Vehicle Management (CRUD, File Uploads)
- Driver Management (CRUD, File Uploads)
- Project Management (CRUD, File Uploads)
- Adhoc/Replacement Transactions (CRUD)
- File Upload and Download Functionality
- Data Validation and Error Handling
- UI/UX Validation (Form validations, notifications, modals)
- API Security and Authorization

## Test Environment
- Backend running on port 3004
- Frontend React app configured to use backend port 3004
- Database: MySQL with required schema and seed data

## Test Cases

### 1. Authentication
- Verify user registration with valid and invalid data
- Verify login with correct and incorrect credentials
- Verify JWT token issuance and expiration handling
- Verify logout functionality clears session and redirects

### 2. Customer Management
- Create customer with valid data
- Edit customer details
- Delete customer and verify cascading effects
- Validate required fields and error messages

### 3. Vendor Management
- Create vendor with valid data
- Edit vendor details
- Delete vendor
- Validate required fields and error messages

### 4. Vehicle Management
- Create vehicle with all required fields and file uploads (photos, documents)
- Edit vehicle details and replace/delete files
- Delete vehicle
- Validate auto-generation of vehicle codes
- Validate date fields and file previews
- Test export functionality

### 5. Driver Management
- Create driver with required fields and file uploads (photo)
- Edit driver details and replace/delete photo
- Delete driver
- Validate address form and mobile number validations
- Test export functionality

### 6. Project Management
- Create project with required fields and file upload
- Edit project details and replace/delete file
- Delete project
- Validate date sequences and project code generation
- Test export functionality

### 7. Adhoc/Replacement Transactions
- Create adhoc and replacement transactions with manual data entry
- Edit transactions
- Validate required fields and numeric validations
- Test transaction listing and filtering

### 8. File Upload and Download
- Upload various file types (images, pdf, docs) in all forms
- Preview uploaded files and existing files
- Delete uploaded files and verify backend removal
- Download exported Excel files for customers, vendors, vehicles, drivers, projects

### 9. Data Validation and Error Handling
- Test all form validations (required fields, date ranges, numeric fields)
- Test error messages on invalid inputs
- Test backend error handling (duplicate entries, invalid IDs)

### 10. UI/UX Validation
- Verify form layouts and responsiveness
- Verify notifications and modals appear correctly
- Verify image preview modals and file upload UI

### 11. API Security and Authorization
- Verify API endpoints require valid JWT tokens
- Verify role-based access control if applicable

## Test Execution
- Manual testing using the frontend UI
- API testing using tools like Postman for backend endpoints
- Automated tests can be added later for regression

## Reporting
- Document all test results, issues, and bugs
- Provide screenshots and logs for failures

---

This plan covers all critical and edge cases for the TMS application as requested.

Please confirm if I should proceed with executing this test plan or if you want me to assist with specific tests or fixes first.
