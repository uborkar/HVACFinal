import React, { useState, useEffect } from 'react';
import { ref, set, get, update } from 'firebase/database';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import './EquipmentSelectionForm.css';

// Equipment Database
const IDU_TYPES = {
  'Ceiling Cassette': {
    capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
    cfmRange: [200, 800],
    applications: ['office', 'retail', 'restaurant']
  },
  'Wall Mounted': {
    capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0],
    cfmRange: [150, 600],
    applications: ['residential', 'small_office', 'bedroom']
  },
  'Floor Standing': {
    capacities: [2.0, 3.0, 4.0, 5.0, 7.5, 10.0],
    cfmRange: [400, 1500],
    applications: ['large_office', 'hall', 'auditorium']
  },
  'Concealed Duct': {
    capacities: [1.5, 2.0, 3.0, 4.0, 5.0, 7.5, 10.0, 15.0],
    cfmRange: [300, 2000],
    applications: ['office', 'retail', 'hospital']
  },
  'Ceiling Suspended': {
    capacities: [2.0, 3.0, 4.0, 5.0, 7.5, 10.0],
    cfmRange: [400, 1500],
    applications: ['warehouse', 'factory', 'large_space']
  }
};

const ODU_TYPES = {
  'Single Split': {
    capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
    maxIDUs: 1,
    efficiency: 'Standard'
  },
  'Multi Split': {
    capacities: [3.0, 4.0, 5.0, 7.5, 10.0, 12.0, 15.0],
    maxIDUs: 8,
    efficiency: 'High'
  },
  'VRF System': {
    capacities: [8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0, 40.0, 50.0],
    maxIDUs: 64,
    efficiency: 'Very High'
  },
  'Chiller': {
    capacities: [50.0, 75.0, 100.0, 150.0, 200.0, 300.0, 500.0],
    maxIDUs: 'Unlimited',
    efficiency: 'Excellent'
  }
};

