import React, { useState } from 'react';
import { ref, get, update } from 'firebase/database';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import toast from '../../utils/toast';
import './DatabaseFixPanel.css';

/**
 * Database Fix Panel Component
 * 
 * This component provides a UI to fix the database structure
 * for existing projects to match the correct format.
 */
const DatabaseFixPanel = () => {
  const { user } = useAuth();
  const [fixing, setFixing] = useState(false);
  const [results, setResults] = useState(null);

  const fixProjectStructure = async (userId, projectId, currentData) => {
    try {
      console.log(`🔧 Fixing project: ${projectId}`);
      
      // Ensure designData exists
      if (!currentData.designData) {
        currentData.designData = {
          meta: {},
          ambient: {},
          inside: {}
        };
      }
      
      // Ensure meta exists
      if (!currentData.designData.meta) {
        currentData.designData.meta = {};
      }
      
      // Fix meta structure
      const meta = currentData.designData.meta;
      const fixedMeta = {
        projectName: meta.projectName || `Project ${projectId}`,
        projectNumber: meta.projectNumber || projectId,
        address: meta.address || '',
        estimatedBy: meta.estimatedBy || '',
        heatLoadFor: meta.heatLoadFor || 'Summer',
        buildingType: meta.buildingType || '',
        totalFloors: meta.totalFloors || 0,
        basementFloors: meta.basementFloors || 0,
        floorConfiguration: meta.floorConfiguration || [],
        spaceConsidered: meta.spaceConsidered || '',
        floor: meta.floor || '',
        savedAt: meta.savedAt || currentData.lastUpdated || new Date().toISOString(),
        userId: meta.userId || userId,
        userEmail: meta.userEmail || user.email || ''
      };
      
      // Fix ambient structure
      const ambient = currentData.designData.ambient || {};
      const fixedAmbient = {
        dbF: parseFloat(ambient.dbF) || 0,
        wbF: parseFloat(ambient.wbF) || 0,
        rh: parseFloat(ambient.rh) || 0,
        dewPointF: parseFloat(ambient.dewPointF) || parseFloat(ambient.dpF) || 0,
        grainsPerLb: parseFloat(ambient.grainsPerLb) || parseFloat(ambient.grLb) || 0,
        pressure: parseFloat(ambient.pressure) || 1013.25
      };
      
      // Fix inside structure
      const inside = currentData.designData.inside || {};
      const fixedInside = {
        dbF: parseFloat(inside.dbF) || 0,
        wbF: parseFloat(inside.wbF) || 0,
        rh: parseFloat(inside.rh) || 0,
        dewPointF: parseFloat(inside.dewPointF) || parseFloat(inside.dpF) || 0,
        grainsPerLb: parseFloat(inside.grainsPerLb) || parseFloat(inside.grLb) || 0
      };
      
      // Create fixed structure
      const fixedData = {
        ...currentData,
        designData: {
          meta: fixedMeta,
          ambient: fixedAmbient,
          inside: fixedInside
        },
        currentStep: currentData.currentStep || 1,
        lastUpdated: new Date().toISOString(),
        userId: userId
      };
      
      // Update Firebase
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await update(projectRef, fixedData);
      
      console.log('✅ Project fixed:', projectId);
      return { success: true, projectId, data: fixedData };
      
    } catch (error) {
      console.error('❌ Error fixing project:', projectId, error);
      return { success: false, projectId, error: error.message };
    }
  };

  const fixAllProjects = async () => {
    if (!user) {
      toast.error('Please log in first');
      return;
    }

    setFixing(true);
    setResults(null);

    try {
      console.log('🔧 Starting database structure fix...');
      
      // Get all projects
      const projectsRef = ref(db, `users/${user.uid}/projects`);
      const snapshot = await get(projectsRef);
      
      if (!snapshot.exists()) {
        toast.warning('No projects found');
        setFixing(false);
        return;
      }
      
      const projects = snapshot.val();
      const projectIds = Object.keys(projects);
      
      console.log(`📋 Found ${projectIds.length} projects to fix`);
      toast.info(`Found ${projectIds.length} projects. Fixing...`);
      
      const fixResults = [];
      
      for (const projectId of projectIds) {
        const result = await fixProjectStructure(user.uid, projectId, projects[projectId]);
        fixResults.push(result);
      }
      
      const successful = fixResults.filter(r => r.success).length;
      const failed = fixResults.filter(r => !r.success).length;
      
      setResults({
        total: projectIds.length,
        successful,
        failed,
        details: fixResults
      });
      
      if (failed === 0) {
        toast.success(`✅ Successfully fixed ${successful} projects!`);
      } else {
        toast.warning(`Fixed ${successful} projects, ${failed} failed`);
      }
      
      console.log('✅ Database fix complete!', fixResults);
      
    } catch (error) {
      console.error('❌ Error fixing database:', error);
      toast.error(`Failed to fix database: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="database-fix-panel">
      <div className="panel-header">
        <h2>🔧 Database Structure Fix</h2>
        <p>Fix the structure of existing projects to match the correct format</p>
      </div>

      <div className="panel-content">
        <div className="info-box">
          <h3>What this does:</h3>
          <ul>
            <li>✅ Ensures all projects have proper <code>designData</code> structure</li>
            <li>✅ Adds missing fields in <code>meta</code>, <code>ambient</code>, and <code>inside</code></li>
            <li>✅ Sets default values for empty fields</li>
            <li>✅ Preserves existing data</li>
            <li>✅ Updates <code>lastUpdated</code> timestamp</li>
          </ul>
        </div>

        <div className="warning-box">
          <h3>⚠️ Before you proceed:</h3>
          <ul>
            <li>This will modify your Firebase database</li>
            <li>Existing data will be preserved</li>
            <li>Missing fields will be filled with defaults</li>
            <li>You may want to backup your data first</li>
          </ul>
        </div>

        <div className="action-section">
          <button
            className="fix-button"
            onClick={fixAllProjects}
            disabled={fixing || !user}
          >
            {fixing ? '🔄 Fixing Projects...' : '🔧 Fix All Projects'}
          </button>
        </div>

        {results && (
          <div className="results-section">
            <h3>Results:</h3>
            <div className="results-summary">
              <div className="result-stat">
                <span className="stat-label">Total Projects:</span>
                <span className="stat-value">{results.total}</span>
              </div>
              <div className="result-stat success">
                <span className="stat-label">✅ Fixed:</span>
                <span className="stat-value">{results.successful}</span>
              </div>
              {results.failed > 0 && (
                <div className="result-stat error">
                  <span className="stat-label">❌ Failed:</span>
                  <span className="stat-value">{results.failed}</span>
                </div>
              )}
            </div>

            <div className="results-details">
              <h4>Details:</h4>
              {results.details.map((result, index) => (
                <div key={index} className={`result-item ${result.success ? 'success' : 'error'}`}>
                  <span className="result-icon">{result.success ? '✅' : '❌'}</span>
                  <span className="result-project">Project {result.projectId}</span>
                  {!result.success && (
                    <span className="result-error">{result.error}</span>
                  )}
                </div>
              ))}
            </div>

            <div className="next-steps">
              <h4>Next Steps:</h4>
              <ol>
                <li>Refresh the page to see updated projects</li>
                <li>Open each project to verify data</li>
                <li>Fill in any missing information in Form 1</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseFixPanel;
