import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import HVACDataService from '../../services/hvacDataService';
import toast from '../../utils/toast';
import './HVACInventorySelection.css';

/**
 * HVAC Inventory Selection Component
 * Professional accessories and materials selection for HVAC projects
 * Based on equipment selection and industry standards
 */

// Inventory Database with specifications and units
const INVENTORY_DATABASE = {
  controls: {
    wiredRemotes: {
      name: 'Wired Remote Controller',
      description: 'LCD Display with Timer Function',
      specification: 'LCD, Timer, Weekly Schedule',
      unit: 'Nos',
      defaultPrice: 2500
    },
    wirelessRemotes: {
      name: 'Wireless Remote Controller',
      description: 'Infrared Remote with Display',
      specification: 'IR, LCD Display, 8m Range',
      unit: 'Nos',
      defaultPrice: 1500
    },
    centralController: {
      name: 'Central Controller',
      description: 'Building Management System Interface',
      specification: 'TCP/IP, BACnet Compatible',
      unit: 'Nos',
      defaultPrice: 45000
    }
  },
  
  piping: {
    copperPiping: {
      name: 'Copper Refrigerant Piping',
      description: 'Liquid & Gas Line Set',
      specification: 'ACR Grade, Insulated',
      unit: 'Mtr',
      defaultPrice: 450
    },
    refrigerantGas: {
      name: 'Refrigerant Gas R410A',
      description: 'Additional Gas Charging',
      specification: 'R410A, 99.9% Purity',
      unit: 'Kg',
      defaultPrice: 800
    },
    drainPiping: {
      name: 'Condensate Drain Piping',
      description: 'PVC Drain Pipe with Fittings',
      specification: '25mm PVC, UV Stabilized',
      unit: 'Mtr',
      defaultPrice: 120
    },
    drainPump: {
      name: 'Condensate Drain Pump',
      description: 'Mini Drain Pump for Lift',
      specification: '12L/hr, 230V',
      unit: 'Nos',
      defaultPrice: 3500
    }
  },
  
  insulation: {
    pipeInsulation: {
      name: 'Pipe Insulation',
      description: 'Armaflex Insulation for Refrigerant Lines',
      specification: '19mm Thickness, Class O',
      unit: 'Mtr',
      defaultPrice: 180
    },
    acousticInsulation: {
      name: 'Acoustic Insulation',
      description: 'Sound Dampening Material',
      specification: '25mm Rockwool',
      unit: 'Sqm',
      defaultPrice: 350
    }
  },
  
  electrical: {
    powerCable: {
      name: 'Power Cable',
      description: 'Electrical Power Supply Cable',
      specification: '4 Core, 2.5mm², Armoured',
      unit: 'Mtr',
      defaultPrice: 250
    },
    controlCable: {
      name: 'Control Cable',
      description: 'Communication Cable for VRF System',
      specification: '2 Core, Shielded',
      unit: 'Mtr',
      defaultPrice: 80
    }
  },
  
  mounting: {
    oduMountingPads: {
      name: 'ODU Mounting Pads',
      description: 'Concrete Mounting Base for Outdoor Units',
      specification: '600x600x100mm RCC',
      unit: 'Nos',
      defaultPrice: 2500
    },
    iduMounts: {
      name: 'IDU Mounting Brackets',
      description: 'Wall/Ceiling Mounting Hardware',
      specification: 'MS Powder Coated',
      unit: 'Nos',
      defaultPrice: 800
    },
    vibrationIsolators: {
      name: 'Vibration Isolators',
      description: 'Anti-Vibration Pads',
      specification: 'Rubber, 10mm Thick',
      unit: 'Nos',
      defaultPrice: 450
    }
  },
  
  accessories: {
    isolationValves: {
      name: 'Isolation Valves',
      description: 'Service Valves for Maintenance',
      specification: 'Ball Valve, Brass',
      unit: 'Nos',
      defaultPrice: 1200
    },
    filterDriers: {
      name: 'Filter Driers',
      description: 'Moisture and Contaminant Removal',
      specification: 'Molecular Sieve Core',
      unit: 'Nos',
      defaultPrice: 1800
    },
    branchBoxes: {
      name: 'Refrigerant Branch Boxes',
      description: 'VRF System Distribution',
      specification: 'Multi-Port, Insulated',
      unit: 'Nos',
      defaultPrice: 8500
    }
  }
};

