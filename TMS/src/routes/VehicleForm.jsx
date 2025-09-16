import React, { useState, useEffect } from 'react';
import { vehicleAPI, vendorAPI, customerAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import Dropdown from '../components/Dropdown';
import SearchableDropdown from '../components/SearchableDropdown';
import DynamicDropdown from '../components/DynamicDropdown';
import ExportButton from '../components/ExportButton';
import ValidatedInput from '../components/ValidatedInput';
import DateInput from '../components/DateInput';
import VehiclePhotoUpload from '../components/VehiclePhotoUpload';
import EditFileManager from '../components/EditFileManager';
import NewDocumentUpload from '../components/NewDocumentUpload';
import ExistingDocumentUpload from '../components/ExistingDocumentUpload';

import useFormValidation from '../hooks/useFormValidation';
import vehicleCodeService from '../services/vehicleCodeService';
import './VehicleForm.css';

// Simple date formatting function
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Calculate age from date
const calculateAge = (dateString) => {
  if (!dateString) return 0;
  const today = new Date();
  const birthDate = new Date(dateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Calculate driving experience
const calculateExperience = (licenseDate) => {
  if (!licenseDate) return 0;
  const today = new Date();
  const issueDate = new Date(licenseDate);
  const diffTime = Math.abs(today - issueDate);
  const diffYears = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 365));
  return diffYears;
};

const VehicleForm = () => {
  // Simple validation system with notifications
  const [isValidating, setIsValidating] = useState(false);

  // Simple validation with notification alert and auto scroll
  const validateBeforeSubmit = async (formData, successCallback, errorCallback) => {
    try {
      const errors = {};
      const requiredFields = [
        { field: 'VehicleRegistrationNo', label: 'Vehicle Registration Number', element: 'input[name="VehicleRegistrationNo"]' },
        { field: 'vendor_id', label: 'Assigned Vendor', element: 'input[name="vendor_id"]' },
        { field: 'VehicleCode', label: 'Vehicle Code', element: 'input[name="VehicleCode"]' },
        { field: 'VehicleChasisNo', label: 'Vehicle Chassis Number', element: 'input[name="VehicleChasisNo"]' },
        { field: 'VehicleModel', label: 'Vehicle Model', element: 'input[name="VehicleModel"]' },
        { field: 'TypeOfBody', label: 'Type of Body', element: 'select[name="TypeOfBody"]' },
        { field: 'VehicleType', label: 'Vehicle Type', element: 'select[name="VehicleType"]' },
        { field: 'VehicleRegistrationDate', label: 'Vehicle Registration Date', element: 'input[name="VehicleRegistrationDate"]' }
      ];

      // Check required fields
      let firstErrorField = null;
      const missingFields = [];

      requiredFields.forEach(({ field, label, element }) => {
        if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
          errors[field] = `${label} is required`;
          missingFields.push(label);
          if (!firstErrorField) {
            firstErrorField = { field, label, element };
          }
        }
      });

      // Additional validation rules
      if (formData.VehicleRegistrationNo && formData.VehicleRegistrationNo.length < 3) {
        errors.VehicleRegistrationNo = 'Vehicle Registration Number must be at least 3 characters';
        if (!firstErrorField) {
          firstErrorField = { field: 'VehicleRegistrationNo', label: 'Vehicle Registration Number', element: 'input[name="VehicleRegistrationNo"]' };
        }
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors);

        // Show simple notification alert
        const missingFieldsText = missingFields.join(', ');
        apiHelpers.showError(`Please fill in the following required fields: ${missingFieldsText}`);

        // Auto scroll to first error field and focus
        if (firstErrorField) {
          setTimeout(() => {
            const element = document.querySelector(firstErrorField.element);
            if (element) {
              // Scroll to field with some offset from top
              element.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
              });

              // Focus the field
              element.focus();

              // Add visual highlight
              element.style.boxShadow = '0 0 15px #ff6b6b';
              element.style.borderColor = '#ff6b6b';

              // Remove highlight after 3 seconds
              setTimeout(() => {
                element.style.boxShadow = '';
                element.style.borderColor = '';
              }, 3000);
            }
          }, 500); // Small delay to ensure notification shows first
        }

        if (errorCallback) {
          errorCallback({ isValid: false, errors, summary: `${missingFields.length} required fields missing` });
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
      apiHelpers.showError('Validation failed. Please check your inputs.');
      if (errorCallback) {
        errorCallback({ isValid: false, errors: {}, summary: 'Validation failed' });
      }
      return false;
    }
  };



  const getInitialState = () => ({
    // Vehicle Information Fields
    VehicleRegistrationNo: '',
    VehicleCode: '',
    vendor_id: '', // Assigned vendor
    RCUpload: null,
    VehicleChasisNo: '',
    VehicleModel: '',
    TypeOfBody: 'Open',
    VehicleType: '',
    VehicleRegistrationDate: '',
    VehicleAge: 0,
    VehicleKMS: '',
    VehicleKMSPhoto: null,
    // Multiple Vehicle Photos
    VehiclePhotoFront: null,
    VehiclePhotoBack: null,
    VehiclePhotoLeftSide: null,
    VehiclePhotoRightSide: null,
    VehiclePhotoInterior: null,
    VehiclePhotoEngine: null,
    VehiclePhotoRoof: null,
    VehiclePhotoDoor: null,
    LastServicing: '',
    ServiceBillPhoto: null,
    VehicleInsuranceCompany: '',
    VehicleInsuranceDate: '',
    VehicleInsuranceExpiry: '',
    InsuranceCopy: null,
    VehicleFitnessCertificateIssue: '',
    VehicleFitnessCertificateExpiry: '',
    FitnessCertificateUpload: null,
    VehiclePollutionDate: '',
    VehiclePollutionExpiry: '',
    PollutionPhoto: null,
    StateTaxIssue: '',
    StateTaxExpiry: '',
    StateTaxPhoto: null,
    VehicleLoadingCapacity: '',
    GPS: 'No',
    GPSCompany: '',
    NoEntryPass: 'No',
    NoEntryPassStartDate: '',
    NoEntryPassExpiry: '',
    NoEntryPassCopy: null,
    FixRate: '',
    FuelRate: '',
    HandlingCharges: ''
  });

  const [vehicleData, setVehicleData] = useState(getInitialState());
  const [vehicles, setVehicles] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // State for modal viewer
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // New state for enhanced features
  const [vehiclePhotos, setVehiclePhotos] = useState({});

  // Expiry date reminder logic with red flag popups
  const checkExpiryDates = (vehicleData) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiryFields = [
      { field: 'VehicleInsuranceExpiry', label: 'Vehicle Insurance', date: vehicleData.VehicleInsuranceExpiry },
      { field: 'VehicleFitnessCertificateExpiry', label: 'Fitness Certificate', date: vehicleData.VehicleFitnessCertificateExpiry },
      { field: 'VehiclePollutionExpiry', label: 'Pollution Certificate', date: vehicleData.VehiclePollutionExpiry },
      { field: 'StateTaxExpiry', label: 'State Tax', date: vehicleData.StateTaxExpiry },
      { field: 'NoEntryPassExpiry', label: 'No Entry Pass', date: vehicleData.NoEntryPassExpiry }
    ];

    expiryFields.forEach(({ field, label, date }) => {
      if (date) {
        const expiryDate = new Date(date);
        if (expiryDate < today) {
          // Expired - Red flag
          showExpiryAlert('danger', `${label} has EXPIRED!`, `Expired on ${formatDateForInput(date)}`, field);
        } else if (expiryDate <= sevenDaysFromNow) {
          // Expires within 7 days - Critical warning
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          showExpiryAlert('warning', `${label} expires soon!`, `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} (${formatDateForInput(date)})`, field);
        } else if (expiryDate <= thirtyDaysFromNow) {
          // Expires within 30 days - Regular warning
          const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
          apiHelpers.showWarning(`${label} expires in ${daysUntilExpiry} days (${formatDateForInput(date)})`);
        }
      }
    });
  };

  // Show red flag popup for critical expiry alerts
  const showExpiryAlert = (type, title, message, fieldName) => {
    // Create a custom alert modal for critical expiries
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'danger' ? 'danger' : 'warning'} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 9999;
      min-width: 350px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      border: 2px solid ${type === 'danger' ? '#dc3545' : '#ffc107'};
    `;

    alertDiv.innerHTML = `
      <div class="d-flex align-items-start">
        <div class="me-3">
          <i class="fas fa-exclamation-triangle fa-2x text-${type === 'danger' ? 'danger' : 'warning'}"></i>
        </div>
        <div class="flex-grow-1">
          <h6 class="alert-heading mb-1">${title}</h6>
          <p class="mb-2">${message}</p>
          <button class="btn btn-sm btn-outline-${type === 'danger' ? 'danger' : 'warning'} me-2" onclick="document.getElementById('${fieldName}').focus(); this.parentElement.parentElement.parentElement.remove();">
            Fix Now
          </button>
        </div>
        <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove();"></button>
      </div>
    `;

    document.body.appendChild(alertDiv);

    // Auto-remove after 10 seconds for danger alerts, 7 seconds for warnings
    setTimeout(() => {
      if (alertDiv.parentElement) {
        alertDiv.remove();
      }
    }, type === 'danger' ? 10000 : 7000);
  };

  // Check expiry dates when vehicle data changes
  useEffect(() => {
    if (vehicleData && Object.keys(vehicleData).length > 0) {
      checkExpiryDates(vehicleData);
    }
  }, [
    vehicleData.VehicleInsuranceExpiry,
    vehicleData.VehicleFitnessCertificateExpiry,
    vehicleData.VehiclePollutionExpiry,
    vehicleData.StateTaxExpiry,
    vehicleData.NoEntryPassExpiry
  ]);

  // Helper function to get expiry status for date fields
  const getExpiryStatus = (fieldName, dateValue) => {
    if (!dateValue) return null;

    const today = new Date();
    const expiryDate = new Date(dateValue);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (expiryDate < today) {
      return { status: 'expired', message: 'EXPIRED', className: 'expiry-expired' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', message: `${daysUntilExpiry} days left`, className: 'expiry-critical' };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', message: `${daysUntilExpiry} days left`, className: 'expiry-warning' };
    }
    return null;
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // Auto-generate vehicle code when vendor is selected or registration number changes
  useEffect(() => {
    if (vehicleData.vendor_id && vehicleData.VehicleRegistrationNo) {
      generateVehicleCode();
    }
  }, [vehicleData.vendor_id, vehicleData.VehicleRegistrationNo]);

  // Generate unique vehicle code based on database relationships
  const generateVehicleCode = async () => {
    try {
      if (!vehicleData.vendor_id || !vehicleData.VehicleRegistrationNo) {

        return;
      }

      // Get vendor info with linked customer and project data
      const vendorResponse = await vendorAPI.getAll();
      const vendor = vendorResponse.data?.find(v => v.VendorID == vehicleData.vendor_id);

      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Helper function to extract 2 letters from name
      const getTwoLetters = (name, fallback = 'XX') => {
        if (!name) return fallback;
        const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
        return letters.length >= 2 ? letters.substring(0, 2) : (letters + fallback).substring(0, 2);
      };



      // Step 2: Get real project details linked to this vendor
      let projectName = '';
      let customerName = '';

      if (vendor.project_id) {
        // Fetch project details using project API
        try {
          const projectResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/projects/${vendor.project_id}`);
          if (projectResponse.ok) {
            const project = await projectResponse.json();
            projectName = project.ProjectName || project.project_name || '';

            // Step 3: Get real customer details linked to this project
            if (project.CustomerID || project.customer_id) {
              try {
                const customerResponse = await customerAPI.getAll();
                const customer = customerResponse.data?.find(c =>
                  c.CustomerID == (project.CustomerID || project.customer_id)
                );
                if (customer) {
                  customerName = customer.Name || customer.customer_name || customer.MasterCustomerName || '';
                }
              } catch (error) {

              }
            }
          }
        } catch (error) {

        }
      }

      // Extract 2 letters from each REAL name
      const customerCode = getTwoLetters(customerName, 'CU');
      const projectCode = getTwoLetters(projectName, 'PR');
      const vendorCode = getTwoLetters(vendor.VendorName, 'VE');

      // Extract vehicle number from registration
      const vehicleNumber = vehicleData.VehicleRegistrationNo.replace(/[^0-9]/g, '') || '0000';

      // Generate code: CUSTOMERPROJECTVENDORVEHICLENUMBER (8-12 characters)
      const generatedCode = `${customerCode}${projectCode}${vendorCode}${vehicleNumber}`;

      setVehicleData(prev => ({
        ...prev,
        VehicleCode: generatedCode
      }));



    } catch (error) {
      console.error('Error generating vehicle code:', error);

      // Fallback to simple generation
      const regNumber = vehicleData.VehicleRegistrationNo.replace(/[^0-9]/g, '') || '0000';
      const fallbackCode = `VHCL${regNumber}`;

      setVehicleData(prev => ({
        ...prev,
        VehicleCode: fallbackCode
      }));
    }
  };



  // Auto-calculate vehicle age when registration date changes
  useEffect(() => {
    if (vehicleData.VehicleRegistrationDate) {
      const age = calculateAge(vehicleData.VehicleRegistrationDate);
      setVehicleData(prev => ({ ...prev, VehicleAge: age }));
    }
  }, [vehicleData.VehicleRegistrationDate]);

  // Auto-calculate driver experience when license date changes
  useEffect(() => {
    if (vehicleData.DriverLicenseIssueDate) {
      const experience = calculateExperience(vehicleData.DriverLicenseIssueDate);
      setVehicleData(prev => ({ ...prev, DriverTotalExperience: experience }));
    }
  }, [vehicleData.DriverLicenseIssueDate]);

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const response = await vehicleAPI.getAll();
      const vehiclesData = response.data?.data || response.data || [];



      // Backend now returns correct field names, no mapping needed
      setVehicles(vehiclesData);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to fetch vehicles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setVehicleData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setVehicleData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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

    // Create URL for server-stored image - use backend port 3004
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3004';

    // Extract just the filename from the path
    let filename = imagePath;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      filename = imagePath.split(/[\\/]/).pop();
    }

    // Use the proper API endpoint for vehicles
    return `${baseUrl}/api/vehicles/files/${filename}`;
  };

  // Helper function to render comprehensive file preview (images and documents)
  const renderFilePreview = (fieldName, displayName = null) => {
    const newFile = vehicleData[fieldName];
    const existingPath = editingVehicle?.[fieldName];

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
    if (!vehicleData.VehicleRegistrationNo.trim()) {
      newErrors.VehicleRegistrationNo = 'Vehicle registration number is required';
    }
    if (!vehicleData.VehicleCode.trim()) {
      newErrors.VehicleCode = 'Vehicle code is required';
    }
    if (!vehicleData.VehicleChasisNo.trim()) {
      newErrors.VehicleChasisNo = 'Chassis number is required';
    }
    if (!vehicleData.VehicleModel.trim()) {
      newErrors.VehicleModel = 'Vehicle model is required';
    }

    // Date validation
    if (vehicleData.VehicleInsuranceDate && vehicleData.VehicleInsuranceExpiry && vehicleData.VehicleInsuranceDate > vehicleData.VehicleInsuranceExpiry) {
      newErrors.VehicleInsuranceExpiry = 'Insurance expiry date cannot be before issue date';
    }
    if (vehicleData.VehicleFitnessCertificateIssue && vehicleData.VehicleFitnessCertificateExpiry && vehicleData.VehicleFitnessCertificateIssue > vehicleData.VehicleFitnessCertificateExpiry) {
      newErrors.VehicleFitnessCertificateExpiry = 'Fitness certificate expiry date cannot be before issue date';
    }
    if (vehicleData.VehiclePollutionDate && vehicleData.VehiclePollutionExpiry && vehicleData.VehiclePollutionDate > vehicleData.VehiclePollutionExpiry) {
      newErrors.VehiclePollutionExpiry = 'Pollution expiry date cannot be before issue date';
    }
    if (vehicleData.StateTaxIssue && vehicleData.StateTaxExpiry && vehicleData.StateTaxIssue > vehicleData.StateTaxExpiry) {
      newErrors.StateTaxExpiry = 'State tax expiry date cannot be before issue date';
    }
    if (vehicleData.NoEntryPassStartDate && vehicleData.NoEntryPassExpiry && vehicleData.NoEntryPassStartDate > vehicleData.NoEntryPassExpiry) {
      newErrors.NoEntryPassExpiry = 'No entry pass expiry date cannot be before start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setVehicleData(getInitialState());
    setErrors({});
    setEditingVehicle(null);
  };

  // Direct backend export function
  const handleExportVehicles = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const exportUrl = `${API_BASE_URL}/api/export/vehicles`;

      // Show loading message
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #007bff; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      loadingToast.textContent = '🔄 Exporting vehicles... Please wait';
      document.body.appendChild(loadingToast);

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `Vehicle_Master_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      successToast.innerHTML = `✅ Vehicle Export Started!<br><small>Downloading ALL vehicle master fields + vendor info</small>`;
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

    // Prepare complete form data including photos
    const completeFormData = {
      ...vehicleData,
      vehicle_photos: vehiclePhotos,
      customer_id: vehicleData.customer_id,
      vendor_id: vehicleData.vendor_id,
      project_id: vehicleData.project_id,
      location_id: vehicleData.location_id,
      vehicle_number: vehicleData.VehicleRegistrationNo,
      engine_number: vehicleData.VehicleChasisNo, // Note: This seems to be engine number
      chassis_number: vehicleData.VehicleChasisNo,
      insurance_date: vehicleData.VehicleInsuranceDate
    };

    // Use global validation system with error modal and cursor movement
    const isValid = await validateBeforeSubmit(
      completeFormData,
      // Success callback
      async (validatedData) => {
        await submitVehicleData(validatedData);
      },
      // Error callback
      (validationResult) => {

        // Error modal will be shown automatically
      }
    );

    if (!isValid) {
      return; // Validation failed, modal shown, cursor moved
    }
  };

  // Separate function for actual data submission
  const submitVehicleData = async (validatedData) => {
    setIsSubmitting(true);

    try {
      // Create FormData for file uploads
      const formData = new FormData();

      // Add all form data (use validatedData instead of vehicleData)
      Object.keys(validatedData).forEach(key => {
        if (validatedData[key] instanceof File) {
          // Add file data
          formData.append(key, validatedData[key]);
        } else if (validatedData[key] !== null && validatedData[key] !== undefined && validatedData[key] !== '') {
          // Add non-file data only if it has a value
          formData.append(key, validatedData[key]);
        }
        // Skip null/undefined/empty values to preserve existing files in database
      });

      if (editingVehicle) {
        const response = await vehicleAPI.update(editingVehicle.VehicleID, formData);
        apiHelpers.showSuccess('Vehicle updated successfully!');
      } else {
        await vehicleAPI.create(formData);
        apiHelpers.showSuccess('Vehicle created successfully!');
      }

      resetForm();
      await fetchVehicles();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to save vehicle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (vehicle) => {
    try {
      // Fetch complete vehicle data with all URLs from API
      const response = await vehicleAPI.getById(vehicle.VehicleID);
      const completeVehicleData = response.data || response;

      setEditingVehicle(completeVehicleData);

      // Populate form with existing data, mapping backend field names to frontend
      const editData = { ...getInitialState() };

      // Use the complete vehicle data for mapping
      const vehicleToEdit = completeVehicleData;
    
    // Map backend data to frontend form fields
    const backendToFrontendMapping = {
      // Direct field mappings from API response
      VehicleID: 'VehicleID',
      VehicleRegistrationNo: 'VehicleRegistrationNo',
      VehicleCode: 'VehicleCode',
      VehicleChasisNo: 'VehicleChasisNo',
      VehicleModel: 'VehicleModel',
      TypeOfBody: 'TypeOfBody',
      VehicleType: 'VehicleType',
      VehicleRegistrationDate: 'VehicleRegistrationDate',
      VehicleAge: 'VehicleAge',
      VehicleKMS: 'VehicleKMS',
      VendorID: 'vendor_id',  // Map VendorID to vendor_id
      GPSCompany: 'GPSCompany',
      NoEntryPassStartDate: 'NoEntryPassStartDate',
      NoEntryPassExpiry: 'NoEntryPassExpiry',
      LastServicing: 'LastServicing',
      VehicleLoadingCapacity: 'VehicleLoadingCapacity',
      VehicleInsuranceCompany: 'VehicleInsuranceCompany',
      VehicleInsuranceDate: 'VehicleInsuranceDate',
      VehicleInsuranceExpiry: 'VehicleInsuranceExpiry',  // Direct mapping
      InsuranceExpiry: 'VehicleInsuranceExpiry',  // Fallback mapping
      VehicleFitnessCertificateIssue: 'VehicleFitnessCertificateIssue',
      VehicleFitnessCertificateExpiry: 'VehicleFitnessCertificateExpiry',  // Direct mapping
      FitnessExpiry: 'VehicleFitnessCertificateExpiry',  // Fallback mapping
      VehiclePollutionDate: 'VehiclePollutionDate',
      PollutionExpiry: 'VehiclePollutionExpiry',  // Map PollutionExpiry to VehiclePollutionExpiry
      StateTaxIssue: 'StateTaxIssue',
      StateTaxExpiry: 'StateTaxExpiry',

      // File path mappings - keep the raw paths for internal use
      RCUpload: 'RCUpload',
      VehicleKMSPhoto: 'VehicleKMSPhoto',
      VehiclePhoto: 'VehiclePhoto',
      VehiclePhotoFront: 'VehiclePhotoFront',
      VehiclePhotoBack: 'VehiclePhotoBack',
      VehiclePhotoLeftSide: 'VehiclePhotoLeftSide',
      VehiclePhotoRightSide: 'VehiclePhotoRightSide',
      VehiclePhotoInterior: 'VehiclePhotoInterior',
      VehiclePhotoEngine: 'VehiclePhotoEngine',
      VehiclePhotoRoof: 'VehiclePhotoRoof',
      VehiclePhotoDoor: 'VehiclePhotoDoor',
      ServiceBillPhoto: 'ServiceBillPhoto',
      InsuranceCopy: 'InsuranceCopy',
      FitnessCertificateUpload: 'FitnessCertificateUpload',
      PollutionPhoto: 'PollutionPhoto',
      StateTaxPhoto: 'StateTaxPhoto',
      NoEntryPassCopy: 'NoEntryPassCopy',

      // File URL mappings - these are what the DocumentUpload components need
      RCUpload_url: 'RCUpload_url',
      VehicleKMSPhoto_url: 'VehicleKMSPhoto_url',
      VehiclePhoto_url: 'VehiclePhoto_url',
      VehiclePhotoFront_url: 'VehiclePhotoFront_url',
      VehiclePhotoBack_url: 'VehiclePhotoBack_url',
      VehiclePhotoLeftSide_url: 'VehiclePhotoLeftSide_url',
      VehiclePhotoRightSide_url: 'VehiclePhotoRightSide_url',
      VehiclePhotoInterior_url: 'VehiclePhotoInterior_url',
      VehiclePhotoEngine_url: 'VehiclePhotoEngine_url',
      VehiclePhotoRoof_url: 'VehiclePhotoRoof_url',
      VehiclePhotoDoor_url: 'VehiclePhotoDoor_url',
      ServiceBillPhoto_url: 'ServiceBillPhoto_url',
      InsuranceCopy_url: 'InsuranceCopy_url',
      FitnessCertificateUpload_url: 'FitnessCertificateUpload_url',
      PollutionPhoto_url: 'PollutionPhoto_url',
      StateTaxPhoto_url: 'StateTaxPhoto_url',
      NoEntryPassCopy_url: 'NoEntryPassCopy_url',

      // Legacy mappings for backward compatibility
      vehicle_number: 'VehicleRegistrationNo',
      chassis_number: 'VehicleChasisNo',
      model: 'VehicleModel',
      body_type: 'TypeOfBody',
      registration_date: 'VehicleRegistrationDate',
      current_km_reading: 'VehicleKMS',
      insurance_company: 'VehicleInsuranceCompany',
      insurance_date: 'VehicleInsuranceDate',
      insurance_expiry: 'VehicleInsuranceExpiry',
      fitness_certificate_issue: 'VehicleFitnessCertificateIssue',
      fitness_expiry: 'VehicleFitnessCertificateExpiry',
      pollution_date: 'VehiclePollutionDate',
      pollution_expiry: 'VehiclePollutionExpiry',
      tax_issue_date: 'StateTaxIssue',
      tax_paid_upto: 'StateTaxExpiry',
      capacity_tons: 'VehicleLoadingCapacity',
      gps_company: 'GPSCompany',
      no_entry_pass_expiry: 'NoEntryPassExpiry',
      last_service_date: 'LastServicing'
    };
    
    // Define all date field names that need formatting
    const dateFields = [
      'VehicleRegistrationDate',
      'VehicleInsuranceDate',
      'VehicleInsuranceExpiry',
      'InsuranceExpiry',
      'VehicleFitnessCertificateIssue',
      'VehicleFitnessCertificateExpiry',
      'FitnessExpiry',
      'VehiclePollutionDate',
      'VehiclePollutionExpiry',
      'PollutionExpiry',
      'StateTaxIssue',
      'StateTaxExpiry',
      'NoEntryPassStartDate',
      'NoEntryPassExpiry',
      'LastServicing'
    ];

      // First try to populate with frontend field names (for backward compatibility)
      Object.keys(editData).forEach(key => {
        if (vehicleToEdit[key] !== undefined && vehicleToEdit[key] !== null) {
          if (dateFields.includes(key)) {
            editData[key] = formatDateForInput(vehicleToEdit[key]);
          } else {
            editData[key] = vehicleToEdit[key];
          }
        }
      });

      // Then populate with mapped backend field names
      Object.entries(backendToFrontendMapping).forEach(([backendKey, frontendKey]) => {
        if (vehicleToEdit[backendKey] !== undefined && vehicleToEdit[backendKey] !== null) {
          if (dateFields.includes(frontendKey)) {
            editData[frontendKey] = formatDateForInput(vehicleToEdit[backendKey]);
          } else {
            editData[frontendKey] = vehicleToEdit[backendKey];
          }
        }
      });

      // Special handling for vendor_id - ensure it's properly set even if null
      if (vehicleToEdit.VendorID !== undefined) {
        editData.vendor_id = vehicleToEdit.VendorID || '';
        console.log('🚛 VEHICLE EDIT - VendorID mapping:', {
          'vehicleToEdit.VendorID': vehicleToEdit.VendorID,
          'editData.vendor_id': editData.vendor_id
        });
      }

      // Handle special GPS and NoEntryPass fields
      if (vehicleToEdit.GPS !== undefined) {
        editData.GPS = (vehicleToEdit.GPS === 1 || vehicleToEdit.GPS === '1' || vehicleToEdit.GPS === 'Yes') ? 'Yes' : 'No';
      }
      if (vehicleToEdit.gps_enabled !== undefined) {
        editData.GPS = vehicleToEdit.gps_enabled ? 'Yes' : 'No';
      }

      if (vehicleToEdit.NoEntryPass !== undefined) {
        editData.NoEntryPass = (vehicleToEdit.NoEntryPass === 1 || vehicleToEdit.NoEntryPass === '1' || vehicleToEdit.NoEntryPass === 'Yes') ? 'Yes' : 'No';
      }
      if (vehicleToEdit.no_entry_pass !== undefined) {
        editData.NoEntryPass = vehicleToEdit.no_entry_pass ? 'Yes' : 'No';
      }
    
      console.log('🚛 VEHICLE EDIT - Setting vehicleData with editData:', editData);
      console.log('🚛 VEHICLE EDIT - vendor_id in editData:', editData.vendor_id);
      setVehicleData(editData);
      setErrors({});

      // Scroll to top of the page to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching complete vehicle data:', error);
      // Fallback to using the passed vehicle data
      setEditingVehicle(vehicle);

      // Still populate form with available data
      const editData = { ...getInitialState() };
      Object.keys(editData).forEach(key => {
        if (vehicle[key] !== undefined && vehicle[key] !== null) {
          editData[key] = vehicle[key];
        }
      });

      setVehicleData(editData);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
      apiHelpers.showError('Could not fetch complete vehicle data. Some images may not display.');
    }
  };

  // Handle file deletion during edit
  const handleFileDelete = async (fieldName, fileName) => {
    try {
      if (!editingVehicle) {
        throw new Error('No vehicle being edited');
      }



      // Call API to delete file
      await vehicleAPI.deleteFile(editingVehicle.VehicleID, fieldName);

      // Update the editing vehicle data to remove the file reference
      setEditingVehicle(prev => ({
        ...prev,
        [fieldName]: null
      }));

      // Update form data to remove the file
      setVehicleData(prev => ({
        ...prev,
        [fieldName]: null
      }));

      apiHelpers.showSuccess(`File deleted successfully`);

    } catch (error) {
      console.error('❌ Error deleting vehicle file:', error);
      apiHelpers.showError(error, 'Failed to delete file');
      throw error; // Re-throw so EditFileManager can handle the error state
    }
  };

  // Helper function to render EditFileManager for file fields
  const renderFileField = (fieldName, label, options = {}) => {
    const { accept = "image/*,.pdf,.doc,.docx,.txt", required = false } = options;

    return (
      <EditFileManager
        fieldName={fieldName}
        label={label}
        value={vehicleData[fieldName]}
        onChange={(file) => setVehicleData(prev => ({ ...prev, [fieldName]: file }))}
        onDelete={handleFileDelete}
        accept={accept}
        required={required}
        error={errors[fieldName]}
        existingFileUrl={editingVehicle?.[fieldName]}
        entityType="vehicles"
        entityId={editingVehicle?.VehicleID}
        isEditing={!!editingVehicle}
        showPreview={true}
      />
    );
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete vehicle "${vehicle.VehicleRegistrationNo}"?`)) {
      return;
    }

    try {
      await vehicleAPI.delete(vehicle.VehicleID);
      apiHelpers.showSuccess('Vehicle deleted successfully!');
      await fetchVehicles();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to delete vehicle');
    }
  };

  // Render form field helper
  const renderFormField = (label, name, type = 'text', options = {}, required = false) => {
    const { placeholder, values, accept, rows = 3, max, min, title, pattern, readOnly } = options;
    const isFile = type === 'file';
    const isRadio = type === 'radio';
    const isSelect = type === 'select';
    const isTextarea = type === 'textarea';
    const isNumber = type === 'number';

    const id = `vehicle-${name}`;

    // Check for expiry status on date fields
    const expiryStatus = (type === 'date' && vehicleData[name]) ? getExpiryStatus(name, vehicleData[name]) : null;

    return (
      <div className={`form-group ${options.fullWidth ? 'full-width' : ''} ${expiryStatus ? expiryStatus.className : ''}`}>
        <label htmlFor={id}>
          {label} {required && <span className="required-indicator">*</span>}
          {name.includes('Photo') && <span className="photo-indicator"> 📷</span>}
          {name.includes('Expiry') && <span className="expiry-indicator"> ⚠️</span>}
          {name.includes('CRM') && <span className="crm-indicator"> 🔗</span>}
          {expiryStatus && (
            <span className={`expiry-indicator ${expiryStatus.status}`}>
              {expiryStatus.message}
            </span>
          )}
        </label>
        
        {isRadio ? (
          <div className="radio-group">
            {values.map(val => (
              <label key={val}>
                <input
                  type="radio"
                  id={`${id}-${val}`}
                  name={name}
                  value={val}
                  checked={vehicleData[name] === val}
                  onChange={handleInputChange}
                />
                {val}
              </label>
            ))}
          </div>
        ) : isSelect ? (
          <select id={id} name={name} value={vehicleData[name]} onChange={handleInputChange} required={required}>
            {values.map(val => <option key={val} value={val}>{val}</option>)}
          </select>
        ) : isTextarea ? (
          <textarea
            id={id}
            name={name}
            value={vehicleData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        ) : (
          <input
            type={type}
            id={id}
            name={name}
            value={type !== 'file' ? vehicleData[name] : undefined}
            onChange={handleInputChange}
            placeholder={placeholder}
            accept={accept}
            required={required}
            max={max}
            min={min}
            title={title}
            pattern={pattern}
            className={errors[name] ? 'error' : ''}
            readOnly={readOnly || name === 'VehicleAge' || name === 'DriverTotalExperience'}
          />
        )}

        {isFile && renderFilePreview(name, label)}
        {errors[name] && <div className="error-message">{errors[name]}</div>}
      </div>
    );
  };

  const vehicleColumns = [
    { key: 'VehicleRegistrationNo', label: 'Registration No', sortable: true },
    { key: 'VehicleCode', label: 'Vehicle Code', sortable: true },
    { key: 'VehicleModel', label: 'Model', sortable: true },
    { key: 'TypeOfBody', label: 'Body Type', sortable: true },
    {
      key: 'GPS',
      label: 'GPS',
      sortable: true,
      render: (value) => value === 1 || value === '1' || value === 'Yes' ? '✅ Yes' : '❌ No'
    },
  ];

  return (
    <div className="vehicle-form-container">
      {/* Header */}
      <div className="form-header">
        <h1>🚛 Vehicle Master</h1>
        <p>Comprehensive vehicle onboarding and management system</p>



        {/* Edit Mode Notice */}
        {editingVehicle && (
          <div className="edit-notice">
            <span className="edit-notice-text">
              Editing: <strong className="edit-notice-item">{editingVehicle.VehicleRegistrationNo}</strong>
            </span>
            <button type="button" onClick={resetForm} className="cancel-edit-btn">
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="vehicle-form">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-sections">




            {/* Vehicle Information Section */}
            <div className="form-section">
              <h4>Vehicle Information</h4>
              <div className="form-grid">
                {/* Vehicle Basic Info - Simple Straight Line */}
                <div className="form-field">
                  <label className="form-field-label">
                    Vehicle Registration No. <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="VehicleRegistrationNo"
                    value={vehicleData.VehicleRegistrationNo}
                    onChange={handleInputChange}
                    placeholder="Registration number"
                    required
                    className={errors.VehicleRegistrationNo ? 'error' : ''}
                  />
                  {errors.VehicleRegistrationNo && <div className="form-field-error">{errors.VehicleRegistrationNo}</div>}
                </div>

                <div className="form-field">
                  <label className="form-field-label">
                    Assigned Vendor <span className="required-indicator">*</span>
                  </label>
                  <SearchableDropdown
                    name="vendor_id"
                    value={vehicleData.vendor_id}
                    onChange={handleInputChange}
                    apiCall={async () => {
                      try {
                        const response = await vendorAPI.getAll();
                        // Handle different response formats
                        const vendors = response.data || [];
                        return { data: vendors };
                      } catch (error) {

                        return { data: [] };
                      }
                    }}
                    valueKey="VendorID"
                    labelKey="VendorName"
                    formatLabel={(vendor) => `${vendor.VendorName || 'Unknown Vendor'} (ID: ${vendor.VendorID})`}
                    placeholder="Select vendor (required)"
                    allowEmpty={false}
                    required={true}
                    searchPlaceholder="Search vendors..."
                  />
                </div>

                <div className="form-field">
                  <label className="form-field-label">
                    Vehicle Code <span className="required-indicator">*</span>
                  </label>
                  <input
                    type="text"
                    name="VehicleCode"
                    value={vehicleData.VehicleCode}
                    onChange={handleInputChange}
                    placeholder="Auto-generated based on database links"
                    required
                    className={errors.VehicleCode ? 'error' : ''}
                    readOnly
                  />
                  {errors.VehicleCode && <div className="form-field-error">{errors.VehicleCode}</div>}
                </div>

                <NewDocumentUpload
                  label="RC Upload"
                  name="RCUpload"
                  value={vehicleData.RCUpload}
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  required={false}
                  error={errors.RCUpload}
                />
                {renderFormField('Vehicle Chassis No.', 'VehicleChasisNo', 'text', { placeholder: 'Chassis number' }, true)}
                {renderFormField('Vehicle Model', 'VehicleModel', 'text', { placeholder: 'Vehicle model' }, true)}
                {renderFormField('Type of Body', 'TypeOfBody', 'select', { values: ['Open', 'CBD', 'Container'] }, true)}
                {renderFormField('Vehicle Type', 'VehicleType', 'select', {
                  values: ['LP', 'LPT', 'Tata Ace', 'Pickup', 'Tata 407 10ft', 'Tata 407 14ft', 'Eicher 17ft']
                })}
                {renderFormField('Vehicle Registration Year/Date', 'VehicleRegistrationDate', 'date', {
                  title: 'Enter date in YYYY-MM-DD format (8 digits)',
                  pattern: '\d{4}-\d{2}-\d{2}'
                })}
                {renderFormField('Vehicle Age (auto-calculated)', 'VehicleAge', 'number', { placeholder: 'Auto-calculated from registration date' })}
                {renderFormField('Vehicle KMS 📷', 'VehicleKMS', 'number', { placeholder: 'Odometer reading' })}
                <NewDocumentUpload
                  label="Vehicle KMS Photo (clear photo required) 📷"
                  name="VehicleKMSPhoto"
                  value={vehicleData.VehicleKMSPhoto}
                  onChange={handleInputChange}
                  accept=".jpg,.jpeg,.png"
                  required={false}
                  error={errors.VehicleKMSPhoto}
                />

                {/* Multiple Vehicle Photos Section */}
                <div className="form-field full-width">
                  <label className="form-field-label">
                    Vehicle Photos 📷 <span className="required-indicator">*</span>
                  </label>
                  <div className="vehicle-photos-grid">
                    <NewDocumentUpload
                      label="Front View"
                      name="VehiclePhotoFront"
                      value={vehicleData.VehiclePhotoFront}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Back View"
                      name="VehiclePhotoBack"
                      value={vehicleData.VehiclePhotoBack}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Left Side View"
                      name="VehiclePhotoLeftSide"
                      value={vehicleData.VehiclePhotoLeftSide}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Right Side View"
                      name="VehiclePhotoRightSide"
                      value={vehicleData.VehiclePhotoRightSide}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Interior/Dashboard"
                      name="VehiclePhotoInterior"
                      value={vehicleData.VehiclePhotoInterior}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Engine Bay"
                      name="VehiclePhotoEngine"
                      value={vehicleData.VehiclePhotoEngine}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Roof View"
                      name="VehiclePhotoRoof"
                      value={vehicleData.VehiclePhotoRoof}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                    <NewDocumentUpload
                      label="Door View"
                      name="VehiclePhotoDoor"
                      value={vehicleData.VehiclePhotoDoor}
                      onChange={handleInputChange}
                      accept=".jpg,.jpeg,.png"
                    />
                  </div>
                  <small className="photo-hint">
                    📸 Please upload clear, well-lit photos from all angles. At least front and back views are required.
                  </small>
                </div>

                {renderFormField('Last Servicing', 'LastServicing', 'date', {})}
                <NewDocumentUpload
                  label="Service Bill Photo"
                  name="ServiceBillPhoto"
                  value={vehicleData.ServiceBillPhoto}
                  onChange={handleInputChange}
                  accept=".jpg,.jpeg,.png,.pdf"
                />
                {renderFormField('Vehicle Insurance Company', 'VehicleInsuranceCompany', 'text', { placeholder: 'Insurance provider' })}
                {renderFormField('Vehicle Insurance Date', 'VehicleInsuranceDate', 'date', {
                  max: new Date().toISOString().split('T')[0],
                  title: 'Insurance date must be today or earlier'
                })}
                {renderFormField('Vehicle Insurance Validity ⚠️', 'VehicleInsuranceExpiry', 'date', {})}
                <NewDocumentUpload
                  label="Insurance Copy"
                  name="InsuranceCopy"
                  value={vehicleData.InsuranceCopy}
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {renderFormField('Vehicle Fitness Certificate Issue', 'VehicleFitnessCertificateIssue', 'date', {})}
                {renderFormField('Vehicle Fitness Certificate Validity ⚠️', 'VehicleFitnessCertificateExpiry', 'date', {})}
                <NewDocumentUpload
                  label="Fitness Certificate Upload"
                  name="FitnessCertificateUpload"
                  value={vehicleData.FitnessCertificateUpload}
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                {renderFormField('Vehicle Pollution Date', 'VehiclePollutionDate', 'date', {})}
                {renderFormField('Vehicle Pollution Validity ⚠️', 'VehiclePollutionExpiry', 'date', {})}
                <NewDocumentUpload
                  label="Pollution Photo (clear photo required) 📷"
                  name="PollutionPhoto"
                  value={vehicleData.PollutionPhoto}
                  onChange={handleInputChange}
                  accept=".jpg,.jpeg,.png"
                />
                {renderFormField('State Tax Issue', 'StateTaxIssue', 'date', {})}
                {renderFormField('State Tax Validity ⚠️', 'StateTaxExpiry', 'date', {})}
                <NewDocumentUpload
                  label="State Tax Photo (clear photo required) 📷"
                  name="StateTaxPhoto"
                  value={vehicleData.StateTaxPhoto}
                  onChange={handleInputChange}
                  accept=".jpg,.jpeg,.png"
                />
                <div className="form-field">
                  <label className="form-field-label">
                    Vehicle Loading Capacity <span className="required-indicator">*</span>
                  </label>
                  <div className="input-with-unit">
                    <input
                      type="number"
                      name="VehicleLoadingCapacity"
                      value={vehicleData.VehicleLoadingCapacity}
                      onChange={handleInputChange}
                      placeholder="Enter capacity"
                      required
                      min="0"
                      className={errors.VehicleLoadingCapacity ? 'error' : ''}
                    />
                    <span className="unit-indicator">KG</span>
                  </div>
                  {errors.VehicleLoadingCapacity && <div className="form-field-error">{errors.VehicleLoadingCapacity}</div>}
                  <small className="field-hint">Enter the maximum loading capacity in kilograms</small>
                </div>
                {renderFormField('GPS', 'GPS', 'radio', { values: ['Yes', 'No'] })}
                {renderFormField('GPS Company', 'GPSCompany', 'text', { placeholder: 'GPS provider name' })}
                {renderFormField('No Entry Pass ⚠️', 'NoEntryPass', 'radio', { values: ['Yes', 'No'] })}
                {renderFormField('No Entry Pass Start Date', 'NoEntryPassStartDate', 'date', {})}
                {renderFormField('No Entry Pass Expiry ⚠️', 'NoEntryPassExpiry', 'date', {})}
                <NewDocumentUpload
                  label="No Entry Pass Copy"
                  name="NoEntryPassCopy"
                  value={vehicleData.NoEntryPassCopy}
                  onChange={handleInputChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>
            <div className="form-section">
              <h4>Vehicle Freight</h4>
              <div className="form-grid">
                {renderFormField('Fix Rate', 'FixRate', 'number', { placeholder: 'Enter fix rate' })}
                {renderFormField('Fuel Rate', 'FuelRate', 'number', { placeholder: 'Enter fuel rate' })}
                {renderFormField('Handling Charges', 'HandlingCharges', 'number', { placeholder: 'Enter handling charges' })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Processing...' : editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
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
          entity="vehicles"
          entityDisplayName="Vehicles"
          expectedFields={50}
        />
      </div>

      {/* Data Table */}
      <DataTable
        title="📋 Vehicle Master List"
        data={vehicles}
        columns={vehicleColumns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        keyField="VehicleID"
        emptyMessage="No vehicles found. Add your first vehicle above."
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


    </div>
  );
};

export default VehicleForm;
