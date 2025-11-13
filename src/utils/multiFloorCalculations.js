/**
 * Multi-Floor HVAC Calculations Utility
 * Handles room-wise heat gain calculations across multiple floors
 * Based on ASHRAE and ISHRAE standards
 */

import { BUILDING_TEMPLATES, ROOM_TYPE_CONFIG, generateRoomTemplates } from './buildingTemplates';

// Glass factors for different orientations and shading (ASHRAE standards)
export const GLASS_FACTORS = {
  'Ordinary Glass': {
    noShade: 1.00,
    insideVenetianBlind: { light: 0.56, medium: 0.65, dark: 0.75 },
    outsideShading: { light: 0.20, medium: 0.25, dark: 0.30 }
  },
  'Heat Absorbing Glass': {
    noShade: 0.83,
    insideVenetianBlind: { light: 0.50, medium: 0.57, dark: 0.64 },
    outsideShading: { light: 0.17, medium: 0.21, dark: 0.25 }
  },
  'Reflective Glass': {
    noShade: 0.30,
    insideVenetianBlind: { light: 0.25, medium: 0.27, dark: 0.30 },
    outsideShading: { light: 0.10, medium: 0.12, dark: 0.15 }
  }
};

// Solar gain intensities for India (20°N latitude, May design conditions)
export const SOLAR_GAIN_INTENSITIES = {
  'North': 28,
  'Northeast': 45,
  'East': 65,
  'Southeast': 75,
  'South': 85,
  'Southwest': 75,
  'West': 65,
  'Northwest': 45,
  'Horizontal': 95
};

// Wall and roof construction U-factors (BTU/hr·sq.ft·°F)
export const CONSTRUCTION_U_FACTORS = {
  'Brick + Concrete + Plaster': 0.45,
  'Concrete Block + Insulation': 0.25,
  'Steel Frame + Insulation': 0.35,
  'Wood Frame + Insulation': 0.30,
  'Precast Concrete': 0.55,
  'Glass Curtain Wall': 0.65
};

// Equivalent Temperature Differences (ETD) for walls and roofs
export const ETD_VALUES = {
  walls: {
    'North': 15,
    'Northeast': 18,
    'East': 25,
    'Southeast': 28,
    'South': 20,
    'Southwest': 28,
    'West': 25,
    'Northwest': 18
  },
  roof: {
    'Flat Concrete': 35,
    'Sloped Tile': 30,
    'Metal Roofing': 40,
    'Insulated Roof': 25
  }
};

/**
 * Initialize multi-floor project structure
 */
export function initializeMultiFloorProject(projectData) {
  const { meta } = projectData;
  const { buildingType, totalFloors, basementFloors, floorConfiguration, roomGenerationMode } = meta;

  const floors = {};
  
  floorConfiguration.forEach(floorConfig => {
    const floorId = floorConfig.id;
    const rooms = [];

    // Generate rooms based on mode
    if (roomGenerationMode === 'auto' || roomGenerationMode === 'template') {
      const generatedRooms = generateRoomTemplates(floorConfig.template);
      rooms.push(...generatedRooms);
    }

    floors[floorId] = {
      id: floorId,
      name: floorConfig.name,
      code: floorConfig.code,
      type: floorConfig.type,
      level: floorConfig.level,
      rooms: rooms,
      totals: {
        sensibleHeat: 0,
        latentHeat: 0,
        totalHeat: 0,
        totalCFM: 0,
        totalArea: 0
      },
      calculated: false,
      progress: {
        totalRooms: rooms.length,
        calculatedRooms: 0,
        percentage: 0
      }
    };
  });

  return {
    projectId: meta.projectNumber,
    buildingType,
    floors,
    buildingTotals: {
      sensibleHeat: 0,
      latentHeat: 0,
      totalHeat: 0,
      totalCFM: 0,
      totalArea: 0,
      diversityFactor: 0.85,
      adjustedLoad: 0
    },
    currentFloor: Object.keys(floors)[0] || null,
    currentRoom: null
  };
}

