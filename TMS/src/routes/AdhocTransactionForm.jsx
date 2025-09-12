import React, { useState, useEffect } from 'react';
import { adhocTransactionAPI, customerAPI, projectAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import SearchableDropdown from '../components/SearchableDropdown';

const AdhocTransactionForm = () => {
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Master data (minimal for Adhoc/Replacement)
  const [masterData, setMasterData] = useState({
    TypeOfTransaction: 'Adhoc',
    Customer: '',
    Project: ''
  });

  // Adhoc/Replacement transaction data
  const [transactionData, setTransactionData] = useState({
    Date: getCurrentDate(),
    TripNo: '',
    // Manual vehicle details
    VehicleNumber: '',
    VehicleType: '',
    // Manual vendor details
    VendorName: '',
    VendorNumber: '',
    // Manual driver details
    DriverName: '',
    DriverNumber: '',
    DriverAadharNumber: '',
    DriverLicenceNumber: '',
    // Time fields
    ArrivalTimeAtHub: '',
    InTimeByCust: '',
    OutTimeFromHub: '',
    ReturnReportingTime: '',
    OutTimeFrom: '',
    // KM fields
    OpeningKM: '',
    ClosingKM: '',
    // Shipment fields
    TotalShipmentsForDeliveries: '',
    TotalShipmentDeliveriesAttempted: '',
    TotalShipmentDeliveriesDone: '',
    // Freight fields
    VFreightFix: '',
    FixKm: '',
    VFreightVariable: '',
    // Expense fields
    TollExpenses: '',
    ParkingCharges: '',
    LoadingCharges: '',
    UnloadingCharges: '',
    OtherCharges: '',
    OtherChargesRemarks: '',
    // Calculated fields
    TotalDutyHours: '',
    TotalFreight: '',
    // Payment fields
    AdvanceRequestNo: '',
    AdvanceToPaid: '',
    AdvanceApprovedAmount: '',
    AdvanceApprovedBy: '',
    AdvancePaidAmount: '',
    AdvancePaidMode: '',
    AdvancePaidDate: '',
    AdvancePaidBy: '',
    EmployeeDetailsAdvance: '',
    BalanceToBePaid: '',
    BalancePaidAmount: '',
    Variance: '',
    BalancePaidDate: '',
    BalancePaidBy: '',
    EmployeeDetailsBalance: '',
    // Final fields
    Revenue: '',
    Margin: '',
    MarginPercentage: '',
    TripClose: false,
    Remarks: ''
  });

  // State for dropdowns
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [errors, setErrors] = useState({});

  // IDs for relationships
  const [ids, setIds] = useState({
    CustomerID: null,
    ProjectID: null
  });

  // Load initial data
  useEffect(() => {
    fetchCustomers();
    fetchTransactions();
  }, []);

  // Auto-calculate Total KM
  useEffect(() => {
    if (transactionData.OpeningKM && transactionData.ClosingKM) {
      const totalKM = Number(transactionData.ClosingKM) - Number(transactionData.OpeningKM);
      if (totalKM >= 0) {
        // Auto-calculate can be added here if needed
      }
    }
  }, [transactionData.OpeningKM, transactionData.ClosingKM]);

  // Auto-calculate Total Duty Hours
  useEffect(() => {
    if (transactionData.ArrivalTimeAtHub && transactionData.OutTimeFrom) {
      try {
        const arrivalTime = new Date(`2000-01-01T${transactionData.ArrivalTimeAtHub}:00`);
        const outTime = new Date(`2000-01-01T${transactionData.OutTimeFrom}:00`);

        if (!isNaN(arrivalTime.getTime()) && !isNaN(outTime.getTime())) {
          let diffMs = outTime - arrivalTime;
          if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000; // Handle next day

          const diffHours = diffMs / (1000 * 60 * 60);
          setTransactionData(prev => ({
            ...prev,
            TotalDutyHours: diffHours.toFixed(2)
          }));
        }
      } catch (error) {
        console.error('Error calculating duty hours:', error);
      }
    }
  }, [transactionData.ArrivalTimeAtHub, transactionData.OutTimeFrom]);

  // Auto-calculate Total Freight
  useEffect(() => {
    const vFreightFix = parseFloat(transactionData.VFreightFix) || 0;
    const vFreightVariable = parseFloat(transactionData.VFreightVariable) || 0;
    const totalFreight = vFreightFix + vFreightVariable;
    
    if (totalFreight > 0) {
      setTransactionData(prev => ({
        ...prev,
        TotalFreight: totalFreight.toString()
      }));
    }
  }, [transactionData.VFreightFix, transactionData.VFreightVariable]);

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      const customerData = response.data.data || response.data.value || response.data || [];
      setCustomers(customerData.map(customer => ({
        value: customer.CustomerID,
        label: customer.CustomerName,
        ...customer
      })));
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch projects based on customer
  const fetchProjects = async (customerId) => {
    try {
      const response = await projectAPI.getAll();
      const projectData = response.data.data || response.data.value || response.data || [];
      const filteredProjects = projectData.filter(project => project.CustomerID === customerId);
      setProjects(filteredProjects.map(project => ({
        value: project.ProjectID,
        label: project.ProjectName,
        ...project
      })));
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await adhocTransactionAPI.getAll();
      const transactionData = response.data.data || response.data.value || response.data || [];
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching adhoc transactions:', error);
      apiHelpers.showError(error, 'Failed to fetch adhoc transactions');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle master data changes
  const handleMasterDataChange = (name, value) => {
    setMasterData(prev => ({ ...prev, [name]: value }));

    // Handle customer change
    if (name === 'Customer') {
      const selectedCustomer = customers.find(c => c.label === value);
      if (selectedCustomer) {
        setIds(prev => ({ ...prev, CustomerID: selectedCustomer.CustomerID }));
        fetchProjects(selectedCustomer.CustomerID);
      }
    }

    // Handle project change
    if (name === 'Project') {
      const selectedProject = projects.find(p => p.label === value);
      if (selectedProject) {
        setIds(prev => ({ ...prev, ProjectID: selectedProject.ProjectID }));
      }
    }
  };

  // Handle transaction data changes
  const handleTransactionDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTransactionData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle driver number validation
  const handleDriverNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setTransactionData(prev => ({ ...prev, DriverNumber: value }));
    }
  };

  // Handle vendor number validation
  const handleVendorNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setTransactionData(prev => ({ ...prev, VendorNumber: value }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Adhoc/Replacement transaction validations
    if (!masterData.Customer) newErrors.Customer = 'Customer is required (for database reference)';
    if (!transactionData.TripNo) newErrors.TripNo = 'Trip No is required';
    if (!transactionData.VehicleNumber) newErrors.VehicleNumber = 'Vehicle Number is required';
    if (!transactionData.VendorName) newErrors.VendorName = 'Vendor Name is required';
    if (!transactionData.DriverName) newErrors.DriverName = 'Driver Name is required';
    if (!transactionData.DriverNumber) newErrors.DriverNumber = 'Driver Number is required';

    // Common validations
    if (!transactionData.Date) newErrors.Date = 'Date is required';
    if (!transactionData.OpeningKM) newErrors.OpeningKM = 'Opening KM is required';
    if (!transactionData.ClosingKM) newErrors.ClosingKM = 'Closing KM is required';

    // Validate driver number format
    if (transactionData.DriverNumber && transactionData.DriverNumber.length !== 10) {
      newErrors.DriverNumber = 'Driver Number must be exactly 10 digits';
    }

    // Validate vendor number format if provided
    if (transactionData.VendorNumber && transactionData.VendorNumber.length !== 10) {
      newErrors.VendorNumber = 'Vendor Number must be exactly 10 digits';
    }

    // Validate Aadhar number format if provided
    if (transactionData.DriverAadharNumber && transactionData.DriverAadharNumber.length !== 12) {
      newErrors.DriverAadharNumber = 'Aadhar Number must be exactly 12 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Build Adhoc/Replacement transaction payload
      const payload = {
        TripType: masterData.TypeOfTransaction,
        TransactionDate: transactionData.Date,
        Shift: null,
        // Adhoc/Replacement don't use master data IDs - set to null
        VehicleID: null,
        DriverID: null,
        VendorID: null,
        CustomerID: ids.CustomerID || null,
        ProjectID: ids.ProjectID || null,
        LocationID: null,
        ReplacementDriverID: null,
        // Manual transaction details
        TripNo: transactionData.TripNo,
        VehicleNumber: transactionData.VehicleNumber,
        VendorName: transactionData.VendorName,
        VendorNumber: transactionData.VendorNumber || null,
        DriverName: transactionData.DriverName,
        DriverNumber: transactionData.DriverNumber,
        DriverAadharNumber: transactionData.DriverAadharNumber || null,
        DriverAadharDoc: null,
        DriverLicenceNumber: transactionData.DriverLicenceNumber || null,
        DriverLicenceDoc: null,
        // Time fields
        ArrivalTimeAtHub: transactionData.ArrivalTimeAtHub || null,
        InTimeByCust: transactionData.InTimeByCust || null,
        OutTimeFromHub: transactionData.OutTimeFromHub || null,
        ReturnReportingTime: transactionData.ReturnReportingTime || null,
        // KM fields
        OpeningKM: transactionData.OpeningKM ? Number(transactionData.OpeningKM) : null,
        ClosingKM: transactionData.ClosingKM ? Number(transactionData.ClosingKM) : null,
        // Delivery fields (use different names for Adhoc)
        TotalDeliveries: null, // Fixed field - not used in Adhoc
        TotalDeliveriesAttempted: null, // Fixed field - not used in Adhoc
        TotalDeliveriesDone: null, // Fixed field - not used in Adhoc
        // Adhoc-specific shipment fields
        TotalShipmentsForDeliveries: transactionData.TotalShipmentsForDeliveries ? Number(transactionData.TotalShipmentsForDeliveries) : null,
        TotalShipmentDeliveriesAttempted: transactionData.TotalShipmentDeliveriesAttempted ? Number(transactionData.TotalShipmentDeliveriesAttempted) : null,
        TotalShipmentDeliveriesDone: transactionData.TotalShipmentDeliveriesDone ? Number(transactionData.TotalShipmentDeliveriesDone) : null,
        // Freight fields
        VFreightFix: transactionData.VFreightFix ? Number(transactionData.VFreightFix) : null,
        FixKm: transactionData.FixKm ? Number(transactionData.FixKm) : null,
        VFreightVariable: transactionData.VFreightVariable ? Number(transactionData.VFreightVariable) : null,
        // Expense fields
        TollExpenses: transactionData.TollExpenses ? Number(transactionData.TollExpenses) : null,
        TollExpensesDoc: null,
        ParkingCharges: transactionData.ParkingCharges ? Number(transactionData.ParkingCharges) : null,
        ParkingChargesDoc: null,
        LoadingCharges: transactionData.LoadingCharges ? Number(transactionData.LoadingCharges) : null,
        UnloadingCharges: transactionData.UnloadingCharges ? Number(transactionData.UnloadingCharges) : null,
        OtherCharges: transactionData.OtherCharges ? Number(transactionData.OtherCharges) : null,
        OtherChargesRemarks: transactionData.OtherChargesRemarks || null,
        OutTimeFrom: transactionData.OutTimeFrom || null,
        // Calculated fields
        TotalDutyHours: transactionData.TotalDutyHours ? Number(transactionData.TotalDutyHours) : null,
        TotalFreight: transactionData.TotalFreight ? Number(transactionData.TotalFreight) : null,
        Remarks: transactionData.Remarks || null,
        Status: 'Pending',
        // Payment fields
        AdvanceRequestNo: transactionData.AdvanceRequestNo || null,
        AdvanceToPaid: transactionData.AdvanceToPaid ? Number(transactionData.AdvanceToPaid) : null,
        AdvanceApprovedAmount: transactionData.AdvanceApprovedAmount ? Number(transactionData.AdvanceApprovedAmount) : null,
        AdvanceApprovedBy: transactionData.AdvanceApprovedBy || null,
        AdvancePaidAmount: transactionData.AdvancePaidAmount ? Number(transactionData.AdvancePaidAmount) : null,
        AdvancePaidMode: transactionData.AdvancePaidMode || null,
        AdvancePaidDate: transactionData.AdvancePaidDate || null,
        AdvancePaidBy: transactionData.AdvancePaidBy || null,
        EmployeeDetailsAdvance: transactionData.EmployeeDetailsAdvance || null,
        BalancePaidAmount: transactionData.BalancePaidAmount ? Number(transactionData.BalancePaidAmount) : null,
        BalancePaidDate: transactionData.BalancePaidDate || null,
        BalancePaidBy: transactionData.BalancePaidBy || null,
        EmployeeDetailsBalance: transactionData.EmployeeDetailsBalance || null,
        // Final fields
        Revenue: transactionData.Revenue ? Number(transactionData.Revenue) : null,
        Margin: transactionData.Margin ? Number(transactionData.Margin) : null,
        MarginPercentage: transactionData.MarginPercentage ? Number(transactionData.MarginPercentage) : null,
        // Adhoc-specific fields (not used in Fixed)
        ReplacementDriverName: null, // Not used in Adhoc
        ReplacementDriverNo: null, // Not used in Adhoc
        TripClose: transactionData.TripClose || false
      };

      if (editingTransaction) {
        await adhocTransactionAPI.update(editingTransaction.TransactionID, payload);
        apiHelpers.showSuccess(`${masterData.TypeOfTransaction} transaction updated successfully`);
      } else {
        await adhocTransactionAPI.create(payload);
        apiHelpers.showSuccess(`${masterData.TypeOfTransaction} transaction created successfully`);
      }

      // Reset form
      resetForm();
      fetchTransactions();
    } catch (error) {
      apiHelpers.showError(error, `Failed to save ${masterData.TypeOfTransaction} transaction`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMasterData({
      TypeOfTransaction: 'Adhoc',
      Customer: '',
      Project: ''
    });

    setTransactionData({
      Date: getCurrentDate(),
      TripNo: '',
      VehicleNumber: '',
      VehicleType: '',
      VendorName: '',
      VendorNumber: '',
      DriverName: '',
      DriverNumber: '',
      DriverAadharNumber: '',
      DriverLicenceNumber: '',
      ArrivalTimeAtHub: '',
      InTimeByCust: '',
      OutTimeFromHub: '',
      ReturnReportingTime: '',
      OutTimeFrom: '',
      OpeningKM: '',
      ClosingKM: '',
      TotalShipmentsForDeliveries: '',
      TotalShipmentDeliveriesAttempted: '',
      TotalShipmentDeliveriesDone: '',
      VFreightFix: '',
      FixKm: '',
      VFreightVariable: '',
      TollExpenses: '',
      ParkingCharges: '',
      LoadingCharges: '',
      UnloadingCharges: '',
      OtherCharges: '',
      OtherChargesRemarks: '',
      TotalDutyHours: '',
      TotalFreight: '',
      AdvanceRequestNo: '',
      AdvanceToPaid: '',
      AdvanceApprovedAmount: '',
      AdvanceApprovedBy: '',
      AdvancePaidAmount: '',
      AdvancePaidMode: '',
      AdvancePaidDate: '',
      AdvancePaidBy: '',
      EmployeeDetailsAdvance: '',
      BalanceToBePaid: '',
      BalancePaidAmount: '',
      Variance: '',
      BalancePaidDate: '',
      BalancePaidBy: '',
      EmployeeDetailsBalance: '',
      Revenue: '',
      Margin: '',
      MarginPercentage: '',
      TripClose: false,
      Remarks: ''
    });

    setEditingTransaction(null);
    setErrors({});
    setIds({
      CustomerID: null,
      ProjectID: null
    });
  };

  return (
    <div className="adhoc-transaction-form">
      <h2>Adhoc/Replacement Vehicle Transaction Form</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Transaction Type Selection */}
        <div className="form-section">
          <div className="form-group">
            <label>Transaction Type *</label>
            <select
              name="TypeOfTransaction"
              value={masterData.TypeOfTransaction}
              onChange={(e) => handleMasterDataChange('TypeOfTransaction', e.target.value)}
              className="form-control"
            >
              <option value="Adhoc">Adhoc</option>
              <option value="Replacement">Replacement</option>
            </select>
          </div>
        </div>

        {/* Master Data Section */}
        <div className="form-section master-section">
          <h3>Reference Data</h3>
          
          <div className="form-group">
            <label>Master Customer Name *</label>
            <SearchableDropdown
              name="Customer"
              value={masterData.Customer}
              onChange={handleMasterDataChange}
              options={customers}
              placeholder="Select Customer"
              className={errors.Customer ? 'error' : ''}
            />
            {errors.Customer && <span className="error-message">{errors.Customer}</span>}
            <small style={{ color: '#6c757d', fontSize: '11px', marginTop: '2px', display: 'block' }}>
              Required for database reference (manual details entered below)
            </small>
          </div>

          <div className="form-group">
            <label>Project</label>
            <SearchableDropdown
              name="Project"
              value={masterData.Project}
              onChange={handleMasterDataChange}
              options={projects}
              placeholder="Select Project (Optional)"
            />
          </div>
        </div>

        {/* Manual Entry Section */}
        <div className="form-section transaction-section">
          <h3>Manual Transaction Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Trip No *</label>
              <input
                type="text"
                name="TripNo"
                value={transactionData.TripNo}
                onChange={handleTransactionDataChange}
                className={errors.TripNo ? 'error' : ''}
                placeholder="Enter trip number"
              />
              {errors.TripNo && <span className="error-message">{errors.TripNo}</span>}
            </div>

            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                name="Date"
                value={transactionData.Date}
                onChange={handleTransactionDataChange}
                className={errors.Date ? 'error' : ''}
              />
              {errors.Date && <span className="error-message">{errors.Date}</span>}
            </div>
          </div>

          {/* Vehicle Details */}
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Number *</label>
              <input
                type="text"
                name="VehicleNumber"
                value={transactionData.VehicleNumber}
                onChange={handleTransactionDataChange}
                className={errors.VehicleNumber ? 'error' : ''}
                placeholder="Enter vehicle registration number"
              />
              {errors.VehicleNumber && <span className="error-message">{errors.VehicleNumber}</span>}
            </div>

            <div className="form-group">
              <label>Vehicle Type</label>
              <input
                type="text"
                name="VehicleType"
                value={transactionData.VehicleType}
                onChange={handleTransactionDataChange}
                placeholder="Enter vehicle type"
              />
            </div>
          </div>

          {/* Vendor Details */}
          <div className="form-row">
            <div className="form-group">
              <label>Vendor Name *</label>
              <input
                type="text"
                name="VendorName"
                value={transactionData.VendorName}
                onChange={handleTransactionDataChange}
                className={errors.VendorName ? 'error' : ''}
                placeholder="Enter vendor name"
              />
              {errors.VendorName && <span className="error-message">{errors.VendorName}</span>}
            </div>

            <div className="form-group">
              <label>Vendor Number</label>
              <input
                type="text"
                name="VendorNumber"
                value={transactionData.VendorNumber}
                onChange={handleVendorNumberChange}
                className={errors.VendorNumber ? 'error' : ''}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
              />
              {errors.VendorNumber && <span className="error-message">{errors.VendorNumber}</span>}
            </div>
          </div>

          {/* Driver Details */}
          <div className="form-row">
            <div className="form-group">
              <label>Driver Name *</label>
              <input
                type="text"
                name="DriverName"
                value={transactionData.DriverName}
                onChange={handleTransactionDataChange}
                className={errors.DriverName ? 'error' : ''}
                placeholder="Enter driver name"
              />
              {errors.DriverName && <span className="error-message">{errors.DriverName}</span>}
            </div>

            <div className="form-group">
              <label>Driver Number *</label>
              <input
                type="text"
                name="DriverNumber"
                value={transactionData.DriverNumber}
                onChange={handleDriverNumberChange}
                className={errors.DriverNumber ? 'error' : ''}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
              />
              {errors.DriverNumber && <span className="error-message">{errors.DriverNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Driver Aadhar Number</label>
              <input
                type="text"
                name="DriverAadharNumber"
                value={transactionData.DriverAadharNumber}
                onChange={handleTransactionDataChange}
                className={errors.DriverAadharNumber ? 'error' : ''}
                placeholder="Enter 12-digit Aadhar number"
                maxLength="12"
              />
              {errors.DriverAadharNumber && <span className="error-message">{errors.DriverAadharNumber}</span>}
            </div>

            <div className="form-group">
              <label>Driver Licence Number</label>
              <input
                type="text"
                name="DriverLicenceNumber"
                value={transactionData.DriverLicenceNumber}
                onChange={handleTransactionDataChange}
                placeholder="Enter licence number"
              />
            </div>
          </div>

          {/* Time Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Arrival Time at Hub</label>
              <input
                type="time"
                name="ArrivalTimeAtHub"
                value={transactionData.ArrivalTimeAtHub}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>In Time by Customer</label>
              <input
                type="time"
                name="InTimeByCust"
                value={transactionData.InTimeByCust}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Out Time from Hub</label>
              <input
                type="time"
                name="OutTimeFromHub"
                value={transactionData.OutTimeFromHub}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>Return Reporting Time</label>
              <input
                type="time"
                name="ReturnReportingTime"
                value={transactionData.ReturnReportingTime}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Out Time From</label>
              <input
                type="time"
                name="OutTimeFrom"
                value={transactionData.OutTimeFrom}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>Total Duty Hours (Auto-calculated)</label>
              <input
                type="number"
                name="TotalDutyHours"
                value={transactionData.TotalDutyHours}
                onChange={handleTransactionDataChange}
                step="0.01"
                readOnly
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </div>
          </div>

          {/* KM Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Opening KM *</label>
              <input
                type="number"
                name="OpeningKM"
                value={transactionData.OpeningKM}
                onChange={handleTransactionDataChange}
                className={errors.OpeningKM ? 'error' : ''}
                step="0.01"
              />
              {errors.OpeningKM && <span className="error-message">{errors.OpeningKM}</span>}
            </div>

            <div className="form-group">
              <label>Closing KM *</label>
              <input
                type="number"
                name="ClosingKM"
                value={transactionData.ClosingKM}
                onChange={handleTransactionDataChange}
                className={errors.ClosingKM ? 'error' : ''}
                step="0.01"
              />
              {errors.ClosingKM && <span className="error-message">{errors.ClosingKM}</span>}
            </div>
          </div>

          {/* Shipment Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Total Shipments for Deliveries</label>
              <input
                type="number"
                name="TotalShipmentsForDeliveries"
                value={transactionData.TotalShipmentsForDeliveries}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>Total Shipment Deliveries Attempted</label>
              <input
                type="number"
                name="TotalShipmentDeliveriesAttempted"
                value={transactionData.TotalShipmentDeliveriesAttempted}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Shipment Deliveries Done</label>
              <input
                type="number"
                name="TotalShipmentDeliveriesDone"
                value={transactionData.TotalShipmentDeliveriesDone}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

          {/* Freight Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>V Freight Fix</label>
              <input
                type="number"
                name="VFreightFix"
                value={transactionData.VFreightFix}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Fix KM</label>
              <input
                type="number"
                name="FixKm"
                value={transactionData.FixKm}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>V Freight Variable</label>
              <input
                type="number"
                name="VFreightVariable"
                value={transactionData.VFreightVariable}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Total Freight (Auto-calculated)</label>
              <input
                type="number"
                name="TotalFreight"
                value={transactionData.TotalFreight}
                onChange={handleTransactionDataChange}
                step="0.01"
                readOnly
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </div>
          </div>

          {/* Expense Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Toll Expenses</label>
              <input
                type="number"
                name="TollExpenses"
                value={transactionData.TollExpenses}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Parking Charges</label>
              <input
                type="number"
                name="ParkingCharges"
                value={transactionData.ParkingCharges}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Loading Charges</label>
              <input
                type="number"
                name="LoadingCharges"
                value={transactionData.LoadingCharges}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Unloading Charges</label>
              <input
                type="number"
                name="UnloadingCharges"
                value={transactionData.UnloadingCharges}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Other Charges</label>
              <input
                type="number"
                name="OtherCharges"
                value={transactionData.OtherCharges}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>Other Charges Remarks</label>
              <input
                type="text"
                name="OtherChargesRemarks"
                value={transactionData.OtherChargesRemarks}
                onChange={handleTransactionDataChange}
                placeholder="Enter remarks for other charges"
              />
            </div>
          </div>

          {/* Trip Close */}
          <div className="form-row">
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="TripClose"
                  checked={transactionData.TripClose}
                  onChange={handleTransactionDataChange}
                  style={{ marginRight: '8px' }}
                />
                Trip Close
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="form-group">
            <label>Remarks</label>
            <textarea
              name="Remarks"
              value={transactionData.Remarks}
              onChange={handleTransactionDataChange}
              rows="3"
              placeholder="Enter any remarks"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : editingTransaction ? 'Update Transaction' : 'Create Transaction'}
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="btn btn-secondary"
            style={{ marginLeft: '10px' }}
          >
            Reset Form
          </button>
        </div>
      </form>

      {/* Transactions List */}
      <div className="transactions-list" style={{ marginTop: '40px' }}>
        <h3>Adhoc/Replacement Transactions</h3>
        <DataTable
          data={transactions}
          columns={[
            { key: 'SerialNumber', label: 'S.No.' },
            { key: 'TripType', label: 'Type' },
            { key: 'TripNo', label: 'Trip No' },
            { key: 'TransactionDate', label: 'Date' },
            { key: 'VehicleNumber', label: 'Vehicle' },
            { key: 'VendorName', label: 'Vendor' },
            { key: 'DriverName', label: 'Driver' },
            { key: 'OpeningKM', label: 'Opening KM' },
            { key: 'ClosingKM', label: 'Closing KM' },
            { key: 'Status', label: 'Status' }
          ]}
          keyField="TransactionID"
          isLoading={isLoading}
          onEdit={(row) => console.log('Edit:', row)}
          onDelete={(row) => console.log('Delete:', row)}
        />
      </div>
    </div>
  );
};

export default AdhocTransactionForm;
