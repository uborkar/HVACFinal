
import {
  BUILDING_TYPES,
  SPACE_CATEGORIES,
  WINDOW_TYPES,
  WALL_CONSTRUCTIONS,
  ROOF_CONSTRUCTIONS,
  CLIMATE_ZONES,
  calculateFloorArea,
  calculateVolume,
  getRecommendedConditions
} from '../config/buildingTypes';

class AdvancedHVACCalculator {
  constructor() {
    this.conversionFactors = {
      BTU_TO_TONS: 12000,
      WATTS_TO_BTU: 3.412,
      CFM_TO_LPS: 0.472,
      SQFT_TO_SQM: 0.0929
    };
  }

  // Main heat load calculation method
  async calculateCompleteHeatLoad(projectData, spaceData) {
    const results = {
      summary: {},
      detailed: {},
      recommendations: [],
      equipment: {},
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Transmission Heat Gain/Loss
      results.transmission = this.calculateTransmissionLoads(spaceData);

      // 2. Solar Heat Gain
      results.solar = this.calculateSolarGains(spaceData);

      // 3. Internal Heat Gains
      results.internal = this.calculateInternalGains(spaceData);

      // 4. Ventilation/Infiltration Loads
      results.ventilation = this.calculateVentilationLoads(spaceData);

      // 5. Total Load Summary
      results.summary = this.calculateTotalLoad(results);

      // 6. Equipment Recommendations
      results.equipment = this.recommendEquipment(results.summary);

      // 7. Detailed Breakdown
      results.detailed = this.generateDetailedBreakdown(results);

      // 8. Recommendations
      results.recommendations = this.generateRecommendations(results);

      return results;
    } catch (error) {
      console.error('Error in heat load calculation:', error);
      throw new Error('Failed to calculate heat load');
    }
  }

  // 1. Transmission Heat Gain/Loss Calculations
  calculateTransmissionLoads(spaceData) {
    const transmission = {   
      walls: { sensible: 0, latent: 0 },
      roof: { sensible: 0, latent: 0 },
      windows: { sensible: 0, latent: 0 },
      doors: { sensible: 0, latent: 0 },
      floor: { sensible: 0, latent: 0 },
      total: { sensible: 0, latent: 0 }
    };

    // Wall transmission
    if (spaceData.walls && spaceData.walls.length > 0) {
      spaceData.walls.forEach(wall => {
        const area = wall.length * wall.height;
        const uFactor = WALL_CONSTRUCTIONS[wall.construction]?.uFactor || 0.1;
        const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;

        transmission.walls.sensible += area * uFactor * tempDiff;
      });
    }

    // Roof transmission
    if (spaceData.roof) {
      const area = spaceData.length * spaceData.width;
      const uFactor = ROOF_CONSTRUCTIONS[spaceData.roof.construction]?.uFactor || 0.05;
      const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;

      transmission.roof.sensible = area * uFactor * tempDiff;
    }

    // Window transmission
    if (spaceData.windows && spaceData.windows.length > 0) {
      spaceData.windows.forEach(window => {
        const area = window.width * window.height;
        const uFactor = WINDOW_TYPES[window.type]?.uFactor || 0.5;
        const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;

        transmission.windows.sensible += area * uFactor * tempDiff;
      });
    }

    // Door transmission
    if (spaceData.doors && spaceData.doors.length > 0) {
      spaceData.doors.forEach(door => {
        const area = door.width * door.height;
        const uFactor = 0.5; // Standard door U-factor
        const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;

        transmission.doors.sensible += area * uFactor * tempDiff;
      });
    }

    // Floor transmission (for ground floor or basement)
    if (spaceData.floor && spaceData.floor.isGroundFloor) {
      const area = spaceData.length * spaceData.width;
      const uFactor = 0.1; // Ground floor U-factor
      const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;

      transmission.floor.sensible = area * uFactor * tempDiff;
    }

    // Calculate totals
    transmission.total.sensible =
      transmission.walls.sensible +
      transmission.roof.sensible +
      transmission.windows.sensible +
      transmission.doors.sensible +
      transmission.floor.sensible;

    return transmission;
  }

