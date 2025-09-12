const express = require('express');
const router = express.Router();

// This file defines API routes for dashboard summary data in the Transport Management System.
// It provides aggregated data for the dashboard overview including counts and recent activity.

module.exports = (pool) => {
  // Get dashboard summary data
  // This route retrieves aggregated data for the dashboard including counts and recent activity
  router.get('/', async (req, res) => {
    try {
      // Get counts for all entities
      const [customerCount] = await pool.query('SELECT COUNT(*) as count FROM Customer');
      const [vendorCount] = await pool.query('SELECT COUNT(*) as count FROM Vendor');
      const [vehicleCount] = await pool.query('SELECT COUNT(*) as count FROM Vehicle');
      const [driverCount] = await pool.query('SELECT COUNT(*) as count FROM Driver');
      
      // Get today's trips from both tables
      const today = new Date().toISOString().split('T')[0];
      // Fixed trips
      const [fixedCountRows] = await pool.query(`
        SELECT COUNT(*) as count FROM fixed_transactions WHERE DATE(TransactionDate) = ?
      `, [today]);
      // Adhoc trips
      const [adhocCountRows] = await pool.query(`
        SELECT COUNT(*) as count FROM adhoc_transactions WHERE DATE(TransactionDate) = ? AND TripType = 'Adhoc'
      `, [today]);
      // Replacement trips
      const [replacementCountRows] = await pool.query(`
        SELECT COUNT(*) as count FROM adhoc_transactions WHERE DATE(TransactionDate) = ? AND TripType = 'Replacement'
      `, [today]);

      // Get pending invoices
      const [pendingInvoices] = await pool.query(`
        SELECT COUNT(*) as count 
        FROM Billing 
        WHERE PaymentStatus IN ('Pending', 'Overdue')
      `);
      
      // Get total payments received
      const [totalPayments] = await pool.query(`
        SELECT COALESCE(SUM(PaymentAmount), 0) as total 
        FROM PaymentCollection
      `);
      
      // Get recent transactions (last 5)
      const [recentTransactions] = await pool.query(`
        SELECT 
          vt.*,
          v.VehicleRegistrationNo,
          c.Name as CustomerName
        FROM VehicleTransaction vt
        LEFT JOIN Vehicle v ON vt.VehicleID = v.VehicleID
        LEFT JOIN Customer c ON vt.CustomerID = c.CustomerID
        ORDER BY vt.TransactionDate DESC, vt.TransactionID DESC
        LIMIT 5
      `);
      
      // Get recent payments (last 5)
      const [recentPayments] = await pool.query(`
        SELECT
          pc.*,
          b.InvoiceNo,
          c.Name as CustomerName
        FROM PaymentCollection pc
        LEFT JOIN Billing b ON pc.BillingID = b.BillingID
        LEFT JOIN Customer c ON b.CustomerID = c.CustomerID
        ORDER BY pc.PaymentDate DESC, pc.PaymentID DESC
        LIMIT 5
      `);
      
      // Today's trips summary from both tables
      const todayTripsSummary = {
        fixed: fixedCountRows[0]?.count || 0,
        adhoc: adhocCountRows[0]?.count || 0,
        replacement: replacementCountRows[0]?.count || 0
      };

      const dashboardData = {
        totalCustomers: customerCount[0]?.count || 0,
        totalVendors: vendorCount[0]?.count || 0,
        totalVehicles: vehicleCount[0]?.count || 0,
        totalDrivers: driverCount[0]?.count || 0,
        todayTrips: todayTripsSummary,
        pendingInvoices: pendingInvoices[0]?.count || 0,
        totalPayments: parseFloat(totalPayments[0]?.total || 0),
        recentTransactions: recentTransactions || [],
        recentPayments: recentPayments || [],
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
