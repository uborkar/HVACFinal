import React, { useState } from 'react';
import { 
  SHADING_COEFFICIENTS,
  SOLAR_HEAT_GAIN_FACTORS,
  WALL_U_FACTORS,
  WALL_CLTD,
  calculateSolarHeatGain,
  calculateRoofHeatGain,
  calculateOccupantHeatGain,
  calculateLightingHeatGain,
  calculateEquipmentHeatGain,
  calculateVentilationLoad,
  calculateInfiltrationLoad,
  calculateWallHeatGain
} from '../../utils/hvacCalculations';
import './SpaceConsideredForm.css';

const RoomHeatLoadCalculator = ({ roomData, onSave }) => {
  const [inputs, setInputs] = useState({
    // Envelope Components
    windows: [],
    walls: [],
    roof: null,
    partitions: [],
    doors: [],
    
    // Internal Loads
    occupancy: {
      count: roomData.occupancy || 0,
      activityType: 'office' // Default activity type
    },
    lighting: {
      load: 0, // W/sq.ft
      type: 'led', // led, fluorescent, incandescent
      ballastFactor: 1.1
    },
    equipment: {
      load: 0, // W/sq.ft
      diversity: 0.7 // Typical equipment diversity factor
    },
    
    // Ventilation & Infiltration
    ventilation: {
      outdoorAirCFM: 0,
      freshAirRatio: 0.15 // 15% fresh air default
    },
    infiltration: {
      rate: 0.3, // Air changes per hour
      crackLength: 0 // ft (for doors/windows)
    },
    
    // Process Loads
    motors: [],
    specialEquipment: []
  });

  // Form management functions
  const addComponent = (type, defaults = {}) => {
    setInputs(prev => ({
      ...prev,
      [type]: [
        ...prev[type],
        {
          id: Date.now(),
          ...(type === 'windows' ? {
            orientation: 'North',
            area: 0,
            glassType: 'Ordinary Glass',
            shading: { type: 'none' },
            overhang: { depth: 0, height: 0 },
            fins: { depth: 0, spacing: 0 }
          } : type === 'walls' ? {
            orientation: 'North',
            area: 0,
            construction: 'Brick + Concrete + Plaster',
            sunExposed: true,
            color: 'medium', // light, medium, dark
            insulation: { type: 'none', thickness: 0 }
          } : type === 'doors' ? {
            type: 'solid',
            area: 0,
            construction: 'Wood',
            weatherStripped: false
          } : type === 'motors' ? {
            hp: 0,
            efficiency: 0.9,
            usageFactor: 1.0,
            location: 'room' // room or remote
          } : type === 'specialEquipment' ? {
            name: '',
            sensibleHeat: 0,
            latentHeat: 0,
            usageFactor: 1.0
          } : {}),
          ...defaults
        }
      ]
    }));
  };

  const calculateEquipmentHeatGain = (equipment, area) => {
      return equipment.load * area * equipment.diversity * 3.412; // Convert W to BTU/hr
    };
  
    const calculateInfiltrationHeatGain = (infiltration, conditions, type) => {
      const infiltrationCFM = infiltration.rate * roomData.area * roomData.height / 60;
  
      if (type === 'sensible') {
        return 1.08 * infiltrationCFM * (conditions.outdoorDB - conditions.indoorDB);
      } else {
        // Latent heat calculation
        const outdoorW = 0.0126; // Approximate humidity ratio at given conditions
        const indoorW = 0.0093;  // Approximate humidity ratio at given conditions
        return 4840 * infiltrationCFM * (outdoorW - indoorW);
      }
    };
    
      // Heat load calculation function with enhanced HVAC features
  const calculateHeatLoad = async () => {
    // Get psychrometric properties
    const conditions = {
      outdoorDB: 104,
      outdoorWB: 81.623,
      outdoorRH: 40,
      indoorDB: 73.4,
      indoorWB: 60.827,
      indoorRH: 50,
      altitude: 0, // ft above sea level
      latitude: 20, // degrees North
      month: 5, // May (1-12)
      hour: 15, // 3 PM (0-23)
      wallColor: 'medium' // light, medium, dark
    };

    // Enhanced heat gain calculations
    const heatGains = {
      sensible: {
        envelope: {
          windows: inputs.windows.reduce((total, window) => 
            total + calculateSolarHeatGain({
              area: window.area,
              orientation: window.orientation,
              glassType: window.glassType,
              shadingType: window.shadingType
            }), 0),
          walls: inputs.walls.reduce((total, wall) => 
            total + calculateWallHeatGain({
              area: wall.area,
              orientation: wall.orientation,
              construction: wall.construction
            }), 0),
          roof: inputs.roof ? calculateRoofHeatGain({
            area: inputs.roof.area,
            construction: inputs.roof.construction
          }) : 0,
          doors: 0 // No door calculation function available
        },
        internal: {
          people: calculateOccupantHeatGain({
            numberOfPeople: inputs.occupancy,
            activityLevel: 'office',
            heatType: 'sensible'
          }),
          lighting: calculateLightingHeatGain({
            watts: inputs.lighting * roomData.area,
            heatType: 'sensible'
          }),
          equipment: calculateEquipmentHeatGain({
            watts: inputs.equipment * roomData.area,
            heatType: 'sensible'
          }),
          motors: 0, // No motor calculation function available
          special: 0 // No special equipment calculation function available
        },
        ventilation: calculateVentilationLoad({
          cfm: inputs.ventilation,
          outdoorTemp: conditions.outdoorTemp,
          indoorTemp: conditions.indoorTemp,
          heatType: 'sensible'
        }),
        infiltration: calculateInfiltrationLoad({
          cfm: inputs.infiltration,
          outdoorTemp: conditions.outdoorTemp,
          indoorTemp: conditions.indoorTemp,
          heatType: 'sensible'
        })
      },
      latent: {
        internal: {
          people: calculateOccupantHeatGain({
            numberOfPeople: inputs.occupancy,
            activityLevel: 'office',
            heatType: 'latent'
          }),
          equipment: calculateEquipmentHeatGain({
            watts: inputs.equipment * roomData.area,
            heatType: 'latent'
          }),
          special: 0 // No special equipment calculation function available
        },
        ventilation: calculateVentilationLoad({
          cfm: inputs.ventilation,
          outdoorTemp: conditions.outdoorTemp,
          indoorTemp: conditions.indoorTemp,
          heatType: 'latent'
        }),
        infiltration: calculateInfiltrationLoad({
          cfm: inputs.infiltration,
          outdoorTemp: conditions.outdoorTemp,
          indoorTemp: conditions.indoorTemp,
          heatType: 'latent'
        })
      }
    };

    // Calculate totals
    const totals = {
      sensible: Object.values(heatGains.sensible.envelope).reduce((a, b) => a + b, 0) +
                Object.values(heatGains.sensible.internal).reduce((a, b) => a + b, 0) +
                heatGains.sensible.ventilation +
                heatGains.sensible.infiltration,
      latent: Object.values(heatGains.latent.internal).reduce((a, b) => a + b, 0) +
              heatGains.latent.ventilation +
              heatGains.latent.infiltration,
    };
    
    totals.total = totals.sensible + totals.latent;
    
    // Calculate airflow requirements
    const airflow = {
      supplyAirCFM: Math.max(
        totals.sensible / (1.08 * (conditions.indoorDB - 55)), // Based on 55°F supply air
        inputs.ventilation.outdoorAirCFM / inputs.ventilation.freshAirRatio
      ),
      ventilationCFM: inputs.ventilation.outdoorAirCFM,
      infiltrationCFM: inputs.infiltration.rate * roomData.area * roomData.height / 60
    };

    const updatedRoom = {
      ...roomData,
      calculated: true,
      heatGains: {
        detailed: heatGains,
        totals,
        airflow
      }
    };

    await onSave(updatedRoom);
  };

  return (
    <div className="room-heat-load-calculator">
      <h3>Heat Load Calculation - {roomData.name}</h3>
      
      {/* Windows Section */}
      <section className="calculation-section">
        <h4>Windows</h4>
        {inputs.windows.map((window, index) => (
          <div key={index} className="input-row">
            <select 
              value={window.orientation}
              onChange={e => {
                const newWindows = [...inputs.windows];
                newWindows[index].orientation = e.target.value;
                setInputs(prev => ({ ...prev, windows: newWindows }));
              }}
            >
            {Object.keys(SOLAR_HEAT_GAIN_FACTORS['20N']).map(orientation => (
              <option key={orientation} value={orientation}>{orientation}</option>
            ))}
            </select>
            
            <input 
              type="number"
              value={window.area}
              onChange={e => {
                const newWindows = [...inputs.windows];
                newWindows[index].area = parseFloat(e.target.value);
                setInputs(prev => ({ ...prev, windows: newWindows }));
              }}
              placeholder="Area (sq.ft)"
            />
            
            <select
              value={window.glassType}
              onChange={e => {
                const newWindows = [...inputs.windows];
                newWindows[index].glassType = e.target.value;
                setInputs(prev => ({ ...prev, windows: newWindows }));
              }}
            >
            {Object.keys(SHADING_COEFFICIENTS).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
            </select>
          </div>
        ))}
        <button type="button" onClick={() => addComponent('windows')}>Add Window</button>
      </section>

      {/* Walls Section */}
      <section className="calculation-section">
        <h4>Walls</h4>
        {inputs.walls.map((wall, index) => (
          <div key={index} className="input-row">
            <select
              value={wall.orientation}
              onChange={e => {
                const newWalls = [...inputs.walls];
                newWalls[index].orientation = e.target.value;
                setInputs(prev => ({ ...prev, walls: newWalls }));
              }}
            >
              {Object.keys(SOLAR_HEAT_GAIN_FACTORS['20N']).filter(o => o !== 'Horizontal').map(orientation => (
                <option key={orientation} value={orientation}>{orientation}</option>
              ))}
            </select>
            
            <input
              type="number"
              value={wall.area}
              onChange={e => {
                const newWalls = [...inputs.walls];
                newWalls[index].area = parseFloat(e.target.value);
                setInputs(prev => ({ ...prev, walls: newWalls }));
              }}
              placeholder="Area (sq.ft)"
            />
            
            <select
              value={wall.construction}
              onChange={e => {
                const newWalls = [...inputs.walls];
                newWalls[index].construction = e.target.value;
                setInputs(prev => ({ ...prev, walls: newWalls }));
              }}
            >
              {Object.keys(WALL_U_FACTORS).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="button" onClick={() => addComponent('walls')}>Add Wall</button>
      </section>

      {/* Internal Loads */}
      <section className="calculation-section">
        <h4>Internal Loads</h4>
        <div className="input-row">
          <label>
            Occupancy:
            <input
              type="number"
              value={inputs.occupancy}
              onChange={e => setInputs(prev => ({ ...prev, occupancy: parseInt(e.target.value) }))}
            />
          </label>
        </div>
        <div className="input-row">
          <label>
            Lighting Load (W/sq.ft):
            <input
              type="number"
              value={inputs.lightingLoad}
              onChange={e => setInputs(prev => ({ ...prev, lightingLoad: parseFloat(e.target.value) }))}
            />
          </label>
        </div>
        <div className="input-row">
          <label>
            Equipment Load (W/sq.ft):
            <input
              type="number"
              value={inputs.equipmentLoad}
              onChange={e => setInputs(prev => ({ ...prev, equipmentLoad: parseFloat(e.target.value) }))}
            />
          </label>
        </div>
      </section>

      <button type="button" onClick={calculateHeatLoad} className="calculate-button">
        Calculate Heat Load
      </button>

      {roomData.calculated && roomData.heatGains && (
        <section className="results-section">
          <h4>Results</h4>
          <div className="results-grid">
            <div>Sensible Heat: {roomData.heatGains.totals.sensible.toLocaleString()} BTU/hr</div>
            <div>Latent Heat: {roomData.heatGains.totals.latent.toLocaleString()} BTU/hr</div>
            <div>Total Heat: {roomData.heatGains.totals.total.toLocaleString()} BTU/hr</div>
            <div>Required Tonnage: {(roomData.heatGains.totals.total / 12000).toFixed(2)} TR</div>
          </div>
        </section>
      )}
    </div>
  );
};

export default RoomHeatLoadCalculator;