const HVACInventorySelection = ({ designData, equipmentData, onSave, onBack, savedData, projectId }) => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState({});
  const [totals, setTotals] = useState({ totalCost: 0, totalItems: 0 });

  // Initialize inventory from saved data or auto-calculate
  useEffect(() => {
    if (savedData?.inventory) {
      setInventory(savedData.inventory);
    } else if (equipmentData) {
      autoCalculateInventory();
    }
  }, [equipmentData, savedData]);

  // Calculate totals whenever inventory changes
  useEffect(() => {
    calculateTotals();
  }, [inventory]);

  /**
   * Auto-calculate inventory based on equipment selection
   * Professional estimation based on industry standards
   */
  const autoCalculateInventory = () => {
    const summary = equipmentData.projectSummary || {};
    const totalIDUs = summary.totalIDUs || 0;
    const totalODUs = equipmentData.rows?.length || 0;
    const totalFloors = equipmentData.rows?.length || 1;
    const avgPipingPerIDU = 15; // meters
    const avgDrainPerIDU = 10; // meters
    
    const autoInventory = {};
    
    // Controls - 1 remote per IDU + 1 central controller for large projects
    autoInventory.wiredRemotes = {
      ...INVENTORY_DATABASE.controls.wiredRemotes,
      quantity: totalIDUs,
      unitPrice: INVENTORY_DATABASE.controls.wiredRemotes.defaultPrice,
      totalPrice: totalIDUs * INVENTORY_DATABASE.controls.wiredRemotes.defaultPrice
    };
    
    if (totalIDUs > 10) {
      autoInventory.centralController = {
        ...INVENTORY_DATABASE.controls.centralController,
        quantity: 1,
        unitPrice: INVENTORY_DATABASE.controls.centralController.defaultPrice,
        totalPrice: INVENTORY_DATABASE.controls.centralController.defaultPrice
      };
    }
    
    // Piping - based on IDU count and average distances
    const totalPipingLength = totalIDUs * avgPipingPerIDU;
    autoInventory.copperPiping = {
      ...INVENTORY_DATABASE.piping.copperPiping,
      quantity: totalPipingLength,
      unitPrice: INVENTORY_DATABASE.piping.copperPiping.defaultPrice,
      totalPrice: totalPipingLength * INVENTORY_DATABASE.piping.copperPiping.defaultPrice
    };
    
    // Refrigerant gas - 2kg per TR (industry standard)
    const totalTonnage = summary.totalIDUTonnage || 0;
    const refrigerantQty = Math.ceil(totalTonnage * 2);
    autoInventory.refrigerantGas = {
      ...INVENTORY_DATABASE.piping.refrigerantGas,
      quantity: refrigerantQty,
      unitPrice: INVENTORY_DATABASE.piping.refrigerantGas.defaultPrice,
      totalPrice: refrigerantQty * INVENTORY_DATABASE.piping.refrigerantGas.defaultPrice
    };
    
    // Drain piping
    const totalDrainLength = totalIDUs * avgDrainPerIDU;
    autoInventory.drainPiping = {
      ...INVENTORY_DATABASE.piping.drainPiping,
      quantity: totalDrainLength,
      unitPrice: INVENTORY_DATABASE.piping.drainPiping.defaultPrice,
      totalPrice: totalDrainLength * INVENTORY_DATABASE.piping.drainPiping.defaultPrice
    };
    
    // Drain pumps - 1 per 3 IDUs (for lift requirements)
    const drainPumpQty = Math.ceil(totalIDUs / 3);
    autoInventory.drainPump = {
      ...INVENTORY_DATABASE.piping.drainPump,
      quantity: drainPumpQty,
      unitPrice: INVENTORY_DATABASE.piping.drainPump.defaultPrice,
      totalPrice: drainPumpQty * INVENTORY_DATABASE.piping.drainPump.defaultPrice
    };
    
    // Insulation - same length as piping
    autoInventory.pipeInsulation = {
      ...INVENTORY_DATABASE.insulation.pipeInsulation,
      quantity: totalPipingLength,
      unitPrice: INVENTORY_DATABASE.insulation.pipeInsulation.defaultPrice,
      totalPrice: totalPipingLength * INVENTORY_DATABASE.insulation.pipeInsulation.defaultPrice
    };
    
    // Electrical cables
    const avgCablePerIDU = 20; // meters
    const totalCableLength = totalIDUs * avgCablePerIDU;
    autoInventory.powerCable = {
      ...INVENTORY_DATABASE.electrical.powerCable,
      quantity: totalCableLength,
      unitPrice: INVENTORY_DATABASE.electrical.powerCable.defaultPrice,
      totalPrice: totalCableLength * INVENTORY_DATABASE.electrical.powerCable.defaultPrice
    };
    
    autoInventory.controlCable = {
      ...INVENTORY_DATABASE.electrical.controlCable,
      quantity: totalCableLength,
      unitPrice: INVENTORY_DATABASE.electrical.controlCable.defaultPrice,
      totalPrice: totalCableLength * INVENTORY_DATABASE.electrical.controlCable.defaultPrice
    };
    
    // Mounting hardware
    autoInventory.oduMountingPads = {
      ...INVENTORY_DATABASE.mounting.oduMountingPads,
      quantity: totalODUs,
      unitPrice: INVENTORY_DATABASE.mounting.oduMountingPads.defaultPrice,
      totalPrice: totalODUs * INVENTORY_DATABASE.mounting.oduMountingPads.defaultPrice
    };
    
    autoInventory.iduMounts = {
      ...INVENTORY_DATABASE.mounting.iduMounts,
      quantity: totalIDUs,
      unitPrice: INVENTORY_DATABASE.mounting.iduMounts.defaultPrice,
      totalPrice: totalIDUs * INVENTORY_DATABASE.mounting.iduMounts.defaultPrice
    };
    
    autoInventory.vibrationIsolators = {
      ...INVENTORY_DATABASE.mounting.vibrationIsolators,
      quantity: totalODUs * 4, // 4 per ODU
      unitPrice: INVENTORY_DATABASE.mounting.vibrationIsolators.defaultPrice,
      totalPrice: totalODUs * 4 * INVENTORY_DATABASE.mounting.vibrationIsolators.defaultPrice
    };
    
    // Accessories
    autoInventory.isolationValves = {
      ...INVENTORY_DATABASE.accessories.isolationValves,
      quantity: totalIDUs * 2, // 2 per IDU
      unitPrice: INVENTORY_DATABASE.accessories.isolationValves.defaultPrice,
      totalPrice: totalIDUs * 2 * INVENTORY_DATABASE.accessories.isolationValves.defaultPrice
    };
    
    autoInventory.filterDriers = {
      ...INVENTORY_DATABASE.accessories.filterDriers,
      quantity: totalODUs,
      unitPrice: INVENTORY_DATABASE.accessories.filterDriers.defaultPrice,
      totalPrice: totalODUs * INVENTORY_DATABASE.accessories.filterDriers.defaultPrice
    };
    
    // Branch boxes for VRF systems
    if (equipmentData.systemType?.includes('VRF')) {
      const branchBoxQty = Math.ceil(totalIDUs / 4); // 1 per 4 IDUs
      autoInventory.branchBoxes = {
        ...INVENTORY_DATABASE.accessories.branchBoxes,
        quantity: branchBoxQty,
        unitPrice: INVENTORY_DATABASE.accessories.branchBoxes.defaultPrice,
        totalPrice: branchBoxQty * INVENTORY_DATABASE.accessories.branchBoxes.defaultPrice
      };
    }
    
    console.log('✅ Auto-calculated inventory:', autoInventory);
    setInventory(autoInventory);
  };

  /**
   * Calculate totals
   */
  const calculateTotals = () => {
    let totalCost = 0;
    let totalItems = 0;
    
    Object.values(inventory).forEach(item => {
      totalCost += item.totalPrice || 0;
      totalItems += item.quantity || 0;
    });
    
    setTotals({ totalCost, totalItems });
  };

  /**
   * Update inventory item
   */
  const updateItem = (key, field, value) => {
    setInventory(prev => {
      const updated = { ...prev };
      
      if (!updated[key]) return prev;
      
      updated[key] = {
        ...updated[key],
        [field]: parseFloat(value) || 0
      };
      
      // Recalculate total price
      if (field === 'quantity' || field === 'unitPrice') {
        updated[key].totalPrice = updated[key].quantity * updated[key].unitPrice;
      }
      
      return updated;
    });
  };

  /**
   * Add custom item
   */
  const addCustomItem = () => {
    const customKey = `custom_${Date.now()}`;
    setInventory(prev => ({
      ...prev,
      [customKey]: {
        name: 'Custom Item',
        description: '',
        specification: '',
        unit: 'Nos',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
        isCustom: true
      }
    }));
  };

  /**
   * Remove item
   */
  const removeItem = (key) => {
    setInventory(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  /**
   * Save inventory
   */
  const handleSave = async () => {
    if (Object.keys(inventory).length === 0) {
      alert('⚠️ Please add at least one inventory item.');
      return;
    }
    
    const inventoryData = {
      inventory,
      totals,
      savedAt: new Date().toISOString()
    };
    
    console.log('💾 Saving inventory data:', inventoryData);
    
    // Save to Firebase
    if (user && projectId) {
      try {
        await HVACDataService.saveProjectData(projectId, {
          inventoryData,
          currentStep: 4
        }, user?.uid);
        
        console.log('✅ Inventory data saved successfully');
        
        toast.success(
          `Inventory Saved! ${totals.totalItems} items | ` +
          `₹${totals.totalCost.toLocaleString('en-IN')}`
        );
        
        if (onSave) {
          onSave(inventoryData);
        }
      } catch (error) {
        console.error('❌ Error saving inventory data:', error);
        toast.error('Error saving inventory data. Please try again.');
      }
    } else {
      if (onSave) {
        onSave(inventoryData);
      }
    }
  };

  return (
    <div className="inventory-selection-container">
      {/* Header */}
      <div className="inventory-header">
        <div className="header-content">
          <h2>🔧 Inventory & Accessories Selection</h2>
          <p>Select materials and accessories for HVAC installation</p>
        </div>
        
        <div className="header-actions">
          <button 
            type="button" 
            className="btn-auto-calc"
            onClick={autoCalculateInventory}
          >
            🔄 Auto Calculate
          </button>
          
          <button 
            type="button" 
            className="btn-add-custom"
            onClick={addCustomItem}
          >
            ➕ Add Custom Item
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="inventory-summary">
        <div className="summary-card-inv">
          <label>Total Items</label>
          <span className="value">{totals.totalItems}</span>
        </div>
        <div className="summary-card-inv">
          <label>Total Cost</label>
          <span className="value">₹{totals.totalCost.toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-card-inv">
          <label>Equipment Cost</label>
          <span className="value">₹{(equipmentData?.projectSummary?.totalIDUTonnage * 50000 || 0).toLocaleString('en-IN')}</span>
        </div>
        <div className="summary-card-inv">
          <label>Grand Total</label>
          <span className="value">₹{(totals.totalCost + (equipmentData?.projectSummary?.totalIDUTonnage * 50000 || 0)).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Sr. No.</th>
              <th>Item Name</th>
              <th>Description</th>
              <th>Specification</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Unit Price (₹)</th>
              <th>Total Price (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(inventory).map(([key, item], index) => (
              <tr key={key}>
                <td>{index + 1}</td>
                <td>
                  {item.isCustom ? (
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(key, 'name', e.target.value)}
                      className="item-name-input"
                    />
                  ) : (
                    <strong>{item.name}</strong>
                  )}
                </td>
                <td>
                  {item.isCustom ? (
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(key, 'description', e.target.value)}
                      className="description-input"
                    />
                  ) : (
                    <small>{item.description}</small>
                  )}
                </td>
                <td>
                  {item.isCustom ? (
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => updateItem(key, 'specification', e.target.value)}
                      className="spec-input"
                    />
                  ) : (
                    item.specification
                  )}
                </td>
                <td>
                  {item.isCustom ? (
                    <select
                      value={item.unit}
                      onChange={(e) => updateItem(key, 'unit', e.target.value)}
                      className="unit-select"
                    >
                      <option value="Nos">Nos</option>
                      <option value="Mtr">Mtr</option>
                      <option value="Kg">Kg</option>
                      <option value="Sqm">Sqm</option>
                      <option value="Set">Set</option>
                    </select>
                  ) : (
                    item.unit
                  )}
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(key, 'quantity', e.target.value)}
                    className="qty-input-inv"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(key, 'unitPrice', e.target.value)}
                    className="price-input-inv"
                    min="0"
                  />
                </td>
                <td className="total-price-inv">
                  ₹{item.totalPrice?.toLocaleString('en-IN') || 0}
                </td>
                <td>
                  {item.isCustom && (
                    <button
                      type="button"
                      className="btn-remove-item"
                      onClick={() => removeItem(key)}
                      title="Remove item"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row-inv">
              <td colSpan="5"><strong>TOTALS</strong></td>
              <td><strong>{totals.totalItems.toFixed(1)}</strong></td>
              <td></td>
              <td><strong>₹{totals.totalCost.toLocaleString('en-IN')}</strong></td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="form-actions-inventory">
        <button type="button" className="btn-back-inv" onClick={onBack}>
          ← Back to Equipment Selection
        </button>
        
        <button 
          type="button" 
          className="btn-save-inventory"
          onClick={handleSave}
        >
          💾 Save & Continue to BOQ →
        </button>
      </div>
    </div>
  );
};

export default HVACInventorySelection;
