/**
 * HVAC Standards and Constants
 * Based on ASHRAE, ISHRAE, and industry standards
 */

// Building Types and Their Characteristics
export const BUILDING_TYPES = {
  OFFICE: {
    type: 'OFFICE',
    subTypes: ['Open Plan', 'Private Offices', 'Conference', 'Meeting Rooms'],
    occupancyDensity: 100, // sq.ft per person
    activityLevel: 'Light Office Work',
    operatingHours: [9, 18], // 9 AM to 6 PM
    defaultTemp: 74, // °F
    defaultRH: 50, // %
    minFreshAir: 20, // CFM/person
    diversityFactor: 0.85
  },
  RETAIL: {
    type: 'RETAIL',
    subTypes: ['Mall', 'Showroom', 'Supermarket', 'Small Shop'],
    occupancyDensity: 60,
    activityLevel: 'Standing, Light Work',
    operatingHours: [10, 22],
    defaultTemp: 75,
    defaultRH: 55,
    minFreshAir: 15,
    diversityFactor: 0.80
  },
  HEALTHCARE: {
    type: 'HEALTHCARE',
    subTypes: ['Patient Rooms', 'ICU', 'OT', 'Pharmacy', 'Laboratory'],
    occupancyDensity: 200,
    activityLevel: 'Hospital Work',
    operatingHours: [0, 23], // 24 hours
    defaultTemp: 72,
    defaultRH: 45,
    minFreshAir: 25,
    diversityFactor: 0.90,
    specialRequirements: {
      OT: {
        filtration: 'HEPA',
        pressurization: 'Positive',
        airChanges: 15
      },
      ICU: {
        filtration: 'HEPA',
        pressurization: 'Positive',
        airChanges: 12
      }
    }
  },
  RESIDENTIAL: {
    type: 'RESIDENTIAL',
    subTypes: ['Apartment', 'Villa', 'Studio'],
    occupancyDensity: 250,
    activityLevel: 'Residential Activity',
    operatingHours: [0, 23],
    defaultTemp: 76,
    defaultRH: 55,
    minFreshAir: 15,
    diversityFactor: 0.75
  },
  EDUCATIONAL: {
    type: 'EDUCATIONAL',
    subTypes: ['Classroom', 'Library', 'Laboratory', 'Auditorium'],
    occupancyDensity: 40,
    activityLevel: 'Seated, Light Work',
    operatingHours: [8, 17],
    defaultTemp: 75,
    defaultRH: 55,
    minFreshAir: 15,
    diversityFactor: 0.85
  }
};

// Activity Levels and Heat Generation
export const ACTIVITY_LEVELS = {
  'Seated at Rest': { sensible: 225, latent: 105 },
  'Light Office Work': { sensible: 250, latent: 200 },
  'Standing, Light Work': { sensible: 275, latent: 475 },
  'Walking': { sensible: 305, latent: 495 },
  'Heavy Work': { sensible: 580, latent: 870 },
  'Hospital Work': { sensible: 270, latent: 270 },
  'Dancing': { sensible: 305, latent: 545 },
  'Athletic': { sensible: 710, latent: 1090 },
  'Residential Activity': { sensible: 230, latent: 190 }
};

// Equipment Types and Heat Generation
export const EQUIPMENT_HEAT_GAINS = {
  'Desktop Computer': { watts: 65, diversity: 0.75 },
  'Laptop': { watts: 40, diversity: 0.75 },
  'Printer (Idle)': { watts: 50, diversity: 0.2 },
  'Printer (Active)': { watts: 400, diversity: 0.1 },
  'Copier (Idle)': { watts: 100, diversity: 0.2 },
  'Copier (Active)': { watts: 1500, diversity: 0.1 },
  'Coffee Maker': { watts: 400, diversity: 0.2 },
  'Microwave': { watts: 1000, diversity: 0.15 },
  'TV/Monitor': { watts: 150, diversity: 0.7 },
  'Server': { watts: 500, diversity: 1.0 }
};

// Lighting Types and Heat Factors
export const LIGHTING_TYPES = {
  'LED': {
    watts_per_sqft: 0.8,
    ballast_factor: 1.0,
    usage_factor: 1.0
  },
  'Fluorescent T5': {
    watts_per_sqft: 1.2,
    ballast_factor: 1.1,
    usage_factor: 1.0
  },
  'Fluorescent T8': {
    watts_per_sqft: 1.5,
    ballast_factor: 1.1,
    usage_factor: 1.0
  },
  'Metal Halide': {
    watts_per_sqft: 2.0,
    ballast_factor: 1.15,
    usage_factor: 1.0
  }
};

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
    cop_heating: 4.5
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
    simultaneous_operation: true
  }
};

// Indoor Unit Types
export const INDOOR_UNIT_TYPES = {
  'Wall Mounted': {
    capacities: [0.75, 1.0, 1.5, 2.0], // tons
    minHeight: 7, // feet
    maxHeight: 11,
    airflow_cfm_per_ton: 400,
    sound_level_db: 35
  },
  '4-Way Cassette': {
    capacities: [1.5, 2.0, 2.5, 3.0],
    minHeight: 9,
    maxHeight: 14,
    airflow_cfm_per_ton: 450,
    sound_level_db: 38
  },
  'Ducted': {
    capacities: [1.0, 1.5, 2.0, 2.5, 3.0, 4.0],
    minHeight: 10,
    maxHeight: 20,
    airflow_cfm_per_ton: 400,
    sound_level_db: 40,
    external_static_pressure: 0.8 // inches WG
  },
  'Floor Standing': {
    capacities: [1.0, 1.5, 2.0, 2.5],
    minHeight: 0,
    maxHeight: 12,
    airflow_cfm_per_ton: 380,
    sound_level_db: 42
  }
};

// Fresh Air Requirements (ASHRAE 62.1)
export const FRESH_AIR_REQUIREMENTS = {
  'Office': {
    per_person: 5, // CFM/person
    per_area: 0.06, // CFM/sq.ft
    occupant_density: 5 // people/1000 sq.ft
  },
  'Conference': {
    per_person: 5,
    per_area: 0.06,
    occupant_density: 50
  },
  'Classroom': {
    per_person: 10,
    per_area: 0.12,
    occupant_density: 35
  },
  'Patient Room': {
    per_person: 10,
    per_area: 0.06,
    occupant_density: 10
  },
  'Retail': {
    per_person: 7.5,
    per_area: 0.12,
    occupant_density: 15
  },
  'Restaurant': {
    per_person: 7.5,
    per_area: 0.18,
    occupant_density: 70
  }
};

// Typical Room Pressurization Requirements
export const ROOM_PRESSURIZATION = {
  'Patient Room': { pressure: 'Neutral', minACH: 6 },
  'Operating Room': { pressure: 'Positive', minACH: 20 },
  'Isolation Room': { pressure: 'Negative', minACH: 12 },
  'Clean Room': { pressure: 'Positive', minACH: 30 },
  'Laboratory': { pressure: 'Negative', minACH: 10 },
  'Pharmacy': { pressure: 'Positive', minACH: 8 }
};