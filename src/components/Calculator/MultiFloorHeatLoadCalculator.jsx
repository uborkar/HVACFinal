import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from '../../utils/toast';
import RoomForm from './RoomForm';
import HVACDataService from '../../services/hvacDataService';
import './MultiFloorHeatLoadCalculator.css';

const MultiFloorHeatLoadCalculator = ({ projectId, onSave, savedData, onRoomSelect, onDataLoaded }) => {
  const { user } = useAuth();
  const [buildingData, setBuildingData] = useState({
    name: '',
    location: '',
    outdoorTemp: 45, // °C
    indoorTemp: 24, // °C
    floors: []
  });
  
  // State declarations - must be before useEffect that uses them
  const [currentFloor, setCurrentFloor] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [calculations, setCalculations] = useState({});
  const [expandedFloors, setExpandedFloors] = useState(new Set());
  
  // Auto-save when building data changes
  useEffect(() => {
    if ((buildingData?.floors || []).length > 0 && user && projectId) {
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 Auto-saving building structure...');
          await HVACDataService.saveBuildingStructure(projectId, buildingData, user?.uid);
          console.log('✅ Building structure auto-saved');
        } catch (error) {
          console.error('❌ Building data auto-save failed:', error);
        }
      }, 2000); // Debounce by 2 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [buildingData, calculations, user, projectId]);

  // Auto-generate floors from designData
  const generateFloorsFromDesignData = (designData) => {
    if (!designData?.meta) return [];
    
    const { totalFloors, basementFloors, buildingType } = designData.meta;
    const floors = [];
    
    // Add basement floors if specified
    if (basementFloors && basementFloors > 0) {
      for (let i = basementFloors; i >= 1; i--) {
        floors.push({
          id: `basement_${i}`,
          name: `Basement ${i}`,
          level: -i,
          type: 'basement',
          buildingType: buildingType || '',
          rooms: []
        });
      }
    }
    
    // Add ground floor
    floors.push({
      id: 'ground_floor',
      name: 'Ground Floor',
      level: 0,
      type: 'ground',
      buildingType: buildingType || '',
      rooms: []
    });
    
    // Add upper floors
    if (totalFloors && totalFloors > 0) {
      for (let i = 1; i < totalFloors; i++) {
        floors.push({
          id: `floor_${i}`,
          name: `Floor ${i}`,
          level: i,
          type: 'upper',
          buildingType: buildingType || '',
          rooms: []
        });
      }
    }
    
    console.log('🏗️ Auto-generated floors:', floors);
    return floors;
  };

  // Load saved data and project data from Firebase
  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId && user) {
        try {
          console.log('📥 Loading project data from Firebase...');
          
          const result = await HVACDataService.loadProjectData(projectId, user?.uid);
          
          if (result.success && result.data) {
            const projectData = result.data;
            console.log('📊 Project data loaded:', projectData);
            
            // Load space data if available
            if (projectData.spaceData && projectData.spaceData.buildingData) {
              const spaceData = projectData.spaceData;
              console.log('🏢 Loading existing space data:', spaceData);
              
              setBuildingData(spaceData.buildingData);
              console.log('🏗️ Building data loaded with', spaceData.buildingData.floors?.length || 0, 'floors');
              
              if (spaceData.roomCalculations) {
                setCalculations(spaceData.roomCalculations);
                console.log('🧮 Room calculations loaded:', Object.keys(spaceData.roomCalculations).length, 'rooms');
              }
              
              // Notify parent that data has been loaded
              if (onDataLoaded) {
                console.log('📤 Notifying parent of loaded data');
                onDataLoaded(spaceData);
              }
              
              // Auto-expand floors that have rooms
              const floorsWithRooms = new Set();
              (spaceData.buildingData?.floors || []).forEach(floor => {
                if (floor.rooms && floor.rooms.length > 0) {
                  floorsWithRooms.add(floor.id);
                }
              });
              setExpandedFloors(floorsWithRooms);
            } else if (projectData.designData) {
              // No space data yet - auto-generate floors from designData
              console.log('🆕 No space data found, auto-generating floors from designData');
              const autoFloors = generateFloorsFromDesignData(projectData.designData);
              
              const newBuildingData = {
                name: projectData.designData.meta?.projectName || '',
                location: projectData.designData.meta?.address || '',
                buildingType: projectData.designData.meta?.buildingType || '',
                outdoorTemp: projectData.designData.ambient?.dbF || 45,
                indoorTemp: projectData.designData.inside?.dbF || 24,
                floors: autoFloors,
                lastUpdated: new Date().toISOString()
              };
              
              setBuildingData(newBuildingData);
              console.log('✅ Auto-generated building data:', newBuildingData);
              
              // Save the auto-generated structure
              try {
                await HVACDataService.saveBuildingStructure(projectId, newBuildingData, user?.uid);
                console.log('💾 Auto-generated floors saved to Firebase');
              } catch (error) {
                console.error('❌ Failed to save auto-generated floors:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error loading project data:', error);
        }
      }
    };

    // Load from Firebase first, then use savedData as fallback
    if (projectId && user) {
      loadProjectData();
    } else if (savedData) {
      setBuildingData(savedData.buildingData || {
        name: '',
        location: '',
        outdoorTemp: 45,
        indoorTemp: 24,
        floors: []
      });
      setCalculations(savedData.roomCalculations || savedData.calculations || {});
      
      console.log('MultiFloorHeatLoadCalculator - Loading saved data:', savedData);
      console.log('MultiFloorHeatLoadCalculator - Room calculations:', savedData.roomCalculations);
    }
  }, [savedData, projectId, user]);


  // Toggle floor expansion
  const toggleFloor = (floorId) => {
    setExpandedFloors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(floorId)) {
        newSet.delete(floorId);
      } else {
        newSet.add(floorId);
      }
      return newSet;
    });
  };

  // Reset all data
  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all floors and rooms? This action cannot be undone.')) {
      setBuildingData({
        name: '',
        location: '',
        outdoorTemp: 45,
        indoorTemp: 24,
        floors: []
      });
      setCalculations({});
      setExpandedFloors(new Set());
    }
  };

  // Reset specific floor
  const resetFloor = (floorId) => {
    if (window.confirm('Are you sure you want to reset this floor? All rooms and calculations will be removed.')) {
      setBuildingData(prev => ({
        ...prev,
        floors: prev.floors.map(floor => 
          floor.id === floorId 
            ? { ...floor, rooms: [] }
            : floor
        )
      }));
      
      // Remove calculations for this floor
      setCalculations(prev => {
        const newCalculations = { ...prev };
        Object.keys(newCalculations).forEach(key => {
          if (key.startsWith(`${floorId}_`)) {
            delete newCalculations[key];
          }
        });
        return newCalculations;
      });
    }
  };

  // Delete room completely
  const deleteRoom = async (floorId, roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to delete "${roomName}"? This action cannot be undone.`)) {
      return;
    }

    console.log('🗑️ Deleting room:', floorId, roomId);

    // Remove room from building data
    const updatedBuildingData = {
      ...buildingData,
      floors: (buildingData.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: (floor.rooms || []).filter(room => room.id !== roomId)
            }
          : floor
      ),
      lastUpdated: new Date().toISOString()
    };

    // Remove room calculations
    const updatedCalculations = { ...calculations };
    delete updatedCalculations[`${floorId}_${roomId}`];

    // Update state
    setBuildingData(updatedBuildingData);
    setCalculations(updatedCalculations);

    // Immediately save to Firebase
    if (user && projectId) {
      try {
        console.log('💾 Saving room deletion immediately...');
        await HVACDataService.saveBuildingStructure(projectId, updatedBuildingData, user?.uid);
        
        // Also save updated calculations
        await HVACDataService.saveProjectData(projectId, {
          spaceData: {
            buildingData: updatedBuildingData,
            roomCalculations: updatedCalculations,
            lastUpdated: new Date().toISOString()
          }
        }, user.uid);
        
        console.log('✅ Room deletion saved to Firebase');
        toast.success(`Room "${roomName}" deleted successfully!`);
      } catch (error) {
        console.error('❌ Failed to save room deletion:', error);
        toast.error('Room deleted but failed to save. Please refresh.');
      }
    } else {
      toast.success(`Room "${roomName}" deleted successfully!`);
    }
  };

  // Reset specific room (clear calculations but keep room)
  const resetRoom = async (floorId, roomId, roomName) => {
    if (!window.confirm(`Are you sure you want to reset "${roomName}"? All calculations will be removed.`)) {
      return;
    }

    console.log('🔄 Resetting room:', floorId, roomId);

    // Remove room calculations
    const updatedCalculations = { ...calculations };
    delete updatedCalculations[`${floorId}_${roomId}`];
    
    // Reset room data
    const updatedBuildingData = {
      ...buildingData,
      floors: (buildingData.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: (floor.rooms || []).map(room => 
                room.id === roomId 
                  ? { 
                      ...room, 
                      calculated: false,
                      heatLoadData: null,
                      calculationSummary: null,
                      lastCalculated: null
                    }
                  : room
              )
            }
          : floor
      ),
      lastUpdated: new Date().toISOString()
    };

    // Update state
    setBuildingData(updatedBuildingData);
    setCalculations(updatedCalculations);

    // Immediately save to Firebase
    if (user && projectId) {
      try {
        console.log('💾 Saving room reset immediately...');
        await HVACDataService.saveBuildingStructure(projectId, updatedBuildingData, user?.uid);
        
        // Also save updated calculations
        await HVACDataService.saveProjectData(projectId, {
          spaceData: {
            buildingData: updatedBuildingData,
            roomCalculations: updatedCalculations,
            lastUpdated: new Date().toISOString()
          }
        }, user.uid);
        
        console.log('✅ Room reset saved to Firebase');
        toast.success(`Room "${roomName}" reset successfully!`);
      } catch (error) {
        console.error('❌ Failed to save room reset:', error);
        toast.error('Room reset but failed to save. Please refresh.');
      }
    } else {
      toast.success(`Room "${roomName}" reset successfully!`);
    }
  };

  // Add new floor manually
  const addFloor = async () => {
    const currentFloors = buildingData?.floors || [];
    const maxLevel = currentFloors.length > 0 
      ? Math.max(...currentFloors.map(f => f.level || 0))
      : 0;
    
    const newFloor = {
      id: `floor_${Date.now()}`,
      name: `Floor ${maxLevel + 1}`,
      level: maxLevel + 1,
      type: 'upper',
      buildingType: buildingData?.buildingType || '',
      rooms: []
    };
    
    const updatedBuildingData = {
      ...buildingData,
      floors: [...(buildingData.floors || []), newFloor],
      lastUpdated: new Date().toISOString()
    };
    
    setBuildingData(updatedBuildingData);
    
    // Auto-expand new floor
    setExpandedFloors(prev => new Set(prev).add(newFloor.id));
    
    // Immediately save to Firebase
    if (user && projectId) {
      try {
        console.log('💾 Saving new floor immediately...');
        await HVACDataService.saveBuildingStructure(projectId, updatedBuildingData, user?.uid);
        console.log('✅ New floor saved to Firebase');
        toast.success(`${newFloor.name} added and saved!`);
      } catch (error) {
        console.error('❌ Failed to save new floor:', error);
        toast.error('Floor added but failed to save. Please try again.');
      }
    } else {
      toast.success(`${newFloor.name} added successfully!`);
    }
  };

  // Add room to floor
  const addRoom = (floorId) => {
    console.log('Adding room to floor:', floorId);
    
    // Set current floor and null room for new room creation
    setCurrentFloor(floorId);
    setCurrentRoom(null); // null indicates new room
    setShowRoomForm(true);
    
    console.log('Room form should open for new room');
  };

  // Add new room to floor
  const addNewRoom = async (floorId, roomData) => {
    console.log('Adding new room to floor:', floorId, roomData);
    
    const updatedBuildingData = {
      ...buildingData,
      floors: (buildingData.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: [...(floor.rooms || []), roomData]
            }
          : floor
      ),
      lastUpdated: new Date().toISOString()
    };
    
    setBuildingData(updatedBuildingData);
    
    // Immediately save to Firebase (even if incomplete/pending)
    if (user && projectId) {
      try {
        console.log('💾 Saving new room immediately (pending state)...');
        await HVACDataService.saveBuildingStructure(projectId, updatedBuildingData, user?.uid);
        console.log('✅ Pending room saved to Firebase');
        toast.success(`Room "${roomData.name}" added and saved!`);
      } catch (error) {
        console.error('❌ Failed to save pending room:', error);
        toast.error('Room added but failed to save. Please try again.');
      }
    } else {
      toast.success(`Room "${roomData.name}" added successfully!`);
    }
  };

  // Update room data
  const updateRoom = async (floorId, roomId, updates) => {
    console.log('Updating room:', floorId, roomId, updates);
    
    const updatedBuildingData = {
      ...buildingData,
      floors: (buildingData.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: (floor.rooms || []).map(room => 
                room.id === roomId ? { ...room, ...updates } : room
              )
            }
          : floor
      ),
      lastUpdated: new Date().toISOString()
    };
    
    setBuildingData(updatedBuildingData);
    
    // Immediately save to Firebase (even if incomplete/pending)
    if (user && projectId) {
      try {
        console.log('💾 Saving room update immediately...');
        await HVACDataService.saveBuildingStructure(projectId, updatedBuildingData, user?.uid);
        console.log('✅ Room update saved to Firebase');
        toast.success(`Room "${updates.name}" updated and saved!`);
      } catch (error) {
        console.error('❌ Failed to save room update:', error);
        toast.error('Room updated but failed to save. Please try again.');
      }
    } else {
      toast.success(`Room "${updates.name}" updated successfully!`);
    }
  };

  // Handle calculation completion from SpaceConsideredForm
  const handleCalculationComplete = (calculationData) => {
    console.log('🎯 Calculation completed:', calculationData);
    
    // Find the room that was calculated
    const { floorId, roomId } = calculationData;
    
    if (!floorId || !roomId) {
      console.error('❌ Missing floorId or roomId in calculation data');
      return;
    }

    // Create proper heatLoadData structure with all required fields
    const heatLoadData = {
      area: parseFloat(calculationData.heatLoadData?.area || calculationData.area || 0),
      tonnage: parseFloat(calculationData.tons || calculationData.heatLoadData?.tonnage || 0),
      totalCfm: parseFloat(calculationData.supplyCFM || calculationData.heatLoadData?.totalCfm || 0),
      sensibleHeat: parseFloat(calculationData.ESHT || calculationData.heatLoadData?.sensibleHeat || 0),
      latentHeat: parseFloat((calculationData.GTH - calculationData.ESHT) || calculationData.heatLoadData?.latentHeat || 0),
      totalHeat: parseFloat(calculationData.GTH || calculationData.heatLoadData?.totalHeat || 0),
      outsideAirCfm: parseFloat(calculationData.freshAirCFM || calculationData.heatLoadData?.outsideAirCfm || 0),
      diversity: 85, // Default diversity factor
      calculated: true,
      calculatedOn: new Date().toISOString()
    };

    console.log('📊 Structured heat load data:', heatLoadData);

    // Update building data with calculation results
    const updatedBuildingData = {
      ...buildingData,
      floors: (buildingData.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: (floor.rooms || []).map(room => 
                room.id === roomId 
                  ? { 
                      ...room, 
                      calculated: true,
                      heatLoadData: heatLoadData,
                      calculationSummary: {
                        tonnage: heatLoadData.tonnage,
                        cfm: heatLoadData.totalCfm,
                        sensible: heatLoadData.sensibleHeat,
                        latent: heatLoadData.latentHeat,
                        totalHeat: heatLoadData.totalHeat
                      },
                      lastCalculated: new Date().toISOString()
                    } 
                  : room
              )
            }
          : floor
      )
    };

    // Update calculations with complete form data
    const updatedCalculations = {
      ...calculations,
      [`${floorId}_${roomId}`]: {
        roomId,
        floorId,
        roomName: calculationData.roomName || 'Room',
        roomType: calculationData.roomType || 'General',
        formData: calculationData, // Store complete form data for viewing
        heatLoadData: heatLoadData,
        calculated: true,
        timestamp: new Date().toISOString()
      }
    };

    // Update state
    setBuildingData(updatedBuildingData);
    setCalculations(updatedCalculations);

    console.log('✅ Room calculation saved successfully');
    console.log('📦 Updated building data:', updatedBuildingData);
    console.log('📦 Updated calculations:', updatedCalculations);

    // Auto-save to Firebase
    if (user && projectId) {
      const dataToSave = {
        buildingData: updatedBuildingData,
        roomCalculations: updatedCalculations,
        summary: getBuildingSummary(),
        lastUpdated: new Date().toISOString()
      };

      HVACDataService.saveProjectData(projectId, {
        spaceData: dataToSave,
        currentStep: 2
      }, user.uid).then(() => {
        console.log('✅ Auto-saved to Firebase');
        toast.success(`Room "${calculationData.roomName || 'Room'}" calculation saved! Load: ${heatLoadData.tonnage.toFixed(2)} TR`);
      }).catch(error => {
        console.error('❌ Auto-save failed:', error);
      });
    }
  };

  // Calculate individual room heat load (Currently unused - for future implementation)
  /*
  const calculateRoomHeatLoad = (floorId, roomId) => {
    const floor = (buildingData?.floors || []).find(f => f.id === floorId);
    const room = floor?.rooms?.find(r => r.id === roomId);
    
    if (!room || !room.area) return;

    const tempDiff = buildingData.outdoorTemp - buildingData.indoorTemp;
    
    // Sensible Heat Load Calculations
    
    // 1. Transmission Load (Walls, Windows)
    const wallUValue = 0.45; // W/m²K for typical wall
    const windowUValue = 2.5; // W/m²K for single glazing
    const wallArea = (2 * (room.length + room.width) * room.height) - room.windowArea;
    
    const transmissionLoad = (wallArea * wallUValue + room.windowArea * windowUValue) * tempDiff;
    
    // 2. Solar Heat Gain (Windows)
    const solarHeatGainFactors = {
      'North': 150, 'South': 600, 'East': 500, 'West': 500,
      'Northeast': 300, 'Northwest': 300, 'Southeast': 450, 'Southwest': 450
    };
    const solarLoad = room.windowArea * (solarHeatGainFactors[room.orientation] || 150);
    
    // 3. Internal Heat Loads
    const occupancyLoad = room.occupancy * 75; // 75W per person (sensible)
    const lightingLoad = room.area * room.lighting; // W/m²
    const equipmentLoad = room.area * room.equipment; // W/m²
    
    // 4. Ventilation Load
    const ventilationCFM = room.occupancy * 10; // 10 CFM per person
    const ventilationLoad = ventilationCFM * 1.08 * tempDiff; // 1.08 is constant for air
    
    // 5. Infiltration Load
    const infiltrationLoad = room.area * 2 * tempDiff; // 2 W/m²K
    
    // Total Sensible Load
    const sensibleLoad = transmissionLoad + solarLoad + occupancyLoad + 
                        lightingLoad + equipmentLoad + ventilationLoad + infiltrationLoad;
    
    // Latent Load (from occupancy and ventilation)
    const latentLoad = room.occupancy * 55 + (ventilationCFM * 0.68 * 10); // 55W per person latent, humidity load
    
    // Total Load
    const totalLoad = sensibleLoad + latentLoad;
    
    // Apply safety factor
    const safetyFactor = 1.15;
    const finalLoad = totalLoad * safetyFactor;
    
    // Convert to tons (1 ton = 3517 W)
    const loadInTons = finalLoad / 3517;

    const calculation = {
      roomId,
      floorId,
      roomName: room.name,
      roomArea: room.area,
      roomType: room.type,
      breakdown: {
        transmission: Math.round(transmissionLoad),
        solar: Math.round(solarLoad),
        occupancy: Math.round(occupancyLoad),
        lighting: Math.round(lightingLoad),
        equipment: Math.round(equipmentLoad),
        ventilation: Math.round(ventilationLoad),
        infiltration: Math.round(infiltrationLoad),
        latent: Math.round(latentLoad)
      },
      sensibleLoad: Math.round(sensibleLoad),
      latentLoad: Math.round(latentLoad),
      totalLoad: Math.round(totalLoad),
      finalLoad: Math.round(finalLoad),
      loadInTons: Math.round(loadInTons * 100) / 100,
      cfmRequired: Math.round(ventilationCFM),
      // Add structured data for next form (matching Excel format)
      heatLoadData: {
        area: room.area,
        tonnage: Math.round(loadInTons * 100) / 100,
        totalCfm: Math.round(ventilationCFM),
        sensibleHeat: Math.round(sensibleLoad),
        latentHeat: Math.round(latentLoad),
        totalHeat: Math.round(finalLoad),
        calculated: true,
        timestamp: new Date().toISOString()
      }
    };

    // Update the room object in buildingData with calculation results
    setBuildingData(prev => ({
      ...prev,
      floors: (prev.floors || []).map(floor => 
        floor.id === floorId 
          ? {
              ...floor,
              rooms: (floor.rooms || []).map(r => 
                r.id === roomId 
                  ? { 
                      ...r, 
                      calculated: true,
                      heatLoadData: calculation.heatLoadData,
                      calculationSummary: {
                        tonnage: calculation.loadInTons,
                        cfm: calculation.cfmRequired,
                        sensible: calculation.sensibleLoad,
                        latent: calculation.latentLoad
                      }
                    } 
                  : r
              )
            }
          : floor
      )
    }));

    setCalculations(prev => {
      const updated = {
        ...prev,
        [`${floorId}_${roomId}`]: calculation
      };
      
      // Auto-save calculations to maintain state
      setTimeout(() => {
        if (user && projectId) {
          const dataToSave = {
            buildingData,
            roomCalculations: updated,
            calculations: updated,
            summary: getBuildingSummary(),
            timestamp: new Date().toISOString()
          };
          
          HVACDataService.saveProjectData(projectId, {
            spaceData: dataToSave,
            currentStep: 2
          }, user.uid).catch(error => {
            console.error('Auto-save failed:', error);
          });
        }
      }, 1000); // Debounce auto-save by 1 second
      
      return updated;
    });

    return calculation;
  };
  */


  // Get floor summary
  const getFloorSummary = (floorId) => {
    const floorCalculations = Object.values(calculations).filter(calc => calc.floorId === floorId);
    
    return {
      totalRooms: floorCalculations.length,
      totalLoad: floorCalculations.reduce((sum, calc) => sum + calc.finalLoad, 0),
      totalTons: floorCalculations.reduce((sum, calc) => sum + calc.loadInTons, 0),
      totalCFM: floorCalculations.reduce((sum, calc) => sum + calc.cfmRequired, 0)
    };
  };

  // Get building summary from REAL calculated room data
  const getBuildingSummary = () => {
    // Get all calculated rooms from building data and calculations state
    const calculatedRooms = [];
    let totalRoomsInBuilding = 0;
    
    (buildingData?.floors || []).forEach(floor => {
      (floor.rooms || []).forEach(room => {
        totalRoomsInBuilding++;
        
        // Check both room.heatLoadData and calculations state
        const roomKey = `${floor.id}_${room.id}`;
        const roomCalc = calculations[roomKey];
        const heatLoadData = roomCalc?.heatLoadData || room.heatLoadData;
        
        if (heatLoadData && heatLoadData.calculated) {
          calculatedRooms.push({
            ...room,
            floorName: floor.name,
            heatLoadData: heatLoadData
          });
        }
      });
    });
    
    // Calculate REAL totals from actual room heatLoadData
    const totals = calculatedRooms.reduce((sum, room) => {
      const heatData = room.heatLoadData;
      return {
        totalArea: sum.totalArea + (heatData.area || 0),
        totalLoad: sum.totalLoad + (heatData.totalHeat || 0),
        totalTons: sum.totalTons + (heatData.tonnage || 0),
        totalCFM: sum.totalCFM + (heatData.totalCfm || 0),
        totalSensible: sum.totalSensible + (heatData.sensibleHeat || 0),
        totalLatent: sum.totalLatent + (heatData.latentHeat || 0)
      };
    }, {
      totalArea: 0,
      totalLoad: 0,
      totalTons: 0,
      totalCFM: 0,
      totalSensible: 0,
      totalLatent: 0
    });
    
    return {
      totalFloors: (buildingData?.floors || []).length,
      totalRooms: totalRoomsInBuilding,
      calculatedRooms: calculatedRooms.length,
      pendingRooms: totalRoomsInBuilding - calculatedRooms.length,
      ...totals,
      averageLoadPerRoom: calculatedRooms.length > 0 ? totals.totalTons / calculatedRooms.length : 0,
      completionPercentage: totalRoomsInBuilding > 0 ? (calculatedRooms.length / totalRoomsInBuilding) * 100 : 0
    };
  };

  // Save data with proper state management
  const saveData = async () => {
    try {
      const buildingSummary = getBuildingSummary();
      
      // Ensure all rooms have proper calculation data structure for next form
      const enhancedBuildingData = {
        ...buildingData,
        totalArea: buildingSummary.totalArea,
        totalFloors: (buildingData?.floors || []).length,
        totalRooms: buildingSummary.totalRooms,
        floors: (buildingData?.floors || []).map(floor => ({
          ...floor,
          rooms: (floor.rooms || []).map(room => {
            const calculation = calculations[`${floor.id}_${room.id}`];
            return {
              ...room,
              calculated: !!calculation,
              heatLoadData: calculation?.heatLoadData || room.heatLoadData || null
            };
          })
        }))
      };
      
      const dataToSave = {
        buildingData: enhancedBuildingData,
        roomCalculations: calculations,
        calculations, // Keep for backward compatibility
        summary: buildingSummary,
        timestamp: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };

      console.log('💾 Saving:', buildingSummary.calculatedRooms, '/', buildingSummary.totalRooms, 'rooms calculated');

      // Validation: Check if at least some rooms are calculated
      if (buildingSummary.calculatedRooms === 0) {
        toast.warning('Please calculate heat load for at least one room before proceeding to equipment selection.');
        return false;
      }

      // Save to Firebase using HVACDataService
      if (user && projectId) {
        await HVACDataService.saveProjectData(projectId, {
          spaceData: dataToSave,  // dataToSave already contains buildingData, roomCalculations, summary
          currentStep: 2
        }, user.uid);
        
        console.log('✅ Data saved to Firebase successfully');
        console.log('📊 Saved spaceData structure:', Object.keys(dataToSave));
        
        // Show success toast with summary
        toast.success(`Building Configuration Saved! 📊 ${buildingSummary.calculatedRooms}/${buildingSummary.totalRooms} rooms calculated | Total: ${buildingSummary.totalTons.toFixed(2)} TR`);
      }

      // Call parent save callback
      if (onSave) {
        onSave(dataToSave);
      }

      return true;
    } catch (error) {
      console.error('❌ Error saving data:', error);
      toast.error(`Error saving data: ${error.message}. Please try again.`);
      return false;
    }
  };


  const buildingSummary = getBuildingSummary();

  // Error boundary protection
  if (!buildingData) {
    return (
      <div className="multi-floor-calculator">
        <div className="loading-message">Loading building configuration...</div>
      </div>
    );
  }

  return (
    <div className="multi-floor-calculator">
      <div className="calculator-header">
        <div className="header-main">
          <h2>Multi-Floor Heat Load Calculator</h2>
          <div className="workflow-info">
            <span className="workflow-text">Click "Calculate Heat Load" on each room to proceed</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={resetAllData} className="btn-reset" title="Reset All Data">
            <i className="bi bi-arrow-clockwise"></i>
            Reset All
          </button>
          <button 
            onClick={async () => {
              const success = await saveData();
              if (success && buildingSummary.calculatedRooms > 0) {
                // Navigate to next step (Equipment Selection)
                alert(`Heat Load Calculation Complete!\n\n` +
                  `📊 Summary:\n` +
                  `• Calculated Rooms: ${buildingSummary.calculatedRooms}/${buildingSummary.totalRooms}\n` +
                  `• Total Load: ${buildingSummary.totalTons.toFixed(2)} TR\n` +
                  `• Total CFM: ${buildingSummary.totalCFM.toLocaleString()}\n\n` +
                  `Proceeding to Equipment Selection...`);
                
                // Trigger navigation to next step
                if (onSave) {
                  onSave({
                    buildingData: buildingData,
                    roomCalculations: calculations,
                    summary: buildingSummary,
                    nextStep: 'equipment-selection'
                  });
                }
              }
            }}
            className="btn-save"
            disabled={buildingSummary.calculatedRooms === 0}
          >
            <i className="bi bi-arrow-right-circle"></i>
            Save & Continue to Equipment Selection
          </button>
        </div>
      </div>

      {/* Building Summary */}
      <div className="building-summary">
        <div className="summary-header">
          <h3>Building Summary</h3>
          <div className="completion-badge">
            <span className="completion-text">
              {buildingSummary.calculatedRooms} of {buildingSummary.totalRooms} rooms calculated
            </span>
            <div className="completion-bar">
              <div 
                className="completion-fill" 
                style={{ width: `${buildingSummary.completionPercentage}%` }}
              ></div>
            </div>
            <span className="completion-percentage">
              {Math.round(buildingSummary.completionPercentage)}%
            </span>
          </div>
        </div>
        
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-building"></i>
            </div>
            <div className="card-content">
              <span className="label">Total Floors</span>
              <span className="value">{buildingSummary.totalFloors}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-door-closed"></i>
            </div>
            <div className="card-content">
              <span className="label">Total Rooms</span>
              <span className="value">{buildingSummary.totalRooms}</span>
            </div>
          </div>
          <div className="summary-card calculated">
            <div className="card-icon">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="card-content">
              <span className="label">Calculated</span>
              <span className="value">{buildingSummary.calculatedRooms}</span>
            </div>
          </div>
          <div className="summary-card pending">
            <div className="card-icon">
              <i className="bi bi-clock"></i>
            </div>
            <div className="card-content">
              <span className="label">Pending</span>
              <span className="value">{buildingSummary.pendingRooms}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-arrows-fullscreen"></i>
            </div>
            <div className="card-content">
              <span className="label">Total Area</span>
              <span className="value">{buildingSummary.totalArea.toFixed(1)} m²</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-lightning-charge"></i>
            </div>
            <div className="card-content">
              <span className="label">Total Load</span>
              <span className="value">{(buildingSummary.totalLoad / 1000).toFixed(1)} kW</span>
            </div>
          </div>
          <div className="summary-card highlight">
            <div className="card-icon">
              <i className="bi bi-snow"></i>
            </div>
            <div className="card-content">
              <span className="label">Total Capacity</span>
              <span className="value">{buildingSummary.totalTons.toFixed(2)} Tons</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-wind"></i>
            </div>
            <div className="card-content">
              <span className="label">Total CFM</span>
              <span className="value">{buildingSummary.totalCFM.toLocaleString()}</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon">
              <i className="bi bi-graph-up"></i>
            </div>
            <div className="card-content">
              <span className="label">Avg Load/Room</span>
              <span className="value">{buildingSummary.averageLoadPerRoom.toFixed(2)} Tons</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floors Section */}
      <div className="floors-section">
        <div className="section-header">
          <h3>Floors & Rooms</h3>
          <div className="section-actions">
            <span className="floor-count">{(buildingData?.floors || []).length} floors</span>
            <button onClick={addFloor} className="btn-add-floor">
              <i className="bi bi-plus-circle"></i>
              Add Floor
            </button>
          </div>
        </div>

        {(buildingData.floors || []).map(floor => {
          const floorSummary = getFloorSummary(floor.id);
          const isExpanded = expandedFloors.has(floor.id);
          
          return (
            <div key={floor.id} className="floor-card">
              <div className="floor-header" onClick={() => toggleFloor(floor.id)}>
                <div className="floor-main">
                  <div className="floor-toggle">
                    <i className={`bi bi-chevron-${isExpanded ? 'down' : 'right'}`}></i>
                  </div>
                  <div className="floor-info">
                    <h4>{floor.name}</h4>
                    <div className="floor-stats">
                      <span className="stat">
                        <i className="bi bi-door-closed"></i>
                        {floor.rooms?.length || 0} rooms
                      </span>
                      <span className="stat">
                        <i className="bi bi-snow"></i>
                        {floorSummary.totalTons.toFixed(1)} tons
                      </span>
                      <span className="stat">
                        <i className="bi bi-wind"></i>
                        {floorSummary.totalCFM.toLocaleString()} CFM
                      </span>
                    </div>
                  </div>
                </div>
                <div className="floor-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      resetFloor(floor.id);
                    }}
                    className="btn-reset-floor"
                    title="Reset Floor"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addRoom(floor.id);
                    }}
                    className="btn-add-room"
                  >
                    <i className="bi bi-plus"></i>
                    Add Room
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="floor-content">
                  <div className="rooms-grid">
                    {(floor.rooms || []).map(room => {
                      const calculation = calculations[`${floor.id}_${room.id}`];
                      const heatLoadData = calculation?.heatLoadData || room.heatLoadData;
                      const isCalculated = !!(calculation?.calculated || heatLoadData);
                      
                      return (
                        <div key={room.id} className={`room-card ${isCalculated ? 'calculated' : 'pending'}`}>
                          <div className="room-header">
                            <div className="room-title">
                              <h5>{room.name || 'Unnamed Room'}</h5>
                              <div className="room-status">
                                {isCalculated ? (
                                  <span className="status-badge calculated">
                                    <i className="bi bi-check-circle"></i>
                                    Calculated
                                  </span>
                                ) : (
                                  <span className="status-badge pending">
                                    <i className="bi bi-clock"></i>
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="room-header-actions">
                              <button 
                                onClick={() => resetRoom(floor.id, room.id, room.name)}
                                className="btn-reset-room"
                                title="Reset Room Calculations"
                              >
                                <i className="bi bi-arrow-clockwise"></i>
                              </button>
                              <button 
                                onClick={() => deleteRoom(floor.id, room.id, room.name)}
                                className="btn-delete-room"
                                title="Delete Room"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                          
                          <div className="room-details">
                            {isCalculated && heatLoadData ? (
                              // Show calculated data
                              <>
                                <div className="detail-grid">
                                  <div className="detail-item">
                                    <span className="detail-label">Area:</span>
                                    <span className="detail-value highlight">{heatLoadData.area?.toFixed(1) || '0'} m²</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Capacity:</span>
                                    <span className="detail-value highlight">{heatLoadData.tonnage?.toFixed(2) || '0'} tons</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">CFM:</span>
                                    <span className="detail-value">{heatLoadData.totalCfm?.toLocaleString() || '0'}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Sensible:</span>
                                    <span className="detail-value">{(heatLoadData.sensibleHeat || 0).toLocaleString()} W</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Latent:</span>
                                    <span className="detail-value">{(heatLoadData.latentHeat || 0).toLocaleString()} W</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-label">Total Load:</span>
                                    <span className="detail-value highlight">{(heatLoadData.totalHeat || 0).toLocaleString()} W</span>
                                  </div>
                                </div>
                                <div className="calculation-date">
                                  <i className="bi bi-calendar"></i>
                                  Calculated: {new Date(heatLoadData.calculatedOn || calculation?.timestamp).toLocaleDateString()}
                                </div>
                              </>
                            ) : (
                              // Show pending status
                              <div className="pending-state">
                                <i className="bi bi-calculator"></i>
                                <span>Ready for heat load calculation</span>
                              </div>
                            )}
                          </div>

                          <div className="room-actions">
                            <button 
                              onClick={() => {
                                setCurrentFloor(floor.id);
                                setCurrentRoom(room);
                                setShowRoomForm(true);
                              }}
                              className="btn-edit"
                            >
                              <i className="bi bi-pencil"></i>
                              Edit
                            </button>
                            
                            <button 
                              onClick={() => {
                                // Open SpaceConsideredForm for this specific room
                                const roomData = {
                                  floorId: floor.id,
                                  floorName: floor.name,
                                  roomId: room.id,
                                  roomName: room.name,
                                  roomType: room.type,
                                  area: room.area || (room.length && room.width ? room.length * room.width : 0),
                                  length: room.length,
                                  width: room.width,
                                  height: room.height,
                                  occupancy: room.occupancy,
                                  lighting: room.lighting,
                                  equipment: room.equipment,
                                  orientation: room.orientation,
                                  windowArea: room.windowArea,
                                  // Pass existing calculation data if available
                                  existingCalculation: room.heatLoadData,
                                  onCalculationComplete: handleCalculationComplete
                                };
                                
                                if (onRoomSelect) {
                                  onRoomSelect(roomData);
                                }
                              }}
                              className={`btn-calculate ${isCalculated ? 'view-calculation' : 'calculate'}`}
                            >
                              <i className="bi bi-calculator"></i>
                              {isCalculated ? 'View Calculation' : 'Calculate Heat Load'}
                            </button>
                            
                            {isCalculated && heatLoadData && (
                              <button 
                                onClick={() => {
                                  // Show detailed calculation data
                                  const data = heatLoadData;
                                  alert(`Heat Load Details for ${room.name}:\n\n` +
                                    `Area: ${data.area?.toFixed(1) || '0'} m²\n` +
                                    `Sensible Heat: ${(data.sensibleHeat || 0).toLocaleString()} BTU/hr\n` +
                                    `Latent Heat: ${(data.latentHeat || 0).toLocaleString()} BTU/hr\n` +
                                    `Total Heat: ${(data.totalHeat || 0).toLocaleString()} BTU/hr\n` +
                                    `Tonnage: ${data.tonnage?.toFixed(2) || '0'} TR\n` +
                                    `Total CFM: ${(data.totalCfm || 0).toLocaleString()}\n` +
                                    `Outside Air CFM: ${(data.outsideAirCfm || 0).toLocaleString()}\n` +
                                    `Diversity Factor: ${data.diversity || 85}%\n\n` +
                                    `Calculated on: ${new Date(data.calculatedOn || calculation?.timestamp).toLocaleString()}`
                                  );
                                }}
                                className="btn-details"
                              >
                                <i className="bi bi-info-circle"></i>
                                Details
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {(!floor.rooms || floor.rooms.length === 0) && (
                    <div className="empty-state">
                      <i className="bi bi-door-closed"></i>
                      <p>No rooms added to this floor yet</p>
                      <button 
                        onClick={() => addRoom(floor.id)}
                        className="btn-add-first-room"
                      >
                        <i className="bi bi-plus"></i>
                        Add First Room
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {(buildingData?.floors || []).length === 0 && (
          <div className="empty-floors-state">
            <div className="empty-content">
              <i className="bi bi-building"></i>
              <h4>No Floors Added Yet</h4>
              <p>Start by adding your first floor to begin room configuration</p>
              <button onClick={addFloor} className="btn-add-first-floor">
                <i className="bi bi-plus-circle"></i>
                Add First Floor
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Room Form Modal */}
      {showRoomForm && (
        <RoomForm
          floor={(buildingData?.floors || []).find(f => f.id === currentFloor)}
          room={currentRoom}
          buildingType={buildingData?.buildingType || ''}
          onClose={() => {
            setShowRoomForm(false);
            setCurrentRoom(null);
            setCurrentFloor(null);
          }}
          onUpdate={(roomData) => {
            console.log('Saving room data:', roomData);
            
            if (currentRoom) {
              // Update existing room
              updateRoom(currentFloor, currentRoom.id, roomData);
            } else {
              // Add new room
              addNewRoom(currentFloor, roomData);
            }
            
            // Close the form
            setShowRoomForm(false);
            setCurrentRoom(null);
            setCurrentFloor(null);
          }}
        />
      )}
    </div>
  );
};

export default MultiFloorHeatLoadCalculator;