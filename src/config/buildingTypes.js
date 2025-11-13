// Building Types Configuration for Multi-Building Support
export const BUILDING_TYPES = {
  // Residential Buildings
  SINGLE_FAMILY_HOME: {
    id: 'single_family_home',
    name: 'Single Family Home',
    description: 'Individual residential dwelling',
    categories: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Basement', 'Attic'],
    defaultOccupancy: {
      livingRoom: 4,
      bedroom: 2,
      kitchen: 2,
      bathroom: 1
    },
    typicalLoads: {
      lighting: 1.5, // W/sq ft
      equipment: 1.0, // W/sq ft
      ventilation: 0.35 // CFM/sq ft
    }
  },

  APARTMENT: {
    id: 'apartment',
    name: 'Apartment',
    description: 'Multi-unit residential building',
    categories: ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Penthouse', 'Common Areas'],
    defaultOccupancy: {
      studio: 1,
      '1_bedroom': 2,
      '2_bedroom': 3,
      '3_bedroom': 4,
      penthouse: 4,
      'common_areas': 10
    },
    typicalLoads: {
      lighting: 1.2,
      equipment: 2.0,
      ventilation: 0.4
    }
  },

  CONDOMINIUM: {
    id: 'condominium',
    name: 'Condominium',
    description: 'Individually owned residential units',
    categories: ['Unit', 'Common Areas', 'Amenities'],
    defaultOccupancy: {
      unit: 3,
      'common_areas': 20,
      amenities: 15
    },
    typicalLoads: {
      lighting: 1.3,
      equipment: 1.8,
      ventilation: 0.38
    }
  },

  // Commercial Buildings
  OFFICE_BUILDING: {
    id: 'office_building',
    name: 'Office Building',
    description: 'Commercial office space',
    categories: ['Open Office', 'Private Office', 'Conference Room', 'Lobby', 'Server Room'],
    defaultOccupancy: {
      'open_office': 50,
      'private_office': 8,
      'conference_room': 20,
      lobby: 25,
      'server_room': 2
    },
    typicalLoads: {
      lighting: 1.5,
      equipment: 5.0, // High equipment load
      ventilation: 0.45
    }
  },

  RETAIL_SHOP: {
    id: 'retail_shop',
    name: 'Retail Shop',
    description: 'Retail store or shop',
    categories: ['Sales Floor', 'Storage', 'Office', 'Customer Service'],
    defaultOccupancy: {
      'sales_floor': 30,
      storage: 5,
      office: 8,
      'customer_service': 15
    },
    typicalLoads: {
      lighting: 3.0, // High lighting for displays
      equipment: 1.5,
      ventilation: 0.5
    }
  },

  MALL: {
    id: 'mall',
    name: 'Shopping Mall',
    description: 'Large retail complex',
    categories: ['Retail Units', 'Food Court', 'Common Areas', 'Anchor Stores', 'Cinema'],
    defaultOccupancy: {
      'retail_units': 200,
      'food_court': 150,
      'common_areas': 300,
      'anchor_stores': 100,
      cinema: 200
    },
    typicalLoads: {
      lighting: 2.5,
      equipment: 2.5,
      ventilation: 0.6
    }
  },

  HOTEL: {
    id: 'hotel',
    name: 'Hotel',
    description: 'Hospitality building',
    categories: ['Guest Rooms', 'Lobby', 'Restaurant', 'Conference Rooms', 'Pool Area', 'Spa'],
    defaultOccupancy: {
      'guest_rooms': 2, // per room
      lobby: 50,
      restaurant: 100,
      'conference_rooms': 30,
      'pool_area': 40,
      spa: 20
    },
    typicalLoads: {
      lighting: 1.8,
      equipment: 2.2,
      ventilation: 0.42
    }
  },

  RESTAURANT: {
    id: 'restaurant',
    name: 'Restaurant',
    description: 'Food service establishment',
    categories: ['Dining Area', 'Kitchen', 'Bar', 'Storage', 'Office'],
    defaultOccupancy: {
      'dining_area': 60,
      kitchen: 15,
      bar: 25,
      storage: 3,
      office: 5
    },
    typicalLoads: {
      lighting: 2.0,
      equipment: 8.0, // High kitchen equipment load
      ventilation: 0.8 // High ventilation requirement
    }
  },

  // Industrial Buildings
  WAREHOUSE: {
    id: 'warehouse',
    name: 'Warehouse',
    description: 'Storage and distribution facility',
    categories: ['Storage Area', 'Loading Dock', 'Office', 'Break Room'],
    defaultOccupancy: {
      'storage_area': 20,
      'loading_dock': 15,
      office: 10,
      'break_room': 8
    },
    typicalLoads: {
      lighting: 0.8,
      equipment: 1.0,
      ventilation: 0.3
    }
  },

  FACTORY: {
    id: 'factory',
    name: 'Factory',
    description: 'Manufacturing facility',
    categories: ['Production Area', 'Assembly Line', 'Office', 'Storage', 'Quality Control'],
    defaultOccupancy: {
      'production_area': 50,
      'assembly_line': 30,
      office: 15,
      storage: 10,
      'quality_control': 8
    },
    typicalLoads: {
      lighting: 2.0,
      equipment: 15.0, // Very high equipment load
      ventilation: 0.7
    }
  },

  // Institutional Buildings
  HOSPITAL: {
    id: 'hospital',
    name: 'Hospital',
    description: 'Healthcare facility',
    categories: ['Patient Rooms', 'Operating Rooms', 'ICU', 'Laboratory', 'Lobby', 'Cafeteria'],
    defaultOccupancy: {
      'patient_rooms': 2, // per room
      'operating_rooms': 10,
      icu: 15,
      laboratory: 12,
      lobby: 30,
      cafeteria: 50
    },
    typicalLoads: {
      lighting: 2.5,
      equipment: 6.0, // High medical equipment load
      ventilation: 0.6
    }
  },

  SCHOOL: {
    id: 'school',
    name: 'School',
    description: 'Educational facility',
    categories: ['Classrooms', 'Auditorium', 'Gymnasium', 'Cafeteria', 'Library', 'Office'],
    defaultOccupancy: {
      classrooms: 25,
      auditorium: 200,
      gymnasium: 100,
      cafeteria: 150,
      library: 50,
      office: 10
    },
    typicalLoads: {
      lighting: 1.8,
      equipment: 1.5,
      ventilation: 0.45
    }
  },

  // Entertainment & Recreation
  CINEMA: {
    id: 'cinema',
    name: 'Cinema',
    description: 'Movie theater complex',
    categories: ['Auditorium', 'Lobby', 'Concession', 'Projection Room'],
    defaultOccupancy: {
      auditorium: 150,
      lobby: 100,
      concession: 20,
      'projection_room': 3
    },
    typicalLoads: {
      lighting: 1.2,
      equipment: 2.0,
      ventilation: 0.5
    }
  },

  GYM: {
    id: 'gym',
    name: 'Gym/Fitness Center',
    description: 'Exercise and fitness facility',
    categories: ['Workout Area', 'Cardio Zone', 'Locker Room', 'Office', 'Juice Bar'],
    defaultOccupancy: {
      'workout_area': 40,
      'cardio_zone': 30,
      'locker_room': 20,
      office: 5,
      'juice_bar': 15
    },
    typicalLoads: {
      lighting: 2.0,
      equipment: 3.0,
      ventilation: 0.6
    }
  }
};

