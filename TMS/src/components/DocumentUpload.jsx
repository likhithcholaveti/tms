import React, { useState, useEffect } from 'react';
import './DocumentUpload.css';

const DocumentUpload = ({
  label,
  name,
  value,
  onChange,
  onDelete = null, // Optional delete handler for edit mode
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  required = false,
  error = '',
  className = '',
  existingFileUrl = null, // URL for existing file
  entityType = null, // e.g., 'vehicles', 'vendors', 'drivers', 'transactions'
  entityId = null, // ID of the entity being edited
  isEditing = false // Whether we're in edit mode
}) => {
  const [preview, setPreview] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (value) {
      if (typeof value === 'string') {
        // If value is a URL/path from database
        let fileUrl = value;
        if (!value.startsWith('http')) {
          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3005';
          // The `value` prop should contain the relative path to the file, including the entity folder.
          // e.g., 'customers/some-file.pdf'
          // We construct the full URL by combining the base URL, the '/uploads' path, and the file path.
          const filePath = value.replace(/\\/g, '/'); // Normalize path separators
          fileUrl = `${apiBaseUrl}/uploads/${filePath}`;
        }

        setPreview(fileUrl);
        setFileType(getFileTypeFromPath(value));
      } else if (value instanceof File) {
        // If value is a File object

        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target.result);
          setFileType(value.type);
        };
        reader.readAsDataURL(value);
      }
    } else if (existingFileUrl && isEditing) {
      // Show existing file in edit mode

      // Add cache busting parameter to prevent browser caching issues
      const cacheBustUrl = existingFileUrl.includes('?')
        ? `${existingFileUrl}&t=${Date.now()}`
        : `${existingFileUrl}?t=${Date.now()}`;

      setPreview(cacheBustUrl);
      setFileType(getFileTypeFromPath(existingFileUrl));
    } else {

      setPreview(null);
      setFileType(null);
    }
  }, [value, existingFileUrl, isEditing, entityType, name]);

  const getFileTypeFromPath = (path) => {
    const extension = path.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'application/pdf';
    } else {
      return 'document';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange({
        target: {
          name,
          files: [file]
        }
      });
    }
  };

  const handleRemove = async () => {
    try {
      // If we have an onDelete handler and we're editing an existing file
      if (onDelete && isEditing && (value || existingFileUrl)) {
        const filename = typeof value === 'string' ? value : (existingFileUrl || '');
        await onDelete(name, filename);
      }

      // Clear the local state
      setPreview(null);
      setFileType(null);

      // Notify parent component
      onChange({
        target: {
          name,
          files: []
        }
      });
    } catch (error) {

      // You might want to show an error message to the user here
    }
  };

  const renderPreview = () => {


    if (!preview) return null;

    if (fileType && (fileType.startsWith('image') || fileType === 'image')) {

      return (
        <div className="document-preview">
          <img
            src={preview}
            alt="Document preview"
            className="preview-image clickable-preview"
            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', cursor: 'pointer' }}
            onClick={() => setShowModal(true)}
            title="Click to view full size"

          />
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="document-preview">
          <div className="pdf-preview">
            <span className="pdf-icon">📄</span>
            <span>PDF Document</span>
            <a href={preview} target="_blank" rel="noopener noreferrer" className="view-link">
              View PDF
            </a>
          </div>
        </div>
      );
    } else {
      return (
        <div className="document-preview">
          <div className="document-icon">
            <span className="doc-icon">📄</span>
            <span>Document</span>
            <a href={preview} target="_blank" rel="noopener noreferrer" className="view-link">
              View Document
            </a>
          </div>
        </div>
      );
    }
  };

  return (
    <div className={`document-upload ${className}`}>
      <label>{label} {required && <span className="required">*</span>}</label>

      <div className="upload-container">
        <input
          type="file"
          id={`file-${name}`}
          name={name}
          onChange={handleFileChange}
          accept={accept}
          required={required}
          className="file-input-hidden"
        />

        <div className="file-display-area">
          <label htmlFor={`file-${name}`} className="choose-file-btn">
            Choose File
          </label>

          <span className="file-name-display">
            {value ? (
              typeof value === 'string' ?
                (value.split('/').pop().split('\\').pop()) :
                value.name
            ) : existingFileUrl && isEditing ? (
              `📎 ${existingFileUrl.split('/').pop().split('\\').pop()}`
            ) : 'No file chosen'}
          </span>

          {(preview || (existingFileUrl && isEditing)) && (
            <button
              type="button"
              onClick={handleRemove}
              className="remove-btn"
              title="Remove document"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {renderPreview()}

      {error && <span className="error-message">{error}</span>}

      {/* Modal for full-size image viewing */}
      {showModal && preview && (fileType?.startsWith('image') || fileType === 'image') && (
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
                src={preview}
                alt="Full size preview"
                className="modal-image"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
