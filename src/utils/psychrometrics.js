/**
 * Comprehensive Psychrometric Calculations
 * Following ISHRAE (Indian Society of Heating, Refrigerating and Air Conditioning Engineers)
 * and ASHRAE (American Society of Heating, Refrigerating and Air-Conditioning Engineers) Standards
 * 
 * References:
 * - ISHRAE Handbook of Air Conditioning and Refrigeration
 * - ASHRAE Fundamentals Handbook
 * - ASHRAE Standard 55 (Thermal Environmental Conditions)
 * - IS 1391 (Indian Standard for Air Conditioning)
 */

// Constants for psychrometric calculations
const CONSTANTS = {
  // Standard atmospheric pressure at sea level (psia)
  STANDARD_PRESSURE: 14.696, // psia
  STANDARD_PRESSURE_PA: 101325, // Pa
  
  // Gas constant for water vapor
  R_WATER_VAPOR: 461.5, // J/(kg·K)
  
  // Specific heat constants
  CP_AIR: 1.006, // kJ/(kg·K) - specific heat of dry air
  CP_WATER_VAPOR: 1.86, // kJ/(kg·K) - specific heat of water vapor
  
  // Latent heat of vaporization at 0°C
  HFG_0: 2501.3, // kJ/kg
  
  // Temperature conversion
  KELVIN_OFFSET: 273.15,
  
  // Pressure conversion
  MMHG_TO_PA: 133.322,
  INHG_TO_PA: 3386.39,
};

/**
 * Indian Climate Data based on ISHRAE Standards
 * Design conditions for major Indian cities
 */
export const INDIAN_CLIMATE_DATA = {
  // Northern India
  'Delhi': {
    summer: { db: 113, wb: 84.2, rh: 35 }, // May
    monsoon: { db: 95, wb: 86, rh: 75 }, // July
    winter: { db: 77, wb: 59, rh: 55 }, // January
    elevation: 216, // meters
    latitude: 28.6,
    longitude: 77.2
  },
  'Mumbai': {
    summer: { db: 91.4, wb: 82.4, rh: 75 }, // May
    monsoon: { db: 86, wb: 82, rh: 85 }, // July
    winter: { db: 86, wb: 68, rh: 60 }, // January
    elevation: 11,
    latitude: 19.1,
    longitude: 72.9
  },
  'Kolkata': {
    summer: { db: 100.4, wb: 86, rh: 70 }, // May
    monsoon: { db: 91.4, wb: 86, rh: 85 }, // July
    winter: { db: 82.4, wb: 64.4, rh: 65 }, // January
    elevation: 6,
    latitude: 22.6,
    longitude: 88.4
  },
  'Chennai': {
    summer: { db: 100.4, wb: 84.2, rh: 65 }, // May
    monsoon: { db: 95, wb: 84.2, rh: 80 }, // October
    winter: { db: 86, wb: 75.2, rh: 70 }, // January
    elevation: 6,
    latitude: 13.1,
    longitude: 80.3
  },
  'Bangalore': {
    summer: { db: 95, wb: 73.4, rh: 55 }, // April
    monsoon: { db: 82.4, wb: 73.4, rh: 80 }, // July
    winter: { db: 82.4, wb: 64.4, rh: 60 }, // January
    elevation: 920,
    latitude: 12.9,
    longitude: 77.6
  },
  'Hyderabad': {
    summer: { db: 109.4, wb: 82.4, rh: 45 }, // May
    monsoon: { db: 91.4, wb: 80.6, rh: 75 }, // July
    winter: { db: 86, wb: 64.4, rh: 55 }, // January
    elevation: 542,
    latitude: 17.4,
    longitude: 78.5
  },
  'Pune': {
    summer: { db: 104, wb: 77, rh: 45 }, // April
    monsoon: { db: 86, wb: 78.8, rh: 80 }, // July
    winter: { db: 86, wb: 59, rh: 50 }, // January
    elevation: 560,
    latitude: 18.5,
    longitude: 73.9
  },
  'Ahmedabad': {
    summer: { db: 113, wb: 82.4, rh: 35 }, // May
    monsoon: { db: 95, wb: 84.2, rh: 70 }, // July
    winter: { db: 86, wb: 59, rh: 50 }, // January
    elevation: 53,
    latitude: 23.0,
    longitude: 72.6
  },
  'Jaipur': {
    summer: { db: 113, wb: 82.4, rh: 30 }, // May
    monsoon: { db: 100.4, wb: 84.2, rh: 65 }, // July
    winter: { db: 77, wb: 55.4, rh: 50 }, // January
    elevation: 431,
    latitude: 26.9,
    longitude: 75.8
  },
  'Lucknow': {
    summer: { db: 113, wb: 86, rh: 40 }, // May
    monsoon: { db: 95, wb: 86, rh: 80 }, // July
    winter: { db: 77, wb: 59, rh: 60 }, // January
    elevation: 123,
    latitude: 26.8,
    longitude: 80.9
  }
};

