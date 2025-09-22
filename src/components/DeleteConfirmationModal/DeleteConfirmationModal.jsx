import React from 'react';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  itemType = 'item',
  itemName = '',
  itemDescription = '',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  warningMessage = 'This action cannot be undone.'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <h3 className="modal-title">Confirm Deletion</h3>
          <button onClick={onClose} className="btn btn-icon" disabled={isLoading}>
            ✖️
          </button>
        </div>
        
        <div className="modal-body">
          <p>Are you sure you want to delete this {itemType}?</p>
          {itemName && (
            <p className="item-name">
              <strong>{itemName}</strong>
            </p>
          )}
          {itemDescription && (
            <p className="item-description">{itemDescription}</p>
          )}
          <p className="warning-text">{warningMessage}</p>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={onClose} 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {cancelButtonText}
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