// Building Type Presets for Quick Selection
export const BUILDING_PRESETS = {
  'Small Office': {
    buildingType: 'OFFICE_BUILDING',
    dimensions: { length: 50, width: 40, height: 10 },
    occupancy: 20,
    category: 'Private Office'
  },
  'Retail Store': {
    buildingType: 'RETAIL_SHOP',
    dimensions: { length: 60, width: 40, height: 12 },
    occupancy: 25,
    category: 'Sales Floor'
  },
  'Restaurant': {
    buildingType: 'RESTAURANT',
    dimensions: { length: 40, width: 30, height: 10 },
    occupancy: 40,
    category: 'Dining Area'
  },
  'Hotel Room': {
    buildingType: 'HOTEL',
    dimensions: { length: 20, width: 15, height: 9 },
    occupancy: 2,
    category: 'Guest Rooms'
  },
  'Apartment Unit': {
    buildingType: 'APARTMENT',
    dimensions: { length: 30, width: 25, height: 9 },
    occupancy: 3,
    category: '2 Bedroom'
  },
  'Shopping Mall': {
    buildingType: 'MALL',
    dimensions: { length: 200, width: 150, height: 20 },
    occupancy: 500,
    category: 'Common Areas'
  }
};

// Enhanced Space Categories with Detailed Specifications
export const SPACE_CATEGORIES = {
  // Residential Spaces
  'Living Room': {
    description: 'Main living area for relaxation and entertainment',
    typicalActivities: ['TV watching', 'Reading', 'Social gathering'],
    heatGains: {
      people: 400, // BTU/hr per person
      lighting: 1.5, // W/sq ft
      equipment: 1.0, // W/sq ft
      ventilation: 0.35 // CFM/sq ft
    },
    recommendedTemp: { summer: 75, winter: 72 },
    recommendedRH: { summer: 50, winter: 40 }
  },

  'Bedroom': {
    description: 'Sleeping quarters',
    typicalActivities: ['Sleeping', 'Reading', 'Light work'],
    heatGains: {
      people: 350,
      lighting: 1.0,
      equipment: 0.5,
      ventilation: 0.3
    },
    recommendedTemp: { summer: 74, winter: 70 },
    recommendedRH: { summer: 55, winter: 45 }
  },

  'Kitchen': {
    description: 'Food preparation area',
    typicalActivities: ['Cooking', 'Food preparation', 'Cleaning'],
    heatGains: {
      people: 400,
      lighting: 2.0,
      equipment: 4.0, // High appliance load
      ventilation: 0.6
    },
    recommendedTemp: { summer: 76, winter: 72 },
    recommendedRH: { summer: 45, winter: 40 }
  },

  // Commercial Spaces
  'Open Office': {
    description: 'Large open workspace area',
    typicalActivities: ['Computer work', 'Meetings', 'Collaboration'],
    heatGains: {
      people: 450,
      lighting: 1.5,
      equipment: 5.0, // High computer/equipment load
      ventilation: 0.45
    },
    recommendedTemp: { summer: 75, winter: 72 },
    recommendedRH: { summer: 50, winter: 40 }
  },

  'Private Office': {
    description: 'Individual office space',
    typicalActivities: ['Computer work', 'Meetings', 'Phone calls'],
    heatGains: {
      people: 400,
      lighting: 1.5,
      equipment: 3.0,
      ventilation: 0.4
    },
    recommendedTemp: { summer: 74, winter: 71 },
    recommendedRH: { summer: 50, winter: 40 }
  },

  'Conference Room': {
    description: 'Meeting and presentation space',
    typicalActivities: ['Meetings', 'Presentations', 'Video calls'],
    heatGains: {
      people: 500, // High density
      lighting: 2.0,
      equipment: 2.0,
      ventilation: 0.5
    },
    recommendedTemp: { summer: 74, winter: 71 },
    recommendedRH: { summer: 50, winter: 40 }
  },

  // Retail Spaces
  'Sales Floor': {
    description: 'Customer shopping area',
    typicalActivities: ['Shopping', 'Product browsing', 'Customer service'],
    heatGains: {
      people: 600, // High customer traffic
      lighting: 3.0, // Display lighting
      equipment: 1.0,
      ventilation: 0.5
    },
    recommendedTemp: { summer: 76, winter: 72 },
    recommendedRH: { summer: 50, winter: 40 }
  },

  // Industrial Spaces
  'Production Area': {
    description: 'Manufacturing and production space',
    typicalActivities: ['Manufacturing', 'Assembly', 'Quality control'],
    heatGains: {
      people: 550,
      lighting: 2.0,
      equipment: 15.0, // Very high machinery load
      ventilation: 0.7
    },
    recommendedTemp: { summer: 78, winter: 70 },
    recommendedRH: { summer: 45, winter: 35 }
  },

  // Hospitality Spaces
  'Dining Area': {
    description: 'Restaurant dining space',
    typicalActivities: ['Dining', 'Socializing', 'Waiting'],
    heatGains: {
      people: 500,
      lighting: 2.0,
      equipment: 1.5,
      ventilation: 0.6
    },
    recommendedTemp: { summer: 76, winter: 72 },
    recommendedRH: { summer: 50, winter: 45 }
  }
};

