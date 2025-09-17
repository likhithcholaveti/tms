const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database configuration (same as server.js)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  database: process.env.DB_NAME || 'transportation_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4',
  insecureAuth: true
};

// Only add password if it's provided
if (process.env.DB_PASSWORD) {
  dbConfig.password = process.env.DB_PASSWORD;
}

console.log('🔧 Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database,
  hasPassword: !!dbConfig.password
});

// Test the customer API endpoints comprehensively
async function testCustomerAPI() {
  const pool = mysql.createPool(dbConfig);

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

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testCustomerAPI();
