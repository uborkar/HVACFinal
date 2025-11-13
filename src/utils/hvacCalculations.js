/**
 * Enhanced HVAC Heat Load Calculation Engine
 * Based on ASHRAE Fundamentals, ISHRAE Standards, and VRF System Guidelines
 * 
 * This module provides comprehensive heat load calculations for:
 * - Solar heat gains through fenestration (windows, skylights)
 * - Heat transmission through building envelope
 * - Internal heat gains (occupancy, lighting, equipment)
 * - Infiltration and ventilation loads
 * - Room sensible heat factor calculations
 * - Psychrometric processes
 * - System diversity factors
 * - VRF system selections
 * 
 * References:
 * - ASHRAE Fundamentals Handbook 2021
 * - ISHRAE Handbook
 * - ASHRAE Standard 62.1-2022 (Ventilation)
 * - IS 1391 (Indian Standard for Air Conditioning)
 * - AHRI Standard 1230 (VRF Systems)
 */

import { GLASS_FACTORS, SOLAR_GAIN_INTENSITIES, CONSTRUCTION_U_FACTORS, ETD_VALUES } from './multiFloorCalculations';

// ==================== ENHANCED HEAT GAIN CALCULATIONS ====================

/**
 * Solar Heat Gain Factor (SHGF) for different orientations and latitudes
 * Values in BTU/hr·sq.ft for peak summer conditions (May for India)
 */
export const SOLAR_HEAT_GAIN_FACTORS = {
  // For 20°N latitude (Mumbai, Pune, Bhopal)
  '20N': {
    'North': { 9: 42, 12: 28, 15: 28, peak: 42 },
    'Northeast': { 9: 156, 12: 52, 15: 28, peak: 156 },
    'East': { 9: 211, 12: 52, 15: 28, peak: 211 },
    'Southeast': { 9: 211, 12: 140, 15: 28, peak: 211 },
    'South': { 9: 89, 12: 174, 15: 89, peak: 174 },
    'Southwest': { 9: 28, 12: 140, 15: 211, peak: 211 },
    'West': { 9: 28, 12: 52, 15: 211, peak: 211 },
    'Northwest': { 9: 28, 12: 52, 15: 156, peak: 156 },
    'Horizontal': { 9: 226, 12: 288, 15: 226, peak: 288 }
  },
  // For 28°N latitude (Delhi, Jaipur, Lucknow)
  '28N': {
    'North': { 9: 38, 12: 25, 15: 25, peak: 38 },
    'Northeast': { 9: 170, 12: 48, 15: 25, peak: 170 },
    'East': { 9: 225, 12: 48, 15: 25, peak: 225 },
    'Southeast': { 9: 220, 12: 125, 15: 25, peak: 220 },
    'South': { 9: 75, 12: 155, 15: 75, peak: 155 },
    'Southwest': { 9: 25, 12: 125, 15: 220, peak: 220 },
    'West': { 9: 25, 12: 48, 15: 225, peak: 225 },
    'Northwest': { 9: 25, 12: 48, 15: 170, peak: 170 },
    'Horizontal': { 9: 235, 12: 295, 15: 235, peak: 295 }
  },
  // For 13°N latitude (Chennai, Bangalore)
  '13N': {
    'North': { 9: 48, 12: 32, 15: 32, peak: 48 },
    'Northeast': { 9: 142, 12: 58, 15: 32, peak: 142 },
    'East': { 9: 198, 12: 58, 15: 32, peak: 198 },
    'Southeast': { 9: 198, 12: 152, 15: 32, peak: 198 },
    'South': { 9: 95, 12: 188, 15: 95, peak: 188 },
    'Southwest': { 9: 32, 12: 152, 15: 198, peak: 198 },
    'West': { 9: 32, 12: 58, 15: 198, peak: 198 },
    'Northwest': { 9: 32, 12: 58, 15: 142, peak: 142 },
    'Horizontal': { 9: 218, 12: 282, 15: 218, peak: 282 }
  }
};

/**
 * Shading Coefficients for different glass types
 */