/**
 * Calculate heat gains for a specific room
 */
export function calculateRoomHeatGains(room, ambientConditions, insideConditions, roomInputs) {
  const calculations = {
    sunGainGlass: 0,
    wallRoofGain: 0,
    partitionGain: 0,
    peopleGainSensible: 0,
    peopleGainLatent: 0,
    lightingGain: 0,
    equipmentGain: 0,
    motorGain: 0,
    infiltrationSensible: 0,
    infiltrationLatent: 0,
    ventilationCFM: 0,
    infiltrationCFM: 0
  };

  // 1. Sun Gain Through Glass
  if (roomInputs.windows) {
    roomInputs.windows.forEach(window => {
      const solarIntensity = SOLAR_GAIN_INTENSITIES[window.orientation] || 0;
      const glassFactor = getGlassFactor(window.glassType, window.shading);
      calculations.sunGainGlass += window.area * solarIntensity * glassFactor;
    });
  }

  // 2. Heat Gain Through Walls and Roof
  if (roomInputs.walls) {
    roomInputs.walls.forEach(wall => {
      const uFactor = CONSTRUCTION_U_FACTORS[wall.construction] || 0.45;
      const etd = ETD_VALUES.walls[wall.orientation] || 20;
      calculations.wallRoofGain += uFactor * wall.area * etd;
    });
  }

  if (roomInputs.roof) {
    const uFactor = CONSTRUCTION_U_FACTORS[roomInputs.roof.construction] || 0.45;
    const etd = ETD_VALUES.roof[roomInputs.roof.type] || 35;
    calculations.wallRoofGain += uFactor * roomInputs.roof.area * etd;
  }

  // 3. Heat Gain Through Partitions (adjacent spaces)
  if (roomInputs.partitions) {
    roomInputs.partitions.forEach(partition => {
      const tempDiff = partition.adjacentTemp - insideConditions.dbF;
      const uFactor = 0.25; // Typical partition U-factor
      calculations.partitionGain += uFactor * partition.area * tempDiff;
    });
  }

  // 4. People Heat Gains
  const roomConfig = ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG.default;
  const occupancy = roomInputs.occupancy || room.occupancy;
  
  // Sensible heat from people (varies by activity)
  const sensibleHeatPerPerson = getSensibleHeatPerPerson(room.type);
  calculations.peopleGainSensible = occupancy * sensibleHeatPerPerson;
  
  // Latent heat from people
  const latentHeatPerPerson = getLatentHeatPerPerson(room.type);
  calculations.peopleGainLatent = occupancy * latentHeatPerPerson;

  // 5. Lighting Heat Gain
  const lightingWatts = (roomInputs.lightingLoad || roomConfig.lighting) * room.area;
  calculations.lightingGain = lightingWatts * 3.412; // Watts to BTU/hr

  // 6. Equipment Heat Gain
  const equipmentWatts = (roomInputs.equipmentLoad || roomConfig.equipment) * room.area;
  calculations.equipmentGain = equipmentWatts * 3.412;

  // 7. Motor Heat Gain
  if (roomInputs.motors) {
    roomInputs.motors.forEach(motor => {
      calculations.motorGain += motor.hp * 2545; // HP to BTU/hr
    });
  }

  // 8. Infiltration and Ventilation
  const cfmPerPerson = roomConfig.cfmPerPerson || 20;
  const cfmPerSqFt = 0.1; // Minimum ventilation
  
  calculations.ventilationCFM = occupancy * cfmPerPerson + room.area * cfmPerSqFt;
  calculations.infiltrationCFM = room.area * 0.05; // Infiltration estimate

  // Calculate infiltration heat gains
  const tempDiff = ambientConditions.dbF - insideConditions.dbF;
  const humidityDiff = (ambientConditions.grainsPerLb || 0) - (insideConditions.grainsPerLb || 0);
  
  calculations.infiltrationSensible = 1.08 * calculations.infiltrationCFM * tempDiff;
  calculations.infiltrationLatent = 0.68 * calculations.infiltrationCFM * humidityDiff;

  // Calculate totals
  const totalSensible = calculations.sunGainGlass + 
                       calculations.wallRoofGain + 
                       calculations.partitionGain + 
                       calculations.peopleGainSensible + 
                       calculations.lightingGain + 
                       calculations.equipmentGain + 
                       calculations.motorGain + 
                       calculations.infiltrationSensible;

  const totalLatent = calculations.peopleGainLatent + calculations.infiltrationLatent;
  const grandTotal = totalSensible + totalLatent;

  return {
    ...calculations,
    totals: {
      sensible: Math.round(totalSensible),
      latent: Math.round(totalLatent),
      total: Math.round(grandTotal),
      cfm: Math.round(calculations.ventilationCFM + calculations.infiltrationCFM),
      tonnage: Math.round((grandTotal / 12000) * 100) / 100
    }
  };
}

