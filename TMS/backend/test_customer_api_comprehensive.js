const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3004/api/customers';

async function testCustomerAPI() {
  console.log('🚀 Starting comprehensive Customer API testing...\n');

  let testResults = {
    passed: 0,
    failed: 0,
    total: 0
  };

  function logTest(testName, passed, error = null) {
    testResults.total++;
    if (passed) {
      testResults.passed++;
      console.log(`✅ ${testName} - PASSED`);
    } else {
      testResults.failed++;
      console.log(`❌ ${testName} - FAILED`);
      if (error) console.log(`   Error: ${error.message}`);
    }
  }

  try {
    // Test 1: Get all customers
    console.log('📋 Testing GET /api/customers...');
    try {
      const response = await axios.get(BASE_URL);
      logTest('GET /api/customers', response.status === 200);
      console.log(`   Found ${response.data.length} customers`);
    } catch (error) {
      logTest('GET /api/customers', false, error);
    }

    // Test 2: Get customers for dropdown
    console.log('\n📋 Testing GET /api/customers/dropdown...');
    try {
      const response = await axios.get(`${BASE_URL}/dropdown`);
      logTest('GET /api/customers/dropdown', response.status === 200 && response.data.success);
      console.log(`   Found ${response.data.data.length} customers for dropdown`);
    } catch (error) {
      logTest('GET /api/customers/dropdown', false, error);
    }

    // Test 3: Get single customer (invalid ID)
    console.log('\n📋 Testing GET /api/customers/:id (invalid ID)...');
    try {
      const response = await axios.get(`${BASE_URL}/99999`);
      logTest('GET /api/customers/:id (invalid)', false);
    } catch (error) {
      logTest('GET /api/customers/:id (invalid)', error.response?.status === 404);
    }

    // Test 4: Create customer with minimal data
    console.log('\n📝 Testing POST /api/customers (minimal data)...');
    try {
      const customerData = {
        Name: 'Test Customer API',
        CustomerCity: 'Mumbai',
        CustomerState: 'Maharashtra'
      };

      const response = await axios.post(BASE_URL, customerData, {
        headers: { 'Content-Type': 'application/json' }
      });

      logTest('POST /api/customers (minimal)', response.status === 201);
      console.log(`   Created customer with ID: ${response.data.CustomerID}, Code: ${response.data.CustomerCode}`);

      const createdCustomerId = response.data.CustomerID;
      const createdCustomerCode = response.data.CustomerCode;

      // Test 5: Get the created customer
      console.log('\n📋 Testing GET /api/customers/:id (created customer)...');
      try {
        const response = await axios.get(`${BASE_URL}/${createdCustomerId}`);
        logTest('GET /api/customers/:id (created)', response.status === 200 && response.data.CustomerID === createdCustomerId);
      } catch (error) {
        logTest('GET /api/customers/:id (created)', false, error);
      }

      // Test 6: Update customer
      console.log('\n🔧 Testing PUT /api/customers/:id...');
      try {
        const updateData = {
          Name: 'Updated Test Customer API',
          CustomerMobileNo: '9876543210'
        };

        const response = await axios.put(`${BASE_URL}/${createdCustomerId}`, updateData, {
          headers: { 'Content-Type': 'application/json' }
        });

        logTest('PUT /api/customers/:id', response.status === 200);
        console.log(`   Updated customer: ${response.data.Name}`);
      } catch (error) {
        logTest('PUT /api/customers/:id', false, error);
      }

      // Test 7: Create customer with duplicate code (should fail)
      console.log('\n📝 Testing POST /api/customers (duplicate code)...');
      try {
        const duplicateData = {
          Name: 'Another Test Customer',
          CustomerCode: createdCustomerCode,
          CustomerCity: 'Delhi',
          CustomerState: 'Delhi'
        };

        const response = await axios.post(BASE_URL, duplicateData, {
          headers: { 'Content-Type': 'application/json' }
        });

        logTest('POST /api/customers (duplicate code)', false);
      } catch (error) {
        logTest('POST /api/customers (duplicate code)', error.response?.status === 500); // Should fail with duplicate error
      }

      // Test 8: Create customer with comprehensive data
      console.log('\n📝 Testing POST /api/customers (comprehensive data)...');
      try {
        const comprehensiveData = {
          MasterCustomerName: 'Master Corp Ltd',
          Name: 'Comprehensive Test Customer',
          CustomerMobileNo: '9876543210',
          CustomerEmail: 'comprehensive@test.com',
          CustomerContactPerson: 'John Doe',
          AlternateMobileNo: '9123456789',
          CustomerGroup: 'Premium',
          ServiceCode: 'TMS001',
          TypeOfServices: 'Transportation',
          CityName: 'Mumbai',
          HouseFlatNo: '123',
          StreetLocality: 'Andheri West',
          CustomerCity: 'Mumbai',
          CustomerState: 'Maharashtra',
          CustomerPinCode: '400058',
          CustomerCountry: 'India',
          TypeOfBilling: 'Monthly',
          Locations: 'Mumbai, Delhi',
          CustomerSite: 'Head Office',
          Agreement: 'Yes',
          AgreementDate: '2024-01-01',
          AgreementTenure: '12 months',
          AgreementExpiryDate: '2024-12-31',
          CustomerNoticePeriod: '30 days',
          CogentNoticePeriod: '15 days',
          CreditPeriod: '30 days',
          Insurance: 'Yes',
          MinimumInsuranceValue: '100000',
          CogentDebitClause: 'Standard',
          CogentDebitLimit: '50000',
          BG: 'Yes',
          BGAmount: '100000',
          BGDate: '2024-01-01',
          BGExpiryDate: '2024-12-31',
          BGBank: 'Test Bank',
          BGReceivingByCustomer: 'Yes',
          PO: 'Yes',
          PODate: '2024-01-01',
          POValue: '500000',
          POTenure: '12 months',
          POExpiryDate: '2024-12-31',
          Rates: 'Standard rates',
          YearlyEscalationClause: '5%',
          GSTNo: 'GST123456789',
          GSTRate: '18%',
          BillingTenure: 'Monthly',
          CustomerRegisteredOfficeAddress: '123 Main St, Mumbai',
          CustomerCorporateOfficeAddress: '456 Business Ave, Mumbai',
          CogentProjectHead: 'Jane Smith',
          CogentProjectOpsManager: 'Bob Johnson',
          CustomerImportantPersonAddress1: '789 VIP Road, Mumbai',
          CustomerImportantPersonAddress2: '321 Executive Blvd, Mumbai'
        };

        const response = await axios.post(BASE_URL, comprehensiveData, {
          headers: { 'Content-Type': 'application/json' }
        });

        logTest('POST /api/customers (comprehensive)', response.status === 201);
        console.log(`   Created comprehensive customer with ID: ${response.data.CustomerID}`);

        const comprehensiveCustomerId = response.data.CustomerID;

        // Test 9: Update comprehensive customer
        console.log('\n🔧 Testing PUT /api/customers/:id (comprehensive update)...');
        try {
          const updateData = {
            CustomerMobileNo: '9998887776',
            CustomerEmail: 'updated@test.com'
          };

          const response = await axios.put(`${BASE_URL}/${comprehensiveCustomerId}`, updateData, {
            headers: { 'Content-Type': 'application/json' }
          });

          logTest('PUT /api/customers/:id (comprehensive)', response.status === 200);
        } catch (error) {
          logTest('PUT /api/customers/:id (comprehensive)', false, error);
        }

        // Test 10: Delete comprehensive customer
        console.log('\n🗑️ Testing DELETE /api/customers/:id...');
        try {
          const response = await axios.delete(`${BASE_URL}/${comprehensiveCustomerId}`);
          logTest('DELETE /api/customers/:id', response.status === 200);
        } catch (error) {
          logTest('DELETE /api/customers/:id', false, error);
        }

      } catch (error) {
        logTest('POST /api/customers (comprehensive)', false, error);
      }

      // Test 11: Delete original customer
      console.log('\n🗑️ Testing DELETE /api/customers/:id (original)...');
      try {
        const response = await axios.delete(`${BASE_URL}/${createdCustomerId}`);
        logTest('DELETE /api/customers/:id (original)', response.status === 200);
      } catch (error) {
        logTest('DELETE /api/customers/:id (original)', false, error);
      }

    } catch (error) {
      logTest('POST /api/customers (minimal)', false, error);
    }

    // Test 12: Test date validation
    console.log('\n📅 Testing date validation...');
    try {
      const invalidDateData = {
        Name: 'Date Test Customer',
        CustomerCity: 'Mumbai',
        CustomerState: 'Maharashtra',
        AgreementDate: '2024-12-31',
        AgreementExpiryDate: '2024-01-01' // Expiry before start
      };

      const response = await axios.post(BASE_URL, invalidDateData, {
        headers: { 'Content-Type': 'application/json' }
      });

      logTest('Date validation', false);
    } catch (error) {
      logTest('Date validation', error.response?.status === 400);
    }

    // Test 13: Test file upload endpoint (create customer with file)
    console.log('\n📎 Testing file upload...');
    try {
      // Create a test file
      const testFilePath = path.join(__dirname, 'test_file.txt');
      fs.writeFileSync(testFilePath, 'This is a test file for customer API testing.');

      const formData = new FormData();
      formData.append('Name', 'File Upload Test Customer');
      formData.append('CustomerCity', 'Mumbai');
      formData.append('CustomerState', 'Maharashtra');
      formData.append('AgreementFile', fs.createReadStream(testFilePath));

      const response = await axios.post(BASE_URL, formData, {
        headers: formData.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      logTest('File upload', response.status === 201);
      console.log(`   Created customer with file: ${response.data.CustomerID}`);

      // Clean up test file
      fs.unlinkSync(testFilePath);

      const fileCustomerId = response.data.CustomerID;

      // Test 14: Delete customer with file
      console.log('\n🗑️ Testing DELETE /api/customers/:id (with file)...');
      try {
        const response = await axios.delete(`${BASE_URL}/${fileCustomerId}`);
        logTest('DELETE /api/customers/:id (with file)', response.status === 200);
      } catch (error) {
        logTest('DELETE /api/customers/:id (with file)', false, error);
      }

    } catch (error) {
      logTest('File upload', false, error);
    }

    // Test 15: Test invalid endpoints
    console.log('\n❌ Testing invalid endpoints...');
    try {
      await axios.get(`${BASE_URL}/invalid`);
      logTest('Invalid endpoint', false);
    } catch (error) {
      logTest('Invalid endpoint', error.response?.status === 404);
    }

    // Test 16: Test non-existent customer deletion
    console.log('\n🗑️ Testing DELETE /api/customers/:id (non-existent)...');
    try {
      const response = await axios.delete(`${BASE_URL}/99999`);
      logTest('DELETE /api/customers/:id (non-existent)', false);
    } catch (error) {
      logTest('DELETE /api/customers/:id (non-existent)', error.response?.status === 404);
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Total: ${testResults.total}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Customer API is working correctly.');
  } else {
    console.log(`\n⚠️ ${testResults.failed} test(s) failed. Please review the errors above.`);
  }

  console.log('\n🏁 Customer API testing completed.');
}

testCustomerAPI();