export const SHADING_COEFFICIENTS = {
  // Clear glass
  'Single Clear 3mm': { noShade: 1.00, inside: 0.65, outside: 0.25 },
  'Single Clear 6mm': { noShade: 0.95, inside: 0.64, outside: 0.24 },
  'Double Clear': { noShade: 0.90, inside: 0.62, outside: 0.23 },
  
  // Heat absorbing glass
  'Heat Absorbing 6mm': { noShade: 0.69, inside: 0.50, outside: 0.17 },
  'Heat Absorbing 10mm': { noShade: 0.60, inside: 0.46, outside: 0.15 },
  
  // Reflective glass
  'Reflective Light': { noShade: 0.40, inside: 0.35, outside: 0.12 },
  'Reflective Medium': { noShade: 0.30, inside: 0.28, outside: 0.10 },
  'Reflective Dark': { noShade: 0.20, inside: 0.20, outside: 0.08 },
  
  // Low-E glass
  'Low-E Double': { noShade: 0.71, inside: 0.52, outside: 0.18 },
  'Low-E Triple': { noShade: 0.50, inside: 0.40, outside: 0.15 }
};

// ==================== U-FACTORS (THERMAL TRANSMITTANCE) ====================

/**
 * U-Factors for various wall constructions (BTU/hr·sq.ft·°F)
 */
export const WALL_U_FACTORS = {
  // Brick walls
  '230mm Brick + Plaster': 0.60,
  '230mm Brick + 25mm Insulation + Plaster': 0.32,
  '115mm Brick + 50mm Insulation + 115mm Brick': 0.28,
  
  // Concrete walls
  '150mm RCC + Plaster': 0.70,
  '200mm RCC + Plaster': 0.65,
  '150mm RCC + 25mm Insulation + Plaster': 0.35,
  '200mm RCC + 50mm Insulation + Plaster': 0.25,
  
  // Concrete block walls
  '200mm Hollow Block + Plaster': 0.55,
  '200mm Hollow Block + Insulation + Plaster': 0.30,
  
  // Prefab/Metal walls
  'Metal Panel + 50mm Insulation': 0.40,
  'Metal Panel + 75mm Insulation': 0.28,
  'Sandwich Panel (50mm core)': 0.35,
  'Sandwich Panel (100mm core)': 0.22,
  
  // Glass curtain walls
  'Single Glazed Curtain Wall': 1.10,
  'Double Glazed Curtain Wall': 0.55,
  'Double Glazed Low-E Curtain Wall': 0.35,
  
  // Wood frame
  'Wood Frame + 50mm Insulation': 0.38,
  'Wood Frame + 75mm Insulation': 0.26
};

/**
 * U-Factors for roof constructions (BTU/hr·sq.ft·°F)
 */
export const ROOF_U_FACTORS = {
  // Flat concrete roofs
  '150mm RCC + Tiles': 0.75,
  '150mm RCC + Waterproofing': 0.80,
  '150mm RCC + 50mm Insulation': 0.30,
  '150mm RCC + 75mm Insulation': 0.22,
  '150mm RCC + 100mm Insulation': 0.18,
  
  // Sloped roofs
  'Clay Tiles + Ceiling': 0.65,
  'Concrete Tiles + Ceiling': 0.70,
  'Metal Roofing + Ceiling': 0.85,
  'Metal Roofing + Insulation + Ceiling': 0.35,
  
  // False ceiling configurations
  'Slab + False Ceiling (no insulation)': 0.55,
  'Slab + Insulated False Ceiling': 0.28
};

/**
 * U-Factors for floors (BTU/hr·sq.ft·°F)
 */
export const FLOOR_U_FACTORS = {
  'Concrete Slab on Grade': 0.50,
  'Concrete Slab + Tiles': 0.48,
  'Raised Floor System': 0.42,
  'Insulated Raised Floor': 0.28,
  'Floor over Unconditioned Space': 0.35,
  'Floor over Conditioned Space': 0.15
};

// ==================== EQUIVALENT TEMPERATURE DIFFERENCE (CLTD) ====================

/**
 * Cooling Load Temperature Difference for walls
 * Adjusted for solar radiation, thermal mass, and time lag
 */
export const WALL_CLTD = {
  // Light weight construction (< 50 lb/sq.ft)
  'Light': {
    'North': 12, 'Northeast': 15, 'East': 20, 'Southeast': 22,
    'South': 18, 'Southwest': 22, 'West': 20, 'Northwest': 15
  },
  // Medium weight (50-100 lb/sq.ft)
  'Medium': {
    'North': 10, 'Northeast': 13, 'East': 18, 'Southeast': 20,
    'South': 16, 'Southwest': 20, 'West': 18, 'Northwest': 13
  },
  // Heavy weight (> 100 lb/sq.ft)
  'Heavy': {
    'North': 8, 'Northeast': 11, 'East': 16, 'Southeast': 18,
    'South': 14, 'Southwest': 18, 'West': 16, 'Northwest': 11
  }
};

