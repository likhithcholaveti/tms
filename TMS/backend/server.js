const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005; // Changed port to 3005 for testing to avoid conflict

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection pool
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'transportation_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: false,
  charset: 'utf8mb4',
  insecureAuth: true
};

// Only add password if it's provided
// if (process.env.DB_PASSWORD) {
//   dbConfig.password = process.env.DB_PASSWORD;
// }

const pool = mysql.createPool(dbConfig);

// Test database connection with detailed logging
pool.getConnection()
  .then(connection => {
    console.log('✅ Connected to MySQL database successfully');
    console.log(`📊 Database: ${dbConfig.database}`);
    console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 User: ${dbConfig.user}`);
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error connecting to database:', err);
    console.error('🔧 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
  });

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const vehicleRoutes = require('./routes/vehicle');
const vendorRoutes = require('./routes/vendor');
const driverRoutes = require('./routes/driver');
const projectRoutes = require('./routes/project');
const transactionRoutes = require('./routes/transaction');
const billingRoutes = require('./routes/billing');
const paymentRoutes = require('./routes/payment');
const reportsRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const locationRoutes = require('./routes/location');
const dailyVehicleTransactionRoutes = require('./routes/dailyVehicleTransactions');
const fixedTransactionRoutes = require('./routes/fixedTransactions');
const adhocTransactionRoutes = require('./routes/adhocTransactions');
// const vehicleRelationshipRoutes = require('./routes/vehicleRelationships');
// const vehicleProjectLinkingRoutes = require('./routes/vehicleProjectLinking');
const exportRoutes = require('./routes/export');
const importRoutes = require('./routes/import');
const notificationsRoutes = require('./routes/notifications');
const ratesRoutes = require('./routes/rates');
const pincodeRoutes = require('./routes/pincode');
const ifscRoutes = require('./routes/ifsc');

// Import Notification Service
const NotificationService = require('./services/notificationService');

// Initialize Notification Service
const notificationService = new NotificationService(pool);

// Start scheduled notification job
notificationService.startScheduledJob();

// Use routes
app.use('/api/auth', authRoutes(pool));
app.use('/api/customers', customerRoutes(pool));
app.use('/api/vehicles', vehicleRoutes(pool));
app.use('/api/vendors', vendorRoutes(pool));
app.use('/api/drivers', driverRoutes(pool));
app.use('/api/projects', projectRoutes(pool));
app.use('/api/transactions', transactionRoutes(pool));
app.use('/api/vehicle-transactions', transactionRoutes(pool)); // Add vehicle-transactions alias
app.use('/api/billing', billingRoutes(pool));
app.use('/api/payments', paymentRoutes(pool));
app.use('/api/reports', reportsRoutes(pool));
app.use('/api/dashboard', dashboardRoutes(pool));
app.use('/api/locations', locationRoutes(pool));
app.use('/api/daily-vehicle-transactions', dailyVehicleTransactionRoutes(pool));
app.use('/api/fixed-transactions', fixedTransactionRoutes(pool));
app.use('/api/adhoc-transactions', adhocTransactionRoutes(pool));
// app.use('/api/vehicle-relationships', vehicleRelationshipRoutes(pool));
// app.use('/api/vehicle-project-linking', vehicleProjectLinkingRoutes(pool));
app.use('/api/export', exportRoutes(pool));
app.use('/api/import', importRoutes(pool));
app.use('/api/notifications', notificationsRoutes(pool, notificationService));
app.use('/api/rates', ratesRoutes(pool));
app.use('/api/pincode', pincodeRoutes(pool));
app.use('/api/pincode', pincodeRoutes);
app.use('/api/ifsc', ifscRoutes(pool));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Transportation Management System Backend');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