  // 2. Solar Heat Gain Calculations
  calculateSolarGains(spaceData) {
    const solar = {
      windows: { direct: 0, diffuse: 0, total: 0 },
      walls: { total: 0 },
      roof: { total: 0 },
      total: 0
    };

    // Window solar gain
    if (spaceData.windows && spaceData.windows.length > 0) {
      spaceData.windows.forEach(window => {
        const area = window.width * window.height;
        const windowType = WINDOW_TYPES[window.type];
        const shgc = windowType?.shgc || 0.7;

        // Solar Heat Gain Factor (simplified)
        const shgf = this.getSolarHeatGainFactor(window.orientation, spaceData.latitude);

        // Direct solar gain
        solar.windows.direct += area * shgf * shgc * 0.87; // 0.87 is typical solar transmission factor

        // Diffuse solar gain
        solar.windows.diffuse += area * 31 * shgc * 0.5; // 31 BTU/hr-sq ft is typical diffuse radiation
      });
    }

    // Wall solar gain (for sun-exposed walls)
    if (spaceData.walls && spaceData.walls.length > 0) {
      spaceData.walls.forEach(wall => {
        if (wall.isSunExposed) {
          const area = wall.length * wall.height;
          const solarAbsorptance = wall.solarAbsorptance || 0.7;
          const shgf = this.getSolarHeatGainFactor(wall.orientation, spaceData.latitude);

          solar.walls.total += area * shgf * solarAbsorptance;
        }
      });
    }

    // Roof solar gain
    if (spaceData.roof && spaceData.roof.isSunExposed) {
      const area = spaceData.length * spaceData.width;
      const solarAbsorptance = spaceData.roof.solarAbsorptance || 0.8;
      const shgf = this.getSolarHeatGainFactor('south', spaceData.latitude); // Assume south-facing roof

      solar.roof.total = area * shgf * solarAbsorptance;
    }

    // Calculate totals
    solar.windows.total = solar.windows.direct + solar.windows.diffuse;
    solar.total = solar.windows.total + solar.walls.total + solar.roof.total;

    return solar;
  }

  // 3. Internal Heat Gains
  calculateInternalGains(spaceData) {
    const internal = {
      people: { sensible: 0, latent: 0 },
      lighting: 0,
      equipment: 0,
      appliances: 0,
      total: { sensible: 0, latent: 0 }
    };

    const area = calculateFloorArea(spaceData.length, spaceData.width);
    const occupancy = spaceData.occupancy || this.calculateOccupancy(spaceData);

    // People heat gain (based on activity level)
    const activityLevel = spaceData.activityLevel || 'light'; // light, moderate, heavy
    const peopleHeatGain = this.getPeopleHeatGain(activityLevel);

    internal.people.sensible = occupancy * peopleHeatGain.sensible;
    internal.people.latent = occupancy * peopleHeatGain.latent;

    // Lighting heat gain
    const lightingLoad = SPACE_CATEGORIES[spaceData.category]?.heatGains?.lighting || 1.5;
    internal.lighting = area * lightingLoad * this.conversionFactors.WATTS_TO_BTU;

    // Equipment heat gain
    const equipmentLoad = SPACE_CATEGORIES[spaceData.category]?.heatGains?.equipment || 1.0;
    internal.equipment = area * equipmentLoad * this.conversionFactors.WATTS_TO_BTU;

    // Appliances (kitchen equipment, etc.)
    if (spaceData.appliances) {
      internal.appliances = spaceData.appliances.reduce((total, appliance) => {
        return total + (appliance.power * appliance.quantity * this.conversionFactors.WATTS_TO_BTU);
      }, 0);
    }

    // Calculate totals
    internal.total.sensible =
      internal.people.sensible +
      internal.lighting +
      internal.equipment +
      internal.appliances;

    internal.total.latent = internal.people.latent;

    return internal;
  }

