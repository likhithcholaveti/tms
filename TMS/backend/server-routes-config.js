// Server Routes Configuration for Separate Transaction Types
// Add these routes to your main server.js or app.js file

const express = require('express');
const app = express();

// Import the new route handlers
const fixedTransactionsRoutes = require('./routes/fixedTransactions');
const adhocTransactionsRoutes = require('./routes/adhocTransactions');

// Register the new routes
app.use('/api/fixed-transactions', fixedTransactionsRoutes);
app.use('/api/adhoc-transactions', adhocTransactionsRoutes);

// Example of how to integrate with existing server.js:
/*
// In your existing server.js file, add these lines:

// Import new routes
const fixedTransactionsRoutes = require('./routes/fixedTransactions');
const adhocTransactionsRoutes = require('./routes/adhocTransactions');

// Register new routes (add after existing routes)
app.use('/api/fixed-transactions', fixedTransactionsRoutes);
app.use('/api/adhoc-transactions', adhocTransactionsRoutes);

// Keep existing routes for backward compatibility
app.use('/api/daily-vehicle-transactions', dailyVehicleTransactionsRoutes);
*/

module.exports = {
  fixedTransactionsRoutes,
  adhocTransactionsRoutes
};