/**
 * ASHRAE Standard Indoor Conditions
 * Based on ASHRAE Standard 55 and ISHRAE recommendations
 */
export const STANDARD_INDOOR_CONDITIONS = {
  // ASHRAE Standard 55 - Thermal Environmental Conditions for Human Occupancy
  'GENERAL_COMFORT': {
    summer: { db: 75.2, rh: 50, wb: 62.6 }, // 24°C, 50% RH
    winter: { db: 71.6, rh: 50, wb: 59.0 }, // 22°C, 50% RH
    description: 'Offices, Residences, Hotels, Hospitals'
  },
  'RETAIL_SHOPS': {
    summer: { db: 75.2, rh: 50, wb: 62.6 }, // 24°C, 50% RH
    winter: { db: 71.6, rh: 50, wb: 59.0 }, // 22°C, 50% RH
    description: 'Department Stores, Banks, Supermarkets'
  },
  'LOW_SENSIBLE_HEAT_FACTORS': {
    summer: { db: 75.2, rh: 60, wb: 66.2 }, // 24°C, 60% RH
    winter: { db: 71.6, rh: 60, wb: 62.6 }, // 22°C, 60% RH
    description: 'Restaurants, Kitchens, Auditoriums, Theaters'
  },
  'FACTORY_COMFORT': {
    summer: { db: 78.8, rh: 45, wb: 64.4 }, // 26°C, 45% RH
    winter: { db: 68, rh: 45, wb: 55.4 }, // 20°C, 45% RH
    description: 'Light Manufacturing, Assembly Areas'
  },
  'DATA_CENTER': {
    summer: { db: 75.2, rh: 45, wb: 61.7 }, // 24°C, 45% RH
    winter: { db: 75.2, rh: 45, wb: 61.7 }, // 24°C, 45% RH
    description: 'Server Rooms, Computer Centers'
  },
  'PRECISION_MANUFACTURING': {
    summer: { db: 73.4, rh: 45, wb: 59.9 }, // 23°C, 45% RH
    winter: { db: 73.4, rh: 45, wb: 59.9 }, // 23°C, 45% RH
    description: 'Clean Rooms, Precision Assembly'
  }
};

/**
 * Calculate saturation pressure using Antoine equation
 * More accurate than Magnus formula for HVAC applications
 * @param {number} tempF - Temperature in Fahrenheit
 * @returns {number} Saturation pressure in psia
 */
export function calculateSaturationPressure(tempF) {
  const tempC = (tempF - 32) * 5/9;
  
  // Antoine equation constants for water (valid 1-100°C)
  const A = 8.07131;
  const B = 1730.63;
  const C = 233.426;
  
  // Calculate saturation pressure in mmHg
  const logPsat = A - (B / (tempC + C));
  const psatMmHg = Math.pow(10, logPsat);
  
  // Convert to psia
  const psatPsia = psatMmHg * CONSTANTS.MMHG_TO_PA / 6895; // Convert to psia
  
  return psatPsia;
}

/**
 * Calculate humidity ratio (grains per lb) from dry bulb and relative humidity
 * Using verified moisture content formula
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} rh - Relative humidity (%)
 * @param {number} pressure - Atmospheric pressure (kPa, default 101.325)
 * @returns {number} Humidity ratio (grains/lb dry air)
 */