  // 4. Ventilation and Infiltration Loads
  calculateVentilationLoads(spaceData) {
    const ventilation = {
      infiltration: { sensible: 0, latent: 0 },
      ventilation: { sensible: 0, latent: 0 },
      total: { sensible: 0, latent: 0 },
      cfm: 0
    };

    const volume = calculateVolume(spaceData.length, spaceData.width, spaceData.height);

    // Infiltration load (air leakage)
    const infiltrationRate = spaceData.infiltrationRate || 0.5; // ACH (air changes per hour)
    const cfmInfiltration = (volume * infiltrationRate) / 60;

    const tempDiff = spaceData.outsideTemp - spaceData.insideTemp;
    const humidityDiff = spaceData.outsideHumidity - spaceData.insideHumidity;

    ventilation.infiltration.sensible = cfmInfiltration * 1.08 * tempDiff;
    ventilation.infiltration.latent = cfmInfiltration * 0.68 * humidityDiff;

    // Required ventilation (ASHRAE 62.1)
    const ventilationRate = SPACE_CATEGORIES[spaceData.category]?.heatGains?.ventilation || 0.35;
    const cfmVentilation = area * ventilationRate;

    ventilation.ventilation.sensible = cfmVentilation * 1.08 * tempDiff;
    ventilation.ventilation.latent = cfmVentilation * 0.68 * humidityDiff;

    // Total ventilation load
    ventilation.total.sensible = ventilation.infiltration.sensible + ventilation.ventilation.sensible;
    ventilation.total.latent = ventilation.infiltration.latent + ventilation.ventilation.latent;
    ventilation.cfm = cfmInfiltration + cfmVentilation;

    return ventilation;
  }

  // 5. Total Load Summary
  calculateTotalLoad(results) {
    const summary = {
      sensible: 0,
      latent: 0,
      total: 0,
      tons: 0,
      cfm: 0
    };

    // Sum all sensible loads
    summary.sensible =
      (results.transmission?.total?.sensible || 0) +
      (results.solar?.total || 0) +
      (results.internal?.total?.sensible || 0) +
      (results.ventilation?.total?.sensible || 0);

    // Sum all latent loads
    summary.latent =
      (results.internal?.total?.latent || 0) +
      (results.ventilation?.total?.latent || 0);

    // Total load
    summary.total = summary.sensible + summary.latent;

    // Convert to tons
    summary.tons = summary.sensible / this.conversionFactors.BTU_TO_TONS;

    // CFM requirement
    summary.cfm = results.ventilation?.cfm || 0;

    return summary;
  }

  // 6. Equipment Recommendations
  recommendEquipment(summary) {
    const equipment = {
      cooling: [],
      heating: [],
      ventilation: [],
      controls: []
    };

    // Cooling equipment based on total load
    if (summary.tons <= 5) {
      equipment.cooling.push({
        type: 'Split System Air Conditioner',
        capacity: Math.ceil(summary.tons),
        seer: '16-22',
        cost: '$3,000 - $6,000'
      });
    } else if (summary.tons <= 25) {
      equipment.cooling.push({
        type: 'Packaged Rooftop Unit',
        capacity: Math.ceil(summary.tons),
        seer: '14-18',
        cost: '$8,000 - $20,000'
      });
    } else {
      equipment.cooling.push({
        type: 'Chiller System',
        capacity: Math.ceil(summary.tons),
        efficiency: '0.6-1.2 kW/ton',
        cost: '$50,000+'
      });
    }

    // Heating equipment
    const heatingBTU = summary.sensible * 1.2; // 20% safety factor
    if (heatingBTU <= 150000) {
      equipment.heating.push({
        type: 'Gas Furnace',
        capacity: heatingBTU,
        afue: '90-98%',
        cost: '$2,000 - $5,000'
      });
    } else {
      equipment.heating.push({
        type: 'Commercial Boiler',
        capacity: heatingBTU,
        afue: '85-95%',
        cost: '$10,000 - $30,000'
      });
    }

    // Ventilation equipment
    equipment.ventilation.push({
      type: summary.cfm <= 500 ? 'HRV/ERV' : 'DOAS',
      capacity: summary.cfm,
      efficiency: '60-85%',
      cost: summary.cfm <= 500 ? '$1,000 - $3,000' : '$5,000 - $15,000'
    });

    // Controls
    equipment.controls.push({
      type: 'Smart Thermostat with Zoning',
      features: ['Programmable', 'WiFi', 'Energy monitoring'],
      cost: '$200 - $500'
    });

    return equipment;
  }