// Window Type Specifications
export const WINDOW_TYPES = {
  'Single Pane Clear': {
    uFactor: 1.13,
    shgc: 0.76,
    description: 'Single pane clear glass window'
  },
  'Single Pane Tinted': {
    uFactor: 1.13,
    shgc: 0.64,
    description: 'Single pane tinted glass window'
  },
  'Double Pane Clear': {
    uFactor: 0.48,
    shgc: 0.70,
    description: 'Double pane clear glass window'
  },
  'Double Pane Low-E': {
    uFactor: 0.35,
    shgc: 0.65,
    description: 'Double pane with low-emissivity coating'
  },
  'Double Pane Tinted': {
    uFactor: 0.48,
    shgc: 0.58,
    description: 'Double pane tinted glass window'
  },
  'Triple Pane': {
    uFactor: 0.30,
    shgc: 0.60,
    description: 'Triple pane insulated glass window'
  },
  'Reflective Glass': {
    uFactor: 0.40,
    shgc: 0.25,
    description: 'Reflective coated glass for solar control'
  }
};

// Wall Construction Types
export const WALL_CONSTRUCTIONS = {
  'Wood Frame': {
    uFactor: 0.08,
    description: 'Standard wood frame construction with insulation'
  },
  'Concrete Block': {
    uFactor: 0.20,
    description: 'Concrete masonry unit (CMU) construction'
  },
  'Brick Veneer': {
    uFactor: 0.12,
    description: 'Brick veneer over wood frame'
  },
  'Steel Frame': {
    uFactor: 0.10,
    description: 'Steel frame construction with insulation'
  },
  'Insulated Concrete Forms': {
    uFactor: 0.06,
    description: 'ICF construction with foam insulation'
  },
  'Structural Insulated Panels': {
    uFactor: 0.05,
    description: 'SIP construction system'
  }
};

