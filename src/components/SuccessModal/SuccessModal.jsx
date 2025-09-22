import React from 'react';
import './SuccessModal.css';

const SuccessModal = ({
  isOpen,
  onClose,
  title = 'Operation Result',
  message = '',
  buttonText = 'OK',
  type = 'success' // 'success', 'error', 'info'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'success':
      default:
        return '✅';
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case 'error':
        return 'var(--color-error-dark)';
      case 'info':
        return 'var(--color-primary)';
      case 'success':
      default:
        return 'var(--color-success-dark)';
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content success-modal">
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: getTitleColor() }}>
            {getIcon()} {title}
          </h3>
          <button onClick={onClose} className="btn btn-icon">
            ✖️
          </button>
        </div>
        
        <div className="modal-body">
          <p className="result-message">{message}</p>
        </div>
        
        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