/**
 * Cooling Load Temperature Difference for roofs
 */
export const ROOF_CLTD = {
  'Dark Surface': 45,
  'Medium Surface': 40,
  'Light Surface': 35,
  'Reflective Surface': 28,
  'Insulated Dark': 25,
  'Insulated Light': 20,
  'Ceiling Below Roof': 15,
  'Insulated Ceiling': 12
};

// ==================== INTERNAL HEAT GAINS ====================

/**
 * Heat gain from occupants (BTU/hr per person)
 * Based on activity level and thermal comfort conditions
 */
export const OCCUPANT_HEAT_GAINS = {
  // Activity levels
  'Seated at Rest': { sensible: 225, latent: 175, total: 400 },
  'Seated, Light Work': { sensible: 245, latent: 205, total: 450 },
  'Standing, Light Work': { sensible: 250, latent: 200, total: 450 },
  'Light Bench Work': { sensible: 275, latent: 275, total: 550 },
  'Walking Slowly': { sensible: 305, latent: 345, total: 650 },
  'Moderate Activity': { sensible: 315, latent: 435, total: 750 },
  'Heavy Work': { sensible: 425, latent: 625, total: 1050 },
  'Athletics': { sensible: 525, latent: 1025, total: 1550 },
  
  // Room type defaults
  'Office': { sensible: 250, latent: 200, total: 450 },
  'School': { sensible: 245, latent: 205, total: 450 },
  'Retail': { sensible: 275, latent: 225, total: 500 },
  'Restaurant': { sensible: 275, latent: 275, total: 550 },
  'Theater': { sensible: 225, latent: 175, total: 400 },
  'Gym': { sensible: 425, latent: 625, total: 1050 },
  'Factory': { sensible: 375, latent: 525, total: 900 },
  'Hospital': { sensible: 230, latent: 180, total: 410 }
};

/**
 * Lighting heat gain factors (BTU/hr per watt)
 */
export const LIGHTING_FACTORS = {
  // Lighting type factors
  'Incandescent': 3.41, // All energy becomes heat
  'Fluorescent': 4.27, // Includes ballast losses
  'CFL': 4.10,
  'LED': 3.60, // Lower heat gain
  'Metal Halide': 4.50,
  
  // Space usage factors
  'Use Factor': {
    'Continuous': 1.0,
    'Intermittent': 0.75,
    'Occasional': 0.50
  },
  
  // Special allowance factor
  'Ballast Factor': {
    'Fluorescent': 1.25,
    'LED': 1.10,
    'HID': 1.30
  }
};

/**
 * Equipment heat gain (Watts per sq.ft or direct BTU/hr)
 */
export const EQUIPMENT_HEAT_GAINS = {
  // Office equipment (W/sq.ft)
  'Office - Light': 1.5,
  'Office - Medium': 2.5,
  'Office - Heavy': 4.0,
  
  // Data centers
  'Data Center': 50,
  'Server Room': 30,
  'Telecom Room': 20,
  
  // Retail
  'Retail - General': 1.5,
  'Retail - Restaurant': 5.0,
  'Commercial Kitchen': 15.0,
  
  // Medical
  'Hospital - Patient Room': 2.0,
  'Hospital - Operating Room': 10.0,
  'Hospital - ICU': 5.0,
  
  // Industrial
  'Light Manufacturing': 3.0,
  'Assembly Area': 2.0,
  'Warehouse': 0.5,
  
  // Specific equipment (BTU/hr)
  'Desktop Computer': 340,
  'Laptop Computer': 100,
  'Laser Printer': 1365,
  'Copier': 2048,
  'Vending Machine': 3413,
  'Coffee Maker': 1024,
  'Microwave': 2048,
  'Refrigerator': 1536
};

// ==================== VENTILATION REQUIREMENTS ====================

/**
 * Minimum ventilation rates per ASHRAE 62.1 and ISHRAE
 * CFM per person or CFM per sq.ft
 */
