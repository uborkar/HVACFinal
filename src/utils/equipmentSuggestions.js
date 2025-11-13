/**
 * Equipment Suggestion Engine for VRF Systems
 * Generates Economy, Balanced, and Premium options based on heat load
 */

// VRF Equipment SKU Database
export const VRF_SKUS = {
  IDU: [
    // Indoor Units (Ceiling Cassette)
    { model: 'IDU-CC-0.75T', capacity: 0.75, type: 'Ceiling Cassette', price: 18000, brand: 'Standard' },
    { model: 'IDU-CC-1.0T', capacity: 1.0, type: 'Ceiling Cassette', price: 22000, brand: 'Standard' },
    { model: 'IDU-CC-1.5T', capacity: 1.5, type: 'Ceiling Cassette', price: 28000, brand: 'Standard' },
    { model: 'IDU-CC-2.0T', capacity: 2.0, type: 'Ceiling Cassette', price: 35000, brand: 'Standard' },
    { model: 'IDU-CC-2.5T', capacity: 2.5, type: 'Ceiling Cassette', price: 42000, brand: 'Standard' },
    
    // Indoor Units (Wall Mounted)
    { model: 'IDU-WM-0.75T', capacity: 0.75, type: 'Wall Mounted', price: 15000, brand: 'Standard' },
    { model: 'IDU-WM-1.0T', capacity: 1.0, type: 'Wall Mounted', price: 18500, brand: 'Standard' },
    { model: 'IDU-WM-1.5T', capacity: 1.5, type: 'Wall Mounted', price: 24000, brand: 'Standard' },
    { model: 'IDU-WM-2.0T', capacity: 2.0, type: 'Wall Mounted', price: 30000, brand: 'Standard' },
    
    // Indoor Units (Ducted)
    { model: 'IDU-DT-1.0T', capacity: 1.0, type: 'Ducted', price: 25000, brand: 'Premium' },
    { model: 'IDU-DT-1.5T', capacity: 1.5, type: 'Ducted', price: 32000, brand: 'Premium' },
    { model: 'IDU-DT-2.0T', capacity: 2.0, type: 'Ducted', price: 40000, brand: 'Premium' },
    { model: 'IDU-DT-2.5T', capacity: 2.5, type: 'Ducted', price: 48000, brand: 'Premium' },
    { model: 'IDU-DT-3.0T', capacity: 3.0, type: 'Ducted', price: 56000, brand: 'Premium' },
  ],
  
  ODU: [
    // Outdoor Units (VRF)
    { model: 'ODU-VRF-8HP', capacity: 8, maxIndoor: 4, price: 120000, brand: 'Standard', efficiency: 'Standard' },
    { model: 'ODU-VRF-10HP', capacity: 10, maxIndoor: 5, price: 150000, brand: 'Standard', efficiency: 'Standard' },
    { model: 'ODU-VRF-12HP', capacity: 12, maxIndoor: 6, price: 180000, brand: 'Standard', efficiency: 'High' },
    { model: 'ODU-VRF-14HP', capacity: 14, maxIndoor: 7, price: 210000, brand: 'Premium', efficiency: 'High' },
    { model: 'ODU-VRF-16HP', capacity: 16, maxIndoor: 8, price: 240000, brand: 'Premium', efficiency: 'High' },
    { model: 'ODU-VRF-18HP', capacity: 18, maxIndoor: 10, price: 270000, brand: 'Premium', efficiency: 'Ultra' },
    { model: 'ODU-VRF-20HP', capacity: 20, maxIndoor: 12, price: 300000, brand: 'Premium', efficiency: 'Ultra' },
    { model: 'ODU-VRF-24HP', capacity: 24, maxIndoor: 14, price: 360000, brand: 'Premium', efficiency: 'Ultra' },
  ]
};

// Piping and accessories pricing
export const ACCESSORIES = {
  piping: {
    refrigerantPipe: 450, // per meter
    insulationFoam: 80,   // per meter
    drainPipe: 120,       // per meter
  },
  electrical: {
    powerCable: 250,      // per meter
    controlCable: 150,    // per meter
    mcb: 2500,           // per unit
    starter: 3500,       // per unit
  },
  installation: {
    wallBracket: 1500,   // per unit
    floorStand: 2500,    // per unit
    vibrationPad: 800,   // per unit
  }
};

/**
 * Calculate required tonnage with diversity
 */
function calculateRequiredTonnage(totalLoad, roomCount, diversityFactor = 0.85) {
  const baseTonnage = totalLoad / 12000; // Convert BTU to tons
  const diversifiedTonnage = baseTonnage * diversityFactor;
  return Math.ceil(diversifiedTonnage * 10) / 10; // Round up to nearest 0.1 ton
}

/**
 * Select IDUs for rooms based on individual loads
 */
