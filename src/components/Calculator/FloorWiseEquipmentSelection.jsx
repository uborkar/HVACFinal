import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import HVACDataService from '../../services/hvacDataService';
import toast from '../../utils/toast';
import EquipmentSelectionTable from './EquipmentSelectionTable';
import './FloorWiseEquipmentSelection.css';

/**
 * FloorWiseEquipmentSelection Component
 * Professional HVAC Equipment Selection based on calculated room loads
 * Supports VRF, Split, and Ducted systems with diversity factors
 */

// Equipment Database - Industry Standard Capacities
const EQUIPMENT_DATABASE = {
  IDU_TYPES: {
    'Wall Mounted': {
      capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
      cfmPerTon: 400,
      applications: ['Office', 'Residential', 'Retail'],
      mounting: 'Wall',
      minHeight: 7
    },
    'Ceiling Cassette 4-Way': {
      capacities: [1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0],
      cfmPerTon: 450,
      applications: ['Office', 'Retail', 'Restaurant', 'Hotel'],
      mounting: 'Ceiling',
      minHeight: 9
    },
    'Ceiling Cassette 1-Way': {
      capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
      cfmPerTon: 420,
      applications: ['Office', 'Retail', 'Corridor'],
      mounting: 'Ceiling',
      minHeight: 9
    },
    'Ducted': {
      capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0],
      cfmPerTon: 400,
      applications: ['Office', 'Hospital', 'School', 'Hotel'],
      mounting: 'Ceiling',
      minHeight: 10,
      requiresDuctwork: true
    },
    'Floor Standing': {
      capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
      cfmPerTon: 380,
      applications: ['Office', 'Retail', 'Residential'],
      mounting: 'Floor',
      minHeight: 0
    },
    'Ceiling Suspended': {
      capacities: [2.0, 2.5, 3.0, 4.0, 5.0, 6.0],
      cfmPerTon: 400,
      applications: ['Office', 'Retail', 'Restaurant'],
      mounting: 'Ceiling',
      minHeight: 9
    }
  },
  
  ODU_TYPES: {
    'VRF Heat Pump': {
      capacities: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32],
      hpPerTon: 1.2,
      maxConnections: 64,
      diversityFactor: 0.85,
      efficiency: 'High'
    },
    'VRF Heat Recovery': {
      capacities: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40],
      hpPerTon: 1.2,
      maxConnections: 64,
      diversityFactor: 0.80,
      efficiency: 'Very High',
      simultaneousCoolingHeating: true
    },
    'Multi Split': {
      capacities: [4, 5, 6, 8, 10, 12],
      hpPerTon: 1.3,
      maxConnections: 8,
      diversityFactor: 0.90,
      efficiency: 'Medium'
    },
    'Single Split': {
      capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
      hpPerTon: 1.3,
      maxConnections: 1,
      diversityFactor: 1.0,
      efficiency: 'Medium'
    }
  }
};

// Diversity Factors by Building Type (ASHRAE Standards)
const DIVERSITY_FACTORS = {
  'Office': 0.85,
  'Hospital': 0.90,
  'Hotel': 0.75,
  'Retail': 0.80,
  'School': 0.85,
  'Residential': 0.70,
  'Restaurant': 0.95,
  'Default': 0.85
};

