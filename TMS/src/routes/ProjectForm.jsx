import React, { useState, useEffect } from 'react';
import { customerAPI, projectAPI, locationAPI, apiHelpers } from '../services/api';
import DataTable from '../components/DataTable';
import Dropdown from '../components/Dropdown';
import ExportButton from '../components/ExportButton';
import DocumentUpload from '../components/DocumentUpload';
import './ProjectForm.css';

// Simple date formatting function for display
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN');
};

// Format currency for display
const formatCurrency = (amount) => {
  if (!amount) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const ProjectForm = () => {
  const getInitialState = () => ({
    ProjectName: '',
    CustomerID: '',
    ProjectCode: '',
    ProjectDescription: '',
    LocationID: '',
    ProjectValue: '',
    StartDate: '',
    EndDate: '',
    Status: 'Active',
    ProjectFile: null
  });

  const [projectData, setProjectData] = useState(getInitialState());
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
    loadCustomers();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await customerAPI.getAll();
      setCustomers(response.data.value || response.data || []);
    } catch (error) {
      apiHelpers.showError(error, 'Failed to load customers');
    }
  };

  const loadLocations = async (customerId) => {
    console.log('Loading locations for customer:', customerId);
    try {
      const response = await locationAPI.getByCustomer(customerId);
      console.log('Locations response:', response.data);
      const locationsData = response.data.data ? response.data.data : [];
      console.log('Setting locations to:', locationsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Error loading locations:', error);
      apiHelpers.showError(error, 'Failed to load locations');
    }
  };

  const handleCustomerChange = (e) => {
    const { value } = e.target;
    console.log('Customer changed to:', value);
    setProjectData(prev => ({
      ...prev,
      CustomerID: value,
      LocationID: ''
    }));
    if (value) {
      loadLocations(value);
    } else {
      setLocations([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, files, selectedOption } = e.target;

    if (type === 'file') {
      setProjectData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setProjectData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!projectData.ProjectName.trim()) {
      newErrors.ProjectName = 'Project name is required';
    }

    if (!projectData.CustomerID) {
      newErrors.CustomerID = 'Customer selection is required';
    }

    // if (!projectData.LocationID) {
    //   newErrors.LocationID = 'Location is required';
    // }

    if (!projectData.ProjectValue.trim()) {
      newErrors.ProjectValue = 'Project value is required';
    } else if (isNaN(projectData.ProjectValue) || parseFloat(projectData.ProjectValue) <= 0) {
      newErrors.ProjectValue = 'Project value must be a positive number';
    }

    if (!projectData.StartDate) {
      newErrors.StartDate = 'Project start date is required';
    }

    if (!projectData.EndDate) {
      newErrors.EndDate = 'Project end date is required';
    }

    if (!projectData.Status) {
      newErrors.Status = 'Project status is required';
    }

    // Date validation
    if (projectData.StartDate && projectData.EndDate) {
      const startDate = new Date(projectData.StartDate);
      const endDate = new Date(projectData.EndDate);
      
      if (endDate <= startDate) {
        newErrors.EndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      for (const key in projectData) {
        formData.append(key, projectData[key]);
      }

      if (editingProject) {
        await projectAPI.update(editingProject.ProjectID, formData);
        apiHelpers.showSuccess('Project updated successfully!');
      } else {
        await projectAPI.create(formData);
        apiHelpers.showSuccess('Project created successfully!');
      }
      
      resetForm();
      await fetchProjects();
    } catch (error) {
      apiHelpers.handleFormError(error, 'project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProjectData(getInitialState());
    setErrors({});
    setEditingProject(null);
    setLocations([]); // Clear locations when resetting form
  };

  // Direct backend export function
  const handleExportProjects = async () => {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const exportUrl = `${API_BASE_URL}/api/export/projects`;

      // Show loading message
      const loadingToast = document.createElement('div');
      loadingToast.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 10000;
        background: #007bff; color: white; padding: 15px 20px;
        border-radius: 5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif; font-size: 14px;
      `;
      loadingToast.textContent = '🔄 Exporting projects... Please wait';
      document.body.appendChild(loadingToast);

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `Project_Master_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
      successToast.innerHTML = `✅ Project Export Started!<br><small>Downloading ALL project master fields + customer info</small>`;
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

  const handleEdit = (project) => {
    setEditingProject(project);
    setProjectData({
      ProjectName: project.ProjectName || '',
      CustomerID: project.CustomerID || '',
      ProjectCode: project.ProjectCode || '',
      ProjectDescription: project.ProjectDescription || '',
      LocationID: project.LocationID || '',
      ProjectValue: project.ProjectValue || '',
      StartDate: project.StartDate ? project.StartDate.split('T')[0] : '',
      EndDate: project.EndDate ? project.EndDate.split('T')[0] : '',
      Status: project.Status || 'Active',
      ProjectFile: null
    });

    if (project.CustomerID) {
      loadLocations(project.CustomerID);
    }

    // Scroll to top of the page to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (projectOrId) => {
    // Extract ID and project object
    const projectId = typeof projectOrId === 'object'
      ? projectOrId.ProjectID
      : projectOrId;
    const project = typeof projectOrId === 'object'
      ? projectOrId
      : projects.find(p => p.ProjectID === projectId);
    const projectName = project?.ProjectName || 'Project';

    console.log('🗑️ Delete requested for project:', projectId, projectName);

    if (window.confirm(`Are you sure you want to delete "${projectName}"?`)) {
      try {
        await projectAPI.delete(projectId);
        apiHelpers.showSuccess('Project deleted successfully!');
        await fetchProjects();
      } catch (error) {
        apiHelpers.handleFormError(error, 'project deletion');
      }
    }
  };

  const renderFormField = (label, name, type = 'text', options = {}, required = false) => {
    const { placeholder, values } = options;
    const isSelect = type === 'select';
    const isCustomerSelect = name === 'CustomerID';
    const isLocationSelect = name === 'LocationID';
    const isStatusSelect = name === 'Status';
    const id = `project-${name}`;

    return (
      <div className="form-group">
        <label htmlFor={id}>
          {label} {required && <span className="required-indicator">*</span>}
        </label>
        {isCustomerSelect ? (
          <Dropdown
            name={name}
            value={projectData[name]}
            onChange={handleCustomerChange}
            options={customers}
            valueKey="CustomerID"
            labelKey="Name"
            formatLabel={(customer) => `${customer.Name} (${customer.CustomerCode})`}
            placeholder="Select a customer"
            required={required}
            error={errors[name]}
            disabled={isSubmitting}
          />
        ) : isLocationSelect ? (
          <Dropdown
            name={name}
            value={projectData[name]}
            onChange={handleInputChange}
            options={locations}
            valueKey="LocationID"
            labelKey="LocationName"
            formatLabel={(location) => `${location.LocationName}`}
            placeholder="Select a location"
            required={required}
            error={errors[name]}
            disabled={isSubmitting || !projectData.CustomerID}
          />
        ) : isStatusSelect ? (
          <select
            id={id}
            name={name}
            value={projectData[name]}
            onChange={handleInputChange}
            required={required}
            className={errors[name] ? 'error' : ''}
            disabled={isSubmitting}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Completed">Completed</option>
          </select>
        ) : (
          <input
            type={type}
            id={id}
            name={name}
            value={projectData[name]}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            className={errors[name] ? 'error' : ''}
            disabled={isSubmitting}
            min={type === 'date' && name === 'EndDate' ? projectData.StartDate : undefined}
          />
        )}
        {errors[name] && <div className="error-message">{errors[name]}</div>}
      </div>
    );
  };

  const projectColumns = [
    { 
      key: 'ProjectName', 
      label: 'Project Name', 
      sortable: true,
      minWidth: '200px'
    },
    { 
      key: 'CustomerName', 
      label: 'Customer', 
      sortable: true,
      minWidth: '150px'
    },
    { 
      key: 'ProjectValue', 
      label: 'Value', 
      sortable: true,
      minWidth: '120px',
      render: (value) => formatCurrency(value)
    },
    { 
      key: 'StartDate', 
      label: 'Start Date', 
      sortable: true,
      minWidth: '120px',
      render: (value) => formatDate(value)
    },
    { 
      key: 'EndDate', 
      label: 'End Date', 
      sortable: true,
      minWidth: '120px',
      render: (value) => formatDate(value)
    },
    { 
      key: 'Status', 
      label: 'Status', 
      sortable: true,
      minWidth: '100px',
      render: (value) => (
        <span className={`status-badge ${value?.toLowerCase()}`}>
          {value || 'Active'}
        </span>
      )
    }
  ];

  return (
    <div className="project-form-container">
      <div className="form-header">
        <h1>📁 Project Master</h1>


        {editingProject && (
          <div className="edit-notice">
            <span className="edit-notice-text">
              Editing: <strong>{editingProject.ProjectName}</strong>
            </span>
            <button type="button" onClick={resetForm} className="cancel-edit-btn">
              Cancel Edit
            </button>
          </div>
        )}
      </div>

      <div className="project-form">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-sections">
            <div className="form-section">
              <h4>1. Project Details</h4>
              <div className="form-grid">
                {renderFormField('Project Name', 'ProjectName', 'text', { placeholder: 'Enter project name' }, true)}
                {renderFormField('Customer', 'CustomerID', 'select', {}, true)}
                {renderFormField('Location', 'LocationID', 'select', {}, false)}
                {renderFormField('Project Code', 'ProjectCode', 'text', { placeholder: 'Auto-generated', readOnly: true })}
                {renderFormField('Project Description', 'ProjectDescription', 'textarea', { placeholder: 'Enter project description' })}
                {renderFormField('Project Value (₹)', 'ProjectValue', 'number', { placeholder: 'Enter project value' }, true)}
                {renderFormField('Status', 'Status', 'select', {}, true)}
              </div>
            </div>

            <div className="form-section">
              <h4>2. Project Timeline</h4>
              <div className="form-grid">
                {renderFormField('Start Date', 'StartDate', 'date', {}, true)}
                {renderFormField('End Date', 'EndDate', 'date', {}, true)}
              </div>
            </div>

            <div className="form-section">
              <h4>3. Project Documents</h4>
              <div className="form-grid">
                <DocumentUpload
                    label="Project File"
                    name="ProjectFile"
                    value={projectData.ProjectFile}
                    onChange={handleInputChange}
                    onDelete={() => setProjectData(prev => ({...prev, ProjectFile: null}))}
                    existingFileUrl={editingProject?.ProjectFileUrl}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    entityType="projects"
                    entityId={editingProject?.ProjectID}
                    isEditing={!!editingProject}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={isSubmitting} className="submit-btn">
              {isSubmitting ? 'Processing...' : editingProject ? 'Update Project' : 'Add Project'}
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
          entity="projects"
          entityDisplayName="Projects"
          expectedFields={13}
        />
      </div>

      <DataTable
        title="📋 Project List"
        data={projects}
        columns={projectColumns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        keyField="ProjectID"
        emptyMessage="No projects found. Add your first project above."
        defaultRowsPerPage={5}
        showPagination={true}
        customizable={true}
        exportable={false}
      />
    </div>
  );
};

export default ProjectForm;