import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import './DatabaseTest.css';

function DatabaseTest() {
  const [dbStatus, setDbStatus] = useState('');
  const [testResult, setTestResult] = useState('');
  const [personas, setPersonas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('test_database_connection');
      setDbStatus(result);
    } catch (error) {
      setDbStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestPersona = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('create_test_persona');
      setTestResult(result);
      // Refresh personas list
      loadPersonas();
    } catch (error) {
      setTestResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonas = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('get_all_personas');
      setPersonas(result);
    } catch (error) {
      console.error('Error loading personas:', error);
      setPersonas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setDbStatus('');
    setTestResult('');
    setPersonas([]);
  };

  const deletePersona = async (personaId) => {
    setIsLoading(true);
    try {
      const result = await invoke('delete_persona', { id: personaId });
      setTestResult(result);
      // Refresh personas list
      loadPersonas();
    } catch (error) {
      setTestResult(`Error deleting persona: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAllPersonas = async () => {
    setIsLoading(true);
    try {
      const result = await invoke('clear_all_personas');
      setTestResult(result);
      // Refresh personas list
      loadPersonas();
    } catch (error) {
      setTestResult(`Error clearing personas: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="database-test">
      <div className="database-test-header">
        <h1 className="database-test-title">Database Testing</h1>
        <p className="database-test-subtitle">Test database connection and operations</p>
      </div>

      <div className="database-test-content">
        {/* Test Controls */}
        <section className="database-test-section">
          <h2 className="section-title">Test Controls</h2>
          <div className="card">
            <div className="test-controls">
              <button 
                onClick={testDatabaseConnection} 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Testing...' : '🔗 Test Database Connection'}
              </button>
              
              <button 
                onClick={createTestPersona} 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Creating...' : '➕ Create Test Persona'}
              </button>
              
              <button 
                onClick={loadPersonas} 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Loading...' : '📋 Load Personas'}
              </button>
              
              <button 
                onClick={clearResults} 
                className="btn btn-secondary"
                disabled={isLoading}
              >
                🗑️ Clear Results
              </button>
              
              <button 
                onClick={clearAllPersonas} 
                className="btn btn-danger"
                disabled={isLoading}
              >
                {isLoading ? '⏳ Clearing...' : '🗑️ Clear All Personas'}
              </button>
            </div>
          </div>
        </section>

        {/* Database Status */}
        {dbStatus && (
          <section className="database-test-section">
            <h2 className="section-title">Database Status</h2>
            <div className="card">
              <div className="status-box status-info">
                <div className="status-header">
                  <span className="status-icon">ℹ️</span>
                  <strong>Connection Status</strong>
                </div>
                <div className="status-content">{dbStatus}</div>
              </div>
            </div>
          </section>
        )}

        {/* Test Results */}
        {testResult && (
          <section className="database-test-section">
            <h2 className="section-title">Test Results</h2>
            <div className="card">
              <div className="status-box status-success">
                <div className="status-header">
                  <span className="status-icon">✅</span>
                  <strong>Operation Result</strong>
                </div>
                <div className="status-content">{testResult}</div>
              </div>
            </div>
          </section>
        )}

        {/* Personas Data */}
        <section className="database-test-section">
          <h2 className="section-title">Database Personas ({personas.length})</h2>
          <div className="card">
            <div className="status-box status-warning">
              <div className="status-header">
                <span className="status-icon">📊</span>
                <strong>Personas Data</strong>
              </div>
              <div className="status-content">
                {personas.length > 0 ? (
                  <>
                    <div className="personas-list">
                      {personas.map((persona, index) => (
                        <div key={persona.id || index} className="persona-item">
                          <div className="persona-info">
                            <div className="persona-name">{persona.name}</div>
                            <div className="persona-id">ID: {persona.id}</div>
                            <div className="persona-description">{persona.description || 'No description'}</div>
                          </div>
                          <button 
                            onClick={() => deletePersona(persona.id)}
                            className="btn btn-danger btn-sm"
                            disabled={isLoading}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      ))}
                    </div>
                    <details className="json-details">
                      <summary>View Raw JSON</summary>
                      <pre className="json-display">
                        {JSON.stringify(personas, null, 2)}
                      </pre>
                    </details>
                  </>
                ) : (
                  <div className="no-results">
                    <div className="no-results-icon">📭</div>
                    <h3 className="no-results-title">No Personas Found</h3>
                    <p className="no-results-message">
                      The database is empty. Click "Create Test Persona" to add some test data.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Instructions */}
        <section className="database-test-section">
          <h2 className="section-title">Instructions</h2>
          <div className="card">
            <div className="instructions">
              <ol>
                <li><strong>Test Database Connection:</strong> Verifies the SQLite database is accessible and shows available tables</li>
                <li><strong>Create Test Persona:</strong> Inserts a new persona record into the database with a unique ID</li>
                <li><strong>Load Personas:</strong> Retrieves all personas from the database and displays them in a user-friendly format</li>
                <li><strong>Delete Persona:</strong> Click the "🗑️ Delete" button next to any persona to remove it from the database</li>
                <li><strong>Clear All Personas:</strong> Removes all persona records from the database</li>
                <li><strong>Clear Results:</strong> Clears all test results and data from the UI</li>
              </ol>
              <p className="note">
                <strong>Note:</strong> The database file is created at <code>./data.db</code> in the Tauri application directory.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DatabaseTest;
