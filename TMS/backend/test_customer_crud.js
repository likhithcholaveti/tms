const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';

async function testCustomerCRUD() {
  console.log('🧪 Testing Customer CRUD Operations...\n');

  try {
    // Test 1: GET all customers
    console.log('1. Testing GET /customers...');
    const getAllResponse = await axios.get(`${BASE_URL}/customers`);
    console.log('✅ GET /customers successful');
    console.log(`   Response: ${getAllResponse.data.length} customers found\n`);

    // Test 2: Create a new customer
    console.log('2. Testing POST /customers (create)...');
    const testCustomer = {
      MasterCustomerName: 'Test Master Customer',
      Name: 'Test Company Ltd',
      TypeOfServices: 'Transportation',
      CustomerMobileNo: '9876543210',
      CustomerEmail: 'test@company.com',
      CustomerContactPerson: 'John Doe',
      CustomerGroup: 'Test Group',
      CityName: 'Mumbai',
      house_flat_no: '123',
      street_locality: 'Test Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin_code: '400001',
      country: 'India'
    };

    const createResponse = await axios.post(`${BASE_URL}/customers`, testCustomer);
    console.log('✅ POST /customers successful');
    console.log(`   Created customer ID: ${createResponse.data.CustomerID}`);
    console.log(`   Generated Customer Code: ${createResponse.data.CustomerCode}\n`);

    const customerId = createResponse.data.CustomerID;

    // Test 3: GET single customer
    console.log('3. Testing GET /customers/:id...');
    const getSingleResponse = await axios.get(`${BASE_URL}/customers/${customerId}`);
    console.log('✅ GET /customers/:id successful');
    console.log(`   Retrieved customer: ${getSingleResponse.data.Name}\n`);

    // Test 4: Update customer
    console.log('4. Testing PUT /customers/:id (update)...');
    const updateData = {
      ...testCustomer,
      Name: 'Updated Test Company Ltd',
      CustomerMobileNo: '9876543211'
    };

    const updateResponse = await axios.put(`${BASE_URL}/customers/${customerId}`, updateData);
    console.log('✅ PUT /customers/:id successful');
    console.log(`   Updated customer: ${updateResponse.data.Name}\n`);

    // Test 5: DELETE customer
    console.log('5. Testing DELETE /customers/:id...');
    const deleteResponse = await axios.delete(`${BASE_URL}/customers/${customerId}`);
    console.log('✅ DELETE /customers/:id successful');
    console.log(`   Deleted customer ID: ${customerId}\n`);

    console.log('🎉 All Customer CRUD tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testCustomerCRUD();
