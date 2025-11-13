/**
 * VRF (Variable Refrigerant Flow) Inventory Selection System
 * Automatic equipment selection based on calculated heat loads
 * 
 * This system:
 * - Selects appropriate VRF outdoor units based on total tonnage
 * - Recommends indoor unit types and capacities for each room
 * - Calculates pipe sizing and refrigerant piping lengths
 * - Generates equipment schedules and BOQ items
 * 
 * Standards:
 * - ASHRAE 15 (Safety Standard for Refrigeration Systems)
 * - ASHRAE 34 (Designation and Safety Classification of Refrigerants)
 * - Manufacturer specifications (Daikin, Mitsubishi, LG, etc.)
 */

// ==================== VRF OUTDOOR UNIT DATABASE ====================

/**
 * VRF Outdoor Unit Specifications
 * Organized by capacity ranges
 */
export const VRF_OUTDOOR_UNITS = {
  // Small capacity systems (up to 10 TR)
  'VRF-ODU-08': {
    model: 'VRF-ODU-08',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 8, btu: 96000, kw: 28.1 },
    powerInput: { kw: 7.5, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 16,
    maxPipeLength: { m: 150, ft: 492 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '130%',
    price: 350000,
    dimensions: { w: 990, d: 780, h: 1680, unit: 'mm' },
    weight: 285,
    application: 'Small Office, Boutique, Residence'
  },
  'VRF-ODU-10': {
    model: 'VRF-ODU-10',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 10, btu: 120000, kw: 35.2 },
    powerInput: { kw: 9.2, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 20,
    maxPipeLength: { m: 150, ft: 492 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '130%',
    price: 425000,
    dimensions: { w: 990, d: 780, h: 1680, unit: 'mm' },
    weight: 295,
    application: 'Medium Office, Restaurant, Clinic'
  },

  // Medium capacity systems (10-20 TR)
  'VRF-ODU-12': {
    model: 'VRF-ODU-12',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 12, btu: 144000, kw: 42.2 },
    powerInput: { kw: 11.0, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 24,
    maxPipeLength: { m: 165, ft: 541 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '135%',
    price: 510000,
    dimensions: { w: 990, d: 780, h: 1850, unit: 'mm' },
    weight: 315,
    application: 'Large Office, Retail Store, School'
  },
  'VRF-ODU-14': {
    model: 'VRF-ODU-14',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 14, btu: 168000, kw: 49.2 },
    powerInput: { kw: 12.8, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 28,
    maxPipeLength: { m: 165, ft: 541 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '135%',
    price: 595000,
    dimensions: { w: 1240, d: 780, h: 1850, unit: 'mm' },
    weight: 340,
    application: 'Hotel Floor, Hospital Ward, Showroom'
  },
  'VRF-ODU-16': {
    model: 'VRF-ODU-16',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 16, btu: 192000, kw: 56.3 },
    powerInput: { kw: 14.5, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 32,
    maxPipeLength: { m: 165, ft: 541 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '135%',
    price: 680000,
    dimensions: { w: 1240, d: 780, h: 1850, unit: 'mm' },
    weight: 360,
    application: 'Large Showroom, Banquet Hall, Gym'
  },
  'VRF-ODU-18': {
    model: 'VRF-ODU-18',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 18, btu: 216000, kw: 63.3 },
    powerInput: { kw: 16.2, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 36,
    maxPipeLength: { m: 165, ft: 541 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '140%',
    price: 765000,
    dimensions: { w: 1240, d: 780, h: 1850, unit: 'mm' },
    weight: 380,
    application: 'Restaurant Floor, Theater, Data Center'
  },
  'VRF-ODU-20': {
    model: 'VRF-ODU-20',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 20, btu: 240000, kw: 70.3 },
    powerInput: { kw: 18.0, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 40,
    maxPipeLength: { m: 165, ft: 541 },
    maxPipeDifference: { m: 50, ft: 164 },
    refrigerant: 'R410A',
    connectionRatio: '140%',
    price: 850000,
    dimensions: { w: 1490, d: 780, h: 1850, unit: 'mm' },
    weight: 420,
    application: 'Large Restaurant, Conference Hall, Auditorium'
  },

  // Large capacity systems (20-30 TR)
  'VRF-ODU-24': {
    model: 'VRF-ODU-24',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 24, btu: 288000, kw: 84.4 },
    powerInput: { kw: 21.5, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 48,
    maxPipeLength: { m: 200, ft: 656 },
    maxPipeDifference: { m: 90, ft: 295 },
    refrigerant: 'R410A',
    connectionRatio: '150%',
    price: 1020000,
    dimensions: { w: 1490, d: 780, h: 1850, unit: 'mm' },
    weight: 480,
    application: 'Hotel Multiple Floors, Hospital Wing'
  },
  'VRF-ODU-28': {
    model: 'VRF-ODU-28',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 28, btu: 336000, kw: 98.4 },
    powerInput: { kw: 25.0, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 56,
    maxPipeLength: { m: 200, ft: 656 },
    maxPipeDifference: { m: 90, ft: 295 },
    refrigerant: 'R410A',
    connectionRatio: '150%',
    price: 1190000,
    dimensions: { w: 1740, d: 780, h: 1850, unit: 'mm' },
    weight: 540,
    application: 'Shopping Mall Floor, Large Office Building'
  },
  'VRF-ODU-30': {
    model: 'VRF-ODU-30',
    brand: 'Multi-Brand Compatible',
    capacity: { ton: 30, btu: 360000, kw: 105.5 },
    powerInput: { kw: 26.8, phase: '3-Phase', voltage: '380-415V' },
    maxIndoorUnits: 60,
    maxPipeLength: { m: 200, ft: 656 },
    maxPipeDifference: { m: 90, ft: 295 },
    refrigerant: 'R410A',
    connectionRatio: '150%',
    price: 1275000,
    dimensions: { w: 1740, d: 780, h: 1850, unit: 'mm' },
    weight: 570,
    application: 'Large Commercial Space, Multi-Floor Building'
  }
};

// ==================== INDOOR UNIT DATABASE ====================

/**
 * VRF Indoor Unit Types and Specifications
 */
export const VRF_INDOOR_UNITS = {
  // Wall Mounted Units
  'WALL-0.5': { type: 'Wall Mounted', capacity: 0.5, btu: 6000, cfm: 212, price: 18500, application: 'Small Room, Cabin' },
  'WALL-0.75': { type: 'Wall Mounted', capacity: 0.75, btu: 9000, cfm: 318, price: 21000, application: 'Bedroom, Small Office' },
  'WALL-1.0': { type: 'Wall Mounted', capacity: 1.0, btu: 12000, cfm: 424, price: 24500, application: 'Large Bedroom, Office Cabin' },
  'WALL-1.5': { type: 'Wall Mounted', capacity: 1.5, btu: 18000, cfm: 636, price: 29500, application: 'Large Office, Meeting Room' },
  'WALL-2.0': { type: 'Wall Mounted', capacity: 2.0, btu: 24000, cfm: 848, price: 35000, application: 'Large Room, Shop' },

  // Ceiling Cassette Units (4-Way)
  'CASSETTE-1.0': { type: 'Ceiling Cassette 4-Way', capacity: 1.0, btu: 12000, cfm: 400, price: 32000, application: 'Office, Retail' },
  'CASSETTE-1.5': { type: 'Ceiling Cassette 4-Way', capacity: 1.5, btu: 18000, cfm: 600, price: 38000, application: 'Large Office, Showroom' },
  'CASSETTE-2.0': { type: 'Ceiling Cassette 4-Way', capacity: 2.0, btu: 24000, cfm: 800, price: 44000, application: 'Restaurant, Large Retail' },
  'CASSETTE-2.5': { type: 'Ceiling Cassette 4-Way', capacity: 2.5, btu: 30000, cfm: 1000, price: 51000, application: 'Large Showroom, Hall' },
  'CASSETTE-3.0': { type: 'Ceiling Cassette 4-Way', capacity: 3.0, btu: 36000, cfm: 1200, price: 58000, application: 'Very Large Space, Auditorium' },

  // Concealed Duct Units
  'DUCT-1.0': { type: 'Concealed Duct', capacity: 1.0, btu: 12000, cfm: 400, staticPressure: 0.4, price: 28000, application: 'Office, Bedroom' },
  'DUCT-1.5': { type: 'Concealed Duct', capacity: 1.5, btu: 18000, cfm: 600, staticPressure: 0.5, price: 33000, application: 'Large Office, Restaurant' },
  'DUCT-2.0': { type: 'Concealed Duct', capacity: 2.0, btu: 24000, cfm: 800, staticPressure: 0.6, price: 39000, application: 'Large Space, Multiple Rooms' },
  'DUCT-3.0': { type: 'Concealed Duct', capacity: 3.0, btu: 36000, cfm: 1200, staticPressure: 0.8, price: 52000, application: 'Very Large Space, Hall' },
  'DUCT-4.0': { type: 'Concealed Duct', capacity: 4.0, btu: 48000, cfm: 1600, staticPressure: 1.0, price: 68000, application: 'Auditorium, Large Hall' },

  // Floor Standing Units
  'FLOOR-2.0': { type: 'Floor Standing', capacity: 2.0, btu: 24000, cfm: 800, price: 42000, application: 'Showroom, Gallery' },
  'FLOOR-2.5': { type: 'Floor Standing', capacity: 2.5, btu: 30000, cfm: 1000, price: 49000, application: 'Large Showroom, Gym' },
  'FLOOR-3.0': { type: 'Floor Standing', capacity: 3.0, btu: 36000, cfm: 1200, price: 56000, application: 'Very Large Space' }
};

// ==================== RECOMMENDED UNIT TYPES BY ROOM ====================

/**
 * Recommended indoor unit types based on room type and area
 */
export const RECOMMENDED_UNIT_TYPES = {
  // Residential
  'apartment': { preferred: 'Wall Mounted', alternate: 'Cassette', sizes: [0.75, 1.0, 1.5] },
  'bedroom': { preferred: 'Wall Mounted', alternate: 'Concealed Duct', sizes: [0.5, 0.75, 1.0] },
  'living_room': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [1.5, 2.0, 2.5] },
  
  // Commercial Office
  'office': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [1.0, 1.5, 2.0] },
  'open_office': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [2.0, 2.5, 3.0] },
  'cabin': { preferred: 'Wall Mounted', alternate: 'Cassette', sizes: [0.75, 1.0, 1.5] },
  'conference': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [2.0, 2.5, 3.0] },
  
  // Retail
  'retail': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [1.5, 2.0, 2.5] },
  'showroom': { preferred: 'Cassette', alternate: 'Floor Standing', sizes: [2.0, 2.5, 3.0] },
  'anchor_store': { preferred: 'Concealed Duct', alternate: 'Cassette', sizes: [3.0, 4.0] },
  
  // Healthcare
  'patient_room': { preferred: 'Wall Mounted', alternate: 'Cassette', sizes: [1.0, 1.5, 2.0] },
  'icu': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [1.5, 2.0, 2.5] },
  'operation_theater': { preferred: 'Concealed Duct', alternate: 'Cassette', sizes: [3.0, 4.0] },
  
  // Hospitality
  'guest_room': { preferred: 'Wall Mounted', alternate: 'Cassette', sizes: [0.75, 1.0, 1.5] },
  'restaurant': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [2.0, 2.5, 3.0] },
  'banquet': { preferred: 'Concealed Duct', alternate: 'Cassette', sizes: [3.0, 4.0] },
  
  // Default
  'default': { preferred: 'Cassette', alternate: 'Concealed Duct', sizes: [1.5, 2.0, 2.5] }
};

