// HVAC Data Service - Centralized data management for all 5 forms
// Ensures proper data flow and persistence throughout the HVAC calculation workflow

import { ref, set, get, update } from 'firebase/database';
import { db } from '../firebase/config';

export class HVACDataService {
  
  /**
   * Save complete project data with proper structure
   */
  static async saveProjectData(projectId, data, userId = null) {
    try {
      // ONLY save in user-based structure to avoid duplicates
      if (!userId) {
        console.error('❌ Cannot save project without userId');
        throw new Error('User ID is required to save project data');
      }
      
      console.log('💾 Saving project data:', projectId, 'Data keys:', Object.keys(data));
      
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      
      // First, get existing data to merge with
      const snapshot = await get(projectRef);
      const existingData = snapshot.exists() ? snapshot.val() : {};
      
      console.log('📂 Existing data keys:', Object.keys(existingData));
      
      // Merge new data with existing data (don't overwrite everything)
      const updates = {
        ...existingData,
        lastUpdated: new Date().toISOString(),
        userId: userId
      };
      
      // Update only the fields that are provided
      if (data.designData) {
        updates.designData = data.designData;
        console.log('✅ Updating designData');
      }
      
      if (data.spaceData) {
        updates.spaceData = data.spaceData;
        console.log('✅ Updating spaceData');
      }
      
      if (data.equipmentData) {
        updates.equipmentData = data.equipmentData;
        console.log('✅ Updating equipmentData');
      }
      
      if (data.inventoryData) {
        updates.inventoryData = data.inventoryData;
        console.log('✅ Updating inventoryData');
      }
      
      if (data.boqData) {
        updates.boqData = data.boqData;
        console.log('✅ Updating boqData');
      }
      
      if (data.currentStep) {
        updates.currentStep = data.currentStep;
      }
      
      // Use set() to save the complete merged data
      await set(projectRef, updates);
      console.log('✅ Project data saved successfully:', projectId, `for user ${userId}`);
      console.log('📊 Saved data structure:', Object.keys(updates));
      return { success: true, data: updates };
      
    } catch (error) {
      console.error('❌ Error saving project data:', error);
      throw error;
    }
  }
  
  /**
   * Load complete project data
   */
  static async loadProjectData(projectId, userId = null) {
    try {
      // ONLY load from user-based structure
      if (!userId) {
        console.warn('⚠️ No userId provided, returning empty structure');
        return { 
          success: true, 
          data: this.createEmptyProjectStructure() 
        };
      }
      
      console.log('🔍 Loading project:', projectId, 'for user:', userId);
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      const snapshot = await get(projectRef);
      
      if (snapshot.exists()) {
        const rawData = snapshot.val();
        console.log('✅ Project data loaded:', projectId, `for user ${userId}`);
        console.log('📊 Loaded data keys:', Object.keys(rawData));
        
        // Check if data is in OLD format (fields at root level) or NEW format (nested in designData)
        const hasOldFormat = rawData.meta || rawData.ambient || rawData.inside || rawData.projectName;
        const hasNewFormat = rawData.designData;
        
        let data = rawData;
        
        // Convert OLD format to NEW format
        if (hasOldFormat && !hasNewFormat) {
          console.log('🔄 Converting OLD data structure to NEW format');
          data = {
            designData: {
              meta: rawData.meta || {
                projectName: rawData.projectName || '',
                projectNumber: rawData.projectNumber || '',
                address: rawData.location || '',
                clientName: rawData.clientName || '',
                consultantName: rawData.consultantName || ''
              },
              ambient: rawData.ambient || {},
              inside: rawData.inside || {}
            },
            spaceData: rawData.spaceData || {},
            equipmentData: rawData.equipmentData || {},
            inventoryData: rawData.inventoryData || {},
            boqData: rawData.boqData || {},
            currentStep: rawData.currentStep || 1,
            lastUpdated: new Date().toISOString(),
            userId: rawData.userId
          };
          console.log('✅ Converted to new format');
          
          // Save the migrated data back to Firebase in new format
          try {
            await set(projectRef, data);
            console.log('💾 Migrated data saved to Firebase in new format');
          } catch (error) {
            console.error('⚠️ Failed to save migrated data:', error);
            // Continue anyway with converted data
          }
        }
        
        console.log('📊 designData exists:', !!data.designData);
        console.log('📊 spaceData exists:', !!data.spaceData);
        console.log('📊 equipmentData exists:', !!data.equipmentData);
        console.log('📊 inventoryData exists:', !!data.inventoryData);
        console.log('📊 boqData exists:', !!data.boqData);
        
        // Log structure of each section
        if (data.designData) {
          console.log('📋 designData structure:', Object.keys(data.designData));
        }
        if (data.spaceData) {
          console.log('📋 spaceData structure:', Object.keys(data.spaceData));
          if (data.spaceData.roomCalculations) {
            console.log('📋 roomCalculations count:', Object.keys(data.spaceData.roomCalculations).length);
          }
        }
        
        return { success: true, data };
      }
      
      console.log('📝 No existing project data, creating new structure');
      return { 
        success: true, 
        data: this.createEmptyProjectStructure() 
      };
      
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      throw error;
    }
  }
  
