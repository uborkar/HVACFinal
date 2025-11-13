/**
 * Cleanup Utility for Duplicate Projects
 * Removes duplicate projects from root /projects node
 * Migrates any orphaned projects to user's projects
 */

import { ref, get, remove } from 'firebase/database';
import { db } from '../firebase/config';

/**
 * Check if there are duplicate projects at root /projects
 * @returns {Promise<Object>} Status object with duplicate info
 */
export const checkForDuplicates = async () => {
  try {
    const projectsRef = ref(db, 'projects');
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      return {
        hasDuplicates: false,
        count: 0,
        projects: []
      };
    }
    
    const projects = [];
    snapshot.forEach((childSnapshot) => {
      projects.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    return {
      hasDuplicates: true,
      count: projects.length,
      projects
    };
  } catch (error) {
    console.error('❌ Error checking for duplicates:', error);
    throw error;
  }
};

/**
 * Delete all projects from root /projects node
 * WARNING: This will permanently delete the root /projects node
 * @returns {Promise<Object>} Cleanup result
 */
export const deleteRootProjectsNode = async () => {
  try {
    console.log('🗑️ Starting cleanup of root /projects node...');
    
    const projectsRef = ref(db, 'projects');
    const snapshot = await get(projectsRef);
    
    if (!snapshot.exists()) {
      console.log('✅ No root /projects node found. Nothing to clean up.');
      return {
        success: true,
        message: 'No duplicate projects found',
        deletedCount: 0
      };
    }
    
    const projectCount = Object.keys(snapshot.val()).length;
    
    // Delete the entire root /projects node
    await remove(projectsRef);
    
    console.log(`✅ Successfully deleted ${projectCount} projects from root /projects node`);
    
    return {
      success: true,
      message: `Deleted ${projectCount} duplicate projects`,
      deletedCount: projectCount
    };
  } catch (error) {
    console.error('❌ Error deleting root projects node:', error);
    return {
      success: false,
      message: error.message,
      deletedCount: 0
    };
  }
};

/**
 * Migrate a specific project from root /projects to /users/{userId}/projects
 * @param {string} projectId - Project ID to migrate
 * @param {string} userId - User ID to migrate to
 * @returns {Promise<boolean>} Success status
 */
export const migrateProjectToUser = async (projectId, userId) => {
  try {
    console.log(`🔄 Migrating project ${projectId} to user ${userId}...`);
    
    // Get project data from root
    const rootProjectRef = ref(db, `projects/${projectId}`);
    const snapshot = await get(rootProjectRef);
    
    if (!snapshot.exists()) {
      console.log(`⚠️ Project ${projectId} not found at root /projects`);
      return false;
    }
    
    const projectData = snapshot.val();
    
    // Check if project already exists in user's projects
    const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
    const userSnapshot = await get(userProjectRef);
    
    if (userSnapshot.exists()) {
      console.log(`ℹ️ Project ${projectId} already exists in user's projects. Deleting from root only.`);
      await remove(rootProjectRef);
      return true;
    }
    
    // Project doesn't exist in user's projects, migrate it
    const { set } = await import('firebase/database');
    await set(userProjectRef, {
      ...projectData,
      userId,
      migratedAt: Date.now(),
      migratedFrom: 'root'
    });
    
    // Delete from root after successful migration
    await remove(rootProjectRef);
    
    console.log(`✅ Successfully migrated project ${projectId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error migrating project ${projectId}:`, error);
    return false;
  }
};

/**
 * Clean up all duplicate projects
 * Option 1: Just delete all (use if data is already in user projects)
 * Option 2: Migrate orphaned projects first, then delete
 * @param {string} userId - Current user ID (for migration option)
 * @param {boolean} migrateFirst - Whether to migrate before deleting
 * @returns {Promise<Object>} Cleanup result
 */
export const cleanupDuplicateProjects = async (userId, migrateFirst = false) => {
  try {
    console.log('🧹 Starting duplicate projects cleanup...');
    
    const duplicateCheck = await checkForDuplicates();
    
    if (!duplicateCheck.hasDuplicates) {
      return {
        success: true,
        message: 'No duplicate projects found',
        migrated: 0,
        deleted: 0
      };
    }
    
    let migratedCount = 0;
    
    if (migrateFirst && userId) {
      console.log(`📦 Attempting to migrate ${duplicateCheck.count} projects first...`);
      
      for (const project of duplicateCheck.projects) {
        // Use project's userId if available, otherwise use provided userId
        const targetUserId = project.userId || userId;
        const success = await migrateProjectToUser(project.id, targetUserId);
        if (success) migratedCount++;
      }
      
      console.log(`✅ Migrated ${migratedCount} projects`);
    }
    
    // Now delete any remaining projects at root
    const deleteResult = await deleteRootProjectsNode();
    
    return {
      success: true,
      message: migrateFirst 
        ? `Migrated ${migratedCount} projects and cleaned up root node`
        : `Deleted ${deleteResult.deletedCount} duplicate projects`,
      migrated: migratedCount,
      deleted: deleteResult.deletedCount
    };
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    return {
      success: false,
      message: error.message,
      migrated: 0,
      deleted: 0
    };
  }
};

/**
 * Verify that user's projects are properly stored
 * @param {string} userId - User ID to verify
 * @returns {Promise<Object>} Verification result
 */
export const verifyUserProjects = async (userId) => {
  try {
    const userProjectsRef = ref(db, `users/${userId}/projects`);
    const snapshot = await get(userProjectsRef);
    
    if (!snapshot.exists()) {
      return {
        valid: true,
        count: 0,
        message: 'User has no projects'
      };
    }
    
    const projects = snapshot.val();
    const projectCount = Object.keys(projects).length;
    
    // Verify each project has userId
    const invalidProjects = [];
    Object.entries(projects).forEach(([projectId, projectData]) => {
      if (!projectData.userId || projectData.userId !== userId) {
        invalidProjects.push(projectId);
      }
    });
    
    return {
      valid: invalidProjects.length === 0,
      count: projectCount,
      invalidProjects,
      message: invalidProjects.length === 0
        ? `All ${projectCount} projects are properly stored`
        : `Found ${invalidProjects.length} projects with incorrect userId`
    };
  } catch (error) {
    console.error('❌ Error verifying user projects:', error);
    return {
      valid: false,
      count: 0,
      message: error.message
    };
  }
};

export default {
  checkForDuplicates,
  deleteRootProjectsNode,
  migrateProjectToUser,
  cleanupDuplicateProjects,
  verifyUserProjects
};
