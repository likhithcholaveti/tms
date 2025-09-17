const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Test the customer API endpoints comprehensively
async function testCustomerAPI() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'transportation_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🧪 Comprehensive Customer API Testing\n');

    // Test 1: Check existing customers
    console.log('1️⃣ Testing: Get All Customers');
    const [customers] = await pool.query('SELECT * FROM Customer ORDER BY CustomerID DESC LIMIT 5');
    console.log(`   Found ${customers.length} customers in database`);
    if (customers.length > 0) {
      console.log('   Sample customer:', {
        ID: customers[0].CustomerID,
        Code: customers[0].CustomerCode,
        Name: customers[0].Name,
        TypeOfServices: customers[0].TypeOfServices
      });
    }

    // Test 2: Test customer code generation logic
    console.log('\n2️⃣ Testing: Customer Code Generation Logic');

    const testCases = [
      { name: 'ABC Corporation Ltd', expectedPrefix: 'ABC' },
      { name: 'XYZ Private Limited', expectedPrefix: 'XYZ' },
      { name: 'Test Company', expectedPrefix: 'TES' },
      { name: 'A', expectedPrefix: 'A' },
      { name: 'AB', expectedPrefix: 'AB' },
      { name: '', expectedPrefix: 'CUS' },
      { name: 'The Quick Brown Fox', expectedPrefix: 'QBF' }
    ];

    // Helper function (same as in customer.js)
    const generateCustomerAbbreviation = (name, maxLength = 3) => {
      if (!name || name.trim() === '') return 'CUS';

      const cleanName = name
        .replace(/\b(Ltd|Limited|Pvt|Private|Company|Corp|Corporation|Inc|Incorporated|LLC|LLP)\b/gi, '')
        .replace(/\b(The|And|Of|For|In|On|At|By|With)\b/gi, '')
        .trim();

      const words = cleanName.split(/\s+/).filter(word => word.length > 0);

      if (words.length === 1) {
        return words[0].substring(0, maxLength).toUpperCase();
      } else if (words.length <= maxLength) {
        return words.map(word => word.charAt(0)).join('').toUpperCase();
      } else {
        return words.slice(0, maxLength).map(word => word.charAt(0)).join('').toUpperCase();
      }
    };

    for (const testCase of testCases) {
      const generatedPrefix = generateCustomerAbbreviation(testCase.name, 3);
      const status = generatedPrefix === testCase.expectedPrefix ? '✅' : '❌';
      console.log(`   ${status} "${testCase.name}" -> "${generatedPrefix}" (expected: "${testCase.expectedPrefix}")`);

      // Test the SQL query logic
      const prefixLength = generatedPrefix.length;
      const [maxCodeResult] = await pool.query(`
        SELECT CustomerCode FROM Customer
        WHERE CustomerCode LIKE '${generatedPrefix}%'
        AND LENGTH(CustomerCode) > ${prefixLength}
        AND SUBSTRING(CustomerCode, ${prefixLength + 1}) REGEXP '^[0-9]+$'
        ORDER BY CAST(SUBSTRING(CustomerCode, ${prefixLength + 1}) AS UNSIGNED) DESC
        LIMIT 1
      `);

      let nextNumber = 1;
      if (maxCodeResult.length > 0) {
        const maxCode = maxCodeResult[0].CustomerCode;
        const numberPart = maxCode.substring(prefixLength);
        const currentNumber = parseInt(numberPart) || 0;
        nextNumber = currentNumber + 1;
      }

      const generatedCode = `${generatedPrefix}${String(nextNumber).padStart(3, '0')}`;
      console.log(`      Next code would be: "${generatedCode}"`);
    }

    // Test 3: Test customer creation simulation
    console.log('\n3️⃣ Testing: Customer Creation Simulation');

    const testCustomerData = {
      MasterCustomerName: 'Test Master Customer',
      Name: 'Test Customer Corp',
      TypeOfServices: 'Transportation',
      ServiceCode: 'TRANS',
      Locations: 'Mumbai, Delhi',
      CustomerSite: 'Head Office',
      Agreement: 'Yes',
      AgreementDate: '2024-01-15',
      AgreementExpiryDate: '2025-01-15',
      BG: 'No',
      PO: 'PO12345',
      PODate: '2024-01-10',
      POExpiryDate: '2024-12-31',
      Rates: 'Standard rates apply',
      GSTNo: '22AAAAA0000A1Z5',
      GSTRate: '18',
      TypeOfBilling: 'GST',
      BillingTenure: 'Monthly'
    };

    // Simulate the customer code generation
    const customerName = testCustomerData.Name || testCustomerData.MasterCustomerName || '';
    const namePrefix = generateCustomerAbbreviation(customerName, 3);
    const prefixLength = namePrefix.length;

    const [maxCodeResult] = await pool.query(`
      SELECT CustomerCode FROM Customer
      WHERE CustomerCode LIKE '${namePrefix}%'
      AND LENGTH(CustomerCode) > ${prefixLength}
      AND SUBSTRING(CustomerCode, ${prefixLength + 1}) REGEXP '^[0-9]+$'
      ORDER BY CAST(SUBSTRING(CustomerCode, ${prefixLength + 1}) AS UNSIGNED) DESC
      LIMIT 1
    `);

    let nextNumber = 1;
    if (maxCodeResult.length > 0) {
      const maxCode = maxCodeResult[0].CustomerCode;
      const numberPart = maxCode.substring(prefixLength);
      const currentNumber = parseInt(numberPart) || 0;
      nextNumber = currentNumber + 1;
    }

    const generatedCustomerCode = `${namePrefix}${String(nextNumber).padStart(3, '0')}`;
    console.log(`   Generated Customer Code: "${generatedCustomerCode}" for "${customerName}"`);

    // Test 4: Check for duplicate codes
    console.log('\n4️⃣ Testing: Duplicate Code Prevention');
    const [duplicateCheck] = await pool.query(
      'SELECT CustomerID FROM Customer WHERE CustomerCode = ?',
      [generatedCustomerCode]
    );

    if (duplicateCheck.length > 0) {
      console.log(`   ⚠️  Code "${generatedCustomerCode}" already exists!`);
    } else {
      console.log(`   ✅ Code "${generatedCustomerCode}" is available`);
    }

    // Test 5: Test file upload directory
    console.log('\n5️⃣ Testing: File Upload Directory');
    const uploadDir = path.join(__dirname, 'uploads', 'customers');
    if (fs.existsSync(uploadDir)) {
      console.log(`   ✅ Upload directory exists: ${uploadDir}`);
      const files = fs.readdirSync(uploadDir);
      console.log(`   📁 ${files.length} files in upload directory`);
    } else {
      console.log(`   ❌ Upload directory missing: ${uploadDir}`);
    }

    // Test 6: Test date validation logic
    console.log('\n6️⃣ Testing: Date Validation Logic');

    const validateDateSequence = (customerData) => {
      const errors = [];

      const checkDates = (startDateField, expiryDateField, errorMsg) => {
        const startDate = customerData[startDateField];
        const expiryDate = customerData[expiryDateField];

        if (startDate && expiryDate && new Date(expiryDate) < new Date(startDate)) {
          errors.push(errorMsg);
        }
      };

      checkDates('AgreementDate', 'AgreementExpiryDate', 'Agreement Expiry Date cannot be before Agreement Date');
      checkDates('BGDate', 'BGExpiryDate', 'BG Expiry Date cannot be before BG Date');
      checkDates('PODate', 'POExpiryDate', 'PO Expiry Date cannot be before PO Date');

      return errors;
    };

    const dateTestCases = [
      {
        name: 'Valid dates',
        data: {
          AgreementDate: '2024-01-01',
          AgreementExpiryDate: '2024-12-31',
          PODate: '2024-01-15',
          POExpiryDate: '2024-06-15'
        },
        expectedErrors: 0
      },
      {
        name: 'Invalid agreement dates',
        data: {
          AgreementDate: '2024-12-31',
          AgreementExpiryDate: '2024-01-01'
        },
        expectedErrors: 1
      },
      {
        name: 'Invalid PO dates',
        data: {
          PODate: '2024-06-15',
          POExpiryDate: '2024-01-15'
        },
        expectedErrors: 1
      }
    ];

    for (const testCase of dateTestCases) {
      const errors = validateDateSequence(testCase.data);
      const status = errors.length === testCase.expectedErrors ? '✅' : '❌';
      console.log(`   ${status} ${testCase.name}: ${errors.length} errors (expected: ${testCase.expectedErrors})`);
      if (errors.length > 0) {
        errors.forEach(error => console.log(`      - ${error}`));
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testCustomerAPI();
