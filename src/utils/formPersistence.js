/**
 * Form Persistence Utility
 * Auto-saves form data to Firebase and handles form state persistence
 */

import { debounce } from 'lodash';

/**
 * Creates an auto-save handler with debouncing
 * @param {Function} saveFunction - Async function to save data
 * @param {number} delay - Debounce delay in milliseconds (default: 1000ms)
 * @returns {Function} Debounced save function
 */
export const createAutoSave = (saveFunction, delay = 1000) => {
  return debounce(async (data) => {
    try {
      await saveFunction(data);
      console.log('✅ Form data auto-saved successfully');
    } catch (error) {
      console.error('❌ Error auto-saving form data:', error);
      throw error;
    }
  }, delay);
};

/**
 * Hook for form field change with auto-save
 * @param {Object} formData - Current form state
 * @param {Function} setFormData - State setter function
 * @param {Function} autoSaveFunction - Auto-save function
 * @returns {Function} Field change handler
 */
export const createFieldChangeHandler = (formData, setFormData, autoSaveFunction) => {
  return (fieldName, value) => {
    const updatedData = {
      ...formData,
      [fieldName]: value,
      lastModified: new Date().toISOString()
    };
    
    setFormData(updatedData);
    
    // Trigger auto-save
    if (autoSaveFunction) {
      autoSaveFunction(updatedData);
    }
  };
};

/**
 * Saves form state to localStorage as backup
 * @param {string} formKey - Unique key for the form
 * @param {Object} data - Form data to save
 */
export const saveToLocalStorage = (formKey, data) => {
  try {
    localStorage.setItem(formKey, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
};

/**
 * Loads form state from localStorage
 * @param {string} formKey - Unique key for the form
 * @param {number} maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns {Object|null} Saved form data or null
 */
export const loadFromLocalStorage = (formKey, maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const saved = localStorage.getItem(formKey);
    if (!saved) return null;
    
    const { data, timestamp } = JSON.parse(saved);
    const age = Date.now() - timestamp;
    
    // Return data only if it's not too old
    if (age < maxAge) {
      return data;
    } else {
      // Clean up old data
      localStorage.removeItem(formKey);
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return null;
  }
};

/**
 * Clears form data from localStorage
 * @param {string} formKey - Unique key for the form
 */
export const clearLocalStorage = (formKey) => {
  try {
    localStorage.removeItem(formKey);
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

/**
 * Creates a complete form persistence manager
 * @param {string} projectId - Project ID
 * @param {string} userId - User ID
 * @param {Function} saveToFirebase - Function to save to Firebase
 * @returns {Object} Form persistence manager
 */
export const createFormPersistenceManager = (projectId, userId, saveToFirebase) => {
  const storageKey = `hvac_form_${userId}_${projectId}`;
  
  // Create auto-save function with debouncing
  const autoSave = createAutoSave(async (data) => {
    // Save to Firebase
    await saveToFirebase(data);
    
    // Also backup to localStorage
    saveToLocalStorage(storageKey, data);
  }, 1500); // 1.5 second debounce
  
  return {
    /**
     * Initialize form with persisted data
     * @returns {Object|null} Persisted form data
     */
    initialize: () => {
      return loadFromLocalStorage(storageKey);
    },
    
    /**
     * Handle field change with auto-save
     * @param {Object} updatedData - Updated form data
     */
    handleChange: (updatedData) => {
      autoSave(updatedData);
    },
    
    /**
     * Manually save form data (bypasses debounce)
     * @param {Object} data - Form data to save
     */
    saveNow: async (data) => {
      await saveToFirebase(data);
      saveToLocalStorage(storageKey, data);
    },
    
    /**
     * Clear persisted data
     */
    clear: () => {
      clearLocalStorage(storageKey);
    },
    
    /**
     * Cancel pending auto-save
     */
    cancelPendingSave: () => {
      autoSave.cancel();
    }
  };
};

/**
 * React hook-friendly form persistence
 * Usage in React component:
 * 
 * const { persistFormData, loadPersistedData, clearPersistedData } = useFormPersistence(
 *   projectId,
 *   userId,
 *   (data) => flatDatabaseService.updateProject(projectId, data, userId)
 * );
 */
export const useFormPersistenceConfig = (projectId, userId, saveToFirebase) => {
  const manager = createFormPersistenceManager(projectId, userId, saveToFirebase);
  
  return {
    /**
     * Load persisted data on component mount
     */
    loadPersistedData: manager.initialize,
    
    /**
     * Persist form data with auto-save
     */
    persistFormData: manager.handleChange,
    
    /**
     * Save immediately without debounce
     */
    saveImmediately: manager.saveNow,
    
    /**
     * Clear all persisted data
     */
    clearPersistedData: manager.clear,
    
    /**
     * Cancel any pending saves (useful in cleanup)
     */
    cancelPendingSaves: manager.cancelPendingSave
  };
};

export default {
  createAutoSave,
  createFieldChangeHandler,
  saveToLocalStorage,
  loadFromLocalStorage,
  clearLocalStorage,
  createFormPersistenceManager,
  useFormPersistenceConfig
};