// ==================== COPPER PIPE SPECIFICATIONS ====================

/**
 * Refrigerant copper pipe sizes based on capacity
 */
export const COPPER_PIPE_SIZES = {
  // Suction line (vapor) - OD in inches
  suction: {
    '0.5-1.0': { od: 3/8, wall: 0.032, price: 185 },
    '1.0-1.5': { od: 1/2, wall: 0.032, price: 245 },
    '1.5-2.5': { od: 5/8, wall: 0.035, price: 310 },
    '2.5-4.0': { od: 3/4, wall: 0.035, price: 385 },
    '4.0-6.0': { od: 7/8, wall: 0.045, price: 475 },
    '6.0-10.0': { od: 1-1/8, wall: 0.050, price: 625 }
  },
  // Liquid line (liquid refrigerant) - OD in inches
  liquid: {
    '0.5-2.0': { od: 1/4, wall: 0.032, price: 125 },
    '2.0-4.0': { od: 3/8, wall: 0.032, price: 185 },
    '4.0-8.0': { od: 1/2, wall: 0.035, price: 245 },
    '8.0-15.0': { od: 5/8, wall: 0.035, price: 310 }
  }
};

// ==================== ACCESSORIES AND MATERIALS ====================

/**
 * Standard accessories and installation materials
 */
