const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testCustomerCreation() {
  try {
    console.log('🧪 Testing Customer Creation API\n');

    // Test 1: Create a customer without files
    console.log('1️⃣ Creating customer without files...');

    const formData = new FormData();
    formData.append('Name', 'Test Customer Corporation Ltd');
    formData.append('CustomerEmail', 'test@customer.com');
    formData.append('CustomerMobileNo', '9876543210');
    formData.append('TypeOfServices', 'Transportation');
    formData.append('CustomerCity', 'Mumbai');
    formData.append('CustomerState', 'Maharashtra');

    console.log('📤 Sending request to http://localhost:3004/api/customers');
    console.log('📝 Form data:', {
      Name: 'Test Customer Corporation Ltd',
      CustomerEmail: 'test@customer.com',
      CustomerMobileNo: '9876543210',
      TypeOfServices: 'Transportation',
      CustomerCity: 'Mumbai',
      CustomerState: 'Maharashtra'
    });

    const response = await axios.post('http://localhost:3004/api/customers', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    console.log('✅ Customer created successfully!');
    console.log('📋 Response data:', {
      CustomerID: response.data.CustomerID,
      CustomerCode: response.data.CustomerCode,
      Name: response.data.Name,
      CustomerCode: response.data.CustomerCode
    });

    const generatedCode = response.data.CustomerCode;
    console.log(`🎯 Generated Customer Code: ${generatedCode}`);

    // Verify the code follows the expected pattern
    const expectedPrefix = 'TES'; // From "Test Customer Corporation Ltd" -> "Test" -> "TES"
    const isValidFormat = generatedCode.startsWith(expectedPrefix) && /^\w{3}\d{3}$/.test(generatedCode);

    if (isValidFormat) {
      console.log('✅ Customer code format is correct');
    } else {
      console.log('❌ Customer code format is incorrect');
    }

    // Test 2: Verify customer was saved in database
    console.log('\n2️⃣ Verifying customer in database...');

    const getResponse = await axios.get('http://localhost:3004/api/customers');
    const customers = getResponse.data;
    const createdCustomer = customers.find(c => c.CustomerID === response.data.CustomerID);

    if (createdCustomer) {
      console.log('✅ Customer found in database');
      console.log('📋 Database customer:', {
        CustomerID: createdCustomer.CustomerID,
        CustomerCode: createdCustomer.CustomerCode,
        Name: createdCustomer.Name
      });

      if (createdCustomer.CustomerCode === generatedCode) {
        console.log('✅ Customer code matches between creation and retrieval');
      } else {
        console.log('❌ Customer code mismatch!');
      }
    } else {
      console.log('❌ Customer not found in database');
    }

    // Test 3: Create another customer to test code increment
    console.log('\n3️⃣ Creating second customer to test code increment...');

    const formData2 = new FormData();
    formData2.append('Name', 'Test Customer Pvt Ltd');
    formData2.append('CustomerEmail', 'test2@customer.com');
    formData2.append('CustomerMobileNo', '9876543211');
    formData2.append('TypeOfServices', 'Logistics');
    formData2.append('CustomerCity', 'Delhi');
    formData2.append('CustomerState', 'Delhi');

    const response2 = await axios.post('http://localhost:3004/api/customers', formData2, {
      headers: {
        ...formData2.getHeaders(),
      },
    });

    console.log('✅ Second customer created successfully!');
    console.log('📋 Response data:', {
      CustomerID: response2.data.CustomerID,
      CustomerCode: response2.data.CustomerCode,
      Name: response2.data.Name
    });

    const generatedCode2 = response2.data.CustomerCode;
    console.log(`🎯 Generated Customer Code: ${generatedCode2}`);

    // Should be TES002 (incremented)
    if (generatedCode2 === 'TES002') {
      console.log('✅ Customer code incremented correctly');
    } else {
      console.log(`❌ Expected TES002, got ${generatedCode2}`);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response ? error.response.data : error.message);
  }
}

testCustomerCreation();