export function calculateHumidityRatio(dbF, rh, pressure = 101.325) {
  // Calculate dew point first
  const dewPointF = calculateDewPoint(dbF, rh);
  const dewPointC = (dewPointF - 32) * 5/9;
  
  // Calculate saturation vapor pressure at dew point using verified formula
  const e = 0.61078 * Math.exp((17.27 * dewPointC) / (dewPointC + 237.3)); // kPa
  
  // Calculate moisture content (kg water / kg dry air)
  const W = 0.621945 * e / (pressure - e);
  
  // Convert to grains per pound (1 kg/kg = 7000 grains/lb)
  return W * 7000;
}

/**
 * Calculate relative humidity from dry bulb and humidity ratio
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} humidityRatio - Humidity ratio (grains/lb)
 * @param {number} pressure - Atmospheric pressure (psia)
 * @returns {number} Relative humidity (%)
 */
export function calculateRelativeHumidity(dbF, humidityRatio, pressure = CONSTANTS.STANDARD_PRESSURE) {
  const w = humidityRatio / 7000; // Convert to lb/lb
  const pws = calculateSaturationPressure(dbF);
  
  // Partial pressure of water vapor
  const pw = (w * pressure) / (0.62198 + w);
  
  // Relative humidity
  const rh = (pw / pws) * 100;
  
  return Math.min(100, Math.max(0, rh));
}

/**
 * Calculate dew point temperature from dry bulb and relative humidity
 * Using Magnus formula (verified accurate)
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} rh - Relative humidity (%)
 * @returns {number} Dew point temperature (°F)
 */
export function calculateDewPoint(dbF, rh) {
  // Convert to Celsius
  const dbC = (dbF - 32) * 5/9;
  
  // Magnus formula for dew point
  const alpha = (17.27 * dbC) / (237.3 + dbC) + Math.log(rh / 100);
  const dewPointC = (237.3 * alpha) / (17.27 - alpha);
  
  // Convert back to Fahrenheit
  return dewPointC * 9/5 + 32;
}

/**
 * Calculate wet bulb temperature from dry bulb and relative humidity
 * Using Stull (2011) empirical approximation formula
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} rh - Relative humidity (%)
 * @returns {number} Wet bulb temperature (°F)
 */
export function calculateWetBulb(dbF, rh) {
  // Convert to Celsius for Stull formula
  const dbC = (dbF - 32) * 5/9;
  
  // Stull (2011) empirical wet-bulb approximation formula
  const wbC = dbC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
              Math.atan(dbC + rh) - Math.atan(rh - 1.676331) +
              0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
  
  // Convert back to Fahrenheit
  return wbC * 9/5 + 32;
}

/**
 * Calculate enthalpy of moist air
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} humidityRatio - Humidity ratio (grains/lb)
 * @returns {number} Enthalpy (Btu/lb dry air)
 */
export function calculateEnthalpy(dbF, humidityRatio) {
  const w = humidityRatio / 7000; // Convert to lb/lb
  
  // Enthalpy calculation (Btu/lb dry air)
  const h = 0.240 * dbF + w * (1061 + 0.444 * dbF);
  
  return h;
}

/**
 * Calculate specific volume of moist air
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} humidityRatio - Humidity ratio (grains/lb)
 * @param {number} pressure - Atmospheric pressure (psia)
 * @returns {number} Specific volume (ft³/lb dry air)
 */
export function calculateSpecificVolume(dbF, humidityRatio, pressure = CONSTANTS.STANDARD_PRESSURE) {
  const dbR = dbF + 459.67; // Convert to Rankine
  const w = humidityRatio / 7000; // Convert to lb/lb
  
  // Specific volume calculation
  const v = 0.754 * dbR * (1 + 1.608 * w) / pressure;
  
  return v;
}

/**
 * Calculate relative humidity from dry bulb and wet bulb temperatures
 * Using iterative method to find RH that produces the given wet bulb
 * @param {number} dbF - Dry bulb temperature (°F)
 * @param {number} wbF - Wet bulb temperature (°F)
 * @returns {number} Relative humidity (%)
 */
export function calculateRHFromWetBulb(dbF, wbF) {
  if (wbF > dbF) {
    throw new Error('Wet bulb temperature cannot exceed dry bulb temperature');
  }
  
  let rhLow = 0;
  let rhHigh = 100;
  let rh = 50;
  let iteration = 0;
  const maxIterations = 50;
  const tolerance = 0.01;
  
  while (iteration < maxIterations) {
    const calculatedWB = calculateWetBulb(dbF, rh);
    const error = calculatedWB - wbF;
    
    if (Math.abs(error) < tolerance) {
      break;
    }
    
    if (error > 0) {
      // Calculated WB is too high, reduce RH
      rhHigh = rh;
      rh = (rhLow + rh) / 2;
    } else {
      // Calculated WB is too low, increase RH
      rhLow = rh;
      rh = (rh + rhHigh) / 2;
    }
    
    iteration++;
  }
  
  return Math.max(0, Math.min(100, rh));
}