export const VENTILATION_REQUIREMENTS = {
  // Residential
  'Apartment': { cfmPerPerson: 20, cfmPerSqFt: 0.06 },
  'Hotel Guest Room': { cfmPerPerson: 25, cfmPerSqFt: 0.06 },
  'Dormitory': { cfmPerPerson: 20, cfmPerSqFt: 0.06 },
  
  // Commercial
  'Office': { cfmPerPerson: 20, cfmPerSqFt: 0.06 },
  'Conference Room': { cfmPerPerson: 20, cfmPerSqFt: 0.06 },
  'Reception Area': { cfmPerPerson: 15, cfmPerSqFt: 0.06 },
  'Retail': { cfmPerPerson: 15, cfmPerSqFt: 0.12 },
  'Mall Common Area': { cfmPerPerson: 20, cfmPerSqFt: 0.06 },
  
  // Educational
  'Classroom': { cfmPerPerson: 15, cfmPerSqFt: 0.12 },
  'Lecture Hall': { cfmPerPerson: 15, cfmPerSqFt: 0.06 },
  'Laboratory': { cfmPerPerson: 20, cfmPerSqFt: 0.18 },
  'Library': { cfmPerPerson: 15, cfmPerSqFt: 0.12 },
  
  // Healthcare
  'Patient Room': { cfmPerPerson: 25, cfmPerSqFt: 0.18 },
  'ICU': { cfmPerPerson: 30, cfmPerSqFt: 0.24 },
  'Operating Room': { cfmPerPerson: 30, cfmPerSqFt: 0.36, minACH: 15 },
  'Waiting Room': { cfmPerPerson: 15, cfmPerSqFt: 0.06 },
  
  // Food Service
  'Restaurant Dining': { cfmPerPerson: 20, cfmPerSqFt: 0.18 },
  'Kitchen': { cfmPerPerson: 15, cfmPerSqFt: 0.30, minACH: 15 },
  'Cafeteria': { cfmPerPerson: 20, cfmPerSqFt: 0.18 },
  'Bar': { cfmPerPerson: 30, cfmPerSqFt: 0.18 },
  
  // Entertainment
  'Theater': { cfmPerPerson: 15, cfmPerSqFt: 0.06 },
  'Auditorium': { cfmPerPerson: 15, cfmPerSqFt: 0.06 },
  'Gym': { cfmPerPerson: 40, cfmPerSqFt: 0.18 },
  'Sports Arena': { cfmPerPerson: 30, cfmPerSqFt: 0.12 },
  
  // Default
  'Default': { cfmPerPerson: 20, cfmPerSqFt: 0.06 }
};

// ==================== CALCULATION FUNCTIONS ====================

/**
 * Calculate solar heat gain through glass with auto-calculation
 * @param {Object} params - Glass parameters
 * @returns {number} Heat gain in BTU/hr
 */
export function calculateSolarHeatGain(params) {
  const {
    area,
    orientation,
    glassType = 'Single Clear 6mm',
    shadingType = 'noShade',
    latitude = '20N',
    hour = 'peak',
    autoCalculate = true
  } = params;
  
  // Auto-calculate SHGF based on orientation and latitude
  let shgf;
  if (autoCalculate) {
    shgf = getAutoSolarHeatGainFactor(orientation, latitude, hour);
  } else {
    const shgfData = SOLAR_HEAT_GAIN_FACTORS[latitude];
    shgf = shgfData && shgfData[orientation] ? shgfData[orientation][hour] : 50;
  }
  
  // Auto-calculate shading coefficient based on glass type
  let sc;
  if (autoCalculate) {
    sc = getAutoShadingCoefficient(glassType, shadingType);
  } else {
    const glassData = SHADING_COEFFICIENTS[glassType] || SHADING_COEFFICIENTS['Single Clear 6mm'];
    sc = glassData[shadingType] || glassData.noShade;
  }
  
  // Calculate heat gain
  const heatGain = area * shgf * sc;
  
  return Math.round(heatGain);
}

/**
 * Auto-calculate Solar Heat Gain Factor based on orientation and latitude
 */
function getAutoSolarHeatGainFactor(orientation, latitude, hour) {
  const baseFactors = {
    'North': 25,
    'Northeast': 45,
    'East': 65,
    'Southeast': 75,
    'South': 85,
    'Southwest': 75,
    'West': 65,
    'Northwest': 45,
    'Horizontal': 95
  };
  
  const baseSHGF = baseFactors[orientation] || 50;
  
  // Adjust for latitude (20°N to 28°N for India)
  const latAdjustment = latitude === '28N' ? 0.9 : latitude === '13N' ? 1.1 : 1.0;
  
  // Adjust for time of day
  const timeAdjustment = hour === 'peak' ? 1.0 : hour === 9 ? 0.8 : hour === 15 ? 0.9 : 1.0;
  
  return Math.round(baseSHGF * latAdjustment * timeAdjustment);
}

/**
 * Auto-calculate Shading Coefficient based on glass type
 */