export const VRF_ACCESSORIES = {
  // Refrigerant piping accessories
  'COPPER_INSULATION': { item: 'Armaflex Insulation (per meter)', price: 85, unit: 'm' },
  'PIPE_SUPPORT': { item: 'Pipe Support Bracket', price: 125, unit: 'pcs' },
  'REFRIGERANT_R410A': { item: 'R410A Refrigerant', price: 850, unit: 'kg' },
  
  // Electrical accessories
  'POWER_CABLE': { item: 'Power Cable 4-Core (per meter)', price: 145, unit: 'm' },
  'SIGNAL_CABLE': { item: 'Control Signal Cable (per meter)', price: 85, unit: 'm' },
  'MCB_16A': { item: 'MCB 16A 3-Phase', price: 425, unit: 'pcs' },
  'MCB_32A': { item: 'MCB 32A 3-Phase', price: 625, unit: 'pcs' },
  'MCB_63A': { item: 'MCB 63A 3-Phase', price: 925, unit: 'pcs' },
  
  // Drainage
  'DRAIN_PIPE': { item: 'PVC Drain Pipe 3/4" (per meter)', price: 45, unit: 'm' },
  'DRAIN_PUMP': { item: 'Condensate Drain Pump', price: 2850, unit: 'pcs' },
  
  // Control systems
  'CENTRAL_CONTROLLER': { item: 'Central Control System', price: 45000, unit: 'set' },
  'WIRED_CONTROLLER': { item: 'Wired Remote Controller', price: 3500, unit: 'pcs' },
  'WIRELESS_CONTROLLER': { item: 'Wireless Remote Controller', price: 4200, unit: 'pcs' },
  
  // Branch boxes (for multiple indoor units)
  'BRANCH_BOX_2': { item: 'Refnet Joint 2-Port', price: 8500, unit: 'pcs' },
  'BRANCH_BOX_4': { item: 'Refnet Joint 4-Port', price: 12500, unit: 'pcs' },
  'BRANCH_BOX_8': { item: 'Refnet Joint 8-Port', price: 18500, unit: 'pcs' },
  
  // Installation
  'ODU_STAND': { item: 'Outdoor Unit Stand/Platform', price: 8500, unit: 'set' },
  'VIBRATION_PAD': { item: 'Vibration Isolation Pad', price: 850, unit: 'set' },
  'WALL_BRACKET': { item: 'Wall Mounting Bracket (IDU)', price: 1250, unit: 'set' }
};

