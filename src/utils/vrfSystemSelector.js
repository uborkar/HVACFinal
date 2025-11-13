/**
 * VRF System Selection Utility
 * Based on ASHRAE standards and manufacturer specifications
 * Handles automatic VRF system selection based on building loads
 */

// VRF System Specifications
export const VRF_SYSTEMS = {
  'Heat Pump': {
    minCapacity: 2, // tons
    maxCapacity: 16,
    minModulation: 0.3,
    maxModulation: 1.1,
    maxConnections: 8,
    maxPipingLength: 100,
    maxHeightDifference: 50,
    cop_cooling: 4.1,
    cop_heating: 4.5,
    efficiency: 'High',
    applications: ['Office', 'Retail', 'Residential']
  },
  'Heat Recovery': {
    minCapacity: 6,
    maxCapacity: 32,
    minModulation: 0.2,
    maxModulation: 1.15,
    maxConnections: 16,
    maxPipingLength: 165,
    maxHeightDifference: 90,
    cop_cooling: 3.9,
    cop_heating: 4.3,
    efficiency: 'Very High',
    applications: ['Office', 'Hospital', 'Hotel', 'School'],
    simultaneous_operation: true
  },
  'Water Source': {
    minCapacity: 4,
    maxCapacity: 20,
    minModulation: 0.25,
    maxModulation: 1.0,
    maxConnections: 12,
    maxPipingLength: 200,
    maxHeightDifference: 100,
    cop_cooling: 4.5,
    cop_heating: 4.8,
    efficiency: 'Very High',
    applications: ['Office', 'Hospital', 'Laboratory'],
    requires_water_loop: true
  }
};

// Indoor Unit Types with specifications
export const INDOOR_UNIT_TYPES = {
  'Wall Mounted': {
    capacities: [0.75, 1.0, 1.5, 2.0, 2.5, 3.0], // tons
    minHeight: 7, // feet
    maxHeight: 11,
    airflow_cfm_per_ton: 400,
    sound_level_db: 35,
    applications: ['Office', 'Retail', 'Residential'],
    mounting: 'Wall',
    space_requirements: 'Minimal'
  },
  '4-Way Cassette': {
    capacities: [1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
    minHeight: 9,
    maxHeight: 14,
    airflow_cfm_per_ton: 450,
    sound_level_db: 38,
    applications: ['Office', 'Retail', 'Restaurant'],
    mounting: 'Ceiling',
    space_requirements: 'Moderate'
  },
  '1-Way Cassette': {
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0],
    minHeight: 9,
    maxHeight: 14,
    airflow_cfm_per_ton: 420,
    sound_level_db: 36,
    applications: ['Office', 'Retail'],
    mounting: 'Ceiling',
    space_requirements: 'Moderate'
  },
  'Ducted': {
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0],
    minHeight: 10,
    maxHeight: 20,
    airflow_cfm_per_ton: 400,
    sound_level_db: 40,
    applications: ['Office', 'Hospital', 'School'],
    mounting: 'Ceiling',
    space_requirements: 'High',
    external_static_pressure: 0.8 // inches WG
  },
  'Floor Standing': {
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0],
    minHeight: 0,
    maxHeight: 12,
    airflow_cfm_per_ton: 380,
    sound_level_db: 42,
    applications: ['Office', 'Retail', 'Residential'],
    mounting: 'Floor',
    space_requirements: 'Moderate'
  },
  'VRF IDU': {
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0],
    minHeight: 9,
    maxHeight: 20,
    airflow_cfm_per_ton: 400,
    sound_level_db: 38,
    applications: ['Office', 'Hospital', 'Hotel', 'School'],
    mounting: 'Ceiling',
    space_requirements: 'High',
    vrf_specific: true
  }
};

