// Database Migration Utility
// Helps migrate from nested structure to flat structure

import { flatDatabaseService } from '../services/flatDatabaseService';
import { databaseService } from '../services/databaseService';

export class DatabaseMigration {
  
  /**
   * Migrate user from nested to flat structure
   */
  static async migrateUserToFlatStructure(userId) {
    try {
      console.log('🔄 Starting migration to flat structure for user:', userId);
      
      // Get existing user projects from old structure
      const existingProjects = await databaseService.getUserProjects(userId);
      
      let migratedCount = 0;
      let errorCount = 0;
      
      for (const project of existingProjects) {
        try {
          // Create project in new flat structure
          const projectData = {
            projectName: project.meta?.projectName || 'Migrated Project',
            projectNumber: project.meta?.projectNumber || project.id,
            location: project.meta?.location || '',
            clientName: project.meta?.clientName || '',
            consultantName: project.meta?.consultantName || '',
            designData: project.designData || {},
            buildingData: project.buildingData || project.spaceData?.buildingData || {}
          };
          
          const newProject = await flatDatabaseService.createProject(userId, projectData);
          
          // Migrate space considered data if exists
          if (project.spaceData && project.meta?.projectNumber) {
            await flatDatabaseService.saveSpaceConsidered(
              project.meta.projectNumber, 
              project.spaceData
            );
          }
          
          // Migrate heat load summary if exists
          if (project.heatLoadSummary && project.meta?.projectNumber) {
            for (const [floor, summaryData] of Object.entries(project.heatLoadSummary)) {
              await flatDatabaseService.saveHeatLoadSummary(
                project.meta.projectNumber, 
                floor, 
                summaryData
              );
            }
          }
          
          // Migrate inventory if exists
          if (project.inventoryData && project.meta?.projectNumber) {
            for (const [floor, inventoryData] of Object.entries(project.inventoryData)) {
              await flatDatabaseService.saveInventory(
                project.meta.projectNumber, 
                floor, 
                inventoryData
              );
            }
          }
          
          // Migrate equipment selection if exists
          if (project.equipmentData) {
            await flatDatabaseService.saveEquipmentSelection(
              newProject.projectId,
              project.equipmentData
            );
          }
          
          migratedCount++;
          console.log(`✅ Migrated project: ${project.meta?.projectName}`);
          
        } catch (error) {
          console.error(`❌ Error migrating project ${project.id}:`, error);
          errorCount++;
        }
      }
      
      console.log(`🎉 Migration completed: ${migratedCount} successful, ${errorCount} errors`);
      
      return {
        success: true,
        migratedCount,
        errorCount,
        message: `Successfully migrated ${migratedCount} projects to flat structure`
      };
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      return {
        success: false,
        error: error.message,
        message: 'Migration failed. Please try again.'
      };
    }
  }
  
  /**
   * Check if user needs migration
   */
  static async checkMigrationNeeded(userId) {
    try {
      // Check if user has projects in old nested structure
      const oldProjects = await databaseService.getUserProjects(userId);
      const newProjects = await flatDatabaseService.getUserProjects(userId);
      
      // If old projects exist but no new projects, migration is needed
      const needsMigration = oldProjects.length > 0 && newProjects.length === 0;
      
      return {
        needsMigration,
        oldProjectCount: oldProjects.length,
        newProjectCount: newProjects.length
      };
      
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { needsMigration: false, error: error.message };
    }
  }
  
  /**
   * Backup existing data before migration
   */
  static async backupUserData(userId) {
    try {
      const userData = await databaseService.getUserProjects(userId);
      const backupData = {
        userId,
        backupDate: new Date().toISOString(),
        projects: userData
      };
      
      // Store backup in localStorage for safety
      localStorage.setItem(`hvac_backup_${userId}`, JSON.stringify(backupData));
      
      return {
        success: true,
        backupSize: userData.length,
        message: 'Data backed up successfully'
      };
      
    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Restore data from backup
   */
  static restoreFromBackup(userId) {
    try {
      const backupData = localStorage.getItem(`hvac_backup_${userId}`);
      if (!backupData) {
        return { success: false, message: 'No backup found' };
      }
      
      const parsed = JSON.parse(backupData);
      return {
        success: true,
        data: parsed,
        message: `Backup found from ${new Date(parsed.backupDate).toLocaleString()}`
      };
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default DatabaseMigration;
