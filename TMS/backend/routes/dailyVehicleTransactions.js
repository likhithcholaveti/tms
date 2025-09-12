const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/transactions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

// This file defines API routes for managing daily vehicle transaction data in the Transport Management System.
// It handles the daily transaction entries with four main sections: master details, transaction details, 
// system calculations, and supervisor remarks.

module.exports = (pool) => {
  // Get all daily vehicle transactions with pagination
  router.get('/', async (req, res) => {
    try {
      console.log('📊 GET /api/daily-vehicle-transactions called');

      const { page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;

      // Query both fixed_transactions and adhoc_transactions tables
      const fixedQuery = `
        SELECT
          ft.*,
          c.Name as CustomerName,
          c.GSTNo as CustomerGSTNo,
          v.VehicleRegistrationNo,
          v.VehicleType,
          d.DriverName,
          d.DriverMobileNo,
          vend.VendorName,
          p.ProjectName,
          rd.DriverName as ReplacementDriverName,
          -- Handle multiple vehicles display
          CASE
            WHEN ft.VehicleIDs IS NOT NULL THEN
              CONCAT(v.VehicleRegistrationNo, ' (+', JSON_LENGTH(ft.VehicleIDs) - 1, ' more)')
            ELSE v.VehicleRegistrationNo
          END as DisplayVehicle,
          -- Handle multiple drivers display
          CASE
            WHEN ft.DriverIDs IS NOT NULL THEN
              CONCAT(d.DriverName, ' (+', JSON_LENGTH(ft.DriverIDs) - 1, ' more)')
            ELSE d.DriverName
          END as DisplayDriver
        FROM fixed_transactions ft
        LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
        LEFT JOIN vehicle v ON v.VehicleID = JSON_UNQUOTE(JSON_EXTRACT(ft.VehicleIDs, '$[0]'))
        LEFT JOIN driver d ON d.DriverID = JSON_UNQUOTE(JSON_EXTRACT(ft.DriverIDs, '$[0]'))
        LEFT JOIN vendor vend ON ft.VendorID = vend.VendorID
        LEFT JOIN project p ON ft.ProjectID = p.ProjectID
        LEFT JOIN driver rd ON ft.ReplacementDriverID = rd.DriverID
      `;

      const adhocQuery = `
        SELECT
          at.*,
          c.Name as CustomerName,
          c.GSTNo as CustomerGSTNo,
          p.ProjectName,
          at.VehicleNumber as VehicleRegistrationNo,
          at.VehicleType,
          at.DriverName,
          at.DriverNumber as DriverMobileNo,
          at.VendorName,
          NULL as ReplacementDriverName,
          -- Handle multiple vehicles display for adhoc
          CASE
            WHEN at.VehicleNumbers IS NOT NULL THEN
              CONCAT(at.VehicleNumber, ' (+', JSON_LENGTH(at.VehicleNumbers) - 1, ' more)')
            ELSE at.VehicleNumber
          END as DisplayVehicle,
          -- Handle multiple drivers display for adhoc
          CASE
            WHEN at.DriverNames IS NOT NULL THEN
              CONCAT(at.DriverName, ' (+', JSON_LENGTH(at.DriverNames) - 1, ' more)')
            ELSE at.DriverName
          END as DisplayDriver
        FROM adhoc_transactions at
        LEFT JOIN customer c ON at.CustomerID = c.CustomerID
        LEFT JOIN project p ON at.ProjectID = p.ProjectID
      `;

      // Execute both queries
      const [fixedRows] = await pool.query(fixedQuery);
      const [adhocRows] = await pool.query(adhocQuery);

      console.log('🔍 Backend: Fixed transactions found:', fixedRows.length);
      console.log('🔍 Backend: Adhoc transactions found:', adhocRows.length);
      console.log('🔍 Backend: Sample adhoc data:', adhocRows.slice(0, 2).map(r => ({
        ID: r.TransactionID,
        Type: r.TripType,
        Customer: r.CustomerName
      })));

      // Combine and sort results
      const allRows = [...fixedRows, ...adhocRows];
      console.log('🔍 Backend: Combined total rows:', allRows.length);
      console.log('🔍 Backend: Transaction type breakdown:',
        allRows.reduce((acc, r) => {
          acc[r.TripType] = (acc[r.TripType] || 0) + 1;
          return acc;
        }, {})
      );

      allRows.sort((a, b) => {
        // Sort by UpdatedAt DESC (latest edited first), then by TransactionDate DESC, then by TransactionID DESC
        const updatedA = new Date(a.UpdatedAt);
        const updatedB = new Date(b.UpdatedAt);
        if (updatedB - updatedA !== 0) return updatedB - updatedA; // Latest edited first

        const dateA = new Date(a.TransactionDate);
        const dateB = new Date(b.TransactionDate);
        if (dateB - dateA !== 0) return dateB - dateA; // Then by transaction date desc

        return b.TransactionID - a.TransactionID; // Finally by ID desc
      });

      // Keep original TransactionIDs and add sequence numbers for display
      const transformedRows = allRows.map((row, index) => ({
        ...row,
        // Keep original TransactionID intact
        SerialNumber: index + 1, // Add sequence number for display (1, 2, 3, ...)
        // Remove the ID remapping - use original TransactionID
      }));

      console.log('🔍 Backend: Keeping original TransactionIDs:', transformedRows.map(r => r.TransactionID));
      console.log('🔍 Backend: Transaction type breakdown:',
        transformedRows.reduce((acc, r) => {
          acc[r.TripType] = (acc[r.TripType] || 0) + 1;
          return acc;
        }, {})
      );

      // Apply pagination to transformed results
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const rows = transformedRows.slice(startIndex, endIndex);

      // Get total count for pagination
      const [fixedCount] = await pool.query('SELECT COUNT(*) as count FROM fixed_transactions');
      const [adhocCount] = await pool.query('SELECT COUNT(*) as count FROM adhoc_transactions');
      const totalCount = fixedCount[0].count + adhocCount[0].count;

      console.log('✅ Query successful, found', rows.length, 'records');

      // Parse JSON fields for Fixed transactions and add file URLs
      const transactionsWithFiles = rows.map(transaction => {
        // Parse JSON fields for Fixed transactions
        if (transaction.TripType === 'Fixed') {
          try {
            if (transaction.VehicleIDs && typeof transaction.VehicleIDs === 'string') {
              transaction.VehicleIDs = JSON.parse(transaction.VehicleIDs);
            }
            if (transaction.DriverIDs && typeof transaction.DriverIDs === 'string') {
              transaction.DriverIDs = JSON.parse(transaction.DriverIDs);
            }
          } catch (e) {
            console.warn('Failed to parse JSON fields for transaction', transaction.TransactionID, ':', e);
          }
        }

        // Format date fields to avoid timezone issues (for both Fixed and Adhoc)
        if (transaction.AdvancePaidDate && transaction.AdvancePaidDate instanceof Date) {
          console.log('🔧 COMBINED API: Formatting AdvancePaidDate for transaction', transaction.TransactionID, 'from', transaction.AdvancePaidDate);
          const date = new Date(transaction.AdvancePaidDate);
          transaction.AdvancePaidDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
          console.log('🔧 COMBINED API: Formatted AdvancePaidDate to', transaction.AdvancePaidDate);
        }
        if (transaction.BalancePaidDate && transaction.BalancePaidDate instanceof Date) {
          console.log('🔧 COMBINED API: Formatting BalancePaidDate for transaction', transaction.TransactionID, 'from', transaction.BalancePaidDate);
          const date = new Date(transaction.BalancePaidDate);
          transaction.BalancePaidDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
          console.log('🔧 COMBINED API: Formatted BalancePaidDate to', transaction.BalancePaidDate);
        }
        if (transaction.TransactionDate && transaction.TransactionDate instanceof Date) {
          const date = new Date(transaction.TransactionDate);
          transaction.TransactionDate = date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
        }

        return addFileUrls(transaction);
      });

      res.json({
        success: true,
        data: transactionsWithFiles,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('❌ Error fetching daily vehicle transactions:', error);
      res.status(500).json({
        error: 'Internal server error',
        details: error.message
      });
    }
  });

  // Get transactions summary/statistics
  router.get('/stats/summary', async (req, res) => {
    try {
      const { date_from, date_to, customer_id, vehicle_id } = req.query;
      
      let whereClause = '1=1';
      let queryParams = [];
      
      if (date_from) {
        whereClause += ' AND duty_start_date >= ?';
        queryParams.push(date_from);
      }
      
      if (date_to) {
        whereClause += ' AND duty_start_date <= ?';
        queryParams.push(date_to);
      }
      
      if (customer_id) {
        whereClause += ' AND customer_id = ?';
        queryParams.push(customer_id);
      }
      
      if (vehicle_id) {
        whereClause += ' AND vehicle_id = ?';
        queryParams.push(vehicle_id);
      }

      // Create mock statistics from existing data
      const query = `
        SELECT
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN v.Status = 'Active' THEN 1 END) as pending_trips,
          0 as in_progress_trips,
          0 as completed_trips,
          0 as cancelled_trips,
          0.00 as total_kilometers,
          0.00 as total_hours,
          0.00 as total_amount
        FROM Vehicle v
        LEFT JOIN Customer c ON v.CustomerID = c.CustomerID
        WHERE v.Status = 'Active'
      `;

      const [rows] = await pool.query(query, queryParams);
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching transaction statistics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // =====================================================
  // NEW ENDPOINTS FOR DAILY VEHICLE TRANSACTION FORM
  // =====================================================

  // Test endpoint to debug database connectivity
  router.get('/test', async (req, res) => {
    try {
      const [result] = await pool.query('SELECT COUNT(*) as count FROM Customer');
      res.json({
        success: true,
        message: 'Database connection working',
        customer_count: result[0].count
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message 
      });
    }
  });

  // Get customers for dropdown with format "CustomerName (CustomerCode)"
  router.get('/form-data/customers', async (req, res) => {
    try {
      const query = `
        SELECT 
          CustomerID as customer_id,
          Name as customer_name,
          CustomerCode as customer_code,
          CONCAT(Name, ' (', CustomerCode, ')') as display_name,
          GSTNo as gst_number,
          Locations as location,
          CustomerSite as customer_site
        FROM Customer 
        WHERE Name IS NOT NULL AND CustomerCode IS NOT NULL
        ORDER BY Name
      `;
      
      const [customers] = await pool.query(query);
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      console.error('Error fetching customers for dropdown:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get customer details by customer_id (GST, Location, Site)
  router.get('/form-data/customer/:customerId', async (req, res) => {
    try {
      const { customerId } = req.params;
      const query = `
        SELECT 
          CustomerID as customer_id,
          Name as customer_name,
          CustomerCode as customer_code,
          GSTNo as gst_number,
          Locations as location,
          CustomerSite as customer_site
        FROM Customer 
        WHERE CustomerID = ?
      `;
      
      const [customer] = await pool.query(query, [customerId]);
      if (customer.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      
      res.json({
        success: true,
        data: customer[0]
      });
    } catch (error) {
      console.error('Error fetching customer details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get vehicles assigned to customer through vehicle linking master
  router.get('/form-data/customer/:customerId/vehicles', async (req, res) => {
    try {
      const { customerId } = req.params;
      
      // Get vehicles for customer through projects (simplified)
      const query = `
        SELECT DISTINCT
          v.VehicleID as vehicle_id,
          v.VehicleRegistrationNo as vehicle_number,
          v.VehicleCode as vehicle_code,
          v.VehicleType as vehicle_type,
          v.TypeOfBody as body_type,
          vn.VendorID as vendor_id,
          vn.VendorName as vendor_name,
          vn.VendorCode as vendor_code,
          p.ProjectID as project_id,
          p.ProjectName as project_name,
          p.ProjectCode as project_code,
          'Standard' as placement_type
        FROM Vehicle v
        LEFT JOIN Vendor vn ON v.VendorID = vn.VendorID
        LEFT JOIN Project p ON p.CustomerID = ?
        WHERE v.Status = 'Active'
          AND p.Status = 'Active'
        ORDER BY vn.VendorName, v.VehicleRegistrationNo
      `;
      
      const [vehicles] = await pool.query(query, [customerId]);
      res.json({
        success: true,
        data: vehicles
      });
    } catch (error) {
      console.error('Error fetching customer vehicles:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get vehicle details with vendor info and vehicle type
  router.get('/form-data/vehicle/:vehicleId/details', async (req, res) => {
    try {
      const { vehicleId } = req.params;
      
      const query = `
        SELECT 
          v.VehicleID as vehicle_id,
          v.VehicleRegistrationNo as vehicle_number,
          v.VehicleCode as vehicle_code,
          v.VehicleType as vehicle_type,
          v.TypeOfBody as body_type,
          v.VehicleModel as vehicle_model,
          vn.VendorID as vendor_id,
          vn.VendorName as vendor_name,
          vn.VendorCode as vendor_code
        FROM Vehicle v
        LEFT JOIN Vendor vn ON v.VendorID = vn.VendorID
        WHERE v.VehicleID = ?
      `;
      
      const [vehicle] = await pool.query(query, [vehicleId]);
      if (vehicle.length === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      res.json({
        success: true,
        data: vehicle[0]
      });
    } catch (error) {
      console.error('Error fetching vehicle details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get project details and placement type for a vehicle assignment
  router.get('/form-data/vehicle/:vehicleId/project-details', async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { customerId } = req.query;
      
      const query = `
        SELECT 
          p.ProjectID as project_id,
          p.ProjectName as project_name,
          p.ProjectCode as project_code,
          p.ProjectDescription as project_description,
          vpa.placement_type,
          vpa.assigned_date,
          vpa.assignment_notes
        FROM vehicle_project_assignments vpa
        JOIN Project p ON vpa.project_id = p.ProjectID
        WHERE vpa.vehicle_id = ? 
          AND vpa.status = 'active'
          ${customerId ? 'AND vpa.customer_id = ?' : ''}
        ORDER BY vpa.assigned_date DESC
        LIMIT 1
      `;
      
      const params = customerId ? [vehicleId, customerId] : [vehicleId];
      const [project] = await pool.query(query, params);
      
      if (project.length === 0) {
        return res.status(404).json({ error: 'No active project assignment found for this vehicle' });
      }
      
      res.json({
        success: true,
        data: project[0]
      });
    } catch (error) {
      console.error('Error fetching vehicle project details:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get drivers for vehicle (based on vendor)
  router.get('/form-data/vehicle/:vehicleId/drivers', async (req, res) => {
    try {
      const { vehicleId } = req.params;
      
      const query = `
        SELECT 
          d.DriverID as driver_id,
          d.DriverName as driver_name,
          d.DriverLicenceNo as license_number,
          d.DriverMobileNo as phone,
          d.DriverAddress as address
        FROM Driver d
        JOIN Vehicle v ON d.VendorID = v.VendorID
        WHERE v.VehicleID = ? 
          AND d.Status = 'Active'
        ORDER BY d.DriverName
      `;
      
      const [drivers] = await pool.query(query, [vehicleId]);
      res.json({
        success: true,
        data: drivers
      });
    } catch (error) {
      console.error('Error fetching drivers for vehicle:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single daily vehicle transaction by ID
  // Note: Due to separate tables having independent auto-increment IDs, we need to check both tables
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const { type } = req.query; // Optional type parameter to specify which table to check

    try {
      let transactions = [];

      // If type is specified, only check that table
      if (type === 'Fixed') {
        const fixedQuery = `
          SELECT
            ft.*,
            COALESCE(c.Name, c.MasterCustomerName, 'Unknown Customer') as CustomerName,
            COALESCE(c.GSTNo, 'N/A') as CustomerGSTNo,
            COALESCE(p.ProjectName, 'Unknown Project') as ProjectName
          FROM fixed_transactions ft
          LEFT JOIN Customer c ON ft.CustomerID = c.CustomerID
          LEFT JOIN Project p ON ft.ProjectID = p.ProjectID
          WHERE ft.TransactionID = ?
        `;

        const [fixedRows] = await pool.query(fixedQuery, [id]);
        if (fixedRows.length > 0) {
          transactions.push(fixedRows[0]);
          console.log('✅ Found Fixed transaction:', fixedRows[0].TransactionID);
        }
      } else if (type === 'Adhoc' || type === 'Replacement') {
        const adhocQuery = `
          SELECT
            at.*,
            c.Name as CustomerName,
            c.GSTNo as CustomerGSTNo,
            p.ProjectName
          FROM adhoc_transactions at
          LEFT JOIN customer c ON at.CustomerID = c.CustomerID
          LEFT JOIN project p ON at.ProjectID = p.ProjectID
          WHERE at.TransactionID = ?
        `;

        const [adhocRows] = await pool.query(adhocQuery, [id]);
        if (adhocRows.length > 0) {
          transactions.push(adhocRows[0]);
          console.log('✅ Found Adhoc/Replacement transaction:', adhocRows[0].TransactionID);
        }
      } else {
        // No type specified, check both tables (return most recent by CreatedAt)
        const fixedQuery = `
          SELECT
            ft.*,
            c.Name as CustomerName,
            c.GSTNo as CustomerGSTNo,
            p.ProjectName
          FROM fixed_transactions ft
          LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
          LEFT JOIN project p ON ft.ProjectID = p.ProjectID
          WHERE ft.TransactionID = ?
        `;

        const adhocQuery = `
          SELECT
            at.*,
            c.Name as CustomerName,
            c.GSTNo as CustomerGSTNo,
            p.ProjectName
          FROM adhoc_transactions at
          LEFT JOIN customer c ON at.CustomerID = c.CustomerID
          LEFT JOIN project p ON at.ProjectID = p.ProjectID
          WHERE at.TransactionID = ?
        `;

        const [fixedRows] = await pool.query(fixedQuery, [id]);
        const [adhocRows] = await pool.query(adhocQuery, [id]);

        if (fixedRows.length > 0) {
          transactions.push(fixedRows[0]);
          console.log('✅ Found Fixed transaction:', fixedRows[0].TransactionID);
        }
        if (adhocRows.length > 0) {
          transactions.push(adhocRows[0]);
          console.log('✅ Found Adhoc/Replacement transaction:', adhocRows[0].TransactionID);
        }

        // If both exist, return the most recent one
        if (transactions.length > 1) {
          transactions.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
          console.log('⚠️ Multiple transactions found with same ID, returning most recent:', transactions[0].TripType);
        }
      }

      if (transactions.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Parse JSON fields for Fixed transactions
      let selectedTransaction = transactions[0];
      if (selectedTransaction.TripType === 'Fixed') {
        try {
          if (selectedTransaction.VehicleIDs && typeof selectedTransaction.VehicleIDs === 'string') {
            selectedTransaction.VehicleIDs = JSON.parse(selectedTransaction.VehicleIDs);
            console.log('🔧 Parsed VehicleIDs:', selectedTransaction.VehicleIDs);
          }
          if (selectedTransaction.DriverIDs && typeof selectedTransaction.DriverIDs === 'string') {
            selectedTransaction.DriverIDs = JSON.parse(selectedTransaction.DriverIDs);
            console.log('🔧 Parsed DriverIDs:', selectedTransaction.DriverIDs);
          }
        } catch (e) {
          console.warn('Failed to parse JSON fields:', e);
        }
      }

      // Add file URLs to the transaction
      const transactionWithFiles = addFileUrls(selectedTransaction);
      res.json(transactionWithFiles);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new daily vehicle transaction with file upload support
  router.post('/', upload.fields([
    { name: 'DriverAadharDoc', maxCount: 1 },
    { name: 'DriverLicenceDoc', maxCount: 1 },
    { name: 'TollExpensesDoc', maxCount: 1 },
    { name: 'ParkingChargesDoc', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const {
        // Master Details (IDs only - names are fetched from related tables)
        CustomerID,
        ProjectID,
        VehicleIDs, // JSON array of vehicle IDs (for both single and multiple)
        DriverIDs,  // JSON array of driver IDs (for both single and multiple)
        VendorID,
        ReplacementDriverID,

        // Daily Transaction Details
        TransactionDate,
        ArrivalTimeAtHub,
        InTimeByCust,
        OutTimeFromHub,
        ReturnReportingTime,
        OpeningKM,
        ClosingKM,
        TotalDeliveries,
        TotalDeliveriesAttempted,
        TotalDeliveriesDone,
        TotalDutyHours,

        // Adhoc/Replacement specific fields
        TripNo,
        VehicleNumber,
        VehicleType,
        VendorName,
        VendorNumber,
        DriverName,
        DriverNumber,
        DriverAadharNumber,
        DriverLicenceNumber,
        TotalShipmentsForDeliveries,
        TotalShipmentDeliveriesAttempted,
        TotalShipmentDeliveriesDone,
        VFreightFix,
        FixKm,
        VFreightVariable,
        TollExpenses,
        ParkingCharges,
        LoadingCharges,
        UnloadingCharges,
        OtherCharges,
        OtherChargesRemarks,
        OutTimeFrom,
        HandlingCharges,
        AdvanceRequestNo,
        AdvanceToPaid,
        AdvanceApprovedAmount,
        AdvanceApprovedBy,
        AdvancePaidAmount,
        AdvancePaidMode,
        AdvancePaidDate,
        AdvancePaidBy,
        EmployeeDetailsAdvance,
        BalancePaidAmount,
        BalancePaidDate,
        BalancePaidBy,
        EmployeeDetailsBalance,
        ReplacementDriverName,
        ReplacementDriverNo,
        TripClose,

        // Master data fields
        CompanyName,
        GSTNo,
        Location,
        CustomerSite,

        // Additional fields
        TripType = 'Fixed',
        Shift,
        Remarks,
        Status = 'Pending'
      } = req.body;

      // Handle file uploads
      const files = req.files || {};
      const DriverAadharDoc = files.DriverAadharDoc ? files.DriverAadharDoc[0].filename : null;
      const DriverLicenceDoc = files.DriverLicenceDoc ? files.DriverLicenceDoc[0].filename : null;
      const TollExpensesDoc = files.TollExpensesDoc ? files.TollExpensesDoc[0].filename : null;
      const ParkingChargesDoc = files.ParkingChargesDoc ? files.ParkingChargesDoc[0].filename : null;

      // Validate required fields based on transaction type
      if (TripType === 'Fixed') {
        if (!CustomerID || !VehicleIDs || !DriverIDs || !TransactionDate || !OpeningKM) {
          return res.status(400).json({
            error: 'Required fields for Fixed: CustomerID, VehicleIDs, DriverIDs, TransactionDate, OpeningKM'
          });
        }
      } else if (TripType === 'Adhoc' || TripType === 'Replacement') {
        if (!CustomerID || !TransactionDate || !OpeningKM || !TripNo || !VehicleNumber || !VendorName || !DriverName || !DriverNumber) {
          return res.status(400).json({
            error: 'Required fields for Adhoc/Replacement: CustomerID, TransactionDate, OpeningKM, TripNo, VehicleNumber, VendorName, DriverName, DriverNumber'
          });
        }

        // Validate mobile number format
        if (DriverNumber && !/^\d{10}$/.test(DriverNumber)) {
          return res.status(400).json({ error: 'Driver Number must be exactly 10 digits' });
        }

        if (VendorNumber && !/^\d{10}$/.test(VendorNumber)) {
          return res.status(400).json({ error: 'Vendor Number must be exactly 10 digits' });
        }

        if (DriverAadharNumber && !/^\d{12}$/.test(DriverAadharNumber)) {
          return res.status(400).json({ error: 'Driver Aadhar Number must be exactly 12 digits' });
        }
      }

      // Check if customer exists
      const [customerCheck] = await pool.query('SELECT CustomerID FROM customer WHERE CustomerID = ?', [CustomerID]);
      if (customerCheck.length === 0) {
        return res.status(400).json({ error: 'Customer not found' });
      }

      // Handle vehicles and drivers from frontend (always as JSON arrays)
      let vehicleIds = [];
      let driverIds = [];
      let primaryVehicleId = null;
      let primaryDriverId = null;

      // Process VehicleIDs (always expect JSON string from frontend)
      if (VehicleIDs) {
        try {
          vehicleIds = typeof VehicleIDs === 'string' ? JSON.parse(VehicleIDs) : VehicleIDs;
          if (!Array.isArray(vehicleIds)) {
            vehicleIds = [vehicleIds]; // Convert single ID to array
          }
          primaryVehicleId = vehicleIds[0]; // Use first vehicle as primary
          console.log('🚛 VehicleIDs processed:', vehicleIds);

          // Validate all vehicles exist
          for (const vehicleId of vehicleIds) {
            console.log('🔍 Validating vehicle ID:', vehicleId);
            const [vehicleCheck] = await pool.query('SELECT VehicleID FROM vehicle WHERE VehicleID = ?', [vehicleId]);
            if (vehicleCheck.length === 0) {
              return res.status(400).json({ error: `Vehicle with ID ${vehicleId} not found` });
            }
          }
        } catch (e) {
          return res.status(400).json({ error: 'Invalid VehicleIDs format' });
        }
      }

      // Process DriverIDs (always expect JSON string from frontend)
      if (DriverIDs) {
        try {
          driverIds = typeof DriverIDs === 'string' ? JSON.parse(DriverIDs) : DriverIDs;
          if (!Array.isArray(driverIds)) {
            driverIds = [driverIds]; // Convert single ID to array
          }
          primaryDriverId = driverIds[0]; // Use first driver as primary
          console.log('👨‍💼 DriverIDs processed:', driverIds);

          // Validate all drivers exist
          for (const driverId of driverIds) {
            const [driverCheck] = await pool.query('SELECT DriverID FROM driver WHERE DriverID = ?', [driverId]);
            if (driverCheck.length === 0) {
              return res.status(400).json({ error: `Driver with ID ${driverId} not found` });
            }
          }
        } catch (e) {
          return res.status(400).json({ error: 'Invalid DriverIDs format' });
        }
      }

      // Validation based on transaction type
      if (TripType === 'Fixed') {
        if (!primaryVehicleId || vehicleIds.length === 0) {
          return res.status(400).json({ error: 'At least one vehicle must be selected for Fixed transactions' });
        }
        if (!primaryDriverId || driverIds.length === 0) {
          return res.status(400).json({ error: 'At least one driver must be selected for Fixed transactions' });
        }
      } else if (TripType === 'Adhoc' || TripType === 'Replacement') {
        // For Adhoc/Replacement, validate manual entry fields
        if (!VehicleNumber) {
          return res.status(400).json({ error: 'Vehicle Number is required for Adhoc/Replacement transactions' });
        }
        if (!VendorName) {
          return res.status(400).json({ error: 'Vendor Name is required for Adhoc/Replacement transactions' });
        }
        if (!DriverName) {
          return res.status(400).json({ error: 'Driver Name is required for Adhoc/Replacement transactions' });
        }
        if (!DriverNumber) {
          return res.status(400).json({ error: 'Driver Number is required for Adhoc/Replacement transactions' });
        }
      }



      // Route to correct table based on TripType and store multiple vehicles/drivers in single row
      let insertQuery, values;

      if (TripType === 'Fixed') {
        // Insert into fixed_transactions table - only use VehicleIDs and DriverIDs (JSON arrays)
        insertQuery = `
          INSERT INTO fixed_transactions (
            TripType, TransactionDate, Shift, VehicleIDs, DriverIDs, VendorID, CustomerID, ProjectID, LocationID,
            ReplacementDriverID, ReplacementDriverName, ReplacementDriverNo,
            ArrivalTimeAtHub, InTimeByCust, OutTimeFromHub, ReturnReportingTime, OutTimeFrom,
            OpeningKM, ClosingKM, TotalDeliveries, TotalDeliveriesAttempted, TotalDeliveriesDone,
            TotalDutyHours, Remarks, Status, TripClose,
            VFreightFix, TollExpenses, ParkingCharges, HandlingCharges,
            VehicleType, CompanyName, GSTNo, Location, CustomerSite
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        values = [
          TripType, TransactionDate, Shift || null, JSON.stringify(vehicleIds), JSON.stringify(driverIds), VendorID || null,
          CustomerID, ProjectID || null, null, ReplacementDriverID || null, ReplacementDriverName || null,
          ReplacementDriverNo || null, ArrivalTimeAtHub || null, InTimeByCust || null, OutTimeFromHub || null,
          ReturnReportingTime || null, OutTimeFrom || null, OpeningKM, ClosingKM || null, TotalDeliveries || null,
          TotalDeliveriesAttempted || null, TotalDeliveriesDone || null, TotalDutyHours || null,
          Remarks || null, Status, TripClose || false,
          VFreightFix || null, TollExpenses || null, ParkingCharges || null, HandlingCharges || null,
          VehicleType || null, CompanyName || null, GSTNo || null, Location || null, CustomerSite || null
        ];

      } else if (TripType === 'Adhoc' || TripType === 'Replacement') {
        // Insert into adhoc_transactions table with multiple vehicles and drivers support
        insertQuery = `
          INSERT INTO adhoc_transactions (
            TripType, TransactionDate, TripNo, CustomerID, ProjectID,
            VehicleNumber, VehicleNumbers, VehicleType, VehicleTypes,
            VendorName, VendorNames, VendorNumber, VendorNumbers,
            DriverName, DriverNames, DriverNumber, DriverNumbers, DriverAadharNumber, DriverLicenceNumber,
            DriverAadharDoc, DriverLicenceDoc, TollExpensesDoc, ParkingChargesDoc,
            ArrivalTimeAtHub, InTimeByCust, OutTimeFromHub, ReturnReportingTime, OutTimeFrom,
            OpeningKM, ClosingKM, TotalShipmentsForDeliveries, TotalShipmentDeliveriesAttempted, TotalShipmentDeliveriesDone,
            VFreightFix, FixKm, VFreightVariable, TotalFreight,
            TollExpenses, ParkingCharges, LoadingCharges, UnloadingCharges, OtherCharges, OtherChargesRemarks,
            TotalDutyHours, AdvanceRequestNo, AdvanceToPaid, AdvanceApprovedAmount, AdvanceApprovedBy,
            AdvancePaidAmount, AdvancePaidMode, AdvancePaidDate, AdvancePaidBy, EmployeeDetailsAdvance,
            BalanceToBePaid, BalancePaidAmount, Variance, BalancePaidDate, BalancePaidBy, EmployeeDetailsBalance,
            Revenue, Margin, MarginPercentage, Status, TripClose, Remarks
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Calculate TotalFreight if freight values are provided
        const vFreightFix = parseFloat(VFreightFix) || 0;
        const vFreightVariable = parseFloat(VFreightVariable) || 0;
        const totalFreight = vFreightFix + vFreightVariable;

        // For adhoc, we'll store multiple vehicle/driver info in JSON fields if arrays are provided
        const vehicleNumbersJson = Array.isArray(VehicleNumber) ? JSON.stringify(VehicleNumber) : null;
        const vehicleTypesJson = Array.isArray(VehicleType) ? JSON.stringify(VehicleType) : null;
        const vendorNamesJson = Array.isArray(VendorName) ? JSON.stringify(VendorName) : null;
        const vendorNumbersJson = Array.isArray(VendorNumber) ? JSON.stringify(VendorNumber) : null;
        const driverNamesJson = Array.isArray(DriverName) ? JSON.stringify(DriverName) : null;
        const driverNumbersJson = Array.isArray(DriverNumber) ? JSON.stringify(DriverNumber) : null;

        values = [
          TripType, TransactionDate, TripNo || null, CustomerID || null, ProjectID || null,
          Array.isArray(VehicleNumber) ? VehicleNumber[0] : VehicleNumber, vehicleNumbersJson,
          Array.isArray(VehicleType) ? VehicleType[0] : VehicleType, vehicleTypesJson,
          Array.isArray(VendorName) ? VendorName[0] : VendorName, vendorNamesJson,
          Array.isArray(VendorNumber) ? VendorNumber[0] : VendorNumber, vendorNumbersJson,
          Array.isArray(DriverName) ? DriverName[0] : DriverName, driverNamesJson,
          Array.isArray(DriverNumber) ? DriverNumber[0] : DriverNumber, driverNumbersJson,
          DriverAadharNumber || null, DriverLicenceNumber || null,
          DriverAadharDoc || null, DriverLicenceDoc || null, TollExpensesDoc || null, ParkingChargesDoc || null,
          ArrivalTimeAtHub || null, InTimeByCust || null, OutTimeFromHub || null, ReturnReportingTime || null, OutTimeFrom || null,
          OpeningKM, ClosingKM || null, TotalShipmentsForDeliveries || null, TotalShipmentDeliveriesAttempted || null, TotalShipmentDeliveriesDone || null,
          VFreightFix || null, FixKm || null, VFreightVariable || null, totalFreight > 0 ? totalFreight : null,
          TollExpenses || null, ParkingCharges || null, LoadingCharges || null, UnloadingCharges || null, OtherCharges || null, OtherChargesRemarks || null,
          TotalDutyHours || null, AdvanceRequestNo || null, AdvanceToPaid || null, AdvanceApprovedAmount || null, AdvanceApprovedBy || null,
          AdvancePaidAmount || null, AdvancePaidMode || null, AdvancePaidDate || null, AdvancePaidBy || null, EmployeeDetailsAdvance || null,
          null, BalancePaidAmount || null, null, BalancePaidDate || null, BalancePaidBy || null, EmployeeDetailsBalance || null,
          null, null, null, Status, TripClose || false, Remarks || null
        ];

      } else {
        return res.status(400).json({ error: 'Invalid TripType. Must be Fixed, Adhoc, or Replacement' });
      }

      // Execute the insert
      const [result] = await pool.query(insertQuery, values);

      // Fetch the created transaction with related data from the correct table
      let newTransaction;

      if (TripType === 'Fixed') {
        const [fixedTransaction] = await pool.query(`
          SELECT
            ft.*,
            c.Name as CustomerName,
            c.GSTNo as CustomerGSTNo,
            v.VehicleRegistrationNo,
            v.VehicleType,
            d.DriverName,
            d.DriverMobileNo,
            vend.VendorName,
            p.ProjectName,
            rd.DriverName as ReplacementDriverName
          FROM fixed_transactions ft
          LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
          LEFT JOIN vehicle v ON v.VehicleID = JSON_UNQUOTE(JSON_EXTRACT(ft.VehicleIDs, '$[0]'))
          LEFT JOIN driver d ON d.DriverID = JSON_UNQUOTE(JSON_EXTRACT(ft.DriverIDs, '$[0]'))
          LEFT JOIN vendor vend ON ft.VendorID = vend.VendorID
          LEFT JOIN project p ON ft.ProjectID = p.ProjectID
          LEFT JOIN driver rd ON ft.ReplacementDriverID = rd.DriverID
          WHERE ft.TransactionID = ?
        `, [result.insertId]);
        newTransaction = fixedTransaction;
      } else {
        const [adhocTransaction] = await pool.query(`
          SELECT
            at.*,
            c.Name as CustomerName,
            c.GSTNo as CustomerGSTNo,
            p.ProjectName
          FROM adhoc_transactions at
          LEFT JOIN customer c ON at.CustomerID = c.CustomerID
          LEFT JOIN project p ON at.ProjectID = p.ProjectID
          WHERE at.TransactionID = ?
        `, [result.insertId]);
        newTransaction = adhocTransaction;
      }

      // Add file URLs to the new transaction (only for adhoc transactions)
      const transactionWithFiles = TripType === 'Fixed' ? newTransaction[0] : addFileUrls(newTransaction[0]);
      res.status(201).json(transactionWithFiles);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Update an existing daily vehicle transaction
  router.put('/:id', upload.fields([
    { name: 'DriverAadharDoc', maxCount: 1 },
    { name: 'DriverLicenceDoc', maxCount: 1 },
    { name: 'TollExpensesDoc', maxCount: 1 },
    { name: 'ParkingChargesDoc', maxCount: 1 }
  ]), async (req, res) => {
    const { id } = req.params;
    try {
      console.log('🔧 PUT request received for transaction ID:', id);
      console.log('🔧 Request body:', req.body);

      // First, we need to map the continuous ID back to the original database ID
      // Get all transactions to recreate the same mapping as in GET endpoint
      const [fixedRows] = await pool.query(`
        SELECT TransactionID, TripType, TransactionDate, 'fixed' as TableType
        FROM fixed_transactions
      `);

      const [adhocRows] = await pool.query(`
        SELECT TransactionID, TripType, TransactionDate, 'adhoc' as TableType
        FROM adhoc_transactions
      `);

      // Combine and sort exactly like in GET endpoint
      const allRows = [...fixedRows, ...adhocRows];
      allRows.sort((a, b) => {
        const dateA = new Date(a.TransactionDate);
        const dateB = new Date(b.TransactionDate);
        if (dateB - dateA !== 0) return dateB - dateA;
        return b.TransactionID - a.TransactionID;
      });

      // Find the transaction with the continuous ID
      const totalRows = allRows.length;
      const targetIndex = totalRows - parseInt(id); // Reverse the mapping

      if (targetIndex < 0 || targetIndex >= allRows.length) {
        return res.status(404).json({ error: 'Transaction not found with continuous ID: ' + id });
      }

      const targetTransaction = allRows[targetIndex];
      const originalTransactionID = targetTransaction.TransactionID;
      const tableType = targetTransaction.TableType;

      // Now determine which table to use based on the mapped transaction
      let transactionTable = null;
      let existingTransaction = null;

      if (tableType === 'fixed') {
        transactionTable = 'fixed_transactions';
        existingTransaction = { TransactionID: originalTransactionID, TripType: targetTransaction.TripType };
      } else if (tableType === 'adhoc') {
        transactionTable = 'adhoc_transactions';
        existingTransaction = { TransactionID: originalTransactionID, TripType: targetTransaction.TripType };
      }

      console.log('🔧 ID Mapping: Continuous ID', id, '→ Original ID', originalTransactionID, 'in table:', transactionTable);
      console.log('🔧 Found transaction in table:', transactionTable, 'Type:', existingTransaction.TripType);

      // Handle file uploads
      const files = req.files || {};
      const DriverAadharDoc = files.DriverAadharDoc ? files.DriverAadharDoc[0].filename : null;
      const DriverLicenceDoc = files.DriverLicenceDoc ? files.DriverLicenceDoc[0].filename : null;
      const TollExpensesDoc = files.TollExpensesDoc ? files.TollExpensesDoc[0].filename : null;
      const ParkingChargesDoc = files.ParkingChargesDoc ? files.ParkingChargesDoc[0].filename : null;

      console.log('🔧 Document files:', { DriverAadharDoc, DriverLicenceDoc, TollExpensesDoc, ParkingChargesDoc });

      // Build update query based on table type
      let updateQuery = '';
      let values = [];

      if (transactionTable === 'fixed_transactions') {
        updateQuery = `
          UPDATE fixed_transactions SET
            TripType = ?, TransactionDate = ?, CustomerID = ?, ProjectID = ?, VehicleIDs = ?, DriverIDs = ?, VendorID = ?,
            ArrivalTimeAtHub = ?, InTimeByCust = ?, OutTimeFromHub = ?, ReturnReportingTime = ?,
            OpeningKM = ?, ClosingKM = ?, TotalDeliveries = ?, TotalDeliveriesAttempted = ?, TotalDeliveriesDone = ?,
            TotalDutyHours = ?, ReplacementDriverName = ?, ReplacementDriverNo = ?, VFreightFix = ?, TollExpenses = ?, ParkingCharges = ?,
            HandlingCharges = ?, OutTimeFrom = ?, VehicleType = ?, CompanyName = ?, GSTNo = ?, Location = ?, CustomerSite = ?,
            DriverAadharDoc = COALESCE(?, DriverAadharDoc), DriverLicenceDoc = COALESCE(?, DriverLicenceDoc),
            TollExpensesDoc = COALESCE(?, TollExpensesDoc), ParkingChargesDoc = COALESCE(?, ParkingChargesDoc),
            Remarks = ?, TripClose = ?, Status = ?, UpdatedAt = CURRENT_TIMESTAMP
          WHERE TransactionID = ?
        `;

        values = [
          req.body.TripType || 'Fixed',
          req.body.TransactionDate,
          req.body.CustomerID,
          req.body.ProjectID,
          req.body.VehicleIDs,
          req.body.DriverIDs,
          req.body.VendorID,
          req.body.ArrivalTimeAtHub,
          req.body.InTimeByCust,
          req.body.OutTimeFromHub,
          req.body.ReturnReportingTime,
          req.body.OpeningKM,
          req.body.ClosingKM,
          req.body.TotalDeliveries,
          req.body.TotalDeliveriesAttempted,
          req.body.TotalDeliveriesDone,
          req.body.TotalDutyHours,
          req.body.ReplacementDriverName,
          req.body.ReplacementDriverNo,
          req.body.VFreightFix,
          req.body.TollExpenses,
          req.body.ParkingCharges,
          req.body.HandlingCharges,
          req.body.OutTimeFrom,
          req.body.VehicleType,
          req.body.CompanyName,
          req.body.GSTNo,
          req.body.Location,
          req.body.CustomerSite,
          DriverAadharDoc,
          DriverLicenceDoc,
          TollExpensesDoc,
          ParkingChargesDoc,
          req.body.Remarks,
          req.body.TripClose ? 1 : 0,
          req.body.Status || 'Pending',
          originalTransactionID
        ];
      } else if (transactionTable === 'adhoc_transactions') {
        // Update for adhoc_transactions - use manual entry fields (no IDs)
        updateQuery = `
          UPDATE adhoc_transactions SET
            TripType = ?, TransactionDate = ?, CustomerID = ?, ProjectID = ?, TripNo = ?,
            VehicleNumber = ?, VehicleType = ?, VendorName = ?, VendorNumber = ?,
            DriverName = ?, DriverNumber = ?, DriverAadharNumber = ?, DriverLicenceNumber = ?,
            ArrivalTimeAtHub = ?, InTimeByCust = ?, OutTimeFromHub = ?, ReturnReportingTime = ?, OutTimeFrom = ?,
            OpeningKM = ?, ClosingKM = ?, TotalShipmentsForDeliveries = ?, TotalShipmentDeliveriesAttempted = ?, TotalShipmentDeliveriesDone = ?,
            TotalDutyHours = ?, VFreightFix = ?, FixKm = ?, VFreightVariable = ?, TotalFreight = ?,
            TollExpenses = ?, ParkingCharges = ?, LoadingCharges = ?, UnloadingCharges = ?, OtherCharges = ?, OtherChargesRemarks = ?,
            DriverAadharDoc = COALESCE(?, DriverAadharDoc), DriverLicenceDoc = COALESCE(?, DriverLicenceDoc),
            TollExpensesDoc = COALESCE(?, TollExpensesDoc), ParkingChargesDoc = COALESCE(?, ParkingChargesDoc),
            Remarks = ?, TripClose = ?, Status = ?, UpdatedAt = CURRENT_TIMESTAMP
          WHERE TransactionID = ?
        `;

        // Calculate TotalFreight if freight values are provided
        const vFreightFix = parseFloat(req.body.VFreightFix) || 0;
        const vFreightVariable = parseFloat(req.body.VFreightVariable) || 0;
        const totalFreight = vFreightFix + vFreightVariable;

        values = [
          req.body.TripType || 'Adhoc',
          req.body.TransactionDate,
          req.body.CustomerID,
          req.body.ProjectID,
          req.body.TripNo,
          req.body.VehicleNumber,
          req.body.VehicleType,
          req.body.VendorName,
          req.body.VendorNumber,
          req.body.DriverName,
          req.body.DriverNumber,
          req.body.DriverAadharNumber,
          req.body.DriverLicenceNumber,
          req.body.ArrivalTimeAtHub,
          req.body.InTimeByCust,
          req.body.OutTimeFromHub,
          req.body.ReturnReportingTime,
          req.body.OutTimeFrom,
          req.body.OpeningKM,
          req.body.ClosingKM,
          req.body.TotalShipmentsForDeliveries,
          req.body.TotalShipmentDeliveriesAttempted,
          req.body.TotalShipmentDeliveriesDone,
          req.body.TotalDutyHours,
          req.body.VFreightFix,
          req.body.FixKm,
          req.body.VFreightVariable,
          totalFreight > 0 ? totalFreight : null,
          req.body.TollExpenses,
          req.body.ParkingCharges,
          req.body.LoadingCharges,
          req.body.UnloadingCharges,
          req.body.OtherCharges,
          req.body.OtherChargesRemarks,
          DriverAadharDoc,
          DriverLicenceDoc,
          TollExpensesDoc,
          ParkingChargesDoc,
          req.body.Remarks,
          req.body.TripClose ? 1 : 0,
          req.body.Status || 'Pending',
          originalTransactionID
        ];
      }

      console.log('🔧 Executing update query:', updateQuery);
      console.log('🔧 With values:', values);

      const [result] = await pool.query(updateQuery, values);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Transaction not found or no changes made' });
      }

      console.log('🔧 Update successful, affected rows:', result.affectedRows);

      // Return success response
      res.json({
        success: true,
        message: 'Transaction updated successfully',
        TransactionID: id,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Delete a daily vehicle transaction
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      console.log('🗑️ DELETE request received for transaction ID:', id);

      // First, determine which table the transaction is in
      let transactionTable = null;
      let result = null;

      // Check fixed_transactions
      const [fixedCheck] = await pool.query('SELECT TransactionID FROM fixed_transactions WHERE TransactionID = ?', [id]);
      if (fixedCheck.length > 0) {
        transactionTable = 'fixed_transactions';
        [result] = await pool.query('DELETE FROM fixed_transactions WHERE TransactionID = ?', [id]);
      } else {
        // Check adhoc_transactions
        const [adhocCheck] = await pool.query('SELECT TransactionID FROM adhoc_transactions WHERE TransactionID = ?', [id]);
        if (adhocCheck.length > 0) {
          transactionTable = 'adhoc_transactions';
          [result] = await pool.query('DELETE FROM adhoc_transactions WHERE TransactionID = ?', [id]);
        }
      }

      if (!result || result.affectedRows === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      console.log('🗑️ Deleted transaction from table:', transactionTable, 'Affected rows:', result.affectedRows);
      res.json({
        success: true,
        message: 'Transaction deleted successfully',
        TransactionID: id,
        table: transactionTable,
        affectedRows: result.affectedRows
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Serve uploaded files
  router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/transactions', filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  });

  // Test endpoint to debug database connectivity
  router.get('/test', async (req, res) => {
    res.json({
      success: true,
      message: 'Daily vehicle transactions API is working!',
      timestamp: new Date().toISOString()
    });
  });

  // Database test endpoint
  router.get('/test-db', async (req, res) => {
    try {
      const [result] = await pool.query('SELECT COUNT(*) as count FROM Customer');
      res.json({
        success: true,
        message: 'Database connection working',
        customer_count: result[0].count
      });
    } catch (error) {
      console.error('Database test error:', error);
      res.status(500).json({ 
        error: 'Database connection failed',
        details: error.message 
      });
    }
  });

  // Serve uploaded files
  router.get('/files/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/transactions', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send file
    res.sendFile(filePath);
  });

  // Helper function to add file URLs to transaction data
  const addFileUrls = (transaction) => {
    const baseUrl = '/api/daily-vehicle-transactions/files/';

    if (transaction.DriverAadharDoc) {
      transaction.DriverAadharDocUrl = baseUrl + transaction.DriverAadharDoc;
    }
    if (transaction.DriverLicenceDoc) {
      transaction.DriverLicenceDocUrl = baseUrl + transaction.DriverLicenceDoc;
    }
    if (transaction.TollExpensesDoc) {
      transaction.TollExpensesDocUrl = baseUrl + transaction.TollExpensesDoc;
    }
    if (transaction.ParkingChargesDoc) {
      transaction.ParkingChargesDocUrl = baseUrl + transaction.ParkingChargesDoc;
    }

    return transaction;
  };

  // =====================================================
  // EXPORT ENDPOINTS
  // =====================================================

  // Export Fixed Transactions Only
  router.get('/export/fixed', async (req, res) => {
    try {
      console.log('📊 GET /api/daily-vehicle-transactions/export/fixed called');

      // Get all Fixed transactions with proper JOINs
      const fixedQuery = `
        SELECT
          ft.*,
          'Fixed' as TripType,
          COALESCE(c.Name, c.MasterCustomerName, 'Unknown Customer') as CustomerName,
          COALESCE(ft.GSTNo, c.GSTNo, 'N/A') as GSTNo,
          COALESCE(p.ProjectName, 'N/A') as ProjectName,
          COALESCE(v.VendorName, ft.VendorName, 'N/A') as VendorName,
          COALESCE(v.VendorCode, 'N/A') as VendorCode,
          COALESCE(ft.Location, c.Locations, 'N/A') as Location,
          COALESCE(ft.CustomerSite, c.CustomerSite, 'N/A') as CustomerSite,
          COALESCE(ft.CompanyName, c.Name, 'N/A') as CompanyName
        FROM fixed_transactions ft
        LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
        LEFT JOIN project p ON ft.ProjectID = p.ProjectID
        LEFT JOIN vendor v ON ft.VendorID = v.VendorID
        ORDER BY ft.TransactionDate DESC, ft.TransactionID DESC
      `;

      const [fixedRows] = await pool.query(fixedQuery);
      console.log('🔍 Export Fixed: Found', fixedRows.length, 'fixed transactions');

      if (fixedRows.length === 0) {
        return res.status(404).json({ error: 'No Fixed transactions found' });
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Fixed Transactions');

      // Define columns for Fixed transactions (exact template order - 33 columns)
      worksheet.columns = [
        { header: 'Customer', key: 'CustomerName', width: 20 },
        { header: 'GST No', key: 'GSTNo', width: 18 },
        { header: 'Project', key: 'ProjectName', width: 20 },
        { header: 'Location', key: 'Location', width: 15 },
        { header: 'Cust Site', key: 'CustomerSite', width: 15 },
        { header: 'Type of Vehicle Placement', key: 'TripType', width: 25 },
        { header: 'Vehicle Type', key: 'VehicleType', width: 15 },
        { header: 'Vehicle No.', key: 'VehicleNo', width: 20 },
        { header: 'Vendor Name', key: 'VendorName', width: 20 },
        { header: 'Vendor Code', key: 'VendorCode', width: 15 },
        { header: 'Driver Name', key: 'DriverName', width: 20 },
        { header: 'Driver No.', key: 'DriverNo', width: 15 },
        { header: 'Replacement Driver Name', key: 'ReplacementDriverName', width: 25 },
        { header: 'Replacement Driver No.', key: 'ReplacementDriverNo', width: 20 },
        { header: 'Date', key: 'TransactionDate', width: 15 },
        { header: 'Arrival Time at Hub', key: 'ArrivalTimeAtHub', width: 20 },
        { header: 'In Time by Cust', key: 'InTimeByCust', width: 18 },
        { header: 'Opening KM', key: 'OpeningKM', width: 12 },
        { header: 'Out Time from Hub', key: 'OutTimeFromHub', width: 18 },
        { header: 'Total Deliveries', key: 'TotalDeliveries', width: 18 },
        { header: 'Total Deliveries Attempted', key: 'TotalDeliveriesAttempted', width: 25 },
        { header: 'Total Deliveries Done', key: 'TotalDeliveriesDone', width: 22 },
        { header: 'Return Reporting Time', key: 'ReturnReportingTime', width: 22 },
        { header: 'Closing KM', key: 'ClosingKM', width: 12 },
        { header: 'TOTAL KM', key: 'TotalKM', width: 12 },
        { header: 'V. FREIGHT (FIX)', key: 'VFreightFix', width: 18 },
        { header: 'Toll Expenses', key: 'TollExpenses', width: 15 },
        { header: 'Parking Charges', key: 'ParkingCharges', width: 18 },
        { header: 'Handling Charges', key: 'HandlingCharges', width: 18 },
        { header: 'Out Time From HUB', key: 'OutTimeFromHUB', width: 20 },
        { header: 'Total Duty Hours', key: 'TotalDutyHours', width: 18 },
        { header: 'Remarks', key: 'Remarks', width: 30 },
        { header: 'Trip Close', key: 'TripClose', width: 12 }
      ];

      // Process data to resolve vehicle and driver information
      const processedRows = [];

      for (const row of fixedRows) {
        // Resolve vehicle information from VehicleIDs JSON
        let vehicleNos = 'None';
        let vehicleTypes = row.VehicleType || 'None';

        if (row.VehicleIDs) {
          try {
            let vehicleIds;
            if (typeof row.VehicleIDs === 'string') {
              vehicleIds = JSON.parse(row.VehicleIDs);
            } else {
              vehicleIds = row.VehicleIDs;
            }

            if (Array.isArray(vehicleIds) && vehicleIds.length > 0) {
              // Convert string IDs to numbers
              const numericIds = vehicleIds.map(id => parseInt(id)).filter(id => !isNaN(id));

              if (numericIds.length > 0) {
                // Query vehicles to get registration numbers and vendor info
                const vehicleQuery = `
                  SELECT
                    v.VehicleRegistrationNo,
                    v.VehicleType,
                    vend.VendorName,
                    vend.VendorCode
                  FROM vehicle v
                  LEFT JOIN vendor vend ON v.VendorID = vend.VendorID
                  WHERE v.VehicleID IN (${numericIds.map(() => '?').join(',')})
                `;
                const [vehicles] = await pool.query(vehicleQuery, numericIds);

                if (vehicles.length > 0) {
                  vehicleNos = vehicles.map(v => v.VehicleRegistrationNo).filter(v => v).join(', ') || 'None';
                  const types = vehicles.map(v => v.VehicleType).filter(v => v);
                  if (types.length > 0) {
                    vehicleTypes = [...new Set(types)].join(', ');
                  }

                  // Get vendor information from vehicles
                  const vendorNames = vehicles.map(v => v.VendorName).filter(v => v);
                  const vendorCodes = vehicles.map(v => v.VendorCode).filter(v => v);

                  if (vendorNames.length > 0) {
                    row.VendorName = [...new Set(vendorNames)].join(', ');
                  }
                  if (vendorCodes.length > 0) {
                    row.VendorCode = [...new Set(vendorCodes)].join(', ');
                  }
                }
              }
            }
          } catch (e) {
            console.error('Error parsing VehicleIDs:', e);
          }
        }

        // Resolve driver information from DriverIDs JSON
        let driverNames = 'None';
        let driverNos = 'None';

        if (row.DriverIDs) {
          try {
            let driverIds;
            if (typeof row.DriverIDs === 'string') {
              driverIds = JSON.parse(row.DriverIDs);
            } else {
              driverIds = row.DriverIDs;
            }

            if (Array.isArray(driverIds) && driverIds.length > 0) {
              // Convert string IDs to numbers
              const numericIds = driverIds.map(id => parseInt(id)).filter(id => !isNaN(id));

              if (numericIds.length > 0) {
                // Query drivers to get names and mobile numbers
                const driverQuery = `SELECT DriverName, DriverMobileNo FROM driver WHERE DriverID IN (${numericIds.map(() => '?').join(',')})`;
                const [drivers] = await pool.query(driverQuery, numericIds);

                if (drivers.length > 0) {
                  driverNames = drivers.map(d => d.DriverName).filter(d => d).join(', ') || 'None';
                  driverNos = drivers.map(d => d.DriverMobileNo).filter(d => d).join(', ') || 'None';
                }
              }
            }
          } catch (e) {
            console.error('Error parsing DriverIDs:', e);
          }
        }

        // Calculate total KM
        const totalKM = (row.ClosingKM && row.OpeningKM) ? (row.ClosingKM - row.OpeningKM) : null;

        processedRows.push({
          CustomerName: row.CustomerName || 'None',
          GSTNo: row.GSTNo || 'None',
          ProjectName: row.ProjectName || 'None',
          Location: row.Location || 'None',
          CustomerSite: row.CustomerSite || 'None',
          TripType: 'Fix', // Fixed transactions show as "Fix"
          VehicleType: vehicleTypes,
          VehicleNo: vehicleNos,
          VendorName: row.VendorName || 'None', // This will be set from vehicle query above
          VendorCode: row.VendorCode || 'None', // This will be set from vehicle query above
          DriverName: driverNames,
          DriverNo: driverNos,
          ReplacementDriverName: row.ReplacementDriverName || 'None',
          ReplacementDriverNo: row.ReplacementDriverNo || 'None',
          TransactionDate: row.TransactionDate ? new Date(row.TransactionDate).toLocaleDateString() : '',
          ArrivalTimeAtHub: row.ArrivalTimeAtHub || '',
          InTimeByCust: row.InTimeByCust || '',
          OpeningKM: row.OpeningKM || '',
          OutTimeFromHub: row.OutTimeFromHub || '',
          TotalDeliveries: row.TotalDeliveries || '',
          TotalDeliveriesAttempted: row.TotalDeliveriesAttempted || '',
          TotalDeliveriesDone: row.TotalDeliveriesDone || '',
          ReturnReportingTime: row.ReturnReportingTime || '',
          ClosingKM: row.ClosingKM || '',
          TotalKM: totalKM,
          VFreightFix: row.VFreightFix || '',
          TollExpenses: row.TollExpenses || '',
          ParkingCharges: row.ParkingCharges || '',
          HandlingCharges: row.HandlingCharges || '',
          OutTimeFromHUB: row.OutTimeFrom || row.OutTimeFromHUB || '',
          TotalDutyHours: row.TotalDutyHours || '',
          Remarks: row.Remarks || 'None',
          TripClose: row.TripClose ? 'Yes' : 'None'
        });
      }

      // Add processed data to worksheet
      processedRows.forEach(row => {
        worksheet.addRow(row);
      });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=fixed-transactions.xlsx');

      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting Fixed transactions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Export Adhoc/Replacement Transactions Only
  router.get('/export/adhoc', async (req, res) => {
    try {
      console.log('📊 GET /api/daily-vehicle-transactions/export/adhoc called');

      // Get all Adhoc/Replacement transactions with proper JOINs
      const adhocQuery = `
        SELECT
          at.*,
          at.TripType,
          COALESCE(c.Name, c.MasterCustomerName, 'Unknown Customer') as CustomerName,
          COALESCE(c.GSTNo, 'N/A') as GSTNo,
          COALESCE(p.ProjectName, 'N/A') as ProjectName,
          COALESCE(c.Locations, 'N/A') as Location,
          COALESCE(c.CustomerSite, 'N/A') as CustomerSite,
          COALESCE(c.Name, 'N/A') as CompanyName,
          'N/A' as VendorCode
        FROM adhoc_transactions at
        LEFT JOIN customer c ON at.CustomerID = c.CustomerID
        LEFT JOIN project p ON at.ProjectID = p.ProjectID
        WHERE at.TripType IN ('Adhoc', 'Replacement')
        ORDER BY at.TransactionDate DESC, at.TransactionID DESC
      `;

      const [adhocRows] = await pool.query(adhocQuery);
      console.log('🔍 Export Adhoc: Found', adhocRows.length, 'adhoc/replacement transactions');

      if (adhocRows.length === 0) {
        return res.status(404).json({ error: 'No Adhoc/Replacement transactions found' });
      }

      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Adhoc Transactions');

      // Define columns in exact order from your Excel template
      worksheet.columns = [
        { header: 'Customer', key: 'CustomerName', width: 20 },
        { header: 'Company Name', key: 'CompanyName', width: 20 },
        { header: 'GST No', key: 'GSTNo', width: 18 },
        { header: 'Project', key: 'ProjectName', width: 20 },
        { header: 'Location', key: 'Location', width: 15 },
        { header: 'Cust Site', key: 'CustomerSite', width: 15 },
        { header: 'Type of Vehicle Placement', key: 'TripType', width: 20 },
        { header: 'Fix Vehicle No.', key: 'FixVehicleNo', width: 15 },
        { header: 'Vehicle Type', key: 'VehicleType', width: 15 },
        { header: 'Date', key: 'TransactionDate', width: 15 },
        { header: 'Trip No.', key: 'TripNo', width: 15 },
        { header: 'Vehicle No.', key: 'VehicleNumber', width: 15 },
        { header: 'Vendor Name', key: 'VendorName', width: 20 },
        { header: 'Vendor Contact No.', key: 'VendorNumber', width: 15 },
        { header: 'Vendor Code', key: 'VendorCode', width: 15 },
        { header: 'Driver Name', key: 'DriverName', width: 20 },
        { header: 'Driver No.', key: 'DriverNumber', width: 15 },
        { header: 'Driver Aadhar No.', key: 'DriverAadharNumber', width: 18 },
        { header: 'Driver Licence No.', key: 'DriverLicenceNumber', width: 18 },
        { header: 'Arrival Time at Hub', key: 'ArrivalTimeAtHub', width: 18 },
        { header: 'In Time by Cust', key: 'InTimeByCust', width: 15 },
        { header: 'Opening KM', key: 'OpeningKM', width: 12 },
        { header: 'Out Time from Hub', key: 'OutTimeFromHub', width: 18 },
        { header: 'Total Shipments for Deliveries', key: 'TotalShipmentsForDeliveries', width: 25 },
        { header: 'Total Shipment Deliveries Attempted', key: 'TotalShipmentDeliveriesAttempted', width: 30 },
        { header: 'Total Shipment Deliveries Done', key: 'TotalShipmentDeliveriesDone', width: 28 },
        { header: 'Return Reporting Time', key: 'ReturnReportingTime', width: 20 },
        { header: 'Closing KM', key: 'ClosingKM', width: 12 },
        { header: 'TOTAL KM', key: 'TotalKM', width: 12 },
        { header: 'V. FREIGHT (FIX)', key: 'VFreightFix', width: 15 },
        { header: 'Fix KM, If Any', key: 'FixKm', width: 15 },
        { header: 'V. Freight (Variable - Per KM)', key: 'VFreightVariable', width: 25 },
        { header: 'Toll Expenses', key: 'TollExpenses', width: 15 },
        { header: 'Parking Charges', key: 'ParkingCharges', width: 15 },
        { header: 'Loading Charges', key: 'LoadingCharges', width: 15 },
        { header: 'Unloading Charges', key: 'UnloadingCharges', width: 18 },
        { header: 'Other Charges, If any', key: 'OtherCharges', width: 20 },
        { header: 'Other Charges Remarks', key: 'OtherChargesRemarks', width: 20 },
        { header: 'Out Time From HUB', key: 'OutTimeFrom', width: 18 },
        { header: 'Total Duty Hours', key: 'TotalDutyHours', width: 15 },
        { header: 'Total Freight', key: 'TotalFreight', width: 15 },
        { header: 'Advance request No.', key: 'AdvanceRequestNo', width: 20 },
        { header: 'Advance To be paid', key: 'AdvanceToPaid', width: 18 },
        { header: 'Advance Approved Amount', key: 'AdvanceApprovedAmount', width: 22 },
        { header: 'Advance Approved by', key: 'AdvanceApprovedBy', width: 20 },
        { header: 'Advance paid', key: 'AdvancePaidAmount', width: 15 },
        { header: 'Advance Paid Mode (UPI/ Bank Transfer)', key: 'AdvancePaidMode', width: 35 },
        { header: 'Advance Paid Date', key: 'AdvancePaidDate', width: 18 },
        { header: 'Advance paid by', key: 'AdvancePaidBy', width: 18 },
        { header: 'Employee Details, if Advance paid by Employee', key: 'EmployeeDetailsAdvance', width: 40 },
        { header: 'Balance to be paid', key: 'BalanceToBePaid', width: 18 },
        { header: 'Balance Paid Amt', key: 'BalancePaidAmount', width: 18 },
        { header: 'Variance, if any', key: 'Variance', width: 15 },
        { header: 'Balance Paid Date', key: 'BalancePaidDate', width: 18 },
        { header: 'Balance paid by', key: 'BalancePaidBy', width: 18 },
        { header: 'Employee Details, if Balance paid by Employee', key: 'EmployeeDetailsBalance', width: 40 },
        { header: 'Remarks', key: 'Remarks', width: 30 },
        { header: 'Revenue', key: 'Revenue', width: 15 },
        { header: 'Margin', key: 'Margin', width: 15 },
        { header: 'Margin %Age', key: 'MarginPercentage', width: 15 },
        { header: 'Trip Close', key: 'TripClose', width: 12 }
      ];

      // Add data to worksheet with proper formatting
      adhocRows.forEach(row => {
        // Calculate derived fields
        const totalKM = (row.ClosingKM && row.OpeningKM) ? (row.ClosingKM - row.OpeningKM) : null;
        const totalFreight = calculateTotalFreight(row, totalKM);
        const balanceToBePaid = (row.TotalFreight || totalFreight || 0) - (row.AdvancePaidAmount || 0);
        const variance = (row.BalancePaidAmount || 0) - balanceToBePaid;
        const revenue = row.Revenue || totalFreight || 0;
        const margin = revenue - (totalFreight || 0);
        const marginPercentage = revenue > 0 ? (margin / revenue) : 0;

        worksheet.addRow({
          CustomerName: row.CustomerName || 'None',
          CompanyName: row.CompanyName || 'None',
          GSTNo: row.GSTNo || 'None',
          ProjectName: row.ProjectName || 'None',
          Location: row.Location || 'None',
          CustomerSite: row.CustomerSite || 'None',
          TripType: row.TripType || 'Adhoc',
          FixVehicleNo: 'None', // Adhoc transactions don't have fixed vehicles
          VehicleType: row.VehicleType || 'None',
          TransactionDate: row.TransactionDate ? new Date(row.TransactionDate).toLocaleDateString() : '',
          TripNo: row.TripNo || 'None',
          VehicleNumber: row.VehicleNumber || 'None',
          VendorName: row.VendorName || 'None',
          VendorNumber: row.VendorNumber || 'None',
          VendorCode: row.VendorCode || 'None',
          DriverName: row.DriverName || 'None',
          DriverNumber: row.DriverNumber || 'None',
          DriverAadharNumber: row.DriverAadharNumber || 'None',
          DriverLicenceNumber: row.DriverLicenceNumber || 'None',
          ArrivalTimeAtHub: row.ArrivalTimeAtHub || '',
          InTimeByCust: row.InTimeByCust || '',
          OpeningKM: row.OpeningKM || '',
          OutTimeFromHub: row.OutTimeFromHub || '',
          TotalShipmentsForDeliveries: row.TotalShipmentsForDeliveries || '',
          TotalShipmentDeliveriesAttempted: row.TotalShipmentDeliveriesAttempted || '',
          TotalShipmentDeliveriesDone: row.TotalShipmentDeliveriesDone || '',
          ReturnReportingTime: row.ReturnReportingTime || '',
          ClosingKM: row.ClosingKM || '',
          TotalKM: totalKM,
          VFreightFix: row.VFreightFix || '',
          FixKm: row.FixKm || 'None',
          VFreightVariable: row.VFreightVariable || '',
          TollExpenses: row.TollExpenses || '',
          ParkingCharges: row.ParkingCharges || '',
          LoadingCharges: row.LoadingCharges || '',
          UnloadingCharges: row.UnloadingCharges || '',
          OtherCharges: row.OtherCharges || '',
          OtherChargesRemarks: row.OtherChargesRemarks || 'None',
          OutTimeFrom: row.OutTimeFrom || '',
          TotalDutyHours: row.TotalDutyHours || '',
          TotalFreight: totalFreight,
          AdvanceRequestNo: row.AdvanceRequestNo || 'None',
          AdvanceToPaid: row.AdvanceToPaid || '',
          AdvanceApprovedAmount: row.AdvanceApprovedAmount || '',
          AdvanceApprovedBy: row.AdvanceApprovedBy || 'None',
          AdvancePaidAmount: row.AdvancePaidAmount || '',
          AdvancePaidMode: row.AdvancePaidMode || 'None',
          AdvancePaidDate: row.AdvancePaidDate ? new Date(row.AdvancePaidDate).toLocaleDateString() : '',
          AdvancePaidBy: row.AdvancePaidBy || 'None',
          EmployeeDetailsAdvance: row.EmployeeDetailsAdvance || 'None',
          BalanceToBePaid: balanceToBePaid,
          BalancePaidAmount: row.BalancePaidAmount || '',
          Variance: variance,
          BalancePaidDate: row.BalancePaidDate ? new Date(row.BalancePaidDate).toLocaleDateString() : '',
          BalancePaidBy: row.BalancePaidBy || 'None',
          EmployeeDetailsBalance: row.EmployeeDetailsBalance || 'None',
          Remarks: row.Remarks || 'None',
          Revenue: revenue,
          Margin: margin,
          MarginPercentage: marginPercentage,
          TripClose: row.TripClose ? 'Yes' : 'None'
        });
      });

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=adhoc-replacement-transactions.xlsx');

      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Error exporting Adhoc transactions:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Helper function to calculate total freight
  function calculateTotalFreight(row, totalKM) {
    const vFreightFix = parseFloat(row.VFreightFix) || 0;
    const vFreightVariable = parseFloat(row.VFreightVariable) || 0;
    const tollExpenses = parseFloat(row.TollExpenses) || 0;
    const parkingCharges = parseFloat(row.ParkingCharges) || 0;
    const loadingCharges = parseFloat(row.LoadingCharges) || 0;
    const unloadingCharges = parseFloat(row.UnloadingCharges) || 0;
    const otherCharges = parseFloat(row.OtherCharges) || 0;

    const variableFreight = vFreightVariable * (totalKM || 0);
    const totalFreight = vFreightFix + variableFreight + tollExpenses + parkingCharges + loadingCharges + unloadingCharges + otherCharges;

    return totalFreight;
  }

  // Delete specific file from transaction
  router.delete('/:id/files/:fieldName', async (req, res) => {
    try {
      const { id, fieldName } = req.params;

      console.log(`🗑️ Deleting transaction file - ID: ${id}, Field: ${fieldName}`);

      // Check both fixed and adhoc transactions
      let transaction = null;
      let tableName = null;

      // Try fixed transactions first
      const [fixedTransactions] = await pool.query('SELECT * FROM fixed_transactions WHERE TransactionID = ?', [id]);
      if (fixedTransactions.length > 0) {
        transaction = fixedTransactions[0];
        tableName = 'fixed_transactions';
      } else {
        // Try adhoc transactions
        const [adhocTransactions] = await pool.query('SELECT * FROM adhoc_transactions WHERE TransactionID = ?', [id]);
        if (adhocTransactions.length > 0) {
          transaction = adhocTransactions[0];
          tableName = 'adhoc_transactions';
        }
      }

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const fileName = transaction[fieldName];

      if (!fileName) {
        return res.status(404).json({ error: 'File not found in database' });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../uploads/transactions', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted from filesystem: ${filePath}`);
      }

      // Update database to remove file reference
      const updateQuery = `UPDATE ${tableName} SET ${fieldName} = NULL WHERE TransactionID = ?`;
      await pool.query(updateQuery, [id]);

      console.log(`✅ Transaction file deleted successfully - ID: ${id}, Field: ${fieldName}, Table: ${tableName}`);
      res.json({
        success: true,
        message: 'File deleted successfully',
        fieldName,
        fileName,
        tableName
      });

    } catch (error) {
      console.error('❌ Error deleting transaction file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error.message
      });
    }
  });

  return router;
};
