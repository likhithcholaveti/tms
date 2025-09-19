import { useState, useEffect } from 'react';
import { customerAPI, locationAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import ExportButton from '../components/ExportButton';
import AddressForm from '../components/AddressForm';
import ValidatedInput from '../components/ValidatedInput';
import DocumentUpload from '../components/DocumentUpload';
import ValidationErrorModal from '../components/ValidationErrorModal';
import { showWarning } from '../components/Notification';
import useFormValidation from '../hooks/useFormValidation';
import Dropdown from '../components/Dropdown';
import './CustomerForm.css';

// Utility function to format date for input fields
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

const CustomerForm = () => {
  // Global validation system
  const {
    validateBeforeSubmit,
    showErrorModal,
    closeErrorModal,
    errorSummary,
    goToField,
    isValidating
  } = useFormValidation('customer', {
    // Custom validation functions for customer-specific rules
    Name: (value) => {
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'Company name must be at least 2 characters' };
      }
      return { isValid: true, error: null };
    },
    MasterCustomerName: (value) => {
      if (!value || value.trim().length < 2) {
        return { isValid: false, error: 'Master customer name must be at least 2 characters' };
      }
      return { isValid: true, error: null };
    },
    // Validate structured address fields instead of single Address field
    pin_code: (value) => {
      if (value && !/^\d{6}$/.test(value)) {
        return { isValid: false, error: 'PIN code must be exactly 6 digits' };
      }
      return { isValid: true, error: null };
    },
    AgreementExpiryDate: (value, formData) => {
      if (formData.AgreementDate && value && new Date(value) < new Date(formData.AgreementDate)) {
        return { isValid: false, error: 'Agreement Expiry Date cannot be before Agreement Date' };
      }
      return { isValid: true, error: null };
    },
    BGExpiryDate: (value, formData) => {
      if (formData.BGDate && value && new Date(value) < new Date(formData.BGDate)) {
        return { isValid: false, error: 'BG Expiry Date cannot be before BG Date' };
      }
      return { isValid: true, error: null };
    },
    POExpiryDate: (value, formData) => {
      if (formData.PODate && value && new Date(value) < new Date(formData.PODate)) {
        return { isValid: false, error: 'PO Expiry Date cannot be before PO Date' };
      }
      return { isValid: true, error: null };
    }
  });

  const getInitialState = () => ({
    // Name & Code Section
    MasterCustomerName: '',
    Name: '',
    CustomerCode: '', // Auto-generated, read-only
    TypeOfServices: 'Transportation',
    ServiceCode: '', // Auto-selected based on TypeOfServices
    CustomerSite: [{ LocationID: '', site: '' }], // Multiple customer sites

    // Agreement & Terms Section
    Agreement: 'No',
    AgreementFile: null,
    AgreementDate: '',
    AgreementTenure: '',
    AgreementExpiryDate: '',
    CustomerNoticePeriod: '',
    CogentNoticePeriod: '',
    CreditPeriod: '',
    Insurance: 'No',
    MinimumInsuranceValue: '',
    CogentDebitClause: 'No',
    CogentDebitLimit: '',
    BG: 'No',
    BGFile: null,
    BGAmount: '',
    BGDate: '',
    BGExpiryDate: '',
    BGBank: '',
    BGReceivingByCustomer: '',
    BGReceivingFile: null,

    // PO Section
    PO: '',
    POFile: null,
    POValue: '',
    PODate: '',
    POTenure: '',
    POExpiryDate: '',

    // Commercials & Billing Section
    Rates: '',
    RatesAnnexureFile: null,
    YearlyEscalationClause: 'No',
    GSTNo: '',
    GSTRate: '',
    TypeOfBilling: 'RCM',
    BillingTenure: '',

    // MIS Section
    MISFormatFile: null,
    KPISLAFile: null,
    PerformanceReportFile: null,

    // Contact Details Section
    CustomerOfficeAddress: [
      {
        OfficeType: '',
        ContactPerson: '',
        Department: '',
        Designation: '',
        Mobile: '',
        Email: '',
        DOB: '',
        Address: ''
      }
    ],
    CustomerKeyContact: [
      {
        Name: '',
        Department: '',
        Designation: '',
        Location: '',
        OfficeType: '',
        Mobile: '',
        Email: '',
        DOB: '',
        Address: ''
      }
    ],
    CustomerCogentContact: {
      CustomerOwner: '',
      ProjectHead: '',
      OpsHead: '',
      OpsManager: '',
      Supervisor: ''
    }
  });

  const [customerData, setCustomerData] = useState(getInitialState());
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [errors, setErrors] = useState({});

  // State for modal viewer
  const [modalImage, setModalImage] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // State for Agreement & Terms acceptance
  const [agreementAccepted, setAgreementAccepted] = useState(false);

  // Service code mapping based on type of services
  const serviceCodeMapping = {
    'Transportation': 'TRANS',
    'Warehousing': 'WARE',
    'Both': 'BOTH',
    'Logistics': 'LOG',
    'Industrial Transport': 'INDTRANS',
    'Retail Distribution': 'RETAIL',
    'Other': 'OTHER'
  };

  

  // Handle adding new customer site
  const addCustomerSite = () => {
    setCustomerData(prev => ({
      ...prev,
      CustomerSite: [...prev.CustomerSite, { LocationID: '', site: '' }]
    }));
  };

  // Handle removing customer site
  const removeCustomerSite = (index) => {
    setCustomerData(prev => ({
      ...prev,
      CustomerSite: prev.CustomerSite.filter((_, i) => i !== index)
    }));
  };

  // Handle customer site change with validation against locations
  const handleCustomerSiteChange = (index, name, value) => {
    setCustomerData(prev => ({
      ...prev,
      CustomerSite: prev.CustomerSite.map((item, i) =>
        i === index ? { ...item, [name]: value } : item
      )
    }));
  };

  const addArrayItem = (arrayName) => {
    setCustomerData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], getInitialState()[arrayName][0]]
    }));
  };

  const handleArrayInputChange = (e, index, arrayName) => {
    const { name, value } = e.target;
    const updatedArray = [...customerData[arrayName]];
    updatedArray[index][name] = value;
    setCustomerData(prev => ({ ...prev, [arrayName]: updatedArray }));
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
    loadLocations();
  }, []);

  // Expiry date reminder logic with red flag popups
  const checkExpiryDates = (customerData) => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiryFields = [
      { field: 'AgreementExpiryDate', label: 'Agreement', date: customerData.AgreementExpiryDate },
      { field: 'BGExpiryDate', label: 'Bank Guarantee', date: customerData.BGExpiryDate },
      { field: 'POExpiryDate', label: 'Purchase Order', date: customerData.POExpiryDate }
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
          showWarning(`${label} expires in ${daysUntilExpiry} days (${formatDateForInput(date)})`);
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

  // Check expiry dates when customer data changes
  useEffect(() => {
    if (customerData && Object.keys(customerData).length > 0) {
      checkExpiryDates(customerData);
    }
  }, [customerData.AgreementExpiryDate, customerData.BGExpiryDate, customerData.POExpiryDate]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data.value || response.data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLocations = async (customerId) => {
    try {
      if (customerId) {
        const response = await locationAPI.getByCustomer(customerId);
        setLocations(response.data.data || []);
      } else {
        const response = await locationAPI.getAll();
        setLocations(response.data || []);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === 'file') {
      setCustomerData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setCustomerData(prev => {
        const newData = {
          ...prev,
          [name]: value
        };

        // Auto-select service code based on type of services
        if (name === 'TypeOfServices') {
          newData.ServiceCode = serviceCodeMapping[value] || '';
        }

        return newData;
      });
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.target.type === 'number' && e.key === 'e') {
      e.preventDefault();
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
      filename = imagePath.split(/[/\\]/).pop();
    }

    // Use the proper API endpoint for customers
    return `${baseUrl}/api/customers/files/${filename}`;
  };

  // Handle address changes from AddressForm component
  const handleAddressChange = (newAddressData) => {
    setCustomerData(prev => ({
      ...prev,
      ...newAddressData
      // Address field removed - using structured address fields only
    }));
  };

  // Get address data for AddressForm component
  const getAddressData = () => ({
    house_flat_no: customerData.house_flat_no || '',
    street_locality: customerData.street_locality || '',
    city: customerData.city || '',
    state: customerData.state || '',
    pin_code: customerData.pin_code || '',
    country: customerData.country || 'India'
  });

  // Helper function to render comprehensive file preview (images and documents)
  const renderFilePreview = (fieldName, displayName = null) => {
    const newFile = customerData[fieldName];
    const existingPath = editingCustomer?.[fieldName];

    console.log(`🔍 CUSTOMER PREVIEW DEBUG - ${fieldName}:`, {
      newFile: newFile,
      existingPath: existingPath,
      editingCustomerKeys: editingCustomer ? Object.keys(editingCustomer) : 'null'
    });

    // Show preview if there's either a new file or existing file path
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
    if (!customerData.Name.trim()) newErrors.Name = 'Company name is required';
    // CustomerCode is auto-generated by backend, so no validation needed
    if (!customerData.ServiceCode.trim()) newErrors.ServiceCode = 'Service code is required';

    // Check Agreement & Terms acceptance
    if (!agreementAccepted) {
      newErrors.agreementAcceptance = 'You must accept the Agreement & Terms conditions to proceed';
    }

    // GST validation removed as per requirement
    // Previous GST validation code:
    // if (!customerData.GSTNo.trim()) {
    //     newErrors.GSTNo = 'GST No. is required';
    // } else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(customerData.GSTNo)) {
    //     newErrors.GSTNo = 'Invalid GST number format';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // First check basic form validation including agreement acceptance
    if (!validateForm()) {
      return; // Stop submission if basic validation fails
    }

    // Use global validation system with error modal and cursor movement
    const isValid = await validateBeforeSubmit(
      customerData,
      // Success callback
      async (validatedData) => {
        await submitCustomerData(validatedData);
      },
      // Error callback
      (validationResult) => {
        console.log('Customer validation failed:', validationResult.summary);
        // Error modal will be shown automatically
      }
    );

    if (!isValid) {
      return; // Validation failed, modal shown, cursor moved
    }
  };

  // Helper function to generate customer code abbreviation (same as backend)
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

  // Function to generate live preview of customer code
  const generateCustomerCodePreview = (name) => {
    if (!name || name.trim() === '') return '';
    const prefix = generateCustomerAbbreviation(name, 3);
    return `${prefix}XXX`; // Show XXX as placeholder for the number part
  };

  // Function to generate actual customer code with sequential numbering
  const generateCustomerCode = async (name) => {
    if (!name || name.trim() === '') return '';

    const prefix = generateCustomerAbbreviation(name, 3);

    try {
      // Fetch all existing customers to find the highest number for this prefix
      const response = await customerAPI.getAll();
      const existingCustomers = response.data.value || response.data || [];

      // Find all customer codes that start with the same prefix
      const matchingCodes = existingCustomers
        .map(customer => customer.CustomerCode)
        .filter(code => code && code.startsWith(prefix) && code.length === prefix.length + 3)
        .map(code => parseInt(code.substring(prefix.length)))
        .filter(num => !isNaN(num));

      // Find the highest number and add 1
      const nextNumber = matchingCodes.length > 0 ? Math.max(...matchingCodes) + 1 : 1;

      // Pad with zeros to make it 3 digits
      const paddedNumber = nextNumber.toString().padStart(3, '0');

      return `${prefix}${paddedNumber}`;
    } catch (error) {
      console.error('Error generating customer code:', error);
      // Fallback: generate with 001 if API fails
      return `${prefix}001`;
    }
  };

  // Separate function for actual data submission
  const submitCustomerData = async (validatedData) => {

    // Create a FormData object to handle file uploads
    const formData = new FormData();
    console.log('🔍 CUSTOMER SUBMIT DEBUG - Customer data before FormData:', customerData);

    // For new customers, don't set CustomerCode - let backend generate it
    // Remove any existing CustomerCode to ensure backend generates it
    if (!editingCustomer && validatedData.CustomerCode) {
      delete validatedData.CustomerCode;
    }

    // Use validatedData instead of customerData to ensure latest validated values
    for (const key in validatedData) {
        if (validatedData[key] instanceof File) {
            console.log(`📁 CUSTOMER SUBMIT DEBUG - Adding file ${key}:`, validatedData[key].name);
            formData.append(key, validatedData[key], validatedData[key].name);
        } else if (key === 'Locations') {
            // Convert locations array to comma-separated string
            const locationsString = validatedData.Locations
                .map(loc => loc.location)
                .filter(loc => loc.trim() !== '')
                .join(', ');
            formData.append(key, locationsString);
        } else if (key === 'CustomerSite') {
            // Convert customer sites array to comma-separated string
            const sitesString = validatedData.CustomerSite
                .map(site => site.site)
                .filter(site => site.trim() !== '')
                .join(', ');
            formData.append(key, sitesString);
        } else {
            formData.append(key, validatedData[key]);
        }
    }

    // Log FormData contents
    console.log('📋 CUSTOMER SUBMIT DEBUG - FormData entries:');
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File: ${pair[1].name}` : pair[1]));
    }

    try {
      setIsSubmitting(true);
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.CustomerID, formData);
        apiHelpers.showSuccess(`Customer "${validatedData.Name}" has been updated successfully!`);
      } else {
        // Capture the response to get the generated CustomerCode
        console.log('🔍 CUSTOMER SUBMIT DEBUG - About to call customerAPI.create');
        const response = await customerAPI.create(formData);
        console.log('🔍 CUSTOMER SUBMIT DEBUG - API Response:', response);
        console.log('🔍 CUSTOMER SUBMIT DEBUG - Response data:', response.data);
        console.log('🔍 CUSTOMER SUBMIT DEBUG - Response data CustomerCode:', response.data?.CustomerCode);

        const generatedCustomerCode = response.data?.CustomerCode;

        if (generatedCustomerCode) {
          console.log('🔍 CUSTOMER SUBMIT DEBUG - Updating form with generated code:', generatedCustomerCode);
          // Update the form with the generated customer code
          setCustomerData(prev => {
            console.log('🔍 CUSTOMER SUBMIT DEBUG - Previous customerData:', prev);
            const newData = {
              ...prev,
              CustomerCode: generatedCustomerCode
            };
            console.log('🔍 CUSTOMER SUBMIT DEBUG - New customerData:', newData);
            return newData;
          });
          apiHelpers.showSuccess(`Customer "${validatedData.Name}" has been added successfully! Generated Code: ${generatedCustomerCode}`);
        } else {
          console.log('🔍 CUSTOMER SUBMIT DEBUG - No generated code found in response');
          apiHelpers.showSuccess(`Customer "${validatedData.Name}" has been added successfully!`);
        }
      }
      await loadCustomers();
      // Don't reset form immediately for new customers so they can see the generated code
      if (editingCustomer) {
        resetForm();
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      apiHelpers.showError(error, editingCustomer ? 'Failed to update customer' : 'Failed to add customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerData(getInitialState());
    setEditingCustomer(null);
    setErrors({});
  };



  const handleEdit = (customer) => {
    console.log('🔍 CUSTOMER EDIT DEBUG - Raw customer data from table:', customer);
    console.log('🖼️ CUSTOMER EDIT DEBUG - File fields:', {
      AgreementFile: customer.AgreementFile,
      BGFile: customer.BGFile,
      BGReceivingFile: customer.BGReceivingFile,
      POFile: customer.POFile
    });
    console.log('🏠 CUSTOMER EDIT DEBUG - Address fields from DB:', {
      HouseFlatNo: customer.HouseFlatNo,
      StreetLocality: customer.StreetLocality,
      CustomerCity: customer.CustomerCity,
      CustomerState: customer.CustomerState,
      CustomerPinCode: customer.CustomerPinCode,
      CustomerCountry: customer.CustomerCountry,
      CityName: customer.CityName
    });

    // Note: file fields cannot be re-populated for security reasons.
    // The user will have to re-upload files if they want to change them.
    const editableCustomerData = { ...getInitialState() };

    // Map customer data with proper date formatting
    for (const key in customer) {
        if (Object.prototype.hasOwnProperty.call(editableCustomerData, key)) {
            // Handle date fields specifically
            if (key.includes('Date') || key.includes('date')) {
                editableCustomerData[key] = formatDateForInput(customer[key]);
            } else if (key === 'Locations') {
                // Convert comma-separated string back to array
                const locationsString = customer[key] || '';
                editableCustomerData[key] = locationsString
                    .split(',')
                    .map(loc => ({ location: loc.trim() }))
                    .filter(loc => loc.location !== '');
                if (editableCustomerData[key].length === 0) {
                    editableCustomerData[key] = [{ location: '' }];
                }
            } else if (key === 'CustomerSite') {
                // Convert comma-separated string back to array
                const sitesString = customer[key] || '';
                editableCustomerData[key] = sitesString
                    .split(',')
                    .map(site => ({ site: site.trim() }))
                    .filter(site => site.site !== '');
                if (editableCustomerData[key].length === 0) {
                    editableCustomerData[key] = [{ site: '' }];
                }
            } else {
                editableCustomerData[key] = customer[key] || '';
            }
        }
    }

    // Map database address fields to frontend address fields
    // Note: Database stores with different field names than frontend uses
    editableCustomerData.house_flat_no = customer.HouseFlatNo || '';
    editableCustomerData.street_locality = customer.StreetLocality || '';
    editableCustomerData.city = customer.CustomerCity || customer.city || '';
    editableCustomerData.state = customer.CustomerState || customer.state || '';
    editableCustomerData.pin_code = customer.CustomerPinCode || customer.pin_code || '';
    editableCustomerData.country = customer.CustomerCountry || customer.country || 'India';

    console.log('🏠 ADDRESS MAPPING DEBUG:', {
      'DB HouseFlatNo': customer.HouseFlatNo,
      'DB StreetLocality': customer.StreetLocality,
      'DB CustomerCity': customer.CustomerCity,
      'DB CustomerState': customer.CustomerState,
      'DB CustomerPinCode': customer.CustomerPinCode,
      'DB CustomerCountry': customer.CustomerCountry,
      'Mapped house_flat_no': editableCustomerData.house_flat_no,
      'Mapped street_locality': editableCustomerData.street_locality,
      'Mapped city': editableCustomerData.city,
      'Mapped state': editableCustomerData.state,
      'Mapped pin_code': editableCustomerData.pin_code,
      'Mapped country': editableCustomerData.country
    });

    // Keep file paths for DocumentUpload component to show existing files
    // The DocumentUpload component will handle existing files properly

    console.log('🔄 CUSTOMER EDIT DEBUG - Mapped form data:', editableCustomerData);
    console.log('🖼️ CUSTOMER EDIT DEBUG - File URLs for DocumentUpload:', {
      AgreementFileUrl: customer.AgreementFileUrl,
      BGFileUrl: customer.BGFileUrl,
      BGReceivingFileUrl: customer.BGReceivingFileUrl,
      POFileUrl: customer.POFileUrl
    });
    setCustomerData(editableCustomerData);
    setEditingCustomer(customer);

    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle file deletion during edit
  const handleFileDelete = async (fieldName, fileName) => {
    try {
      if (!editingCustomer) {
        throw new Error('No customer being edited');
      }

      console.log(`🗑️ Deleting customer file - ID: ${editingCustomer.CustomerID}, Field: ${fieldName}, File: ${fileName}`);

      // Call API to delete file
      await customerAPI.deleteFile(editingCustomer.CustomerID, fieldName);

      // Update the editing customer data to remove the file reference
      setEditingCustomer(prev => ({
        ...prev,
        [fieldName]: null
      }));

      // Update form data to remove the file
      setCustomerData(prev => ({
        ...prev,
        [fieldName]: null
      }));

      apiHelpers.showSuccess(`File deleted successfully`);

    } catch (error) {
      console.error('❌ Error deleting customer file:', error);
      apiHelpers.showError(error, 'Failed to delete file');
      throw error; // Re-throw so DocumentUpload can handle the error state
    }
  };

  const handleDelete = async (customerOrId) => {
    // Extract ID and customer object
    const customerId = typeof customerOrId === 'object'
      ? customerOrId.CustomerID
      : customerOrId;
    const customer = typeof customerOrId === 'object'
      ? customerOrId
      : customers.find(c => c.CustomerID === customerId);
    const customerName = customer?.Name || 'Customer';

    console.log('🗑️ Delete requested for customer:', customerId, customerName);

    if (window.confirm(`Are you sure you want to delete "${customerName}"?`)) {
      try {
        await customerAPI.delete(customerId);
        apiHelpers.showSuccess(`Customer "${customerName}" has been deleted successfully!`);
        await loadCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
        apiHelpers.showError(error, 'Failed to delete customer');
      }
    }
  };

  // Render multiple locations input
  const renderMultipleLocations = () => {
    return (
      <div className="form-group">
        <label>
          Locations <span className="required-indicator">*</span>
        </label>
        <div className="multiple-inputs-container">
          {customerData.Locations.map((location, index) => (
            <div key={index} className="multiple-input-row">
              <input
                type="text"
                value={location.location}
                onChange={(e) => handleLocationChange(index, e.target.value)}
                placeholder={`Enter location`}
                className="multiple-input"
              />
              {customerData.Locations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLocation(index)}
                  className="remove-input-btn"
                  title="Remove location"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addLocation}
            className="add-input-btn"
          >
            + Add Location
          </button>
        </div>
      </div>
    );
  };

  // Render multiple customer sites input
  const renderMultipleCustomerSites = () => {
    return (
      <div className="form-group">
        <label>Customer Sites</label>
        <div className="multiple-inputs-container">
          {customerData.CustomerSite.map((site, index) => (
            <div key={index} className="multiple-input-row">
              <Dropdown
                name="LocationID"
                value={site.LocationID}
                onChange={(e) => handleCustomerSiteChange(index, 'LocationID', e.target.value)}
                options={locations}
                valueKey="LocationID"
                labelKey="LocationName"
                placeholder="Select a location"
              />
              <input
                type="text"
                value={site.site}
                onChange={(e) => handleCustomerSiteChange(index, 'site', e.target.value)}
                placeholder={`Enter site`}
                className="multiple-input"
              />
              {customerData.CustomerSite.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCustomerSite(index)}
                  className="remove-input-btn"
                  title="Remove customer site"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCustomerSite}
            className="add-input-btn"
          >
            + Add Customer Site
          </button>
        </div>
      </div>
    );
  };

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

  const renderFormField = (label, name, type = 'text', options = {}, required = false) => {
      const { placeholder, values, readOnly } = options;
      const isFile = type === 'file';
      const isRadio = type === 'radio';
      const isSelect = type === 'select';
      const isTextarea = type === 'textarea';

      const id = `customer-${name}`;

      // Check for expiry status on date fields
      const expiryStatus = (type === 'date' && customerData[name]) ? getExpiryStatus(name, customerData[name]) : null;

      return (
          <div className={`form-group ${options.fullWidth ? 'full-width' : ''} ${expiryStatus ? expiryStatus.className : ''}`}>
              <label htmlFor={id}>
                  {label} {required && <span className="required-indicator">*</span>}
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
                                  checked={customerData[name] === val}
                                  onChange={handleInputChange}
                              />
                              {val}
                          </label>
                      ))}
                  </div>
              ) : isSelect ? (
                  <select id={id} name={name} value={customerData[name]} onChange={handleInputChange} required={required}>
                      {values.map(val => <option key={val} value={val}>{val}</option>)}
                  </select>
              ) : isTextarea ? (
                  <textarea
                      id={id}
                      name={name}
                      value={customerData[name]}
                      onChange={handleInputChange}
                      placeholder={placeholder}
                      rows={3}
                  />
              ) : (
                  <input
                      type={type}
                      id={id}
                      name={name}
                      value={type !== 'file' ? customerData[name] : undefined}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={placeholder}
                      required={required}
                      readOnly={readOnly}
                      className={`${errors[name] ? 'error' : ''} ${readOnly ? 'readonly' : ''} ${expiryStatus ? expiryStatus.className : ''}`}
                  />
              )}
              {isFile && renderFilePreview(name, label)}
              {errors[name] && <div className="error-message">{errors[name]}</div>}
          </div>
      );
  };
  
  const customerColumns = [
    {
      key: 'CustomerCode',
      label: 'Code',
      sortable: true,
      minWidth: '120px'
    },
    {
      key: 'Name',
      label: 'Company Name',
      sortable: true,
      minWidth: '150px'
    },
    {
      key: 'Locations',
      label: 'Locations',
      sortable: true,
      minWidth: '140px',
      render: (value) => value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '-'
    },
    {
      key: 'CustomerSite',
      label: 'Customer Site',
      sortable: true,
      minWidth: '120px',
      render: (value) => value ? (value.length > 25 ? value.substring(0, 25) + '...' : value) : '-'
    },
    {
      key: 'TypeOfServices',
      label: 'Services',
      sortable: true,
      minWidth: '120px'
    },
    {
      key: 'GSTNo',
      label: 'GST No.',
      sortable: true,
      minWidth: '140px',
      render: (value) => value || '-'
    },
    {
      key: 'TypeOfBilling',
      label: 'Billing Type',
      sortable: true,
      minWidth: '100px'
    }
  ];

  return (
    <div className="customer-form-container">
      <div className="form-header">
        <h1>👥 CRM</h1>
        <p>Add and manage customer details, agreements, and billing information.</p>


        {editingCustomer && (
          <div className="edit-notice">
            <span className="edit-notice-text">
              Editing: <strong>{editingCustomer.Name}</strong>
            </span>
            <button type="button" onClick={resetForm} className="cancel-edit-btn">
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      <div className="customer-form">
        <form onSubmit={handleSubmit} noValidate>
            <div className="form-sections">
                <div className="form-section">
                    <h4>1. Name & Code Section</h4>
                    <div className="form-grid">
                        {renderFormField('Master Customer Name', 'MasterCustomerName', 'text', { placeholder: 'Enter master customer name' }, true)}
                        {renderFormField('Company Name', 'Name', 'text', { placeholder: 'Enter company name' }, true)}
                        {renderFormField('Customer Code', 'CustomerCode', 'text', { placeholder: 'Auto-generated', readOnly: true })}
                        {renderFormField('Type of Services', 'TypeOfServices', 'select', { values: ['Transportation', 'Warehousing', 'Both', 'Logistics', 'Industrial Transport', 'Retail Distribution', 'Other'] }, true)}
                        {renderFormField('Service Code', 'ServiceCode', 'text', { placeholder: 'Auto-selected', readOnly: true })}
                        {renderMultipleCustomerSites()}
                    </div>
                </div>

                <div className="form-section">
                    <h4>2. Agreement & Terms Section</h4>
                    <div className="form-grid">
                        {renderFormField('Agreement', 'Agreement', 'radio', { values: ['Yes', 'No'] })}

                        {/* Agreement & Terms Acceptance Checkbox */}
                        <div className="form-group full-width">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={agreementAccepted}
                                    onChange={(e) => setAgreementAccepted(e.target.checked)}
                                    required
                                />
                                <span className="checkmark"></span>
                                I accept the Agreement & Terms conditions
                                <span className="required-indicator">*</span>
                            </label>
                            {!agreementAccepted && errors.agreementAcceptance && (
                                <div className="error-message">{errors.agreementAcceptance}</div>
                            )}
                        </div>

                        {/* Agreement File Upload */}
                        <div className="form-group">
                            <DocumentUpload
                                label="Agreement File"
                                name="AgreementFile"
                                value={customerData.AgreementFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, AgreementFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.AgreementFileUrl}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>

                        {renderFormField('Agreement Date', 'AgreementDate', 'date')}
                        {renderFormField('Agreement Tenure (in Years)', 'AgreementTenure', 'number', { placeholder: 'e.g., 2' })}
                        {renderFormField('Agreement Expiry Date', 'AgreementExpiryDate', 'date')}
                        {renderFormField('Customer Notice Period (in Days)', 'CustomerNoticePeriod', 'number', { placeholder: 'e.g., 30' })}
                        {renderFormField('Cogent Notice Period (in Days)', 'CogentNoticePeriod', 'number', { placeholder: 'e.g., 30' })}
                        {renderFormField('Credit Period (in Days)', 'CreditPeriod', 'number', { placeholder: 'e.g., 45' })}
                        {renderFormField('Customer Insurance', 'Insurance', 'radio', { values: ['Yes', 'No'] })}
                        {renderFormField('Minimum Insurance value (in Rs)', 'MinimumInsuranceValue', 'number', { placeholder: 'Enter amount', onKeyDown: (e) => {
                          if (e.key === 'e' || e.key === 'E') {
                            e.preventDefault();
                          }
                        } })}
                        {renderFormField('Cogent Debit Clause', 'CogentDebitClause', 'radio', { values: ['Yes', 'No'] })}
                        {renderFormField('Cogent Debit Limit', 'CogentDebitLimit', 'number', { placeholder: 'Enter limit' })}
                        {renderFormField('BG (Bank Guarantee)', 'BG', 'radio', { values: ['Yes', 'No'] })}

                        {/* BG File Upload */}
                        <div className="form-group">
                            <DocumentUpload
                                label="Bank Guarantee File"
                                name="BGFile"
                                value={customerData.BGFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, BGFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.BGFileUrl}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>

                        {renderFormField('BG Amount', 'BGAmount', 'number', { placeholder: 'Enter amount' })}
                        {renderFormField('BG Date', 'BGDate', 'date')}
                        {renderFormField('BG Expiry Date', 'BGExpiryDate', 'date')}
                        {renderFormField('BG Bank', 'BGBank', 'text', { placeholder: 'Enter bank name' })}
                        {renderFormField('BG Receiving by Customer', 'BGReceivingByCustomer', 'text', { placeholder: 'Receiver name' })}

                        {/* BG Receiving File Upload */}
                        <div className="form-group">
                            <DocumentUpload
                                label="BG Receiving File"
                                name="BGReceivingFile"
                                value={customerData.BGReceivingFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, BGReceivingFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.BGReceivingFileUrl}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h4>3. PO Section</h4>
                    <div className="form-grid">
                        {renderFormField('PO', 'PO', 'text', { placeholder: 'Enter PO number' })}

                        {/* PO File Upload */}
                        <div className="form-group">
                            <DocumentUpload
                                label="Purchase Order File"
                                name="POFile"
                                value={customerData.POFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, POFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.POFileUrl}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>

                        {renderFormField('PO Value', 'POValue', 'number', { placeholder: 'Enter PO value' })}
                        {renderFormField('PO Date', 'PODate', 'date')}
                        {renderFormField('PO Tenure', 'POTenure', 'text', { placeholder: 'e.g., 1 year' })}
                        {renderFormField('PO Expiry Date', 'POExpiryDate', 'date')}
                    </div>
                </div>
                
                <div className="form-section">
                    <h4>4. Commercials & Billing Section</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <DocumentUpload
                                label="Rates Annexure"
                                name="RatesAnnexureFile"
                                value={customerData.RatesAnnexureFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, RatesAnnexureFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.RatesAnnexureFileUrl}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>
                        {renderFormField('Rates', 'Rates', 'text', { placeholder: 'e.g., As per annexure' })}
                        {renderFormField('Yearly Escalation Clause', 'YearlyEscalationClause', 'radio', { values: ['Yes', 'No'] })}
                        <ValidatedInput
                          name="GSTNo"
                          value={customerData.GSTNo}
                          onChange={handleInputChange}
                          validationRule="GST"
                          required={false}
                          label="GST No."
                          placeholder="Enter GST number (optional)"
                          showFormatHint={true}
                          autoFormat={true}
                        />
                        {renderFormField('GST Rate (%)', 'GSTRate', 'number', { placeholder: 'e.g., 18' })}
                        {renderFormField('Type of Billing', 'TypeOfBilling', 'select', { values: ['RCM', 'GST'] }, true)}
                        {renderFormField('Billing Tenure', 'BillingTenure', 'text', { placeholder: 'e.g., 25th to 24th' })}
                    </div>
                </div>

                <div className="form-section">
                    <h4>5. MIS Section</h4>
                    <div className="form-grid">
                        <div className="form-group">
                            <DocumentUpload
                                label="MIS Format"
                                name="MISFormatFile"
                                value={customerData.MISFormatFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, MISFormatFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.MISFormatFileUrl}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>
                        <div className="form-group">
                            <DocumentUpload
                                label="KPI / SLA"
                                name="KPISLAFile"
                                value={customerData.KPISLAFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, KPISLAFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.KPISLAFileUrl}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>
                        <div className="form-group">
                            <DocumentUpload
                                label="Performance Report"
                                name="PerformanceReportFile"
                                value={customerData.PerformanceReportFile}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    setCustomerData(prev => ({ ...prev, PerformanceReportFile: file }));
                                }}
                                onDelete={handleFileDelete}
                                existingFileUrl={editingCustomer?.PerformanceReportFileUrl}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                entityType="customers"
                                entityId={editingCustomer?.CustomerID}
                                isEditing={!!editingCustomer}
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h4>6. Contact & Details Section</h4>
                    <div className="form-grid">
                        <ValidatedInput
                          name="CustomerMobileNo"
                          value={customerData.CustomerMobileNo}
                          onChange={handleInputChange}
                          validationRule="MOBILE"
                          required={false}
                          label="Customer Mobile No"
                          placeholder="Enter mobile number"
                          showFormatHint={true}
                          autoFormat={true}
                        />
                        <ValidatedInput
                          name="AlternateMobileNo"
                          value={customerData.AlternateMobileNo}
                          onChange={handleInputChange}
                          validationRule="MOBILE"
                          required={false}
                          label="Alternate Mobile No"
                          placeholder="Enter alternate mobile number"
                          showFormatHint={true}
                          autoFormat={true}
                        />
                        <ValidatedInput
                          name="CustomerEmail"
                          value={customerData.CustomerEmail}
                          onChange={handleInputChange}
                          validationRule="EMAIL"
                          required={false}
                          label="Customer Email"
                          placeholder="Enter email address"
                          showFormatHint={false}
                          autoFormat={false}
                        />
                        {renderFormField('Customer Contact Person', 'CustomerContactPerson', 'text', { placeholder: 'Enter contact person name' })}
                        {renderFormField('Customer Group', 'CustomerGroup', 'text', { placeholder: 'Enter customer group' })}
                        {renderFormField('City Name', 'CityName', 'text', { placeholder: 'Enter city name' })}

                        {/* Enhanced Customer Address with Pin Code Lookup - Moved here */}
                        <div className="form-group full-width">
                            <AddressForm
                                addressData={getAddressData()}
                                onAddressChange={handleAddressChange}
                                errors={errors}
                                required={true}
                                prefix="customer"
                                title="Customer Address"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h4>7. Customer Office Address</h4>
                    {customerData.CustomerOfficeAddress.map((address, index) => (
                        <div key={index} className="form-grid">
                            {renderFormField(`Office Type`, `CustomerOfficeAddress[${index}][OfficeType]`, 'select', { values: ['Registered Office', 'Corporate Office', 'Regional Office', 'Branch Office', 'Warehouse', 'Site Office', 'Other'] })}
                            {renderFormField(`Contact Person`, `CustomerOfficeAddress[${index}][ContactPerson]`, 'text', { placeholder: 'Enter contact person name' })}
                            {renderFormField(`Department`, `CustomerOfficeAddress[${index}][Department]`, 'text', { placeholder: 'Enter department' })}
                            {renderFormField(`Designation`, `CustomerOfficeAddress[${index}][Designation]`, 'text', { placeholder: 'Enter designation' })}
                            <ValidatedInput
                              name={`CustomerOfficeAddress[${index}][Mobile]`}
                              value={address.Mobile}
                              onChange={(e) => handleArrayInputChange(e, index, 'CustomerOfficeAddress')}
                              validationRule="MOBILE"
                              required={false}
                              label="Mobile No"
                              placeholder="Enter mobile number"
                              showFormatHint={true}
                              autoFormat={true}
                            />
                            <ValidatedInput
                              name={`CustomerOfficeAddress[${index}][Email]`}
                              value={address.Email}
                              onChange={(e) => handleArrayInputChange(e, index, 'CustomerOfficeAddress')}
                              validationRule="EMAIL"
                              required={false}
                              label="Email"
                              placeholder="Enter email address"
                              showFormatHint={false}
                              autoFormat={false}
                            />
                            {renderFormField(`DOB`, `CustomerOfficeAddress[${index}][DOB]`, 'date')}
                            {renderFormField(`Address`, `CustomerOfficeAddress[${index}][Address]`, 'textarea', { placeholder: 'Enter address', fullWidth: true })}
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('CustomerOfficeAddress')} className="add-input-btn">
                        + Add Office Address
                    </button>
                </div>

                <div className="form-section">
                    <h4>8. Key Contacts</h4>
                    {customerData.CustomerKeyContact.map((contact, index) => (
                        <div key={index} className="form-grid">
                            {renderFormField(`Name`, `CustomerKeyContact[${index}][Name]`, 'text', { placeholder: 'Enter name' })}
                            {renderFormField(`Department`, `CustomerKeyContact[${index}][Department]`, 'text', { placeholder: 'Enter department' })}
                            {renderFormField(`Designation`, `CustomerKeyContact[${index}][Designation]`, 'text', { placeholder: 'Enter designation' })}
                            {renderFormField(`Location`, `CustomerKeyContact[${index}][Location]`, 'text', { placeholder: 'Enter location' })}
                            {renderFormField(`Office Type`, `CustomerKeyContact[${index}][OfficeType]`, 'select', { values: ['HO', 'RO', 'Branch', 'WH', 'Others'] })}
                            <ValidatedInput
                              name={`CustomerKeyContact[${index}][Mobile]`}
                              value={contact.Mobile}
                              onChange={(e) => handleArrayInputChange(e, index, 'CustomerKeyContact')}
                              validationRule=" MOBILE"
                              required={false}
                              label="Mobile No"
                              placeholder="Enter mobile number"
                              showFormatHint={true}
                              autoFormat={true}
                            />
                            <ValidatedInput
                              name={`CustomerKeyContact[${index}][Email]`}
                              value={contact.Email}
                              onChange={(e) => handleArrayInputChange(e, index, 'CustomerKeyContact')}
                              validationRule="EMAIL"
                              required={false}
                              label="Email"
                              placeholder="Enter email address"
                              showFormatHint={false}
                              autoFormat={false}
                            />
                            {renderFormField(`DOB`, `CustomerKeyContact[${index}][DOB]`, 'date')}
                            {renderFormField(`Address`, `CustomerKeyContact[${index}][Address]`, 'textarea', { placeholder: 'Enter address', fullWidth: true })}
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('CustomerKeyContact')} className="add-input-btn">
                        + Add Key Contact
                    </button>
                </div>

                <div className="form-section">
                    <h4>9. Cogent Contact</h4>
                    <div className="form-grid">
                        {renderFormField('Customer Owner', 'CustomerCogentContact[CustomerOwner]', 'text', { placeholder: 'Enter name' })}
                        {renderFormField('Project Head', 'CustomerCogentContact[ProjectHead]', 'text', { placeholder: 'Enter name' })}
                        {renderFormField('Ops Head', 'CustomerCogentContact[OpsHead]', 'text', { placeholder: 'Enter name' })}
                        {renderFormField('Ops Manager', 'CustomerCogentContact[OpsManager]', 'text', { placeholder: 'Enter name' })}
                        {renderFormField('Supervisor', 'CustomerCogentContact[Supervisor]', 'text', { placeholder: 'Enter name' })}
                    </div>
                </div>
            </div>

            <div className="form-actions">
                <button type="submit" disabled={isSubmitting} className="submit-btn">
                    {isSubmitting ? 'Processing...' : editingCustomer ? 'Update Customer' : 'Add Customer'}
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
          entity="customers"
          entityDisplayName="Customers"
          expectedFields={50}
        />
      </div>

      <DataTable
        title="📋 Customer List"
        data={customers}
        columns={customerColumns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        keyField="CustomerID"
        emptyMessage="No customers found. Add your first customer above."
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

export default CustomerForm;