function selectIDUs(roomLoads, preferenceLevel = 'balanced') {
  const selectedIDUs = [];
  
  const typePreference = {
    economy: 'Wall Mounted',
    balanced: 'Ceiling Cassette', 
    premium: 'Ducted'
  };
  
  const preferredType = typePreference[preferenceLevel];
  
  roomLoads.forEach((load, index) => {
    const requiredCapacity = Math.ceil(load / 12000 * 10) / 10; // Round up to 0.1 ton
    
    // Find suitable IDUs
    let suitableIDUs = VRF_SKUS.IDU.filter(idu => 
      idu.capacity >= requiredCapacity && 
      idu.type === preferredType
    );
    
    // Fallback to any type if preferred not available
    if (suitableIDUs.length === 0) {
      suitableIDUs = VRF_SKUS.IDU.filter(idu => idu.capacity >= requiredCapacity);
    }
    
    // Select the smallest suitable IDU
    const selectedIDU = suitableIDUs.sort((a, b) => a.capacity - b.capacity)[0];
    
    if (selectedIDU) {
      selectedIDUs.push({
        ...selectedIDU,
        roomId: `Room_${index + 1}`,
        requiredCapacity,
        oversizing: ((selectedIDU.capacity - requiredCapacity) / requiredCapacity * 100).toFixed(1)
      });
    }
  });
  
  return selectedIDUs;
}

/**
 * Select ODUs based on total capacity and configuration
 */
function selectODUs(totalCapacity, iduCount, preferenceLevel = 'balanced') {
  const selectedODUs = [];
  
  // Determine max ODU size based on preference
  const maxODUSize = {
    economy: 20,    // Use larger ODUs to minimize count
    balanced: 16,   // Balance between count and redundancy
    premium: 12     // More smaller units for redundancy
  };
  
  const maxSize = maxODUSize[preferenceLevel];
  let remainingCapacity = totalCapacity;
  
  // Convert tons to HP (1 ton ≈ 1.4 HP for VRF)
  const totalHP = Math.ceil(totalCapacity * 1.4);
  remainingCapacity = totalHP;
  
  while (remainingCapacity > 0) {
    // Find suitable ODUs
    const suitableODUs = VRF_SKUS.ODU.filter(odu => 
      odu.capacity <= Math.min(remainingCapacity, maxSize) &&
      odu.maxIndoor >= Math.ceil(iduCount / 2) // Ensure enough indoor connections
    );
    
    if (suitableODUs.length === 0) {
      // Get the smallest ODU that can handle remaining capacity
      const smallestSuitable = VRF_SKUS.ODU
        .filter(odu => odu.capacity >= remainingCapacity)
        .sort((a, b) => a.capacity - b.capacity)[0];
      
      if (smallestSuitable) {
        selectedODUs.push(smallestSuitable);
        break;
      }
    } else {
      // Select the largest suitable ODU
      const selectedODU = suitableODUs.sort((a, b) => b.capacity - a.capacity)[0];
      selectedODUs.push(selectedODU);
      remainingCapacity -= selectedODU.capacity;
    }
  }
  
  return selectedODUs;
}

/**
 * Calculate materials and accessories
 */
function calculateMaterials(iduCount, oduCount, avgPipingLength = 30) {
  const materials = {
    piping: {
      refrigerantPipe: avgPipingLength * iduCount,
      insulationFoam: avgPipingLength * iduCount,
      drainPipe: avgPipingLength * iduCount * 0.5,
    },
    electrical: {
      powerCable: avgPipingLength * (iduCount + oduCount),
      controlCable: avgPipingLength * iduCount,
      mcb: iduCount + oduCount,
      starter: oduCount,
    },
    installation: {
      wallBracket: iduCount,
      floorStand: oduCount,
      vibrationPad: oduCount * 4,
    }
  };
  
  // Calculate costs
  const costs = {
    piping: 0,
    electrical: 0,
    installation: 0,
    total: 0
  };
  
  Object.entries(materials).forEach(([category, items]) => {
    Object.entries(items).forEach(([item, quantity]) => {
      const unitCost = ACCESSORIES[category][item] || 0;
      costs[category] += quantity * unitCost;
    });
  });
  
  costs.total = costs.piping + costs.electrical + costs.installation;
  
  return { materials, costs };
}

/**
 * Generate equipment suggestions with three options
 */
