import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import HVACDataService from '../../services/hvacDataService';
import toast from '../../utils/toast';
import './HVACEquipmentSpreadsheet.css';

/**
 * Excel-like HVAC Equipment Selection Spreadsheet
 * Room-by-room equipment selection with floor grouping
 */

// ODU (Outdoor Unit) Types and Capacities
const ODU_TYPES = [
  {
    key: 'combined',
    name: 'Combined',
    capacities: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26]
  },
  {
    key: 'topDischarge',
    name: 'Top Discharge',
    capacities: [8, 10, 12, 14, 16, 18, 20, 22, 24, 26]
  },
  {
    key: 'sideDischarge',
    name: 'Side Discharge',
    capacities: [5, 6, 8, 10, 12, 14]
  }
];

// IDU (Indoor Unit) Types and Capacities
const EQUIPMENT_TYPES = [
  { 
    key: 'wallMounted', 
    name: 'Wall Mounted', 
    icon: '🔲', 
    image: '📱',
    capacities: [0.8, 1.0, 1.3, 1.5, 2.0, 2.5, 3.0]
  },
  { 
    key: 'roundCST', 
    name: 'Round CST', 
    icon: '⭕', 
    image: '🔘',
    capacities: [2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 13.0, 15.0, 20.0, 25.0, 30.0, 35.0, 40.0, 45.0, 50.0, 55.0, 60.0, 70.0]
  },
  { 
    key: 'cassette4Way2x2', 
    name: '4 Way Cassette 2x2', 
    icon: '➕', 
    image: '⊞',
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0]
  },
  { 
    key: 'cassette4Way3x3', 
    name: '4 Way Cassette 3x3', 
    icon: '⊞', 
    image: '⊠',
    capacities: [2.0, 2.5, 3.0, 4.0, 5.0, 7.5, 10.0]
  },
  { 
    key: 'cassette2Way', 
    name: '2 Way Cassette', 
    icon: '➡️', 
    image: '▶️',
    capacities: [0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0]
  },
  { 
    key: 'cassette1Way', 
    name: '1Way Cassette', 
    icon: '↗️', 
    image: '▷',
    capacities: [0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 7.0, 8.0]
  },
  { 
    key: 'lowStaticDuct', 
    name: 'Low Static Duct', 
    icon: '🌬️', 
    image: '▬',
    capacities: [3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0, 40.0, 45.0, 50.0, 60.0, 80.0]
  },
  { 
    key: 'highStaticDuct', 
    name: 'High Static Duct', 
    icon: '💨', 
    image: '▰',
    capacities: [3.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 15.0, 20.0, 25.0, 30.0, 40.0, 45.0, 50.0, 60.0, 80.0]
  },
  { 
    key: 'flrs', 
    name: 'FLRS', 
    icon: '🏢', 
    image: '⬛',
    capacities: [8.0]
  }
];

// Accessories List
const ACCESSORIES_LIST = [
  { name: 'Wired Remotes', defaultQty: 0 },
  { name: 'Wireless Remotes', defaultQty: 0 },
  { name: 'Refnets', defaultQty: 0 },
  { name: 'CRC', defaultQty: 0 },
  { name: 'Split AC 1TR', defaultQty: 0 },
  { name: 'Split AC 1.5TR', defaultQty: 0 },
  { name: 'Split AC 2TR', defaultQty: 0 },
  { name: 'Extra Gas', defaultQty: 0 },
  { name: 'Copper Piping', defaultQty: 0 },
  { name: 'Drain Piping', defaultQty: 0 },
  { name: 'Comm. Cable', defaultQty: 0 },
  { name: 'Ducting - 22G', defaultQty: 0 },
  { name: 'Ducting - 24G', defaultQty: 0 },
  { name: 'Thermal Insulation', defaultQty: 0 },
  { name: 'Accoustic Insulation', defaultQty: 0 }
];

