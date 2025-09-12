import React, { useState, useEffect } from 'react';
import { vendorAPI, projectAPI, customerAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import ExportButton from '../components/ExportButton';
import AddressForm from '../components/AddressForm';
import NewDocumentUpload from '../components/NewDocumentUpload';
import ExistingDocumentUpload from '../components/ExistingDocumentUpload';
import ValidatedInput from '../components/ValidatedInput';
import BankDetails from '../components/BankDetails';
import ValidationErrorModal from '../components/ValidationErrorModal';
import useFormValidation from '../hooks/useFormValidation';
import Dropdown from '../components/Dropdown';
import './VendorForm.css';

const VendorForm = () => {
  const getInitialState = () => ({
    // Basic Information
    vendor_name: '',
    vendor_mobile_no: '',
    project_id: '', // Project assignment
    customer_id: '', // Customer assignment
    // Structured Address Fields
    house_flat_no: '',
    street_locality: '',
    city: '',
    state: '',
    pin_code: '',
    country: 'India',
    vendor_alternate_no: '',

    // Personal Documents
    vendor_aadhar: '',
    vendor_pan: '',

    // Company Information
    vendor_company_name: '',
    vendor_company_udhyam: '',
    vendor_company_pan: '',
    vendor_company_gst: '',
    type_of_company: 'Proprietorship',
    start_date_of_company: '',
    address_of_company: '',

    // Bank Details (legacy field - will be replaced by structured bank details)
    bank_details: '',
  });

  // Structured Bank Details State
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    branch_address: '',
    city: '',
    state: ''
  });

  const [files, setFiles] = useState({
    vendor_photo: null,
    vendor_aadhar_doc: null,
    vendor_pan_doc: null,
    vendor_company_udhyam_doc: null,
    vendor_company_pan_doc: null,
    vendor_company_gst_doc: null,
    company_legal_docs: null,
    bank_cheque_upload: null,
  });

  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Global validation system
  const {
    validateForm: validateFormGlobal,
    validateBeforeSubmit,
    showErrorModal,
    closeErrorModal,
    errorSummary,
    goToField,
    isValidating
  } = useFormValidation('vendor', {
    // Custom validation functions for vendor-specific rules
    vendor_name: (value) => {
      if (value && value.length < 2) {
        return { isValid: false, error: 'Vendor name must be at least 2 characters' };
      }
      return { isValid: true, error: null };
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);

  useEffect(() => {
    fetchVendors();
    fetchCustomers();
    fetchProjects();
  }, []);



  // Handle editing vendor data population
  useEffect(() => {
    if (editingVendor) {


      // Map database field names to form field names (using actual API field names)
      const mappedData = {
        vendor_name: editingVendor.VendorName || '',
        vendor_mobile_no: editingVendor.VendorMobileNo || '',
        project_id: editingVendor.project_id || '',
        customer_id: editingVendor.customer_id || '',
        // Address fields
        house_flat_no: editingVendor.HouseFlatNo || '',
        street_locality: editingVendor.StreetLocality || '',
        city: editingVendor.City || '',
        state: editingVendor.State || '',
        pin_code: editingVendor.PinCode || '',
        country: editingVendor.Country || 'India',
        vendor_alternate_no: editingVendor.VendorAlternateNo || '',
        vendor_aadhar: editingVendor.VendorAadhar || '',
        vendor_pan: editingVendor.VendorPAN || '',
        // Company fields
        vendor_company_name: editingVendor.CompanyName || '',
        vendor_company_udhyam: editingVendor.VendorCompanyUdhyam || '',
        vendor_company_pan: editingVendor.VendorCompanyPAN || '',
        vendor_company_gst: editingVendor.CompanyGST || '',
        type_of_company: editingVendor.TypeOfCompany || 'Proprietorship',
        start_date_of_company: editingVendor.StartDateOfCompany ? editingVendor.StartDateOfCompany.split('T')[0] : '',
        address_of_company: editingVendor.AddressOfCompany || '',
        bank_details: editingVendor.BankDetails || '',

        // File/Document fields - use actual API field names
        vendor_photo: editingVendor.VendorPhoto || null,
        vendor_photo_url: editingVendor.vendor_photo_url || null,
        vendor_aadhar_doc: editingVendor.VendorAadharDoc || null,
        vendor_aadhar_doc_url: editingVendor.vendor_aadhar_doc_url || null,
        vendor_pan_doc: editingVendor.VendorPANDoc || null,
        vendor_pan_doc_url: editingVendor.vendor_pan_doc_url || null,
        vendor_company_udhyam_doc: editingVendor.VendorCompanyUdhyamDoc || null,
        vendor_company_udhyam_doc_url: editingVendor.vendor_company_udhyam_doc_url || null,
        vendor_company_pan_doc: editingVendor.VendorCompanyPANDoc || null,
        vendor_company_pan_doc_url: editingVendor.vendor_company_pan_doc_url || null,
        vendor_company_gst_doc: editingVendor.VendorCompanyGSTDoc || null,
        vendor_company_gst_doc_url: editingVendor.vendor_company_gst_doc_url || null,
        company_legal_docs: editingVendor.CompanyLegalDocs || null,
        company_legal_docs_url: editingVendor.company_legal_docs_url || null,
        bank_cheque_upload: editingVendor.BankChequeUpload || null,
        bank_cheque_upload_url: editingVendor.bank_cheque_upload_url || null
      };

      setVendorData(mappedData);

      // Map bank details
      const mappedBankDetails = {
        account_holder_name: editingVendor.AccountHolderName || editingVendor.account_holder_name || '',
        account_number: editingVendor.AccountNumber || editingVendor.account_number || '',
        ifsc_code: editingVendor.IFSCCode || editingVendor.ifsc_code || '',
        bank_name: editingVendor.BankName || editingVendor.bank_name || '',
        branch_name: editingVendor.BranchName || editingVendor.branch_name || '',
        branch_address: editingVendor.BranchAddress || editingVendor.branch_address || '',
        city: editingVendor.BankCity || editingVendor.bank_city || '',
        state: editingVendor.BankState || editingVendor.bank_state || ''
      };


      setBankDetails(mappedBankDetails);

      // Reset files state for edit mode - only new file uploads should be in files state
      // Existing files are handled through the _url fields in vendorData
      setFiles({
        vendor_photo: null,
        vendor_aadhar_doc: null,
        vendor_pan_doc: null,
        vendor_company_udhyam_doc: null,
        vendor_company_pan_doc: null,
        vendor_company_gst_doc: null,
        company_legal_docs: null,
        bank_cheque_upload: null,
      });

      setErrors({});


    }
  }, [editingVendor]);

  // Handle address changes from AddressForm component
  const handleAddressChange = (newAddressData) => {

    setVendorData(prev => {
      const updated = {
        ...prev,
        ...newAddressData,
        // Also update the combined address field for backward compatibility
        vendor_address: `${newAddressData.house_flat_no || ''}, ${newAddressData.street_locality || ''}, ${newAddressData.city || ''}, ${newAddressData.state || ''}, ${newAddressData.pin_code || ''}${newAddressData.country && newAddressData.country !== 'India' ? ', ' + newAddressData.country : ''}`
      };

      return updated;
    });
  };

  // Get address data for AddressForm component
  const getAddressData = () => ({
    house_flat_no: vendorData.house_flat_no || '',
    street_locality: vendorData.street_locality || '',
    city: vendorData.city || '',
    state: vendorData.state || '',
    pin_code: vendorData.pin_code || '',
    country: vendorData.country || 'India'
  });

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await vendorAPI.getAll();
      const body = response?.data ?? response;
      const list = Array.isArray(body) ? body : (Array.isArray(body?.value) ? body.value : []);

      // Normalize to the keys our table expects (from existing vendor table)
      const normalized = list.map((v) => {
        return {
          ...v, // Keep all original fields for edit functionality
          vendor_id: v.VendorID ?? v.vendor_id ?? v.id ?? null,
          vendor_name: v.VendorName ?? v.vendor_name ?? v.name ?? v.Name ?? '',
          vendor_mobile_no: v.VendorMobileNo ?? v.vendor_mobile_no ?? v.mobile ?? v.MobileNo ?? v.Mobile ?? '',
          type_of_company: v.TypeOfCompany ?? v.type_of_company ?? '',
          vendor_company_name: v.CompanyName ?? v.vendor_company_name ?? v.company_name ?? '',
          vendor_company_gst: v.CompanyGST ?? v.vendor_company_gst ?? v.company_gst ?? '',
          vendor_address: v.VendorAddress ?? v.vendor_address ?? v.address_of_company ?? v.Address ?? '',
          vendor_photo: v.VendorPhoto ?? v.vendor_photo ?? null,
        };
      });


      setVendors(normalized);
    } catch (error) {
      console.error('🚨 FETCH ERROR:', error);
      apiHelpers.showError(error, 'Failed to fetch vendors');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to load customers');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to load projects');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVendorData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({
        ...prev,
        [name]: selectedFiles[0]
      }));
    }
  };

  // Enhanced file change handler for new component
  const handleEnhancedFileChange = (fieldName, file) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const getFilePreview = (file) => {
    if (!file) return null;

    if (file.type && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  // Helper function to get existing image URL from database path
  const getExistingImageUrl = (imagePath) => {
    if (!imagePath) {
      return null;
    }

    // Check if it's already a full URL
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // Create URL for server-stored image - use backend port 3003
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003';

    // Extract just the filename from the path
    let filename = imagePath;
    if (imagePath.includes('/') || imagePath.includes('\\')) {
      filename = imagePath.split(/[\\/]/).pop();
    }

    // Use the proper API endpoint for vendors
    const fullUrl = `${baseUrl}/api/vendors/files/${filename}`;

    return fullUrl;
  };

  // State for modal viewer
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Helper function to render comprehensive file preview (images and documents)
  const renderFilePreview = (fieldName, displayName = null) => {
    const newFile = files[fieldName];

    // Map frontend field names to URL field names
    const urlFieldMapping = {
      'vendor_photo': 'vendor_photo_url',
      'vendor_aadhar_doc': 'vendor_aadhar_doc_url',
      'vendor_pan_doc': 'vendor_pan_doc_url',
      'vendor_company_udhyam_doc': 'vendor_company_udhyam_doc_url',
      'vendor_company_pan_doc': 'vendor_company_pan_doc_url',
      'vendor_company_gst_doc': 'vendor_company_gst_doc_url',
      'company_legal_docs': 'company_legal_docs_url',
      'bank_cheque_upload': 'bank_cheque_upload_url'
    };

    const urlFieldName = urlFieldMapping[fieldName] || fieldName;
    const existingPath = editingVendor?.[urlFieldName];



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

    const fileToShow = newFile || existingPath;
    const isNewFile = !!newFile;
    const isImageFile = isImage(fileToShow);



    return (
      <div className="file-preview">
        {isImageFile ? (
          <img
            src={isNewFile ? getFilePreview(newFile) : getExistingImageUrl(existingPath)}
            alt={`${displayName || fieldName} Preview`}
            className="image-preview clickable-preview"
            onClick={() => {
              setModalImage(isNewFile ? getFilePreview(newFile) : getExistingImageUrl(existingPath));
              setShowModal(true);
            }}
            onError={(e) => {
              e.target.style.display = 'none';

            }}
            onLoad={() => {

            }}
            title="Click to view full size"
          />
        ) : (
          <div className="document-preview">
            <span className="document-icon">{getFileIcon(isNewFile ? newFile.name : existingPath)}</span>
            <span className="document-type">{isNewFile ? (newFile.type || 'Document') : 'Document'}</span>
            {!isNewFile && existingPath && (
              <a
                href={getExistingImageUrl(existingPath)}
                target="_blank"
                rel="noopener noreferrer"
                className="document-link"
                onClick={() => {}}
              >
                View Document
              </a>
            )}
          </div>
        )}
        <div className="file-info">
          {isNewFile ? (
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Note: Validation patterns moved to centralized validation system

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!vendorData.vendor_name.trim()) {
      newErrors.vendor_name = 'Vendor name is required';
    }
    
    if (!vendorData.vendor_mobile_no.trim()) {
      newErrors.vendor_mobile_no = 'Mobile number is required';
    } else if (!patterns.mobile.test(vendorData.vendor_mobile_no.trim())) {
      newErrors.vendor_mobile_no = 'Enter valid 10-digit mobile number starting with 6-9';
    }
    
    // Address validation - More lenient, only validate if provided
    // Only validate pin code format if it's provided
    if (vendorData.pin_code.trim() && !/^\d{6}$/.test(vendorData.pin_code.trim())) {
      newErrors.pin_code = 'Pin Code must be exactly 6 digits';
    }

    // Basic address validation - at least city should be provided if any address field is filled
    const hasAnyAddressField = vendorData.house_flat_no.trim() ||
                              vendorData.street_locality.trim() ||
                              vendorData.city.trim() ||
                              vendorData.state.trim() ||
                              vendorData.pin_code.trim();

    if (hasAnyAddressField) {
      if (!vendorData.city.trim()) {
        newErrors.city = 'City is required when address is provided';
      }
      if (!vendorData.state.trim()) {
        newErrors.state = 'State is required when address is provided';
      }
    }

    // Note: Identification field validation now handled by ValidatedInput components

    // PAN validation removed as per requirement
    // GST validation removed as per requirement

    // File size validation (5MB limit)
    Object.keys(files).forEach(fileKey => {
      if (files[fileKey] && files[fileKey].size > 5 * 1024 * 1024) {
        newErrors[fileKey] = 'File size must be less than 5MB';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setVendorData(getInitialState());

    // Reset bank details
    setBankDetails({
      account_holder_name: '',
      account_number: '',
      ifsc_code: '',
      bank_name: '',
      branch_name: '',
      branch_address: '',
      city: '',
      state: ''
    });

    setFiles({
      vendor_photo: null,
      vendor_aadhar_doc: null,
      vendor_pan_doc: null,
      vendor_company_udhyam_doc: null,
      vendor_company_pan_doc: null,
      vendor_company_gst_doc: null,
      company_legal_docs: null,
      bank_cheque_upload: null,
    });
    setErrors({});
    setEditingVendor(null);

    // Reset file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  // Direct backend export function
  const handleExportVendors = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const exportUrl = `${API_BASE_URL}/api/export/vendors`;

      // Show loading message
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #007bff; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      loadingToast.textContent = '🔄 Exporting vendors... Please wait';
      document.body.appendChild(loadingToast);

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `Vendor_Master_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      successToast.innerHTML = `✅ Vendor Export Started!<br><small>Downloading ALL 26+ vendor master fields</small>`;
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

    // Prepare complete form data including bank details
    const completeFormData = {
      ...vendorData,
      ...bankDetails
    };

    // Use global validation system with error modal and cursor movement
    const isValid = await validateBeforeSubmit(
      completeFormData,
      // Success callback
      async (validatedData) => {
        setIsSubmitting(true);
        await submitVendorData(validatedData);
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
  const submitVendorData = async (validatedData) => {

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Prepare vendor data using validated data
      const vendorPayload = {
        vendor_name: validatedData.vendor_name?.trim() || vendorData.vendor_name.trim(),
        vendor_mobile_no: validatedData.vendor_mobile_no?.trim() || vendorData.vendor_mobile_no.trim(),
        project_id: vendorData.project_id || null, // Project assignment
        customer_id: vendorData.customer_id || null, // Customer assignment
        // Combine address fields for backward compatibility
        vendor_address: `${vendorData.house_flat_no.trim()}, ${vendorData.street_locality.trim()}, ${vendorData.city.trim()}, ${vendorData.state.trim()}, ${vendorData.pin_code.trim()}${vendorData.country.trim() ? ', ' + vendorData.country.trim() : ''}`,
        // Individual address fields
        house_flat_no: vendorData.house_flat_no.trim(),
        street_locality: vendorData.street_locality.trim(),
        city: vendorData.city.trim(),
        state: vendorData.state.trim(),
        pin_code: vendorData.pin_code.trim(),
        country: vendorData.country.trim() || 'India',
        vendor_alternate_no: vendorData.vendor_alternate_no.trim() || null,
        vendor_aadhar: vendorData.vendor_aadhar.trim().toUpperCase() || null,
        vendor_pan: vendorData.vendor_pan.trim().toUpperCase() || null,
        vendor_company_name: vendorData.vendor_company_name.trim() || null,
        vendor_company_udhyam: vendorData.vendor_company_udhyam.trim() || null,
        vendor_company_pan: vendorData.vendor_company_pan.trim().toUpperCase() || null,
        vendor_company_gst: vendorData.vendor_company_gst.trim().toUpperCase() || null,
        type_of_company: vendorData.type_of_company,
        start_date_of_company: vendorData.start_date_of_company || null,
        address_of_company: vendorData.address_of_company.trim() || null,
        bank_details: vendorData.bank_details.trim() || null,
        // Structured Bank Details
        account_holder_name: bankDetails.account_holder_name.trim() || null,
        account_number: bankDetails.account_number.trim() || null,
        ifsc_code: bankDetails.ifsc_code.trim() || null,
        bank_name: bankDetails.bank_name.trim() || null,
        branch_name: bankDetails.branch_name.trim() || null,
        branch_address: bankDetails.branch_address.trim() || null,
        bank_city: bankDetails.city.trim() || null,
        bank_state: bankDetails.state.trim() || null,
      };
      
      // Add vendor data as JSON string (for backends expecting nested JSON)
      formData.append('vendorData', JSON.stringify(vendorPayload));

      // Also add flattened fields (for backends expecting top-level form fields)
      Object.entries(vendorPayload).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          formData.append(k, v);
        }
        // Skip null/undefined/empty values to preserve existing data in database
      });

      // Add files only if selected
      console.log('🔍 VENDOR UPDATE - files state:', files);
      Object.keys(files).forEach(fileKey => {
        if (files[fileKey]) {
          console.log(`🔍 VENDOR UPDATE - Adding file ${fileKey}:`, files[fileKey]);
          formData.append(fileKey, files[fileKey]);
        } else {
          console.log(`🔍 VENDOR UPDATE - Skipping empty file ${fileKey}`);
        }
      });

      // Debug: Log what's being sent to backend
      console.log('🔍 VENDOR UPDATE - FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }

      if (editingVendor) {
        console.log('🔍 VENDOR UPDATE - Updating vendor ID:', editingVendor.vendor_id ?? editingVendor.VendorID);
        await vendorAPI.update(editingVendor.vendor_id ?? editingVendor.VendorID, formData);
        apiHelpers.showSuccess('Vendor updated successfully!');
      } else {
        await vendorAPI.create(formData);
        apiHelpers.showSuccess('Vendor created successfully!');
      }

      resetForm();
      await fetchVendors();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to save vendor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (vendor) => {
    try {
      // Fetch complete vendor data with all URLs from API
      const response = await vendorAPI.getById(vendor.VendorID || vendor.vendor_id);
      const completeVendorData = response.data || response; // Handle both response.data and direct data

      setEditingVendor(completeVendorData);

      // Scroll to top of the page to show the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error fetching complete vendor data:', error);
      // Fallback to using the passed vendor data
      setEditingVendor(vendor);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      apiHelpers.showError('Could not fetch complete vendor data. Some images may not display.');
    }
  };

  const handleDelete = async (vendor) => {
    if (!window.confirm(`Are you sure you want to delete vendor "${vendor.vendor_name}"?`)) {
      return;
    }

    try {
      await vendorAPI.delete(vendor.vendor_id);
      apiHelpers.showSuccess('Vendor deleted successfully!');
      await fetchVendors();
    } catch (error) {
      apiHelpers.showError(error, 'Failed to delete vendor');
    }
  };

  // Handle file deletion during edit
  const handleFileDelete = async (fieldName, fileName) => {
    try {
      if (!editingVendor) {
        throw new Error('No vendor being edited');
      }



      // Call API to delete file
      await vendorAPI.deleteFile(editingVendor.VendorID, fieldName);

      // Update the editing vendor data to remove the file reference
      setEditingVendor(prev => ({
        ...prev,
        [fieldName]: null
      }));

      // Update form data to remove the file
      setVendorData(prev => ({
        ...prev,
        [fieldName]: null
      }));

      apiHelpers.showSuccess(`File deleted successfully`);

    } catch (error) {

      apiHelpers.showError(error, 'Failed to delete file');
      throw error; // Re-throw so DocumentUpload can handle the error state
    }
  };

  const vendorColumns = [
    { 
      key: 'vendor_name', 
      label: 'Vendor Name', 
      sortable: true,
      minWidth: '150px'
    },
    {
      key: 'vendor_mobile_no',
      label: 'Mobile',
      sortable: true,
      minWidth: '120px',
      render: (value) => value || '-'
    },
    {
      key: 'project_name',
      label: 'Project',
      sortable: true,
      minWidth: '150px',
      render: (value, row) => {
        // Display project name if available, otherwise show "Not Assigned"
        return value || (row.project_id ? 'Project ID: ' + row.project_id : 'Not Assigned');
      }
    },
    {
      key: 'type_of_company',
      label: 'Company Type',
      sortable: true,
      minWidth: '130px'
    },
    { 
      key: 'vendor_company_name', 
      label: 'Company Name', 
      sortable: true,
      minWidth: '150px',
      render: (value) => value || '-'
    },
    { 
      key: 'vendor_company_gst', 
      label: 'GST No.', 
      sortable: true,
      minWidth: '150px',
      render: (value) => value || '-'
    },
    {
      key: 'vendor_photo',
      label: 'Photo',
      sortable: false,
      minWidth: '80px',
      render: (value, row) => value ? 
        <div className="photo-indicator">📷</div> : 
        <div className="no-photo-indicator">-</div>
    },
    { 
      key: 'vendor_address', 
      label: 'Address', 
      sortable: false,
      minWidth: '200px',
      render: (value) => value ? (value.length > 40 ? value.substring(0, 40) + '...' : value) : '-'
    },
  ];

  return (
    <div className="vendor-form-container">
      {/* Header */}
      <div className="form-header">
        <h1>🏢 Vendor Management</h1>
        <p>Add and manage vendors for your transportation services</p>



        {/* Edit Mode Notice */}
        {editingVendor && (
          <div className="edit-notice">
            <span className="edit-notice-text">
              Editing: <strong className="edit-notice-item">{editingVendor.vendor_name}</strong>
            </span>
            <button type="button" onClick={resetForm} className="cancel-edit-btn">
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      {/* Form Section */}
      <div className="form-layout-card">
        <form onSubmit={handleSubmit} className="form-content" encType="multipart/form-data">
          {/* ===================================== */}
          {/* SECTION 1: BASIC INFORMATION */}
          {/* ===================================== */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">📋 Basic Information</h3>
            </div>
            <div className="form-fields-grid">
              
              {/* Vendor Name - Required */}
              <div className="form-field">
                <label className="form-field-label">
                  Vendor Name <span className="required-indicator">*</span>
                </label>
                <input
                  type="text"
                  name="vendor_name"
                  value={vendorData.vendor_name}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                  required
                  className={`form-input ${errors.vendor_name ? 'error' : ''}`}
                />
                {errors.vendor_name && <div className="form-field-error">{errors.vendor_name}</div>}
              </div>

              {/* Vendor Mobile No. - Enhanced Validation */}
              <ValidatedInput
                name="vendor_mobile_no"
                value={vendorData.vendor_mobile_no}
                onChange={handleInputChange}
                validationRule="MOBILE"
                required={true}
                label="Vendor Mobile No."
                placeholder="Enter 10-digit mobile number"
                autoFormat={true}
              />

              {/* Customer Assignment - Dropdown */}
              <div className="form-field">
                <Dropdown
                  label="Assigned Customer"
                  name="customer_id"
                  value={vendorData.customer_id}
                  onChange={handleInputChange}
                  options={customers}
                  valueKey="CustomerID"
                  labelKey="Name"
                  formatLabel={(customer) => `${customer.Name} (${customer.CustomerCode})`}
                  placeholder="Select customer (optional)"
                  allowEmpty={true}
                  emptyLabel="No customer assigned"
                  required={false}
                />
              </div>

              {/* Project Assignment - Dropdown */}
              <div className="form-field">
                <Dropdown
                  label="Assigned Project"
                  name="project_id"
                  value={vendorData.project_id}
                  onChange={handleInputChange}
                  options={projects}
                  valueKey="ProjectID"
                  labelKey="ProjectName"
                  formatLabel={(project) => `${project.ProjectName} (ID: ${project.ProjectID})`}
                  placeholder="Select project (optional)"
                  allowEmpty={true}
                  emptyLabel="No project assigned"
                  required={false}
                />
              </div>

              {/* Vendor Alternate/Family No. - Enhanced Validation */}
              <ValidatedInput
                name="vendor_alternate_no"
                value={vendorData.vendor_alternate_no}
                onChange={handleInputChange}
                validationRule="MOBILE"
                required={false}
                label="Vendor Alternate/Family No."
                placeholder="Enter alternate contact number"
                autoFormat={true}
              />

              {/* Enhanced Address Form with Pin Code Lookup */}
              <div className="form-field form-field-full-width">
                <AddressForm
                  addressData={getAddressData()}
                  onAddressChange={handleAddressChange}
                  errors={errors}
                  required={true}
                  prefix="vendor"
                  title="Vendor Address"
                />
              </div>

              {/* Vendor Photo */}
              {editingVendor && vendorData.vendor_photo_url ? (
                <ExistingDocumentUpload
                  label="Vendor Photo"
                  fileUrl={vendorData.vendor_photo_url}
                  onDelete={() => handleFileDelete('vendor_photo')}
                />
              ) : (
                <NewDocumentUpload
                  label="Vendor Photo"
                  name="vendor_photo"
                  value={files.vendor_photo}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_photo}
                />
              )}
            </div>
          </div>

          {/* ===================================== */}
          {/* SECTION 2: PERSONAL DOCUMENTS */}
          {/* ===================================== */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">📄 Personal Documents</h3>
            </div>
            <div className="form-fields-grid">
              
              {/* Vendor Aadhar - Enhanced Validation */}
              <ValidatedInput
                name="vendor_aadhar"
                value={vendorData.vendor_aadhar}
                onChange={handleInputChange}
                validationRule="AADHAAR"
                required={false}
                label="Vendor Aadhaar"
                placeholder="Enter 12-digit Aadhaar number"
                autoFormat={true}
              />

              {/* Vendor Aadhar Document */}
              {editingVendor && vendorData.vendor_aadhar_doc_url ? (
                <ExistingDocumentUpload
                  label="Vendor Aadhar Document"
                  fileUrl={vendorData.vendor_aadhar_doc_url}
                  onDelete={() => handleFileDelete('vendor_aadhar_doc')}
                />
              ) : (
                <NewDocumentUpload
                  label="Vendor Aadhar Document"
                  name="vendor_aadhar_doc"
                  value={files.vendor_aadhar_doc}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_aadhar_doc}
                />
              )}

              {/* Vendor PAN - Enhanced Validation */}
              <ValidatedInput
                name="vendor_pan"
                value={vendorData.vendor_pan}
                onChange={handleInputChange}
                validationRule="PAN"
                required={false}
                label="Vendor PAN"
                placeholder="Enter PAN number"
                autoFormat={true}
              />

              {/* Vendor PAN Document */}
              {editingVendor && vendorData.vendor_pan_doc_url ? (
                <ExistingDocumentUpload
                  label="Vendor PAN Document"
                  fileUrl={vendorData.vendor_pan_doc_url}
                  onDelete={() => handleFileDelete('vendor_pan_doc')}
                />
              ) : (
                <NewDocumentUpload
                  label="Vendor PAN Document"
                  name="vendor_pan_doc"
                  value={files.vendor_pan_doc}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_pan_doc}
                />
              )}
            </div>
          </div>

          {/* ===================================== */}
          {/* SECTION 3: COMPANY INFORMATION */}
          {/* ===================================== */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">🏢 Company Information</h3>
            </div>
            <div className="form-fields-grid">
              
              {/* Vendor Company Name */}
              <div className="form-field">
                <label className="form-field-label">
                  Vendor Company Name
                </label>
                <input
                  type="text"
                  name="vendor_company_name"
                  value={vendorData.vendor_company_name}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className="form-input"
                />
              </div>

              {/* Type of Company */}
              <div className="form-field">
                <label className="form-field-label">
                  Type of Company
                </label>
                <select
                  name="type_of_company"
                  value={vendorData.type_of_company}
                  onChange={handleInputChange}
                  className="form-input"
                >
                  <option value="Proprietorship">Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="LLP">LLP</option>
                  <option value="Pvt Ltd">Pvt Ltd</option>
                </select>
              </div>

              {/* Start Date of Company */}
              <div className="form-field">
                <label className="form-field-label">
                  Start Date of Company
                </label>
                <input
                  type="date"
                  name="start_date_of_company"
                  value={vendorData.start_date_of_company}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              {/* Address of Company */}
              <div className="form-field form-field-full-width">
                <label className="form-field-label">
                  Address of Company
                </label>
                <AddressForm
                  addressData={{
                    house_flat_no: vendorData.address_of_company_house_flat_no,
                    street_locality: vendorData.address_of_company_street_locality,
                    city: vendorData.address_of_company_city,
                    state: vendorData.address_of_company_state,
                    pin_code: vendorData.address_of_company_pin_code,
                    country: vendorData.address_of_company_country,
                  }}
                  onAddressChange={(newAddress) => {
                    setVendorData(prev => ({...prev, 
                      address_of_company_house_flat_no: newAddress.house_flat_no,
                      address_of_company_street_locality: newAddress.street_locality,
                      address_of_company_city: newAddress.city,
                      address_of_company_state: newAddress.state,
                      address_of_company_pin_code: newAddress.pin_code,
                      address_of_company_country: newAddress.country,
                    }))
                  }}
                  errors={errors}
                  required={false}
                  prefix="vendor_company"
                  title="Company Address"
                />
              </div>

              {/* Vendor Company Udhyam */}
              <div className="form-field">
                <label className="form-field-label">
                  Vendor Company Udhyam
                </label>
                <input
                  type="text"
                  name="vendor_company_udhyam"
                  value={vendorData.vendor_company_udhyam}
                  onChange={handleInputChange}
                  placeholder="Enter Udhyam registration number"
                  className="form-input"
                />
              </div>

              {/* Vendor Company Udhyam Document */}
              {editingVendor && vendorData.vendor_company_udhyam_doc_url ? (
                <ExistingDocumentUpload
                  label="Company Udhyam Document"
                  fileUrl={vendorData.vendor_company_udhyam_doc_url}
                  onDelete={() => handleFileDelete('vendor_company_udhyam_doc')}
                />
              ) : (
                <NewDocumentUpload
                  label="Company Udhyam Document"
                  name="vendor_company_udhyam_doc"
                  value={files.vendor_company_udhyam_doc}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_company_udhyam_doc}
                />
              )}

              {/* Vendor Company PAN - Enhanced Validation */}
              <ValidatedInput
                name="vendor_company_pan"
                value={vendorData.vendor_company_pan}
                onChange={handleInputChange}
                validationRule="PAN"
                required={false}
                label="Vendor Company PAN"
                placeholder="Enter Company PAN number"
                autoFormat={true}
              />

              {/* Vendor Company PAN Document */}
              {editingVendor && vendorData.vendor_company_pan_doc_url ? (
                <ExistingDocumentUpload
                  label="Company PAN Document"
                  fileUrl={vendorData.vendor_company_pan_doc_url}
                  onDelete={() => handleFileDelete('vendor_company_pan_doc')}
                />
              ) : (
                <NewDocumentUpload
                  label="Company PAN Document"
                  name="vendor_company_pan_doc"
                  value={files.vendor_company_pan_doc}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_company_pan_doc}
                />
              )}

              {/* Vendor Company GST - Enhanced Validation */}
              <ValidatedInput
                name="vendor_company_gst"
                value={vendorData.vendor_company_gst}
                onChange={handleInputChange}
                validationRule="GST"
                required={false}
                label="Vendor Company GST"
                placeholder="Enter GST number"
                autoFormat={true}
              />

              {/* Vendor Company GST Document */}
              {editingVendor && vendorData.vendor_company_gst_doc_url ? (
                <ExistingDocumentUpload
                  label="Company GST Document"
                  fileUrl={vendorData.vendor_company_gst_doc_url}
                  onDelete={() => handleFileDelete('vendor_company_gst_doc')}
                />
              ) : (
                <NewDocumentUpload
                  label="Company GST Document"
                  name="vendor_company_gst_doc"
                  value={files.vendor_company_gst_doc}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.vendor_company_gst_doc}
                />
              )}

              {/* Company Legal Documents */}
              {editingVendor && vendorData.company_legal_docs_url ? (
                <ExistingDocumentUpload
                  label="Company Legal Documents"
                  fileUrl={vendorData.company_legal_docs_url}
                  onDelete={() => handleFileDelete('company_legal_docs')}
                />
              ) : (
                <NewDocumentUpload
                  label="Company Legal Documents"
                  name="company_legal_docs"
                  value={files.company_legal_docs}
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx"
                  required={false}
                  error={errors.company_legal_docs}
                />
              )}
            </div>
          </div>

          {/* ===================================== */}
          {/* SECTION 4: BANK DETAILS */}
          {/* ===================================== */}
          <div className="form-section">
            <div className="form-section-header">
              <h3 className="form-section-title">🏦 Bank Details</h3>
            </div>
            {/* Bank Details and Cheque Upload Container */}
            <div className="bank-section-container">
              {/* Enhanced Bank Details with IFSC Auto-fill */}
              <div className="bank-details-wrapper">
                <BankDetails
                  bankData={bankDetails}
                  onBankDataChange={setBankDetails}
                  errors={errors}
                  required={false}
                  title="Bank Details"
                  prefix="vendor"
                  showTitle={true}
                  enableAutoFill={true}
                />
              </div>

              {/* Bank Cheque Upload - Compact Size */}
              <div className="bank-cheque-wrapper">
                {editingVendor && vendorData.bank_cheque_upload_url ? (
                  <ExistingDocumentUpload
                    label="Bank Cheque Upload"
                    fileUrl={vendorData.bank_cheque_upload_url}
                    onDelete={() => handleFileDelete('bank_cheque_upload')}
                  />
                ) : (
                  <NewDocumentUpload
                    label="Bank Cheque Upload"
                    name="bank_cheque_upload"
                    value={files.bank_cheque_upload}
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx"
                    required={false}
                    error={errors.bank_cheque_upload}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Processing...' : editingVendor ? 'Update Vendor' : 'Add Vendor'}
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
          entity="vendors"
          entityDisplayName="Vendors"
          expectedFields={27}
        />
      </div>

      {/* Data Table */}
      <DataTable
        title="📋 Vendor List"
        data={vendors}
        columns={vendorColumns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        keyField="VendorID"
        emptyMessage="No vendors found. Add your first vendor above."
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

export default VendorForm;