// ==================== SELECTION FUNCTIONS ====================

/**
 * Select appropriate VRF outdoor unit(s) based on total tonnage
 * @param {number} totalTonnage - Total cooling load in tons
 * @param {number} numberOfIndoorUnits - Number of indoor units
 * @param {string} buildingType - Type of building
 * @returns {Array} Selected outdoor units with configuration
 */
export function selectVRFOutdoorUnits(totalTonnage, numberOfIndoorUnits = 0, buildingType = 'Office Building') {
  // Add 10% safety margin
  const requiredCapacity = totalTonnage * 1.1;
  
  // Try to find single unit solution first
  const singleUnit = Object.values(VRF_OUTDOOR_UNITS).find(unit => 
    unit.capacity.ton >= requiredCapacity && 
    unit.maxIndoorUnits >= numberOfIndoorUnits
  );
  
  if (singleUnit) {
    return [{
      ...singleUnit,
      quantity: 1,
      totalCapacity: singleUnit.capacity.ton,
      totalPrice: singleUnit.price,
      configuration: 'Single Unit System'
    }];
  }
  
  // Multi-unit solution - try to balance units
  const selectedUnits = [];
  let remainingCapacity = requiredCapacity;
  let remainingIndoorUnits = numberOfIndoorUnits;
  
  // Sort units by capacity (descending)
  const sortedUnits = Object.values(VRF_OUTDOOR_UNITS).sort((a, b) => b.capacity.ton - a.capacity.ton);
  
  while (remainingCapacity > 0) {
    // Find best fit unit
    const bestFit = sortedUnits.find(unit => 
      unit.capacity.ton <= remainingCapacity * 1.2 &&
      (remainingIndoorUnits === 0 || unit.maxIndoorUnits >= Math.ceil(remainingIndoorUnits / 2))
    ) || sortedUnits[sortedUnits.length - 1];
    
    selectedUnits.push({
      ...bestFit,
      quantity: 1,
      allocatedCapacity: Math.min(bestFit.capacity.ton, remainingCapacity)
    });
    
    remainingCapacity -= bestFit.capacity.ton;
    remainingIndoorUnits = Math.max(0, remainingIndoorUnits - bestFit.maxIndoorUnits);
    
    // Safety check
    if (selectedUnits.length > 10) break;
  }
  
  // Consolidate duplicate units
  const consolidated = {};
  selectedUnits.forEach(unit => {
    if (consolidated[unit.model]) {
      consolidated[unit.model].quantity++;
      consolidated[unit.model].totalCapacity += unit.allocatedCapacity;
      consolidated[unit.model].totalPrice += unit.price;
    } else {
      consolidated[unit.model] = {
        ...unit,
        totalCapacity: unit.allocatedCapacity,
        totalPrice: unit.price
      };
    }
  });
  
  return Object.values(consolidated).map(unit => ({
    ...unit,
    configuration: `${unit.quantity} Unit${unit.quantity > 1 ? 's' : ''} System`
  }));
}

