import React from 'react';
import './DocumentUpload.css';

const NewDocumentUpload = ({
  label,
  name,
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  required = false,
  error = '',
  className = ''
}) => {
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
            {value ? value.name : 'No file chosen'}
          </span>
        </div>
      </div>

      {error && <span className="error-message">{error}</span>}
    </div>
  );
};

export default NewDocumentUpload;
