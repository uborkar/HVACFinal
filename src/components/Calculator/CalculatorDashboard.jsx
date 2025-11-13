import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import HVACDataService from '../../services/hvacDataService';
import toast from '../../utils/toast';
import EquipmentSelectionSpreadsheet from './EquipmentSelectionSpreadsheet';
import HVACInventorySelection from './HVACInventorySelection';
import HVACEquipmentSpreadsheet from './HVACEquipmentSpreadsheet';
import './Calculator.css';
import DesignedInputs from './DesignedInputs';
import SpaceConsideredFormNew from './SpaceConsideredFormNew';
import SpaceConsideredForm from './SpaceConsideredForm';
import MultiFloorHeatLoadCalculator from './MultiFloorHeatLoadCalculator';
import FloorWiseEquipmentSelection from './FloorWiseEquipmentSelection';
import EquipmentSelectionTable from './EquipmentSelectionTable';
import BOQ from './BOQ';
const CalculatorDashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [designData, setDesignData] = useState(null);
  const [spaceData, setSpaceData] = useState(null);
  const [equipmentData, setEquipmentData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [boqData, setBoqData] = useState(null);
  const [exportBoqFn, setExportBoqFn] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(false);
  // Room-by-room workflow state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  
  // Memoize the BOQ export registration callback to prevent infinite loops
  const handleRegisterExport = useCallback((fn) => {
    setExportBoqFn(() => fn);
  }, []);

  // Define loadProject before useEffect that uses it
  const loadProject = useCallback(async (projectNumber) => {
    try {
      setLoading(true);
      console.log('🔄 Loading project data for:', projectNumber);
      
      const result = await HVACDataService.loadProjectData(projectNumber, user?.uid);
      
      if (result.success && result.data) {
        const projectData = result.data;
        setProjectId(projectNumber);
        
        console.log('📊 Project data loaded successfully:', projectData);
        console.log('📊 Design data structure:', projectData.designData);
        console.log('📊 Space data structure:', projectData.spaceData);
        
        // Load design data
        if (projectData.designData) {
          setDesignData(projectData.designData);
          console.log('✅ Design data loaded:', projectData.designData);
        } else {
          console.warn('⚠️ No design data found in project');
        }
        
        // Load space data
        if (projectData.spaceData) {
          const loadedSpaceData = projectData.spaceData;
          setSpaceData(loadedSpaceData);
          console.log('✅ Space data loaded into CalculatorDashboard state:', loadedSpaceData);
          console.log('📊 Space data keys:', Object.keys(loadedSpaceData));
          console.log('📊 Room calculations in spaceData:', loadedSpaceData.roomCalculations);
          console.log('📊 Room calculations keys:', Object.keys(loadedSpaceData.roomCalculations || {}));
          
        } else {
          console.warn('⚠️ No space data found in project');
        }
        
        // Load equipment data
        if (projectData.equipmentData) {
          setEquipmentData(projectData.equipmentData);
          console.log('✅ Equipment data loaded');
        }
        
        // Load inventory data
        if (projectData.inventoryData) {
          setInventoryData(projectData.inventoryData);
          console.log('✅ Inventory data loaded');
        }
        
        // Load BOQ data
        if (projectData.boqData) {
          setBoqData(projectData.boqData);
          console.log('✅ BOQ data loaded');
        }
        
        // Restore current step from saved data, or determine based on available data
        if (projectData.currentStep) {
          setCurrentStep(projectData.currentStep);
          console.log('✅ Restored saved step:', projectData.currentStep);
        } else if (projectData.boqData) {
          setCurrentStep(5); // BOQ
        } else if (projectData.inventoryData) {
          setCurrentStep(4); // Inventory
        } else if (projectData.equipmentData) {
          setCurrentStep(3); // Equipment Selection
        } else if (projectData.spaceData) {
          setCurrentStep(2); // Space Considered
        } else if (projectData.designData) {
          setCurrentStep(1); // Design Inputs
        } else {
          setCurrentStep(1); // Default to Design Inputs
        }
        
        // Restore sub-state for Step 2 (room calculation view)
        if (projectData.currentStep === 2 && projectData.uiState) {
          if (projectData.uiState.showSpaceForm && projectData.uiState.selectedRoom) {
            setShowSpaceForm(true);
            setSelectedRoom(projectData.uiState.selectedRoom);
            console.log('✅ Restored room calculation view:', projectData.uiState.selectedRoom.roomName);
          }
        }
        
        console.log('✅ Project loaded successfully, current step:', 
          projectData.currentStep || 'determined from data');
      } else {
        console.warn('❌ Project not found or failed to load:', projectNumber);
        // Create new project structure
        setCurrentStep(1);
      }
    } catch (error) {
      console.error('❌ Error loading project:', error);
      setCurrentStep(1); // Default to first step on error
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load project from URL parameter
  useEffect(() => {
    const projectParam = searchParams.get('project');
    if (projectParam && user) {
      loadProject(projectParam);
    }
    // Don't auto-create project ID - wait for user to enter project number in Form 1
  }, [searchParams, user, loadProject]);

  // Helper function to clean undefined values
  const cleanData = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanData).filter(item => item !== undefined);
    
    const cleaned = {};
    Object.entries(obj).forEach(([key, value]) => {
      const cleanedValue = cleanData(value);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    });
    return cleaned;
  };

  const handleDesignSave = async (data) => {
    setDesignData(data);
    
    // Use project number from form as projectId
    const projectNumber = data.meta?.projectNumber;
    if (!projectNumber) {
      toast.error('Please enter a project number before saving.');
      return;
    }
    
    // Set projectId from user-entered project number
    setProjectId(projectNumber);
    console.log('💾 Using project number as ID:', projectNumber);
    
    // Save to Firebase using project number as ID
    if (user) {
      try {
        await HVACDataService.saveProjectData(projectNumber, {
          designData: {
            meta: cleanData(data.meta),
            ambient: cleanData(data.ambient),
            inside: cleanData(data.inside)
          },
          currentStep: 2, // Moving to step 2
          uiState: null // Clear any previous UI state
        }, user?.uid);
        console.log('✅ Design data saved successfully to project:', projectNumber);
        toast.success(`Project ${projectNumber} saved successfully!`);
      } catch (error) {
        console.error('Error saving design data:', error);
        toast.error('Failed to save design data. Please try again.');
        return;
      }
    }
    
    setCurrentStep(2);
  };

  const handleSpaceSave = async (data) => {
    console.log('💾 Saving space data:', data);
    
    // Validate that we have calculated rooms
    const calculatedRooms = Object.keys(data.roomCalculations || {}).length;
    if (calculatedRooms === 0) {
      toast.error('Please calculate heat load for at least one room before proceeding.');
      return;
    }
    
    setSpaceData(data);
    
    // Save to Firebase using projectId with proper structure
    if (user && projectId) {
      try {
        const savePayload = {
          spaceData: {
            buildingData: cleanData(data.buildingData),
            roomCalculations: cleanData(data.roomCalculations),
            summary: cleanData(data.summary),
            lastUpdated: new Date().toISOString()
          },
          currentStep: 2,
          uiState: null // Clear UI state when saving from room list
        };
        
        await HVACDataService.saveProjectData(projectId, savePayload, user?.uid);
        console.log('✅ Space data saved successfully:', savePayload);
        console.log('🔍 Room calculations structure:', data.roomCalculations);
        
        // Show success message with summary
        toast.success(
          `Building Configuration Saved!\n` +
          `Floors: ${data.summary?.totalFloors || 0} | ` +
          `Rooms: ${calculatedRooms}/${data.summary?.totalRooms || 0} | ` +
          `Load: ${data.summary?.totalTons?.toFixed(2) || 0} TR`
        );
        
        setCurrentStep(3); // Go to Equipment Selection
      } catch (error) {
        console.error('❌ Error saving space data:', error);
        toast.error('Failed to save space data. Please try again.');
      }
    } else {
      setCurrentStep(3);
    }
  };

  const handleEquipmentSave = async (data) => {
    setEquipmentData(data);
    
    // Save to Firebase immediately using projectId
    if (user && projectId) {
      try {
        await HVACDataService.saveProjectData(projectId, {
          equipmentData: cleanData(data),
          currentStep: 4, // Moving to step 4
          uiState: null
        }, user?.uid);
        console.log('✅ Equipment data saved successfully to project:', projectId);
      } catch (error) {
        console.error('Error saving equipment data:', error);
        toast.error('Failed to save equipment data. Please try again.');
        return;
      }
    }
    
    setCurrentStep(4);
  };

  const handleInventorySave = async (data) => {
    setInventoryData(data);
    setEquipmentData(data); // Also update equipmentData for BOQ component
    
    // Save to Firebase immediately using projectId
    if (user && projectId) {
      try {
        await HVACDataService.saveProjectData(projectId, {
          equipmentData: cleanData(data),
          inventoryData: cleanData(data),
          currentStep: 5, // Moving to step 5
          uiState: null
        }, user?.uid);
        console.log('✅ Equipment/Inventory data saved successfully to project:', projectId);
      } catch (error) {
        console.error('Error saving inventory data:', error);
      }
    }
    
    setCurrentStep(5);
  };

  const handleBOQSave = (data) => {
    setBoqData(data);
    console.log('✅ BOQ data saved to state:', data);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleReset = () => {
    setDesignData(null);
    setSpaceData(null);
    setEquipmentData(null);
    setInventoryData(null);
    setCurrentStep(1);
  };

  // Enhanced step navigation - allow navigation to any accessible step
  const handleStepClick = async (stepNumber) => {
    // Always allow going back to previous steps or step 1
    if (stepNumber <= currentStep || stepNumber === 1) {
      setCurrentStep(stepNumber);
      
      // Save current step to Firebase
      if (user && projectId) {
        await HVACDataService.saveProjectData(projectId, {
          currentStep: stepNumber,
          uiState: null // Clear UI state when manually navigating
        }, user?.uid).catch(err => console.error('Failed to save step:', err));
      }
      return;
    }
    
    // For forward navigation, check if prerequisites are met
    switch (stepNumber) {
      case 2:
        if (designData) {
          setCurrentStep(2);
          if (user && projectId) {
            await HVACDataService.saveProjectData(projectId, {
              currentStep: 2,
              uiState: null
            }, user?.uid).catch(err => console.error('Failed to save step:', err));
          }
        } else {
          toast.error('Please complete Design Inputs first');
        }
        break;
      case 3:
        if (spaceData) {
          setCurrentStep(3);
          if (user && projectId) {
            await HVACDataService.saveProjectData(projectId, {
              currentStep: 3,
              uiState: null
            }, user?.uid).catch(err => console.error('Failed to save step:', err));
          }
        } else {
          toast.error('Please complete Space Considered form first');
        }
        break;
      case 4:
        if (equipmentData) {
          setCurrentStep(4);
          if (user && projectId) {
            await HVACDataService.saveProjectData(projectId, {
              currentStep: 4,
              uiState: null
            }, user?.uid).catch(err => console.error('Failed to save step:', err));
          }
        } else {
          toast.error('Please complete Equipment Selection first');
        }
        break;
      case 5:
        if (inventoryData) {
          setCurrentStep(5);
          if (user && projectId) {
            await HVACDataService.saveProjectData(projectId, {
              currentStep: 5,
              uiState: null
            }, user?.uid).catch(err => console.error('Failed to save step:', err));
          }
        } else {
          toast.error('Please complete Equipment Selection first');
        }
        break;
      default:
        break;
    }
  };

  return (
    <div className="calculator-dashboard">
      <div className="calculator-header">
        <div className="header-top">
          <h1>HVAC Load Calculator</h1>
          {projectId && (
            <div className="current-project-info-top">
              <span className="project-label">Project:</span>
              <span className="project-id">{projectId}</span>
            </div>
          )}
        </div>
        <div className="step-indicator">
          <div 
            className={`step ${currentStep === 1 ? 'active' : ''} ${designData ? 'completed' : ''} clickable`}
            onClick={() => handleStepClick(1)}
            title="Design Inputs - Always accessible"
          >
            <span>{designData ? '✓' : '1'}</span>
            <p>Design Inputs</p>
          </div>
          <div 
            className={`step ${currentStep === 2 ? 'active' : ''} ${spaceData ? 'completed' : ''} ${designData ? 'clickable' : 'disabled'}`}
            onClick={() => handleStepClick(2)}
            title={designData ? "Space Considered - Click to navigate" : "Complete Design Inputs first"}
          >
            <span>{spaceData ? '✓' : '2'}</span>
            <p>Space Considered</p>
          </div>
          <div 
            className={`step ${currentStep === 3 ? 'active' : ''} ${equipmentData ? 'completed' : ''} ${spaceData ? 'clickable' : 'disabled'}`}
            onClick={() => handleStepClick(3)}
            title={spaceData ? "Equipment Selection - Click to navigate" : "Complete Space Considered first"}
          >
            <span>{equipmentData ? '✓' : '3'}</span>
            <p>Equipment</p>
          </div>
          <div 
            className={`step ${currentStep === 4 ? 'active' : ''} ${inventoryData ? 'completed' : ''} ${equipmentData ? 'clickable' : 'disabled'}`}
            onClick={() => handleStepClick(4)}
            title={equipmentData ? "Equipment Selection - Click to navigate" : "Complete Equipment Selection first"}
          >
            <span>{inventoryData ? '✓' : '4'}</span>
            <p>Equipment Selection</p>
          </div>
          <div 
            className={`step ${currentStep === 5 ? 'active' : ''} ${boqData ? 'completed' : ''} ${inventoryData ? 'clickable' : 'disabled'}`}
            onClick={() => handleStepClick(5)}
            title={inventoryData ? "BOQ - Click to navigate" : "Complete Equipment Selection first"}
          >
            <span>{boqData ? '✓' : '5'}</span>
            <p>BOQ</p>
          </div>
        </div>
      </div>

      <div className="calculator-content">
        {currentStep === 1 && (
          <DesignedInputs 
            onSave={handleDesignSave} 
            savedData={designData} 
            projectId={projectId}
          />
        )}

        {currentStep === 2 && !showSpaceForm && (
          <MultiFloorHeatLoadCalculator
            projectId={projectId}
            savedData={spaceData}
            onSave={handleSpaceSave}
            onDataLoaded={(loadedData) => {
              // Update parent state when MultiFloorHeatLoadCalculator loads data
              console.log('📥 MultiFloorHeatLoadCalculator loaded data, updating parent state:', loadedData);
              if (loadedData?.roomCalculations) {
                setSpaceData(loadedData);
              }
            }}
            onRoomSelect={(roomData) => {
              // Add the calculation complete callback to room data
              const roomDataWithCallback = {
                ...roomData,
                onCalculationComplete: (calculationData) => {
                  console.log('🎯 Room calculation completed via callback:', calculationData);
                  
                  // Create proper heatLoadData structure for room persistence
                  const heatLoadData = calculationData.heatLoadData || {
                    area: calculationData.area || 0,
                    tonnage: calculationData.tons || 0,
                    totalCfm: calculationData.supplyCFM || 0,
                    sensibleHeat: calculationData.ESHT || 0,
                    latentHeat: calculationData.GTH - calculationData.ESHT || 0,
                    totalHeat: calculationData.GTH || 0,
                    calculated: true,
                    calculatedOn: new Date().toISOString()
                  };
                  
                  // Update space data with proper structure for equipment selection
                  const updatedSpaceData = {
                    ...spaceData,
                    buildingData: spaceData?.buildingData || { floors: [] },
                    roomCalculations: {
                      ...spaceData?.roomCalculations,
                      [`${calculationData.floorId}_${calculationData.roomId}`]: {
                        ...calculationData,
                        heatLoadData: heatLoadData,
                        calculated: true,
                        timestamp: new Date().toISOString()
                      }
                    },
                    lastUpdated: new Date().toISOString()
                  };
                  
                  // Update building data floors to persist room cards
                  if (updatedSpaceData.buildingData?.floors) {
                    updatedSpaceData.buildingData.floors = updatedSpaceData.buildingData.floors.map(floor => {
                      if (floor.id === calculationData.floorId) {
                        return {
                          ...floor,
                          rooms: (floor.rooms || []).map(room => {
                            if (room.id === calculationData.roomId) {
                              return {
                                ...room,
                                calculated: true,
                                heatLoadData: heatLoadData,
                                calculationSummary: {
                                  tonnage: heatLoadData.tonnage,
                                  cfm: heatLoadData.totalCfm,
                                  totalHeat: heatLoadData.totalHeat
                                },
                                lastCalculated: new Date().toISOString()
                              };
                            }
                            return room;
                          })
                        };
                      }
                      return floor;
                    });
                  }
                  
                  console.log('💾 Saving updated space data:', updatedSpaceData);
                  
                  // Save to state and Firebase immediately
                  handleSpaceSave(updatedSpaceData);
                  
                  // Close the space form and go back to room list - room cards will persist
                  setShowSpaceForm(false);
                  setSelectedRoom(null);
                  
                  console.log('✅ Room card should now show "View Calculation" with calculated values');
                }
              };
              
              setSelectedRoom(roomDataWithCallback);
              setShowSpaceForm(true);
              
              // Save UI state to Firebase so it persists on refresh
              if (user && projectId) {
                HVACDataService.saveProjectData(projectId, {
                  currentStep: 2,
                  uiState: {
                    showSpaceForm: true,
                    selectedRoom: {
                      roomId: roomDataWithCallback.roomId,
                      floorId: roomDataWithCallback.floorId,
                      roomName: roomDataWithCallback.roomName,
                      floorName: roomDataWithCallback.floorName,
                      roomType: roomDataWithCallback.roomType,
                      area: roomDataWithCallback.area
                    }
                  }
                }, user?.uid).catch(err => console.error('Failed to save UI state:', err));
              }
            }}
          />
        )}

        {currentStep === 2 && showSpaceForm && selectedRoom && (
          <div className="room-calculation-wrapper">
            <div className="room-header">
              <h3>Heat Load Calculation - {selectedRoom.roomName}</h3>
              <div className="room-info">
                <span>Floor: {selectedRoom.floorName}</span>
                <span>Type: {selectedRoom.roomType}</span>
                <span>Area: {selectedRoom.area?.toFixed(1)} m²</span>
              </div>
              <button 
                onClick={() => {
                  setShowSpaceForm(false);
                  setSelectedRoom(null);
                  
                  // Clear UI state in Firebase when going back to room list
                  if (user && projectId) {
                    HVACDataService.saveProjectData(projectId, {
                      currentStep: 2,
                      uiState: null
                    }, user?.uid).catch(err => console.error('Failed to clear UI state:', err));
                  }
                }}
                className="btn-back-to-rooms"
              >
                ← Back to Room List
              </button>
            </div>
            
            <SpaceConsideredForm
              projectData={{
                ...designData,
                selectedRoom: selectedRoom
              }}
              roomData={selectedRoom}
              savedData={(() => {
                if (!selectedRoom || !spaceData) {
                  console.log('⚠️ No selectedRoom or spaceData available');
                  return null;
                }
                const roomKey = `${selectedRoom.floorId}_${selectedRoom.roomId}`;
                const savedCalc = spaceData?.roomCalculations?.[roomKey];
                console.log('🔍 Looking for saved data with key:', roomKey);
                console.log('🔍 spaceData available:', !!spaceData);
                console.log('🔍 roomCalculations available:', !!spaceData?.roomCalculations);
                console.log('🔍 Available room calculations:', Object.keys(spaceData?.roomCalculations || {}));
                console.log('🔍 Found calculation:', savedCalc);
                console.log('🔍 FormData in calculation:', savedCalc?.formData);
                return savedCalc?.formData || null;
              })()}
              onSave={async (spaceFormData) => {
                // Extract calculated heat load data with proper calculations
                const totalSensibleHeat = (
                  (spaceFormData.totalSensibleGlass || 0) +
                  (spaceFormData.totalSensibleWalls || 0) +
                  (spaceFormData.totalSensiblePartitions || 0) +
                  (spaceFormData.totalInternalHeat || 0)
                );
                
                const totalLatentHeat = (
                  (spaceFormData.totalLatentHeat || 0) +
                  (spaceFormData.latentFromVentilation || 0)
                );
                
                const grandTotalHeat = totalSensibleHeat + totalLatentHeat;
                
                const heatLoadData = {
                  area: parseFloat(spaceFormData.area || spaceFormData.sqFt || 0),
                  tonnage: grandTotalHeat ? (grandTotalHeat / 12000) : 0,
                  totalCfm: parseFloat(spaceFormData.totalCfm || 0),
                  sensibleHeat: totalSensibleHeat,
                  latentHeat: totalLatentHeat,
                  totalHeat: grandTotalHeat,
                  outsideAirCfm: parseFloat(spaceFormData.totalCfm || 0) - parseFloat(spaceFormData.cfmInfiltration || 0),
                  diversity: 85, // Default diversity factor
                  calculatedOn: new Date().toISOString(),
                  formData: spaceFormData // Store complete form data for later viewing
                };
                
                // Save the heat load calculation for this specific room using the improved service
                const roomCalculationData = {
                  roomId: selectedRoom.roomId,
                  floorId: selectedRoom.floorId,
                  roomName: selectedRoom.roomName,
                  roomType: selectedRoom.roomType || 'General',
                  floorName: selectedRoom.floorName,
                  heatLoadData: heatLoadData,
                  formData: spaceFormData, // Store complete form data
                  timestamp: new Date().toISOString(),
                  calculated: true
                };
                
                console.log('💾 Saving room calculation via service:', roomCalculationData);
                console.log('🔑 Room key:', `${selectedRoom.floorId}_${selectedRoom.roomId}`);
                
                // Save individual room calculation using the service
                if (user && projectId) {
                  try {
                    await HVACDataService.saveRoomCalculation(
                      projectId, 
                      selectedRoom.floorId, 
                      selectedRoom.roomId, 
                      roomCalculationData,
                      user?.uid
                    );
                    console.log('✅ Room calculation saved via service');
                  } catch (error) {
                    console.error('❌ Error saving room calculation:', error);
                  }
                }
                
                // Update local space data state
                const updatedSpaceData = {
                  ...spaceData,
                  buildingData: spaceData?.buildingData || { floors: [] },
                  roomCalculations: {
                    ...spaceData?.roomCalculations,
                    [`${selectedRoom.floorId}_${selectedRoom.roomId}`]: roomCalculationData
                  },
                  lastUpdated: new Date().toISOString(),
                  totalCalculatedRooms: Object.keys({
                    ...spaceData?.roomCalculations,
                    [`${selectedRoom.floorId}_${selectedRoom.roomId}`]: roomCalculationData
                  }).length
                };
                
                // Also update the building data to reflect calculated room data
                if (updatedSpaceData.buildingData?.floors) {
                  updatedSpaceData.buildingData.floors = updatedSpaceData.buildingData.floors.map(floor => {
                    if (floor.id === selectedRoom.floorId) {
                      return {
                        ...floor,
                        rooms: floor.rooms.map(room => {
                          if (room.id === selectedRoom.roomId) {
                            return {
                              ...room,
                              calculated: true,
                              heatLoadData: heatLoadData
                            };
                          }
                          return room;
                        })
                      };
                    }
                    return floor;
                  });
                }
                
                // Update local state (don't save again to avoid duplicate saves)
                setSpaceData(updatedSpaceData);
                
                console.log('📊 Updated space data:', updatedSpaceData);
                console.log('📊 Total room calculations:', Object.keys(updatedSpaceData.roomCalculations).length);
                
                // Go back to room list
                setShowSpaceForm(false);
                setSelectedRoom(null);
                
                // Clear UI state in Firebase
                if (user && projectId) {
                  HVACDataService.saveProjectData(projectId, {
                    currentStep: 2,
                    uiState: null
                  }, user?.uid).catch(err => console.error('Failed to clear UI state:', err));
                }
                
                // Show success message
                toast.success(
                  `Room Calculation Saved! ${selectedRoom.roomName} - ` +
                  `${heatLoadData.tonnage.toFixed(2)} TR | ` +
                  `${heatLoadData.totalCfm.toFixed(0)} CFM`
                );
              }}
              onBack={() => {
                setShowSpaceForm(false);
                setSelectedRoom(null);
                
                // Clear UI state in Firebase when clicking back
                if (user && projectId) {
                  HVACDataService.saveProjectData(projectId, {
                    currentStep: 2,
                    uiState: null
                  }, user?.uid).catch(err => console.error('Failed to clear UI state:', err));
                }
              }}
              projectId={projectId}
            />
          </div>
        )}

        {currentStep === 3 && spaceData && (
          <EquipmentSelectionTable 
            spaceData={spaceData}
            projectId={projectId || designData?.meta?.projectNumber}
            onBack={handleBack}
            onSave={handleEquipmentSave}
          />
        )}

        {currentStep === 4 && (
          <HVACEquipmentSpreadsheet
            spaceData={spaceData}
            designData={designData}
            equipmentData={equipmentData}
            projectId={projectId}
            onBack={() => setCurrentStep(3)}
            onSave={handleInventorySave}
            savedData={inventoryData}
          />
        )}

        {currentStep === 5 && (
          <BOQ 
            designData={designData} 
            spaceData={spaceData}
            equipmentData={equipmentData}
            inventoryData={inventoryData}
            projectId={projectId}
            user={user}
            onSave={handleBOQSave}
            onRegisterExport={handleRegisterExport}
            onBack={() => setCurrentStep(4)}
          />
        )}
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading project...</p>
        </div>
      )}

      <div className="navigation-actions">
        {/* Left side: Back or Export depending on step */}
        <div style={{display:'flex', gap:8}}>
          {currentStep > 1 && currentStep < 5 && (
            <button onClick={handleBack} className="nav-button back-button">
              ← Back
            </button>
          )}
          {currentStep === 5 && (
            <button onClick={() => exportBoqFn && exportBoqFn()} className="nav-button">
              Export PDF
            </button>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="project-info-actions">
          {currentStep > 1 && (
            <button onClick={handleReset} className="reset-button">
              Start New Calculation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default CalculatorDashboard;