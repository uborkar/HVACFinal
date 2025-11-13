import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import DatabaseMigration from '../../utils/databaseMigration';
import './DatabaseMigrationPanel.css';

const DatabaseMigrationPanel = ({ onMigrationComplete }) => {
  const { user } = useAuth();
  const [migrationStatus, setMigrationStatus] = useState({
    needsMigration: false,
    oldProjectCount: 0,
    newProjectCount: 0,
    checking: true
  });
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const checkMigrationStatus = useCallback(async () => {
    try {
      setMigrationStatus(prev => ({ ...prev, checking: true }));
      const status = await DatabaseMigration.checkMigrationNeeded(user.uid);
      setMigrationStatus({
        ...status,
        checking: false
      });
    } catch (error) {
      console.error('Error checking migration status:', error);
      setMigrationStatus(prev => ({ ...prev, checking: false }));
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkMigrationStatus();
    }
  }, [user, checkMigrationStatus]);

  const handleMigration = async () => {
    try {
      setMigrating(true);
      
      // Create backup first
      const backupResult = await DatabaseMigration.backupUserData(user.uid);
      if (!backupResult.success) {
        throw new Error('Failed to create backup');
      }
      
      // Perform migration
      const result = await DatabaseMigration.migrateUserToFlatStructure(user.uid);
      setMigrationResult(result);
      
      if (result.success) {
        // Recheck migration status
        await checkMigrationStatus();
        
        // Notify parent component
        if (onMigrationComplete) {
          onMigrationComplete(result);
        }
      }
      
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationResult({
        success: false,
        error: error.message,
        message: 'Migration failed. Please try again.'
      });
    } finally {
      setMigrating(false);
    }
  };

  if (!user) {
    return null;
  }

  if (migrationStatus.checking) {
    return (
      <div className="migration-panel checking">
        <div className="migration-spinner"></div>
        <p>Checking migration status...</p>
      </div>
    );
  }

  if (!migrationStatus.needsMigration) {
    return (
      <div className="migration-panel success">
        <div className="migration-icon success">
          <i className="bi bi-check-circle-fill"></i>
        </div>
        <h3>Database Up to Date</h3>
        <p>Your projects are using the latest database structure.</p>
        <div className="migration-stats">
          <span>Projects: {migrationStatus.newProjectCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="migration-panel needs-migration">
      <div className="migration-header">
        <div className="migration-icon warning">
          <i className="bi bi-exclamation-triangle-fill"></i>
        </div>
        <h3>Database Migration Required</h3>
        <p>We've updated our database structure for better performance and organization.</p>
      </div>

      <div className="migration-details">
        <div className="migration-info">
          <div className="info-item">
            <span className="label">Old Projects:</span>
            <span className="value">{migrationStatus.oldProjectCount}</span>
          </div>
          <div className="info-item">
            <span className="label">New Projects:</span>
            <span className="value">{migrationStatus.newProjectCount}</span>
          </div>
        </div>

        <div className="migration-benefits">
          <h4>Benefits of Migration:</h4>
          <ul>
            <li>✅ Better data organization</li>
            <li>✅ Improved performance</li>
            <li>✅ Enhanced search capabilities</li>
            <li>✅ Future-proof structure</li>
          </ul>
        </div>
      </div>

      {migrationResult && (
        <div className={`migration-result ${migrationResult.success ? 'success' : 'error'}`}>
          <div className="result-icon">
            <i className={`bi bi-${migrationResult.success ? 'check-circle' : 'x-circle'}-fill`}></i>
          </div>
          <div className="result-message">
            <h4>{migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}</h4>
            <p>{migrationResult.message}</p>
            {migrationResult.success && (
              <div className="migration-summary">
                <span>Migrated: {migrationResult.migratedCount} projects</span>
                {migrationResult.errorCount > 0 && (
                  <span className="errors">Errors: {migrationResult.errorCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="migration-actions">
        <button 
          onClick={handleMigration}
          disabled={migrating}
          className="migrate-btn primary"
        >
          {migrating ? (
            <>
              <div className="btn-spinner"></div>
              Migrating...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-repeat"></i>
              Migrate Now
            </>
          )}
        </button>
        
        <button 
          onClick={() => setMigrationStatus(prev => ({ ...prev, needsMigration: false }))}
          className="migrate-btn secondary"
          disabled={migrating}
        >
          <i className="bi bi-clock"></i>
          Maybe Later
        </button>
      </div>

      <div className="migration-note">
        <i className="bi bi-info-circle"></i>
        <small>
          Your data will be safely backed up before migration. 
          This process is reversible and won't affect your existing projects.
        </small>
      </div>
    </div>
  );
};

export default DatabaseMigrationPanel;