function getAutoShadingCoefficient(glassType, shadingType) {
  const glassFactors = {
    'Single Clear 3mm': { noShade: 1.00, inside: 0.65, outside: 0.25 },
    'Single Clear 6mm': { noShade: 0.95, inside: 0.64, outside: 0.24 },
    'Double Clear': { noShade: 0.90, inside: 0.62, outside: 0.23 },
    'Heat Absorbing 6mm': { noShade: 0.69, inside: 0.50, outside: 0.17 },
    'Heat Absorbing 10mm': { noShade: 0.60, inside: 0.46, outside: 0.15 },
    'Reflective Light': { noShade: 0.40, inside: 0.35, outside: 0.12 },
    'Reflective Medium': { noShade: 0.30, inside: 0.28, outside: 0.10 },
    'Reflective Dark': { noShade: 0.20, inside: 0.20, outside: 0.08 },
    'Low-E Double': { noShade: 0.71, inside: 0.52, outside: 0.18 },
    'Low-E Triple': { noShade: 0.50, inside: 0.40, outside: 0.15 }
  };
  
  const factors = glassFactors[glassType] || glassFactors['Single Clear 6mm'];
  return factors[shadingType] || factors.noShade;
}

/**
 * Calculate heat transmission through walls with auto-calculation
 * @param {Object} params - Wall parameters
 * @returns {number} Heat gain in BTU/hr
 */
export function calculateWallHeatGain(params) {
  const {
    area,
    orientation,
    construction = '230mm Brick + Plaster',
    wallWeight = 'Medium',
    autoCalculate = true
  } = params;
  
  // Auto-calculate U-factor based on construction
  let uFactor;
  if (autoCalculate) {
    uFactor = getAutoWallUFactor(construction);
  } else {
    uFactor = WALL_U_FACTORS[construction] || 0.50;
  }
  
  // Auto-calculate CLTD based on orientation and wall weight
  let cltd;
  if (autoCalculate) {
    cltd = getAutoCLTD(orientation, wallWeight);
  } else {
    const cltdData = WALL_CLTD[wallWeight] || WALL_CLTD['Medium'];
    cltd = cltdData[orientation] || 15;
  }
  
  // Calculate heat gain: Q = U × A × CLTD
  const heatGain = uFactor * area * cltd;
  
  return Math.round(heatGain);
}

/**
 * Auto-calculate U-factor based on wall construction
 */
function getAutoWallUFactor(construction) {
  const constructionFactors = {
    // Brick walls
    '230mm Brick + Plaster': 0.60,
    '230mm Brick + 25mm Insulation + Plaster': 0.32,
    '115mm Brick + 50mm Insulation + 115mm Brick': 0.28,
    
    // Concrete walls
    '150mm RCC + Plaster': 0.70,
    '200mm RCC + Plaster': 0.65,
    '150mm RCC + 25mm Insulation + Plaster': 0.35,
    '200mm RCC + 50mm Insulation + Plaster': 0.25,
    
    // Concrete block walls
    '200mm Hollow Block + Plaster': 0.55,
    '200mm Hollow Block + Insulation + Plaster': 0.30,
    
    // Prefab/Metal walls
    'Metal Panel + 50mm Insulation': 0.40,
    'Metal Panel + 75mm Insulation': 0.28,
    'Sandwich Panel (50mm core)': 0.35,
    'Sandwich Panel (100mm core)': 0.22,
    
    // Glass curtain walls
    'Single Glazed Curtain Wall': 1.10,
    'Double Glazed Curtain Wall': 0.55,
    'Double Glazed Low-E Curtain Wall': 0.35,
    
    // Wood frame
    'Wood Frame + 50mm Insulation': 0.38,
    'Wood Frame + 75mm Insulation': 0.26
  };
  
  return constructionFactors[construction] || 0.50;
}

/**
 * Auto-calculate CLTD based on orientation and wall weight
 */
function getAutoCLTD(orientation, wallWeight) {
  const baseCLTD = {
    'Light': {
      'North': 12, 'Northeast': 15, 'East': 20, 'Southeast': 22,
      'South': 18, 'Southwest': 22, 'West': 20, 'Northwest': 15
    },
    'Medium': {
      'North': 10, 'Northeast': 13, 'East': 18, 'Southeast': 20,
      'South': 16, 'Southwest': 20, 'West': 18, 'Northwest': 13
    },
    'Heavy': {
      'North': 8, 'Northeast': 11, 'East': 16, 'Southeast': 18,
      'South': 14, 'Southwest': 18, 'West': 16, 'Northwest': 11
    }
  };
  
  const weightData = baseCLTD[wallWeight] || baseCLTD['Medium'];
  return weightData[orientation] || 15;
}