/**
 * Complete psychrometric calculation from various input combinations
 * Using verified formulas for accurate calculations
 * @param {Object} input - Input properties (need at least two of: dbF, wbF, rh)
 * @param {number} pressure - Atmospheric pressure (kPa, default 101.325)
 * @returns {Object} Complete psychrometric properties
 */
export function calculatePsychrometrics(input, pressure = 101.325) {
  let dbF, wbF, rh, dewPoint, humidityRatio;
  
  // Determine what inputs we have and calculate missing properties
  if (input.dbF !== undefined && input.rh !== undefined) {
    // Dry bulb and relative humidity given (most common case)
    dbF = input.dbF;
    rh = input.rh;
    wbF = calculateWetBulb(dbF, rh);
    dewPoint = calculateDewPoint(dbF, rh);
    humidityRatio = calculateHumidityRatio(dbF, rh, pressure);
  } else if (input.dbF !== undefined && input.wbF !== undefined) {
    // Dry bulb and wet bulb given
    dbF = input.dbF;
    wbF = input.wbF;
    rh = calculateRHFromWetBulb(dbF, wbF);
    dewPoint = calculateDewPoint(dbF, rh);
    humidityRatio = calculateHumidityRatio(dbF, rh, pressure);
  } else {
    throw new Error('Need at least two properties: dry bulb + (wet bulb OR relative humidity)');
  }
  
  // Calculate additional properties
  const enthalpy = calculateEnthalpy(dbF, humidityRatio);
  const specificVolume = calculateSpecificVolume(dbF, humidityRatio, pressure * 0.145037738); // Convert kPa to psia for volume calc
  
  return {
    dbF: Number(dbF.toFixed(1)),
    wbF: Number(wbF.toFixed(3)),
    rh: Number(rh.toFixed(1)),
    dewPoint: Number(dewPoint.toFixed(2)),
    humidityRatio: Number(humidityRatio.toFixed(1)),
    enthalpy: Number(enthalpy.toFixed(2)),
    specificVolume: Number(specificVolume.toFixed(3)),
    pressure: pressure
  };
}

/**
 * Get climate data for a specific city and season
 * @param {string} city - City name
 * @param {string} season - Season (summer, monsoon, winter)
 * @returns {Object} Climate data with complete psychrometric properties
 */
export function getClimateData(city, season = 'summer') {
  const cityData = INDIAN_CLIMATE_DATA[city];
  if (!cityData) {
    throw new Error(`Climate data not available for ${city}`);
  }
  
  const seasonData = cityData[season];
  if (!seasonData) {
    throw new Error(`Season data not available for ${city} - ${season}`);
  }
  
  // Calculate complete psychrometric properties
  const psychrometrics = calculatePsychrometrics({
    dbF: seasonData.db,
    wbF: seasonData.wb
  });
  
  return {
    ...psychrometrics,
    city,
    season,
    elevation: cityData.elevation,
    latitude: cityData.latitude,
    longitude: cityData.longitude
  };
}

/**
 * Get standard indoor conditions for a specific application
 * @param {string} application - Application type
 * @returns {Object} Indoor conditions with complete psychrometric properties
 */
export function getStandardIndoorConditions(application) {
  const standardData = STANDARD_INDOOR_CONDITIONS[application];
  if (!standardData) {
    throw new Error(`Standard conditions not available for ${application}`);
  }
  
  // Calculate complete psychrometric properties for summer conditions
  const psychrometrics = calculatePsychrometrics({
    dbF: standardData.summer.db,
    rh: standardData.summer.rh
  });
  
  return {
    ...psychrometrics,
    application,
    description: standardData.description,
    winterConditions: standardData.winter
  };
}

export default {
  calculatePsychrometrics,
  getClimateData,
  getStandardIndoorConditions,
  INDIAN_CLIMATE_DATA,
  STANDARD_INDOOR_CONDITIONS
};