// Roof Construction Types
export const ROOF_CONSTRUCTIONS = {
  'Asphalt Shingle': {
    uFactor: 0.04,
    description: 'Standard asphalt shingle roof'
  },
  'Metal Roof': {
    uFactor: 0.06,
    description: 'Metal standing seam roof'
  },
  'Built-up Roof': {
    uFactor: 0.05,
    description: 'Built-up roofing system'
  },
  'Single Ply Membrane': {
    uFactor: 0.04,
    description: 'TPO or EPDM membrane roof'
  },
  'Green Roof': {
    uFactor: 0.03,
    description: 'Vegetated roof system'
  }
};

// HVAC Equipment Database
export const EQUIPMENT_DATABASE = {
  air_conditioners: [
    {
      type: 'Split System',
      capacity_range: '1.5 - 5 tons',
      efficiency: '14-22 SEER',
      applications: ['Residential', 'Small Commercial'],
      cost_range: '$2,000 - $8,000'
    },
    {
      type: 'Packaged Unit',
      capacity_range: '3 - 25 tons',
      efficiency: '14-18 SEER',
      applications: ['Commercial', 'Industrial'],
      cost_range: '$3,000 - $15,000'
    },
    {
      type: 'VRF System',
      capacity_range: '6 - 30 tons',
      efficiency: '18-24 SEER',
      applications: ['Commercial', 'Multi-zone'],
      cost_range: '$8,000 - $25,000'
    },
    {
      type: 'Chiller',
      capacity_range: '20 - 1000+ tons',
      efficiency: '0.5-1.2 kW/ton',
      applications: ['Large Commercial', 'Industrial'],
      cost_range: '$50,000 - $500,000+'
    }
  ],

  heating_systems: [
    {
      type: 'Gas Furnace',
      capacity_range: '40,000 - 150,000 BTU',
      efficiency: '80-98% AFUE',
      applications: ['Residential', 'Small Commercial'],
      cost_range: '$1,500 - $6,000'
    },
    {
      type: 'Heat Pump',
      capacity_range: '1.5 - 20 tons',
      efficiency: '14-22 SEER, 8-10 HSPF',
      applications: ['Residential', 'Commercial'],
      cost_range: '$3,000 - $12,000'
    },
    {
      type: 'Electric Heater',
      capacity_range: '5 - 50 kW',
      efficiency: '100%',
      applications: ['Residential', 'Commercial'],
      cost_range: '$500 - $3,000'
    },
    {
      type: 'Boiler',
      capacity_range: '50,000 - 2,000,000 BTU',
      efficiency: '80-95% AFUE',
      applications: ['Commercial', 'Industrial'],
      cost_range: '$5,000 - $50,000'
    }
  ],

  ventilation_systems: [
    {
      type: 'HRV (Heat Recovery Ventilator)',
      capacity_range: '50 - 500 CFM',
      efficiency: '60-85% heat recovery',
      applications: ['Residential', 'Small Commercial'],
      cost_range: '$800 - $3,000'
    },
    {
      type: 'ERV (Energy Recovery Ventilator)',
      capacity_range: '200 - 2,000 CFM',
      efficiency: '50-80% energy recovery',
      applications: ['Commercial', 'Schools'],
      cost_range: '$2,000 - $10,000'
    },
    {
      type: 'DOAS (Dedicated Outdoor Air System)',
      capacity_range: '500 - 5,000 CFM',
      efficiency: 'Variable',
      applications: ['Commercial', 'Large Buildings'],
      cost_range: '$5,000 - $30,000'
    }
  ]
};