/**
 * Calculate heat transmission through roof
 * @param {Object} params - Roof parameters
 * @returns {number} Heat gain in BTU/hr
 */
export function calculateRoofHeatGain(params) {
  const {
    area,
    construction = '150mm RCC + Waterproofing',
    surfaceType = 'Medium Surface'
  } = params;
  
  // Get U-factor
  const uFactor = ROOF_U_FACTORS[construction] || 0.50;
  
  // Get CLTD
  const cltd = ROOF_CLTD[surfaceType] || 35;
  
  // Calculate heat gain: Q = U × A × CLTD
  const heatGain = uFactor * area * cltd;
  
  return Math.round(heatGain);
}

/**
 * Calculate heat gain from occupants
 * @param {Object} params - Occupancy parameters
 * @returns {Object} Sensible and latent heat gains
 */
export function calculateOccupantHeatGain(params) {
  const {
    occupancy,
    activityLevel = 'Seated, Light Work',
    roomType = 'Office'
  } = params;
  
  // Get heat gain per person
  const heatData = OCCUPANT_HEAT_GAINS[activityLevel] || OCCUPANT_HEAT_GAINS[roomType] || OCCUPANT_HEAT_GAINS['Office'];
  
  return {
    sensible: Math.round(occupancy * heatData.sensible),
    latent: Math.round(occupancy * heatData.latent),
    total: Math.round(occupancy * heatData.total)
  };
}

/**
 * Calculate heat gain from lighting
 * @param {Object} params - Lighting parameters
 * @returns {number} Heat gain in BTU/hr
 */
export function calculateLightingHeatGain(params) {
  const {
    watts,
    lightingType = 'LED',
    useFactor = 1.0,
    ballastFactor = 1.0
  } = params;
  
  // Get lighting factor
  const factor = LIGHTING_FACTORS[lightingType] || LIGHTING_FACTORS['LED'];
  
  // Calculate heat gain
  const heatGain = watts * factor * useFactor * ballastFactor;
  
  return Math.round(heatGain);
}

/**
 * Calculate heat gain from equipment
 * @param {Object} params - Equipment parameters
 * @returns {number} Heat gain in BTU/hr
 */
export function calculateEquipmentHeatGain(params) {
  const {
    watts,
    useFactor = 0.75,
    diversityFactor = 0.85
  } = params;
  
  // Convert watts to BTU/hr
  const heatGain = watts * 3.412 * useFactor * diversityFactor;
  
  return Math.round(heatGain);
}

/**
 * Calculate ventilation load
 * @param {Object} params - Ventilation parameters
 * @returns {Object} Sensible and latent ventilation loads
 */
export function calculateVentilationLoad(params) {
  const {
    cfm,
    outdoorTemp,
    indoorTemp,
    outdoorHumidity, // grains per lb
    indoorHumidity // grains per lb
  } = params;
  
  // Sensible load: Q_s = 1.08 × CFM × ΔT
  const sensibleLoad = 1.08 * cfm * (outdoorTemp - indoorTemp);
  
  // Latent load: Q_l = 0.68 × CFM × Δω
  const latentLoad = 0.68 * cfm * (outdoorHumidity - indoorHumidity);
  
  return {
    sensible: Math.round(sensibleLoad),
    latent: Math.round(latentLoad),
    total: Math.round(sensibleLoad + latentLoad)
  };
}

/**
 * Calculate infiltration load
 * @param {Object} params - Infiltration parameters
 * @returns {Object} Sensible and latent infiltration loads
 */
export function calculateInfiltrationLoad(params) {
  const {
    area,
    infiltrationRate = 0.05, // CFM per sq.ft
    outdoorTemp,
    indoorTemp,
    outdoorHumidity,
    indoorHumidity
  } = params;
  
  const cfm = area * infiltrationRate;
  
  return calculateVentilationLoad({
    cfm,
    outdoorTemp,
    indoorTemp,
    outdoorHumidity,
    indoorHumidity
  });
}

/**
 * Calculate required ventilation CFM
 * @param {Object} params - Room parameters
 * @returns {number} Required CFM
 */