/**
 * Get glass factor based on type and shading
 */
function getGlassFactor(glassType, shading) {
  const glassData = GLASS_FACTORS[glassType] || GLASS_FACTORS['Ordinary Glass'];
  
  if (shading.type === 'none') {
    return glassData.noShade;
  } else if (shading.type === 'inside_venetian') {
    return glassData.insideVenetianBlind[shading.color] || glassData.insideVenetianBlind.medium;
  } else if (shading.type === 'outside') {
    return glassData.outsideShading[shading.color] || glassData.outsideShading.medium;
  }
  
  return glassData.noShade;
}

/**
 * Get sensible heat per person based on room type and activity
 */
function getSensibleHeatPerPerson(roomType) {
  const heatGains = {
    'office': 250,
    'open_office': 250,
    'classroom': 245,
    'auditorium': 225,
    'restaurant': 275,
    'kitchen': 400,
    'retail': 250,
    'hospital': 230,
    'patient_room': 230,
    'icu': 250,
    'operation_theater': 400,
    'gym': 425,
    'factory': 450,
    'warehouse': 400
  };
  
  return heatGains[roomType] || 250; // Default office activity
}

/**
 * Get latent heat per person based on room type and activity
 */
function getLatentHeatPerPerson(roomType) {
  const latentGains = {
    'office': 200,
    'open_office': 200,
    'classroom': 180,
    'auditorium': 180,
    'restaurant': 250,
    'kitchen': 350,
    'retail': 200,
    'hospital': 180,
    'patient_room': 180,
    'icu': 200,
    'operation_theater': 250,
    'gym': 375,
    'factory': 300,
    'warehouse': 250
  };
  
  return latentGains[roomType] || 200; // Default office activity
}

/**
 * Calculate floor totals with diversity factors
 */
export function calculateFloorTotals(floor) {
  let totalSensible = 0;
  let totalLatent = 0;
  let totalCFM = 0;
  let totalArea = 0;
  let calculatedRooms = 0;

  floor.rooms.forEach(room => {
    if (room.calculated && room.heatGains) {
      totalSensible += room.heatGains.totals.sensible * room.quantity;
      totalLatent += room.heatGains.totals.latent * room.quantity;
      totalCFM += room.heatGains.totals.cfm * room.quantity;
      calculatedRooms++;
    }
    totalArea += room.area * room.quantity;
  });

  // Apply diversity factor for floor (typically 0.85-0.95)
  const diversityFactor = getDiversityFactor(floor.type, floor.rooms.length);
  const adjustedSensible = totalSensible * diversityFactor;
  const adjustedLatent = totalLatent * diversityFactor;
  const adjustedTotal = adjustedSensible + adjustedLatent;

  floor.totals = {
    sensibleHeat: Math.round(adjustedSensible),
    latentHeat: Math.round(adjustedLatent),
    totalHeat: Math.round(adjustedTotal),
    totalCFM: Math.round(totalCFM * diversityFactor),
    totalArea: Math.round(totalArea),
    diversityFactor,
    tonnage: Math.round((adjustedTotal / 12000) * 100) / 100
  };

  floor.progress = {
    totalRooms: floor.rooms.length,
    calculatedRooms,
    percentage: Math.round((calculatedRooms / floor.rooms.length) * 100)
  };

  return floor.totals;
}

