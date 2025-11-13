import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from '../../utils/toast';
import './EquipmentSelectionTable.css';

/**
 * Equipment Selection Table Component
 * Displays floor-wise room data in a structured table format
 * Matches the Excel sheet structure with IDU and ODU sections
 */

const EquipmentSelectionTable = ({ spaceData, onSave, onBack, projectId }) => {
  const { user } = useAuth();
  const [equipmentRows, setEquipmentRows] = useState([]);
  const [systemType, setSystemType] = useState('VRF');

  // Generate equipment rows from room calculations
  useEffect(() => {
    if (!spaceData?.roomCalculations) {
      console.log('⚠️ No room calculations found');
      return;
    }

    const roomCalcs = spaceData.roomCalculations;
    const buildingData = spaceData.buildingData || {};
    const floors = buildingData.floors || [];

    console.log('🔄 Generating equipment rows from room calculations');
    console.log('📊 Room calculations:', roomCalcs);
    console.log('📊 Number of room calculations:', Object.keys(roomCalcs).length);
    console.log('🏗️ Building floors:', floors);

    // Group rooms by floor
    const floorGroups = {};
    
    Object.entries(roomCalcs).forEach(([key, calc]) => {
      console.log(`🔍 Processing room key: ${key}`, calc);
      
      const floorId = calc.floorId;
      const floor = floors.find(f => f.id === floorId);
      const floorName = floor?.name || calc.floorName || `Floor ${floorId}`;
      
      if (!floorGroups[floorId]) {
        floorGroups[floorId] = {
          floorId,
          floorName,
          rooms: []
        };
        console.log(`✅ Created new floor group: ${floorName}`);
      }
      
      const roomData = {
        key,
        roomId: calc.roomId,
        roomName: calc.roomName || `Room ${calc.roomId}`,
        heatLoadTR: calc.heatLoadData?.tonnage || 0,
        heatLoadCFM: calc.heatLoadData?.totalCfm || 0,
        area: calc.heatLoadData?.area || 0,
        sensibleHeat: calc.heatLoadData?.sensibleHeat || 0,
        latentHeat: calc.heatLoadData?.latentHeat || 0,
        // Equipment selection fields (will be filled by user)
        iduType: 'Ceiling Cassette 4-Way',
        machineCapacity: 0,
        numIDUs: 1,
        diversityFactor: 1.2,
        oduHP: 0,
        selectedODU: 0
      };
      
      floorGroups[floorId].rooms.push(roomData);
      console.log(`✅ Added room to floor ${floorName}:`, roomData);
    });

    // Convert to array and sort by floor
    const rows = Object.values(floorGroups).sort((a, b) => {
      return a.floorName.localeCompare(b.floorName);
    });

    console.log('✅ Generated equipment rows:', rows);
    console.log('📊 Total floors:', rows.length);
    rows.forEach(floor => {
      console.log(`📊 Floor ${floor.floorName}: ${floor.rooms.length} rooms`);
    });
    
    setEquipmentRows(rows);
  }, [spaceData]);

  // Auto-calculate equipment based on heat load
  const autoCalculateEquipment = (room) => {
    const heatLoad = room.heatLoadTR;
    
    // Select appropriate IDU capacity (round up to nearest standard size)
    const standardSizes = [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0];
    const machineCapacity = standardSizes.find(size => size >= heatLoad) || standardSizes[standardSizes.length - 1];
    
    // Calculate number of IDUs needed
    const numIDUs = Math.ceil(heatLoad / machineCapacity);
    
    // Calculate total IDU tonnage
    const totalIDUTonnage = machineCapacity * numIDUs;
    
    // Apply diversity factor
    const diversityFactor = 1.2; // Default 120%
    const oduCapacity = totalIDUTonnage / diversityFactor;
    
    // Select ODU HP (convert TR to HP: 1 TR ≈ 1.2 HP)
    const oduHP = Math.ceil(oduCapacity * 1.2);
    
    return {
      machineCapacity,
      numIDUs,
      totalIDUTonnage,
      diversityFactor,
      oduHP,
      selectedODU: oduHP
    };
  };

  // Update equipment for a specific room
  const updateRoomEquipment = (floorId, roomKey, field, value) => {
    setEquipmentRows(prevRows => {
      return prevRows.map(floor => {
        if (floor.floorId === floorId) {
          return {
            ...floor,
            rooms: floor.rooms.map(room => {
              if (room.key === roomKey) {
                const updated = { ...room, [field]: value };
                
                // Auto-recalculate if heat load or IDU type changes
                if (field === 'iduType' || field === 'machineCapacity') {
                  const autoCalc = autoCalculateEquipment(updated);
                  return { ...updated, ...autoCalc };
                }
                
                return updated;
              }
              return room;
            })
          };
        }
        return floor;
      });
    });
  };

  // Calculate floor totals
  const calculateFloorTotals = (floor) => {
    const totals = floor.rooms.reduce((acc, room) => {
      const autoCalc = autoCalculateEquipment(room);
      return {
        totalHeatLoadTR: acc.totalHeatLoadTR + room.heatLoadTR,
        totalHeatLoadCFM: acc.totalHeatLoadCFM + room.heatLoadCFM,
        totalIDUs: acc.totalIDUs + autoCalc.numIDUs,
        totalIDUTonnage: acc.totalIDUTonnage + autoCalc.totalIDUTonnage,
        totalODUHP: acc.totalODUHP + autoCalc.oduHP
      };
    }, {
      totalHeatLoadTR: 0,
      totalHeatLoadCFM: 0,
      totalIDUs: 0,
      totalIDUTonnage: 0,
      totalODUHP: 0
    });
    
    return totals;
  };

  // Calculate project totals
  const calculateProjectTotals = () => {
    return equipmentRows.reduce((acc, floor) => {
      const floorTotals = calculateFloorTotals(floor);
      return {
        totalHeatLoadTR: acc.totalHeatLoadTR + floorTotals.totalHeatLoadTR,
        totalHeatLoadCFM: acc.totalHeatLoadCFM + floorTotals.totalHeatLoadCFM,
        totalIDUs: acc.totalIDUs + floorTotals.totalIDUs,
        totalIDUTonnage: acc.totalIDUTonnage + floorTotals.totalIDUTonnage,
        totalODUHP: acc.totalODUHP + floorTotals.totalODUHP
      };
    }, {
      totalHeatLoadTR: 0,
      totalHeatLoadCFM: 0,
      totalIDUs: 0,
      totalIDUTonnage: 0,
      totalODUHP: 0
    });
  };

  const handleSave = () => {
    const equipmentData = {
      systemType,
      floors: equipmentRows,
      projectTotals: calculateProjectTotals(),
      savedAt: new Date().toISOString()
    };
    
    toast.success('Equipment selection saved successfully!');
    onSave(equipmentData);
  };

  const projectTotals = calculateProjectTotals();

  return (
    <div className="equipment-selection-table">
      <div className="table-header">
        <h2>🔧 Equipment Selection</h2>
        <p>Floor-wise equipment selection based on calculated heat loads</p>
        
        <div className="system-type-selector">
          <label>System Type:</label>
          <select value={systemType} onChange={(e) => setSystemType(e.target.value)}>
            <option value="VRF">VRF System</option>
            <option value="Split">Split AC System</option>
            <option value="Ducted">Ducted System</option>
            <option value="Chiller">Chiller System</option>
          </select>
        </div>
      </div>

      {/* Project Summary Cards */}
      <div className="project-summary-cards">
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#8b5cf6' }}>
            <i className="bi bi-thermometer-half"></i>
          </div>
          <div className="card-content">
            <span className="label">Total Heat Load</span>
            <span className="value">{projectTotals.totalHeatLoadTR.toFixed(2)} TR</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#3b82f6' }}>
            <i className="bi bi-wind"></i>
          </div>
          <div className="card-content">
            <span className="label">Total CFM</span>
            <span className="value">{projectTotals.totalHeatLoadCFM.toFixed(0)} CFM</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#10b981' }}>
            <i className="bi bi-box-seam"></i>
          </div>
          <div className="card-content">
            <span className="label">Total IDUs</span>
            <span className="value">{projectTotals.totalIDUs}</span>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#f59e0b' }}>
            <i className="bi bi-lightning-charge"></i>
          </div>
          <div className="card-content">
            <span className="label">Total ODU HP</span>
            <span className="value">{projectTotals.totalODUHP} HP</span>
          </div>
        </div>
      </div>

      {/* Main Equipment Table */}
      <div className="equipment-table-container">
        <table className="equipment-table">
          <thead>
            <tr className="main-header">
              <th rowSpan="3" className="floor-col">FLOOR</th>
              <th rowSpan="3" className="room-col">ROOM</th>
              <th rowSpan="3" className="area-col">AREA (M²)</th>
              <th colSpan="2" className="heat-load-section">HEAT LOAD (AS PER SHEET)</th>
              <th colSpan="5" className="idu-section">IDU SELECTION</th>
              <th colSpan="3" className="odu-section">ODU SELECTION</th>
            </tr>
            <tr className="sub-header">
              {/* Heat Load Section */}
              <th rowSpan="2" className="heat-load-tr">HEAT LOAD (TR)</th>
              <th rowSpan="2" className="heat-load-cfm">HEAT LOAD (CFM)</th>
              
              {/* IDU Section */}
              <th rowSpan="2" className="idu-type">IDU TYPE</th>
              <th rowSpan="2" className="machine-capacity">MACHINE CAPACITY (TR)</th>
              <th rowSpan="2" className="num-idus">NO. OF IDUs</th>
              <th colSpan="2" className="idu-tonnage-section">TOTAL IDU TONNAGE</th>
              
              {/* ODU Section */}
              <th rowSpan="2" className="total-cfm">TOTAL CFM</th>
              <th rowSpan="2" className="diversity">DIVERSITY (%)</th>
              <th rowSpan="2" className="odu-hp">ODU HP</th>
            </tr>
            <tr className="third-header">
              {/* IDU Tonnage Sub-columns */}
              <th className="tonnage">TONNAGE</th>
              <th className="max-cfm">MAX CFM</th>
            </tr>
          </thead>
          <tbody>
            {equipmentRows.map((floor, floorIndex) => {
              const floorTotals = calculateFloorTotals(floor);
              
              return (
                <React.Fragment key={floor.floorId}>
                  {/* Floor Rooms */}
                  {floor.rooms.map((room, roomIndex) => {
                    const autoCalc = autoCalculateEquipment(room);
                    
                    return (
                      <tr key={room.key} className="room-row">
                        {roomIndex === 0 && (
                          <td rowSpan={floor.rooms.length + 1} className="floor-name">
                            {floor.floorName}
                          </td>
                        )}
                        <td className="room-name">{room.roomName}</td>
                        <td className="area">{room.area.toFixed(1)}</td>
                        
                        {/* Heat Load Section */}
                        <td className="heat-load-tr">{room.heatLoadTR.toFixed(2)}</td>
                        <td className="heat-load-cfm">{room.heatLoadCFM.toFixed(0)}</td>
                        
                        {/* IDU Section */}
                        <td className="idu-type">
                          <select 
                            value={room.iduType}
                            onChange={(e) => updateRoomEquipment(floor.floorId, room.key, 'iduType', e.target.value)}
                            className="table-select"
                          >
                            <option>Wall Mounted</option>
                            <option>Ceiling Cassette 4-Way</option>
                            <option>Ceiling Cassette 1-Way</option>
                            <option>Ducted</option>
                            <option>Floor Standing</option>
                          </select>
                        </td>
                        <td className="machine-capacity">
                          <input
                            type="number"
                            value={autoCalc.machineCapacity.toFixed(2)}
                            onChange={(e) => updateRoomEquipment(floor.floorId, room.key, 'machineCapacity', parseFloat(e.target.value))}
                            className="table-input"
                            step="0.25"
                            min="0.5"
                          />
                        </td>
                        <td className="num-idus">
                          <input
                            type="number"
                            value={autoCalc.numIDUs}
                            onChange={(e) => updateRoomEquipment(floor.floorId, room.key, 'numIDUs', parseInt(e.target.value))}
                            className="table-input"
                            min="1"
                          />
                        </td>
                        <td className="tonnage">{autoCalc.totalIDUTonnage.toFixed(2)}</td>
                        <td className="max-cfm">{(autoCalc.totalIDUTonnage * 400).toFixed(0)}</td>
                        
                        {/* ODU Section */}
                        <td className="total-cfm">{room.heatLoadCFM.toFixed(0)}</td>
                        <td className="diversity">{((autoCalc.diversityFactor - 1) * 100).toFixed(0)}%</td>
                        <td className="odu-hp">{autoCalc.oduHP}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Floor Total Row */}
                  <tr className="floor-total-row">
                    <td className="total-label">TOTAL ({floor.floorName})</td>
                    <td className="total-value">{floor.rooms.reduce((sum, room) => sum + room.area, 0).toFixed(1)}</td>
                    <td className="total-value">{floorTotals.totalHeatLoadTR.toFixed(2)}</td>
                    <td className="total-value">{floorTotals.totalHeatLoadCFM.toFixed(0)}</td>
                    <td></td>
                    <td></td>
                    <td className="total-value">{floorTotals.totalIDUs}</td>
                    <td className="total-value">{floorTotals.totalIDUTonnage.toFixed(2)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="total-value">{floorTotals.totalODUHP} HP</td>
                  </tr>
                </React.Fragment>
              );
            })}
            
            {/* Project Total Row */}
            <tr className="project-total-row">
              <td colSpan="2" className="total-label">TOTAL</td>
              <td className="total-value">{equipmentRows.reduce((sum, floor) => sum + floor.rooms.reduce((s, room) => s + room.area, 0), 0).toFixed(1)}</td>
              <td className="total-value">{projectTotals.totalHeatLoadTR.toFixed(2)}</td>
              <td className="total-value">{projectTotals.totalHeatLoadCFM.toFixed(0)}</td>
              <td></td>
              <td></td>
              <td className="total-value">{projectTotals.totalIDUs}</td>
              <td className="total-value">{projectTotals.totalIDUTonnage.toFixed(2)}</td>
              <td></td>
              <td></td>
              <td></td>
              <td className="total-value">{projectTotals.totalODUHP} HP</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="table-actions">
        <button onClick={onBack} className="btn-secondary">
          <i className="bi bi-arrow-left"></i>
          Back to Heat Load Calculation
        </button>
        
        <button onClick={handleSave} className="btn-primary">
          <i className="bi bi-check-circle"></i>
          Save & Continue to Inventory
        </button>
      </div>
    </div>
  );
};

export default EquipmentSelectionTable;