/**
 * Select appropriate indoor unit for a room
 * @param {Object} room - Room data with heat load
 * @param {string} preferredType - Preferred unit type
 * @returns {Object} Selected indoor unit
 */
export function selectIndoorUnit(room, preferredType = null) {
  const requiredTonnage = room.tonnage || (room.heatLoad?.total || 0) / 12000;
  
  // Add 5% safety margin for indoor units
  const adjustedTonnage = requiredTonnage * 1.05;
  
  // Get recommended unit types for this room
  const recommendation = RECOMMENDED_UNIT_TYPES[room.type] || RECOMMENDED_UNIT_TYPES['default'];
  const unitTypePrefix = preferredType || recommendation.preferred;
  
  // Find matching units
  const matchingUnits = Object.entries(VRF_INDOOR_UNITS).filter(([key, unit]) => 
    unit.type === unitTypePrefix
  );
  
  // Select closest capacity match (slightly oversized)
  let selectedUnit = null;
  let minDifference = Infinity;
  
  matchingUnits.forEach(([key, unit]) => {
    if (unit.capacity >= adjustedTonnage) {
      const difference = unit.capacity - adjustedTonnage;
      if (difference < minDifference) {
        minDifference = difference;
        selectedUnit = { key, ...unit };
      }
    }
  });
  
  // If no oversized unit found, select largest available
  if (!selectedUnit) {
    const largestUnit = matchingUnits.reduce((largest, [key, unit]) => 
      !largest || unit.capacity > largest.capacity ? { key, ...unit } : largest
    , null);
    selectedUnit = largestUnit;
  }
  
  // If still no unit (type not available), try alternate type
  if (!selectedUnit && recommendation.alternate) {
    return selectIndoorUnit(room, recommendation.alternate);
  }
  
  return selectedUnit || {
    key: 'CASSETTE-2.0',
    ...VRF_INDOOR_UNITS['CASSETTE-2.0'],
    note: 'Default selection - verify requirements'
  };
}

