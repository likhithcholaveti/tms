const express = require('express');

module.exports = (pool) => {
  const router = express.Router();

// GET /api/fixed-transactions - Get all fixed transactions
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT
        ft.*,
        c.Name as CustomerName,
        p.ProjectName,
        v.VendorName,
        v.VendorCode,
        d.DriverName,
        d.DriverMobileNo,
        vh.VehicleRegistrationNo,
        vh.VehicleType
      FROM fixed_transactions ft
      LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
      LEFT JOIN project p ON ft.ProjectID = p.ProjectID
      LEFT JOIN vendor v ON ft.VendorID = v.VendorID
      LEFT JOIN driver d ON JSON_EXTRACT(ft.DriverIDs, '$[0]') = d.DriverID
      LEFT JOIN vehicle vh ON JSON_EXTRACT(ft.VehicleIDs, '$[0]') = vh.VehicleID
      ORDER BY ft.TransactionDate DESC, ft.TransactionID DESC
    `;

    const [rows] = await pool.query(query);

    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error fetching fixed transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fixed transactions',
      details: error.message
    });
  }
});

// GET /api/fixed-transactions/:id - Get single fixed transaction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        ft.*,
        c.Name as CustomerName,
        p.ProjectName,
        v.VendorName,
        v.VendorCode,
        d.DriverName,
        d.DriverMobileNo,
        vh.VehicleRegistrationNo,
        vh.VehicleType
      FROM fixed_transactions ft
      LEFT JOIN customer c ON ft.CustomerID = c.CustomerID
      LEFT JOIN project p ON ft.ProjectID = p.ProjectID
      LEFT JOIN vendor v ON ft.VendorID = v.VendorID
      LEFT JOIN driver d ON JSON_EXTRACT(ft.DriverIDs, '$[0]') = d.DriverID
      LEFT JOIN vehicle vh ON JSON_EXTRACT(ft.VehicleIDs, '$[0]') = vh.VehicleID
      WHERE ft.TransactionID = ?
    `;

    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fixed transaction not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching fixed transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fixed transaction',
      details: error.message
    });
  }
});

