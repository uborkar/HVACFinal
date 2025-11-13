/**
 * Database Structure Fix Utility
 * 
 * This script fixes the database structure for existing projects
 * to match the correct format expected by the application.
 * 
 * Run this from the browser console on the /projects page:
 * 1. Open browser console (F12)
 * 2. Copy and paste this entire script
 * 3. Call: await fixAllProjects()
 */

import { ref, get, update } from 'firebase/database';
import { db } from '../firebase/config';

/**
 * Fix a single project's structure
 */
export async function fixProjectStructure(userId, projectId) {
  try {
    console.log(`🔧 Fixing project structure for: ${projectId}`);
    
    // Get current project data
    const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
    const snapshot = await get(projectRef);
    
    if (!snapshot.exists()) {
      console.error(`❌ Project ${projectId} not found`);
      return { success: false, error: 'Project not found' };
    }
    
    const currentData = snapshot.val();
    console.log('📊 Current data:', currentData);
    
    // Check if designData exists
    if (!currentData.designData) {
      console.log('⚠️ No designData found, creating empty structure');
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
    
    // Fix meta structure - ensure all required fields exist
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
      savedAt: meta.savedAt || new Date().toISOString(),
      userId: meta.userId || userId,
      userEmail: meta.userEmail || ''
    };
    
    // Fix ambient structure
    const ambient = currentData.designData.ambient || {};
    const fixedAmbient = {
      dbF: parseFloat(ambient.dbF) || 0,
      wbF: parseFloat(ambient.wbF) || 0,
      rh: parseFloat(ambient.rh) || 0,
      dewPointF: parseFloat(ambient.dewPointF) || 0,
      grainsPerLb: parseFloat(ambient.grainsPerLb) || 0,
      pressure: parseFloat(ambient.pressure) || 1013.25
    };
    
    // Fix inside structure
    const inside = currentData.designData.inside || {};
    const fixedInside = {
      dbF: parseFloat(inside.dbF) || 0,
      wbF: parseFloat(inside.wbF) || 0,
      rh: parseFloat(inside.rh) || 0,
      dewPointF: parseFloat(inside.dewPointF) || 0,
      grainsPerLb: parseFloat(inside.grainsPerLb) || 0
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
    await update(projectRef, fixedData);
    
    console.log('✅ Project structure fixed successfully!');
    console.log('📊 Fixed data:', fixedData);
    
    return { success: true, data: fixedData };
    
  } catch (error) {
    console.error('❌ Error fixing project structure:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fix all projects for a user
 */
export async function fixAllUserProjects(userId) {
  try {
    console.log(`🔧 Fixing all projects for user: ${userId}`);
    
    // Get all projects
    const projectsRef = ref(db, `users/${userId}/projects`);
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️ No projects found for user');
      return { success: true, fixed: 0 };
    }
    
    const projects = snapshot.val();
    const projectIds = Object.keys(projects);
    
    console.log(`📋 Found ${projectIds.length} projects to fix`);
    
    let fixed = 0;
    let failed = 0;
    
    for (const projectId of projectIds) {
      const result = await fixProjectStructure(userId, projectId);
      if (result.success) {
        fixed++;
      } else {
        failed++;
      }
    }
    
    console.log(`✅ Fixed ${fixed} projects, ${failed} failed`);
    
    return { success: true, fixed, failed };
    
  } catch (error) {
    console.error('❌ Error fixing projects:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Browser console helper - call this function
 */
window.fixMyProjects = async function() {
  // Get current user from auth
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('❌ No user logged in. Please log in first.');
    return;
  }
  
  console.log(`🔧 Fixing projects for user: ${user.uid}`);
  const result = await fixAllUserProjects(user.uid);
  
  if (result.success) {
    console.log('✅ All projects fixed! Refresh the page to see changes.');
    alert(`✅ Fixed ${result.fixed} projects! Refresh the page.`);
  } else {
    console.error('❌ Failed to fix projects:', result.error);
    alert('❌ Failed to fix projects. Check console for details.');
  }
};

// Export for use in components
export default {
  fixProjectStructure,
  fixAllUserProjects
};