const EquipmentSelectionForm = ({ 
  designData, 
  spaceData = null, 
  multiFloorSpaceData = null, 
  summaryData,
  onSave, 
  onBack, 
  savedData = null, 
  projectId = null 
}) => {
  const { user } = useAuth();
  
  // Form states
  const [isEditing, setIsEditing] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  
  // Equipment selection state
  const [equipmentData, setEquipmentData] = useState({
    floors: {},
    projectTotals: {
      totalIDUs: 0,
      totalODUs: 0,
      totalTonnage: 0,
      totalCFM: 0,
      totalHP: 0,
      diversityFactor: 0.85
    },
    systemRecommendation: null,
    calculatedAt: null
  });

  // Determine if this is a multi-floor project
  const isMultiFloor = multiFloorSpaceData && multiFloorSpaceData.multiFloorProject;

  // Initialize equipment data from summary
  useEffect(() => {
    if (summaryData) {
      if (isMultiFloor) {
        // Multi-floor project equipment selection
        const floors = {};
        
        Object.entries(summaryData.floorSummaries || {}).forEach(([floorId, floorSummary]) => {
          floors[floorId] = {
            floorName: floorSummary.floorName,
            floorCode: floorSummary.floorCode,
            rooms: floorSummary.roomBreakdown.map(room => ({
              ...room,
              // Equipment selection fields
              selectedIDUType: getRecommendedIDUType(room.type, room.heatLoad?.tonnage || 0),
              selectedIDUCapacity: calculateRequiredCapacity(room.heatLoad?.tonnage || 0),
              numberOfIDUs: calculateNumberOfIDUs(room.heatLoad?.tonnage || 0, room.area),
              totalIDUTonnage: 0,
              selectedODUType: 'Multi Split',
              selectedODUHP: 0,
              diversityFactor: getDiversityFactor(room.type),
              // Calculated fields
              actualCFM: room.heatLoad?.cfm || 0,
              adjustedLoad: 0
            })),
            floorTotals: {
              totalRooms: floorSummary.totalRooms,
              totalIDUs: 0,
              totalODUs: 0,
              totalTonnage: floorSummary.totals?.tonnage || 0,
              totalCFM: floorSummary.totals?.totalCFM || 0,
              totalHP: 0,
              diversityFactor: 0.85
            }
          };
        });

        setEquipmentData({
          floors,
          projectTotals: {
            totalIDUs: 0,
            totalODUs: 0,
            totalTonnage: summaryData.buildingTotals?.tonnage || 0,
            totalCFM: summaryData.buildingTotals?.totalCFM || 0,
            totalHP: 0,
            diversityFactor: summaryData.diversityFactors?.overall || 0.85
          },
          systemRecommendation: generateSystemRecommendation(summaryData.buildingTotals?.tonnage || 0),
          calculatedAt: new Date().toISOString()
        });
      } else {
        // Single room project
        const singleRoom = summaryData.floorSummaries?.single?.roomBreakdown?.[0];
        if (singleRoom) {
          const floors = {
            'single': {
              floorName: 'Single Room',
              floorCode: 'SR',
              rooms: [{
                ...singleRoom,
                selectedIDUType: getRecommendedIDUType(singleRoom.type, singleRoom.heatLoad?.tonnage || 0),
                selectedIDUCapacity: calculateRequiredCapacity(singleRoom.heatLoad?.tonnage || 0),
                numberOfIDUs: calculateNumberOfIDUs(singleRoom.heatLoad?.tonnage || 0, singleRoom.area),
                totalIDUTonnage: singleRoom.heatLoad?.tonnage || 0,
                selectedODUType: 'Single Split',
                selectedODUHP: Math.ceil((singleRoom.heatLoad?.tonnage || 0) * 1.2),
                diversityFactor: 1.0,
                actualCFM: singleRoom.heatLoad?.cfm || 0,
                adjustedLoad: singleRoom.heatLoad?.total || 0
              }],
              floorTotals: {
                totalRooms: 1,
                totalIDUs: 1,
                totalODUs: 1,
                totalTonnage: singleRoom.heatLoad?.tonnage || 0,
                totalCFM: singleRoom.heatLoad?.cfm || 0,
                totalHP: Math.ceil((singleRoom.heatLoad?.tonnage || 0) * 1.2),
                diversityFactor: 1.0
              }
            }
          };

          setEquipmentData({
            floors,
            projectTotals: {
              totalIDUs: 1,
              totalODUs: 1,
              totalTonnage: singleRoom.heatLoad?.tonnage || 0,
              totalCFM: singleRoom.heatLoad?.cfm || 0,
              totalHP: Math.ceil((singleRoom.heatLoad?.tonnage || 0) * 1.2),
              diversityFactor: 1.0
            },
            systemRecommendation: generateSystemRecommendation(singleRoom.heatLoad?.tonnage || 0),
            calculatedAt: new Date().toISOString()
          });
        }
      }
    }
  }, [summaryData, isMultiFloor]);

  // Load saved data
  useEffect(() => {
    const loadSavedData = async () => {
      const projectNumber = designData?.meta?.projectNumber || projectId;
      if (!projectNumber) {
        setLoadingSaved(false);
        return;
      }

      try {
        const snap = await get(ref(db, `projects/${projectNumber}/equipmentData`));
        if (snap.exists()) {
          const data = snap.val();
          setEquipmentData(data);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error loading saved equipment data:', error);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedData();
  }, [designData?.meta?.projectNumber, projectId]);

  // Helper functions
  const getRecommendedIDUType = (roomType, tonnage) => {
    if (tonnage <= 1.5) return 'Wall Mounted';
    if (tonnage <= 3.0) return 'Ceiling Cassette';
    if (tonnage <= 7.5) return 'Concealed Duct';
    return 'Floor Standing';
  };

  const calculateRequiredCapacity = (tonnage) => {
    // Add 20% safety factor
    const requiredCapacity = tonnage * 1.2;
    
    // Find the next available capacity
    const allCapacities = [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0, 15.0];
    return allCapacities.find(cap => cap >= requiredCapacity) || 15.0;
  };

  const calculateNumberOfIDUs = (tonnage, area) => {
    // Basic logic: 1 IDU per 500 sq.ft or per 5 TR, whichever is more
    const idusByArea = Math.ceil(area / 500);
    const idusByLoad = Math.ceil(tonnage / 5);
    return Math.max(idusByArea, idusByLoad, 1);
  };

  const getDiversityFactor = (roomType) => {
    const factors = {
      'office': 0.85,
      'retail': 0.90,
      'restaurant': 0.95,
      'hospital': 0.95,
      'hotel': 0.80,
      'school': 0.85
    };
    return factors[roomType] || 0.85;
  };

  const generateSystemRecommendation = (totalTonnage) => {
    if (totalTonnage <= 10) {
      return {
        system: 'Multi Split System',
        description: 'Individual multi-split units for each zone',
        benefits: ['Lower initial cost', 'Easy maintenance', 'Individual zone control'],
        considerations: ['Higher operating cost for large systems', 'Multiple outdoor units']
      };
    } else if (totalTonnage <= 50) {
      return {
        system: 'VRF System',
        description: 'Variable Refrigerant Flow system with centralized outdoor units',
        benefits: ['High efficiency', 'Excellent zone control', 'Heat recovery capability'],
        considerations: ['Higher initial cost', 'Requires skilled technicians']
      };
    } else {
      return {
        system: 'Chilled Water System',
        description: 'Central chiller plant with chilled water distribution',
        benefits: ['Highest efficiency for large loads', 'Centralized maintenance', 'Long lifespan'],
        considerations: ['Highest initial cost', 'Requires water treatment', 'Complex controls']
      };
    }
  };

  // Update room equipment selection
  const updateRoomEquipment = (floorId, roomIndex, field, value) => {
    setEquipmentData(prev => {
      const newData = { ...prev };
      const room = newData.floors[floorId].rooms[roomIndex];
      
      room[field] = value;
      
      // Recalculate dependent fields
      if (field === 'selectedIDUCapacity' || field === 'numberOfIDUs') {
        room.totalIDUTonnage = room.selectedIDUCapacity * room.numberOfIDUs;
        room.selectedODUHP = Math.ceil(room.totalIDUTonnage * 1.2);
      }
      
      // Recalculate floor totals
      calculateFloorTotals(newData, floorId);
      
      // Recalculate project totals
      calculateProjectTotals(newData);
      
      return newData;
    });
  };

  // Calculate floor totals
  const calculateFloorTotals = (data, floorId) => {
    const floor = data.floors[floorId];
    let totalIDUs = 0;
    let totalTonnage = 0;
    let totalCFM = 0;
    let totalHP = 0;

    floor.rooms.forEach(room => {
      totalIDUs += room.numberOfIDUs || 0;
      totalTonnage += room.totalIDUTonnage || 0;
      totalCFM += room.actualCFM || 0;
      totalHP += room.selectedODUHP || 0;
    });

    // Apply diversity factor
    const diversityFactor = floor.floorTotals.diversityFactor;
    floor.floorTotals = {
      ...floor.floorTotals,
      totalIDUs,
      totalODUs: Math.ceil(totalIDUs / 4), // Estimate ODUs
      totalTonnage: totalTonnage * diversityFactor,
      totalCFM: totalCFM * diversityFactor,
      totalHP: totalHP * diversityFactor
    };
  };

  // Calculate project totals
  const calculateProjectTotals = (data) => {
    let totalIDUs = 0;
    let totalODUs = 0;
    let totalTonnage = 0;
    let totalCFM = 0;
    let totalHP = 0;

    Object.values(data.floors).forEach(floor => {
      totalIDUs += floor.floorTotals.totalIDUs || 0;
      totalODUs += floor.floorTotals.totalODUs || 0;
      totalTonnage += floor.floorTotals.totalTonnage || 0;
      totalCFM += floor.floorTotals.totalCFM || 0;
      totalHP += floor.floorTotals.totalHP || 0;
    });

    data.projectTotals = {
      totalIDUs,
      totalODUs,
      totalTonnage,
      totalCFM,
      totalHP,
      diversityFactor: data.projectTotals.diversityFactor
    };

    // Update system recommendation
    data.systemRecommendation = generateSystemRecommendation(totalTonnage);
  };

  // Save equipment data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to save projects.');
      return;
    }

    try {
      const projectNumber = designData?.meta?.projectNumber || projectId;
      if (!projectNumber) {
        alert('Project number is required to save data.');
        return;
      }

      const projectRef = ref(db, `projects/${projectNumber}`);
      const existingProject = await get(projectRef);

      if (existingProject.exists()) {
        await update(projectRef, {
          equipmentData: equipmentData
        });
      } else {
        await set(projectRef, {
          meta: designData?.meta || {},
          equipmentData: equipmentData
        });
      }

      if (onSave) onSave(equipmentData);
      setHasSaved(true);
      setIsEditing(false);
      alert('Equipment selection saved successfully!');
    } catch (error) {
      console.error('Error saving equipment data:', error);
      alert('Error saving equipment selection. Please try again.');
    }
  };

  if (loadingSaved) {
    return <div className="loading-spinner">Loading equipment selection...</div>;
  }

  return (
    <div className="equipment-selection-container">
      <div className="equipment-selection-form">
        {/* Header */}
        <header className="form-header">
          <div className="header-content">
            <h2>🔧 Equipment Selection & Sizing</h2>
            <div className="header-actions">
              {hasSaved && !isEditing ? (
                <>
                  <span style={{color:'#16a34a', fontSize:12}}>Saved</span>
                  <button type="button" className="edit-button" onClick={()=>setIsEditing(true)}>Edit</button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={!isEditing} style={{border:'none', padding:0, margin:0}}>
            
            {/* System Recommendation */}
            {equipmentData.systemRecommendation && (
              <div className="system-recommendation-section">
                <h3>💡 Recommended System: {equipmentData.systemRecommendation.system}</h3>
                <div className="recommendation-content">
                  <p className="system-description">{equipmentData.systemRecommendation.description}</p>
                  <div className="recommendation-details">
                    <div className="benefits">
                      <h4>✅ Benefits:</h4>
                      <ul>
                        {equipmentData.systemRecommendation.benefits.map((benefit, index) => (
                          <li key={index}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="considerations">
                      <h4>⚠️ Considerations:</h4>
                      <ul>
                        {equipmentData.systemRecommendation.considerations.map((consideration, index) => (
                          <li key={index}>{consideration}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Project Totals Summary */}
            <div className="project-totals-section">
              <h3>📊 Project Equipment Summary</h3>
              <div className="totals-grid">
                <div className="total-card">
                  <div className="total-icon">❄️</div>
                  <div className="total-content">
                    <span className="total-value">{equipmentData.projectTotals.totalTonnage.toFixed(1)} TR</span>
                    <span className="total-label">Total Cooling Load</span>
                  </div>
                </div>
                <div className="total-card">
                  <div className="total-icon">🏠</div>
                  <div className="total-content">
                    <span className="total-value">{equipmentData.projectTotals.totalIDUs}</span>
                    <span className="total-label">Indoor Units</span>
                  </div>
                </div>
                <div className="total-card">
                  <div className="total-icon">🔧</div>
                  <div className="total-content">
                    <span className="total-value">{equipmentData.projectTotals.totalODUs}</span>
                    <span className="total-label">Outdoor Units</span>
                  </div>
                </div>
                <div className="total-card">
                  <div className="total-icon">🌪️</div>
                  <div className="total-content">
                    <span className="total-value">{equipmentData.projectTotals.totalCFM.toLocaleString()}</span>
                    <span className="total-label">Total CFM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floor-wise Equipment Selection */}
            <div className="floor-equipment-section">
              <h3>🏗️ Floor-wise Equipment Selection</h3>
              
              {Object.entries(equipmentData.floors || {}).map(([floorId, floor]) => (
                <div key={floorId} className="floor-equipment-card">
                  <div className="floor-header">
                    <h4>
                      <span className="floor-code">{floor.floorCode}</span>
                      {floor.floorName}
                    </h4>
                    <div className="floor-summary">
                      <span>{floor.floorTotals.totalTonnage.toFixed(1)} TR</span>
                      <span>{floor.floorTotals.totalIDUs} IDUs</span>
                      <span>{floor.floorTotals.totalCFM.toLocaleString()} CFM</span>
                    </div>
                  </div>

                  {/* Equipment Selection Table */}
                  <div className="equipment-table-container">
                    <table className="equipment-table">
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th>Area (sq.ft)</th>
                          <th>Load (TR)</th>
                          <th>IDU Type</th>
                          <th>IDU Capacity</th>
                          <th>No. of IDUs</th>
                          <th>Total IDU (TR)</th>
                          <th>CFM</th>
                          <th>ODU Type</th>
                          <th>ODU (HP)</th>
                          <th>Diversity (%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floor.rooms.map((room, roomIndex) => (
                          <tr key={roomIndex}>
                            <td className="room-name">{room.name}</td>
                            <td>{room.area}</td>
                            <td className="load-value">{(room.heatLoad?.tonnage || 0).toFixed(2)}</td>
                            <td>
                              <select
                                value={room.selectedIDUType || ''}
                                onChange={(e) => updateRoomEquipment(floorId, roomIndex, 'selectedIDUType', e.target.value)}
                              >
                                {Object.keys(IDU_TYPES).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                value={room.selectedIDUCapacity || ''}
                                onChange={(e) => updateRoomEquipment(floorId, roomIndex, 'selectedIDUCapacity', parseFloat(e.target.value))}
                              >
                                {IDU_TYPES[room.selectedIDUType]?.capacities.map(cap => (
                                  <option key={cap} value={cap}>{cap} TR</option>
                                )) || []}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={room.numberOfIDUs || 1}
                                onChange={(e) => updateRoomEquipment(floorId, roomIndex, 'numberOfIDUs', parseInt(e.target.value) || 1)}
                              />
                            </td>
                            <td className="calculated-value">{(room.totalIDUTonnage || 0).toFixed(2)}</td>
                            <td>{(room.actualCFM || 0).toLocaleString()}</td>
                            <td>
                              <select
                                value={room.selectedODUType || ''}
                                onChange={(e) => updateRoomEquipment(floorId, roomIndex, 'selectedODUType', e.target.value)}
                              >
                                {Object.keys(ODU_TYPES).map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td className="calculated-value">{room.selectedODUHP || 0}</td>
                            <td>{((room.diversityFactor || 0.85) * 100).toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="floor-totals-row">
                          <td colSpan="2"><strong>Floor Totals:</strong></td>
                          <td><strong>{floor.floorTotals.totalTonnage.toFixed(1)} TR</strong></td>
                          <td colSpan="2"></td>
                          <td><strong>{floor.floorTotals.totalIDUs}</strong></td>
                          <td><strong>{floor.floorTotals.totalTonnage.toFixed(1)} TR</strong></td>
                          <td><strong>{floor.floorTotals.totalCFM.toLocaleString()}</strong></td>
                          <td></td>
                          <td><strong>{floor.floorTotals.totalHP.toFixed(0)} HP</strong></td>
                          <td><strong>{((floor.floorTotals.diversityFactor || 0.85) * 100).toFixed(0)}%</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" onClick={onBack} className="secondary-button">
                ← Back to Summary
              </button>
              <button type="submit" className="primary-button">
                Save Equipment Selection
              </button>
            </div>

          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default EquipmentSelectionForm;