  /**
   * Save building structure (floors and rooms) - use update() to prevent overwrites
   */
  static async saveBuildingStructure(projectId, buildingData, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot save building structure without userId');
        throw new Error('User ID is required to save building structure');
      }
      
      const spaceDataRef = ref(db, `users/${userId}/projects/${projectId}/spaceData`);
      
      const updates = {
        'buildingData': {
          ...buildingData,
          lastUpdated: new Date().toISOString()
        },
        lastUpdated: new Date().toISOString()
      };
      
      await update(spaceDataRef, updates);
      
      console.log('✅ Building structure saved with update():', projectId, `for user ${userId}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error saving building structure:', error);
      throw error;
    }
  }
  
  /**
   * Save room calculation - saves in both floors and roomCalculations for proper data flow
   */
  static async saveRoomCalculation(projectId, floorId, roomId, calculationData, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot save room calculation without userId');
        throw new Error('User ID is required to save room calculation');
      }
      
      const calculationKey = `${floorId}_${roomId}`;
      const spaceDataRef = ref(db, `users/${userId}/projects/${projectId}/spaceData`);
      
      // Standardize the calculation data structure
      const structuredCalculation = {
        floorId,
        roomId,
        calculationKey,
        roomName: calculationData.roomName || `Room ${roomId}`,
        roomType: calculationData.roomType || 'General',
        floorName: calculationData.floorName || `Floor ${floorId}`,
        
        // Heat load data in standardized format
        heatLoadData: {
          area: parseFloat(calculationData.heatLoadData?.area || calculationData.area || 0),
          tonnage: parseFloat(calculationData.heatLoadData?.tonnage || calculationData.tons || 0),
          totalCfm: parseFloat(calculationData.heatLoadData?.totalCfm || calculationData.totalCFM || 0),
          sensibleHeat: parseFloat(calculationData.heatLoadData?.sensibleHeat || calculationData.sensibleLoad || 0),
          latentHeat: parseFloat(calculationData.heatLoadData?.latentHeat || calculationData.latentLoad || 0),
          totalHeat: parseFloat(calculationData.heatLoadData?.totalHeat || calculationData.GTH || 0),
          calculated: true,
          calculatedAt: new Date().toISOString()
        },
        
        // Store complete form data for viewing
        formData: calculationData.formData || calculationData,
        
        // Metadata
        calculatedAt: new Date().toISOString(),
        calculated: true,
        timestamp: new Date().toISOString()
      };
      
      // Use update() to save in both locations without overwriting other data
      const updates = {
        // Save in roomCalculations for equipment selection
        [`roomCalculations/${calculationKey}`]: structuredCalculation,
        
        // Update lastUpdated timestamp
        lastUpdated: new Date().toISOString()
      };
      
      // Also update the room in building structure floors
      const floorsRef = ref(db, `users/${userId}/projects/${projectId}/spaceData/buildingData/floors`);
      const floorsSnapshot = await get(floorsRef);
      if (floorsSnapshot.exists()) {
        const floors = floorsSnapshot.val() || [];
        const updatedFloors = floors.map(floor => {
          if (floor.id === floorId) {
            return {
              ...floor,
              rooms: (floor.rooms || []).map(room => {
                if (room.id === roomId) {
                  return {
                    ...room,
                    calculated: true,
                    calculatedAt: new Date().toISOString(),
                    heatLoadData: structuredCalculation.heatLoadData
                  };
                }
                return room;
              })
            };
          }
          return floor;
        });
        
        updates[`buildingData/floors`] = updatedFloors;
      }
      
      await update(spaceDataRef, updates);
      
      console.log('✅ Room calculation saved in both locations:', calculationKey, `for user ${userId}`);
      console.log('📊 Structured calculation data:', structuredCalculation);
      return { success: true, calculationKey, data: structuredCalculation };
      
    } catch (error) {
      console.error('❌ Error saving room calculation:', error);
      throw error;
    }
  }
  
  /**
   * Get building summary
   */
  static async getBuildingSummary(projectId, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot get building summary without userId');
        return this.createEmptySummary();
      }
      const spaceDataRef = ref(db, `users/${userId}/projects/${projectId}/spaceData`);
      const snapshot = await get(spaceDataRef);
      
      if (!snapshot.exists()) {
        return this.createEmptySummary();
      }
      
      const spaceData = snapshot.val();
      const buildingData = spaceData.buildingData || {};
      const roomCalculations = spaceData.roomCalculations || {};
      
      // Calculate totals from room calculations
      const calculations = Object.values(roomCalculations);
      const totalRoomsInBuilding = (buildingData.floors || []).reduce((total, floor) => {
        return total + (floor.rooms ? floor.rooms.length : 0);
      }, 0);
      
      const totals = calculations.reduce((sum, calc) => ({
        totalArea: sum.totalArea + (calc.roomArea || calc.area || 0),
        totalLoad: sum.totalLoad + (calc.finalLoad || calc.GTH || 0),
        totalTons: sum.totalTons + (calc.loadInTons || calc.tons || 0),
        totalCFM: sum.totalCFM + (calc.cfmRequired || calc.totalCFM || 0),
        totalSensible: sum.totalSensible + (calc.sensibleLoad || calc.SHF || 0),
        totalLatent: sum.totalLatent + (calc.latentLoad || calc.LHF || 0)
      }), {
        totalArea: 0, totalLoad: 0, totalTons: 0, totalCFM: 0, totalSensible: 0, totalLatent: 0
      });
      
      const summary = {
        totalFloors: (buildingData.floors || []).length,
        totalRooms: totalRoomsInBuilding,
        calculatedRooms: calculations.length,
        pendingRooms: totalRoomsInBuilding - calculations.length,
        ...totals,
        averageLoadPerRoom: calculations.length > 0 ? totals.totalTons / calculations.length : 0,
        completionPercentage: totalRoomsInBuilding > 0 ? (calculations.length / totalRoomsInBuilding) * 100 : 0,
        lastUpdated: new Date().toISOString()
      };
      
      return summary;
      
    } catch (error) {
      console.error('❌ Error getting building summary:', error);
      return this.createEmptySummary();
    }
  }
  
  /**
   * Save equipment selection data
   */
  static async saveEquipmentData(projectId, equipmentData, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot save equipment data without userId');
        throw new Error('User ID is required');
      }
      const equipmentRef = ref(db, `users/${userId}/projects/${projectId}/equipmentData`);
      await set(equipmentRef, {
        ...equipmentData,
        savedAt: new Date().toISOString()
      });
      
      console.log('✅ Equipment data saved:', projectId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error saving equipment data:', error);
      throw error;
    }
  }
  
  /**
   * Save inventory data
   */
  static async saveInventoryData(projectId, inventoryData, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot save inventory data without userId');
        throw new Error('User ID is required');
      }
      const inventoryRef = ref(db, `users/${userId}/projects/${projectId}/inventoryData`);
      await set(inventoryRef, {
        ...inventoryData,
        savedAt: new Date().toISOString()
      });
      
      console.log('✅ Inventory data saved:', projectId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error saving inventory data:', error);
      throw error;
    }
  }
  
  /**
   * Save BOQ data
   */
  static async saveBOQData(projectId, boqData, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot save BOQ data without userId');
        throw new Error('User ID is required');
      }
      const boqRef = ref(db, `users/${userId}/projects/${projectId}/boqData`);
      await set(boqRef, {
        ...boqData,
        savedAt: new Date().toISOString()
      });
      
      console.log('✅ BOQ data saved:', projectId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error saving BOQ data:', error);
      throw error;
    }
  }
  
  /**
   * Update project step
   */
  static async updateProjectStep(projectId, step, userId = null) {
    try {
      if (!userId) {
        console.error('❌ Cannot update project step without userId');
        throw new Error('User ID is required');
      }
      const projectRef = ref(db, `users/${userId}/projects/${projectId}`);
      await update(projectRef, {
        currentStep: step,
        lastUpdated: new Date().toISOString()
      });
      
      console.log('✅ Project step updated:', projectId, step);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error updating project step:', error);
      throw error;
    }
  }
  
  /**
   * Create empty project structure
   */
  static createEmptyProjectStructure() {
    return {
      designData: {},
      spaceData: {
        buildingData: {
          name: '',
          location: '',
          outdoorTemp: 45,
          indoorTemp: 24,
          floors: []
        },
        roomCalculations: {},
        calculations: {},
        summary: this.createEmptySummary(),
        timestamp: new Date().toISOString()
      },
      equipmentData: {},
      inventoryData: {},
      boqData: {},
      currentStep: 1,
      projectStatus: 'new',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Create empty summary
   */
  static createEmptySummary() {
    return {
      totalFloors: 0,
      totalRooms: 0,
      calculatedRooms: 0,
      pendingRooms: 0,
      totalArea: 0,
      totalLoad: 0,
      totalTons: 0,
      totalCFM: 0,
      totalSensible: 0,
      totalLatent: 0,
      averageLoadPerRoom: 0,
      completionPercentage: 0,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Validate data structure
   */
  static validateProjectData(data) {
    const errors = [];
    
    if (!data.spaceData?.buildingData?.floors) {
      errors.push('Missing building floors data');
    }
    
    if (!data.spaceData?.roomCalculations) {
      errors.push('Missing room calculations data');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export default HVACDataService;