  // 7. Detailed Breakdown
  generateDetailedBreakdown(results) {
    return {
      transmission: this.formatLoadBreakdown(results.transmission),
      solar: this.formatLoadBreakdown(results.solar),
      internal: this.formatLoadBreakdown(results.internal),
      ventilation: this.formatLoadBreakdown(results.ventilation),
      summary: this.formatLoadBreakdown(results.summary)
    };
  }

  // 8. Recommendations
  generateRecommendations(results) {
    const recommendations = [];

    // Energy efficiency recommendations
    if (results.summary.tons > 10) {
      recommendations.push('Consider high-efficiency equipment (SEER 18+) for significant energy savings');
    }

    if (results.solar.total > results.summary.sensible * 0.3) {
      recommendations.push('Install solar shading devices or reflective glazing to reduce solar heat gain');
    }

    if (results.ventilation.cfm > 1000) {
      recommendations.push('Implement energy recovery ventilation to reduce ventilation loads');
    }

    recommendations.push('Consider LED lighting to reduce internal heat gains');
    recommendations.push('Implement proper insulation to minimize transmission losses');
    recommendations.push('Use programmable thermostats for better temperature control');

    return recommendations;
  }

  // Helper Methods
  calculateOccupancy(spaceData) {
    const area = calculateFloorArea(spaceData.length, spaceData.width);
    const baseDensity = SPACE_CATEGORIES[spaceData.category]?.heatGains?.people || 400;
    return Math.ceil(area / 100); // 1 person per 100 sq ft default
  }

  getPeopleHeatGain(activityLevel) {
    const heatGains = {
      light: { sensible: 250, latent: 150 }, // Office work
      moderate: { sensible: 300, latent: 200 }, // Light industrial
      heavy: { sensible: 400, latent: 300 } // Heavy industrial
    };
    return heatGains[activityLevel] || heatGains.light;
  }

  getSolarHeatGainFactor(orientation, latitude) {
    // Simplified SHGF calculation - in real implementation, use detailed solar tables
    const baseSHGF = {
      north: 0,
      south: 200,
      east: 150,
      west: 150,
      northeast: 75,
      northwest: 75,
      southeast: 75,
      southwest: 75
    };

    return baseSHGF[orientation.toLowerCase()] || 100;
  }

  formatLoadBreakdown(loadData) {
    if (!loadData) return {};

    const formatted = {};
    Object.entries(loadData).forEach(([key, value]) => {
      if (typeof value === 'number') {
        formatted[key] = Math.round(value);
      } else if (typeof value === 'object') {
        formatted[key] = this.formatLoadBreakdown(value);
      }
    });
    return formatted;
  }

  // Advanced calculation methods
  calculateBypassFactor(spaceData) {
    // Calculate bypass factor for air conditioning systems
    const bypassFactor = spaceData.bypassFactor || 0.2;
    return bypassFactor;
  }

  calculateContactFactor(spaceData) {
    // Calculate contact factor for heat transfer
    const contactFactor = spaceData.contactFactor || 0.8;
    return contactFactor;
  }

  calculateUFactor(wallConstruction, insulation) {
    // Calculate overall U-factor based on construction and insulation
    const baseUFactor = WALL_CONSTRUCTIONS[wallConstruction]?.uFactor || 0.1;
    const insulationFactor = insulation ? 1 / (insulation.rValue + 1/baseUFactor) : baseUFactor;
    return insulationFactor;
  }

  // Real-time data integration
  async fetchWeatherData(location) {
    // This would integrate with weather APIs
    return {
      temperature: 95,
      humidity: 60,
      solarIrradiance: 300
    };
  }

  // Building type specific calculations
  getBuildingTypeDefaults(buildingType) {
    return BUILDING_TYPES[buildingType] || BUILDING_TYPES.OFFICE_BUILDING;
  }

  getSpaceCategoryDefaults(category) {
    return SPACE_CATEGORIES[category] || SPACE_CATEGORIES['Open Office'];
  }
}

export default AdvancedHVACCalculator;
