const express = require('express');
const router = express.Router();

const validateDateSequence = (projectData) => {
  const errors = [];

  const checkDates = (startDateField, expiryDateField, errorMsg) => {
    const startDate = projectData[startDateField];
    const expiryDate = projectData[expiryDateField];

    if (startDate && expiryDate && new Date(expiryDate) < new Date(startDate)) {
      errors.push(errorMsg);
    }
  };

  checkDates('StartDate', 'EndDate', 'Project End Date cannot be before Project Start Date');

  return errors;
};

// This file defines API routes for managing project data in the Transport Management System.
// It uses Express.js to create route handlers for CRUD operations (Create, Read, Update, Delete)
// related to projects. The routes interact with a MySQL database through a connection pool.

module.exports = (pool) => {
  // Get all projects
  // This route retrieves all project records from the database with customer information.
  // It responds with a JSON array of project objects including customer names.
  router.get('/', async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          p.*,
          c.Name as CustomerName,
          c.CustomerCode
        FROM Project p
        LEFT JOIN Customer c ON p.CustomerID = c.CustomerID
        ORDER BY p.ProjectID DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error fetching projects:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get projects by customer ID
  // This route retrieves all project records for a specific customer.
  // It responds with a JSON array of project objects for the given customer.
  // NOTE: This route must come BEFORE the /:id route to avoid conflicts
  router.get('/customer/:customerId', async (req, res) => {
    const { customerId } = req.params;
    try {
      const [rows] = await pool.query(`
        SELECT
          p.*,
          c.Name as CustomerName,
          c.CustomerCode
        FROM Project p
        LEFT JOIN Customer c ON p.CustomerID = c.CustomerID
        WHERE p.CustomerID = ?
        ORDER BY p.ProjectID DESC
      `, [customerId]);
      
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error('Error fetching projects by customer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get a single project by ID
  // This route retrieves a specific project record based on the provided ID.
  // It responds with a JSON object of the project if found, or a 404 error if not found.
  router.get('/:id', async (req, res) => {
    const { id } = req.params;
    
    // Validate that id is numeric to avoid conflicts with other routes
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid project ID format' });
    }
    
    try {
      const [rows] = await pool.query(`
        SELECT
          p.*,
          c.Name as CustomerName,
          c.CustomerCode
        FROM Project p
        LEFT JOIN Customer c ON p.CustomerID = c.CustomerID
        WHERE p.ProjectID = ?
      `, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error fetching project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create a new project
  // This route creates a new project record in the database using the data provided in the request body.
  // It responds with a 201 status code and the newly created project's data, including the generated ID.
  router.post('/', async (req, res) => {
    const { ProjectName, CustomerID, ProjectCode, ProjectDescription, LocationID, ProjectValue, StartDate, EndDate, Status } = req.body;
    
    // Validate required fields
    if (!ProjectName || !CustomerID) {
      return res.status(400).json({ 
        error: 'ProjectName and CustomerID are required fields' 
      });
    }

    const dateErrors = validateDateSequence(req.body);
    if (dateErrors.length > 0) {
      return res.status(400).json({ errors: dateErrors });
    }

    try {
      // Check if customer exists
      const [customerCheck] = await pool.query(
        'SELECT CustomerID, CustomerCode FROM Customer WHERE CustomerID = ?',
        [CustomerID]
      );
      
      if (customerCheck.length === 0) {
        return res.status(400).json({ error: 'Customer not found' });
      }

      // Generate ProjectCode automatically if not provided
      let projectCode = ProjectCode;
      if (!projectCode || projectCode.trim() === '') {
        const customerCode = customerCheck[0].CustomerCode;
        const projectNamePrefix = ProjectName.substring(0, 3).toUpperCase();
        const baseCode = `${customerCode}-${projectNamePrefix}`;

        // Find the highest existing project code number to avoid conflicts
        const [maxCodeResult] = await pool.query(`
          SELECT ProjectCode FROM Project
          WHERE ProjectCode REGEXP '^${baseCode}[0-9]+$'
          ORDER BY CAST(SUBSTRING(ProjectCode, ${baseCode.length + 1}) AS UNSIGNED) DESC
          LIMIT 1
        `);

        let nextNumber = 1;
        if (maxCodeResult.length > 0) {
          const maxCode = maxCodeResult[0].ProjectCode;
          const currentNumber = parseInt(maxCode.substring(baseCode.length));
          nextNumber = currentNumber + 1;
        }

        projectCode = `${baseCode}${String(nextNumber).padStart(3, '0')}`;

        // Double-check that this code doesn't exist (safety check)
        const [existingCheck] = await pool.query(
          'SELECT ProjectID FROM Project WHERE ProjectCode = ?',
          [projectCode]
        );

        // If somehow it still exists, keep incrementing until we find a free one
        while (existingCheck.length > 0) {
          nextNumber++;
          projectCode = `${baseCode}${String(nextNumber).padStart(3, '0')}`;
          const [recheckResult] = await pool.query(
            'SELECT ProjectID FROM Project WHERE ProjectCode = ?',
            [projectCode]
          );
          if (recheckResult.length === 0) break;
        }
      }

      const [result] = await pool.query(
        'INSERT INTO Project (ProjectName, CustomerID, ProjectCode, ProjectDescription, LocationID, ProjectValue, StartDate, EndDate, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [ProjectName, CustomerID, projectCode, ProjectDescription || '', LocationID || null, ProjectValue || null, StartDate || null, EndDate || null, Status || 'Active']
      );
      
      // Fetch the created project with customer information
      const [newProject] = await pool.query(`
        SELECT
          p.*,
          c.Name as CustomerName,
          c.CustomerCode
        FROM Project p
        LEFT JOIN Customer c ON p.CustomerID = c.CustomerID
        WHERE p.ProjectID = ?
      `, [result.insertId]);
      
      res.status(201).json(newProject[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Project code already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update a project
  // This route updates an existing project record identified by the provided ID with new data from the request body.
  // It responds with the updated project data if successful, or a 404 error if the project is not found.
  router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { ProjectName, CustomerID, ProjectCode, ProjectDescription, LocationID, ProjectValue, StartDate, EndDate, Status } = req.body;
    
    // Validate required fields
    if (!ProjectName || !CustomerID) {
      return res.status(400).json({ 
        error: 'ProjectName and CustomerID are required fields' 
      });
    }

    const dateErrors = validateDateSequence(req.body);
    if (dateErrors.length > 0) {
      return res.status(400).json({ errors: dateErrors });
    }

    try {
      // Check if customer exists
      const [customerCheck] = await pool.query(
        'SELECT CustomerID FROM Customer WHERE CustomerID = ?',
        [CustomerID]
      );
      
      if (customerCheck.length === 0) {
        return res.status(400).json({ error: 'Customer not found' });
      }

      const [result] = await pool.query(
        'UPDATE Project SET ProjectName = ?, CustomerID = ?, ProjectCode = ?, ProjectDescription = ?, LocationID = ?, ProjectValue = ?, StartDate = ?, EndDate = ?, Status = ? WHERE ProjectID = ?',
        [ProjectName, CustomerID, ProjectCode, ProjectDescription || '', LocationID || null, ProjectValue || null, StartDate || null, EndDate || null, Status || 'Active', id]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Fetch the updated project with customer information
      const [updatedProject] = await pool.query(`
        SELECT
          p.*,
          c.Name as CustomerName,
          c.CustomerCode
        FROM Project p
        LEFT JOIN Customer c ON p.CustomerID = c.CustomerID
        WHERE p.ProjectID = ?
      `, [id]);
      
      res.json(updatedProject[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        res.status(400).json({ error: 'Project code already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete a project
  // This route deletes a project record identified by the provided ID.
  // It responds with a success message if the project is deleted, or a 404 error if the project is not found.
  router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
      const [result] = await pool.query('DELETE FROM Project WHERE ProjectID = ?', [id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Error deleting project:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};