const FloorWiseEquipmentSelection = ({ projectData, spaceData, onSave, onBack, savedData, projectId }) => {
  const { user } = useAuth();
  const [equipmentRows, setEquipmentRows] = useState([]);
  const [systemType, setSystemType] = useState('VRF Heat Pump');
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [projectSummary, setProjectSummary] = useState(null);
  const [useNewTable, setUseNewTable] = useState(false);

  /**
   * Auto-select equipment based on load and CFM requirements
   * Professional HVAC sizing logic
   */
  const autoSelectEquipment = useCallback((totalLoad, totalCFM, rooms) => {
    const buildingType = projectData?.meta?.buildingType || 'Office';
    const diversityFactor = DIVERSITY_FACTORS[buildingType] || DIVERSITY_FACTORS['Default'];
    const adjustedLoad = totalLoad * diversityFactor;
    
    // Select IDU type based on room types and ceiling height
    let iduType = 'Ceiling Cassette 4-Way'; // Default
    const hasLowCeiling = rooms.some(r => (r.height || 10) < 9);
    const hasDuctRequirement = rooms.length > 5;
    
    if (hasLowCeiling) {
      iduType = 'Wall Mounted';
    } else if (hasDuctRequirement) {
      iduType = 'Ducted';
    }
    
    const iduSpecs = EQUIPMENT_DATABASE.IDU_TYPES[iduType];
    
    // Select IDU capacity - find closest match
    const avgLoadPerRoom = totalLoad / rooms.length;
    const iduCapacity = iduSpecs.capacities.reduce((prev, curr) => 
      Math.abs(curr - avgLoadPerRoom) < Math.abs(prev - avgLoadPerRoom) ? curr : prev
    );
    
    // Calculate number of IDUs needed
    const noOfIDUs = Math.ceil(totalLoad / iduCapacity);
    const totalIDUTonnage = noOfIDUs * iduCapacity;
    
    // Calculate CFM
    const iduCFM = iduCapacity * iduSpecs.cfmPerTon;
    const totalIDUCFM = noOfIDUs * iduCFM;
    
    // ODU Selection
    const oduSpecs = EQUIPMENT_DATABASE.ODU_TYPES[systemType];
    const requiredODUCapacity = adjustedLoad;
    
    // Select ODU capacity - find next larger size
    const selectedODUCapacity = oduSpecs.capacities.find(cap => cap >= requiredODUCapacity) || 
                                Math.max(...oduSpecs.capacities);
    
    const oduHP = Math.ceil(selectedODUCapacity * oduSpecs.hpPerTon);
    
    return {
      iduType,
      iduCapacity,
      noOfIDUs,
      totalIDUTonnage: parseFloat(totalIDUTonnage.toFixed(2)),
      iduCFM,
      totalIDUCFM,
      diversityFactor,
      adjustedLoad: parseFloat(adjustedLoad.toFixed(2)),
      requiredODUCapacity: parseFloat(requiredODUCapacity.toFixed(2)),
      selectedODUCapacity,
      oduHP
    };
  }, [projectData, systemType]);

  /**
   * Generate equipment rows from room calculations
   * Groups rooms by floor for equipment selection
   */
  const generateEquipmentRows = useCallback(() => {
    const roomCalcs = spaceData.roomCalculations || {};
    const buildingData = spaceData.buildingData || {};
    const floors = buildingData.floors || [];
    
    console.log('🏗️ Generating equipment rows from room calculations:', roomCalcs);
    console.log('🏗️ Available room calculation keys:', Object.keys(roomCalcs));
    console.log('🏗️ Building data floors:', floors);
    
    const rows = [];
    
    // Group by floor - use roomCalculations directly for better data access
    const floorGroups = {};
    
    // First, group room calculations by floor
    Object.entries(roomCalcs).forEach(([roomKey, roomCalc]) => {
      if (roomCalc?.floorId && roomCalc?.heatLoadData) {
        if (!floorGroups[roomCalc.floorId]) {
          floorGroups[roomCalc.floorId] = {
            floorId: roomCalc.floorId,
            floorName: roomCalc.floorName || `Floor ${roomCalc.floorId}`,
            rooms: [],
            totals: {
              area: 0,
              load: 0,
              cfm: 0,
              count: 0
            }
          };
        }
        
        const group = floorGroups[roomCalc.floorId];
        group.rooms.push({
          roomKey,
          name: roomCalc.roomName || `Room ${roomCalc.roomId}`,
          type: roomCalc.roomType || 'General',
          calculated: true,
          load: parseFloat(roomCalc.heatLoadData.tonnage || 0),
          cfm: parseFloat(roomCalc.heatLoadData.totalCfm || 0),
          area: parseFloat(roomCalc.heatLoadData.area || 0)
        });
        
        // Add to totals
        group.totals.area += parseFloat(roomCalc.heatLoadData.area || 0);
        group.totals.load += parseFloat(roomCalc.heatLoadData.tonnage || 0);
        group.totals.cfm += parseFloat(roomCalc.heatLoadData.totalCfm || 0);
        group.totals.count++;
        
        console.log(`✅ Added room ${roomKey} to floor ${roomCalc.floorId}:`, {
          load: roomCalc.heatLoadData.tonnage,
          cfm: roomCalc.heatLoadData.totalCfm,
          area: roomCalc.heatLoadData.area
        });
      } else {
        console.log(`⚠️ Skipping room ${roomKey} - missing floorId or heatLoadData:`, roomCalc);
      }
    });
    
    console.log('📊 Floor groups created:', floorGroups);
    
    // Generate equipment rows for each floor group
    Object.values(floorGroups).forEach(floorGroup => {
      if (floorGroup.totals.count > 0) {
        // Auto-select equipment based on load
        const autoSelection = autoSelectEquipment(
          floorGroup.totals.load, 
          floorGroup.totals.cfm, 
          floorGroup.rooms
        );
        
        const equipmentRow = {
          id: floorGroup.floorId,
          floorName: floorGroup.floorName,
          roomCount: floorGroup.totals.count,
          area: floorGroup.totals.area,
          heatLoadTR: floorGroup.totals.load,
          heatLoadCFM: floorGroup.totals.cfm,
          
          // IDU Selection
          iduType: autoSelection.iduType,
          iduCapacity: autoSelection.iduCapacity,
          noOfIDUs: autoSelection.noOfIDUs,
          totalIDUTonnage: autoSelection.totalIDUTonnage,
          iduCFM: autoSelection.iduCFM,
          totalIDUCFM: autoSelection.totalIDUCFM,
          
          // Diversity
          diversityFactor: autoSelection.diversityFactor,
          adjustedLoad: autoSelection.adjustedLoad,
          
          // ODU Selection
          oduType: systemType,
          requiredODUCapacity: autoSelection.requiredODUCapacity,
          selectedODUCapacity: autoSelection.selectedODUCapacity,
          oduHP: autoSelection.oduHP,
          
          // Room details for reference
          rooms: floorGroup.rooms
        };
        
        rows.push(equipmentRow);
        
        console.log(`✅ Generated equipment row for ${floorGroup.floorName}:`, equipmentRow);
      }
    });
    
    console.log('✅ Final generated equipment rows:', rows);
    setEquipmentRows(rows);
  }, [spaceData, systemType, autoSelectEquipment]);

  /**
   * Calculate project-level summary
   */
  const calculateProjectSummary = useCallback(() => {
    const summary = {
      totalFloors: equipmentRows.length,
      totalRooms: equipmentRows.reduce((sum, row) => sum + (row.roomCount || 0), 0),
      totalArea: equipmentRows.reduce((sum, row) => sum + (row.area || 0), 0),
      totalHeatLoad: equipmentRows.reduce((sum, row) => sum + (row.heatLoadTR || 0), 0),
      totalCFM: equipmentRows.reduce((sum, row) => sum + (row.heatLoadCFM || 0), 0),
      totalIDUs: equipmentRows.reduce((sum, row) => sum + (row.noOfIDUs || 0), 0),
      totalIDUTonnage: equipmentRows.reduce((sum, row) => sum + (row.totalIDUTonnage || 0), 0),
      totalAdjustedLoad: equipmentRows.reduce((sum, row) => sum + (row.adjustedLoad || 0), 0),
      totalODUHP: equipmentRows.reduce((sum, row) => sum + (row.oduHP || 0), 0),
      averageDiversity: equipmentRows.length > 0 ? 
        equipmentRows.reduce((sum, row) => sum + (row.diversityFactor || 0), 0) / equipmentRows.length : 0
    };
    
    setProjectSummary(summary);
  }, [equipmentRows]);

  // Initialize equipment rows from space data
  useEffect(() => {
    if (savedData?.rows) {
      // Load saved equipment data
      console.log('💾 Loading saved equipment data:', savedData);
      setEquipmentRows(savedData.rows);
      setSystemType(savedData.systemType || 'VRF Heat Pump');
    } else if (spaceData?.roomCalculations && Object.keys(spaceData.roomCalculations).length > 0) {
      // Generate equipment rows from room calculations
      console.log('🔄 Generating equipment rows from room calculations');
      console.log('📊 Space data received:', spaceData);
      generateEquipmentRows();
    } else {
      console.log('⚠️ No room calculations available for equipment generation');
      console.log('📊 Available space data:', spaceData);
    }
  }, [spaceData, savedData, generateEquipmentRows]);

  // Calculate project summary
  useEffect(() => {
    calculateProjectSummary();
  }, [equipmentRows, calculateProjectSummary]);

  /**
   * Update equipment row field
   */
  const updateRow = (index, field, value) => {
    const newRows = [...equipmentRows];
    newRows[index] = {
      ...newRows[index],
      [field]: value
    };
    
    // Recalculate dependent fields
    if (field === 'iduCapacity' || field === 'noOfIDUs') {
      const iduCapacity = parseFloat(newRows[index].iduCapacity) || 0;
      const noOfIDUs = parseFloat(newRows[index].noOfIDUs) || 0;
      newRows[index].totalIDUTonnage = (iduCapacity * noOfIDUs).toFixed(2);
      
      const iduSpecs = EQUIPMENT_DATABASE.IDU_TYPES[newRows[index].iduType];
      if (iduSpecs) {
        newRows[index].iduCFM = iduCapacity * iduSpecs.cfmPerTon;
        newRows[index].totalIDUCFM = newRows[index].iduCFM * noOfIDUs;
      }
    }
    
    if (field === 'diversityFactor') {
      const heatLoadTR = parseFloat(newRows[index].heatLoadTR) || 0;
      const diversityFactor = parseFloat(value) || 0.85;
      newRows[index].adjustedLoad = (heatLoadTR * diversityFactor).toFixed(2);
      newRows[index].requiredODUCapacity = newRows[index].adjustedLoad;
    }
    
    if (field === 'selectedODUCapacity') {
      const oduSpecs = EQUIPMENT_DATABASE.ODU_TYPES[newRows[index].oduType];
      if (oduSpecs) {
        newRows[index].oduHP = Math.ceil(parseFloat(value) * oduSpecs.hpPerTon);
      }
    }
    
    setEquipmentRows(newRows);
  };

  /**
   * Save equipment selection
   */
  const handleSave = async () => {
    // Validation
    if (equipmentRows.length === 0) {
      alert('⚠️ No equipment rows to save. Please complete space calculations first.');
      return;
    }
    
    const hasIncompleteRows = equipmentRows.some(row => 
      !row.iduType || !row.iduCapacity || !row.noOfIDUs || !row.oduType
    );
    
    if (hasIncompleteRows) {
      alert('⚠️ Please complete all equipment selections before saving.');
      return;
    }
    
    const equipmentData = {
      systemType,
      rows: equipmentRows,
      projectSummary,
      savedAt: new Date().toISOString()
    };
    
    console.log('💾 Saving equipment data:', equipmentData);
    
    // Save to Firebase
    if (user && projectId) {
      try {
        await HVACDataService.saveProjectData(projectId, {
          equipmentData,
          currentStep: 3
        }, user?.uid);
        
        console.log('✅ Equipment data saved successfully');
        
        toast.success(
          `Equipment Selection Saved! ${systemType} | ` +
          `${projectSummary.totalIDUs} IDUs | ` +
          `${projectSummary.totalIDUTonnage.toFixed(2)} TR | ` +
          `${projectSummary.totalODUHP} HP`
        );
        
        if (onSave) {
          onSave(equipmentData);
        }
      } catch (error) {
        console.error('❌ Error saving equipment data:', error);
        toast.error('Error saving equipment data. Please try again.');
      }
    } else {
      if (onSave) {
        onSave(equipmentData);
      }
    }
  };

  /**
   * Regenerate equipment selection with new system type
   */
  const handleSystemTypeChange = (newSystemType) => {
    setSystemType(newSystemType);
    if (autoCalculate) {
      generateEquipmentRows();
    }
  };

  return (
    <div className="equipment-selection-container">
      {/* Header */}
      <div className="equipment-header">
        <div className="header-content">
          <h2>🏭 Equipment Selection</h2>
          <p>Select HVAC equipment based on calculated heat loads</p>
        </div>
        
        <div className="system-type-selector">
          <label>System Type:</label>
          <select 
            value={systemType} 
            onChange={(e) => handleSystemTypeChange(e.target.value)}
            className="system-select"
          >
            <option value="VRF Heat Pump">VRF Heat Pump</option>
            <option value="VRF Heat Recovery">VRF Heat Recovery</option>
            <option value="Multi Split">Multi Split</option>
            <option value="Single Split">Single Split</option>
          </select>
          
          <label className="auto-calc-toggle">
            <input 
              type="checkbox" 
              checked={autoCalculate}
              onChange={(e) => setAutoCalculate(e.target.checked)}
            />
            Auto Calculate
          </label>
          
          <label className="table-view-toggle">
            <input 
              type="checkbox" 
              checked={useNewTable}
              onChange={(e) => setUseNewTable(e.target.checked)}
            />
            New Table View
          </label>
        </div>
      </div>

      {/* Project Summary */}
      {projectSummary && (
        <div className="project-summary-equipment">
          <h3>📊 Project Summary</h3>
          <div className="summary-grid-equipment">
            <div className="summary-card-eq">
              <label>Total Heat Load</label>
              <span className="value">{projectSummary.totalHeatLoad.toFixed(2)} TR</span>
            </div>
            <div className="summary-card-eq">
              <label>Adjusted Load (with Diversity)</label>
              <span className="value">{projectSummary.totalAdjustedLoad.toFixed(2)} TR</span>
            </div>
            <div className="summary-card-eq">
              <label>Total IDUs</label>
              <span className="value">{projectSummary.totalIDUs} Units</span>
            </div>
            <div className="summary-card-eq">
              <label>Total IDU Capacity</label>
              <span className="value">{projectSummary.totalIDUTonnage.toFixed(2)} TR</span>
            </div>
            <div className="summary-card-eq">
              <label>Total CFM</label>
              <span className="value">{projectSummary.totalCFM.toLocaleString()}</span>
            </div>
            <div className="summary-card-eq">
              <label>Total ODU HP</label>
              <span className="value">{projectSummary.totalODUHP} HP</span>
            </div>
          </div>
        </div>
      )}

      {/* Conditional Table Rendering */}
      {useNewTable ? (
        <EquipmentSelectionTable 
          spaceData={spaceData}
          onSave={onSave}
          onBack={onBack}
          projectId={projectId}
        />
      ) : (
        /* Original Equipment Selection Table */
        <div className="equipment-table-container">
        <table className="equipment-table">
          <thead>
            <tr className="main-header">
              <th rowSpan="2">Floor</th>
              <th rowSpan="2">Rooms</th>
              <th rowSpan="2">Area (ft²)</th>
              <th colSpan="2">Heat Load</th>
              <th colSpan="6">IDU Selection</th>
              <th colSpan="5">ODU Selection</th>
            </tr>
            <tr className="sub-header">
              <th>TR</th>
              <th>CFM</th>
              <th>Type</th>
              <th>Capacity (TR)</th>
              <th>Qty</th>
              <th>Total TR</th>
              <th>CFM/Unit</th>
              <th>Total CFM</th>
              <th>Diversity %</th>
              <th>Adjusted Load</th>
              <th>Type</th>
              <th>Required Cap.</th>
              <th>Selected Cap.</th>
              <th>HP</th>
            </tr>
          </thead>
          <tbody>
            {equipmentRows.map((row, index) => (
              <tr key={row.id}>
                <td className="floor-name">{row.floorName}</td>
                <td className="room-count">{row.roomCount}</td>
                <td className="area">{row.area.toFixed(0)}</td>
                <td className="load-tr">{row.heatLoadTR.toFixed(2)}</td>
                <td className="load-cfm">{row.heatLoadCFM.toFixed(0)}</td>
                
                {/* IDU Selection */}
                <td>
                  <select 
                    value={row.iduType}
                    onChange={(e) => updateRow(index, 'iduType', e.target.value)}
                    className="idu-type-select"
                  >
                    {Object.keys(EQUIPMENT_DATABASE.IDU_TYPES).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={row.iduCapacity}
                    onChange={(e) => updateRow(index, 'iduCapacity', e.target.value)}
                    className="capacity-select"
                  >
                    {EQUIPMENT_DATABASE.IDU_TYPES[row.iduType]?.capacities.map(cap => (
                      <option key={cap} value={cap}>{cap}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={row.noOfIDUs}
                    onChange={(e) => updateRow(index, 'noOfIDUs', e.target.value)}
                    className="qty-input"
                    min="1"
                  />
                </td>
                <td className="total-tonnage">{row.totalIDUTonnage}</td>
                <td className="cfm-unit">{row.iduCFM}</td>
                <td className="total-cfm">{row.totalIDUCFM}</td>
                
                {/* Diversity */}
                <td>
                  <input
                    type="number"
                    value={(row.diversityFactor * 100).toFixed(0)}
                    onChange={(e) => updateRow(index, 'diversityFactor', parseFloat(e.target.value) / 100)}
                    className="diversity-input"
                    min="50"
                    max="100"
                    step="5"
                  />
                </td>
                <td className="adjusted-load">{row.adjustedLoad}</td>
                
                {/* ODU Selection */}
                <td className="odu-type">{row.oduType}</td>
                <td className="required-cap">{row.requiredODUCapacity}</td>
                <td>
                  <select
                    value={row.selectedODUCapacity}
                    onChange={(e) => updateRow(index, 'selectedODUCapacity', e.target.value)}
                    className="odu-capacity-select"
                  >
                    {EQUIPMENT_DATABASE.ODU_TYPES[row.oduType]?.capacities.map(cap => (
                      <option key={cap} value={cap}>{cap} TR</option>
                    ))}
                  </select>
                </td>
                <td className="odu-hp">{row.oduHP}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan="3"><strong>TOTALS</strong></td>
              <td><strong>{projectSummary?.totalHeatLoad.toFixed(2)}</strong></td>
              <td><strong>{projectSummary?.totalCFM.toFixed(0)}</strong></td>
              <td colSpan="2"></td>
              <td><strong>{projectSummary?.totalIDUs}</strong></td>
              <td><strong>{projectSummary?.totalIDUTonnage.toFixed(2)}</strong></td>
              <td colSpan="3"></td>
              <td><strong>{projectSummary?.totalAdjustedLoad.toFixed(2)}</strong></td>
              <td colSpan="3"></td>
              <td><strong>{projectSummary?.totalODUHP}</strong></td>
            </tr>
          </tfoot>
        </table>
        </div>
      )}

      {/* Action Buttons - Only show when using original table */}
      {!useNewTable && (
      <div className="form-actions-equipment">
        <button type="button" className="btn-back" onClick={onBack}>
          ← Back to Heat Load Calculation
        </button>
        
        {autoCalculate && (
          <button 
            type="button" 
            className="btn-regenerate"
            onClick={generateEquipmentRows}
          >
            🔄 Regenerate Equipment Selection
          </button>
        )}
        
        <button 
          type="button" 
          className="btn-save-equipment"
          onClick={handleSave}
        >
          💾 Save & Continue to Inventory →
        </button>
      </div>
      )}
    </div>
  );
};

export default FloorWiseEquipmentSelection;