// Climate Zones (ASHRAE)
export const CLIMATE_ZONES = {
  '1A': { name: 'Very Hot Humid', temp_range: 'Above 90°F', description: 'Miami, Honolulu' },
  '2A': { name: 'Hot Humid', temp_range: '80-90°F', description: 'Houston, Phoenix' },
  '3A': { name: 'Warm Humid', temp_range: '70-80°F', description: 'Atlanta, Dallas' },
  '4A': { name: 'Mixed Humid', temp_range: '60-70°F', description: 'Baltimore, St. Louis' },
  '5A': { name: 'Cool Humid', temp_range: '50-60°F', description: 'Chicago, Denver' },
  '6A': { name: 'Cold Humid', temp_range: '40-50°F', description: 'Minneapolis, Boston' },
  '7': { name: 'Very Cold', temp_range: 'Below 40°F', description: 'Anchorage, Fairbanks' },
  '8': { name: 'Subarctic', temp_range: 'Below 30°F', description: 'Fairbanks, AK' }
};

// Utility functions
export const calculateFloorArea = (length, width) => {
  return length * width;
};

export const calculateVolume = (length, width, height) => {
  return length * width * height;
};

export const calculateOccupancyLoad = (area, category) => {
  const baseOccupancy = SPACE_CATEGORIES[category]?.heatGains?.people || 400;
  return Math.ceil(area / 100); // 1 person per 100 sq ft default
};

export const getRecommendedConditions = (category, season) => {
  const spaceCategory = SPACE_CATEGORIES[category];
  if (!spaceCategory) return { temp: 75, rh: 50 };

  return {
    temp: spaceCategory.recommendedTemp[season] || 75,
    rh: spaceCategory.recommendedRH[season] || 50
  };
};

export const getBuildingTypeInfo = (buildingTypeId) => {
  return Object.values(BUILDING_TYPES).find(type => type.id === buildingTypeId);
};

export const getSpaceCategoryInfo = (category) => {
  return SPACE_CATEGORIES[category];
};

export const getWindowTypeInfo = (windowType) => {
  return WINDOW_TYPES[windowType];
};

export const getEquipmentByType = (equipmentType) => {
  return EQUIPMENT_DATABASE[equipmentType] || [];
};
