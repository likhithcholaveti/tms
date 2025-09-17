import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3004/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('🔍 API RESPONSE DEBUG - Success:', {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {

    // Handle specific global errors
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.status === 503) {
      // Service unavailable
      const event = new CustomEvent('show-notification', {
        detail: {
          message: 'Service temporarily unavailable. Please try again later.',
          type: 'warning'
        }
      });
      window.dispatchEvent(event);
    }

    return Promise.reject(error);
  }
);

// Dashboard API
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard'),
};

// Customer API
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return api.post('/customers', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/customers', data);
  },
  update: (id, data) => {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return api.put(`/customers/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/customers/${id}`, data);
  },
  delete: (id) => api.delete(`/customers/${id}`),
  deleteFile: (id, fieldName) => api.delete(`/customers/${id}/files/${fieldName}`),
};

// Location API
export const locationAPI = {
  getAll: () => api.get('/locations'),
  getById: (id) => api.get(`/locations/${id}`),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Vendor API
export const vendorAPI = {
  getAll: () => api.get('/vendors'),
  getById: (id) => api.get(`/vendors/${id}`),
  create: (data) => {
    if (data instanceof FormData) {
      return api.post('/vendors', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post('/vendors', data);
  },
  update: (id, data) => {
    if (data instanceof FormData) {
      return api.put(`/vendors/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.put(`/vendors/${id}`, data);
  },
  delete: (id) => api.delete(`/vendors/${id}`),
  deleteFile: (id, fieldName) => api.delete(`/vendors/${id}/files/${fieldName}`),
};

// Vehicle API
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  create: (data) => {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return api.post('/vehicles', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.post('/vehicles', data);
  },
  update: (id, data) => {
    // Handle FormData for file uploads
    if (data instanceof FormData) {
      return api.put(`/vehicles/${id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
    return api.put(`/vehicles/${id}`, data);
  },
  delete: (id) => api.delete(`/vehicles/${id}`),
  deleteFile: (id, fieldName) => api.delete(`/vehicles/${id}/files/${fieldName}`),
};

// Driver API
export const driverAPI = {
  getAll: () => api.get('/drivers'),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => {
    // Handle FormData for file uploads
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.post('/drivers', data, config);
  },
  update: (id, data) => {
    // Handle FormData for file uploads
    const config = data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : {};
    return api.put(`/drivers/${id}`, data, config);
  },
  delete: (id) => api.delete(`/drivers/${id}`),
  deleteFile: (id, fieldName) => api.delete(`/drivers/${id}/files/${fieldName}`),
};

// Project API
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  getByCustomer: (customerId) => api.get(`/projects/customer/${customerId}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Vehicle Transaction API
// Original combined API (keeping for backward compatibility)
export const vehicleTransactionAPI = {
  getAll: (params) => api.get('/daily-vehicle-transactions', { params }),
  getById: (id, type = null) => {
    const typeParam = type ? `?type=${type}` : '';
    return api.get(`/daily-vehicle-transactions/${id}${typeParam}`);
  },
  create: (data) => api.post('/daily-vehicle-transactions', data),
  update: (id, data) => api.put(`/daily-vehicle-transactions/${id}`, data),
  delete: (id) => api.delete(`/daily-vehicle-transactions/${id}`),

  // File upload methods
  createWithFiles: (formData) => api.post('/daily-vehicle-transactions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateWithFiles: (id, formData) => api.put(`/daily-vehicle-transactions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),

  // Export methods - Direct download without opening new tabs
  exportFixed: async () => {
    try {
      const response = await api.get('/daily-vehicle-transactions/export/fixed', {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'fixed-transactions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Fixed error:', error);
      throw error;
    }
  },

  exportAdhoc: async () => {
    try {
      const response = await api.get('/daily-vehicle-transactions/export/adhoc', {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'adhoc-replacement-transactions.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export Adhoc error:', error);
      throw error;
    }
  },

  deleteFile: (id, fieldName) => api.delete(`/daily-vehicle-transactions/${id}/files/${fieldName}`),
};

// Fixed Vehicle Transactions API - Uses Master Data Relationships
// Links to: Customer, Project, Vehicle, Driver, Vendor tables via IDs
export const fixedTransactionAPI = {
  getAll: (params) => api.get('/fixed-transactions', { params }),
  getById: (id) => api.get(`/fixed-transactions/${id}`),
  create: (data) => api.post('/fixed-transactions', data),
  update: (id, data) => api.put(`/fixed-transactions/${id}`, data),
  delete: (id) => api.delete(`/fixed-transactions/${id}`),
};

// Adhoc/Replacement Vehicle Transactions API - Uses Manual Data Entry
// Stores manual entries directly without master data relationships
export const adhocTransactionAPI = {
  getAll: (params) => api.get('/adhoc-transactions', { params }),
  getById: (id) => api.get(`/adhoc-transactions/${id}`),
  create: (data) => api.post('/adhoc-transactions', data),
  update: (id, data) => api.put(`/adhoc-transactions/${id}`, data),
  delete: (id) => api.delete(`/adhoc-transactions/${id}`),
};



// Billing API
export const billingAPI = {
  getAll: () => api.get('/billing'),
  getById: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
};

// Payment API
export const paymentAPI = {
  getAll: () => api.get('/payments'),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
};


// Reports API
export const reportsAPI = {
  getDailyTrips: (params) => api.get('/reports/daily-trips', { params }),
  getUtilization: (params) => api.get('/reports/utilization', { params }),
  getVehicleUtilization: (params) => api.get('/reports/utilization', { params }), // Alias for compatibility
  getRevenue: (params) => api.get('/reports/revenue', { params }),
  getPayments: (params) => api.get('/reports/payments', { params }),
  getPaymentSummary: (params) => api.get('/reports/payments', { params }), // Alias for compatibility
  getGSTSummary: (params) => api.get('/reports/gst-summary', { params }),
};

// Generic API helper functions
export const apiHelpers = {
  handleError: (error, defaultMessage = 'An error occurred') => {
    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        return 'Unable to connect to server. Please check if the backend server is running.';
      }
      if (error.code === 'ENOTFOUND') {
        return 'Server not found. Please check the server URL.';
      }
      return 'Network error. Please check your internet connection.';
    }

    // Handle HTTP status codes
    const status = error.response.status;
    const data = error.response.data;

    switch (status) {
      case 400:
        return data?.error || 'Invalid request. Please check your input data.';
      case 401:
        return 'Authentication failed. Please login again.';
      case 403:
        return 'Access denied. You don\'t have permission to perform this action.';
      case 404:
        return data?.error || 'Resource not found.';
      case 409:
        return data?.error || 'Conflict. The resource already exists.';
      case 422:
        return data?.error || 'Validation failed. Please check your input.';
      case 500:
        return data?.error || 'Internal server error. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. The server is temporarily down.';
      case 504:
        return 'Gateway timeout. The server took too long to respond.';
      default:
        // Try to get specific error message from response
        if (data?.error) {
          return data.error;
        }
        if (data?.message) {
          return data.message;
        }
        return `Server error (${status}). ${defaultMessage}`;
    }
  },
  
  showSuccess: (message) => {
    // Dispatch custom event for in-app notification
    const event = new CustomEvent('show-notification', {
      detail: { message, type: 'success' }
    });
    window.dispatchEvent(event);
  },

  showError: (error, defaultMessage = 'An error occurred') => {
    const errorMessage = apiHelpers.handleError(error, defaultMessage);
    // Dispatch custom event for in-app notification
    const event = new CustomEvent('show-notification', {
      detail: { message: errorMessage, type: 'error' }
    });
    window.dispatchEvent(event);
  },

  showWarning: (message) => {
    // Dispatch custom event for in-app notification
    const event = new CustomEvent('show-notification', {
      detail: { message, type: 'warning' }
    });
    window.dispatchEvent(event);
  },

  showInfo: (message) => {
    // Dispatch custom event for in-app notification
    const event = new CustomEvent('show-notification', {
      detail: { message, type: 'info' }
    });
    window.dispatchEvent(event);
  },

  // Helper to show validation errors
  showValidationErrors: (errors) => {
    if (Array.isArray(errors)) {
      errors.forEach(error => apiHelpers.showError(null, error));
    } else if (typeof errors === 'object') {
      Object.values(errors).forEach(error => apiHelpers.showError(null, error));
    } else {
      apiHelpers.showError(null, errors);
    }
  },

  // Test server connection
  testConnection: async () => {
    try {
      await api.get('/dashboard');
      apiHelpers.showSuccess('Server connection successful!');
      return true;
    } catch (error) {
      apiHelpers.showError(error, 'Failed to connect to server');
      return false;
    }
  },

  // Helper to handle form submission errors
  handleFormError: (error, formName = 'form') => {
    if (error.response?.status === 400 && error.response?.data?.errors) {
      // Handle validation errors from backend
      const errors = error.response.data.errors;
      if (Array.isArray(errors)) {
        errors.forEach(err => apiHelpers.showError(null, err));
      } else {
        Object.entries(errors).forEach(([field, message]) => {
          apiHelpers.showError(null, `${field}: ${message}`);
        });
      }
    } else {
      // Handle general form errors
      apiHelpers.showError(error, `Failed to submit ${formName}`);
    }
  },
};

export default api;
