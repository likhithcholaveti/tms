import React, { useState, useEffect } from 'react';
import { fixedTransactionAPI, customerAPI, vehicleAPI, driverAPI, projectAPI, vendorAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import Dropdown from '../components/Dropdown';
import SearchableDropdown from '../components/SearchableDropdown';

const FixedTransactionForm = () => {
  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Master data (Green Section)
  const [masterData, setMasterData] = useState({
    TypeOfTransaction: 'Fixed',
    Customer: '',
    Project: '',
    VehicleNo: [], // Array for multiple vehicle selection
    VendorName: ''
  });

  // Fixed transaction data
  const [transactionData, setTransactionData] = useState({
    DriverID: '',
    DriverMobileNo: '',
    ReplacementDriverID: '',
    ReplacementDriverName: '',
    ReplacementDriverNo: '',
    Date: getCurrentDate(),
    ArrivalTimeAtHub: '',
    InTimeByCust: '',
    OutTimeFromHub: '',
    ReturnReportingTime: '',
    OpeningKM: '',
    ClosingKM: '',
    TotalDeliveries: '',
    TotalDeliveriesAttempted: '',
    TotalDeliveriesDone: '',
    TotalDutyHours: '',
    Remarks: '',

    // Freight and pricing fields
    VFreightFix: '',
    FixKm: '',
    VFreightVariable: '',
    TotalFreight: '',

    // Expense details
    TollExpenses: '',
    ParkingCharges: '',
    LoadingCharges: '',
    UnloadingCharges: '',
    OtherCharges: '',
    OtherChargesRemarks: '',
    HandlingCharges: '',

    // Additional fields for form compatibility
    VehicleType: '',
    VehicleNumber: '',
    VendorName: '',
    VendorNumber: '',
    DriverName: '',
    DriverNumber: '',
    DriverAadharNumber: '',
    DriverLicenceNumber: '',
    CompanyName: '',
    GSTNo: '',
    CustomerSite: '',
    Location: '',
    OutTimeFrom: '',
    TripNo: '',

    // Shipment fields
    TotalShipmentsForDeliveries: '',
    TotalShipmentDeliveriesAttempted: '',
    TotalShipmentDeliveriesDone: '',

    // Document fields
    DriverAadharDoc: null,
    DriverLicenceDoc: null,
    TollExpensesDoc: null,
    ParkingChargesDoc: null,

    // Advance payment fields
    AdvanceRequestNo: '',
    AdvanceToPaid: '',
    AdvanceApprovedAmount: '',
    AdvanceApprovedBy: '',
    AdvancePaidAmount: '',
    AdvancePaidMode: '',
    AdvancePaidDate: '',
    AdvancePaidBy: '',
    EmployeeDetailsAdvance: '',

    // Balance payment fields
    BalanceToBePaid: '',
    BalancePaidAmount: '',
    Variance: '',
    BalancePaidDate: '',
    BalancePaidBy: '',
    EmployeeDetailsBalance: '',

    // Financial calculations
    Revenue: '',
    Margin: '',
    MarginPercentage: ''
  });

  // State for dropdowns
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedVehicleTags, setSelectedVehicleTags] = useState([]);

  // Form state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [errors, setErrors] = useState({});

  // IDs for relationships
  const [ids, setIds] = useState({
    CustomerID: null,
    ProjectID: null,
    VehicleID: null,
    DriverID: null,
    VendorID: null
  });

  // Load initial data
  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
    fetchDrivers();
    fetchVendors();
    fetchTransactions();
  }, []);

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

  // Fetch vehicles
  const fetchVehicles = async () => {
    try {
      const response = await vehicleAPI.getAll();
      const vehicleData = response.data.data || response.data.value || response.data || [];
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  };

  // Fetch drivers
  const fetchDrivers = async () => {
    try {
      const response = await driverAPI.getAll();
      const driverData = response.data.data || response.data.value || response.data || [];
      setDrivers(driverData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    try {
      const response = await vendorAPI.getAll();
      const vendorData = response.data.data || response.data.value || response.data || [];
      setVendors(vendorData);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fixedTransactionAPI.getAll();
      const transactionData = response.data.data || response.data.value || response.data || [];
      setTransactions(transactionData);
    } catch (error) {
      console.error('Error fetching fixed transactions:', error);
      apiHelpers.showError(error, 'Failed to fetch fixed transactions');
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

    // Handle vendor change
    if (name === 'VendorName') {
      const selectedVendor = vendors.find(v => v.VendorName === value);
      if (selectedVendor) {
        setIds(prev => ({ ...prev, VendorID: selectedVendor.VendorID }));
      }
    }
  };

  // Handle transaction data changes
  const handleTransactionDataChange = (e) => {
    const { name, value } = e.target;
    setTransactionData(prev => ({ ...prev, [name]: value }));

    // Handle driver change
    if (name === 'DriverID') {
      const selectedDriver = drivers.find(d => d.DriverID === parseInt(value));
      if (selectedDriver) {
        setTransactionData(prev => ({
          ...prev,
          DriverMobileNo: selectedDriver.DriverMobileNo || ''
        }));
        setIds(prev => ({ ...prev, DriverID: selectedDriver.DriverID }));
      }
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (e) => {
    const vehicleId = e.target.value;
    if (vehicleId && !masterData.VehicleNo.includes(vehicleId)) {
      const selectedVehicle = vehicles.find(v => v.VehicleID === parseInt(vehicleId));
      if (selectedVehicle) {
        setMasterData(prev => ({
          ...prev,
          VehicleNo: [...prev.VehicleNo, vehicleId]
        }));
        
        setSelectedVehicleTags(prev => [...prev, {
          id: vehicleId,
          registrationNo: selectedVehicle.VehicleRegistrationNo,
          type: selectedVehicle.VehicleType
        }]);
      }
    }
    e.target.value = '';
  };

  // Remove vehicle tag
  const removeVehicleTag = (vehicleId) => {
    setMasterData(prev => ({
      ...prev,
      VehicleNo: prev.VehicleNo.filter(id => id !== vehicleId)
    }));
    setSelectedVehicleTags(prev => prev.filter(tag => tag.id !== vehicleId));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Fixed transaction validations
    if (!masterData.Customer) newErrors.Customer = 'Customer is required';
    if (!masterData.Project) newErrors.Project = 'Project is required';
    if (!masterData.VehicleNo || masterData.VehicleNo.length === 0) newErrors.VehicleNo = 'At least one vehicle must be selected';
    if (!transactionData.DriverID) newErrors.DriverID = 'Driver is required';

    // Common validations
    if (!transactionData.Date) newErrors.Date = 'Date is required';
    if (!transactionData.OpeningKM) newErrors.OpeningKM = 'Opening KM is required';
    if (!transactionData.ClosingKM) newErrors.ClosingKM = 'Closing KM is required';

    // Validate replacement driver number format if provided
    if (transactionData.ReplacementDriverNo && transactionData.ReplacementDriverNo.length !== 10) {
      newErrors.ReplacementDriverNo = 'Replacement Driver Number must be exactly 10 digits';
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
      // Build Fixed transaction payload - EXACT order to match backend SQL
      const payload = {
        // Row 1: Basic transaction info (9 fields)
        TripType: 'Fixed',
        TransactionDate: transactionData.Date,
        Shift: null,
        VehicleID: masterData.VehicleNo.length > 0 ? masterData.VehicleNo[0] : null,
        DriverID: transactionData.DriverID || null,
        VendorID: ids.VendorID || null,
        CustomerID: ids.CustomerID,
        ProjectID: ids.ProjectID || null,
        LocationID: null,

        // Row 2: Time and driver info (5 fields)
        ReplacementDriverID: transactionData.ReplacementDriverID || null,
        ArrivalTimeAtHub: transactionData.ArrivalTimeAtHub || null,
        InTimeByCust: transactionData.InTimeByCust || null,
        OutTimeFromHub: transactionData.OutTimeFromHub || null,
        ReturnReportingTime: transactionData.ReturnReportingTime || null,

        // Row 3: KM and delivery info (6 fields)
        OpeningKM: transactionData.OpeningKM ? Number(transactionData.OpeningKM) : null,
        ClosingKM: transactionData.ClosingKM ? Number(transactionData.ClosingKM) : null,
        TotalDeliveries: transactionData.TotalDeliveries ? Number(transactionData.TotalDeliveries) : null,
        TotalDeliveriesAttempted: transactionData.TotalDeliveriesAttempted ? Number(transactionData.TotalDeliveriesAttempted) : null,
        TotalDeliveriesDone: transactionData.TotalDeliveriesDone ? Number(transactionData.TotalDeliveriesDone) : null,
        TotalDutyHours: transactionData.TotalDutyHours ? Number(transactionData.TotalDutyHours) : null,

        // Row 4: Status and trip info (3 fields)
        Remarks: transactionData.Remarks || null,
        Status: 'Pending',
        TripNo: null, // Not used in Fixed

        // Row 5: Manual vehicle/vendor/driver info (6 fields) - Not used in Fixed
        VehicleNumber: null,
        VendorName: null,
        VendorNumber: null,
        DriverName: null,
        DriverNumber: null,
        DriverAadharNumber: null,

        // Row 6: Driver docs and shipment info (6 fields) - Not used in Fixed
        DriverAadharDoc: null,
        DriverLicenceNumber: null,
        DriverLicenceDoc: null,
        TotalShipmentsForDeliveries: null,
        TotalShipmentDeliveriesAttempted: null,
        TotalShipmentDeliveriesDone: null,

        // Row 7: Freight info (4 fields) - Now used in Fixed
        VFreightFix: transactionData.VFreightFix ? Number(transactionData.VFreightFix) : null,
        FixKm: transactionData.FixKm ? Number(transactionData.FixKm) : null,
        VFreightVariable: transactionData.VFreightVariable ? Number(transactionData.VFreightVariable) : null,
        TollExpenses: transactionData.TollExpenses ? Number(transactionData.TollExpenses) : null,

        // Row 8: Expense docs and charges (5 fields) - Now used in Fixed
        TollExpensesDoc: transactionData.TollExpensesDoc || null,
        ParkingCharges: transactionData.ParkingCharges ? Number(transactionData.ParkingCharges) : null,
        ParkingChargesDoc: transactionData.ParkingChargesDoc || null,
        LoadingCharges: transactionData.LoadingCharges ? Number(transactionData.LoadingCharges) : null,
        UnloadingCharges: transactionData.UnloadingCharges ? Number(transactionData.UnloadingCharges) : null,

        // Row 9: Other charges and time (5 fields) - Now used in Fixed
        OtherCharges: transactionData.OtherCharges ? Number(transactionData.OtherCharges) : null,
        OtherChargesRemarks: transactionData.OtherChargesRemarks || null,
        OutTimeFrom: transactionData.OutTimeFrom || null,
        AdvanceRequestNo: transactionData.AdvanceRequestNo || null,
        AdvanceToPaid: transactionData.AdvanceToPaid ? Number(transactionData.AdvanceToPaid) : null,

        // Row 10: Advance info (4 fields) - Now used in Fixed
        AdvanceApprovedAmount: transactionData.AdvanceApprovedAmount ? Number(transactionData.AdvanceApprovedAmount) : null,
        AdvanceApprovedBy: transactionData.AdvanceApprovedBy || null,
        AdvancePaidAmount: transactionData.AdvancePaidAmount ? Number(transactionData.AdvancePaidAmount) : null,
        AdvancePaidMode: transactionData.AdvancePaidMode || null,

        // Row 11: Payment details (5 fields) - Now used in Fixed
        AdvancePaidDate: transactionData.AdvancePaidDate || null,
        AdvancePaidBy: transactionData.AdvancePaidBy || null,
        EmployeeDetailsAdvance: transactionData.EmployeeDetailsAdvance || null,
        BalancePaidAmount: transactionData.BalancePaidAmount ? Number(transactionData.BalancePaidAmount) : null,
        BalancePaidDate: transactionData.BalancePaidDate || null,

        // Row 12: Final fields to complete 59 fields
        BalancePaidBy: transactionData.BalancePaidBy || null,
        EmployeeDetailsBalance: transactionData.EmployeeDetailsBalance || null,
        Revenue: transactionData.Revenue ? Number(transactionData.Revenue) : null,
        Margin: transactionData.Margin ? Number(transactionData.Margin) : null,
        MarginPercentage: transactionData.MarginPercentage ? Number(transactionData.MarginPercentage) : null,
        ReplacementDriverName: transactionData.ReplacementDriverName || null,
        ReplacementDriverNo: transactionData.ReplacementDriverNo || null,
        TripClose: false,
        // Additional fields that might be expected
        Variance: transactionData.Variance ? Number(transactionData.Variance) : null,
        BalanceToBePaid: transactionData.BalanceToBePaid ? Number(transactionData.BalanceToBePaid) : null,

        // Total: 61 fields - adjust based on backend requirements
      };

      console.log('📦 Fixed Transaction Payload:', payload);
      console.log('📊 Payload field count:', Object.keys(payload).length);
      console.log('📋 Payload fields:', Object.keys(payload));

      if (editingTransaction) {
        await fixedTransactionAPI.update(editingTransaction.TransactionID, payload);
        apiHelpers.showSuccess('Fixed transaction updated successfully');
      } else {
        try {
          const response = await fixedTransactionAPI.create(payload);
          console.log('✅ Backend response:', response);
          apiHelpers.showSuccess('Fixed transaction created successfully');
        } catch (error) {
          console.error('❌ Backend error details:', error);
          console.error('❌ Error response:', error.response?.data);
          console.error('❌ Error status:', error.response?.status);
          throw error; // Re-throw to trigger the outer catch
        }
      }

      // Reset form
      resetForm();
      fetchTransactions();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to save fixed transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setMasterData({
      TypeOfTransaction: 'Fixed',
      Customer: '',
      Project: '',
      VehicleNo: [],
      VendorName: ''
    });

    setTransactionData({
      DriverID: '',
      DriverMobileNo: '',
      ReplacementDriverID: '',
      ReplacementDriverName: '',
      ReplacementDriverNo: '',
      Date: getCurrentDate(),
      ArrivalTimeAtHub: '',
      InTimeByCust: '',
      OutTimeFromHub: '',
      ReturnReportingTime: '',
      OpeningKM: '',
      ClosingKM: '',
      TotalDeliveries: '',
      TotalDeliveriesAttempted: '',
      TotalDeliveriesDone: '',
      TotalDutyHours: '',
      Remarks: '',

      // Freight and pricing fields
      VFreightFix: '',
      FixKm: '',
      VFreightVariable: '',
      TotalFreight: '',

      // Expense details
      TollExpenses: '',
      ParkingCharges: '',
      LoadingCharges: '',
      UnloadingCharges: '',
      OtherCharges: '',
      OtherChargesRemarks: '',
      HandlingCharges: '',

      // Additional fields for form compatibility
      VehicleType: '',
      VehicleNumber: '',
      VendorName: '',
      VendorNumber: '',
      DriverName: '',
      DriverNumber: '',
      DriverAadharNumber: '',
      DriverLicenceNumber: '',
      CompanyName: '',
      GSTNo: '',
      CustomerSite: '',
      Location: '',
      OutTimeFrom: '',
      TripNo: '',

      // Shipment fields
      TotalShipmentsForDeliveries: '',
      TotalShipmentDeliveriesAttempted: '',
      TotalShipmentDeliveriesDone: '',

      // Document fields
      DriverAadharDoc: null,
      DriverLicenceDoc: null,
      TollExpensesDoc: null,
      ParkingChargesDoc: null,

      // Advance payment fields
      AdvanceRequestNo: '',
      AdvanceToPaid: '',
      AdvanceApprovedAmount: '',
      AdvanceApprovedBy: '',
      AdvancePaidAmount: '',
      AdvancePaidMode: '',
      AdvancePaidDate: '',
      AdvancePaidBy: '',
      EmployeeDetailsAdvance: '',

      // Balance payment fields
      BalanceToBePaid: '',
      BalancePaidAmount: '',
      Variance: '',
      BalancePaidDate: '',
      BalancePaidBy: '',
      EmployeeDetailsBalance: '',

      // Financial calculations
      Revenue: '',
      Margin: '',
      MarginPercentage: ''
    });

    setSelectedVehicleTags([]);
    setEditingTransaction(null);
    setErrors({});
    setIds({
      CustomerID: null,
      ProjectID: null,
      VehicleID: null,
      DriverID: null,
      VendorID: null
    });
  };

  // Handle edit transaction
  const handleEdit = async (transaction) => {
    try {
      console.log('🔧 Editing transaction:', transaction);

      // Set editing state
      setEditingTransaction(transaction);

      // Populate master data
      setMasterData({
        TypeOfTransaction: 'Fixed',
        Customer: transaction.CustomerName || '',
        Project: transaction.ProjectName || '',
        VehicleNo: transaction.VehicleIDs ? JSON.parse(transaction.VehicleIDs) : [],
        VendorName: transaction.VendorName || ''
      });

      // Populate transaction data with all fields
      setTransactionData({
        DriverID: transaction.DriverID || '',
        DriverMobileNo: transaction.DriverMobileNo || '',
        ReplacementDriverID: transaction.ReplacementDriverID || '',
        ReplacementDriverName: transaction.ReplacementDriverName || '',
        ReplacementDriverNo: transaction.ReplacementDriverNo || '',
        Date: transaction.TransactionDate || getCurrentDate(),
        ArrivalTimeAtHub: transaction.ArrivalTimeAtHub || '',
        InTimeByCust: transaction.InTimeByCust || '',
        OutTimeFromHub: transaction.OutTimeFromHub || '',
        ReturnReportingTime: transaction.ReturnReportingTime || '',
        OpeningKM: transaction.OpeningKM || '',
        ClosingKM: transaction.ClosingKM || '',
        TotalDeliveries: transaction.TotalDeliveries || '',
        TotalDeliveriesAttempted: transaction.TotalDeliveriesAttempted || '',
        TotalDeliveriesDone: transaction.TotalDeliveriesDone || '',
        TotalDutyHours: transaction.TotalDutyHours || '',
        Remarks: transaction.Remarks || '',

        // Freight and pricing fields
        VFreightFix: transaction.VFreightFix || '',
        FixKm: transaction.FixKm || '',
        VFreightVariable: transaction.VFreightVariable || '',
        TotalFreight: transaction.TotalFreight || '',

        // Expense details
        TollExpenses: transaction.TollExpenses || '',
        ParkingCharges: transaction.ParkingCharges || '',
        LoadingCharges: transaction.LoadingCharges || '',
        UnloadingCharges: transaction.UnloadingCharges || '',
        OtherCharges: transaction.OtherCharges || '',
        OtherChargesRemarks: transaction.OtherChargesRemarks || '',
        HandlingCharges: transaction.HandlingCharges || '',

        // Additional fields for form compatibility
        VehicleType: transaction.VehicleType || '',
        VehicleNumber: transaction.VehicleNumber || '',
        VendorName: transaction.VendorName || '',
        VendorNumber: transaction.VendorNumber || '',
        DriverName: transaction.DriverName || '',
        DriverNumber: transaction.DriverNumber || '',
        DriverAadharNumber: transaction.DriverAadharNumber || '',
        DriverLicenceNumber: transaction.DriverLicenceNumber || '',
        CompanyName: transaction.CompanyName || '',
        GSTNo: transaction.GSTNo || '',
        CustomerSite: transaction.CustomerSite || '',
        Location: transaction.Location || '',
        OutTimeFrom: transaction.OutTimeFrom || '',
        TripNo: transaction.TripNo || '',

        // Shipment fields
        TotalShipmentsForDeliveries: transaction.TotalShipmentsForDeliveries || '',
        TotalShipmentDeliveriesAttempted: transaction.TotalShipmentDeliveriesAttempted || '',
        TotalShipmentDeliveriesDone: transaction.TotalShipmentDeliveriesDone || '',

        // Document fields
        DriverAadharDoc: transaction.DriverAadharDoc || null,
        DriverLicenceDoc: transaction.DriverLicenceDoc || null,
        TollExpensesDoc: transaction.TollExpensesDoc || null,
        ParkingChargesDoc: transaction.ParkingChargesDoc || null,

        // Advance payment fields
        AdvanceRequestNo: transaction.AdvanceRequestNo || '',
        AdvanceToPaid: transaction.AdvanceToPaid || '',
        AdvanceApprovedAmount: transaction.AdvanceApprovedAmount || '',
        AdvanceApprovedBy: transaction.AdvanceApprovedBy || '',
        AdvancePaidAmount: transaction.AdvancePaidAmount || '',
        AdvancePaidMode: transaction.AdvancePaidMode || '',
        AdvancePaidDate: transaction.AdvancePaidDate || '',
        AdvancePaidBy: transaction.AdvancePaidBy || '',
        EmployeeDetailsAdvance: transaction.EmployeeDetailsAdvance || '',

        // Balance payment fields
        BalanceToBePaid: transaction.BalanceToBePaid || '',
        BalancePaidAmount: transaction.BalancePaidAmount || '',
        Variance: transaction.Variance || '',
        BalancePaidDate: transaction.BalancePaidDate || '',
        BalancePaidBy: transaction.BalancePaidBy || '',
        EmployeeDetailsBalance: transaction.EmployeeDetailsBalance || '',

        // Financial calculations
        Revenue: transaction.Revenue || '',
        Margin: transaction.Margin || '',
        MarginPercentage: transaction.MarginPercentage || ''
      });

      // Set IDs for relationships
      setIds({
        CustomerID: transaction.CustomerID || null,
        ProjectID: transaction.ProjectID || null,
        VehicleID: transaction.VehicleID || null,
        DriverID: transaction.DriverID || null,
        VendorID: transaction.VendorID || null
      });

      // Set selected vehicle tags if VehicleIDs exist
      if (transaction.VehicleIDs) {
        try {
          const vehicleIds = JSON.parse(transaction.VehicleIDs);
          setSelectedVehicleTags(vehicleIds);
        } catch (e) {
          console.warn('Could not parse VehicleIDs:', transaction.VehicleIDs);
        }
      }

    } catch (error) {
      console.error('❌ Error editing transaction:', error);
      apiHelpers.showError('Failed to load transaction for editing');
    }
  };

  return (
    <div className="daily-vehicle-transaction-form">
      <h2>Fixed Vehicle Transaction Form</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Master Data Section */}
        <div className="form-section master-section">
          <h3>Master Data (Fixed Transaction)</h3>
          
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
          </div>

          <div className="form-group">
            <label>Project *</label>
            <SearchableDropdown
              name="Project"
              value={masterData.Project}
              onChange={handleMasterDataChange}
              options={projects}
              placeholder="Select Project"
              className={errors.Project ? 'error' : ''}
            />
            {errors.Project && <span className="error-message">{errors.Project}</span>}
          </div>

          <div className="form-group">
            <label>Vehicle No *</label>
            <select
              name="VehicleNo"
              onChange={handleVehicleSelect}
              className={`form-control ${errors.VehicleNo ? 'error' : ''}`}
              defaultValue=""
            >
              <option value="">Select Vehicle to Add</option>
              {vehicles
                .filter(vehicle => !masterData.VehicleNo.includes(vehicle.VehicleID.toString()))
                .map(vehicle => (
                  <option key={vehicle.VehicleID} value={vehicle.VehicleID}>
                    {vehicle.VehicleRegistrationNo} - {vehicle.VehicleType}
                  </option>
                ))}
            </select>

            {/* Selected Vehicle Tags */}
            {selectedVehicleTags.length > 0 && (
              <div className="selected-vehicles-tags" style={{ marginTop: '10px' }}>
                {selectedVehicleTags.map(tag => (
                  <span
                    key={tag.id}
                    className="vehicle-tag"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#007bff',
                      color: 'white',
                      padding: '6px 12px',
                      margin: '4px 4px 4px 0',
                      borderRadius: '20px',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                    onClick={() => removeVehicleTag(tag.id)}
                    title="Click to remove"
                  >
                    {tag.registrationNo} - {tag.type} ✕
                  </span>
                ))}
              </div>
            )}

            {errors.VehicleNo && <span className="error-message">{errors.VehicleNo}</span>}
          </div>

          <div className="form-group">
            <label>Vendor Name & Code</label>
            <Dropdown
              name="VendorName"
              value={masterData.VendorName}
              onChange={handleMasterDataChange}
              apiCall={vendorAPI.getAll}
              valueKey="VendorID"
              labelKey="VendorName"
              formatLabel={(vendor) => `${vendor.VendorName} (${vendor.VendorCode})`}
              placeholder="Select Vendor"
              allowEmpty={true}
            />
          </div>
        </div>

        {/* Transaction Data Section */}
        <div className="form-section transaction-section">
          <h3>Transaction Details</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>Driver *</label>
              <select
                name="DriverID"
                value={transactionData.DriverID}
                onChange={handleTransactionDataChange}
                className={errors.DriverID ? 'error' : ''}
              >
                <option value="">Select Driver</option>
                {drivers.map(driver => (
                  <option key={driver.DriverID} value={driver.DriverID}>
                    {driver.DriverName} - {driver.DriverMobileNo}
                  </option>
                ))}
              </select>
              {errors.DriverID && <span className="error-message">{errors.DriverID}</span>}
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

          <div className="form-row">
            <div className="form-group">
              <label>Total Deliveries</label>
              <input
                type="number"
                name="TotalDeliveries"
                value={transactionData.TotalDeliveries}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>Total Deliveries Attempted</label>
              <input
                type="number"
                name="TotalDeliveriesAttempted"
                value={transactionData.TotalDeliveriesAttempted}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Deliveries Done</label>
              <input
                type="number"
                name="TotalDeliveriesDone"
                value={transactionData.TotalDeliveriesDone}
                onChange={handleTransactionDataChange}
              />
            </div>

            <div className="form-group">
              <label>Total Duty Hours</label>
              <input
                type="number"
                name="TotalDutyHours"
                value={transactionData.TotalDutyHours}
                onChange={handleTransactionDataChange}
                step="0.01"
              />
            </div>
          </div>

          {/* Replacement Driver Fields */}
          <div className="form-row">
            <div className="form-group">
              <label>Replacement Driver Name</label>
              <input
                type="text"
                name="ReplacementDriverName"
                value={transactionData.ReplacementDriverName}
                onChange={handleTransactionDataChange}
                placeholder="Enter replacement driver name"
              />
            </div>

            <div className="form-group">
              <label>Replacement Driver No</label>
              <input
                type="text"
                name="ReplacementDriverNo"
                value={transactionData.ReplacementDriverNo}
                onChange={handleTransactionDataChange}
                placeholder="Enter 10-digit mobile number"
                maxLength="10"
              />
              {errors.ReplacementDriverNo && <span className="error-message">{errors.ReplacementDriverNo}</span>}
            </div>
          </div>

          {/* Additional Fields Section */}
          <div className="form-row">
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="CompanyName"
                value={transactionData.CompanyName}
                onChange={handleTransactionDataChange}
                placeholder="Enter company name"
              />
            </div>

            <div className="form-group">
              <label>GST No</label>
              <input
                type="text"
                name="GSTNo"
                value={transactionData.GSTNo}
                onChange={handleTransactionDataChange}
                placeholder="Enter GST number"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="Location"
                value={transactionData.Location}
                onChange={handleTransactionDataChange}
                placeholder="Enter location"
              />
            </div>

            <div className="form-group">
              <label>Customer Site</label>
              <input
                type="text"
                name="CustomerSite"
                value={transactionData.CustomerSite}
                onChange={handleTransactionDataChange}
                placeholder="Enter customer site"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Vehicle Type *</label>
              <select
                name="VehicleType"
                value={transactionData.VehicleType}
                onChange={handleTransactionDataChange}
                className={errors.VehicleType ? 'error' : ''}
              >
                <option value="">Select Vehicle Type</option>
                <option value="Tata Ace">Tata Ace</option>
                <option value="Truck">Truck</option>
                <option value="LCV">LCV</option>
                <option value="HCV">HCV</option>
                <option value="Tempo">Tempo</option>
                <option value="Mini Truck">Mini Truck</option>
              </select>
              {errors.VehicleType && <span className="error-message">{errors.VehicleType}</span>}
            </div>

            <div className="form-group">
              <label>Vendor Name & Code</label>
              <select
                name="VendorNameCode"
                value={transactionData.VendorName}
                onChange={handleTransactionDataChange}
              >
                <option value="">Select Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor.VendorID} value={`${vendor.VendorName} (${vendor.VendorCode})`}>
                    {vendor.VendorName} ({vendor.VendorCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Financial Fields Section */}
          <div className="form-row">
            <div className="form-group">
              <label>Total KM</label>
              <input
                type="number"
                name="TotalKM"
                value={transactionData.ClosingKM && transactionData.OpeningKM ?
                  (Number(transactionData.ClosingKM) - Number(transactionData.OpeningKM)).toFixed(2) : ''}
                className="readonly-field calculated-field"
                readOnly
                style={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}
              />
            </div>

            <div className="form-group">
              <label>V. Freight (Fix)</label>
              <input
                type="number"
                name="VFreightFix"
                value={transactionData.VFreightFix}
                onChange={handleTransactionDataChange}
                step="0.01"
                placeholder="Enter fixed freight amount"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Toll Expenses</label>
              <input
                type="number"
                name="TollExpenses"
                value={transactionData.TollExpenses}
                onChange={handleTransactionDataChange}
                step="0.01"
                placeholder="Enter toll expenses"
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
                placeholder="Enter parking charges"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Handling Charges</label>
              <input
                type="number"
                name="HandlingCharges"
                value={transactionData.HandlingCharges}
                onChange={handleTransactionDataChange}
                step="0.01"
                placeholder="Enter handling charges"
              />
            </div>

            <div className="form-group">
              <label>Out Time from Hub</label>
              <input
                type="time"
                name="OutTimeFrom"
                value={transactionData.OutTimeFrom}
                onChange={handleTransactionDataChange}
              />
            </div>
          </div>

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
        <h3>Fixed Transactions</h3>
        <DataTable
          data={transactions}
          columns={[
            { key: 'SerialNumber', label: 'S.No.' },
            { key: 'TripType', label: 'Type' },
            { key: 'TransactionDate', label: 'Date' },
            { key: 'CustomerName', label: 'Customer' },
            { key: 'ProjectName', label: 'Project' },
            { key: 'VehicleRegistrationNo', label: 'Vehicle' },
            { key: 'DriverName', label: 'Driver' },
            { key: 'OpeningKM', label: 'Opening KM' },
            { key: 'ClosingKM', label: 'Closing KM' },
            { key: 'Status', label: 'Status' }
          ]}
          keyField="TransactionID"
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={(row) => console.log('Delete:', row)}
        />
      </div>
    </div>
  );
};

export default FixedTransactionForm;
