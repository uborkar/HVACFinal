import { db } from '../firebase/config';
import { ref, set, get, update, remove, push } from 'firebase/database';

// Real-time listeners storage
const listeners = new Map();

export const databaseService = {
  // ==================== MIGRATION OPERATIONS ====================
  
  /**
   * Get all legacy projects (without userId)
   */
  getLegacyProjects: async () => {
    try {
      const projectsRef = ref(db, 'projects');
      const snapshot = await get(projectsRef);
      
      if (snapshot.exists()) {
        const projects = [];
        snapshot.forEach((childSnapshot) => {
          const project = {
            id: childSnapshot.key,
            ...childSnapshot.val()
          };
          // Only include projects without userId (legacy projects)
          if (!project.userId) {
            projects.push(project);
          }
        });
        return projects;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting legacy projects:', error);
      throw error;
    }
  },

  /**
   * Migrate legacy project to user (from root /projects to /users/{userId}/projects)
   */
  migrateProjectToUser: async (userId, projectId) => {
    try {
      // Get the legacy project from root /projects
      const projectRef = ref(db, `projects/${projectId}`);
      const snapshot = await get(projectRef);
      
      if (!snapshot.exists()) {
        throw new Error('Legacy project not found');
      }
      
      const projectData = snapshot.val();
      
      // Add userId to the project
      const updatedProject = {
        ...projectData,
        userId: userId,
        migratedAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Save to user's projects (new location)
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await set(userProjectRef, updatedProject);
      
      // DELETE the legacy project from root /projects
      await remove(projectRef);
      
      console.log('✅ Project migrated from /projects/' + projectId + ' to /users/' + userId + '/projects/' + projectId);
      return projectId;
    } catch (error) {
      console.error('❌ Error migrating project:', error);
      throw error;
    }
  },

  /**
   * Migrate all legacy projects to current user
   */
  migrateAllLegacyProjects: async (userId) => {
    try {
      const legacyProjects = await databaseService.getLegacyProjects();
      const migrationResults = [];
      
      for (const project of legacyProjects) {
        try {
          await databaseService.migrateProjectToUser(userId, project.id);
          migrationResults.push({
            projectId: project.id,
            projectName: project.meta?.projectName || 'Untitled',
            success: true
          });
        } catch (error) {
          migrationResults.push({
            projectId: project.id,
            projectName: project.meta?.projectName || 'Untitled',
            success: false,
            error: error.message
          });
        }
      }
      
      return migrationResults;
    } catch (error) {
      console.error('Error migrating all projects:', error);
      throw error;
    }
  },

  /**
   * Get projects for user (including legacy projects that haven't been migrated)
   */
  getUserProjects: async (userId) => {
    try {
      // Get user's projects
      const userProjectsRef = ref(db, `users/${userId}/projects`);
      const userSnapshot = await get(userProjectsRef);
      
      const userProjects = [];
      if (userSnapshot.exists()) {
        userSnapshot.forEach((childSnapshot) => {
          userProjects.push({
            id: childSnapshot.key,
            ...childSnapshot.val(),
            isMigrated: true
          });
        });
      }
      
      // Get legacy projects that belong to this user (based on some heuristic)
      // For now, we'll get all legacy projects and let the UI handle migration
      const legacyProjects = await databaseService.getLegacyProjects();
      
      // Combine both lists
      const allProjects = [...userProjects, ...legacyProjects];
      
      // Sort by updatedAt (newest first)
      return allProjects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  },

  /**
   * Check if user has legacy projects that need migration
   */
  hasLegacyProjects: async () => {
    try {
      const legacyProjects = await databaseService.getLegacyProjects();
      return legacyProjects.length > 0;
    } catch (error) {
      console.error('Error checking legacy projects:', error);
      return false;
    }
  },

  // ==================== USER PROFILE OPERATIONS ====================
  
  /**
   * Create or update user profile
   */
  saveUserProfile: async (userId, profileData) => {
    try {
      const profileRef = ref(db, `users/${userId}/profile`);
      await set(profileRef, {
        ...profileData,
        uid: userId,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  },

  /**
   * Get user profile
   */
  getUserProfile: async (userId) => {
    try {
      const profileRef = ref(db, `users/${userId}/profile`);
      const snapshot = await get(profileRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting profile:', error);
      throw error;
    }
  },

  // ==================== PROJECT OPERATIONS ====================
  
  /**
   * Create or update a project with user isolation
   */
  saveProject: async (userId, projectId, projectData) => {
    try {
      // Store project ONLY in user's projects - single source of truth
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      
      const projectWithUser = {
        ...projectData,
        userId: userId,
        createdAt: projectData.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      
      // Save ONLY to user's projects (no duplicate at root level)
      await set(userProjectRef, projectWithUser);
      
      console.log('✅ Project saved to /users/' + userId + '/projects/' + projectId);
      return projectId;
    } catch (error) {
      console.error('❌ Error saving project:', error);
      throw error;
    }
  },

  /**
   * Get a specific project from user's projects
   */
  getProject: async (projectId, userId) => {
    try {
      if (!userId) {
        console.error('❌ Cannot get project without userId');
        throw new Error('User ID is required to get project');
      }
      
      // Read from user's projects only
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const snapshot = await get(projectRef);
      
      if (snapshot.exists()) {
        return {
          id: projectId,
          ...snapshot.val()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting project:', error);
      throw error;
    }
  },

  /**
   * Subscribe to user's projects with real-time updates
   */
  subscribeToUserProjects: (userId, callback) => {
    const userProjectsRef = ref(db, `users/${userId}/projects`);
    
    const unsubscribe = () => {
      // For Realtime DB, we'd use onValue but for simplicity we'll use polling
      // In a real app, you'd implement proper real-time listeners
      console.log('Real-time subscription not implemented for Realtime DB');
    };
    
    // For now, we'll get projects once
    get(userProjectsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const projects = [];
        snapshot.forEach((childSnapshot) => {
          projects.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        callback(projects);
      } else {
        callback([]);
      }
    }).catch((error) => {
      console.error('Error in projects subscription:', error);
      callback([], error);
    });
    
    listeners.set(`projects_${userId}`, unsubscribe);
    return unsubscribe;
  },

  /**
   * Delete project from user's projects only
   */
  deleteProject: async (userId, projectId) => {
    try {
      if (!userId) {
        console.error('❌ Cannot delete project without userId');
        throw new Error('User ID is required to delete project');
      }
      
      // Remove ONLY from user's projects
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await remove(userProjectRef);
      
      console.log('✅ Project deleted from /users/' + userId + '/projects/' + projectId);
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  },

  /**
   * Duplicate project
   */
  duplicateProject: async (userId, projectId, newProjectId, newName) => {
    try {
      const originalProject = await databaseService.getProject(projectId, userId);
      
      if (!originalProject) {
        throw new Error('Original project not found');
      }
      
      // Create duplicate with new ID and name
      const duplicatedProject = {
        ...originalProject,
        meta: {
          ...originalProject.meta,
          projectNumber: newProjectId,
          projectName: newName,
          savedAt: new Date().toISOString()
        },
        userId: userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      delete duplicatedProject.id;
      
      await databaseService.saveProject(userId, newProjectId, duplicatedProject);
      console.log('✅ Project duplicated successfully');
      return newProjectId;
    } catch (error) {
      console.error('❌ Error duplicating project:', error);
      throw error;
    }
  },

  // ==================== CALCULATION OPERATIONS ====================
  
  /**
   * Save calculation data for a user
   */
  saveCalculation: async (userId, calculationData) => {
    try {
      const calculationRef = ref(db, `users/${userId}/calculations`);
      const newCalculationRef = push(calculationRef);
      
      await set(newCalculationRef, {
        ...calculationData,
        id: newCalculationRef.key,
        userId: userId,
        timestamp: Date.now(),
        date: new Date().toLocaleString()
      });
      
      return newCalculationRef.key;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  },

  /**
   * Get all calculations for a user
   */
  getUserCalculations: async (userId) => {
    try {
      const calculationsRef = ref(db, `users/${userId}/calculations`);
      const snapshot = await get(calculationsRef);
      
      if (snapshot.exists()) {
        const calculations = [];
        snapshot.forEach((childSnapshot) => {
          calculations.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        // Sort by timestamp (newest first)
        return calculations.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error getting calculations:', error);
      throw error;
    }
  },

  /**
   * Get a specific calculation
   */
  getCalculation: async (userId, calculationId) => {
    try {
      const calculationRef = ref(db, `users/${userId}/calculations/${calculationId}`);
      const snapshot = await get(calculationRef);
      
      if (snapshot.exists()) {
        return {
          id: calculationId,
          ...snapshot.val()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting calculation:', error);
      throw error;
    }
  },

  /**
   * Update a calculation
   */
  updateCalculation: async (userId, calculationId, updates) => {
    try {
      const calculationRef = ref(db, `users/${userId}/calculations/${calculationId}`);
      await update(calculationRef, {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error('Error updating calculation:', error);
      throw error;
    }
  },

  /**
   * Delete a calculation
   */
  deleteCalculation: async (userId, calculationId) => {
    try {
      const calculationRef = ref(db, `users/${userId}/calculations/${calculationId}`);
      await remove(calculationRef);
    } catch (error) {
      console.error('Error deleting calculation:', error);
      throw error;
    }
  },

  // ==================== SEARCH OPERATIONS ====================
  
  /**
   * Search projects by name, number, or address
   */
  searchProjects: async (userId, searchTerm) => {
    try {
      const projects = await databaseService.getUserProjects(userId);
      
      return projects.filter(project => 
        project.meta?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.meta?.projectNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.meta?.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching projects:', error);
      throw error;
    }
  },

  // ==================== CLEANUP ====================
  
  /**
   * Unsubscribe from all listeners
   */
  unsubscribeAll: () => {
    listeners.forEach((unsubscribe) => unsubscribe());
    listeners.clear();
  }
};

// Export as firestoreService for backward compatibility (but it uses Realtime DB)
export const firestoreService = databaseService;