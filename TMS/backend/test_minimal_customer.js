const mysql = require('mysql2/promise');

async function testMinimalCustomerCreation() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'transportation_management'
    });

    console.log('✅ Connected to MySQL database');

    // Test minimal insert
    const minimalQuery = `
      INSERT INTO Customer (
        MasterCustomerName,
        Name,
        CustomerCode,
        CustomerMobileNo,
        CustomerEmail
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const minimalParams = [
      'Test Master',
      'Test Customer Corp',
      'TC001',
      '9876543210',
      'test@customer.com'
    ];

    console.log('📤 Executing minimal INSERT query...');
    console.log('Query:', minimalQuery);
    console.log('Params:', minimalParams);

    const [result] = await connection.execute(minimalQuery, minimalParams);

    console.log('✅ Minimal customer created successfully!');
    console.log('📊 Result:', result);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('SQL:', error.sql);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connection closed');
    }
  }
}

testMinimalCustomerCreation();
