import React, { useState, useEffect } from "react";
import { ref, set, get, update } from "firebase/database";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import RoomHeatLoadCalculator from "./RoomHeatLoadCalculator";
import { 
  calculateCompleteRoomLoad,
  calculateDiversityFactor,
  SOLAR_HEAT_GAIN_FACTORS,
  WALL_U_FACTORS,
  ROOF_U_FACTORS,
  OCCUPANT_HEAT_GAINS,
  VENTILATION_REQUIREMENTS
} from "../../utils/hvacCalculations";
import "./SpaceConsideredFormNew.css";

// Solar gain values for different orientations (BTU/hr/sq.ft)
const SOLAR_GAIN_VALUES = {
  'North': 28, 'South': 85, 'East': 163, 'West': 163, 
  'NorthEast': 138, 'SouthEast': 85, 'NorthWest': 138, 'SouthWest': 85
};

// U-Factor standards (BTU/hr/sq.ft/°F)
const U_FACTORS = {
  glass: 0.56,
  wall: 0.36,
  roof: 0.51,
  partition: 0.86,
  ceiling: 0.28,
  floor: 0.29
};

export default function SpaceConsideredFormNew({ projectData, onSave, onBack, savedData = null, projectId = null }) {
  const { user } = useAuth();
  
  // Space dimensions
  const [dimensions, setDimensions] = useState({
    length: savedData?.length || "",
    width: savedData?.width || "",
    height: savedData?.height || "",
    volume: savedData?.volume || "",
    area: savedData?.area || "",
    bypassFactor: savedData?.bypassFactor || "0",
    contactFactor: savedData?.contactFactor || "1"
  });

  // Design conditions from Form 1
  const [conditions, setConditions] = useState({
    outsideDB: projectData?.ambient?.dbF || "",
    outsideWB: projectData?.ambient?.wbF || "",
    outsideRH: projectData?.ambient?.rh || "",
    outsideDP: projectData?.ambient?.dewPointF || "",
    outsideGR: projectData?.ambient?.grainsPerLb || "",
    insideDB: projectData?.inside?.dbF || "",
    insideWB: projectData?.inside?.wbF || "",
    insideRH: projectData?.inside?.rh || "",
    insideDP: projectData?.inside?.dewPointF || "",
    insideGR: projectData?.inside?.grainsPerLb || "",
    diffDB: "",
    diffGR: ""
  });

  // Sun Gain Glass - 8 orientations
  const [sunGainGlass, setSunGainGlass] = useState(
    savedData?.sunGainGlass || [
      { orientation: 'North', source: 'Glass', area: '', sunGain: 28, uFactor: 0.56, btuHr: 0 },
      { orientation: 'South', source: 'Glass', area: '', sunGain: 85, uFactor: 0.56, btuHr: 0 },
      { orientation: 'East', source: 'Glass', area: '', sunGain: 163, uFactor: 0.56, btuHr: 0 },
      { orientation: 'West', source: 'Glass', area: '', sunGain: 163, uFactor: 0.56, btuHr: 0 },
      { orientation: 'NorthEast', source: 'Glass', area: '', sunGain: 138, uFactor: 0.56, btuHr: 0 },
      { orientation: 'SouthEast', source: 'Glass', area: '', sunGain: 85, uFactor: 0.56, btuHr: 0 },
      { orientation: 'NorthWest', source: 'Glass', area: '', sunGain: 138, uFactor: 0.56, btuHr: 0 },
      { orientation: 'SouthWest', source: 'Glass', area: '', sunGain: 85, uFactor: 0.56, btuHr: 0 }
    ]
  );

  // Solar Gain Walls & Roof
  const [solarGainWalls, setSolarGainWalls] = useState(
    savedData?.solarGainWalls || [
      { source: 'Wall', direction: 'East', area: '', sunGain: 41, uFactor: 0.36, btuHr: 0 },
      { source: 'Wall', direction: 'West', area: '', sunGain: 51, uFactor: 0.34, btuHr: 0 },
      { source: 'Wall', direction: 'North', area: '', sunGain: 22, uFactor: 0.34, btuHr: 0 },
      { source: 'Wall', direction: 'South', area: '', sunGain: 36, uFactor: 0.34, btuHr: 0 },
      { source: 'Wall', direction: 'South-East', area: '', sunGain: 36, uFactor: 0.28, btuHr: 0 },
      { source: 'Wall', direction: 'South-West', area: '', sunGain: 45, uFactor: 0.28, btuHr: 0 },
      { source: 'Wall', direction: 'North-East', area: '', sunGain: 34, uFactor: 0.28, btuHr: 0 },
      { source: 'Wall', direction: 'North-West', area: '', sunGain: 42, uFactor: 0.28, btuHr: 0 },
      { source: 'Roof Sun', direction: '', area: '', sunGain: 20, uFactor: 0.51, btuHr: 0 }
    ]
  );

  // Trans Gain Partitions
  const [partitions, setPartitions] = useState(
    savedData?.partitions || [
      { source: 'All Glass', area: '', deltaT: 0, uFactor: 0.86, btuHr: 0 },
      { source: 'Partition Walls', area: '', deltaT: 0, uFactor: 0.34, btuHr: 0 },
      { source: 'Other Partition', area: '', deltaT: 0, uFactor: 0.30, btuHr: 0 },
      { source: 'Ceiling', area: '', deltaT: 0, uFactor: 0.28, btuHr: 0 },
      { source: 'Floor', area: '', deltaT: 0, uFactor: 0.29, btuHr: 0 }
    ]
  );

  // Internal Heat
  const [internalHeat, setInternalHeat] = useState({
    people: savedData?.internalHeat?.people || "",
    shPerPerson: savedData?.internalHeat?.shPerPerson || "",
    lightsArea: savedData?.internalHeat?.lightsArea || "",
    lightsWattsSqFt: savedData?.internalHeat?.lightsWattsSqFt || "",
    appliancesWatts: savedData?.internalHeat?.appliancesWatts || "",
    motorBHP: savedData?.internalHeat?.motorBHP || "",
    motorHP: savedData?.internalHeat?.motorHP || ""
  });

  // Infiltration & Bypass
  const [infiltration, setInfiltration] = useState({
    cfm: savedData?.infiltration?.cfm || "",
    tDiff: savedData?.infiltration?.tDiff || "",
    bf: savedData?.infiltration?.bf || "",
    ventilationAir: savedData?.infiltration?.ventilationAir || ""
  });

  // Totals
  const [totals, setTotals] = useState({
    sensibleHeatTotal: 0,
    safetyFactor: 0,
    effectiveSensibleHeat: 0,
    latentHeatTotal: 0,
    latentSafetyFactor: 0,
    effectiveLatentHeat: 0,
    effectiveRoomTotalHeat: 0,
    outsideAirSensible: 0,
    outsideAirLatent: 0,
    grandTotalHeat: 0,
    tons: 0
  });

  // CFM Calculations
  const [cfm, setCfm] = useState({
    people: 0,
    sqFt: savedData?.cfm?.sqFt || 558,
    cfmSqFt: 0,
    totalCFM: 0,
    acph: 0
  });

  // Auto-calculate dimensions
  useEffect(() => {
    const { length, width, height } = dimensions;
    if (length && width) {
      const area = parseFloat(length) * parseFloat(width);
      const volume = area * parseFloat(height || 10);
      setDimensions(prev => ({ ...prev, area: area.toFixed(2), volume: volume.toFixed(2) }));
    }
  }, [dimensions.length, dimensions.width, dimensions.height]);

  // Calculate temperature differences
  useEffect(() => {
    const diffDB = parseFloat(conditions.outsideDB) - parseFloat(conditions.insideDB);
    const diffGR = parseFloat(conditions.outsideGR) - parseFloat(conditions.insideGR);
    setConditions(prev => ({ 
      ...prev, 
      diffDB: diffDB.toFixed(1), 
      diffGR: diffGR.toFixed(1) 
    }));
  }, [conditions.outsideDB, conditions.insideDB, conditions.outsideGR, conditions.insideGR]);

  // Calculate sun gain glass BTU/hr
  const updateSunGainGlass = (index, field, value) => {
    const updated = [...sunGainGlass];
    updated[index] = { ...updated[index], [field]: value };
    
    const area = parseFloat(updated[index].area) || 0;
    const sunGain = parseFloat(updated[index].sunGain) || 0;
    const uFactor = parseFloat(updated[index].uFactor) || 0;
    updated[index].btuHr = (area * sunGain * uFactor).toFixed(0);
    
    setSunGainGlass(updated);
  };

  // Calculate solar gain walls BTU/hr
  const updateSolarGainWalls = (index, field, value) => {
    const updated = [...solarGainWalls];
    updated[index] = { ...updated[index], [field]: value };
    
    const area = parseFloat(updated[index].area) || 0;
    const sunGain = parseFloat(updated[index].sunGain) || 0;
    const uFactor = parseFloat(updated[index].uFactor) || 0;
    updated[index].btuHr = (area * sunGain * uFactor).toFixed(0);
    
    setSolarGainWalls(updated);
  };

  // Calculate partition gains BTU/hr
  const updatePartitions = (index, field, value) => {
    const updated = [...partitions];
    updated[index] = { ...updated[index], [field]: value };
    
    const area = parseFloat(updated[index].area) || 0;
    // Auto-calculate deltaT as diffDB - 5
    const deltaT = Math.max(0, parseFloat(conditions.diffDB) - 5) || 0;
    updated[index].deltaT = deltaT;
    const uFactor = parseFloat(updated[index].uFactor) || 0;
    updated[index].btuHr = (area * deltaT * uFactor).toFixed(0);
    
    setPartitions(updated);
  };

  // Auto-update partition deltaT when diffDB changes
  useEffect(() => {
    const deltaT = Math.max(0, parseFloat(conditions.diffDB) - 5) || 0;
    const updated = partitions.map(partition => ({
      ...partition,
      deltaT: deltaT,
      btuHr: ((parseFloat(partition.area) || 0) * deltaT * (parseFloat(partition.uFactor) || 0)).toFixed(0)
    }));
    setPartitions(updated);
  }, [conditions.diffDB]);

  // Calculate all totals
  useEffect(() => {
    // Sun gain glass total
    const sunGainTotal = sunGainGlass.reduce((sum, item) => sum + (parseFloat(item.btuHr) || 0), 0);
    
    // Solar gain walls total
    const solarGainTotal = solarGainWalls.reduce((sum, item) => sum + (parseFloat(item.btuHr) || 0), 0);
    
    // Partition gains total
    const partitionTotal = partitions.reduce((sum, item) => sum + (parseFloat(item.btuHr) || 0), 0);
    
    // Internal heat gains
    const peopleHeat = (parseFloat(internalHeat.people) || 0) * (parseFloat(internalHeat.shPerPerson) || 0);
    const lightsHeat = (parseFloat(internalHeat.lightsArea) || 0) * (parseFloat(internalHeat.lightsWattsSqFt) || 0);
    const appliancesHeat = (parseFloat(internalHeat.appliancesWatts) || 0) * 3.41;
    const motorHeat = (parseFloat(internalHeat.motorBHP) || 0) + (parseFloat(internalHeat.motorHP) || 0);
    
    // Infiltration
    const infiltrationCFM = parseFloat(infiltration.cfm) || 0;
    const tDiff = parseFloat(conditions.diffDB) || 0;
    const grDiff = parseFloat(conditions.diffGR) || 0;
    const infiltrationSH = infiltrationCFM * tDiff * 1.08;
    
    // Sensible heat total
    const sensibleHeatTotal = sunGainTotal + solarGainTotal + partitionTotal + peopleHeat + lightsHeat + appliancesHeat + motorHeat + infiltrationSH;
    const effectiveSensibleHeat = sensibleHeatTotal * 1.08;
    
    // Latent heat
    const peopleLatent = (parseFloat(internalHeat.people) || 0) * 200; // 200 BTU/hr latent per person
    const infiltrationLH = infiltrationCFM * grDiff * 0.68;
    const latentHeatTotal = peopleLatent + infiltrationLH;
    const effectiveLatentHeat = latentHeatTotal * 1.08;
    
    // Room total
    const effectiveRoomTotalHeat = effectiveSensibleHeat + effectiveLatentHeat;
    
    // Outside air heat gains
    const ventilationCFM = parseFloat(infiltration.ventilationAir) || 0;
    const totalCFM = infiltrationCFM + ventilationCFM;
    const outsideAirSensible = totalCFM * tDiff * 1.08;
    const outsideAirLatent = totalCFM * grDiff * 0.68;
    
    // Grand total
    const grandTotalHeat = effectiveRoomTotalHeat + outsideAirSensible + outsideAirLatent;
    const tons = grandTotalHeat / 12000;
    
    setTotals({
      sensibleHeatTotal: sensibleHeatTotal.toFixed(0),
      safetyFactor: '0',
      effectiveSensibleHeat: effectiveSensibleHeat.toFixed(0),
      latentHeatTotal: latentHeatTotal.toFixed(0),
      latentSafetyFactor: '0',
      effectiveLatentHeat: effectiveLatentHeat.toFixed(0),
      effectiveRoomTotalHeat: effectiveRoomTotalHeat.toFixed(0),
      outsideAirSensible: outsideAirSensible.toFixed(0),
      outsideAirLatent: outsideAirLatent.toFixed(0),
      grandTotalHeat: grandTotalHeat.toFixed(0),
      tons: tons.toFixed(2)
    });

    // CFM calculations
    const cfmPeople = (parseFloat(internalHeat.people) || 0) * 15;
    const area = parseFloat(dimensions.area) || 1;
    const cfmSqFt = (totalCFM / area).toFixed(2);
    const volume = parseFloat(dimensions.volume) || 1;
    const acph = ((totalCFM * 60) / volume).toFixed(1);

    setCfm({
      people: cfmPeople.toFixed(0),
      sqFt: area.toFixed(0),
      cfmSqFt,
      totalCFM: totalCFM.toFixed(0),
      acph
    });

  }, [sunGainGlass, solarGainWalls, partitions, internalHeat, infiltration, dimensions, conditions]);

  const handleSave = async () => {
    const formData = {
      dimensions,
      conditions,
      sunGainGlass,
      solarGainWalls,
      partitions,
      internalHeat,
      infiltration,
      totals,
      cfm,
      calculatedAt: new Date().toISOString()
    };

    if (user && projectData?.meta?.projectNumber) {
      try {
        const projectRef = ref(db, `projects/${projectData.meta.projectNumber}`);
        await update(projectRef, {
          spaceData: formData,
          lastUpdated: new Date().toISOString()
        });
        alert('✅ Space data saved successfully!');
      } catch (error) {
        console.error('Error saving space data:', error);
        alert('❌ Error saving data');
      }
    }
    
    onSave(formData);
  };

  return (
    <div className="space-form-excel">
      {/* Header Section */}
      <div className="excel-header">
        <div className="project-info-bar">
          <div className="info-item">
            <span className="info-label">Name of Project:</span>
            <span className="info-value">{projectData?.meta?.projectName}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Project Number:</span>
            <span className="info-value">{projectData?.meta?.projectNumber}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Address:</span>
            <span className="info-value">{projectData?.meta?.address}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Estimated by:</span>
            <span className="info-value">{projectData?.meta?.estimatedBy}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Space Considered:</span>
            <span className="info-value">{projectData?.meta?.spaceConsidered}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Heat load for:</span>
            <span className="info-value">{projectData?.meta?.heatLoadFor}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Floor:</span>
            <span className="info-value">{projectData?.meta?.floor}</span>
          </div>
        </div>
      </div>

      {/* Space Dimensions Table */}
      <div className="excel-section">
        <h3 className="section-title">Space Dimensions</h3>
        <table className="excel-table">
          <thead>
            <tr>
              <th>L (Ft.)</th>
              <th>W (Ft.)</th>
              <th>H (Ft.)</th>
              <th>Volume (Ft³)</th>
              <th>Area (sq.ft)</th>
              <th>By Pass Factor</th>
              <th>Contact Factor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <input 
                  type="number" 
                  value={dimensions.length || ""}
                  onChange={(e) => setDimensions(prev => ({ ...prev, length: e.target.value }))}
                  className="excel-input"
                  placeholder="Enter length"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.width || ""}
                  onChange={(e) => setDimensions(prev => ({ ...prev, width: e.target.value }))}
                  className="excel-input"
                  placeholder="Enter width"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.height || ""}
                  onChange={(e) => setDimensions(prev => ({ ...prev, height: e.target.value }))}
                  className="excel-input"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.volume || ""}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.area || ""}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.bypassFactor || ""}
                  onChange={(e) => setDimensions(prev => ({ ...prev, bypassFactor: e.target.value }))}
                  className="excel-input"
                  step="0.01"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={dimensions.contactFactor || ""}
                  onChange={(e) => setDimensions(prev => ({ ...prev, contactFactor: e.target.value }))}
                  className="excel-input"
                  step="0.01"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Design Conditions Table */}
      <div className="excel-section">
        <h3 className="section-title">Design Conditions</h3>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Conditions</th>
              <th>DB (Deg. F)</th>
              <th>WB (Deg. F)</th>
              <th>% RH</th>
              <th>DP</th>
              <th>GR/lb</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="row-label">Outside</td>
              <td><input type="number" value={conditions.outsideDB || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.outsideWB || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.outsideRH || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.outsideDP || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.outsideGR || ""} readOnly className="excel-input calculated" /></td>
            </tr>
            <tr>
              <td className="row-label">Room</td>
              <td><input type="number" value={conditions.insideDB || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.insideWB || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.insideRH || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.insideDP || ""} readOnly className="excel-input calculated" /></td>
              <td><input type="number" value={conditions.insideGR || ""} readOnly className="excel-input calculated" /></td>
            </tr>
            <tr className="highlight-row">
              <td className="row-label">Difference</td>
              <td><input type="number" value={conditions.diffDB || ""} readOnly className="excel-input calculated" /></td>
              <td></td>
              <td></td>
              <td></td>
              <td><input type="number" value={conditions.diffGR || ""} readOnly className="excel-input calculated" /></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Sensible Heat Gains Section */}
      <div className="excel-section">
        <h3 className="section-title">Sensible Heat Gains</h3>
        
        {/* 1. Sun Gain Glass */}
        <h4 className="subsection-title">1. Sun Gain Glass Direct Exposure</h4>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Orientation</th>
              <th>Source</th>
              <th>Area (Sq.ft)</th>
              <th>Sun Gain</th>
              <th>U Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            {sunGainGlass.map((item, idx) => (
              <tr key={idx}>
                <td>{item.orientation}</td>
                <td>Glass</td>
                <td>
                  <input 
                    type="number" 
                    value={item.area || ""}
                    onChange={(e) => updateSunGainGlass(idx, 'area', e.target.value)}
                    className="excel-input"
                    placeholder="Enter area"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.sunGain}
                    onChange={(e) => updateSunGainGlass(idx, 'sunGain', e.target.value)}
                    className="excel-input"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.uFactor}
                    onChange={(e) => updateSunGainGlass(idx, 'uFactor', e.target.value)}
                    className="excel-input"
                    step="0.01"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.btuHr}
                    readOnly
                    className="excel-input calculated"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 2. Solar Gain Walls & Roof */}
        <h4 className="subsection-title">2. Solar Gain-Walls & Roof Direct Exposure</h4>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Direction</th>
              <th>Area (Sq.ft)</th>
              <th>Sun Gain</th>
              <th>U Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            {solarGainWalls.map((item, idx) => (
              <tr key={idx}>
                <td>{item.source}</td>
                <td>{item.direction}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.area}
                    onChange={(e) => updateSolarGainWalls(idx, 'area', e.target.value)}
                    className="excel-input"
                    placeholder="Enter area"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.sunGain}
                    onChange={(e) => updateSolarGainWalls(idx, 'sunGain', e.target.value)}
                    className="excel-input"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.uFactor}
                    onChange={(e) => updateSolarGainWalls(idx, 'uFactor', e.target.value)}
                    className="excel-input"
                    step="0.01"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.btuHr}
                    readOnly
                    className="excel-input calculated"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 3. Trans Gain through Partition */}
        <h4 className="subsection-title">3. Trans Gain through Partition</h4>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Area (Sq.ft)</th>
              <th>ΔT</th>
              <th>U Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            {partitions.map((item, idx) => (
              <tr key={idx}>
                <td>{item.source}</td>
                <td>
                  <input 
                    type="number" 
                    value={item.area}
                    onChange={(e) => updatePartitions(idx, 'area', e.target.value)}
                    className="excel-input"
                    placeholder="Enter area"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.deltaT}
                    readOnly
                    className="excel-input calculated"
                    title="Auto-calculated as Design Condition Difference - 5"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.uFactor}
                    onChange={(e) => updatePartitions(idx, 'uFactor', e.target.value)}
                    className="excel-input"
                    step="0.01"
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={item.btuHr}
                    readOnly
                    className="excel-input calculated"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 4. Internal Heat */}
        <h4 className="subsection-title">4. Internal Heat</h4>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>People (Nos.)</td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.people}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, people: parseInt(e.target.value) || 0 }))}
                  className="excel-input"
                  placeholder="Enter number of people"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.shPerPerson}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, shPerPerson: e.target.value }))}
                  className="excel-input"
                  placeholder="SH per Person"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(internalHeat.people) || 0) * (parseFloat(internalHeat.shPerPerson) || 0)).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Lights (Watts/sq.ft)</td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.lightsArea}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, lightsArea: e.target.value }))}
                  className="excel-input"
                  placeholder="Area (Sq.ft)"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.lightsWattsSqFt}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, lightsWattsSqFt: e.target.value }))}
                  className="excel-input"
                  step="0.01"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(internalHeat.lightsArea) || 0) * (parseFloat(internalHeat.lightsWattsSqFt) || 0)).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Appliances (Watts*20%)</td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.appliancesWatts}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, appliancesWatts: e.target.value }))}
                  className="excel-input"
                  placeholder="Watts"
                />
              </td>
              <td>3.41</td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(internalHeat.appliancesWatts) || 0) * 3.41).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Motor (BHP)</td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.motorBHP}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, motorBHP: e.target.value }))}
                  className="excel-input"
                  placeholder="BHP"
                />
              </td>
              <td></td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.motorBHP}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Motor (HP)</td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.motorHP}
                  onChange={(e) => setInternalHeat(prev => ({ ...prev, motorHP: e.target.value }))}
                  className="excel-input"
                  placeholder="HP"
                />
              </td>
              <td></td>
              <td>
                <input 
                  type="number" 
                  value={internalHeat.motorHP}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* 5. Infiltration & Bypass Air */}
        <h4 className="subsection-title">5. Infiltration & Bypass Air</h4>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>CFM</th>
              <th>T'Diff / BF</th>
              <th>Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Infiltration (cfm)</td>
              <td>
                <input 
                  type="number" 
                  value={infiltration.cfm}
                  onChange={(e) => setInfiltration(prev => ({ ...prev, cfm: e.target.value }))}
                  className="excel-input"
                  placeholder="Enter CFM"
                />
              </td>
              <td>
                <input 
                  type="number" 
                  value={conditions.diffDB}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
              <td>1.08</td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(infiltration.cfm) || 0) * parseFloat(conditions.diffDB) * 1.08).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Ventilation Air (cfm)</td>
              <td>
                <input 
                  type="number" 
                  value={infiltration.ventilationAir}
                  onChange={(e) => setInfiltration(prev => ({ ...prev, ventilationAir: e.target.value }))}
                  className="excel-input"
                  placeholder="Enter ventilation CFM"
                />
              </td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {/* Sensible Heat Gain Total */}
        <div className="totals-row">
          <span className="total-label">Sensible Heat Gain Total</span>
          <span className="total-value">{totals.sensibleHeatTotal}</span>
        </div>
        <div className="totals-row">
          <span className="total-label">Safety Factor (10%)</span>
          <span className="total-value">{totals.safetyFactor}</span>
        </div>
        <div className="totals-row highlight">
          <span className="total-label">Effective Sensible Heat Gain Total (ESH)</span>
          <span className="total-value">{totals.effectiveSensibleHeat}</span>
        </div>
      </div>

      {/* Latent Heat Gains */}
      <div className="excel-section">
        <h3 className="section-title">Latent Heat Gains</h3>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>CFM</th>
              <th>Gr/lb</th>
              <th>Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Infiltration (cfm)</td>
              <td>{infiltration.cfm}</td>
              <td>{conditions.diffGR}</td>
              <td>0.68</td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(infiltration.cfm) || 0) * parseFloat(conditions.diffGR) * 0.68).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Outside Air (cfm)</td>
              <td>{infiltration.ventilationAir}</td>
              <td>{conditions.diffGR}</td>
              <td>0.68</td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(infiltration.ventilationAir) || 0) * parseFloat(conditions.diffGR) * 0.68).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>People (Nos.)</td>
              <td colSpan="3">LH/Person</td>
              <td>
                <input 
                  type="number" 
                  value={((parseFloat(internalHeat.people) || 0) * 200).toFixed(0)}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="totals-row">
          <span className="total-label">Latent Heat Gain Total</span>
          <span className="total-value">{totals.latentHeatTotal}</span>
        </div>
        <div className="totals-row">
          <span className="total-label">Safety Factor (10%)</span>
          <span className="total-value">{totals.latentSafetyFactor}</span>
        </div>
        <div className="totals-row highlight">
          <span className="total-label">Effective Latent Heat Gain (ELH)</span>
          <span className="total-value">{totals.effectiveLatentHeat}</span>
        </div>
        <div className="totals-row highlight">
          <span className="total-label">Effective Room Total Heat Gain Total (ESH + ELH)</span>
          <span className="total-value">{totals.effectiveRoomTotalHeat}</span>
        </div>
      </div>

      {/* Outside Air Heat/Ventilation Air */}
      <div className="excel-section">
        <h3 className="section-title">Outside Air Heat/ Ventilation Air</h3>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>cfm</th>
              <th>F (TD) / (-1-BF)</th>
              <th>Factor</th>
              <th>BTU/hr</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sensible</td>
              <td>{cfm.totalCFM}</td>
              <td>{conditions.diffDB}</td>
              <td>1.08</td>
              <td>
                <input 
                  type="number" 
                  value={totals.outsideAirSensible}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
            <tr>
              <td>Latent</td>
              <td>{cfm.totalCFM}</td>
              <td>{conditions.diffGR}</td>
              <td>0.68</td>
              <td>
                <input 
                  type="number" 
                  value={totals.outsideAirLatent}
                  readOnly
                  className="excel-input calculated"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="totals-row">
          <span className="total-label">Outside Air Heat Gain Total</span>
          <span className="total-value">{(parseFloat(totals.outsideAirSensible) + parseFloat(totals.outsideAirLatent)).toFixed(0)}</span>
        </div>
        <div className="totals-row highlight grand-total">
          <span className="total-label">GTH (Grand Total Heat) -BTU/hr</span>
          <span className="total-value">{totals.grandTotalHeat}</span>
        </div>
        <div className="totals-row highlight">
          <span className="total-label">Tons (Heat Gain Grand Total /12000)</span>
          <span className="total-value">{totals.tons}</span>
        </div>
      </div>

      {/* CFM Calculations */}
      <div className="excel-section">
        <h3 className="section-title">CFM Ventilation</h3>
        <table className="excel-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>No. of People</td>
              <td>{internalHeat.people}</td>
              <td>CFM/person</td>
            </tr>
            <tr>
              <td>Sq. Ft</td>
              <td>{cfm.sqFt}</td>
              <td>CFM/Sq.Ft</td>
            </tr>
            <tr>
              <td>Cub. Ft.</td>
              <td>{dimensions.volume}</td>
              <td>ACPH</td>
            </tr>
            <tr className="highlight-row">
              <td>Total CFM</td>
              <td>{cfm.totalCFM}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Output Summary */}
      <div className="excel-section">
        <h3 className="section-title">Output</h3>
        <table className="excel-table output-table">
          <tbody>
            <tr>
              <td className="output-label">Tons</td>
              <td className="output-value">{totals.tons}</td>
            </tr>
            <tr>
              <td className="output-label">GTH (Grand Total Heat) -BTU/hr</td>
              <td className="output-value">{totals.grandTotalHeat}</td>
            </tr>
            <tr>
              <td className="output-label">ERSH (Effective Room Sensible Heat)</td>
              <td className="output-value">{totals.effectiveSensibleHeat}</td>
            </tr>
            <tr>
              <td className="output-label">ADP (Apparatus Dew Point)</td>
              <td className="output-value">0.00</td>
            </tr>
            <tr>
              <td className="output-label">CFM (Supply Air)</td>
              <td className="output-value">{cfm.totalCFM}</td>
            </tr>
            <tr>
              <td className="output-label">CFM (Fresh Air)</td>
              <td className="output-value">{infiltration.ventilationAir}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="form-actions-excel">
        <button type="button" onClick={onBack} className="btn-back">
          ← Back
        </button>
        <button type="button" onClick={handleSave} className="btn-save">
          Save & Continue →
        </button>
      </div>
    </div>
  );
}