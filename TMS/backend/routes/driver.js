const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { validateModule, sanitizeData } = require('../utils/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/drivers');
    // Ensure upload directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'driver-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for all document types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain', 'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed: Images, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased for documents)
  }
});

// This file defines API routes for managing driver data in the Transport Management System.
// It uses Express.js to create route handlers for CRUD operations (Create, Read, Update, Delete)
// related to drivers. The routes interact with a MySQL database through a connection pool.

module.exports = (pool) => {
  // Helper function to add file URLs to driver data
  const addFileUrls = (driver) => {
    const baseUrl = 'http://localhost:3003/api/drivers/files/';

    // Helper to normalize file paths for URLs
    const normalizeFilePath = (filePath) => {
      if (!filePath) return null;
      // Extract just the filename from the path
      const filename = filePath.split(/[\\/]/).pop();
      return filename;
    };

    if (driver.DriverPhoto) {
      const filename = normalizeFilePath(driver.DriverPhoto);
      if (filename) {
        driver.DriverPhoto_url = baseUrl + filename;
      }
    }

    return driver;
  };

  // Get all drivers
  // This route retrieves all driver records from the database.
  // It responds with a JSON array of driver objects.
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT * FROM Driver
        ORDER BY DriverID DESC
      `);

      // Add file URLs to each driver
      const driversWithFileUrls = rows.map(driver => addFileUrls(driver));

      res.json(driversWithFileUrls);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single driver by ID
  // This route retrieves a specific driver record based on the provided ID.
  // It responds with a JSON object of the driver if found, or a 404 error if not found.
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query('SELECT * FROM Driver WHERE DriverID = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Add file URLs to the driver data
      const driverWithFileUrls = addFileUrls(rows[0]);

      res.json(driverWithFileUrls);
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Upload driver photo
  // This route handles photo upload for drivers
  router.post('/upload-photo', upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No photo file provided' });
      }
      
      const photoPath = `/uploads/drivers/${req.file.filename}`;
      res.json({
        message: 'Photo uploaded successfully',
        photoPath: photoPath,
        filename: req.file.filename
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ error: 'Error uploading photo' });
    }
  });

  // Create a new driver with photo upload
  // This route creates a new driver record in the database using the data provided in the request body.
  // It responds with a 201 status code and the newly created driver's data, including the generated ID.
  router.post('/', upload.single('DriverPhoto'), async (req, res) => {
    const driver = req.body;

    // Validation: DriverName and DriverLicenceNo are required
    if (!driver.DriverName || typeof driver.DriverName !== 'string' || !driver.DriverName.trim()) {
      return res.status(400).json({ error: "DriverName is required and cannot be empty." });
    }
    if (!driver.DriverLicenceNo || typeof driver.DriverLicenceNo !== 'string' || !driver.DriverLicenceNo.trim()) {
      return res.status(400).json({ error: "DriverLicenceNo is required and cannot be empty." });
    }

    try {
      // Handle photo upload if provided
      let photoPath = null;
      if (req.file) {
        photoPath = req.file.path;
        console.log('🚗 DRIVER API - Photo uploaded:', photoPath);
      } else {
        console.log('🚗 DRIVER API - No photo uploaded');
      }

      console.log('🚗 DRIVER API - Creating driver with data:', {
        DriverName: driver.DriverName,
        DriverLicenceNo: driver.DriverLicenceNo,
        DriverPhoto: photoPath
      });

      const [result] = await pool.query(
        `INSERT INTO Driver (
          DriverName, DriverLicenceNo, DriverMobileNo, DriverAddress,
          HouseFlatNo, StreetLocality, DriverCity, DriverState, DriverPinCode, DriverCountry,
          MedicalDate, LicenceExpiry, DriverSameAsVendor, DriverAlternateNo,
          DriverLicenceIssueDate, DriverTotalExperience, DriverPhoto, VendorID, VehicleID
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          driver.DriverName,
          driver.DriverLicenceNo,
          driver.DriverMobileNo || null,
          driver.DriverAddress || null,
          driver.house_flat_no || null,
          driver.street_locality || null,
          driver.city || null,
          driver.state || null,
          driver.pin_code || null,
          driver.country || 'India',
          driver.DriverMedicalDate || null,
          driver.DriverLicenceExpiryDate || null,
          driver.DriverSameAsVendor || 'Separate',
          driver.DriverAlternateNo || null,
          driver.DriverLicenceIssueDate || null,
          driver.DriverTotalExperience || null,
          photoPath,
          driver.VendorID || null,
          driver.vehicle_number || null
        ]
      );

      // Fetch the created driver
      const [newDriver] = await pool.query(
        'SELECT * FROM Driver WHERE DriverID = ?',
        [result.insertId]
      );

      res.status(201).json(newDriver[0]);
    } catch (error) {
      console.error('Error creating driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update a driver
  // This route updates an existing driver record identified by the provided ID with new data from the request body.
  // It responds with the updated driver data if successful, or a 404 error if the driver is not found.
  router.put('/:id', upload.single('DriverPhoto'), async (req, res) => {
    const { id } = req.params;
    const driver = req.body;

    console.log('🚗 DRIVER UPDATE - Received data:', {
      id: id,
      driverData: driver,
      hasFile: !!req.file,
      fileName: req.file?.filename
    });

    // Validation: DriverName and DriverLicenceNo are required
    if (!driver.DriverName || typeof driver.DriverName !== 'string' || !driver.DriverName.trim()) {
      return res.status(400).json({ error: "DriverName is required and cannot be empty." });
    }
    if (!driver.DriverLicenceNo || typeof driver.DriverLicenceNo !== 'string' || !driver.DriverLicenceNo.trim()) {
      return res.status(400).json({ error: "DriverLicenceNo is required and cannot be empty." });
    }

    try {
      // Get existing driver data to preserve photo if no new one uploaded
      const [existingDriver] = await pool.query('SELECT * FROM Driver WHERE DriverID = ?', [id]);
      if (existingDriver.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Handle photo upload if provided
      let photoPath = null;

      if (req.file) {
        // New file uploaded - delete old file if exists
        if (existingDriver[0].DriverPhoto && fs.existsSync(existingDriver[0].DriverPhoto)) {
          fs.unlinkSync(existingDriver[0].DriverPhoto);
        }
        photoPath = req.file.path;
        console.log('🚗 DRIVER UPDATE - New photo uploaded:', photoPath);
      } else {
        // No new file - keep existing photo
        photoPath = existingDriver[0].DriverPhoto || null;
        console.log('🚗 DRIVER UPDATE - Keeping existing photo:', photoPath);
      }

      const [result] = await pool.query(
        `UPDATE Driver SET
          DriverName = ?, DriverLicenceNo = ?, DriverMobileNo = ?, DriverAddress = ?,
          HouseFlatNo = ?, StreetLocality = ?, DriverCity = ?, DriverState = ?, DriverPinCode = ?, DriverCountry = ?,
          MedicalDate = ?, LicenceExpiry = ?, DriverSameAsVendor = ?, DriverAlternateNo = ?,
          DriverLicenceIssueDate = ?, DriverTotalExperience = ?, VehicleID = ?, DriverPhoto = ?, VendorID = ?
        WHERE DriverID = ?`,
        [
          driver.DriverName,
          driver.DriverLicenceNo,
          driver.DriverMobileNo || null,
          driver.DriverAddress || null,
          driver.house_flat_no || null,
          driver.street_locality || null,
          driver.city || null,
          driver.state || null,
          driver.pin_code || null,
          driver.country || 'India',
          driver.DriverMedicalDate || null,  // Frontend sends DriverMedicalDate, DB expects MedicalDate
          driver.DriverLicenceExpiryDate || null,  // Frontend sends DriverLicenceExpiryDate, DB expects LicenceExpiry
          driver.DriverSameAsVendor || 'Separate',
          driver.DriverAlternateNo || null,
          driver.DriverLicenceIssueDate || null,
          driver.DriverTotalExperience || null,
          driver.vehicle_number || null,  // VehicleID from frontend
          photoPath,
          driver.VendorID || null,
          id
        ]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      // Fetch the updated driver
      const [updatedDriver] = await pool.query(
        'SELECT * FROM Driver WHERE DriverID = ?',
        [id]
      );

      res.json(updatedDriver[0]);
    } catch (error) {
      console.error('Error updating driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete a driver
  // This route deletes a driver record from the database based on the provided ID.
  // It responds with a success message if the deletion is successful, or a 404 error if the driver is not found.
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query('DELETE FROM Driver WHERE DriverID = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }
      res.json({ message: 'Driver deleted successfully' });
    } catch (error) {
      console.error('Error deleting driver:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve driver files
  router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/drivers/', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', 'inline');

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving driver file:', err);
        res.status(500).json({ error: 'Error serving file' });
      }
    });
  });

  // Delete specific file from driver
  router.delete('/:id/files/:fieldName', async (req, res) => {
    try {
      const { id, fieldName } = req.params;

      console.log(`🗑️ Deleting driver file - ID: ${id}, Field: ${fieldName}`);

      // Get current driver data to find the file path
      const [drivers] = await pool.query('SELECT * FROM Driver WHERE DriverID = ?', [id]);

      if (drivers.length === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      const driver = drivers[0];
      const fileName = driver[fieldName];

      if (!fileName) {
        return res.status(404).json({ error: 'File not found in database' });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../uploads/drivers', fileName.replace('/uploads/drivers/', ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted from filesystem: ${filePath}`);
      }

      // Update database to remove file reference
      const updateQuery = `UPDATE Driver SET ${fieldName} = NULL WHERE DriverID = ?`;
      await pool.query(updateQuery, [id]);

      console.log(`✅ Driver file deleted successfully - ID: ${id}, Field: ${fieldName}`);
      res.json({
        success: true,
        message: 'File deleted successfully',
        fieldName,
        fileName
      });

    } catch (error) {
      console.error('❌ Error deleting driver file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error.message
      });
    }
  });

  return router;
};
