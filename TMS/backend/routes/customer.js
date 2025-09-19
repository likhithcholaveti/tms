 const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { validateModule, sanitizeData } = require('../utils/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/customers/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (increased for documents)
  },
  fileFilter: (req, file, cb) => {
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

const validateDateSequence = (customerData) => {
  const errors = [];

  const checkDates = (startDateField, expiryDateField, errorMsg) => {
    const startDate = customerData[startDateField];
    const expiryDate = customerData[expiryDateField];

    if (startDate && expiryDate && new Date(expiryDate) < new Date(startDate)) {
      errors.push(errorMsg);
    }
  };

  checkDates('AgreementDate', 'AgreementExpiryDate', 'Agreement Expiry Date cannot be before Agreement Date');
  checkDates('BGDate', 'BGExpiryDate', 'BG Expiry Date cannot be before BG Date');
  checkDates('PODate', 'POExpiryDate', 'PO Expiry Date cannot be before PO Date');

  return errors;
};

// This file defines API routes for managing customer data in the Transport Management System.
// It uses Express.js to create route handlers for CRUD operations (Create, Read, Update, Delete)
// related to customers. The routes interact with a MySQL database through a connection pool.

module.exports = (pool) => {
  // Get customers for dropdown (simplified data)
  router.get('/dropdown', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT 
          CustomerID as customer_id,
          COALESCE(Name, 'Unknown') as company_name,
          COALESCE(CustomerCode, '') as customer_code
        FROM Customer 
        ORDER BY Name ASC
      `);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error fetching customers for dropdown:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to add file URLs to customer data
  const addFileUrls = (customer) => {
    const baseUrl = 'http://localhost:3004/api/customers/files/';

    if (customer.AgreementFile) {
      // Extract just the filename from the stored path
      const filename = customer.AgreementFile.includes('/') || customer.AgreementFile.includes('\\')
        ? customer.AgreementFile.split(/[\/\\]/).pop()
        : customer.AgreementFile;
      customer.AgreementFileUrl = baseUrl + filename;
    }
    if (customer.BGFile) {
      const filename = customer.BGFile.includes('/') || customer.BGFile.includes('\\')
        ? customer.BGFile.split(/[\/\\]/).pop()
        : customer.BGFile;
      customer.BGFileUrl = baseUrl + filename;
    }
    if (customer.BGReceivingFile) {
      const filename = customer.BGReceivingFile.includes('/') || customer.BGReceivingFile.includes('\\')
        ? customer.BGReceivingFile.split(/[\/\\]/).pop()
        : customer.BGReceivingFile;
      customer.BGReceivingFileUrl = baseUrl + filename;
    }
    if (customer.POFile) {
      const filename = customer.POFile.includes('/') || customer.POFile.includes('\\')
        ? customer.POFile.split(/[\/\\]/).pop()
        : customer.POFile;
      customer.POFileUrl = baseUrl + filename;
    }

    return customer;
  };

  // Get all customers
  // This route retrieves all customer records from the database.
  // It responds with a JSON array of customer objects ordered by latest first.
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Customer ORDER BY CreatedAt DESC, CustomerID DESC');

      // Add file URLs to each customer
      const customersWithFileUrls = rows.map(customer => addFileUrls(customer));

      res.json(customersWithFileUrls);
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single customer by ID
  // This route retrieves a specific customer record based on the provided ID.
  // It responds with a JSON object of the customer if found, or a 404 error if not found.
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await pool.query('SELECT * FROM Customer WHERE CustomerID = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const [sites] = await pool.query('SELECT * FROM customer_site WHERE CustomerID = ?', [id]);
      const [officeAddresses] = await pool.query('SELECT * FROM customer_office_address WHERE CustomerID = ?', [id]);
      const [keyContacts] = await pool.query('SELECT * FROM customer_key_contact WHERE CustomerID = ?', [id]);
      const [cogentContacts] = await pool.query('SELECT * FROM customer_cogent_contact WHERE CustomerID = ?', [id]);

      // Fetch location details for each site
      for (const site of sites) {
        const [locationRows] = await pool.query('SELECT * FROM Location WHERE LocationID = ?', [site.LocationID]);
        site.LocationDetails = locationRows.length > 0 ? locationRows[0] : null;
      }

      // Add file URLs to the customer data
      const customerWithFileUrls = addFileUrls(rows[0]);

      res.json({
        ...customerWithFileUrls,
        CustomerSites: sites,
        CustomerOfficeAddress: officeAddresses,
        CustomerKeyContact: keyContacts,
        CustomerCogentContact: cogentContacts.length > 0 ? cogentContacts[0] : null
      });
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Helper function to generate customer code abbreviation
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

  // Create a new customer
  // This route creates a new customer record in the database using the data provided in the request body.
  // It responds with a 201 status code and the newly created customer's data, including the generated ID.
  router.post('/', upload.fields([
    { name: 'AgreementFile', maxCount: 1 },
    { name: 'BGFile', maxCount: 1 },
    { name: 'BGReceivingFile', maxCount: 1 },
    { name: 'POFile', maxCount: 1 },
    { name: 'RatesAnnexureFile', maxCount: 1 },
    { name: 'MISFormatFile', maxCount: 1 },
    { name: 'KPISLAFile', maxCount: 1 },
    { name: 'PerformanceReportFile', maxCount: 1 }
  ]), async (req, res) => {
    const customer = req.body;
    const files = req.files;

    if (customer.CustomerSite && typeof customer.CustomerSite === 'string') {
      customer.CustomerSite = JSON.parse(customer.CustomerSite);
    }
    if (customer.CustomerOfficeAddress && typeof customer.CustomerOfficeAddress === 'string') {
      customer.CustomerOfficeAddress = JSON.parse(customer.CustomerOfficeAddress);
    }
    if (customer.CustomerKeyContact && typeof customer.CustomerKeyContact === 'string') {
      customer.CustomerKeyContact = JSON.parse(customer.CustomerKeyContact);
    }
    if (customer.CustomerCogentContact && typeof customer.CustomerCogentContact === 'string') {
      customer.CustomerCogentContact = JSON.parse(customer.CustomerCogentContact);
    }

    const dateErrors = validateDateSequence(customer);
    if (dateErrors.length > 0) {
      return res.status(400).json({ errors: dateErrors });
    }

    try {
      // Generate CustomerCode automatically if not provided
      let customerCode = customer.CustomerCode;
      if (!customerCode || customerCode.trim() === '') {
        const customerName = customer.Name || customer.MasterCustomerName || '';
        const namePrefix = generateCustomerAbbreviation(customerName, 3);
        let nextNumber = 1;

        // Find the highest existing customer code number with the same prefix
        const [rows] = await pool.query(
          'SELECT CustomerCode FROM Customer WHERE CustomerCode LIKE ?',
          [`${namePrefix}%`]
        );

        let maxNum = 0;
        if (rows.length > 0) {
          rows.forEach(row => {
            const code = row.CustomerCode;
            const numPart = code.substring(namePrefix.length);
            const num = parseInt(numPart, 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          });
        }
        nextNumber = maxNum + 1;

        customerCode = `${namePrefix}${String(nextNumber).padStart(3, '0')}`;

        // Double-check that this code doesn't exist (safety check)
        let [existingCheck] = await pool.query(
          'SELECT CustomerID FROM Customer WHERE CustomerCode = ?',
          [customerCode]
        );

        // If somehow it still exists, keep incrementing until we find a free one
        let attempts = 0;
        while (existingCheck.length > 0 && attempts < 100) {
          nextNumber++;
          customerCode = `${namePrefix}${String(nextNumber).padStart(3, '0')}`;
          [existingCheck] = await pool.query(
            'SELECT CustomerID FROM Customer WHERE CustomerCode = ?',
            [customerCode]
          );
          attempts++;
        }

        // Fallback if we can't find a unique code
        if (existingCheck.length > 0) {
          const timestamp = Date.now().toString().slice(-6);
          customerCode = `${namePrefix}${timestamp}`;
        }
      }

      // Handle file paths
      const filePaths = {};
      if (files) {
        if (files.AgreementFile) filePaths.AgreementFile = files.AgreementFile[0].filename;
        if (files.BGFile) filePaths.BGFile = files.BGFile[0].filename;
        if (files.BGReceivingFile) filePaths.BGReceivingFile = files.BGReceivingFile[0].filename;
        if (files.POFile) filePaths.POFile = files.POFile[0].filename;
        if (files.RatesAnnexureFile) filePaths.RatesAnnexureFile = files.RatesAnnexureFile[0].filename;
        if (files.MISFormatFile) filePaths.MISFormatFile = files.MISFormatFile[0].filename;
        if (files.KPISLAFile) filePaths.KPISLAFile = files.KPISLAFile[0].filename;
        if (files.PerformanceReportFile) filePaths.PerformanceReportFile = files.PerformanceReportFile[0].filename;
      }

      const insertQuery = `INSERT INTO Customer (
        \`MasterCustomerName\`, \`Name\`, \`CustomerCode\`, \`CustomerMobileNo\`, \`CustomerEmail\`, \`CustomerContactPerson\`, \`AlternateMobileNo\`, \`CustomerGroup\`, \`ServiceCode\`, \`TypeOfServices\`, \`CityName\`, \`HouseFlatNo\`, \`StreetLocality\`, \`CustomerCity\`, \`CustomerState\`, \`CustomerPinCode\`, \`CustomerCountry\`, \`TypeOfBilling\`, \`CreatedAt\`, \`UpdatedAt\`, \`Locations\`, \`Agreement\`, \`AgreementFile\`, \`AgreementDate\`, \`AgreementTenure\`, \`AgreementExpiryDate\`, \`CustomerNoticePeriod\`, \`CogentNoticePeriod\`, \`CreditPeriod\`, \`Insurance\`, \`MinimumInsuranceValue\`, \`CogentDebitClause\`, \`CogentDebitLimit\`, \`BG\`, \`BGFile\`, \`BGAmount\`, \`BGDate\`, \`BGExpiryDate\`, \`BGBank\`, \`BGReceivingByCustomer\`, \`BGReceivingFile\`, \`PO\`, \`POFile\`, \`PODate\`, \`POValue\`, \`POTenure\`, \`POExpiryDate\`, \`Rates\`, \`RatesAnnexureFile\`, \`YearlyEscalationClause\`, \`GSTNo\`, \`GSTRate\`, \`BillingTenure\`, \`MISFormatFile\`, \`KPISLAFile\`, \`PerformanceReportFile\`, \`CustomerRegisteredOfficeAddress\`, \`CustomerCorporateOfficeAddress\`, \`CogentProjectHead\`, \`CogentProjectOpsManager\`, \`CustomerImportantPersonAddress1\`, \`CustomerImportantPersonAddress2\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const now = new Date();
      const insertParams = [
        customer.MasterCustomerName || null,
        customer.Name || null,
        customerCode || null,
        customer.CustomerMobileNo || null,
        customer.CustomerEmail || null,
        customer.CustomerContactPerson || null,
        customer.AlternateMobileNo || null,
        customer.CustomerGroup || null,
        customer.ServiceCode || null,
        customer.TypeOfServices || null,
        customer.CityName || null,
        customer.HouseFlatNo || null,
        customer.StreetLocality || null,
        customer.CustomerCity || null,
        customer.CustomerState || null,
        customer.CustomerPinCode || null,
        customer.CustomerCountry || null,
        customer.TypeOfBilling || null,
        now,
        now,
        customer.Locations || null,
        customer.Agreement || null,
        filePaths.AgreementFile || null,
        customer.AgreementDate || null,
        customer.AgreementTenure || null,
        customer.AgreementExpiryDate || null,
        customer.CustomerNoticePeriod || null,
        customer.CogentNoticePeriod || null,
        customer.CreditPeriod || null,
        customer.Insurance || null,
        customer.MinimumInsuranceValue || null,
        customer.CogentDebitClause || null,
        customer.CogentDebitLimit || null,
        customer.BG || null,
        filePaths.BGFile || null,
        customer.BGAmount || null,
        customer.BGDate || null,
        customer.BGExpiryDate || null,
        customer.BGBank || null,
        customer.BGReceivingByCustomer || null,
        filePaths.BGReceivingFile || null,
        customer.PO || null,
        filePaths.POFile || null,
        customer.PODate || null,
        customer.POValue || null,
        customer.POTenure || null,
        customer.POExpiryDate || null,
        customer.Rates || null,
        filePaths.RatesAnnexureFile || null,
        customer.YearlyEscalationClause || null,
        customer.GSTNo || null,
        customer.GSTRate || null,
        customer.BillingTenure || null,
        filePaths.MISFormatFile || null,
        filePaths.KPISLAFile || null,
        filePaths.PerformanceReportFile || null,
        customer.CustomerRegisteredOfficeAddress || null,
        customer.CustomerCorporateOfficeAddress || null,
        customer.CogentProjectHead || null,
        customer.CogentProjectOpsManager || null,
        customer.CustomerImportantPersonAddress1 || null,
        customer.CustomerImportantPersonAddress2 || null
      ];
      
      const [results] = await pool.query(insertQuery, insertParams);

      const customerId = results.insertId;

      // Insert related data using Promise.all for parallel execution
      const insertPromises = [];

      // Insert customer sites
      if (customer.CustomerSite && Array.isArray(customer.CustomerSite)) {
        customer.CustomerSite.forEach(site => {
          insertPromises.push(
            pool.query('INSERT INTO customer_site (CustomerID, LocationID, SiteName) VALUES (?, ?, ?)', [
              customerId, site.LocationID, site.site
            ])
          );
        });
      }

      // Insert customer office addresses
      if (customer.CustomerOfficeAddress && Array.isArray(customer.CustomerOfficeAddress)) {
        customer.CustomerOfficeAddress.forEach(address => {
          insertPromises.push(
            pool.query('INSERT INTO customer_office_address (CustomerID, OfficeType, ContactPerson, Department, Designation, Mobile, Email, DOB, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              customerId, address.OfficeType, address.ContactPerson, address.Department, address.Designation, address.Mobile, address.Email, address.DOB, address.Address
            ])
          );
        });
      }

      // Insert key contacts
      if (customer.CustomerKeyContact && Array.isArray(customer.CustomerKeyContact)) {
        customer.CustomerKeyContact.forEach(contact => {
          insertPromises.push(
            pool.query('INSERT INTO customer_key_contact (CustomerID, Name, Department, Designation, Location, OfficeType, Mobile, Email, DOB, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              customerId, contact.Name, contact.Department, contact.Designation, contact.Location, contact.OfficeType, contact.Mobile, contact.Email, contact.DOB, contact.Address
            ])
          );
        });
      }

      // Insert cogent contacts
      if (customer.CustomerCogentContact) {
        const cogent = customer.CustomerCogentContact;
        insertPromises.push(
          pool.query('INSERT INTO customer_cogent_contact (CustomerID, CustomerOwner, ProjectHead, OpsHead, OpsManager, Supervisor) VALUES (?, ?, ?, ?, ?, ?)', [
            customerId, cogent.CustomerOwner, cogent.ProjectHead, cogent.OpsHead, cogent.OpsManager, cogent.Supervisor
          ])
        );
      }

      // Wait for all insertions to complete
      if (insertPromises.length > 0) {
        await Promise.all(insertPromises);
      }

      console.log('🔍 BACKEND DEBUG - Customer creation response:', {
        CustomerID: customerId,
        CustomerCode: customerCode,
        customerData: customer,
        filePaths: filePaths
      });

      // Ensure CustomerCode is explicitly set in response
      const responseData = {
        CustomerID: customerId,
        CustomerCode: customerCode,
        ...customer,
        ...filePaths
      };

      // Double-check that CustomerCode is in the response
      responseData.CustomerCode = customerCode;

      console.log('🔍 BACKEND DEBUG - Final response data:', responseData);
      res.status(201).json(responseData);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update a customer
  // This route updates an existing customer record identified by the provided ID with new data from the request body.
  // It responds with the updated customer data if successful, or a 404 error if the customer is not found.
  router.put('/:id', upload.fields([
    { name: 'AgreementFile', maxCount: 1 },
    { name: 'BGFile', maxCount: 1 },
    { name: 'BGReceivingFile', maxCount: 1 },
    { name: 'POFile', maxCount: 1 },
    { name: 'RatesAnnexureFile', maxCount: 1 },
    { name: 'MISFormatFile', maxCount: 1 },
    { name: 'KPISLAFile', maxCount: 1 },
    { name: 'PerformanceReportFile', maxCount: 1 }
  ]), async (req, res) => {
    const { id } = req.params;
    const customer = req.body;
    const files = req.files;

    if (customer.CustomerSite && typeof customer.CustomerSite === 'string') {
      customer.CustomerSite = JSON.parse(customer.CustomerSite);
    }
    if (customer.CustomerOfficeAddress && typeof customer.CustomerOfficeAddress === 'string') {
      customer.CustomerOfficeAddress = JSON.parse(customer.CustomerOfficeAddress);
    }
    if (customer.CustomerKeyContact && typeof customer.CustomerKeyContact === 'string') {
      customer.CustomerKeyContact = JSON.parse(customer.CustomerKeyContact);
    }
    if (customer.CustomerCogentContact && typeof customer.CustomerCogentContact === 'string') {
      customer.CustomerCogentContact = JSON.parse(customer.CustomerCogentContact);
    }

    console.log('🔧 Customer UPDATE request for ID:', id);
    console.log('📝 Customer data received:', customer);

    const dateErrors = validateDateSequence(customer);
    if (dateErrors.length > 0) {
      return res.status(400).json({ errors: dateErrors });
    }
    
    try {
      // Check if customer exists
      const [existingCustomer] = await pool.query(
        'SELECT * FROM Customer WHERE CustomerID = ?',
        [id]
      );

      if (existingCustomer.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if CustomerCode is being changed and if it conflicts with another customer
      if (customer.CustomerCode !== existingCustomer[0].CustomerCode) {
        const [codeCheck] = await pool.query(
          'SELECT CustomerID FROM Customer WHERE CustomerCode = ? AND CustomerID != ?',
          [customer.CustomerCode, id]
        );

        if (codeCheck.length > 0) {
          return res.status(400).json({ error: 'Customer code already exists' });
        }
      }

      // Handle file paths - keep existing files if no new files uploaded
      const filePaths = {
        AgreementFile: existingCustomer[0].AgreementFile,
        BGFile: existingCustomer[0].BGFile,
        BGReceivingFile: existingCustomer[0].BGReceivingFile,
        POFile: existingCustomer[0].POFile,
        RatesAnnexureFile: existingCustomer[0].RatesAnnexureFile,
        MISFormatFile: existingCustomer[0].MISFormatFile,
        KPISLAFile: existingCustomer[0].KPISLAFile,
        PerformanceReportFile: existingCustomer[0].PerformanceReportFile
      };
      
      if (files) {
        if (files.AgreementFile) {
          // Delete old file if exists
          if (existingCustomer[0].AgreementFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].AgreementFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.AgreementFile = files.AgreementFile[0].filename;
        }
        if (files.BGFile) {
          if (existingCustomer[0].BGFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].BGFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.BGFile = files.BGFile[0].filename;
        }
        if (files.BGReceivingFile) {
          if (existingCustomer[0].BGReceivingFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].BGReceivingFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.BGReceivingFile = files.BGReceivingFile[0].filename;
        }
        if (files.POFile) {
          if (existingCustomer[0].POFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].POFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.POFile = files.POFile[0].filename;
        }
        if (files.RatesAnnexureFile) {
          if (existingCustomer[0].RatesAnnexureFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].RatesAnnexureFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.RatesAnnexureFile = files.RatesAnnexureFile[0].filename;
        }
        if (files.MISFormatFile) {
          if (existingCustomer[0].MISFormatFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].MISFormatFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.MISFormatFile = files.MISFormatFile[0].filename;
        }
        if (files.KPISLAFile) {
          if (existingCustomer[0].KPISLAFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].KPISLAFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.KPISLAFile = files.KPISLAFile[0].filename;
        }
        if (files.PerformanceReportFile) {
          if (existingCustomer[0].PerformanceReportFile) {
            const oldPath = path.join(__dirname, '../uploads/customers/', existingCustomer[0].PerformanceReportFile);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          filePaths.PerformanceReportFile = files.PerformanceReportFile[0].filename;
        }
      }

      // Convert empty strings to null for date and numeric fields
      // Also handle array values (when FormData has duplicate field names)
      const processedCustomer = {};
      Object.keys(customer).forEach(key => {
        let value = customer[key];

        // If value is an array, take the last value (most recent)
        if (Array.isArray(value)) {
          value = value[value.length - 1];
        }

        // Convert empty strings to null for specific fields
        if (key.includes('Date')) {
          // Convert datetime strings to date format for MySQL DATE columns
          if (value && typeof value === 'string' && value.includes('T')) {
            processedCustomer[key] = value.split('T')[0]; // Extract date part only
          } else {
            processedCustomer[key] = value || null;
          }
        } else if (key.includes('Value') || key.includes('Amount') || key.includes('Limit')) {
          processedCustomer[key] = value || null;
        } else {
          processedCustomer[key] = value;
        }
      });

      await pool.query(`
        UPDATE Customer SET
          MasterCustomerName = ?, Name = ?, CustomerCode = ?, ServiceCode = ?, TypeOfServices = ?, Locations = ?,
          CustomerMobileNo = ?, AlternateMobileNo = ?, CustomerEmail = ?, CustomerContactPerson = ?, CustomerGroup = ?, CityName = ?,
          HouseFlatNo = ?, StreetLocality = ?, CustomerCity = ?, CustomerState = ?, CustomerPinCode = ?, CustomerCountry = ?,
          Agreement = ?, AgreementFile = ?, AgreementDate = ?, AgreementTenure = ?, AgreementExpiryDate = ?,
          CustomerNoticePeriod = ?, CogentNoticePeriod = ?, CreditPeriod = ?, Insurance = ?, MinimumInsuranceValue = ?,
          CogentDebitClause = ?, CogentDebitLimit = ?, BG = ?, BGFile = ?, BGAmount = ?, BGDate = ?, BGExpiryDate = ?,
          BGBank = ?, BGReceivingByCustomer = ?, BGReceivingFile = ?, PO = ?, POFile = ?, PODate = ?, POValue = ?, POTenure = ?,
          POExpiryDate = ?, Rates = ?, RatesAnnexureFile = ?, YearlyEscalationClause = ?, GSTNo = ?, GSTRate = ?, TypeOfBilling = ?, BillingTenure = ?,
          MISFormatFile = ?, KPISLAFile = ?, PerformanceReportFile = ?,
          CustomerRegisteredOfficeAddress = ?,
          CustomerCorporateOfficeAddress = ?, CogentProjectHead = ?, CogentProjectOpsManager = ?,
          CustomerImportantPersonAddress1 = ?, CustomerImportantPersonAddress2 = ?
        WHERE CustomerID = ?
      `, [
        processedCustomer.MasterCustomerName, processedCustomer.Name, processedCustomer.CustomerCode, processedCustomer.ServiceCode,
        processedCustomer.TypeOfServices, processedCustomer.Locations,
        processedCustomer.CustomerMobileNo, processedCustomer.AlternateMobileNo, processedCustomer.CustomerEmail, processedCustomer.CustomerContactPerson, processedCustomer.CustomerGroup, processedCustomer.CityName,
        processedCustomer.house_flat_no || null, processedCustomer.street_locality || null, processedCustomer.city || null, processedCustomer.state || null, processedCustomer.pin_code || null, processedCustomer.country || 'India',
        processedCustomer.Agreement, filePaths.AgreementFile, processedCustomer.AgreementDate,
        processedCustomer.AgreementTenure, processedCustomer.AgreementExpiryDate, processedCustomer.CustomerNoticePeriod,
        processedCustomer.CogentNoticePeriod, processedCustomer.CreditPeriod, processedCustomer.Insurance,
        processedCustomer.MinimumInsuranceValue, processedCustomer.CogentDebitClause,
        processedCustomer.CogentDebitLimit, processedCustomer.BG, filePaths.BGFile,
        processedCustomer.BGAmount, processedCustomer.BGDate, processedCustomer.BGExpiryDate,
        processedCustomer.BGBank, processedCustomer.BGReceivingByCustomer, filePaths.BGReceivingFile,
        processedCustomer.PO, filePaths.POFile, processedCustomer.PODate, processedCustomer.POValue, processedCustomer.POTenure,
        processedCustomer.POExpiryDate, processedCustomer.Rates, filePaths.RatesAnnexureFile, processedCustomer.YearlyEscalationClause,
        processedCustomer.GSTNo, processedCustomer.GSTRate, processedCustomer.TypeOfBilling, processedCustomer.BillingTenure,
        filePaths.MISFormatFile, filePaths.KPISLAFile, filePaths.PerformanceReportFile,
        processedCustomer.CustomerRegisteredOfficeAddress, processedCustomer.CustomerCorporateOfficeAddress,
        processedCustomer.CogentProjectHead, processedCustomer.CogentProjectOpsManager,
        processedCustomer.CustomerImportantPersonAddress1, processedCustomer.CustomerImportantPersonAddress2,
        id
      ]);

      // Update customer sites
      if (customer.CustomerSite && Array.isArray(customer.CustomerSite)) {
        await pool.query('DELETE FROM customer_site WHERE CustomerID = ?', [id]);
        for (const site of customer.CustomerSite) {
          await pool.query('INSERT INTO customer_site (CustomerID, LocationID, SiteName) VALUES (?, ?, ?)', [
            id, site.LocationID, site.site
          ]);
        }
      }

      // Update customer office addresses
      if (customer.CustomerOfficeAddress && Array.isArray(customer.CustomerOfficeAddress)) {
        await pool.query('DELETE FROM customer_office_address WHERE CustomerID = ?', [id]);
        for (const address of customer.CustomerOfficeAddress) {
          await pool.query('INSERT INTO customer_office_address (CustomerID, OfficeType, ContactPerson, Department, Designation, Mobile, Email, DOB, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            id, address.OfficeType, address.ContactPerson, address.Department, address.Designation, address.Mobile, address.Email, address.DOB, address.Address
          ]);
        }
      }

      // Update key contacts
      if (customer.CustomerKeyContact && Array.isArray(customer.CustomerKeyContact)) {
        await pool.query('DELETE FROM customer_key_contact WHERE CustomerID = ?', [id]);
        for (const contact of customer.CustomerKeyContact) {
          await pool.query('INSERT INTO customer_key_contact (CustomerID, Name, Department, Designation, Location, OfficeType, Mobile, Email, DOB, Address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            id, contact.Name, contact.Department, contact.Designation, contact.Location, contact.OfficeType, contact.Mobile, contact.Email, contact.DOB, contact.Address
          ]);
        }
      }

      // Update cogent contacts
      if (customer.CustomerCogentContact) {
        await pool.query('DELETE FROM customer_cogent_contact WHERE CustomerID = ?', [id]);
        const cogent = customer.CustomerCogentContact;
        await pool.query('INSERT INTO customer_cogent_contact (CustomerID, CustomerOwner, ProjectHead, OpsHead, OpsManager, Supervisor) VALUES (?, ?, ?, ?, ?, ?)', [
          id, cogent.CustomerOwner, cogent.ProjectHead, cogent.OpsHead, cogent.OpsManager, cogent.Supervisor
        ]);
      }

      res.json({ CustomerID: parseInt(id), ...customer, ...filePaths });
    } catch (error) {
      console.error('Error updating customer:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Customer code already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete a customer
  // This route deletes a customer record from the database based on the provided ID.
  // It responds with a success message if the deletion is successful, or a 404 error if the customer is not found.
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query('DELETE FROM Customer WHERE CustomerID = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Serve customer files
  router.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/customers/', filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', 'inline');

    // Send the file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error serving customer file:', err);
        res.status(500).json({ error: 'Error serving file' });
      }
    });
  });

  // Delete specific file from customer
  router.delete('/:id/files/:fieldName', async (req, res) => {
    try {
      const { id, fieldName } = req.params;

      console.log(`🗑️ Deleting customer file - ID: ${id}, Field: ${fieldName}`);

      // Get current customer data to find the file path
      const [customers] = await pool.query('SELECT * FROM Customer WHERE CustomerID = ?', [id]);

      if (customers.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      const customer = customers[0];
      const fileName = customer[fieldName];

      if (!fileName) {
        return res.status(404).json({ error: 'File not found in database' });
      }

      // Delete file from filesystem
      const filePath = path.join(__dirname, '../uploads/customers', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ File deleted from filesystem: ${filePath}`);
      }

      // Update database to remove file reference
      const updateQuery = `UPDATE Customer SET ${fieldName} = NULL WHERE CustomerID = ?`;
      await pool.query(updateQuery, [id]);

      console.log(`✅ Customer file deleted successfully - ID: ${id}, Field: ${fieldName}`);
      res.json({
        success: true,
        message: 'File deleted successfully',
        fieldName,
        fileName
      });

    } catch (error) {
      console.error('❌ Error deleting customer file:', error);
      res.status(500).json({
        error: 'Failed to delete file',
        details: error.message
      });
    }
  });

  // Get customer sites with location details
  router.get('/:id/sites', async (req, res) => {
    const { id } = req.params;
    try {
      const [sites] = await pool.query(`
        SELECT
          cs.*,
          l.LocationName,
          l.Address,
          c.Name as CustomerName,
          c.CustomerCode
        FROM customer_site cs
        LEFT JOIN Location l ON cs.LocationID = l.LocationID
        LEFT JOIN Customer c ON cs.CustomerID = c.CustomerID
        WHERE cs.CustomerID = ?
        ORDER BY cs.SiteID DESC
      `, [id]);

      res.json({ success: true, data: sites });
    } catch (error) {
      console.error('Error fetching customer sites:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add a new site to customer
  router.post('/:id/sites', async (req, res) => {
    const { id } = req.params;
    const { LocationID, SiteName } = req.body;

    if (!LocationID || !SiteName) {
      return res.status(400).json({ error: 'LocationID and SiteName are required' });
    }

    try {
      // Check if customer exists
      const [customerCheck] = await pool.query('SELECT CustomerID FROM Customer WHERE CustomerID = ?', [id]);
      if (customerCheck.length === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }

      // Check if location exists
      const [locationCheck] = await pool.query('SELECT LocationID FROM Location WHERE LocationID = ?', [LocationID]);
      if (locationCheck.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const [result] = await pool.query(
        'INSERT INTO customer_site (CustomerID, LocationID, SiteName) VALUES (?, ?, ?)',
        [id, LocationID, SiteName]
      );

      // Fetch the created site with location details
      const [newSite] = await pool.query(`
        SELECT
          cs.*,
          l.LocationName,
          l.Address,
          c.Name as CustomerName,
          c.CustomerCode
        FROM customer_site cs
        LEFT JOIN Location l ON cs.LocationID = l.LocationID
        LEFT JOIN Customer c ON cs.CustomerID = c.CustomerID
        WHERE cs.SiteID = ?
      `, [result.insertId]);

      res.status(201).json({ success: true, data: newSite[0] });
    } catch (error) {
      console.error('Error creating customer site:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update customer site
  router.put('/:id/sites/:siteId', async (req, res) => {
    const { id, siteId } = req.params;
    const { LocationID, SiteName } = req.body;

    if (!LocationID || !SiteName) {
      return res.status(400).json({ error: 'LocationID and SiteName are required' });
    }

    try {
      // Check if location exists
      const [locationCheck] = await pool.query('SELECT LocationID FROM Location WHERE LocationID = ?', [LocationID]);
      if (locationCheck.length === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }

      const [result] = await pool.query(
        'UPDATE customer_site SET LocationID = ?, SiteName = ? WHERE SiteID = ? AND CustomerID = ?',
        [LocationID, SiteName, siteId, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customer site not found' });
      }

      // Fetch the updated site with location details
      const [updatedSite] = await pool.query(`
        SELECT
          cs.*,
          l.LocationName,
          l.Address,
          c.Name as CustomerName,
          c.CustomerCode
        FROM customer_site cs
        LEFT JOIN Location l ON cs.LocationID = l.LocationID
        LEFT JOIN Customer c ON cs.CustomerID = c.CustomerID
        WHERE cs.SiteID = ?
      `, [siteId]);

      res.json({ success: true, data: updatedSite[0] });
    } catch (error) {
      console.error('Error updating customer site:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete customer site
  router.delete('/:id/sites/:siteId', async (req, res) => {
    const { id, siteId } = req.params;
    try {
      const [result] = await pool.query('DELETE FROM customer_site WHERE SiteID = ? AND CustomerID = ?', [siteId, id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Customer site not found' });
      }
      res.json({ success: true, message: 'Customer site deleted successfully' });
    } catch (error) {
      console.error('Error deleting customer site:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

   return router;
 };
