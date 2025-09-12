const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validationMiddleware, sanitizeData } = require('../utils/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/vendors';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit (increased for documents)
  },
  fileFilter: (req, file, cb) => {
    // Accept all common file types
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
      cb(new Error('File type not supported. Allowed: Images, PDF, DOC, DOCX, XLS, XLSX, TXT, CSV'));
    }
  }
});

// This file defines API routes for managing comprehensive vendor data in the Transport Management System.
// It supports all 15 fields from the Vendor Master form including file uploads for documents.

module.exports = (pool) => {
  // Helper function to add file URLs to vendor data
  const addFileUrls = (vendor) => {
    const baseUrl = 'http://localhost:3003/api/vendors/files/';

    // Map database column names to URL field names
    if (vendor.VendorPhoto) {
      const filename = vendor.VendorPhoto.includes('/') || vendor.VendorPhoto.includes('\\')
        ? vendor.VendorPhoto.split(/[\\/]/).pop()
        : vendor.VendorPhoto;
      vendor.vendor_photo_url = baseUrl + filename;
    }
    if (vendor.VendorAadharDoc) {
      const filename = vendor.VendorAadharDoc.includes('/') || vendor.VendorAadharDoc.includes('\\')
        ? vendor.VendorAadharDoc.split(/[\\/]/).pop()
        : vendor.VendorAadharDoc;
      vendor.vendor_aadhar_doc_url = baseUrl + filename;
    }
    if (vendor.VendorPANDoc) {
      const filename = vendor.VendorPANDoc.includes('/') || vendor.VendorPANDoc.includes('\\')
        ? vendor.VendorPANDoc.split(/[\\/]/).pop()
        : vendor.VendorPANDoc;
      vendor.vendor_pan_doc_url = baseUrl + filename;
    }
    if (vendor.VendorCompanyUdhyamDoc) {
      const filename = vendor.VendorCompanyUdhyamDoc.includes('/') || vendor.VendorCompanyUdhyamDoc.includes('\\')
        ? vendor.VendorCompanyUdhyamDoc.split(/[\\/]/).pop()
        : vendor.VendorCompanyUdhyamDoc;
      vendor.vendor_company_udhyam_doc_url = baseUrl + filename;
    }
    if (vendor.VendorCompanyPANDoc) {
      const filename = vendor.VendorCompanyPANDoc.includes('/') || vendor.VendorCompanyPANDoc.includes('\\')
        ? vendor.VendorCompanyPANDoc.split(/[\\/]/).pop()
        : vendor.VendorCompanyPANDoc;
      vendor.vendor_company_pan_doc_url = baseUrl + filename;
    }
    if (vendor.VendorCompanyGSTDoc) {
      const filename = vendor.VendorCompanyGSTDoc.includes('/') || vendor.VendorCompanyGSTDoc.includes('\\')
        ? vendor.VendorCompanyGSTDoc.split(/[\\/]/).pop()
        : vendor.VendorCompanyGSTDoc;
      vendor.vendor_company_gst_doc_url = baseUrl + filename;
    }
    if (vendor.CompanyLegalDocs) {
      const filename = vendor.CompanyLegalDocs.includes('/') || vendor.CompanyLegalDocs.includes('\\')
        ? vendor.CompanyLegalDocs.split(/[\\/]/).pop()
        : vendor.CompanyLegalDocs;
      vendor.company_legal_docs_url = baseUrl + filename;
    }
    if (vendor.BankChequeUpload) {
      const filename = vendor.BankChequeUpload.includes('/') || vendor.BankChequeUpload.includes('\\')
        ? vendor.BankChequeUpload.split(/[\\/]/).pop()
        : vendor.BankChequeUpload;
      vendor.bank_cheque_upload_url = baseUrl + filename;
    }

    return vendor;
  };

  // Get all vendors with complete information
  // This route retrieves all vendor records using the comprehensive vendor table
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT v.*, p.ProjectName as project_name, p.ProjectCode as project_code, c.Name as customer_name
        FROM vendor v
        LEFT JOIN Project p ON v.project_id = p.ProjectID
        LEFT JOIN Customer c ON v.customer_id = c.CustomerID
        ORDER BY v.VendorID DESC
      `);

      // Add file URLs to each vendor
      const vendorsWithFileUrls = rows.map(vendor => addFileUrls(vendor));

      res.json(vendorsWithFileUrls);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single vendor by ID with complete information
  // This route retrieves a specific vendor record with all related data
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query('SELECT * FROM vendor WHERE VendorID = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Add file URLs to the vendor data
      const vendorWithFileUrls = addFileUrls(rows[0]);

      res.json(vendorWithFileUrls);
    } catch (error) {
      console.error('Error fetching vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new comprehensive vendor record
  // This route creates a new vendor with all 15 Vendor Master form fields and file uploads
  router.post('/', upload.fields([
    { name: 'vendor_photo', maxCount: 1 },
    { name: 'vendor_aadhar_doc', maxCount: 1 },
    { name: 'vendor_pan_doc', maxCount: 1 },
    { name: 'vendor_company_udhyam_doc', maxCount: 1 },
    { name: 'vendor_company_pan_doc', maxCount: 1 },
    { name: 'vendor_company_gst_doc', maxCount: 1 },
    { name: 'company_legal_docs', maxCount: 1 },
    { name: 'bank_cheque_upload', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const vendor = JSON.parse(req.body.vendorData || '{}');
      const files = req.files || {};

      // Enhanced validation using validation utility
      const validation = require('../utils/validation').validateModule(vendor, 'vendor', ['vendor_mobile_no']);

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
          details: 'Please check the highlighted fields and correct the errors'
        });
      }

      // Validate required fields
      if (!vendor.vendor_name || !vendor.vendor_mobile_no) {
        return res.status(400).json({
          error: 'Vendor name and mobile number are required fields'
        });
      }

      // Sanitize data before processing
      const sanitizedVendor = sanitizeData(vendor, 'vendor');

      // Generate VendorCode automatically if not provided
      let vendorCode = vendor.vendor_code;
      if (!vendorCode || vendorCode.trim() === '') {
        // Find the highest existing vendor code number to avoid conflicts
        const [maxCodeResult] = await pool.query(`
          SELECT VendorCode FROM vendor
          WHERE VendorCode REGEXP '^VEND[0-9]+$'
          ORDER BY CAST(SUBSTRING(VendorCode, 5) AS UNSIGNED) DESC
          LIMIT 1
        `);

        let nextNumber = 1;
        if (maxCodeResult.length > 0) {
          const maxCode = maxCodeResult[0].VendorCode;
          const currentNumber = parseInt(maxCode.substring(4));
          nextNumber = currentNumber + 1;
        }

        vendorCode = `VEND${String(nextNumber).padStart(3, '0')}`;

        // Double-check that this code doesn't exist (safety check)
        const [existingCheck] = await pool.query(
          'SELECT VendorID FROM vendor WHERE VendorCode = ?',
          [vendorCode]
        );

        // If somehow it still exists, keep incrementing until we find a free one
        while (existingCheck.length > 0) {
          nextNumber++;
          vendorCode = `VEND${String(nextNumber).padStart(3, '0')}`;
          const [recheckResult] = await pool.query(
            'SELECT VendorID FROM vendor WHERE VendorCode = ?',
            [vendorCode]
          );
          if (recheckResult.length === 0) break;
        }
      } else {
        // If vendor code is provided, check if it already exists
        const [existingVendor] = await pool.query(
          'SELECT VendorID FROM vendor WHERE VendorCode = ?',
          [vendorCode]
        );

        if (existingVendor.length > 0) {
          return res.status(400).json({ error: 'Vendor code already exists' });
        }
      }

      // Handle file paths
      const filePaths = {};
      Object.keys(files).forEach(fieldname => {
        if (files[fieldname] && files[fieldname][0]) {
          filePaths[fieldname] = files[fieldname][0].path;
        }
      });

      // Build comprehensive INSERT query for existing vendor table
      const insertQuery = `
        INSERT INTO vendor (
          VendorName, VendorCode, VendorMobileNo, VendorAddress,
          HouseFlatNo, StreetLocality, City, State, PinCode, Country,
          VendorAlternateNo, VendorAadhar, VendorPAN, CompanyName, VendorCompanyUdhyam,
          VendorCompanyPAN, CompanyGST, TypeOfCompany,
          StartDateOfCompany, AddressOfCompany, BankDetails,
          AccountHolderName, AccountNumber, IFSCCode, BankName, BranchName, BranchAddress, BankCity, BankState,
          VendorPhoto, VendorAadharDoc, VendorPANDoc,
          VendorCompanyUdhyamDoc, VendorCompanyPANDoc,
          VendorCompanyGSTDoc, CompanyLegalDocs, BankChequeUpload,
          Status, project_id, customer_id
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`;

      const values = [
        sanitizedVendor.vendor_name,
        vendorCode,
        sanitizedVendor.vendor_mobile_no,
        sanitizedVendor.vendor_address,
        sanitizedVendor.house_flat_no || null,
        sanitizedVendor.street_locality || null,
        sanitizedVendor.city || null,
        sanitizedVendor.state || null,
        sanitizedVendor.pin_code || null,
        sanitizedVendor.country || 'India',
        sanitizedVendor.vendor_alternate_no || null,
        sanitizedVendor.vendor_aadhar || null,
        sanitizedVendor.vendor_pan || null,
        sanitizedVendor.vendor_company_name || null,
        sanitizedVendor.vendor_company_udhyam || null,
        sanitizedVendor.vendor_company_pan || null,
        sanitizedVendor.vendor_company_gst || null,
        sanitizedVendor.type_of_company || 'Proprietorship',
        sanitizedVendor.start_date_of_company || null,
        sanitizedVendor.address_of_company || null,
        sanitizedVendor.bank_details || null,
        sanitizedVendor.account_holder_name || null,
        sanitizedVendor.account_number || null,
        sanitizedVendor.ifsc_code || null,
        sanitizedVendor.bank_name || null,
        sanitizedVendor.branch_name || null,
        sanitizedVendor.branch_address || null,
        sanitizedVendor.bank_city || null,
        sanitizedVendor.bank_state || null,
        filePaths.vendor_photo || null,
        filePaths.vendor_aadhar_doc || null,
        filePaths.vendor_pan_doc || null,
        filePaths.vendor_company_udhyam_doc || null,
        filePaths.vendor_company_pan_doc || null,
        filePaths.vendor_company_gst_doc || null,
        filePaths.company_legal_docs || null,
        filePaths.bank_cheque_upload || null,
        'active',
        sanitizedVendor.project_id || null,
        sanitizedVendor.customer_id || null
      ];



      const [result] = await pool.query(insertQuery, values);

      // Fetch the created vendor with all information
      const [newVendor] = await pool.query(
        'SELECT * FROM vendor WHERE VendorID = ?',
        [result.insertId]
      );

      res.status(201).json(newVendor[0]);
    } catch (error) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Update a comprehensive vendor record
  // This route updates an existing vendor with all Vendor Master form fields and file uploads
  router.put('/:id', upload.fields([
    { name: 'vendor_photo', maxCount: 1 },
    { name: 'vendor_aadhar_doc', maxCount: 1 },
    { name: 'vendor_pan_doc', maxCount: 1 },
    { name: 'vendor_company_udhyam_doc', maxCount: 1 },
    { name: 'vendor_company_pan_doc', maxCount: 1 },
    { name: 'vendor_company_gst_doc', maxCount: 1 },
    { name: 'company_legal_docs', maxCount: 1 },
    { name: 'bank_cheque_upload', maxCount: 1 }
  ]), async (req, res) => {
    const { id } = req.params;

    console.log('🔧 Vendor UPDATE request for ID:', id);
    console.log('📝 Vendor data received:', req.body);

    try {
      let vendor = JSON.parse(req.body.vendorData || '{}');
      const files = req.files || {};

      // Apply same logic as customer route - handle array values and date formatting
      const processedVendor = {};
      Object.keys(vendor).forEach(key => {
        let value = vendor[key];

        // If value is an array, take the last value (most recent)
        if (Array.isArray(value)) {
          value = value[value.length - 1];
        }

        // Convert datetime strings to date format for MySQL DATE columns
        if (key.includes('Date') || key.includes('date')) {
          if (value && typeof value === 'string' && value.includes('T')) {
            processedVendor[key] = value.split('T')[0]; // Extract date part only
          } else {
            processedVendor[key] = value || null;
          }
        } else {
          processedVendor[key] = value;
        }
      });

      vendor = processedVendor;



      // Validate required fields
      if (!vendor.vendor_name || !vendor.vendor_mobile_no) {
        return res.status(400).json({
          error: 'Vendor name and mobile number are required fields'
        });
      }

      // Check if vendor exists
      const [existingVendor] = await pool.query('SELECT * FROM vendor WHERE VendorID = ?', [id]);
      if (existingVendor.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Handle file paths - keep existing files if new ones aren't provided
      const fileFields = [
        'vendor_photo', 'vendor_aadhar_doc', 'vendor_pan_doc',
        'vendor_company_udhyam_doc', 'vendor_company_pan_doc',
        'vendor_company_gst_doc', 'company_legal_docs', 'bank_cheque_upload'
      ];

      const filePaths = {};
      fileFields.forEach(fieldname => {
        if (files[fieldname] && files[fieldname][0]) {
          // New file uploaded - delete old file if exists
          const oldFieldName = fieldname === 'vendor_photo' ? 'VendorPhoto' :
                               fieldname === 'vendor_aadhar_doc' ? 'VendorAadharDoc' :
                               fieldname === 'vendor_pan_doc' ? 'VendorPANDoc' :
                               fieldname === 'vendor_company_udhyam_doc' ? 'VendorCompanyUdhyamDoc' :
                               fieldname === 'vendor_company_pan_doc' ? 'VendorCompanyPANDoc' :
                               fieldname === 'vendor_company_gst_doc' ? 'VendorCompanyGSTDoc' :
                               fieldname === 'company_legal_docs' ? 'CompanyLegalDocs' :
                               fieldname === 'bank_cheque_upload' ? 'BankChequeUpload' : fieldname;

          if (existingVendor[0][oldFieldName] && fs.existsSync(existingVendor[0][oldFieldName])) {
            fs.unlinkSync(existingVendor[0][oldFieldName]);
          }
          filePaths[fieldname] = files[fieldname][0].path;
        } else {
          // No new file - keep existing file path
          const oldFieldName = fieldname === 'vendor_photo' ? 'VendorPhoto' :
                               fieldname === 'vendor_aadhar_doc' ? 'VendorAadharDoc' :
                               fieldname === 'vendor_pan_doc' ? 'VendorPANDoc' :
                               fieldname === 'vendor_company_udhyam_doc' ? 'VendorCompanyUdhyamDoc' :
                               fieldname === 'vendor_company_pan_doc' ? 'VendorCompanyPANDoc' :
                               fieldname === 'vendor_company_gst_doc' ? 'VendorCompanyGSTDoc' :
                               fieldname === 'company_legal_docs' ? 'CompanyLegalDocs' :
                               fieldname === 'bank_cheque_upload' ? 'BankChequeUpload' : fieldname;

          filePaths[fieldname] = existingVendor[0][oldFieldName] || null;
        }
      });

      // Build comprehensive UPDATE query for existing vendor table
      const updateQuery = `
        UPDATE vendor SET
          VendorName = ?, VendorMobileNo = ?, VendorAddress = ?,
          HouseFlatNo = ?, StreetLocality = ?, City = ?, State = ?, PinCode = ?, Country = ?,
          VendorAlternateNo = ?, VendorAadhar = ?, VendorPAN = ?,
          CompanyName = ?, VendorCompanyUdhyam = ?, VendorCompanyPAN = ?,
          CompanyGST = ?, TypeOfCompany = ?, StartDateOfCompany = ?,
          AddressOfCompany = ?, BankDetails = ?,
          AccountHolderName = ?, AccountNumber = ?, IFSCCode = ?, BankName = ?,
          BranchName = ?, BranchAddress = ?, BankCity = ?, BankState = ?,
          VendorPhoto = ?, VendorAadharDoc = ?, VendorPANDoc = ?,
          VendorCompanyUdhyamDoc = ?, VendorCompanyPANDoc = ?,
          VendorCompanyGSTDoc = ?, CompanyLegalDocs = ?, BankChequeUpload = ?,
          project_id = ?, customer_id = ?, UpdatedAt = CURRENT_TIMESTAMP
        WHERE VendorID = ?`;

      const values = [
        vendor.vendor_name,
        vendor.vendor_mobile_no,
        vendor.vendor_address,
        vendor.house_flat_no || null,
        vendor.street_locality || null,
        vendor.city || null,
        vendor.state || null,
        vendor.pin_code || null,
        vendor.country || 'India',
        vendor.vendor_alternate_no || null,
        vendor.vendor_aadhar || null,
        vendor.vendor_pan || null,
        vendor.vendor_company_name || null,
        vendor.vendor_company_udhyam || null,
        vendor.vendor_company_pan || null,
        vendor.vendor_company_gst || null,
        vendor.type_of_company || 'Proprietorship',
        vendor.start_date_of_company || null,
        vendor.address_of_company || null,
        vendor.bank_details || null,
        vendor.account_holder_name || null,
        vendor.account_number || null,
        vendor.ifsc_code || null,
        vendor.bank_name || null,
        vendor.branch_name || null,
        vendor.branch_address || null,
        vendor.bank_city || null,
        vendor.bank_state || null,
        filePaths.vendor_photo,
        filePaths.vendor_aadhar_doc,
        filePaths.vendor_pan_doc,
        filePaths.vendor_company_udhyam_doc,
        filePaths.vendor_company_pan_doc,
        filePaths.vendor_company_gst_doc,
        filePaths.company_legal_docs,
        filePaths.bank_cheque_upload,
        vendor.project_id || null,
        vendor.customer_id || null,
        id
      ];

      const [result] = await pool.query(updateQuery, values);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Fetch the updated vendor with all information
      const [updatedVendor] = await pool.query(
        'SELECT * FROM vendor WHERE VendorID = ?',
        [id]
      );

      res.json(updatedVendor[0]);
    } catch (error) {
      console.error('Error updating vendor:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  });

  // Delete a vendor and its associated files
  // This route deletes a vendor record and cleans up associated uploaded files
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      // Get vendor data to delete associated files
      const [vendor] = await pool.query('SELECT * FROM vendor WHERE VendorID = ?', [id]);
      if (vendor.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      // Delete associated files
      const fileFields = [
        'vendor_photo', 'vendor_aadhar_doc', 'vendor_pan_doc', 
        'vendor_company_udhyam_doc', 'vendor_company_pan_doc', 
        'vendor_company_gst_doc', 'company_legal_docs', 'bank_cheque_upload'
      ];
      
      fileFields.forEach(field => {
        if (vendor[0][field] && fs.existsSync(vendor[0][field])) {
          try {
            fs.unlinkSync(vendor[0][field]);
          } catch (err) {
            console.error(`Error deleting file ${vendor[0][field]}:`, err);
          }
        }
      });

      // Delete the vendor record
      const [result] = await pool.query('DELETE FROM vendor WHERE VendorID = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }
      
      res.json({ message: 'Vendor and associated files deleted successfully' });
    } catch (error) {
      console.error('Error deleting vendor:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve vendor files
  router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/vendors/', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', 'inline');

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving vendor file:', err);
        res.status(500).json({ error: 'Error serving file' });
      }
    });
  });

  // Delete specific file from vendor
  router.delete('/:id/files/:fieldName', async (req, res) => {
    try {
      const { id, fieldName } = req.params;

      console.log(`🗑️ Deleting vendor file - ID: ${id}, Field: ${fieldName}`);

      // Get current vendor data to find the file path
      const [vendors] = await pool.query('SELECT * FROM vendor WHERE VendorID = ?', [id]);

      if (vendors.length === 0) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      const vendor = vendors[0];
      const fileName = vendor[fieldName];

      if (!fileName) {
        return res.status(404).json({ error: 'File not found in database' });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../uploads/vendors', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted from filesystem: ${filePath}`);
      }

      // Update database to remove file reference
      const updateQuery = `UPDATE vendor SET ${fieldName} = NULL WHERE VendorID = ?`;
      await pool.query(updateQuery, [id]);

      console.log(`✅ Vendor file deleted successfully - ID: ${id}, Field: ${fieldName}`);
      res.json({
        success: true,
        message: 'File deleted successfully',
        fieldName,
        fileName
      });

    } catch (error) {
      console.error('❌ Error deleting vendor file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error.message
      });
    }
  });

  return router;
};