// POST /api/fixed-transactions - Create new fixed transaction
router.post('/', async (req, res) => {
  try {
    const {
      // Basic transaction info
      TripType = 'Fixed',
      TransactionDate,
      Shift,
      VehicleID,
      DriverID,
      VendorID,
      CustomerID,
      ProjectID,
      LocationID,

      // Driver and timing info
      ReplacementDriverID,
      ReplacementDriverName,
      ReplacementDriverNo,
      ArrivalTimeAtHub,
      InTimeByCust,
      OutTimeFromHub,
      ReturnReportingTime,

      // KM and delivery info
      OpeningKM,
      ClosingKM,
      TotalDeliveries,
      TotalDeliveriesAttempted,
      TotalDeliveriesDone,
      TotalDutyHours,

      // Freight info
      VFreightFix,
      FixKm,
      VFreightVariable,
      TotalFreight,

      // Expense details
      TollExpenses,
      ParkingCharges,
      LoadingCharges,
      UnloadingCharges,
      OtherCharges,
      OtherChargesRemarks,
      HandlingCharges,

      // Advance payment info
      AdvanceRequestNo,
      AdvanceToPaid,
      AdvanceApprovedAmount,
      AdvanceApprovedBy,
      AdvancePaidAmount,
      AdvancePaidMode,
      AdvancePaidDate,
      AdvancePaidBy,
      EmployeeDetailsAdvance,

      // Balance payment info
      BalanceToBePaid,
      BalancePaidAmount,
      Variance,
      BalancePaidDate,
      BalancePaidBy,
      EmployeeDetailsBalance,

      // Financial calculations
      Revenue,
      Margin,
      MarginPercentage,

      // Document fields
      DriverAadharDoc,
      DriverLicenceDoc,
      TollExpensesDoc,
      ParkingChargesDoc,

      // Additional timing
      OutTimeFrom,

      // Shipment info
      TotalShipmentsForDeliveries,
      TotalShipmentDeliveriesAttempted,
      TotalShipmentDeliveriesDone,

      // Trip and status info
      TripNo,
      Remarks,
      Status = 'Pending',
      TripClose = false,

      // Manual entry fields
      VehicleNumber,
      VendorName,
      VendorNumber,
      DriverName,
      DriverNumber,
      DriverAadharNumber,
      DriverLicenceNumber,
      VehicleType,

      // Company info
      CompanyName,
      GSTNo,
      CustomerSite,
      Location
    } = req.body;

    // Validate required fields
    if (!TransactionDate || !VehicleID || !DriverID || !CustomerID || !OpeningKM || !ClosingKM) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: TransactionDate, VehicleID, DriverID, CustomerID, OpeningKM, ClosingKM'
      });
    }

    // Convert single VehicleID/DriverID to JSON arrays for database
    const VehicleIDs = VehicleID ? JSON.stringify([VehicleID]) : null;
    const DriverIDs = DriverID ? JSON.stringify([DriverID]) : null;

    const query = `
      INSERT INTO fixed_transactions (
        TripType, TransactionDate, Shift, VehicleIDs, DriverIDs, VendorID, CustomerID, ProjectID, LocationID,
        ReplacementDriverID, ReplacementDriverName, ReplacementDriverNo,
        ArrivalTimeAtHub, InTimeByCust, OutTimeFromHub, ReturnReportingTime,
        OpeningKM, ClosingKM, TotalDeliveries, TotalDeliveriesAttempted, TotalDeliveriesDone,
        TotalDutyHours, VFreightFix, FixKm, VFreightVariable, TotalFreight,
        TollExpenses, ParkingCharges, LoadingCharges, UnloadingCharges, OtherCharges, OtherChargesRemarks,
        HandlingCharges, AdvanceRequestNo, AdvanceToPaid, AdvanceApprovedAmount, AdvanceApprovedBy,
        AdvancePaidAmount, AdvancePaidMode, AdvancePaidDate, AdvancePaidBy, EmployeeDetailsAdvance,
        BalanceToBePaid, BalancePaidAmount, Variance, BalancePaidDate, BalancePaidBy, EmployeeDetailsBalance,
        Revenue, Margin, MarginPercentage, DriverAadharDoc, DriverLicenceDoc, TollExpensesDoc, ParkingChargesDoc,
        OutTimeFrom, TotalShipmentsForDeliveries, TotalShipmentDeliveriesAttempted, TotalShipmentDeliveriesDone,
        TripNo, VehicleNumber, VendorName, VendorNumber, DriverName, DriverNumber, DriverAadharNumber,
        DriverLicenceNumber, VehicleType, CompanyName, GSTNo, CustomerSite, Location,
        Remarks, Status, TripClose
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      TripType, TransactionDate, Shift, VehicleIDs, DriverIDs, VendorID, CustomerID, ProjectID, LocationID,
      ReplacementDriverID, ReplacementDriverName, ReplacementDriverNo,
      ArrivalTimeAtHub, InTimeByCust, OutTimeFromHub, ReturnReportingTime,
      OpeningKM, ClosingKM, TotalDeliveries, TotalDeliveriesAttempted, TotalDeliveriesDone,
      TotalDutyHours, VFreightFix, FixKm, VFreightVariable, TotalFreight,
      TollExpenses, ParkingCharges, LoadingCharges, UnloadingCharges, OtherCharges, OtherChargesRemarks,
      HandlingCharges, AdvanceRequestNo, AdvanceToPaid, AdvanceApprovedAmount, AdvanceApprovedBy,
      AdvancePaidAmount, AdvancePaidMode, AdvancePaidDate, AdvancePaidBy, EmployeeDetailsAdvance,
      BalanceToBePaid, BalancePaidAmount, Variance, BalancePaidDate, BalancePaidBy, EmployeeDetailsBalance,
      Revenue, Margin, MarginPercentage, DriverAadharDoc, DriverLicenceDoc, TollExpensesDoc, ParkingChargesDoc,
      OutTimeFrom, TotalShipmentsForDeliveries, TotalShipmentDeliveriesAttempted, TotalShipmentDeliveriesDone,
      TripNo, VehicleNumber, VendorName, VendorNumber, DriverName, DriverNumber, DriverAadharNumber,
      DriverLicenceNumber, VehicleType, CompanyName, GSTNo, CustomerSite, Location,
      Remarks, Status, TripClose
    ];

    const [result] = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Fixed transaction created successfully',
      data: {
        TransactionID: result.insertId,
        ...req.body
      }
    });
  } catch (error) {
    console.error('Error creating fixed transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create fixed transaction',
      details: error.message
    });
  }
});

// PUT /api/fixed-transactions/:id - Update fixed transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;

    console.log('🔧 FIXED API: PUT request received for transaction ID:', id);
    console.log('🔧 FIXED API: Request body:', JSON.stringify(updateFields, null, 2));

    // Remove TransactionID from update fields if present
    delete updateFields.TransactionID;
    delete updateFields.CreatedAt;

    // Handle VehicleID/DriverID conversion to JSON arrays
    if (updateFields.VehicleID && !updateFields.VehicleIDs) {
      updateFields.VehicleIDs = JSON.stringify([updateFields.VehicleID]);
      delete updateFields.VehicleID;
    }
    if (updateFields.DriverID && !updateFields.DriverIDs) {
      updateFields.DriverIDs = JSON.stringify([updateFields.DriverID]);
      delete updateFields.DriverID;
    }

    // Build dynamic update query
    const fields = Object.keys(updateFields);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const updateValues = fields.map(field => updateFields[field]);
    updateValues.push(id); // Add ID for WHERE clause

    console.log('🔧 FIXED API: Fields to update:', fields);
    console.log('🔧 FIXED API: Values:', updateValues);

    const query = `
      UPDATE fixed_transactions SET
        ${setClause}, UpdatedAt = CURRENT_TIMESTAMP
      WHERE TransactionID = ?
    `;

    const [result] = await pool.query(query, updateValues);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fixed transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Fixed transaction updated successfully'
    });
  } catch (error) {
    console.error('Error updating fixed transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fixed transaction',
      details: error.message
    });
  }
});

// DELETE /api/fixed-transactions/:id - Delete fixed transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM fixed_transactions WHERE TransactionID = ?';
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Fixed transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Fixed transaction deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fixed transaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete fixed transaction',
      details: error.message
    });
  }
});

  return router;
};
