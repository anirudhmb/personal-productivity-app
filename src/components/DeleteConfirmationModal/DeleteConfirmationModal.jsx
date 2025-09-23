import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './DeleteConfirmationModal.css';

const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  itemType = 'item',
  itemName = '',
  itemDescription = '',
  itemId = '',
  confirmButtonText = 'Delete',
  cancelButtonText = 'Cancel',
  warningMessage = 'This action cannot be undone.'
}) => {
  const [dependencies, setDependencies] = useState(null);
  const [loadingDependencies, setLoadingDependencies] = useState(false);
  const [cascadeConfirmed, setCascadeConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen && itemId) {
      checkDependencies();
    } else {
      setDependencies(null);
      setCascadeConfirmed(false);
    }
  }, [isOpen, itemId]);

  const checkDependencies = async () => {
    setLoadingDependencies(true);
    try {
      let result;
      if (itemType === 'persona') {
        result = await invoke('check_persona_dependencies', { id: itemId });
      } else if (itemType === 'workstream') {
        result = await invoke('check_workstream_dependencies', { id: itemId });
      } else {
        // Tasks don't have dependencies
        setDependencies({ has_dependencies: false });
        setLoadingDependencies(false);
        return;
      }
      setDependencies(result);
    } catch (error) {
      console.error('Failed to check dependencies:', error);
      setDependencies({ has_dependencies: false });
    } finally {
      setLoadingDependencies(false);
    }
  };

  const handleConfirm = () => {
    if (dependencies?.has_dependencies && !cascadeConfirmed) {
      return; // Don't proceed if dependencies exist but not confirmed
    }
    onConfirm();
  };

  const getDependencyText = () => {
    if (!dependencies || !dependencies.has_dependencies) return null;

    if (itemType === 'persona') {
      const parts = [];
      if (dependencies.workstream_count > 0) {
        parts.push(`${dependencies.workstream_count} workstream${dependencies.workstream_count !== 1 ? 's' : ''}`);
      }
      if (dependencies.task_count > 0) {
        parts.push(`${dependencies.task_count} task${dependencies.task_count !== 1 ? 's' : ''}`);
      }
      return parts.join(' and ');
    } else if (itemType === 'workstream') {
      if (dependencies.task_count > 0) {
        return `${dependencies.task_count} task${dependencies.task_count !== 1 ? 's' : ''}`;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  const dependencyText = getDependencyText();
  const hasDependencies = dependencies?.has_dependencies;
  const canProceed = !hasDependencies || cascadeConfirmed;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <h3 className="modal-title">⚠️ Confirm Deletion</h3>
          <button onClick={onClose} className="btn btn-icon" disabled={isLoading}>
            ✖️
          </button>
        </div>
        
        <div className="modal-body">
          <p>Are you sure you want to delete this {itemType}?</p>
          {itemName && (
            <p className="item-name">
              <strong>"{itemName}"</strong>
            </p>
          )}
          {itemDescription && (
            <p className="item-description">{itemDescription}</p>
          )}

          {loadingDependencies ? (
            <div className="dependency-loading">
              <span className="loading-spinner"></span>
              <span>Checking dependencies...</span>
            </div>
          ) : hasDependencies ? (
            <div className="dependency-warning">
              <p className="warning-title">⚠️ This will also delete:</p>
              <p className="dependency-list">• {dependencyText}</p>
              <div className="cascade-confirmation">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={cascadeConfirmed}
                    onChange={(e) => setCascadeConfirmed(e.target.checked)}
                    disabled={isLoading}
                  />
                  <span>I understand this action cannot be undone</span>
                </label>
              </div>
            </div>
          ) : (
            <p className="warning-text">{warningMessage}</p>
          )}
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
            onClick={handleConfirm} 
            className="btn btn-danger"
            disabled={isLoading || !canProceed}
          >
            {isLoading ? 'Deleting...' : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
