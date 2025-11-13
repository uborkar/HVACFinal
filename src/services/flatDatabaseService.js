// Firebase Realtime Database Service for Flat Structure
// Matches the desired structure: heatLoadSummary, inventory, projects, spaceConsidered, users

import { ref, set, get, push, update, remove } from 'firebase/database';
import { db } from '../firebase/config';

export class FlatDatabaseService {
  
  // ==================== USER MANAGEMENT ====================
  
  async createUser(userId, userData) {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userStructure = {
        profile: {
          name: userData.name || '',
          email: userData.email || '',
          company: userData.company || '',
          role: userData.role || 'engineer',
          createdAt: Date.now(),
          lastLogin: Date.now()
        },
        projects: {}, // Will store project references
        settings: {
          defaultUnits: 'metric',
          defaultDiversityFactor: 1.2,
          preferredManufacturer: ''
        }
      };
      
      await set(userRef, userStructure);
      console.log('User created successfully:', userId);
      return userStructure;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      const userRef = ref(db, `users/${userId}`);
      const snapshot = await get(userRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  async updateUserLastLogin(userId) {
    try {
      const userRef = ref(db, `users/${userId}/profile/lastLogin`);
      await set(userRef, Date.now());
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  // ==================== PROJECT MANAGEMENT ====================
  
  async createProject(userId, projectData, projectId = null) {
    try {
      // Generate project ID if not provided
      if (!projectId) {
        const tempRef = push(ref(db, `users/${userId}/projects`));
        projectId = tempRef.key;
      }
      
      // Create project ONLY in user's projects - single source of truth
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      
      const projectStructure = {
        projectId,
        projectName: projectData.projectName || '',
        projectNumber: projectData.projectNumber || projectId,
        location: projectData.location || '',
        clientName: projectData.clientName || '',
        consultantName: projectData.consultantName || '',
        userId,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        status: 'draft', // draft, in-progress, completed
        version: 1,
        
        // Design conditions
        designData: projectData.designData || {},
        
        // Building structure
        buildingData: projectData.buildingData || {
          totalFloors: 0,
          totalArea: 0,
          floors: []
        }
      };
      
      // Save ONLY to user's projects (no duplicate at root level)
      await set(userProjectRef, projectStructure);
      
      console.log('✅ Project created successfully at /users/' + userId + '/projects/' + projectId);
      return { projectId, ...projectStructure };
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  async getProject(projectId, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot get project without userId');
        throw new Error('User ID is required to get project');
      }
      
      // Read from user's projects only
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const snapshot = await get(projectRef);
      return snapshot.exists() ? { projectId, ...snapshot.val() } : null;
    } catch (error) {
      console.error('❌ Error getting project:', error);
      throw error;
    }
  }

  async updateProject(projectId, updateData, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot update project without userId');
        throw new Error('User ID is required to update project');
      }
      
      // Update in user's projects only
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const updates = {
        ...updateData,
        lastUpdated: Date.now()
      };
      await update(projectRef, updates);
      console.log('✅ Project updated successfully:', projectId);
      return updates;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  }

  async getUserProjects(userId) {
    try {
      console.log('🔍 Loading projects for user:', userId);
      const userProjectsRef = ref(db, `users/${userId}/projects`);
      const snapshot = await get(userProjectsRef);
      
      if (!snapshot.exists()) {
        console.log('⚠️ No projects found for user:', userId);
        return [];
      }
      
      const projectsData = snapshot.val();
      console.log('📊 Raw projects data:', Object.keys(projectsData).length, 'projects');
      
      // Projects are already stored directly under users/{userId}/projects/{projectId}
      // No need to fetch from separate /projects/ node
      const projects = Object.entries(projectsData).map(([projectId, projectData]) => {
        console.log(`📋 Project ${projectId}:`, {
          hasDesignData: !!projectData.designData,
          hasSpaceData: !!projectData.spaceData,
          hasMeta: !!projectData.meta,
          hasDesignDataMeta: !!projectData.designData?.meta,
          designDataMetaKeys: projectData.designData?.meta ? Object.keys(projectData.designData.meta) : [],
          projectName: projectData.designData?.meta?.projectName || projectData.meta?.projectName || 'NO NAME',
          projectNumber: projectData.designData?.meta?.projectNumber || projectData.meta?.projectNumber || 'NO NUMBER',
          keys: Object.keys(projectData)
        });
        
        // Ensure meta is accessible at root level for backward compatibility
        const project = {
          id: projectId,
          projectId: projectId,
          ...projectData,
          // Add meta at root level if it exists in designData
          meta: projectData.designData?.meta || projectData.meta
        };
        
        return project;
      });
      
      console.log('✅ Loaded', projects.length, 'projects for user:', userId);
      return projects.sort((a, b) => (b.lastUpdated || b.updatedAt || 0) - (a.lastUpdated || a.updatedAt || 0));
    } catch (error) {
      console.error('❌ Error getting user projects:', error);
      throw error;
    }
  }

  // ==================== SPACE CONSIDERED ====================
  
  async saveSpaceConsidered(projectNumber, spaceData) {
    try {
      const spaceRef = ref(db, `spaceConsidered/${projectNumber}`);
      const spaceStructure = {
        ...spaceData,
        projectNumber,
        savedAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await set(spaceRef, spaceStructure);
      console.log('Space considered data saved:', projectNumber);
      return spaceStructure;
    } catch (error) {
      console.error('Error saving space considered:', error);
      throw error;
    }
  }

  async getSpaceConsidered(projectNumber) {
    try {
      const spaceRef = ref(db, `spaceConsidered/${projectNumber}`);
      const snapshot = await get(spaceRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting space considered:', error);
      throw error;
    }
  }

  // ==================== HEAT LOAD SUMMARY ====================
  
  async saveHeatLoadSummary(projectNumber, floor, summaryData) {
    try {
      const summaryRef = ref(db, `heatLoadSummary/${projectNumber}/${floor}`);
      const summaryStructure = {
        ...summaryData,
        projectNumber,
        floor,
        savedAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await set(summaryRef, summaryStructure);
      console.log('Heat load summary saved:', projectNumber, floor);
      return summaryStructure;
    } catch (error) {
      console.error('Error saving heat load summary:', error);
      throw error;
    }
  }

  async getHeatLoadSummary(projectNumber, floor = null) {
    try {
      const summaryRef = floor 
        ? ref(db, `heatLoadSummary/${projectNumber}/${floor}`)
        : ref(db, `heatLoadSummary/${projectNumber}`);
      
      const snapshot = await get(summaryRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting heat load summary:', error);
      throw error;
    }
  }

  // ==================== INVENTORY ====================
  
  async saveInventory(projectNumber, floor, inventoryData) {
    try {
      const inventoryRef = ref(db, `inventory/${projectNumber}/${floor}`);
      const inventoryStructure = {
        ...inventoryData,
        projectNumber,
        floor,
        savedAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await set(inventoryRef, inventoryStructure);
      console.log('Inventory saved:', projectNumber, floor);
      return inventoryStructure;
    } catch (error) {
      console.error('Error saving inventory:', error);
      throw error;
    }
  }

  async getInventory(projectNumber, floor = null) {
    try {
      const inventoryRef = floor 
        ? ref(db, `inventory/${projectNumber}/${floor}`)
        : ref(db, `inventory/${projectNumber}`);
      
      const snapshot = await get(inventoryRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting inventory:', error);
      throw error;
    }
  }

  // ==================== ROOM CALCULATIONS ====================
  
  async saveRoomCalculation(projectId, floorId, roomId, calculationData, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot save room calculation without userId');
        throw new Error('User ID is required to save room calculation');
      }
      
      // Save room calculation in user's project building data
      const roomRef = ref(db, `users/${userId}/projects/${projectId}/buildingData/floors/${floorId}/rooms/${roomId}/heatLoadData`);
      const calculationStructure = {
        ...calculationData,
        calculatedAt: Date.now(),
        calculated: true
      };
      
      await set(roomRef, calculationStructure);
      console.log('✅ Room calculation saved:', projectId, floorId, roomId);
      return calculationStructure;
    } catch (error) {
      console.error('❌ Error saving room calculation:', error);
      throw error;
    }
  }

  async getRoomCalculation(projectId, floorId, roomId, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot get room calculation without userId');
        throw new Error('User ID is required to get room calculation');
      }
      
      const roomRef = ref(db, `users/${userId}/projects/${projectId}/buildingData/floors/${floorId}/rooms/${roomId}/heatLoadData`);
      const snapshot = await get(roomRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('❌ Error getting room calculation:', error);
      throw error;
    }
  }

  // ==================== EQUIPMENT SELECTION ====================
  
  async saveEquipmentSelection(projectId, equipmentData, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot save equipment selection without userId');
        throw new Error('User ID is required to save equipment selection');
      }
      
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection`);
      const equipmentStructure = {
        ...equipmentData,
        savedAt: Date.now(),
        lastUpdated: Date.now()
      };
      
      await set(equipmentRef, equipmentStructure);
      console.log('✅ Equipment selection saved:', projectId);
      return equipmentStructure;
    } catch (error) {
      console.error('❌ Error saving equipment selection:', error);
      throw error;
    }
  }

  async getEquipmentSelection(projectId, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot get equipment selection without userId');
        throw new Error('User ID is required to get equipment selection');
      }
      
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection`);
      const snapshot = await get(equipmentRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('❌ Error getting equipment selection:', error);
      throw error;
    }
  }

  // ==================== UTILITY FUNCTIONS ====================
  
  async deleteProject(projectId, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot delete project without userId');
        throw new Error('User ID is required to delete project');
      }
      
      console.log('🗑️ Deleting project:', projectId, 'for user:', userId);
      
      // Remove from user's projects (single source of truth)
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await remove(userProjectRef);
      
      console.log('✅ Project deleted successfully:', projectId);
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }

  // ==================== MIGRATION UTILITIES ====================
  
  async migrateToFlatStructure(userId) {
    try {
      console.log('Starting migration to flat structure for user:', userId);
      
      // Get existing user projects
      const userProjects = await this.getUserProjects(userId);
      
      for (const project of userProjects) {
        // Migrate space considered data if exists
        if (project.spaceData) {
          await this.saveSpaceConsidered(project.projectNumber, project.spaceData);
        }
        
        // Migrate heat load summary if exists
        if (project.heatLoadSummary) {
          for (const [floor, summaryData] of Object.entries(project.heatLoadSummary)) {
            await this.saveHeatLoadSummary(project.projectNumber, floor, summaryData);
          }
        }
        
        // Migrate inventory if exists
        if (project.inventory) {
          for (const [floor, inventoryData] of Object.entries(project.inventory)) {
            await this.saveInventory(project.projectNumber, floor, inventoryData);
          }
        }
      }
      
      console.log('Migration completed for user:', userId);
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const flatDatabaseService = new FlatDatabaseService();
export default flatDatabaseService;