/**
 * Calculate refrigerant piping requirements
 * @param {Object} layout - Building layout and distances
 * @returns {Object} Piping requirements
 */
export function calculateRefrigerantPiping(layout) {
  const {
    outdoorUnitLocation,
    indoorUnits,
    buildingHeight,
    typicalPipeRun = 50 // typical horizontal run in feet
  } = layout;
  
  const piping = {
    mainLines: [],
    branchLines: [],
    totalLength: 0,
    totalCost: 0,
    accessories: []
  };
  
  // Calculate main line from ODU
  indoorUnits.forEach(idu => {
    const capacity = idu.capacity || 1.5;
    const distance = idu.distance || typicalPipeRun;
    
    // Determine pipe sizes
    let suctionSize, liquidSize;
    
    if (capacity <= 1.0) {
      suctionSize = COPPER_PIPE_SIZES.suction['0.5-1.0'];
      liquidSize = COPPER_PIPE_SIZES.liquid['0.5-2.0'];
    } else if (capacity <= 1.5) {
      suctionSize = COPPER_PIPE_SIZES.suction['1.0-1.5'];
      liquidSize = COPPER_PIPE_SIZES.liquid['0.5-2.0'];
    } else if (capacity <= 2.5) {
      suctionSize = COPPER_PIPE_SIZES.suction['1.5-2.5'];
      liquidSize = COPPER_PIPE_SIZES.liquid['0.5-2.0'];
    } else if (capacity <= 4.0) {
      suctionSize = COPPER_PIPE_SIZES.suction['2.5-4.0'];
      liquidSize = COPPER_PIPE_SIZES.liquid['2.0-4.0'];
    } else {
      suctionSize = COPPER_PIPE_SIZES.suction['4.0-6.0'];
      liquidSize = COPPER_PIPE_SIZES.liquid['4.0-8.0'];
    }
    
    const pipeLength = distance * 1.2; // Add 20% for fittings and routing
    
    piping.branchLines.push({
      indoorUnit: idu.id,
      capacity,
      length: Math.round(pipeLength),
      suctionSize: `${suctionSize.od}"`,
      liquidSize: `${liquidSize.od}"`,
      cost: Math.round((suctionSize.price + liquidSize.price) * pipeLength / 3.28) // Convert to meters
    });
    
    piping.totalLength += pipeLength;
  });
  
  // Calculate insulation
  piping.accessories.push({
    item: 'Copper Insulation',
    quantity: Math.round(piping.totalLength * 2 / 3.28), // meters, both lines
    unit: 'm',
    unitPrice: VRF_ACCESSORIES.COPPER_INSULATION.price,
    totalPrice: Math.round(piping.totalLength * 2 / 3.28 * VRF_ACCESSORIES.COPPER_INSULATION.price)
  });
  
  // Calculate refrigerant requirement (approximately 0.5 kg per meter of piping)
  const refrigerantKg = Math.round(piping.totalLength * 0.5 / 3.28);
  piping.accessories.push({
    item: 'R410A Refrigerant',
    quantity: refrigerantKg,
    unit: 'kg',
    unitPrice: VRF_ACCESSORIES.REFRIGERANT_R410A.price,
    totalPrice: refrigerantKg * VRF_ACCESSORIES.REFRIGERANT_R410A.price
  });
  
  // Calculate branch boxes needed
  const branchBoxes = Math.ceil(indoorUnits.length / 4);
  piping.accessories.push({
    item: 'Branch Box 4-Port',
    quantity: branchBoxes,
    unit: 'pcs',
    unitPrice: VRF_ACCESSORIES.BRANCH_BOX_4.price,
    totalPrice: branchBoxes * VRF_ACCESSORIES.BRANCH_BOX_4.price
  });
  
  // Calculate total cost
  piping.totalCost = piping.branchLines.reduce((sum, line) => sum + line.cost, 0) +
                     piping.accessories.reduce((sum, acc) => sum + acc.totalPrice, 0);
  
  return piping;
}