const HVACEquipmentSpreadsheet = ({ spaceData, designData, onSave, onBack, savedData, projectId }) => {
  const { user } = useAuth();
  const [spreadsheetData, setSpreadsheetData] = useState({});
  const [totals, setTotals] = useState({});
  const [selectedACTypes, setSelectedACTypes] = useState({});
  const [showAllTypes, setShowAllTypes] = useState(true);
  const [masterACType, setMasterACType] = useState('all');
  const [accessories, setAccessories] = useState(
    ACCESSORIES_LIST.map(item => ({ ...item, quantity: item.defaultQty }))
  );

  // Initialize spreadsheet data from space data
  useEffect(() => {
    console.log('🔍 Initializing spreadsheet with:', { spaceData, savedData });
    console.log('🔍 spaceData exists:', !!spaceData);
    console.log('🔍 spaceData.buildingData exists:', !!spaceData?.buildingData);
    console.log('🔍 spaceData.buildingData.floors exists:', !!spaceData?.buildingData?.floors);
    console.log('🔍 Full spaceData structure:', JSON.stringify(spaceData, null, 2));
    initializeSpreadsheet();
    
    // Load saved accessories if available
    if (savedData?.accessories) {
      console.log('📋 Loading saved accessories data');
      setAccessories(savedData.accessories);
    }
    
    // Initialize selected AC types - all selected by default
    const initialACTypes = {};
    EQUIPMENT_TYPES.forEach(type => {
      initialACTypes[type.key] = true;
    });
    setSelectedACTypes(initialACTypes);
  }, [spaceData, savedData]);

  // Calculate totals whenever data changes
  useEffect(() => {
    calculateTotals();
  }, [spreadsheetData]);

  // Auto-save data when spreadsheetData changes (with debounce)
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (Object.keys(spreadsheetData).length > 0 && user && projectId) {
        const equipmentData = {
          spreadsheetData,
          totals,
          equipmentTypes: EQUIPMENT_TYPES,
          accessories,
          savedAt: new Date().toISOString()
        };

        console.log('🔄 Auto-saving equipment data...');
        
        HVACDataService.saveProjectData(projectId, {
          equipmentData: equipmentData,
          inventoryData: equipmentData,
          currentStep: 4
        }, user?.uid).then(() => {
          console.log('✅ Auto-save completed');
        }).catch(error => {
          console.error('❌ Auto-save failed:', error);
        });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [spreadsheetData, totals, accessories, user, projectId]);

  const initializeSpreadsheet = () => {
    console.log('🔍 Initializing with savedData:', savedData);
    console.log('🔍 Initializing with spaceData:', spaceData);
    
    const floors = spaceData?.buildingData?.floors || [];
    const roomCalculations = spaceData?.roomCalculations || {};
    const currentRoomCount = Object.keys(roomCalculations).length;
    
    // Check if saved data has the same number of rooms
    let savedRoomCount = 0;
    if (savedData?.spreadsheetData) {
      Object.values(savedData.spreadsheetData).forEach(floor => {
        savedRoomCount += Object.keys(floor.rooms || {}).length;
      });
    }
    
    console.log(`🔍 Current room count: ${currentRoomCount}, Saved room count: ${savedRoomCount}`);
    
    // Use saved spreadsheet data only if room count matches
    if (savedData?.spreadsheetData && savedRoomCount === currentRoomCount && currentRoomCount > 0) {
      console.log('📋 Using saved spreadsheet data (room count matches)');
      setSpreadsheetData(savedData.spreadsheetData);
      return;
    } else if (savedData?.spreadsheetData) {
      console.log('⚠️ Regenerating spreadsheet data (room count mismatch or new rooms added)');
    }
    
    console.log('🔍 Floors data:', floors);
    console.log('🔍 Floors length:', floors.length);
    console.log('🔍 Room calculations:', roomCalculations);
    console.log('🔍 Room calculations keys:', Object.keys(roomCalculations));
    
    // If no real data, set empty
    if (!spaceData || floors.length === 0) {
      console.log('❌ No space data available, setting empty');
      setSpreadsheetData({});
      return;
    }
    
    const initialData = {};

    // Build rooms from roomCalculations since floors don't have rooms array
    Object.entries(roomCalculations).forEach(([roomKey, calculation]) => {
      console.log(`🔍 Processing room calculation: ${roomKey}`, calculation);
      
      const floorId = calculation.floorId;
      const roomId = calculation.roomId;
      const roomName = calculation.roomName;
      
      console.log(`🏢 Room belongs to floor: ${floorId}`);
      
      // Create floor entry if it doesn't exist
      if (!initialData[floorId]) {
        const floor = floors.find(f => f.id === floorId);
        console.log(`✅ Creating floor entry for: ${floor?.name || floorId}`);
        initialData[floorId] = {
          floorName: floor?.name || floorId,
          rooms: {}
        };
      }
      
      // Create room entry
      console.log(`🔍 Creating room entry: ${roomName} (${roomId})`);
      initialData[floorId].rooms[roomId] = {
        roomName: roomName,
        roomType: calculation.roomType || 'General',
        area: calculation.heatLoadData?.area || calculation.area || 0,
        tonnage: calculation.heatLoadData?.tonnage || calculation.tons || 0,
        iduCount: calculation.heatLoadData?.tonnage ? Math.ceil(calculation.heatLoadData.tonnage) : 0,
        selectedACType: '',
        acQuantity: 0,
        selectedCapacity: '',
        diversityFactor: 1.2,
        combinedHP: '',
        combinedQty: 0,
        topDischargeHP: '',
        topDischargeQty: 0,
        sideDischargeHP: '',
        sideDischargeQty: 0
      };
      
      console.log(`✅ Created room entry for: ${roomName}`);
    });

    console.log('📊 Initialized spreadsheet data:', initialData);
    console.log('📊 Number of floors in initialData:', Object.keys(initialData).length);
    setSpreadsheetData(initialData);
    
    // Debug the final state
    setTimeout(() => {
      console.log('📊 Final spreadsheetData state:', initialData);
      console.log('📊 Should show table:', Object.keys(initialData).length > 0);
    }, 100);
  };

  const calculateTotals = () => {
    const floorTotals = {};
    let grandTotal = {
      area: 0,
      tonnage: 0,
      iduCount: 0,
      totalACUnits: 0,
      totalIDUHP: 0,
      totalODUCapacity: 0,
      totalCombinedODU: 0,
      totalTopDischargeODU: 0,
      totalSideDischargeODU: 0
    };

    Object.entries(spreadsheetData).forEach(([floorId, floorData]) => {
      floorTotals[floorId] = {
        area: 0,
        tonnage: 0,
        iduCount: 0,
        totalACUnits: 0,
        totalIDUHP: 0,
        totalODUCapacity: 0,
        totalCombinedODU: 0,
        totalTopDischargeODU: 0,
        totalSideDischargeODU: 0
      };

      Object.values(floorData.rooms || {}).forEach(room => {
        floorTotals[floorId].area += room.area || 0;
        floorTotals[floorId].tonnage += room.tonnage || 0;
        floorTotals[floorId].iduCount += room.iduCount || 0;
        floorTotals[floorId].totalACUnits += room.acQuantity || 0;
        floorTotals[floorId].totalCombinedODU += room.combinedQty || 0;
        floorTotals[floorId].totalTopDischargeODU += room.topDischargeQty || 0;
        floorTotals[floorId].totalSideDischargeODU += room.sideDischargeQty || 0;
        
        // Calculate IDU HP and ODU Capacity
        if (room.selectedCapacity && room.acQuantity) {
          const iduHP = (parseFloat(room.selectedCapacity) * parseInt(room.acQuantity)) * 1.2;
          floorTotals[floorId].totalIDUHP += iduHP;
          
          if (room.diversityFactor) {
            const oduCapacity = iduHP / parseFloat(room.diversityFactor);
            floorTotals[floorId].totalODUCapacity += oduCapacity;
          }
        }
      });

      // Add to grand total
      grandTotal.area += floorTotals[floorId].area;
      grandTotal.tonnage += floorTotals[floorId].tonnage;
      grandTotal.iduCount += floorTotals[floorId].iduCount;
      grandTotal.totalACUnits += floorTotals[floorId].totalACUnits;
      grandTotal.totalIDUHP += floorTotals[floorId].totalIDUHP;
      grandTotal.totalODUCapacity += floorTotals[floorId].totalODUCapacity;
      grandTotal.totalCombinedODU += floorTotals[floorId].totalCombinedODU;
      grandTotal.totalTopDischargeODU += floorTotals[floorId].totalTopDischargeODU;
      grandTotal.totalSideDischargeODU += floorTotals[floorId].totalSideDischargeODU;
    });

    setTotals({ floorTotals, grandTotal });
  };

  const updateRoomData = (floorId, roomId, field, value) => {
    setSpreadsheetData(prev => {
      const updated = { ...prev };
      
      if (!updated[floorId]?.rooms?.[roomId]) return prev;

      // Fields that should remain as strings
      const stringFields = ['selectedACType', 'selectedCapacity', 'combinedHP', 'topDischargeHP', 'sideDischargeHP'];
      
      let processedValue;
      if (stringFields.includes(field)) {
        processedValue = value; // Keep as string
      } else {
        processedValue = parseFloat(value) || 0; // Convert to number
      }
      
      if (field.startsWith('equipment.')) {
        const equipmentKey = field.split('.')[1];
        updated[floorId].rooms[roomId].equipment[equipmentKey] = processedValue;
      } else {
        updated[floorId].rooms[roomId][field] = processedValue;
      }

      // Auto-calculate IDU count based on tonnage if tonnage changes
      if (field === 'tonnage') {
        updated[floorId].rooms[roomId].iduCount = Math.ceil(parseFloat(value) || 0);
      }

      // Clear capacity when AC type changes
      if (field === 'selectedACType') {
        updated[floorId].rooms[roomId].selectedCapacity = '';
      }

      console.log(`🔄 Updated ${field} for ${roomId}:`, processedValue);
      console.log('🔄 Updated room data:', updated[floorId].rooms[roomId]);
      return updated;
    });
  };

  const handleSave = async () => {
    const equipmentData = {
      spreadsheetData,
      totals,
      equipmentTypes: EQUIPMENT_TYPES,
      accessories,
      savedAt: new Date().toISOString()
    };

    console.log('💾 Saving equipment spreadsheet data:', equipmentData);

    // Save to Firebase
    if (user && projectId) {
      try {
        await HVACDataService.saveProjectData(projectId, {
          equipmentData: equipmentData,
          inventoryData: equipmentData, // Keep both for compatibility
          currentStep: 4
        }, user?.uid);

        console.log('✅ Equipment spreadsheet data saved successfully');
        
        toast.success(
          `Equipment Selection Saved! Total: ${totals.grandTotal?.tonnage?.toFixed(2) || 0} TR | ` +
          `${totals.grandTotal?.iduCount || 0} IDUs`
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

  // Remove equipment icons row - no longer needed

  const handleACTypeSelection = (typeKey, isSelected) => {
    setSelectedACTypes(prev => ({
      ...prev,
      [typeKey]: isSelected
    }));
  };

  const toggleShowAllTypes = () => {
    const newShowAll = !showAllTypes;
    setShowAllTypes(newShowAll);
    
    if (newShowAll) {
      // Show all types
      const allSelected = {};
      EQUIPMENT_TYPES.forEach(type => {
        allSelected[type.key] = true;
      });
      setSelectedACTypes(allSelected);
    } else {
      // Hide all types
      const noneSelected = {};
      EQUIPMENT_TYPES.forEach(type => {
        noneSelected[type.key] = false;
      });
      setSelectedACTypes(noneSelected);
    }
  };

  const getVisibleEquipmentTypes = () => {
    return EQUIPMENT_TYPES.filter(type => selectedACTypes[type.key]);
  };

  const handleMasterACTypeChange = (selectedType) => {
    setMasterACType(selectedType);
    
    if (selectedType === 'all') {
      // Show all types
      const allSelected = {};
      EQUIPMENT_TYPES.forEach(type => {
        allSelected[type.key] = true;
      });
      setSelectedACTypes(allSelected);
      setShowAllTypes(true);
    } else {
      // Show only selected type
      const onlySelected = {};
      EQUIPMENT_TYPES.forEach(type => {
        onlySelected[type.key] = type.key === selectedType;
      });
      setSelectedACTypes(onlySelected);
      setShowAllTypes(false);
    }
  };

  const renderHeaderRow = () => (
    <tr className="header-row">
      <th className="floor-col">Floor</th>
      <th className="area-col">Area<br/>(Sq Ft)</th>
      <th className="ton-col">Ton</th>
      <th className="idu-col">No. of<br/>IDUs</th>
      <th className="ac-type-col">IDU Type</th>
      <th className="capacity-col">IDU Capacity<br/>(TR)</th>
      <th className="quantity-col">IDU Qty</th>
      <th className="total-col">Total<br/>Tonnage</th>
      <th className="idu-hp-col">IDU HP</th>
      <th className="diversity-col">Diversity</th>
      <th className="odu-capacity-col">ODU<br/>Capacity</th>
      <th className="combined-col">Combined<br/>(HP/Qty)</th>
      <th className="top-discharge-col">Top Discharge<br/>(HP/Qty)</th>
      <th className="side-discharge-col">Side Discharge<br/>(HP/Qty)</th>
    </tr>
  );

  const renderFloorSection = (floorId, floorData) => {
    const rooms = Object.entries(floorData.rooms || {});
    const floorTotal = totals.floorTotals?.[floorId];

    return (
      <React.Fragment key={floorId}>
        {/* Floor Header */}
        <tr className="floor-header-row">
          <td className="floor-name" colSpan="14">
            <strong>{floorData.floorName}</strong>
          </td>
        </tr>

        {/* Room Rows */}
        {rooms.map(([roomId, roomData]) => (
          <tr key={`${floorId}_${roomId}`} className="room-row">
            <td className="room-name">{roomData.roomName}</td>
            <td className="area-cell">
              <input
                type="number"
                value={roomData.area || 0}
                onChange={(e) => updateRoomData(floorId, roomId, 'area', e.target.value)}
                className="area-input"
                step="0.1"
                min="0"
              />
            </td>
            <td className="tonnage-cell">
              <input
                type="number"
                value={roomData.tonnage || 0}
                onChange={(e) => updateRoomData(floorId, roomId, 'tonnage', e.target.value)}
                className="tonnage-input"
                step="0.1"
                min="0"
              />
            </td>
            <td className="idu-cell">
              <input
                type="number"
                value={roomData.iduCount || 0}
                onChange={(e) => updateRoomData(floorId, roomId, 'iduCount', e.target.value)}
                className="idu-input"
                min="0"
              />
            </td>
            <td className="ac-type-cell">
              <select
                value={roomData.selectedACType || ''}
                onChange={(e) => updateRoomData(floorId, roomId, 'selectedACType', e.target.value)}
                className="ac-type-select"
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '3px'
                }}
              >
                <option value="">Select AC Type</option>
                {EQUIPMENT_TYPES.map(type => (
                  <option key={type.key} value={type.key}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </td>
            <td className="capacity-cell">
              <select
                value={roomData.selectedCapacity || ''}
                onChange={(e) => updateRoomData(floorId, roomId, 'selectedCapacity', e.target.value)}
                className="capacity-select"
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '3px'
                }}
                disabled={!roomData.selectedACType}
              >
                <option value="">Select TR</option>
                {roomData.selectedACType && EQUIPMENT_TYPES.find(t => t.key === roomData.selectedACType)?.capacities.map(capacity => (
                  <option key={capacity} value={capacity}>
                    {capacity} TR
                  </option>
                ))}
              </select>
            </td>
            <td className="quantity-cell">
              <input
                type="number"
                value={roomData.acQuantity || 0}
                onChange={(e) => updateRoomData(floorId, roomId, 'acQuantity', e.target.value)}
                className="quantity-input"
                min="0"
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}
              />
            </td>
            
            {/* Total Tonnage */}
            <td className="room-total">
              {roomData.tonnage?.toFixed(2) || '0.00'}
            </td>
            
            {/* IDU HP Calculation */}
            <td className="idu-hp-cell" style={{
              backgroundColor: '#ffff99',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {roomData.selectedCapacity && roomData.acQuantity ? 
                ((parseFloat(roomData.selectedCapacity) * parseInt(roomData.acQuantity)) * 1.2).toFixed(1) : 
                '#DIV/0!'
              }
            </td>
            
            {/* Diversity Factor */}
            <td className="diversity-cell">
              <input
                type="number"
                value={roomData.diversityFactor || 1.2}
                onChange={(e) => updateRoomData(floorId, roomId, 'diversityFactor', e.target.value)}
                step="0.1"
                min="0.1"
                max="2.0"
                style={{
                  width: '100%',
                  padding: '4px',
                  fontSize: '11px',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                  textAlign: 'center'
                }}
              />
            </td>
            
            {/* ODU Capacity Calculation */}
            <td className="odu-capacity-calc-cell" style={{
              backgroundColor: '#ffff99',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {roomData.selectedCapacity && roomData.acQuantity && roomData.diversityFactor ? 
                (((parseFloat(roomData.selectedCapacity) * parseInt(roomData.acQuantity)) * 1.2) / parseFloat(roomData.diversityFactor)).toFixed(1) : 
                '#DIV/0!'
              }
            </td>
            
            {/* Combined ODU */}
            <td className="combined-odu-cell">
              <div style={{ display: 'flex', gap: '2px' }}>
                <select
                  value={roomData.combinedHP || ''}
                  onChange={(e) => updateRoomData(floorId, roomId, 'combinedHP', e.target.value)}
                  style={{
                    width: '60%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px'
                  }}
                >
                  <option value="">HP</option>
                  {ODU_TYPES.find(t => t.key === 'combined')?.capacities.map(capacity => (
                    <option key={capacity} value={capacity}>
                      {capacity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={roomData.combinedQty || 0}
                  onChange={(e) => updateRoomData(floorId, roomId, 'combinedQty', e.target.value)}
                  min="0"
                  placeholder="Qty"
                  style={{
                    width: '40%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </td>
            
            {/* Top Discharge ODU */}
            <td className="top-discharge-odu-cell">
              <div style={{ display: 'flex', gap: '2px' }}>
                <select
                  value={roomData.topDischargeHP || ''}
                  onChange={(e) => updateRoomData(floorId, roomId, 'topDischargeHP', e.target.value)}
                  style={{
                    width: '60%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px'
                  }}
                >
                  <option value="">HP</option>
                  {ODU_TYPES.find(t => t.key === 'topDischarge')?.capacities.map(capacity => (
                    <option key={capacity} value={capacity}>
                      {capacity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={roomData.topDischargeQty || 0}
                  onChange={(e) => updateRoomData(floorId, roomId, 'topDischargeQty', e.target.value)}
                  min="0"
                  placeholder="Qty"
                  style={{
                    width: '40%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </td>
            
            {/* Side Discharge ODU */}
            <td className="side-discharge-odu-cell">
              <div style={{ display: 'flex', gap: '2px' }}>
                <select
                  value={roomData.sideDischargeHP || ''}
                  onChange={(e) => updateRoomData(floorId, roomId, 'sideDischargeHP', e.target.value)}
                  style={{
                    width: '60%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px'
                  }}
                >
                  <option value="">HP</option>
                  {ODU_TYPES.find(t => t.key === 'sideDischarge')?.capacities.map(capacity => (
                    <option key={capacity} value={capacity}>
                      {capacity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={roomData.sideDischargeQty || 0}
                  onChange={(e) => updateRoomData(floorId, roomId, 'sideDischargeQty', e.target.value)}
                  min="0"
                  placeholder="Qty"
                  style={{
                    width: '40%',
                    padding: '2px',
                    fontSize: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </td>
          </tr>
        ))}

        {/* Floor Total Row */}
        <tr className="floor-total-row">
          <td className="total-label"><strong>Total</strong></td>
          <td className="total-value"><strong>{floorTotal?.area?.toFixed(1) || '0.0'}</strong></td>
          <td className="total-value"><strong>{floorTotal?.tonnage?.toFixed(2) || '0.00'}</strong></td>
          <td className="total-value"><strong>{floorTotal?.iduCount || 0}</strong></td>
          <td className="total-value"><strong>-</strong></td>
          <td className="total-value"><strong>-</strong></td>
          <td className="total-value"><strong>{floorTotal?.totalACUnits || 0}</strong></td>
          <td className="total-value">
            <strong>{floorTotal?.tonnage?.toFixed(2) || '0.00'}</strong>
          </td>
          <td className="total-value" style={{ backgroundColor: '#ffff99', fontWeight: 'bold' }}>
            <strong>{floorTotal?.totalIDUHP?.toFixed(1) || '0.0'}</strong>
          </td>
          <td className="total-value"><strong>-</strong></td>
          <td className="total-value" style={{ backgroundColor: '#ffff99', fontWeight: 'bold' }}>
            <strong>{floorTotal?.totalODUCapacity?.toFixed(1) || '0.0'}</strong>
          </td>
          <td className="total-value"><strong>{floorTotal?.totalCombinedODU || 0}</strong></td>
          <td className="total-value"><strong>{floorTotal?.totalTopDischargeODU || 0}</strong></td>
          <td className="total-value"><strong>{floorTotal?.totalSideDischargeODU || 0}</strong></td>
        </tr>

        {/* Empty row for spacing */}
        <tr className="spacing-row">
          <td colSpan="14"></td>
        </tr>
      </React.Fragment>
    );
  };

  const renderGrandTotalRow = () => (
    <tr className="grand-total-row">
      <td className="grand-total-label"><strong>Total</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.area?.toFixed(1) || '0.0'}</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.tonnage?.toFixed(2) || '0.00'}</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.iduCount || 0}</strong></td>
      <td className="grand-total-value"><strong>-</strong></td>
      <td className="grand-total-value"><strong>-</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.totalACUnits || 0}</strong></td>
      <td className="grand-total-value">
        <strong>{totals.grandTotal?.tonnage?.toFixed(2) || '0.00'}</strong>
      </td>
      <td className="grand-total-value" style={{ backgroundColor: '#ffff99', fontWeight: 'bold' }}>
        <strong>{totals.grandTotal?.totalIDUHP?.toFixed(1) || '0.0'}</strong>
      </td>
      <td className="grand-total-value"><strong>-</strong></td>
      <td className="grand-total-value" style={{ backgroundColor: '#ffff99', fontWeight: 'bold' }}>
        <strong>{totals.grandTotal?.totalODUCapacity?.toFixed(1) || '0.0'}</strong>
      </td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.totalCombinedODU || 0}</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.totalTopDischargeODU || 0}</strong></td>
      <td className="grand-total-value"><strong>{totals.grandTotal?.totalSideDischargeODU || 0}</strong></td>
    </tr>
  );

  const updateAccessoryQuantity = (index, value) => {
    const newAccessories = [...accessories];
    newAccessories[index].quantity = parseInt(value) || 0;
    setAccessories(newAccessories);
  };

  const renderAccessoriesSection = () => (
    <div className="accessories-section">
      <div className="accessories-header-section">
        <h3>📦 Accessories</h3>
      </div>
      <div className="accessories-grid">
        {accessories.map((accessory, index) => (
          <div key={index} className="accessory-item">
            <label className="accessory-label">{accessory.name}</label>
            <input
              type="number"
              value={accessory.quantity}
              onChange={(e) => updateAccessoryQuantity(index, e.target.value)}
              min="0"
              className="accessory-input"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="hvac-spreadsheet-container">
      {/* Header */}
      <div className="spreadsheet-header">
        <div className="header-content">
          <h2>HVAC Equipment Selection</h2>
          <p>Room-by-room equipment selection and configuration</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="header-summary">
        <div className="summary-card">
          <div className="summary-icon heat-load">
            🔥
          </div>
          <div className="summary-content">
            <span className="summary-label">Total Heat Load</span>
            <span className="summary-value">{totals.grandTotal?.tonnage?.toFixed(2) || '0.00'} TR</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon cfm">
            💨
          </div>
          <div className="summary-content">
            <span className="summary-label">Total CFM</span>
            <span className="summary-value">{totals.grandTotal?.tonnage ? (totals.grandTotal.tonnage * 400).toFixed(0) : '0'} CFM</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon idus">
            📦
          </div>
          <div className="summary-content">
            <span className="summary-label">Total IDUs</span>
            <span className="summary-value">{totals.grandTotal?.iduCount || 0}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon hp">
            ⚡
          </div>
          <div className="summary-content">
            <span className="summary-label">Total ODU HP</span>
            <span className="summary-value">{totals.grandTotal?.totalODUCapacity?.toFixed(1) || '0.0'} HP</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="spreadsheet-table-container">
        {Object.keys(spreadsheetData).length === 0 ? (
          <div className="no-data-message">
            <h3>No Space Data Available</h3>
            <p>Please complete the previous steps to load room data.</p>
          </div>
        ) : (
          <table className="hvac-spreadsheet-table">
            <thead>
              {renderHeaderRow()}
            </thead>
            <tbody>
              {Object.entries(spreadsheetData).map(([floorId, floorData]) => 
                renderFloorSection(floorId, floorData)
              )}
              {renderGrandTotalRow()}
            </tbody>
          </table>
        )}
      </div>

      {/* Accessories Section */}
      {Object.keys(spreadsheetData).length > 0 && renderAccessoriesSection()}

      {/* Action Buttons */}
      <div className="spreadsheet-actions">
        <button type="button" className="btn-back-spreadsheet" onClick={onBack}>
          ← Back to Equipment Selection
        </button>
        
        <button 
          type="button" 
          className="btn-save-spreadsheet"
          onClick={handleSave}
        >
          💾 Save & Continue to BOQ →
        </button>
      </div>
    </div>
  );
};

export default HVACEquipmentSpreadsheet;
