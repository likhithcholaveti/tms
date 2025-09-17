const mysql = require('mysql2/promise');

// Test the customer code generation logic
async function testCustomerCodeGeneration() {
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
    console.log('🔍 Testing Customer Code Generation Logic...\n');

    // Check existing customer codes
    const [existingCodes] = await pool.query(
      'SELECT CustomerCode, Name FROM Customer ORDER BY CustomerID DESC LIMIT 10'
    );

    console.log('📋 Existing Customer Codes:');
    existingCodes.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.CustomerCode} - ${customer.Name}`);
    });

    console.log('\n🧪 Testing Code Generation Scenarios:');

    // Test scenarios
    const testNames = [
      'ABC Corporation Ltd',
      'XYZ Private Limited',
      'Test Company',
      'A',
      'AB',
      '',
      'The Quick Brown Fox'
    ];

    // Helper function to generate customer code abbreviation (same as in customer.js)
    const generateCustomerAbbreviation = (name, maxLength = 3) => {
      if (!name || name.trim() === '') return 'CUS';

      // Remove common words and get meaningful parts
      const cleanName = name
        .replace(/\b(Ltd|Limited|Pvt|Private|Company|Corp|Corporation|Inc|Incorporated|LLC|LLP)\b/gi, '')
        .replace(/\b(The|And|Of|For|In|On|At|By|With)\b/gi, '')
        .trim();

      // Split into words and take first letters
      const words = cleanName.split(/\s+/).filter(word => word.length > 0);

      if (words.length === 1) {
        // Single word - take first few characters
        return words[0].substring(0, maxLength).toUpperCase();
      } else if (words.length <= maxLength) {
        // Multiple words - take first letter of each
        return words.map(word => word.charAt(0)).join('').toUpperCase();
      } else {
        // Too many words - take first letter of first few words
        return words.slice(0, maxLength).map(word => word.charAt(0)).join('').toUpperCase();
      }
    };

    for (const testName of testNames) {
      const prefix = generateCustomerAbbreviation(testName, 3);
      console.log(`"${testName}" -> "${prefix}"`);

      // Check if codes with this prefix exist
      const [prefixCodes] = await pool.query(
        'SELECT CustomerCode FROM Customer WHERE CustomerCode LIKE ? ORDER BY CustomerCode DESC LIMIT 3',
        [`${prefix}%`]
      );

      if (prefixCodes.length > 0) {
        console.log(`  Existing codes with prefix "${prefix}":`, prefixCodes.map(c => c.CustomerCode));
      } else {
        console.log(`  No existing codes with prefix "${prefix}"`);
      }
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testCustomerCodeGeneration();