export function generateEquipmentSuggestions(totalLoad, roomCount, roomLoads = null) {
  // If room loads not provided, estimate equal distribution
  if (!roomLoads) {
    const avgLoad = totalLoad / roomCount;
    roomLoads = Array(roomCount).fill(avgLoad);
  }
  
  const suggestions = {};
  
  // Generate three options
  ['economy', 'balanced', 'premium'].forEach(level => {
    const diversityFactor = {
      economy: 0.75,    // Higher diversity, lower capacity
      balanced: 0.85,   // Standard diversity
      premium: 0.95     // Lower diversity, higher capacity
    }[level];
    
    const requiredTonnage = calculateRequiredTonnage(totalLoad, roomCount, diversityFactor);
    
    // Select equipment
    const idus = selectIDUs(roomLoads, level);
    const totalIDUCapacity = idus.reduce((sum, idu) => sum + idu.capacity, 0);
    const odus = selectODUs(requiredTonnage, idus.length, level);
    const totalODUCapacity = odus.reduce((sum, odu) => sum + odu.capacity, 0);
    
    // Calculate materials
    const { materials, costs } = calculateMaterials(idus.length, odus.length);
    
    // Calculate total cost
    const iduCost = idus.reduce((sum, idu) => sum + idu.price, 0);
    const oduCost = odus.reduce((sum, odu) => sum + odu.price, 0);
    const equipmentCost = iduCost + oduCost;
    const totalCost = equipmentCost + costs.total;
    
    suggestions[level] = {
      name: level.charAt(0).toUpperCase() + level.slice(1),
      description: getDescription(level),
      diversityFactor,
      requiredTonnage,
      equipment: {
        idus: {
          units: idus,
          count: idus.length,
          totalCapacity: totalIDUCapacity,
          totalCost: iduCost
        },
        odus: {
          units: odus,
          count: odus.length,
          totalCapacity: totalODUCapacity,
          totalCost: oduCost
        }
      },
      materials: {
        breakdown: materials,
        costs: costs
      },
      summary: {
        equipmentCost,
        materialCost: costs.total,
        totalCost,
        pricePerTon: Math.round(totalCost / requiredTonnage),
        capacityRatio: (totalODUCapacity / (requiredTonnage * 1.4) * 100).toFixed(1),
        redundancy: calculateRedundancy(odus)
      },
      features: getFeatures(level)
    };
  });
  
  return suggestions;
}

/**
 * Get description for each option level
 */
function getDescription(level) {
  const descriptions = {
    economy: 'Cost-effective solution with standard efficiency and minimal redundancy. Suitable for budget-conscious projects with stable loads.',
    balanced: 'Optimal balance between cost and performance. Good efficiency with moderate redundancy for most commercial applications.',
    premium: 'High-end solution with maximum efficiency and redundancy. Best for critical applications requiring highest reliability.'
  };
  return descriptions[level];
}

/**
 * Get features for each option level
 */
function getFeatures(level) {
  const features = {
    economy: [
      'Standard efficiency units',
      'Wall-mounted IDUs for easy maintenance',
      'Minimal ODU redundancy',
      'Basic control system',
      '3-year warranty'
    ],
    balanced: [
      'High efficiency units',
      'Ceiling cassette IDUs for better air distribution',
      'Moderate ODU redundancy (N+1)',
      'Advanced control with scheduling',
      '5-year warranty'
    ],
    premium: [
      'Ultra-high efficiency units',
      'Ducted IDUs for concealed installation',
      'High ODU redundancy (N+2)',
      'Smart IoT-enabled controls',
      'Energy monitoring system',
      '7-year warranty with AMC'
    ]
  };
  return features[level];
}

/**
 * Calculate redundancy level
 */
function calculateRedundancy(odus) {
  if (odus.length === 1) return 'None';
  if (odus.length === 2) return 'N+1';
  return `N+${odus.length - 1}`;
}

/**
 * Generate comparison table data
 */
export function generateComparisonTable(suggestions) {
  const comparison = {
    headers: ['Parameter', 'Economy', 'Balanced', 'Premium'],
    rows: [
      {
        parameter: 'Total Cost',
        economy: `₹${(suggestions.economy.summary.totalCost / 1000).toFixed(1)}K`,
        balanced: `₹${(suggestions.balanced.summary.totalCost / 1000).toFixed(1)}K`,
        premium: `₹${(suggestions.premium.summary.totalCost / 1000).toFixed(1)}K`
      },
      {
        parameter: 'IDU Count',
        economy: suggestions.economy.equipment.idus.count,
        balanced: suggestions.balanced.equipment.idus.count,
        premium: suggestions.premium.equipment.idus.count
      },
      {
        parameter: 'ODU Count',
        economy: suggestions.economy.equipment.odus.count,
        balanced: suggestions.balanced.equipment.odus.count,
        premium: suggestions.premium.equipment.odus.count
      },
      {
        parameter: 'Total Capacity',
        economy: `${suggestions.economy.requiredTonnage.toFixed(1)} TR`,
        balanced: `${suggestions.balanced.requiredTonnage.toFixed(1)} TR`,
        premium: `${suggestions.premium.requiredTonnage.toFixed(1)} TR`
      },
      {
        parameter: 'Diversity Factor',
        economy: `${(suggestions.economy.diversityFactor * 100).toFixed(0)}%`,
        balanced: `${(suggestions.balanced.diversityFactor * 100).toFixed(0)}%`,
        premium: `${(suggestions.premium.diversityFactor * 100).toFixed(0)}%`
      },
      {
        parameter: 'Redundancy',
        economy: suggestions.economy.summary.redundancy,
        balanced: suggestions.balanced.summary.redundancy,
        premium: suggestions.premium.summary.redundancy
      },
      {
        parameter: 'Price per Ton',
        economy: `₹${(suggestions.economy.summary.pricePerTon / 1000).toFixed(1)}K`,
        balanced: `₹${(suggestions.balanced.summary.pricePerTon / 1000).toFixed(1)}K`,
        premium: `₹${(suggestions.premium.summary.pricePerTon / 1000).toFixed(1)}K`
      }
    ]
  };
  
  return comparison;
}

export default {
  VRF_SKUS,
  ACCESSORIES,
  generateEquipmentSuggestions,
  generateComparisonTable
};