/**
 * Get diversity factor based on floor type and number of rooms
 */
function getDiversityFactor(floorType, roomCount) {
  const factors = {
    'office': roomCount > 10 ? 0.85 : 0.90,
    'retail': roomCount > 15 ? 0.80 : 0.85,
    'hospital': roomCount > 20 ? 0.90 : 0.95,
    'hotel': roomCount > 25 ? 0.75 : 0.80,
    'school': roomCount > 15 ? 0.85 : 0.90,
    'apartment': roomCount > 20 ? 0.70 : 0.75
  };

  const floorTypeKey = floorType.toLowerCase().includes('office') ? 'office' :
                      floorType.toLowerCase().includes('retail') ? 'retail' :
                      floorType.toLowerCase().includes('hospital') ? 'hospital' :
                      floorType.toLowerCase().includes('hotel') ? 'hotel' :
                      floorType.toLowerCase().includes('school') ? 'school' :
                      floorType.toLowerCase().includes('apartment') ? 'apartment' : 'office';

  return factors[floorTypeKey] || 0.85;
}

/**
 * Calculate building totals from all floors
 */
export function calculateBuildingTotals(floors) {
  let totalSensible = 0;
  let totalLatent = 0;
  let totalCFM = 0;
  let totalArea = 0;

  Object.values(floors).forEach(floor => {
    if (floor.totals) {
      totalSensible += floor.totals.sensibleHeat;
      totalLatent += floor.totals.latentHeat;
      totalCFM += floor.totals.totalCFM;
      totalArea += floor.totals.totalArea;
    }
  });

  // Apply building-level diversity factor
  const buildingDiversityFactor = 0.85;
  const adjustedTotal = (totalSensible + totalLatent) * buildingDiversityFactor;

  return {
    sensibleHeat: totalSensible,
    latentHeat: totalLatent,
    totalHeat: totalSensible + totalLatent,
    totalCFM,
    totalArea,
    diversityFactor: buildingDiversityFactor,
    adjustedLoad: Math.round(adjustedTotal),
    tonnage: Math.round((adjustedTotal / 12000) * 100) / 100
  };
}

/**
 * Add a new room to a floor
 */
export function addRoomToFloor(floor, roomTemplate = null) {
  const newRoom = roomTemplate || {
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: 'New Room',
    type: 'office',
    area: 200,
    occupancy: 10,
    quantity: 1,
    config: ROOM_TYPE_CONFIG.default,
    calculated: false,
    heatGains: null
  };

  floor.rooms.push(newRoom);
  
  // Update progress
  floor.progress.totalRooms = floor.rooms.length;
  floor.progress.percentage = Math.round((floor.progress.calculatedRooms / floor.rooms.length) * 100);

  return newRoom;
}

/**
 * Remove a room from a floor
 */
export function removeRoomFromFloor(floor, roomId) {
  const roomIndex = floor.rooms.findIndex(room => room.id === roomId);
  if (roomIndex > -1) {
    const removedRoom = floor.rooms.splice(roomIndex, 1)[0];
    
    // Update progress
    if (removedRoom.calculated) {
      floor.progress.calculatedRooms--;
    }
    floor.progress.totalRooms = floor.rooms.length;
    floor.progress.percentage = floor.rooms.length > 0 ? 
      Math.round((floor.progress.calculatedRooms / floor.rooms.length) * 100) : 0;

    return removedRoom;
  }
  return null;
}

export default {
  initializeMultiFloorProject,
  calculateRoomHeatGains,
  calculateFloorTotals,
  calculateBuildingTotals,
  addRoomToFloor,
  removeRoomFromFloor,
  GLASS_FACTORS,
  SOLAR_GAIN_INTENSITIES,
  CONSTRUCTION_U_FACTORS,
  ETD_VALUES
};