/**
 * Generate complete VRF system BOQ
 * @param {Object} systemData - Complete system data
 * @returns {Object} Bill of Quantities
 */
export function generateVRFSystemBOQ(systemData) {
  const {
    outdoorUnits,
    indoorUnits,
    piping,
    electrical = true,
    controls = 'basic',
    installation = true
  } = systemData;
  
  const boq = {
    sections: [],
    summary: {
      equipment: 0,
      piping: 0,
      electrical: 0,
      controls: 0,
      installation: 0,
      total: 0
    }
  };
  
  // 1. Outdoor Units
  const oduSection = {
    name: 'VRF Outdoor Units',
    items: outdoorUnits.map(unit => ({
      description: `${unit.model} - ${unit.capacity.ton} TR VRF Outdoor Unit`,
      specification: `Capacity: ${unit.capacity.kw} kW, Power: ${unit.powerInput.kw} kW, Max IDU: ${unit.maxIndoorUnits}`,
      quantity: unit.quantity,
      unit: 'nos',
      rate: unit.price,
      amount: unit.totalPrice
    })),
    total: outdoorUnits.reduce((sum, unit) => sum + unit.totalPrice, 0)
  };
  boq.sections.push(oduSection);
  boq.summary.equipment += oduSection.total;
  
  // 2. Indoor Units
  const iduSection = {
    name: 'VRF Indoor Units',
    items: Object.values(
      indoorUnits.reduce((acc, unit) => {
        const key = unit.key;
        if (acc[key]) {
          acc[key].quantity++;
          acc[key].amount += unit.price;
        } else {
          acc[key] = {
            description: `${unit.type} Indoor Unit - ${unit.capacity} TR`,
            specification: `Model: ${key}, BTU: ${unit.btu}, CFM: ${unit.cfm}`,
            quantity: 1,
            unit: 'nos',
            rate: unit.price,
            amount: unit.price
          };
        }
        return acc;
      }, {})
    ),
    total: indoorUnits.reduce((sum, unit) => sum + unit.price, 0)
  };
  boq.sections.push(iduSection);
  boq.summary.equipment += iduSection.total;
  
  // 3. Refrigerant Piping
  if (piping) {
    const pipingSection = {
      name: 'Refrigerant Piping & Accessories',
      items: [
        ...piping.branchLines.map((line, i) => ({
          description: `Refrigerant Piping Set - ${line.capacity} TR`,
          specification: `Suction: ${line.suctionSize}, Liquid: ${line.liquidSize}, Length: ${line.length} ft`,
          quantity: 1,
          unit: 'set',
          rate: line.cost,
          amount: line.cost
        })),
        ...piping.accessories.map(acc => ({
          description: acc.item,
          specification: `As per manufacturer specifications`,
          quantity: acc.quantity,
          unit: acc.unit,
          rate: acc.unitPrice,
          amount: acc.totalPrice
        }))
      ],
      total: piping.totalCost
    };
    boq.sections.push(pipingSection);
    boq.summary.piping += pipingSection.total;
  }
  
  // 4. Electrical Work
  if (electrical) {
    const powerCable = indoorUnits.length * 30; // 30m average per unit
    const signalCable = indoorUnits.length * 35; // 35m average per unit
    
    const electricalSection = {
      name: 'Electrical Work',
      items: [
        {
          description: 'Power Cable 4-Core',
          specification: 'As per load requirements',
          quantity: powerCable,
          unit: 'm',
          rate: VRF_ACCESSORIES.POWER_CABLE.price,
          amount: powerCable * VRF_ACCESSORIES.POWER_CABLE.price
        },
        {
          description: 'Signal Cable 2-Core',
          specification: 'Shielded communication cable',
          quantity: signalCable,
          unit: 'm',
          rate: VRF_ACCESSORIES.SIGNAL_CABLE.price,
          amount: signalCable * VRF_ACCESSORIES.SIGNAL_CABLE.price
        },
        {
          description: 'MCB & Protection',
          specification: 'As per unit requirements',
          quantity: outdoorUnits.length + indoorUnits.length,
          unit: 'set',
          rate: 850,
          amount: (outdoorUnits.length + indoorUnits.length) * 850
        }
      ],
      total: 0
    };
    electricalSection.total = electricalSection.items.reduce((sum, item) => sum + item.amount, 0);
    boq.sections.push(electricalSection);
    boq.summary.electrical += electricalSection.total;
  }
  
  // 5. Control System
  if (controls !== 'none') {
    const controlsSection = {
      name: 'Control System',
      items: [],
      total: 0
    };
    
    if (controls === 'advanced' || indoorUnits.length > 10) {
      controlsSection.items.push({
        description: 'Central Control System',
        specification: 'Integrated building management',
        quantity: 1,
        unit: 'set',
        rate: VRF_ACCESSORIES.CENTRAL_CONTROLLER.price,
        amount: VRF_ACCESSORIES.CENTRAL_CONTROLLER.price
      });
    }
    
    controlsSection.items.push({
      description: 'Individual Remote Controllers',
      specification: 'Wired/Wireless as applicable',
      quantity: indoorUnits.length,
      unit: 'nos',
      rate: VRF_ACCESSORIES.WIRED_CONTROLLER.price,
      amount: indoorUnits.length * VRF_ACCESSORIES.WIRED_CONTROLLER.price
    });
    
    controlsSection.total = controlsSection.items.reduce((sum, item) => sum + item.amount, 0);
    boq.sections.push(controlsSection);
    boq.summary.controls += controlsSection.total;
  }
  
  // 6. Installation & Commissioning
  if (installation) {
    const installationCost = (boq.summary.equipment + boq.summary.piping) * 0.15; // 15% of equipment cost
    
    const installationSection = {
      name: 'Installation & Commissioning',
      items: [
        {
          description: 'Supply, Installation, Testing & Commissioning',
          specification: 'Complete VRF system as per design',
          quantity: 1,
          unit: 'lot',
          rate: installationCost,
          amount: installationCost
        },
        {
          description: 'Civil Work & Support Structures',
          specification: 'Outdoor unit stands, indoor unit brackets, etc.',
          quantity: outdoorUnits.length + indoorUnits.length,
          unit: 'set',
          rate: 2500,
          amount: (outdoorUnits.length + indoorUnits.length) * 2500
        }
      ],
      total: 0
    };
    installationSection.total = installationSection.items.reduce((sum, item) => sum + item.amount, 0);
    boq.sections.push(installationSection);
    boq.summary.installation += installationSection.total;
  }
  
  // Calculate grand total
  boq.summary.total = Object.values(boq.summary).reduce((sum, val) => typeof val === 'number' ? sum + val : sum, 0);
  
  // Add taxes
  boq.summary.subtotal = boq.summary.total;
  boq.summary.gst = Math.round(boq.summary.subtotal * 0.18); // 18% GST
  boq.summary.grandTotal = boq.summary.subtotal + boq.summary.gst;
  
  return boq;
}

export default {
  VRF_OUTDOOR_UNITS,
  VRF_INDOOR_UNITS,
  RECOMMENDED_UNIT_TYPES,
  COPPER_PIPE_SIZES,
  VRF_ACCESSORIES,
  selectVRFOutdoorUnits,
  selectIndoorUnit,
  calculateRefrigerantPiping,
  generateVRFSystemBOQ
};