export function calculateRequiredVentilation(params) {
  const {
    occupancy,
    area,
    roomType = 'Default',
    height = 10 // ceiling height in feet
  } = params;
  
  // Get ventilation requirements
  const ventReq = VENTILATION_REQUIREMENTS[roomType] || VENTILATION_REQUIREMENTS['Default'];
  
  // Calculate based on occupancy and area
  const cfmPeople = occupancy * ventReq.cfmPerPerson;
  const cfmArea = area * ventReq.cfmPerSqFt;
  
  // Take the larger of the two
  let totalCFM = Math.max(cfmPeople, cfmArea);
  
  // Check minimum ACH if specified
  if (ventReq.minACH) {
    const volume = area * height;
    const cfmACH = (volume * ventReq.minACH) / 60;
    totalCFM = Math.max(totalCFM, cfmACH);
  }
  
  return Math.round(totalCFM);
}

/**
 * Calculate complete room heat load
 * @param {Object} roomData - Complete room data
 * @returns {Object} Complete heat load breakdown
 */
export function calculateCompleteRoomLoad(roomData) {
  const {
    // Room properties
    area,
    height = 10,
    occupancy,
    roomType = 'Office',
    
    // Environmental conditions
    outdoorTemp,
    indoorTemp,
    outdoorHumidity,
    indoorHumidity,
    latitude = '20N',
    
    // Building envelope
    windows = [],
    walls = [],
    roof = null,
    floor = null,
    
    // Internal loads
    lightingWatts = 0,
    equipmentWatts = 0,
    
    // Factors
    safetyFactor = 1.1,
    diversityFactor = 0.85
  } = roomData;
  
  const loads = {
    // Solar gains
    solarGlass: 0,
    
    // Transmission gains
    wallTransmission: 0,
    roofTransmission: 0,
    floorTransmission: 0,
    glassConduction: 0,
    
    // Internal gains
    occupantSensible: 0,
    occupantLatent: 0,
    lightingGain: 0,
    equipmentGain: 0,
    
    // Ventilation and infiltration
    ventilationSensible: 0,
    ventilationLatent: 0,
    infiltrationSensible: 0,
    infiltrationLatent: 0,
    
    // Ventilation CFM
    ventilationCFM: 0,
    infiltrationCFM: 0
  };
  
  // 1. Solar heat gain through windows
  windows.forEach(window => {
    loads.solarGlass += calculateSolarHeatGain({
      area: window.area,
      orientation: window.orientation,
      glassType: window.glassType,
      shadingType: window.shadingType,
      latitude
    });
    
    // Glass conduction
    const glassU = 0.55; // Typical for double glazed
    loads.glassConduction += glassU * window.area * (outdoorTemp - indoorTemp);
  });
  
  // 2. Wall heat transmission
  walls.forEach(wall => {
    loads.wallTransmission += calculateWallHeatGain({
      area: wall.area,
      orientation: wall.orientation,
      construction: wall.construction,
      wallWeight: wall.weight || 'Medium',
      outdoorTemp,
      indoorTemp
    });
  });
  
  // 3. Roof heat transmission
  if (roof) {
    loads.roofTransmission = calculateRoofHeatGain({
      area: roof.area,
      construction: roof.construction,
      surfaceType: roof.surfaceType,
      outdoorTemp,
      indoorTemp
    });
  }
  
  // 4. Floor transmission (if applicable)
  if (floor && floor.exposed) {
    const floorU = FLOOR_U_FACTORS[floor.construction] || 0.35;
    const tempDiff = floor.adjacentTemp - indoorTemp;
    loads.floorTransmission = floorU * floor.area * tempDiff;
  }
  
  // 5. Occupant heat gain
  const occupantGains = calculateOccupantHeatGain({
    occupancy,
    activityLevel: roomData.activityLevel,
    roomType
  });
  loads.occupantSensible = occupantGains.sensible;
  loads.occupantLatent = occupantGains.latent;
  
  // 6. Lighting heat gain
  loads.lightingGain = calculateLightingHeatGain({
    watts: lightingWatts || (area * 1.5), // 1.5 W/sq.ft default
    lightingType: roomData.lightingType || 'LED',
    useFactor: roomData.lightingUseFactor || 0.9
  });
  
  // 7. Equipment heat gain
  loads.equipmentGain = calculateEquipmentHeatGain({
    watts: equipmentWatts || (area * 2.0), // 2.0 W/sq.ft default
    useFactor: roomData.equipmentUseFactor || 0.75,
    diversityFactor
  });
  
  // 8. Ventilation
  loads.ventilationCFM = calculateRequiredVentilation({
    occupancy,
    area,
    roomType,
    height
  });
  
  const ventLoad = calculateVentilationLoad({
    cfm: loads.ventilationCFM,
    outdoorTemp,
    indoorTemp,
    outdoorHumidity,
    indoorHumidity
  });
  loads.ventilationSensible = ventLoad.sensible;
  loads.ventilationLatent = ventLoad.latent;
  
  // 9. Infiltration
  loads.infiltrationCFM = Math.round(area * 0.05); // 0.05 CFM/sq.ft typical
  
  const infLoad = calculateInfiltrationLoad({
    area,
    infiltrationRate: 0.05,
    outdoorTemp,
    indoorTemp,
    outdoorHumidity,
    indoorHumidity
  });
  loads.infiltrationSensible = infLoad.sensible;
  loads.infiltrationLatent = infLoad.latent;
  
  // Calculate totals
  const totalSensible = 
    loads.solarGlass +
    loads.wallTransmission +
    loads.roofTransmission +
    loads.floorTransmission +
    loads.glassConduction +
    loads.occupantSensible +
    loads.lightingGain +
    loads.equipmentGain +
    loads.ventilationSensible +
    loads.infiltrationSensible;
  
  const totalLatent = 
    loads.occupantLatent +
    loads.ventilationLatent +
    loads.infiltrationLatent;
  
  const grandTotal = totalSensible + totalLatent;
  const adjustedTotal = grandTotal * safetyFactor;
  
  // Calculate room sensible heat factor
  const rshf = totalSensible / grandTotal;
  
  // Calculate tonnage
  const tonnage = adjustedTotal / 12000;
  
  return {
    loads,
    totals: {
      sensible: Math.round(totalSensible),
      latent: Math.round(totalLatent),
      grandTotal: Math.round(grandTotal),
      adjustedTotal: Math.round(adjustedTotal),
      safetyFactor,
      tonnage: Math.round(tonnage * 100) / 100,
      rshf: Math.round(rshf * 100) / 100
    },
    airflow: {
      ventilationCFM: loads.ventilationCFM,
      infiltrationCFM: loads.infiltrationCFM,
      totalCFM: loads.ventilationCFM + loads.infiltrationCFM
    }
  };
}

