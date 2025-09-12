const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function createAdminUser() {
  try {
    // Database connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'transportation_management'
    });

    // Hash the password
    const password = 'kishore@1243';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Delete existing user if exists
    await connection.execute('DELETE FROM users WHERE email = ?', ['kishore@1243']);

    // Insert new user
    const [result] = await connection.execute(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, NOW())',
      ['kishore', 'kishore@1243', hashedPassword, 'admin']
    );

    console.log('✅ User created successfully!');
    console.log('📧 Email: kishore@1243');
    console.log('🔑 Password: kishore@1243');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', result.insertId);

    await connection.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
}

createAdminUser();
