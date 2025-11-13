import { ref, set, get, update, push, remove, onValue } from 'firebase/database';
import { db } from '../firebase/config';
import { createProjectStructure, createFloorStructure, createRoomStructure } from './firebaseStructure';

/**
 * HVAC Database Service
 * Handles all Firebase Realtime Database operations for HVAC system
 */
class HVACDatabaseService {
  constructor() {
    this.listeners = new Map(); // Track active listeners
  }

  // ==================== USER MANAGEMENT ====================
  
  async createUserProfile(userId, profileData) {
    try {
      const userRef = ref(db, `users/${userId}`);
      const userData = {
        profile: {
          ...profileData,
          createdAt: Date.now(),
          lastLogin: Date.now()
        },
        projects: {},
        settings: {
          defaultUnits: 'metric',
          defaultDiversityFactor: 1.2,
          preferredManufacturer: 'general'
        }
      };
      
      await set(userRef, userData);
      console.log('User profile created successfully');
      return userData;
    } catch (error) {
      console.error('Error creating user profile:', error);
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
  
  async createProject(userId, projectData) {
    try {
      // Generate project ID
      const tempRef = push(ref(db, `users/${userId}/projects`));
      const projectId = tempRef.key;
      
      const projectStructure = createProjectStructure({
        ...projectData,
        userId,
        projectId
      });
      
      // Create project ONLY in user's projects - single source of truth
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await set(userProjectRef, projectStructure);
      
      // Log activity
      await this.logActivity(projectId, 'created', 'project', `Project ${projectData.projectName} created`, userId);
      
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
      
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const snapshot = await get(projectRef);
      return snapshot.exists() ? { projectId, ...snapshot.val() } : null;
    } catch (error) {
      console.error('❌ Error getting project:', error);
      throw error;
    }
  }

  async getUserProjects(userId) {
    try {
      const userProjectsRef = ref(db, `users/${userId}/projects`);
      const snapshot = await get(userProjectsRef);
      
      if (!snapshot.exists()) return [];
      
      const projectsData = snapshot.val();
      const projects = [];
      
      // Projects are stored directly, no need to fetch separately
      for (const [projectId, projectData] of Object.entries(projectsData)) {
        projects.push({
          projectId,
          ...projectData
        });
      }
      
      return projects.sort((a, b) => (b.meta?.lastUpdated || 0) - (a.meta?.lastUpdated || 0));
    } catch (error) {
      console.error('❌ Error getting user projects:', error);
      throw error;
    }
  }

  async updateProject(projectId, updates, userId) {
    try {
      if (!userId) {
        console.error('❌ Cannot update project without userId');
        throw new Error('User ID is required to update project');
      }
      
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const updateData = {
        ...updates,
        'meta/lastUpdated': Date.now()
      };
      
      await update(projectRef, updateData);
      console.log('✅ Project updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      throw error;
    }
  }

  async deleteProject(userId, projectId) {
    try {
      if (!userId) {
        console.error('❌ Cannot delete project without userId');
        throw new Error('User ID is required to delete project');
      }
      
      // Remove ONLY from user's projects
      const userProjectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await remove(userProjectRef);
      
      console.log('✅ Project deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      throw error;
    }
  }

  // ==================== BUILDING STRUCTURE ====================
  
  async addFloor(projectId, floorData, userId) {
    try {
      const floorsRef = ref(db, `users/${userId}/projects/${projectId}/building/floors`);
      const newFloorRef = push(floorsRef);
      const floorId = newFloorRef.key;
      
      const floorStructure = createFloorStructure({
        ...floorData,
        floorId,
        createdAt: Date.now()
      });
      
      await set(newFloorRef, floorStructure);
      
      // Update total floors count
      const totalFloorsRef = ref(db, `users/${userId}/projects/${projectId}/building/totalFloors`);
      const floorsSnapshot = await get(floorsRef);
      const totalFloors = floorsSnapshot.exists() ? Object.keys(floorsSnapshot.val()).length : 1;
      await set(totalFloorsRef, totalFloors);
      
      await this.logActivity(projectId, 'created', 'building', `Floor ${floorData.name} added`, userId);
      
      return { floorId, ...floorStructure };
    } catch (error) {
      console.error('❌ Error adding floor:', error);
      throw error;
    }
  }

  async addRoom(projectId, floorId, roomData, userId) {
    try {
      const roomsRef = ref(db, `users/${userId}/projects/${projectId}/building/floors/${floorId}/rooms`);
      const newRoomRef = push(roomsRef);
      const roomId = newRoomRef.key;
      
      const roomStructure = createRoomStructure({
        ...roomData,
        roomId,
        floorId,
        createdAt: Date.now()
      });
      
      await set(newRoomRef, roomStructure);
      
      // Update floor total area
      await this.updateFloorTotals(projectId, floorId, userId);
      
      await this.logActivity(projectId, 'created', 'building', `Room ${roomData.name} added to ${floorId}`, userId);
      
      return { roomId, ...roomStructure };
    } catch (error) {
      console.error('❌ Error adding room:', error);
      throw error;
    }
  }

  async updateRoomHeatLoad(projectId, floorId, roomId, heatLoadData, userId) {
    try {
      const roomHeatLoadRef = ref(db, `users/${userId}/projects/${projectId}/building/floors/${floorId}/rooms/${roomId}/heatLoad`);
      const heatLoadUpdate = {
        ...heatLoadData,
        calculated: true,
        calculatedAt: Date.now()
      };
      
      await set(roomHeatLoadRef, heatLoadUpdate);
      
      // Update floor and project totals
      await this.updateFloorTotals(projectId, floorId, userId);
      await this.updateProjectTotals(projectId, userId);
      
      await this.logActivity(projectId, 'calculated', 'heatload', `Heat load calculated for room ${roomId}`, userId);
      
      return heatLoadUpdate;
    } catch (error) {
      console.error('❌ Error updating room heat load:', error);
      throw error;
    }
  }

  async updateFloorTotals(projectId, floorId, userId) {
    try {
      const roomsRef = ref(db, `users/${userId}/projects/${projectId}/building/floors/${floorId}/rooms`);
      const snapshot = await get(roomsRef);
      
      if (!snapshot.exists()) return;
      
      const rooms = snapshot.val();
      let totalArea = 0;
      let totalTR = 0;
      let totalCFM = 0;
      
      Object.values(rooms).forEach(room => {
        totalArea += parseFloat(room.area || 0);
        if (room.heatLoad && room.heatLoad.calculated) {
          totalTR += parseFloat(room.heatLoad.TR || 0);
          totalCFM += parseFloat(room.heatLoad.CFM || 0);
        }
      });
      
      const floorTotalsRef = ref(db, `users/${userId}/projects/${projectId}/building/floors/${floorId}`);
      await update(floorTotalsRef, {
        totalArea,
        totalTR,
        totalCFM,
        lastUpdated: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Error updating floor totals:', error);
      throw error;
    }
  }

  async updateProjectTotals(projectId, userId) {
    try {
      const floorsRef = ref(db, `users/${userId}/projects/${projectId}/building/floors`);
      const snapshot = await get(floorsRef);
      
      if (!snapshot.exists()) return;
      
      const floors = snapshot.val();
      let totalArea = 0;
      let totalTR = 0;
      let totalCFM = 0;
      let totalFloors = Object.keys(floors).length;
      
      Object.values(floors).forEach(floor => {
        totalArea += parseFloat(floor.totalArea || 0);
        totalTR += parseFloat(floor.totalTR || 0);
        totalCFM += parseFloat(floor.totalCFM || 0);
      });
      
      const buildingRef = ref(db, `users/${userId}/projects/${projectId}/building`);
      await update(buildingRef, {
        totalArea,
        totalTR,
        totalCFM,
        totalFloors,
        lastUpdated: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Error updating project totals:', error);
      throw error;
    }
  }

  // ==================== EQUIPMENT SELECTION ====================
  
  async saveEquipmentSelection(projectId, floorId, equipmentData, userId) {
    try {
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection/${floorId}`);
      const equipmentUpdate = {
        ...equipmentData,
        lastUpdated: Date.now(),
        updatedBy: userId
      };
      
      await set(equipmentRef, equipmentUpdate);
      
      // Update project equipment summary
      await this.updateProjectEquipmentSummary(projectId, userId);
      
      await this.logActivity(projectId, 'updated', 'equipment', `Equipment selection updated for floor ${floorId}`, userId);
      
      return equipmentUpdate;
    } catch (error) {
      console.error('❌ Error saving equipment selection:', error);
      throw error;
    }
  }

  async updateProjectEquipmentSummary(projectId, userId) {
    try {
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection`);
      const snapshot = await get(equipmentRef);
      
      if (!snapshot.exists()) return;
      
      const floorEquipment = snapshot.val();
      let totalTR = 0;
      let totalCFM = 0;
      let totalIDUs = 0;
      let totalODUs = 0;
      let totalHP = 0;
      
      Object.values(floorEquipment).forEach(floor => {
        if (floor.floorSummary) {
          totalTR += parseFloat(floor.floorSummary.totalIDUTonnage || 0);
          totalCFM += parseFloat(floor.floorSummary.totalCFM || 0);
          totalODUs += parseFloat(floor.floorSummary.numberOfODUs || 0);
          totalHP += parseFloat(floor.floorSummary.selectedODUHP || 0);
        }
        
        if (floor.rooms) {
          Object.values(floor.rooms).forEach(room => {
            totalIDUs += parseFloat(room.numberOfIDUs || 0);
          });
        }
      });
      
      const summaryRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection/projectSummary`);
      await set(summaryRef, {
        totalTR,
        totalCFM,
        totalIDUs,
        totalODUs,
        totalHP,
        lastUpdated: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Error updating project equipment summary:', error);
      throw error;
    }
  }

  // ==================== BOQ MANAGEMENT ====================
  
  async generateBOQ(projectId, userId) {
    try {
      // Get equipment selection data
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentSelection`);
      const equipmentSnapshot = await get(equipmentRef);
      
      if (!equipmentSnapshot.exists()) {
        throw new Error('No equipment selection data found');
      }
      
      const equipmentData = equipmentSnapshot.val();
      const boq = await this.calculateBOQ(equipmentData);
      
      // Save BOQ to database
      const boqRef = ref(db, `users/${userId}/projects/${projectId}/boq`);
      await set(boqRef, {
        ...boq,
        generatedAt: Date.now(),
        generatedBy: userId
      });
      
      await this.logActivity(projectId, 'generated', 'boq', 'BOQ generated successfully', userId);
      
      return boq;
    } catch (error) {
      console.error('❌ Error generating BOQ:', error);
      throw error;
    }
  }

  async calculateBOQ(equipmentData) {
    // BOQ calculation logic based on equipment selection
    const boq = {
      indoorUnits: {},
      outdoorUnits: {},
      accessories: {},
      summary: {}
    };
    
    let equipmentCost = 0;
    let materialCost = 0;
    
    // Calculate IDU costs
    Object.values(equipmentData).forEach(floor => {
      if (floor.rooms) {
        Object.values(floor.rooms).forEach(room => {
          const iduType = room.iduType;
          const quantity = room.numberOfIDUs || 0;
          const capacity = room.machineTR || 0;
          
          if (!boq.indoorUnits[iduType]) {
            boq.indoorUnits[iduType] = {
              model: room.iduModel || `${iduType}-${capacity}TR`,
              capacity,
              quantity: 0,
              unitPrice: this.getIDUPrice(iduType, capacity),
              totalPrice: 0
            };
          }
          
          boq.indoorUnits[iduType].quantity += quantity;
          boq.indoorUnits[iduType].totalPrice = 
            boq.indoorUnits[iduType].quantity * boq.indoorUnits[iduType].unitPrice;
          
          equipmentCost += boq.indoorUnits[iduType].unitPrice * quantity;
        });
      }
      
      // Calculate ODU costs
      if (floor.floorSummary) {
        const oduModel = floor.floorSummary.oduModel || 'Standard ODU';
        const oduHP = floor.floorSummary.selectedODUHP || 0;
        const oduQuantity = floor.floorSummary.numberOfODUs || 1;
        
        if (!boq.outdoorUnits[oduModel]) {
          boq.outdoorUnits[oduModel] = {
            capacity: oduHP,
            hp: oduHP,
            quantity: 0,
            unitPrice: this.getODUPrice(oduHP),
            totalPrice: 0
          };
        }
        
        boq.outdoorUnits[oduModel].quantity += oduQuantity;
        boq.outdoorUnits[oduModel].totalPrice = 
          boq.outdoorUnits[oduModel].quantity * boq.outdoorUnits[oduModel].unitPrice;
        
        equipmentCost += boq.outdoorUnits[oduModel].unitPrice * oduQuantity;
      }
    });
    
    // Calculate accessories (simplified)
    const totalIDUs = Object.values(boq.indoorUnits).reduce((sum, idu) => sum + idu.quantity, 0);
    const totalODUs = Object.values(boq.outdoorUnits).reduce((sum, odu) => sum + odu.quantity, 0);
    
    boq.accessories = {
      wiredRemotes: { quantity: totalIDUs, unitPrice: 150, totalPrice: totalIDUs * 150 },
      copperPiping: { quantity: totalIDUs * 20, unitPrice: 25, totalPrice: totalIDUs * 20 * 25 },
      refrigerantGas: { quantity: totalIDUs * 2, unitPrice: 45, totalPrice: totalIDUs * 2 * 45 },
      drainPiping: { quantity: totalIDUs * 10, unitPrice: 15, totalPrice: totalIDUs * 10 * 15 },
      oduMountingPads: { quantity: totalODUs, unitPrice: 500, totalPrice: totalODUs * 500 }
    };
    
    materialCost = Object.values(boq.accessories).reduce((sum, acc) => sum + acc.totalPrice, 0);
    
    // Summary
    const subtotal = equipmentCost + materialCost;
    const installationCost = subtotal * 0.3; // 30% of equipment + material
    const tax = subtotal * 0.18; // 18% GST
    const totalCost = subtotal + installationCost + tax;
    
    boq.summary = {
      equipmentCost,
      materialCost,
      installationCost,
      subtotal,
      tax,
      totalCost
    };
    
    return boq;
  }

  getIDUPrice(iduType, capacity) {
    const basePrices = {
      'wall-mounted': 800,
      'cassette-4way': 1200,
      'ducted': 1000
    };
    return (basePrices[iduType] || 1000) + (capacity * 400);
  }

  getODUPrice(hp) {
    return hp * 600; // Base price per HP
  }

  // ==================== ACTIVITY LOGGING ====================
  
  async logActivity(projectId, action, section, details, userId) {
    try {
      const activityRef = ref(db, `users/${userId}/projects/${projectId}/activityLog`);
      const newActivityRef = push(activityRef);
      
      await set(newActivityRef, {
        action,
        section,
        details,
        userId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('❌ Error logging activity:', error);
    }
  }

  async getProjectActivity(projectId, userId) {
    try {
      const activityRef = ref(db, `users/${userId}/projects/${projectId}/activityLog`);
      const snapshot = await get(activityRef);
      
      if (!snapshot.exists()) return [];
      
      const activities = snapshot.val();
      return Object.entries(activities)
        .map(([id, activity]) => ({ id, ...activity }))
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Error getting project activity:', error);
      return [];
    }
  }

  // ==================== REAL-TIME LISTENERS ====================
  
  subscribeToProject(projectId, userId, callback) {
    const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
    const unsubscribe = onValue(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ projectId, ...snapshot.val() });
      }
    });
    
    this.listeners.set(`project_${projectId}`, unsubscribe);
    return unsubscribe;
  }

  subscribeToUserProjects(userId, callback) {
    const userProjectsRef = ref(db, `users/${userId}/projects`);
    const unsubscribe = onValue(userProjectsRef, (snapshot) => {
      if (snapshot.exists()) {
        const projectsData = snapshot.val();
        const projects = [];
        
        // Projects are stored directly
        for (const [projectId, projectData] of Object.entries(projectsData)) {
          projects.push({ projectId, ...projectData });
        }
        
        callback(projects);
      } else {
        callback([]);
      }
    });
    
    this.listeners.set(`userProjects_${userId}`, unsubscribe);
    return unsubscribe;
  }

  unsubscribe(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  unsubscribeAll() {
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
  }
}

// Export singleton instance
export default new HVACDatabaseService();
