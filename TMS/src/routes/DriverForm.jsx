import React, { useState, useEffect } from 'react';
import { driverAPI, vendorAPI, vehicleAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import Dropdown from '../components/Dropdown';
import SearchableDropdown from '../components/SearchableDropdown';
import ExportButton from '../components/ExportButton';
import AddressForm from '../components/AddressForm';
import NewDocumentUpload from '../components/NewDocumentUpload';
import ExistingDocumentUpload from '../components/ExistingDocumentUpload';
import ValidatedInput from '../components/ValidatedInput';
import ValidationErrorModal from '../components/ValidationErrorModal';
import useFormValidation from '../hooks/useFormValidation';
import './DriverForm.css';
// Simple date formatting function
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const DriverForm = () => {
  // Global validation system - simplified to avoid errors
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateBeforeSubmit = async (formData, successCallback, errorCallback) => {
    try {
      // Basic validation
      const errors = {};

      // Check required fields
      if (!formData.DriverName) {
        errors.DriverName = 'Driver Name is required';
      }
      if (!formData.DriverLicenceNo) {
        errors.DriverLicenceNo = 'Driver Licence Number is required';
      }
      if (!formData.DriverMobileNo) {
        errors.DriverMobileNo = 'Driver Mobile Number is required';
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        if (errorCallback) {
          errorCallback({ isValid: false, errors, summary: 'Please fill in all required fields' });
        }
        return false;
      }

      // Clear errors and call success callback
      setErrors({});
      if (successCallback) {
        await successCallback(formData);
      }
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      if (errorCallback) {
        errorCallback({ isValid: false, errors: {}, summary: 'Validation failed' });
      }
      return false;
    }
  };

  const closeErrorModal = () => setShowErrorModal(false);
  const goToField = (fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) element.focus();
  };

  const getInitialState = () => ({
    DriverName: '',
    DriverLicenceNo: '',
    DriverMobileNo: '',
    DriverAddress: '',
    vehicle_number: '', // Vehicle assignment
    vendor_id: '', // Vendor assignment
    // Structured Address Fields
    house_flat_no: '',
    street_locality: '',
    city: '',
    state: '',
    pin_code: '',
    country: 'India',
    DriverLicenceIssueDate: '',
    DriverLicenceExpiryDate: '',
    DriverMedicalDate: '',
    DriverSameAsVendor: 'Separate',
    DriverAlternateNo: '',
    DriverTotalExperience: '',
    DriverPhoto: null,
  });

  const [driverData, setDriverData] = useState(getInitialState());
  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);

  // State for modal viewer
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchDrivers();
    fetchVendors();
  }, []);

  // Handle address changes from AddressForm component
  const handleAddressChange = (newAddressData) => {
    setDriverData(prev => ({
      ...prev,
      ...newAddressData,
      // Also update the combined address field for backward compatibility
      DriverAddress: `${newAddressData.house_flat_no || ''}, ${newAddressData.street_locality || ''}, ${newAddressData.city || ''}, ${newAddressData.state || ''}, ${newAddressData.pin_code || ''}${newAddressData.country && newAddressData.country !== 'India' ? ', ' + newAddressData.country : ''}`
    }));
  };

  // Get address data for AddressForm component
  const getAddressData = () => ({
    house_flat_no: driverData.house_flat_no || '',
    street_locality: driverData.street_locality || '',
    city: driverData.city || '',
    state: driverData.state || '',
    pin_code: driverData.pin_code || '',
    country: driverData.country || 'India'
  });

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const response = await driverAPI.getAll();
      setDrivers(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to fetch drivers');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorAPI.getAll();
      setVendors(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to load vendors');
    }
  };



  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    setDriverData(prev => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Enhanced file change handler for new component
  const handleEnhancedFileChange = (fieldName, file) => {
    setDriverData(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  // Helper function to get file preview URL
  const getFilePreview = (file) => {
    if (!file) return null;

    if (file.type && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to get existing image URL from database path
  const getExistingImageUrl = (imagePath) => {
    if (!imagePath) return null;

    // Check if it's already a full URL
    if (imagePath.startsWith('http')) return imagePath;

    // Create URL for server-stored image - use backend port 3003
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

    // Extract just the filename from the path
    let filename = imagePath;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      filename = imagePath.split(/[\\/]/).pop();
    }

    // Use the proper API endpoint for drivers
    return `${baseUrl}/api/drivers/files/${filename}`;
  };

  // Helper function to render comprehensive file preview (images and documents)
  const renderFilePreview = (fieldName, displayName = null) => {
    const newFile = driverData[fieldName];
    const existingPath = editingDriver?.[fieldName];

    if (!newFile && !existingPath) return null;

    const isImage = (file) => {
      if (file && file.type) return file.type.startsWith('image/');
      if (typeof file === 'string') return /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
      return false;
    };

    const getFileIcon = (fileName) => {
      const ext = fileName?.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'pdf': return '📄';
        case 'doc':
        case 'docx': return '📝';
        case 'xls':
        case 'xlsx': return '📊';
        default: return '📎';
      }
    };

    return (
      <div className="file-preview">
        {newFile && newFile.name ? (
          // Show newly selected file preview
          isImage(newFile) ? (
            <img
              src={getFilePreview(newFile)}
              alt={`${displayName || fieldName} Preview`}
              className="image-preview clickable-preview"
              onClick={() => {
                setModalImage(getFilePreview(newFile));
                setShowModal(true);
              }}
              title="Click to view full size"
            />
          ) : (
            <div className="document-preview">
              <span className="document-icon">{getFileIcon(newFile.name)}</span>
              <span className="document-type">{newFile.type || 'Document'}</span>
            </div>
          )
        ) : (
          // Show existing file from database
          existingPath && (
            isImage(existingPath) ? (
              <img
                src={getExistingImageUrl(existingPath)}
                alt={`Existing ${displayName || fieldName}`}
                className="image-preview clickable-preview"
                onClick={() => {
                  setModalImage(getExistingImageUrl(existingPath));
                  setShowModal(true);
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  console.warn(`Failed to load existing image for ${fieldName}:`, existingPath);
                }}
                title="Click to view full size"
              />
            ) : (
              <div className="document-preview">
                <span className="document-icon">{getFileIcon(existingPath)}</span>
                <span className="document-type">Document</span>
                <a
                  href={getExistingImageUrl(existingPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="document-link"
                >
                  View Document
                </a>
              </div>
            )
          )
        )}
        <div className="file-info">
          {newFile && newFile.name ? (
            <>
              <span className="file-name">{newFile.name}</span>
              <span className="file-size">({formatFileSize(newFile.size)})</span>
            </>
          ) : (
            <span className="file-name">Existing: {existingPath?.split('/').pop() || fieldName}</span>
          )}
        </div>
      </div>
    );
  };


  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!driverData.DriverName.trim()) {
      newErrors.DriverName = 'Driver name is required';
    }
    if (!driverData.DriverLicenceNo.trim()) {
      newErrors.DriverLicenceNo = 'Licence number is required';
    }

    if (driverData.DriverLicenceIssueDate && driverData.DriverLicenceExpiryDate && driverData.DriverLicenceIssueDate > driverData.DriverLicenceExpiryDate) {
      newErrors.DriverLicenceExpiryDate = 'Licence expiry date cannot be before issue date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to parse full address into individual fields
  const parseFullAddress = (fullAddress) => {
    if (!fullAddress) return {};

    // Try to parse address like "849, kjsdhk, Kurnool, Andhra Pradesh, 518501"
    const parts = fullAddress.split(',').map(part => part.trim());

    if (parts.length >= 4) {
      return {
        house_flat_no: parts[0] || '',
        street_locality: parts[1] || '',
        city: parts[2] || '',
        state: parts[3] || '',
        pin_code: parts[4] || ''
      };
    } else if (parts.length >= 2) {
      return {
        street_locality: parts.slice(0, -2).join(', ') || '',
        city: parts[parts.length - 2] || '',
        state: parts[parts.length - 1] || ''
      };
    }

    return { street_locality: fullAddress };
  };

  const resetForm = () => {
    setDriverData(getInitialState());
    setErrors({});
    setEditingDriver(null);
  };

  // Direct backend export function
  const handleExportDrivers = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const exportUrl = `${API_BASE_URL}/api/export/drivers`;

      // Show loading message
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #007bff; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      loadingToast.textContent = '🔄 Exporting drivers... Please wait';
      document.body.appendChild(loadingToast);

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `Driver_Master_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Remove loading and show success
      document.body.removeChild(loadingToast);

      const successToast = document.createElement('div');
      successToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #28a745; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      successToast.innerHTML = `✅ Driver Export Started!<br><small>Downloading ALL driver master fields + vendor info</small>`;
      document.body.appendChild(successToast);
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 5000);

    } catch (error) {
      console.error('Export error:', error);
      alert(`❌ Export failed: ${error.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Use global validation system with error modal and cursor movement
    const isValid = await validateBeforeSubmit(
      driverData,
      // Success callback
      async (validatedData) => {
        await submitDriverData(validatedData);
      },
      // Error callback
      (validationResult) => {
        console.log('Driver validation failed:', validationResult.summary);
        // Error modal will be shown automatically
      }
    );

    if (!isValid) {
      return; // Validation failed, modal shown, cursor moved
    }
  };

  // Separate function for actual data submission
  const submitDriverData = async (validatedData) => {

    setIsSubmitting(true);

    try {
      // Create FormData for file upload support
      const formData = new FormData();

      // Add text fields - only add non-empty values to preserve existing data
      if (driverData.DriverName && driverData.DriverName.trim()) {
        formData.append('DriverName', driverData.DriverName.trim());
      }
      if (driverData.DriverLicenceNo && driverData.DriverLicenceNo.trim()) {
        formData.append('DriverLicenceNo', driverData.DriverLicenceNo.trim());
      }
      if (driverData.DriverMobileNo && driverData.DriverMobileNo.trim()) {
        formData.append('DriverMobileNo', driverData.DriverMobileNo.trim());
      }
      if (driverData.DriverAddress && driverData.DriverAddress.trim()) {
        formData.append('DriverAddress', driverData.DriverAddress.trim());
      }
      if (driverData.DriverLicenceIssueDate) {
        formData.append('DriverLicenceIssueDate', driverData.DriverLicenceIssueDate);
      }
      if (driverData.DriverLicenceExpiryDate) {
        formData.append('DriverLicenceExpiryDate', driverData.DriverLicenceExpiryDate);
      }
      if (driverData.DriverMedicalDate) {
        formData.append('DriverMedicalDate', driverData.DriverMedicalDate);
      }
      formData.append('DriverSameAsVendor', driverData.DriverSameAsVendor || 'Separate');
      if (driverData.DriverAlternateNo && driverData.DriverAlternateNo.trim()) {
        formData.append('DriverAlternateNo', driverData.DriverAlternateNo.trim());
      }
      if (driverData.DriverTotalExperience) {
        formData.append('DriverTotalExperience', driverData.DriverTotalExperience);
      }
      if (driverData.vendor_id) {
        formData.append('VendorID', driverData.vendor_id);
      }

      // Add vehicle assignment
      if (driverData.vehicle_number) {
        formData.append('vehicle_number', driverData.vehicle_number);
      }

      // Add file only if a new file is selected
      if (driverData.DriverPhoto && driverData.DriverPhoto.name) {
        formData.append('DriverPhoto', driverData.DriverPhoto);
        console.log('📁 DRIVER FORM - Adding new photo to FormData:', driverData.DriverPhoto.name);
      }
      // Note: If no new file is selected, we don't send any file data
      // The backend will preserve the existing photo automatically



      if (editingDriver) {
        await driverAPI.update(editingDriver.DriverID, formData);
        apiHelpers.showSuccess('Driver updated successfully!');
      } else {
        await driverAPI.create(formData);
        apiHelpers.showSuccess('Driver created successfully!');
      }

      resetForm();
      await fetchDrivers();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to save driver');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (driver) => {
    try {
      // Fetch complete driver data with all URLs from API
      const response = await driverAPI.getById(driver.DriverID);
      const completeDriverData = response.data || response;



      setEditingDriver(completeDriverData);

      const editData = {
        DriverName: completeDriverData.DriverName || '',
        DriverLicenceNo: completeDriverData.DriverLicenceNo || '',
        DriverMobileNo: completeDriverData.DriverMobileNo || '',
        DriverAddress: completeDriverData.DriverAddress || '',
        // Fix field name mapping - database uses different field names
        DriverLicenceIssueDate: formatDateForInput(completeDriverData.DriverLicenceIssueDate),
        DriverLicenceExpiryDate: formatDateForInput(completeDriverData.LicenceExpiry), // Database field: LicenceExpiry
        DriverMedicalDate: formatDateForInput(completeDriverData.MedicalDate), // Database field: MedicalDate
        DriverSameAsVendor: completeDriverData.DriverSameAsVendor || 'Separate',
        DriverAlternateNo: completeDriverData.DriverAlternateNo || '',
        DriverTotalExperience: completeDriverData.DriverTotalExperience || '',
        vendor_id: completeDriverData.VendorID || '',
        // Address fields - handle both individual fields and full address
        house_flat_no: completeDriverData.HouseFlatNo || '',
        street_locality: completeDriverData.StreetLocality || '',
        city: completeDriverData.DriverCity || '',
        state: completeDriverData.DriverState || '',
        pin_code: completeDriverData.DriverPinCode || '',
        country: completeDriverData.DriverCountry || 'India',
        // If individual address fields are empty but full address exists, parse it
        ...((!completeDriverData.HouseFlatNo && !completeDriverData.StreetLocality && completeDriverData.DriverAddress) ?
          parseFullAddress(completeDriverData.DriverAddress) : {}),
        // Vehicle assignment - preserve existing assignment
        vehicle_number: completeDriverData.VehicleID || '',
        // Keep existing photo reference for display with complete URL data
        DriverPhoto: completeDriverData.DriverPhoto || null,
        DriverPhoto_url: completeDriverData.DriverPhoto_url || null
      };

      setDriverData(editData);
      setErrors({});

      // Scroll to top of the page to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching complete driver data:', error);
      // Fallback to using the passed driver data
      setEditingDriver(driver);

      // Still populate form with available data
      const fallbackEditData = {
        DriverName: driver.DriverName || '',
        DriverLicenceNo: driver.DriverLicenceNo || '',
        DriverMobileNo: driver.DriverMobileNo || '',
        DriverPhoto: driver.DriverPhoto || null,
        DriverPhoto_url: driver.DriverPhoto_url || null
      };

      setDriverData(fallbackEditData);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      apiHelpers.showError('Could not fetch complete driver data. Some images may not display.');
    }
  };

  const handleDelete = async (driver) => {
    if (!window.confirm(`Are you sure you want to delete driver "${driver.DriverName}"?`)) {
      return;
    }

    try {
      await driverAPI.delete(driver.DriverID);
      apiHelpers.showSuccess('Driver deleted successfully!');
      await fetchDrivers();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to delete driver');
    }
  };

  // Handle file deletion during edit
  const handleFileDelete = async (fieldName, fileName) => {
    try {
      if (!editingDriver) {
        throw new Error('No driver being edited');
      }

      console.log(`🗑️ Deleting driver file - ID: ${editingDriver.DriverID}, Field: ${fieldName}, File: ${fileName}`);

      // Call API to delete file
      await driverAPI.deleteFile(editingDriver.DriverID, fieldName);

      // Update the editing driver data to remove the file reference
      setEditingDriver(prev => ({
        ...prev,
        [fieldName]: null
      }));

      // Update form data to remove the file
      setDriverData(prev => ({
        ...prev,
        [fieldName]: null
      }));

      apiHelpers.showSuccess(`File deleted successfully`);

    } catch (error) {
      console.error('❌ Error deleting driver file:', error);
      apiHelpers.showError(error, 'Failed to delete file');
      throw error; // Re-throw so DocumentUpload can handle the error state
    }
  };

  const driverColumns = [
    { key: 'DriverName', label: 'Driver Name', sortable: true },
    { key: 'DriverLicenceNo', label: 'Licence No', sortable: true },
    { key: 'DriverMobileNo', label: 'Mobile', sortable: true },
    { key: 'DriverAlternateNo', label: 'Alt. Mobile', sortable: true },
    {
      key: 'DriverLicenceExpiryDate',
      label: 'Licence Expiry',
      sortable: true,
      type: 'date'
    },
    {
      key: 'DriverAddress',
      label: 'Address',
      sortable: false,
      render: (value) => value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '-'
    },
  ];

  return (
    <div className="driver-form-container">
      {/* Header */}
      <div className="form-header">
        <h1>👨‍💼 Driver Management</h1>
        <p>Add and manage drivers with their details</p>



        {/* Edit Mode Notice */}
        {editingDriver && (
          <div className="edit-notice">
            <span className="edit-notice-text">
              Editing: <strong className="edit-notice-item">{editingDriver.DriverName}</strong>
            </span>
            <button type="button" onClick={resetForm} className="cancel-edit-btn">
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="form-layout-card">
        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-fields-grid">
            {/* Driver - Same as Vendor / Separate */}
            <div className="form-field">
              <label className="form-field-label">Driver - Same as Vendor / Separate</label>
              <select
                name="DriverSameAsVendor"
                value={driverData.DriverSameAsVendor}
                onChange={handleInputChange}
                className="form-field-select"
              >
                <option value="Separate">Separate</option>
                <option value="Same as Vendor">Same as Vendor</option>
              </select>
            </div>

            {/* Driver Name */}
            {driverData.DriverSameAsVendor === 'Same as Vendor' ? (
              <div className="form-field">
                <label className="form-field-label">
                  Vendor <span className="required-indicator">*</span>
                </label>
                <SearchableDropdown
                  name="vendor_id"
                  value={driverData.vendor_id}
                  onChange={(e) => {
                    const { value } = e.target;
                    const selectedVendor = vendors.find(v => v.VendorID == value);
                    if (selectedVendor) {
                      setDriverData(prev => ({
                        ...prev,
                        vendor_id: value,
                        DriverName: selectedVendor.VendorName,
                        DriverMobileNo: selectedVendor.VendorMobileNo,
                        DriverAddress: selectedVendor.VendorAddress,
                        house_flat_no: selectedVendor.HouseFlatNo,
                        street_locality: selectedVendor.StreetLocality,
                        city: selectedVendor.City,
                        state: selectedVendor.State,
                        pin_code: selectedVendor.PinCode,
                        country: selectedVendor.Country,
                      }));
                    }
                  }}
                  options={vendors}
                  valueKey="VendorID"
                  labelKey="VendorName"
                  placeholder="Select a vendor"
                  required
                  error={errors.vendor_id}
                />
              </div>
            ) : (
              <div className="form-field">
                <label className="form-field-label">
                  Driver Name <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  name="DriverName"
                  value={driverData.DriverName}
                  onChange={handleInputChange}
                  placeholder="Enter driver name"
                  required
                  className={`form-input ${errors.DriverName ? 'error' : ''}`}
                />
                {errors.DriverName && <div className="form-field-error">{errors.DriverName}</div>}
              </div>
            )}

            {/* Licence Number */}
            <div className="form-field">
              <label className="form-field-label">
                Licence Number <span className="required-indicator">*</span>
              </label>
              <input
                type="text"
                name="DriverLicenceNo"
                value={driverData.DriverLicenceNo}
                onChange={handleInputChange}
                placeholder="Enter licence number"
                required
                className={`form-input ${errors.DriverLicenceNo ? 'error' : ''}`}
              />
              {errors.DriverLicenceNo && <div className="form-field-error">{errors.DriverLicenceNo}</div>}
            </div>

            {/* Licence Issue Date */}
            <div className="form-field">
              <label className="form-field-label">Licence Issue Date (Optional)</label>
              <input
                type="date"
                name="DriverLicenceIssueDate"
                value={driverData.DriverLicenceIssueDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="form-input"
              />
            </div>

            {/* Licence Expiry Date */}
            <div className="form-field">
              <label className="form-field-label">Licence Expiry Date (Optional)</label>
              <input
                type="date"
                name="DriverLicenceExpiryDate"
                value={driverData.DriverLicenceExpiryDate}
                onChange={handleInputChange}
                min={driverData.DriverLicenceIssueDate}
                className="form-input"
              />
            </div>

            {/* Mobile Number - Enhanced Validation */}
            <ValidatedInput
              name="DriverMobileNo"
              value={driverData.DriverMobileNo}
              onChange={handleInputChange}
              validationRule="MOBILE"
              required={false}
              label="Mobile Number"
              placeholder="Enter mobile number"
              showFormatHint={true}
              autoFormat={true}
            />

            {/* Driver Alternate No / Family No - Enhanced Validation */}
            <ValidatedInput
              name="DriverAlternateNo"
              value={driverData.DriverAlternateNo}
              onChange={handleInputChange}
              validationRule="MOBILE"
              required={false}
              label="Driver Alternate No. / Family No."
              placeholder="Enter alternate/family contact number"
              showFormatHint={true}
              autoFormat={true}
            />

            {/* Vehicle Number Assignment - Dropdown */}
            <div className="form-field">
              <label className="form-field-label">
                Assigned Vehicle Number
              </label>
              <SearchableDropdown
                name="vehicle_number"
                value={driverData.vehicle_number}
                onChange={handleInputChange}
                apiCall={async () => {
                  try {
                    const response = await vehicleAPI.getAll();

                    // Extract vehicles from response
                    let vehicles = [];
                    if (response?.data?.data && Array.isArray(response.data.data)) {
                      vehicles = response.data.data;
                    } else if (response?.data && Array.isArray(response.data)) {
                      vehicles = response.data;
                    } else if (Array.isArray(response)) {
                      vehicles = response;
                    }

                    // Filter valid vehicles
                    const validVehicles = vehicles.filter(vehicle =>
                      vehicle && vehicle.VehicleID && vehicle.VehicleRegistrationNo
                    );

                    return { data: validVehicles };
                  } catch (error) {
                    console.error('Error fetching vehicles:', error);
                    return { data: [] };
                  }
                }}
                valueKey="VehicleID"
                labelKey="VehicleRegistrationNo"
                formatLabel={(vehicle) => {
                  const regNo = vehicle.VehicleRegistrationNo || 'Unknown';
                  const code = vehicle.VehicleCode || `ID-${vehicle.VehicleID}`;
                  return `${regNo} (${code})`;
                }}
                placeholder="Select vehicle number (optional)"
                allowEmpty={true}
                emptyLabel="No vehicle assigned"
                required={false}
                searchPlaceholder="Search vehicles..."
              />
            </div>

            {/* Driver Total Experience */}
            <div className="form-field">
              <label className="form-field-label">Driver Total Experience (Years) (Optional)</label>
              <input
                type="number"
                name="DriverTotalExperience"
                value={driverData.DriverTotalExperience}
                onChange={handleInputChange}
                placeholder="Enter total experience in years"
                min="0"
                max="50"
                className="form-input"
              />
            </div>

            {/* Medical Date */}
            <div className="form-field">
              <label className="form-field-label">Medical Date (Optional)</label>
              <input
                type="date"
                name="DriverMedicalDate"
                value={driverData.DriverMedicalDate}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Driver Photo */}
            {editingDriver && driverData.DriverPhoto_url ? (
              <ExistingDocumentUpload
                label="Driver Photo"
                fileUrl={driverData.DriverPhoto_url}
                onDelete={() => handleFileDelete('DriverPhoto')}
              />
            ) : (
              <NewDocumentUpload
                label="Driver Photo (Optional)"
                name="DriverPhoto"
                value={driverData.DriverPhoto}
                onChange={handleInputChange}
                accept="image/*,.pdf,.doc,.docx"
                required={false}
                error={errors.DriverPhoto}
              />
            )}

            {/* Address */}
            {/* Enhanced Address Form with PIN Code Lookup */}
            <div className="form-field form-field-full-width">
              <AddressForm
                addressData={getAddressData()}
                onAddressChange={handleAddressChange}
                errors={errors}
                required={false}
                prefix="driver"
                title="Driver Address"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Processing...' : editingDriver ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </div>

      {/* Export Button - Bottom Right Above DataTable */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '15px',
        paddingRight: '10px'
      }}>
        <ExportButton
          entity="drivers"
          entityDisplayName="Drivers"
          expectedFields={19}
        />
      </div>

      {/* Data Table */}
      <DataTable
        title="📋 Driver List"
        data={drivers}
        columns={driverColumns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        keyField="DriverID"
        emptyMessage="No drivers found. Add your first driver above."
        defaultRowsPerPage={10}
        showPagination={true}
        customizable={true}
        exportable={false}
      />

      {/* Image Modal Viewer */}
      {showModal && modalImage && (
        <div className="image-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Image Preview</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>
            <div className="image-modal-body">
              <img
                src={modalImage}
                alt="Full size preview"
                className="modal-image-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Global Validation Error Modal */}
      <ValidationErrorModal
        isOpen={showErrorModal}
        onClose={closeErrorModal}
        errorSummary={errorSummary}
        onGoToField={goToField}
        onTryAgain={() => handleSubmit({ preventDefault: () => {} })}
      />
    </div>
  );
};

export default DriverForm;
