// Indian HVAC Calculation Standards
// Based on Indian climate conditions (Latitude 20°, Hottest month: May)

export const IndianHVACCalculations = {
  
  // Solar Heat Gain Through Glass (BTU/Hr per Sq.Ft) - May month, 20° Latitude
  solarGainThroughGlass: {
    'North': 20,
    'North East': 71,
    'East': 75,
    'South East': 31,
    'South': 3,
    'South West': 3,
    'West': 3,
    'North West': 3,
    'Horizontal': 8
  },

  // Glass Types and their base U-factors (No Shade)
  glassTypes: {
    'Ordinary Glass': { uFactor: 1.00, category: 'single' },
    'Regular Plate (1/4 inch)': { uFactor: 0.94, category: 'single' },
    'Heat Absorbing Glass 40-48%': { uFactor: 0.80, category: 'single' },
    'Heat Absorbing Glass 48-56%': { uFactor: 0.73, category: 'single' },
    'Heat Absorbing Glass 56-70%': { uFactor: 0.62, category: 'single' },
    'Double Pane Ordinary Glass': { uFactor: 0.90, category: 'double' },
    'Double Pane Regular Plate': { uFactor: 0.80, category: 'double' },
    'Double Pane 48-56% Absorbing Outside': { uFactor: 0.52, category: 'double' },
    'Double Pane 48-56% Absorbing Outside Regular Inside': { uFactor: 0.50, category: 'double' },
    'Triple Pane Ordinary Glass': { uFactor: 0.83, category: 'triple' },
    'Triple Pane Regular Plate': { uFactor: 0.69, category: 'triple' }
  },

  // Shading Factors for different shading devices
  shadingFactors: {
    'No Shade': 1.00,
    'Inside Venetian Blind Light Colour': 0.56,
    'Inside Venetian Blind Medium Colour': 0.65,
    'Inside Venetian Blind Dark Colour': 0.75,
    'Inside Venetian Blind 450 Horz Slates Light': 0.15,
    'Inside Venetian Blind 450 Horz Slates Dark': 0.13,
    'Outside Shading Screen 170 Horz Slates Medium': 0.22,
    'Outside Shading Screen 170 Horz Slates Dark': 0.15,
    'Outside Awning Vent Sides & Top Light': 0.20,
    'Outside Awning Vent Sides & Top Medium/Dark': 0.25
  },

  // Painted Glass Factors
  paintedGlassFactors: {
    'Light Colour': 0.28,
    'Medium Colour': 0.39,
    'Dark Colour': 0.50
  },

  // Stained Glass Factors
  stainedGlassFactors: {
    'Amber Colour': 0.70,
    'Dark Red': 0.56,
    'Dark Blue': 0.60,
    'Dark Green': 0.32,
    'Grayed Green': 0.46,
    'Light Opalescent': 0.43,
    'Dark Opalescent': 0.37
  },

  // Wall ETD values based on exposure and wall weight
  wallETD: {
    // For 60 lbs/sq.ft (4"/6" brick wall) - standard Indian construction
    'North': 14,
    'North East': 18,
    'East': 25,
    'South East': 28,
    'South': 20,
    'South West': 25,
    'West': 30,
    'North West': 22,
    // Add more wall weights if needed
    weights: {
      '30': { // Light weight walls
        'North': 10, 'North East': 14, 'East': 20, 'South East': 22,
        'South': 16, 'South West': 20, 'West': 24, 'North West': 18
      },
      '60': { // Standard brick walls (4"/6")
        'North': 14, 'North East': 18, 'East': 25, 'South East': 28,
        'South': 20, 'South West': 25, 'West': 30, 'North West': 22
      },
      '100': { // Heavy walls
        'North': 12, 'North East': 15, 'East': 22, 'South East': 25,
        'South': 18, 'South West': 22, 'West': 27, 'North West': 20
      }
    }
  },

  // Roof ETD values based on sun exposure and roof weight
  roofETD: {
    'Exposed to Sun': {
      '30': 45, // Light roof
      '60': 35, // Medium roof
      '100': 28 // Heavy roof
    },
    'Shaded': {
      '30': 15,
      '60': 12,
      '100': 10
    }
  },

  // Wall U-factors for different wall types (BTU/hr·ft²·°F)
  wallUFactors: {
    '4 inch Brick Wall': 0.79,
    '6 inch Brick Wall': 0.58,
    '8 inch Brick Wall': 0.48,
    '4 inch Concrete Block': 0.71,
    '6 inch Concrete Block': 0.65,
    '8 inch Concrete Block': 0.58,
    'Frame Wall with Insulation': 0.25,
    'Frame Wall without Insulation': 0.45
  },

  // Roof U-factors for different roof types
  roofUFactors: {
    'Concrete Slab 4 inch': 0.76,
    'Concrete Slab 6 inch': 0.67,
    'Metal Roof with Insulation': 0.15,
    'Metal Roof without Insulation': 1.20,
    'Tile Roof with Insulation': 0.25,
    'Tile Roof without Insulation': 0.80,
    'RCC Slab with Insulation': 0.20,
    'RCC Slab without Insulation': 0.76
  },

  // Calculate solar heat gain through glass
  calculateSolarHeatGain: function(orientation, glassArea, glassType, shadingType) {
    const baseSolarGain = this.solarGainThroughGlass[orientation] || 0;
    const glassInfo = this.glassTypes[glassType] || { uFactor: 1.00 };
    const shadingFactor = this.shadingFactors[shadingType] || 1.00;
    
    // Solar Heat Gain = Area × Solar Gain Factor × Glass Factor × Shading Factor
    return glassArea * baseSolarGain * glassInfo.uFactor * shadingFactor;
  },

  // Calculate transmission heat gain through glass
  calculateTransmissionHeatGain: function(glassArea, glassType, tempDifference) {
    const glassInfo = this.glassTypes[glassType] || { uFactor: 1.00 };
    
    // Transmission Heat Gain = Area × U-factor × Temperature Difference
    return glassArea * glassInfo.uFactor * tempDifference;
  },

  // Calculate wall heat gain
  calculateWallHeatGain: function(wallArea, wallType, orientation, wallWeight, tempDifference) {
    const wallUFactor = this.wallUFactors[wallType] || 0.58; // Default to 6 inch brick
    const etdValue = this.wallETD.weights[wallWeight]?.[orientation] || this.wallETD[orientation] || 20;
    
    // Wall Heat Gain = Area × U-factor × (ETD + Temperature Difference)
    return wallArea * wallUFactor * (etdValue + tempDifference);
  },

  // Calculate roof heat gain
  calculateRoofHeatGain: function(roofArea, roofType, sunExposure, roofWeight, tempDifference) {
    const roofUFactor = this.roofUFactors[roofType] || 0.76; // Default to concrete slab
    const etdValue = this.roofETD[sunExposure]?.[roofWeight] || 35;
    
    // Roof Heat Gain = Area × U-factor × (ETD + Temperature Difference)
    return roofArea * roofUFactor * (etdValue + tempDifference);
  },

  // Get available orientations
  getOrientations: function() {
    return Object.keys(this.solarGainThroughGlass);
  },

  // Get available glass types
  getGlassTypes: function() {
    return Object.keys(this.glassTypes);
  },

  // Get available shading types
  getShadingTypes: function() {
    return Object.keys(this.shadingFactors);
  },

  // Get available wall types
  getWallTypes: function() {
    return Object.keys(this.wallUFactors);
  },

  // Get available roof types
  getRoofTypes: function() {
    return Object.keys(this.roofUFactors);
  },

  // Get wall weights
  getWallWeights: function() {
    return Object.keys(this.wallETD.weights);
  },

  // Get roof weights
  getRoofWeights: function() {
    return ['30', '60', '100']; // Light, Medium, Heavy
  },

  // Get sun exposure options
  getSunExposureOptions: function() {
    return Object.keys(this.roofETD);
  },

  // Validate and get solar gain for orientation
  getSolarGainForOrientation: function(orientation) {
    return this.solarGainThroughGlass[orientation] || 0;
  },

  // Get the highest solar gain value (for worst case scenario)
  getMaxSolarGain: function() {
    const values = Object.values(this.solarGainThroughGlass);
    return Math.max(...values);
  },

  // Get ETD for wall based on orientation and weight
  getWallETD: function(orientation, wallWeight = '60') {
    return this.wallETD.weights[wallWeight]?.[orientation] || this.wallETD[orientation] || 20;
  },

  // Get ETD for roof based on exposure and weight
  getRoofETD: function(sunExposure, roofWeight = '60') {
    return this.roofETD[sunExposure]?.[roofWeight] || 35;
  }
};

export default IndianHVACCalculations;