// Building type specific requirements
export const BUILDING_REQUIREMENTS = {
  'Office': {
    diversity_factor: 0.85,
    operating_hours: [8, 18],
    occupancy_density: 100, // sq.ft per person
    fresh_air_requirement: 20, // CFM per person
    noise_sensitivity: 'Medium',
    zoning_requirements: 'High'
  },
  'Hospital': {
    diversity_factor: 0.90,
    operating_hours: [0, 23],
    occupancy_density: 200,
    fresh_air_requirement: 25,
    noise_sensitivity: 'Low',
    zoning_requirements: 'Very High',
    special_requirements: ['HEPA Filtration', 'Positive Pressure', 'Redundancy']
  },
  'Hotel': {
    diversity_factor: 0.75,
    operating_hours: [0, 23],
    occupancy_density: 250,
    fresh_air_requirement: 15,
    noise_sensitivity: 'High',
    zoning_requirements: 'Very High'
  },
  'Retail': {
    diversity_factor: 0.80,
    operating_hours: [10, 22],
    occupancy_density: 60,
    fresh_air_requirement: 15,
    noise_sensitivity: 'Medium',
    zoning_requirements: 'Medium'
  },
  'School': {
    diversity_factor: 0.85,
    operating_hours: [8, 17],
    occupancy_density: 40,
    fresh_air_requirement: 15,
    noise_sensitivity: 'Low',
    zoning_requirements: 'High'
  },
  'Residential': {
    diversity_factor: 0.70,
    operating_hours: [0, 23],
    occupancy_density: 250,
    fresh_air_requirement: 15,
    noise_sensitivity: 'High',
    zoning_requirements: 'Medium'
  }
};

/**
 * Auto-select VRF system based on building requirements
 */
export function selectVRFSystem(buildingData) {
  const {
    buildingType = 'Office',
    totalLoad, // in tons
    totalCFM,
    floors = 1,
    rooms = 1,
    applications = ['Office']
  } = buildingData;

  const requirements = BUILDING_REQUIREMENTS[buildingType] || BUILDING_REQUIREMENTS['Office'];
  
  // Determine system type based on load and requirements
  let systemType = 'Heat Pump';
  
  if (totalLoad > 16 || floors > 2 || rooms > 20) {
    systemType = 'Heat Recovery';
  }
  
  if (requirements.special_requirements?.includes('Redundancy') || totalLoad > 25) {
    systemType = 'Water Source';
  }
  
    const system = VRF_SYSTEMS[systemType];

  // Calculate number of outdoor units needed
  const unitsNeeded = Math.ceil(totalLoad / system.maxCapacity);
  const totalCapacity = unitsNeeded * system.maxCapacity;
  
  // Calculate diversity factor
  const diversityFactor = calculateDiversityFactor(buildingType, rooms);
  const adjustedLoad = totalLoad * diversityFactor;

    return {
      systemType,
    system,
    unitsNeeded,
    totalCapacity,
    diversityFactor,
    adjustedLoad,
    efficiency: system.efficiency,
    applications: system.applications,
    requirements
  };
}

/**
 * Auto-select indoor units based on room requirements
 */
export function selectIndoorUnits(roomData) {
  const {
    roomType = 'Office',
    area,
    load, // in tons
    cfm,
    ceilingHeight = 10,
    noiseSensitivity = 'Medium',
    mountingPreference = 'Ceiling'
  } = roomData;
  
  // Filter suitable indoor unit types
  const suitableTypes = Object.entries(INDOOR_UNIT_TYPES).filter(([type, specs]) => {
    // Check capacity range
    const hasSuitableCapacity = specs.capacities.some(cap => cap >= load * 0.8 && cap <= load * 1.2);
    
    // Check height requirements
    const heightSuitable = ceilingHeight >= specs.minHeight && ceilingHeight <= specs.maxHeight;
    
    // Check application suitability
    const applicationSuitable = specs.applications.includes(roomType) || specs.applications.includes('Office');
    
    return hasSuitableCapacity && heightSuitable && applicationSuitable;
  });
  
  if (suitableTypes.length === 0) {
    return null;
  }
  
  // Select best match based on criteria
  let bestMatch = suitableTypes[0];
  let bestScore = 0;
  
  suitableTypes.forEach(([type, specs]) => {
    let score = 0;
    
    // Capacity match score
    const capacityMatch = specs.capacities.find(cap => Math.abs(cap - load) < 0.5);
    if (capacityMatch) score += 3;
    
    // Noise level score (lower is better)
    if (noiseSensitivity === 'High' && specs.sound_level_db < 40) score += 2;
    if (noiseSensitivity === 'Medium' && specs.sound_level_db < 45) score += 1;
    
    // Mounting preference score
    if (mountingPreference === specs.mounting) score += 2;
    
    // Application match score
    if (specs.applications.includes(roomType)) score += 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = [type, specs];
    }
  });
  
  const [selectedType, selectedSpecs] = bestMatch;
  
  // Calculate number of units needed
  const unitCapacity = selectedSpecs.capacities.find(cap => cap >= load) || 
                      Math.max(...selectedSpecs.capacities);
  const unitsNeeded = Math.ceil(load / unitCapacity);
  
  return {
    type: selectedType,
    specs: selectedSpecs,
    capacity: unitCapacity,
    unitsNeeded,
    totalCapacity: unitCapacity * unitsNeeded,
    airflow: selectedSpecs.airflow_cfm_per_ton * unitCapacity,
    soundLevel: selectedSpecs.sound_level_db
  };
}

