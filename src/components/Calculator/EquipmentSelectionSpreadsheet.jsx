import React, { useState, useEffect } from "react";
import { ref, get, update } from "firebase/database";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import "./EquipmentSelectionSpreadsheet.css";

export default function EquipmentSelectionSpreadsheet({ 
  projectData, 
  spaceData, 
  onSave, 
  onBack, 
  savedData = null, 
  projectId = null 
}) {
  const { user } = useAuth();
  
  // State for spreadsheet rows
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({
    totalIDUTonnage: 0,
    totalHP: 0
  });

  // Initialize rows from space data
  useEffect(() => {
    if (savedData?.rows) {
      setRows(savedData.rows);
    } else if (spaceData) {
      // Handle multi-room data from MultiRoomSpaceForm
      if (spaceData.multiFloorProject) {
        const initialRows = [];
        
        // Process each floor
        Object.values(spaceData.multiFloorProject.floors).forEach(floor => {
          if (floor.rooms && floor.rooms.length > 0) {
            // Group rooms by floor for equipment selection
            const floorTotalArea = floor.rooms.reduce((sum, room) => sum + (room.area || 0), 0);
            const floorTotalHeat = floor.rooms.reduce((sum, room) => {
              return sum + (room.heatGains?.totals?.total || 0);
            }, 0);
            const floorTotalCFM = floor.rooms.reduce((sum, room) => {
              return sum + (room.heatGains?.airflow?.totalCFM || 0);
            }, 0);
            
            if (floorTotalArea > 0) {
              initialRows.push({
                floorName: floor.name,
                area: floorTotalArea,
                heatLoadBTU: floorTotalHeat,
                heatLoadTR: (floorTotalHeat / 12000).toFixed(2),
                heatLoadCFM: floorTotalCFM,
                iduType: "",
                machineTR: "",
                noOfIDUs: "",
                totalIDUTonnage: "",
                mxCFM: "",
                totalCfm: "",
                diversity: "",
                oduType: "",
                hp: "",
                selectedODUHP: "",
                revisedDiversity: ""
              });
            }
          }
        });
        
        // If no multi-floor data, fall back to single room
        if (initialRows.length === 0) {
          initialRows.push({
            floorName: spaceData?.floorName || spaceData?.meta?.floorName || "Floor 1",
            area: spaceData?.dimensions?.area || spaceData?.area || "",
            heatLoadBTU: spaceData?.totals?.grandTotalHeat || "",
            heatLoadTR: spaceData?.totals?.tons || "",
            heatLoadCFM: spaceData?.cfm?.totalCFM || "",
            iduType: "",
            machineTR: "",
            noOfIDUs: "",
            totalIDUTonnage: "",
            mxCFM: "",
            totalCfm: "",
            diversity: "",
            oduType: "",
            hp: "",
            selectedODUHP: "",
            revisedDiversity: ""
          });
        }
        
        setRows(initialRows);
      } else {
        // Single room data (legacy)
        const initialRows = [{
          floorName: spaceData?.floorName || spaceData?.meta?.floorName || "",
          area: spaceData?.dimensions?.area || spaceData?.area || "",
          heatLoadBTU: spaceData?.totals?.grandTotalHeat || "",
          heatLoadTR: spaceData?.totals?.tons || "",
          heatLoadCFM: spaceData?.cfm?.totalCFM || "",
          iduType: "",
          machineTR: "",
          noOfIDUs: "",
          totalIDUTonnage: "",
          mxCFM: "",
          totalCfm: "",
          diversity: "",
          oduType: "",
          hp: "",
          selectedODUHP: "",
          revisedDiversity: ""
        }];
        setRows(initialRows);
      }
    }
  }, [spaceData, savedData]);

  // Calculate row totals
  const calculateRowTotals = (row) => {
    const machineTR = parseFloat(row.machineTR) || 0;
    const noOfIDUs = parseFloat(row.noOfIDUs) || 0;
    const totalIDUTonnage = machineTR * noOfIDUs;
    
    const mxCFM = parseFloat(row.mxCFM) || 0;
    const totalCfm = mxCFM * noOfIDUs;
    
    return {
      ...row,
      totalIDUTonnage: totalIDUTonnage.toFixed(2),
      totalCfm: totalCfm.toFixed(0)
    };
  };

  // Update row field
  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index] = {
      ...newRows[index],
      [field]: value
    };
    
    // Recalculate row
    newRows[index] = calculateRowTotals(newRows[index]);
    
    setRows(newRows);
  };

  // Calculate grand totals
  useEffect(() => {
    const totalIDUTonnage = rows.reduce((sum, row) => 
      sum + (parseFloat(row.totalIDUTonnage) || 0), 0);
    
    const totalHP = rows.reduce((sum, row) => 
      sum + (parseFloat(row.selectedODUHP) || 0), 0);
    
    setTotals({
      totalIDUTonnage: totalIDUTonnage.toFixed(2),
      totalHP: totalHP.toFixed(0)
    });
  }, [rows]);

  // Add new row
  const addRow = () => {
    setRows([...rows, {
      floorName: "",
      area: "",
      heatLoadBTU: "",
      heatLoadTR: "",
      heatLoadCFM: "",
      iduType: "",
      machineTR: "",
      noOfIDUs: "",
      totalIDUTonnage: "",
      mxCFM: "",
      totalCfm: "",
      diversity: "",
      oduType: "",
      hp: "",
      selectedODUHP: "",
      revisedDiversity: ""
    }]);
  };

  // Remove row
  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleSave = async () => {
    // Validate that at least one row has data
    const hasValidData = rows.some(row => 
      row.iduType && row.machineTR && row.noOfIDUs && row.oduType
    );

    if (!hasValidData) {
      alert('❌ Please fill in at least one complete row with IDU Type, Machine TR, No. of IDUs, and ODU Type');
      return;
    }

    // Validate each row that has partial data
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const hasAnyData = row.iduType || row.machineTR || row.noOfIDUs || row.oduType;
      
      if (hasAnyData) {
        if (!row.iduType) {
          alert(`❌ Row ${i + 1}: Please select IDU Type`);
          return;
        }
        if (!row.machineTR) {
          alert(`❌ Row ${i + 1}: Please enter Machine TR`);
          return;
        }
        if (!row.noOfIDUs) {
          alert(`❌ Row ${i + 1}: Please enter No. of IDUs`);
          return;
        }
        if (!row.oduType) {
          alert(`❌ Row ${i + 1}: Please select ODU Type`);
          return;
        }
      }
    }

    const formData = {
      rows,
      totals,
      savedAt: new Date().toISOString()
    };

    if (user && projectData?.meta?.projectNumber) {
      try {
        const projectRef = ref(db, `projects/${projectData.meta.projectNumber}`);
        await update(projectRef, {
          equipmentData: formData,
          lastUpdated: new Date().toISOString()
        });
        alert('✅ Equipment selection saved successfully!');
      } catch (error) {
        console.error('Error saving equipment data:', error);
        alert('❌ Error saving data');
      }
    }
    
    onSave(formData);
  };

  return (
    <div className="equipment-spreadsheet">
      {/* Project Header with comprehensive info */}
      <div className="spreadsheet-header">
        <div className="project-title">
          <h2>Equipment Selection - {projectData?.meta?.projectName || "Untitled Project"}</h2>
        </div>
        <div className="project-meta-info">
          <div className="meta-item">
            <span className="meta-label">Project Number:</span>
            <span className="meta-value">{projectData?.meta?.projectNumber || "N/A"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Address:</span>
            <span className="meta-value">{projectData?.meta?.address || "N/A"}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Estimator:</span>
            <span className="meta-value">{projectData?.meta?.estimator || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* Design Conditions Summary */}
      <div className="design-summary">
        <h3>Design Conditions Summary</h3>
        <div className="conditions-row">
          <div className="condition-group">
            <h4>Ambient (Outside)</h4>
            <p>DB: {projectData?.ambient?.dbF || "N/A"}°F | WB: {projectData?.ambient?.wbF || "N/A"}°F | RH: {projectData?.ambient?.rh || "N/A"}%</p>
          </div>
          <div className="condition-group">
            <h4>Inside</h4>
            <p>DB: {projectData?.inside?.dbF || "N/A"}°F | WB: {projectData?.inside?.wbF || "N/A"}°F | RH: {projectData?.inside?.rh || "N/A"}%</p>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="spreadsheet-container">
        <table className="equipment-table">
          <thead>
            <tr className="main-header">
              <th rowSpan="2">Floor/Area Name</th>
              <th rowSpan="2">Area (Sq. ft.)</th>
              <th colSpan="2">Heat Load (As per Sheet)</th>
              <th colSpan="6">IDU Selection</th>
              <th colSpan="4">ODU Selection</th>
              <th rowSpan="2">Actions</th>
            </tr>
            <tr className="sub-header">
              <th>Heat Load (TR)</th>
              <th>Heat Load (CFM)</th>
              <th>IDU Type</th>
              <th>Machine (TR)</th>
              <th>No. of IDUs</th>
              <th>Total IDU Tonnage</th>
              <th>Mx CFM</th>
              <th>Total cfm</th>
              <th>Diversity (%)</th>
              <th>ODU</th>
              <th>HP</th>
              <th>Selected ODU(HP)</th>
              <th>Revised Diversity(%)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    type="text"
                    value={row.floorName}
                    onChange={(e) => updateRow(index, 'floorName', e.target.value)}
                    className="cell-input"
                    placeholder="Floor name"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.area}
                    onChange={(e) => updateRow(index, 'area', e.target.value)}
                    className="cell-input"
                    placeholder="Area"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.heatLoadTR}
                    onChange={(e) => updateRow(index, 'heatLoadTR', e.target.value)}
                    className="cell-input"
                    placeholder="TR"
                    step="0.01"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.heatLoadCFM}
                    onChange={(e) => updateRow(index, 'heatLoadCFM', e.target.value)}
                    className="cell-input"
                    placeholder="CFM"
                  />
                </td>
                <td>
                  <select
                    value={row.iduType}
                    onChange={(e) => updateRow(index, 'iduType', e.target.value)}
                    className="cell-select"
                  >
                    <option value="">Select IDU Type</option>
                    <option value="Ceiling Cassette 4-Way">Ceiling Cassette 4-Way</option>
                    <option value="Ceiling Cassette 1-Way">Ceiling Cassette 1-Way</option>
                    <option value="Wall Mounted">Wall Mounted</option>
                    <option value="Ducted">Ducted</option>
                    <option value="Floor Standing">Floor Standing</option>
                    <option value="Ceiling Suspended">Ceiling Suspended</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={row.machineTR}
                    onChange={(e) => updateRow(index, 'machineTR', e.target.value)}
                    className="cell-input"
                    placeholder="TR"
                    step="0.1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.noOfIDUs}
                    onChange={(e) => updateRow(index, 'noOfIDUs', e.target.value)}
                    className="cell-input"
                    placeholder="Qty"
                    min="1"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.totalIDUTonnage}
                    readOnly
                    className="cell-input calculated"
                    title="Auto-calculated: Machine TR × No. of IDUs"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.mxCFM}
                    onChange={(e) => updateRow(index, 'mxCFM', e.target.value)}
                    className="cell-input"
                    placeholder="CFM"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.totalCfm}
                    readOnly
                    className="cell-input calculated"
                    title="Auto-calculated: Mx CFM × No. of IDUs"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.diversity}
                    onChange={(e) => updateRow(index, 'diversity', e.target.value)}
                    className="cell-input"
                    placeholder="%"
                    max="100"
                  />
                </td>
                <td>
                  <select
                    value={row.oduType}
                    onChange={(e) => updateRow(index, 'oduType', e.target.value)}
                    className="cell-select"
                  >
                    <option value="">Select ODU</option>
                    <option value="Single Split">Single Split</option>
                    <option value="Multi Split">Multi Split</option>
                    <option value="VRF System">VRF System</option>
                    <option value="Chiller">Chiller</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={row.hp}
                    onChange={(e) => updateRow(index, 'hp', e.target.value)}
                    className="cell-input"
                    placeholder="HP"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.selectedODUHP}
                    onChange={(e) => updateRow(index, 'selectedODUHP', e.target.value)}
                    className="cell-input"
                    placeholder="HP"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={row.revisedDiversity}
                    onChange={(e) => updateRow(index, 'revisedDiversity', e.target.value)}
                    className="cell-input"
                    placeholder="%"
                    max="100"
                  />
                </td>
                <td className="action-cell">
                  {rows.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeRow(index)}
                      className="btn-remove"
                      title="Remove this row"
                    >
                      ×
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="totals-row">
              <td colSpan="7" className="total-label">TOTAL (Tonnage)</td>
              <td className="total-value">{totals.totalIDUTonnage}</td>
              <td colSpan="5"></td>
              <td colSpan="2" className="total-label">TOTAL (HP)</td>
              <td className="total-value">{totals.totalHP}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Add Row Button */}
      <div className="spreadsheet-actions">
        <button type="button" onClick={addRow} className="btn-add-row">
          + Add Floor/Area
        </button>
      </div>

      {/* Form Actions */}
      <div className="form-actions-spreadsheet">
        <button type="button" onClick={onBack} className="btn-back">
          ← Back to Space Considered
        </button>
        <button type="button" onClick={handleSave} className="btn-save">
          Save & Continue to Inventory →
        </button>
      </div>
    </div>
  );
}