/**
 * Calculate diversity factor based on building type and number of units
 * @param {string} buildingType - Type of building
 * @param {number} units - Number of units/rooms
 * @returns {number} Diversity factor (0-1)
 */
export function calculateDiversityFactor(buildingType, units) {
  const factors = {
    'Apartment Building': {
      base: 0.70,
      reduction: 0.05,
      minUnits: 10,
      maxReduction: 0.25
    },
    'Office Building': {
      base: 0.85,
      reduction: 0.03,
      minUnits: 5,
      maxReduction: 0.15
    },
    'Hotel': {
      base: 0.75,
      reduction: 0.04,
      minUnits: 20,
      maxReduction: 0.20
    },
    'Hospital': {
      base: 0.90,
      reduction: 0.02,
      minUnits: 15,
      maxReduction: 0.10
    },
    'Shopping Mall': {
      base: 0.80,
      reduction: 0.05,
      minUnits: 10,
      maxReduction: 0.20
    },
    'School': {
      base: 0.85,
      reduction: 0.03,
      minUnits: 10,
      maxReduction: 0.15
    }
  };
  
  const config = factors[buildingType] || { base: 0.85, reduction: 0.03, minUnits: 10, maxReduction: 0.15 };
  
  if (units < config.minUnits) {
    return config.base;
  }
  
  const additionalReduction = Math.min(
    (units - config.minUnits) * config.reduction / 10,
    config.maxReduction
  );
  
  return Math.max(config.base - additionalReduction, 0.65);
}

export default {
  // Calculation functions
  calculateSolarHeatGain,
  calculateWallHeatGain,
  calculateRoofHeatGain,
  calculateOccupantHeatGain,
  calculateLightingHeatGain,
  calculateEquipmentHeatGain,
  calculateVentilationLoad,
  calculateInfiltrationLoad,
  calculateRequiredVentilation,
  calculateCompleteRoomLoad,
  calculateDiversityFactor,
  
  // Data exports
  SOLAR_HEAT_GAIN_FACTORS,
  SHADING_COEFFICIENTS,
  WALL_U_FACTORS,
  ROOF_U_FACTORS,
  FLOOR_U_FACTORS,
  WALL_CLTD,
  ROOF_CLTD,
  OCCUPANT_HEAT_GAINS,
  LIGHTING_FACTORS,
  EQUIPMENT_HEAT_GAINS,
  VENTILATION_REQUIREMENTS
};