/**
 * Calculate diversity factor based on building type and number of rooms
 */
function calculateDiversityFactor(buildingType, roomCount) {
  const baseFactors = {
    'Office': 0.85,
    'Hospital': 0.90,
    'Hotel': 0.75,
    'Retail': 0.80,
    'School': 0.85,
    'Residential': 0.70
  };
  
  const baseFactor = baseFactors[buildingType] || 0.85;
  
  // Adjust based on number of rooms
  if (roomCount > 20) {
    return Math.max(baseFactor - 0.1, 0.65);
  } else if (roomCount > 10) {
    return Math.max(baseFactor - 0.05, 0.70);
  }
  
  return baseFactor;
}

/**
 * Generate complete VRF system configuration
 */
export function generateVRFConfiguration(buildingData, roomData) {
  const systemSelection = selectVRFSystem(buildingData);
  const indoorUnits = roomData.map(room => selectIndoorUnits(room));
  
  // Calculate total indoor unit capacity
  const totalIndoorCapacity = indoorUnits.reduce((sum, unit) => 
    sum + (unit ? unit.totalCapacity : 0), 0);
  
  // Check if outdoor unit capacity is sufficient
  const capacityRatio = totalIndoorCapacity / systemSelection.totalCapacity;
  const isCapacitySufficient = capacityRatio <= 1.3; // 30% over-capacity allowed
  
  return {
    system: systemSelection,
    indoorUnits,
    totalIndoorCapacity,
    capacityRatio,
    isCapacitySufficient,
    recommendations: generateRecommendations(systemSelection, indoorUnits, buildingData)
  };
}

/**
 * Generate system recommendations
 */
function generateRecommendations(systemSelection, indoorUnits, buildingData) {
  const recommendations = [];
  
  // Capacity recommendations
  if (systemSelection.capacityRatio > 1.3) {
    recommendations.push({
      type: 'warning',
      message: 'Outdoor unit capacity may be insufficient. Consider adding more outdoor units or selecting a larger system.'
    });
  }
  
  // Efficiency recommendations
  if (systemSelection.system.cop_cooling < 4.0) {
    recommendations.push({
      type: 'info',
      message: 'Consider upgrading to a more efficient system for better energy savings.'
    });
  }
  
  // Zoning recommendations
  if (buildingData.rooms > 10) {
    recommendations.push({
      type: 'info',
      message: 'Consider implementing advanced zoning controls for better energy efficiency.'
    });
  }
  
  // Noise recommendations
  const noisyUnits = indoorUnits.filter(unit => unit && unit.soundLevel > 40);
  if (noisyUnits.length > 0) {
    recommendations.push({
      type: 'warning',
      message: 'Some indoor units may produce noise levels above 40 dB. Consider quieter alternatives for noise-sensitive areas.'
    });
  }
  
  return recommendations;
}

export default {
  selectVRFSystem,
  selectIndoorUnits,
  generateVRFConfiguration,
  VRF_SYSTEMS,
  INDOOR_UNIT_TYPES,
  BUILDING_REQUIREMENTS
};