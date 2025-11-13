// Firebase Realtime Database Structure for HVAC System
// Complete data architecture for user-wise project management

export const FIREBASE_STRUCTURE = {
  // User Management
  users: {
    "{userId}": {
      profile: {
        name: "string",
        email: "string", 
        company: "string",
        role: "string", // "engineer", "contractor", "consultant"
        createdAt: "timestamp",
        lastLogin: "timestamp"
      },
      projects: {
        "{projectId}": "reference to /projects/{projectId}"
      },
      settings: {
        defaultUnits: "metric/imperial",
        defaultDiversityFactor: 1.2,
        preferredManufacturer: "string"
      }
    }
  },

  // Project Data Structure
  projects: {
    "{projectId}": {
      // Project Metadata
      meta: {
        projectName: "string",
        projectNumber: "string",
        location: "string",
        clientName: "string",
        consultantName: "string",
        createdAt: "timestamp",
        lastUpdated: "timestamp",
        userId: "string",
        status: "draft/in-progress/completed",
        version: "number"
      },

      // Design Conditions (Form 1)
      designData: {
        location: {
          city: "string",
          latitude: "number",
          longitude: "number"
        },
        ambient: {
          dbF: "number", // Dry bulb temperature
          wbF: "number", // Wet bulb temperature
          rh: "number",  // Relative humidity
          elevation: "number"
        },
        indoor: {
          dbF: "number",
          rh: "number",
          ventilationCFM: "number"
        },
        buildingType: "string",
        occupancyType: "string"
      },

      // Building Structure (Form 2)
      building: {
        totalFloors: "number",
        totalArea: "number",
        floors: {
          "{floorId}": {
            name: "string",
            level: "number",
            totalArea: "number",
            rooms: {
              "{roomId}": {
                name: "string",
                type: "string", // "office", "conference", "lobby", etc.
                area: "number",
                length: "number",
                width: "number",
                height: "number",
                occupancy: "number",
                lighting: "number", // watts
                equipment: "number", // watts
                orientation: "string",
                windowArea: "number",
                
                // Heat Load Calculation Results
                heatLoad: {
                  sensibleBTU: "number",
                  latentBTU: "number",
                  totalBTU: "number",
                  TR: "number", // Tons of refrigeration
                  CFM: "number", // Required airflow
                  calculated: "boolean",
                  calculatedAt: "timestamp",
                  
                  // Detailed breakdown
                  breakdown: {
                    solarGain: "number",
                    wallGain: "number",
                    roofGain: "number",
                    peopleGain: "number",
                    lightingGain: "number",
                    equipmentGain: "number",
                    infiltrationGain: "number",
                    ventilationGain: "number"
                  }
                }
              }
            }
          }
        }
      },

      // Equipment Selection (Form 3)
      equipmentSelection: {
        "{floorId}": {
          floorName: "string",
          totalHeatLoad: {
            TR: "number",
            CFM: "number",
            area: "number"
          },
          
          // Room-wise IDU Selection
          rooms: {
            "{roomId}": {
              roomName: "string",
              heatLoadTR: "number",
              heatLoadCFM: "number",
              
              // Selected IDU Details
              iduType: "string", // "wall-mounted", "cassette-4way", "ducted", "ceiling"
              iduModel: "string",
              machineTR: "number", // Standard IDU capacity
              numberOfIDUs: "number",
              totalIDUTonnage: "number",
              mcCFM: "number", // CFM per IDU
              totalCFM: "number",
              
              // Additional specifications
              refrigerantType: "string",
              powerSupply: "string",
              mounting: "string"
            }
          },
          
          // Floor Summary
          floorSummary: {
            totalIDUTonnage: "number",
            totalCFM: "number",
            diversityFactor: "number", // 1.1 to 1.3
            requiredODUCapacity: "number",
            
            // Selected ODU
            oduModel: "string",
            oduHP: "number",
            selectedODUHP: "number",
            actualDiversity: "number", // calculated
            numberOfODUs: "number"
          }
        },
        
        // Project Totals
        projectSummary: {
          totalTR: "number",
          totalCFM: "number",
          totalIDUs: "number",
          totalODUs: "number",
          totalHP: "number"
        }
      },

      // Bill of Quantities (Form 4)
      boq: {
        // Indoor Units
        indoorUnits: {
          "{iduType}": {
            model: "string",
            capacity: "number",
            quantity: "number",
            unitPrice: "number",
            totalPrice: "number"
          }
        },
        
        // Outdoor Units
        outdoorUnits: {
          "{oduModel}": {
            capacity: "number",
            hp: "number",
            quantity: "number",
            unitPrice: "number",
            totalPrice: "number"
          }
        },
        
        // Accessories & Materials
        accessories: {
          // Controls
          wiredRemotes: { quantity: "number", unitPrice: "number" },
          wirelessRemotes: { quantity: "number", unitPrice: "number" },
          centralController: { quantity: "number", unitPrice: "number" },
          
          // Piping & Refrigerant
          copperPiping: {
            liquidLine: { diameter: "string", length: "number", unitPrice: "number" },
            gasLine: { diameter: "string", length: "number", unitPrice: "number" }
          },
          refrigerantGas: { type: "string", quantity: "number", unitPrice: "number" },
          
          // Drainage
          drainPiping: { diameter: "string", length: "number", unitPrice: "number" },
          drainPump: { quantity: "number", unitPrice: "number" },
          
          // Insulation
          pipeInsulation: { thickness: "string", length: "number", unitPrice: "number" },
          acousticInsulation: { area: "number", unitPrice: "number" },
          
          // Electrical
          powerCable: { type: "string", length: "number", unitPrice: "number" },
          controlCable: { length: "number", unitPrice: "number" },
          
          // Installation Materials
          oduMountingPads: { quantity: "number", unitPrice: "number" },
          iduMounts: { quantity: "number", unitPrice: "number" },
          vibrationIsolators: { quantity: "number", unitPrice: "number" },
          isolationValves: { quantity: "number", unitPrice: "number" },
          filterDriers: { quantity: "number", unitPrice: "number" }
        },
        
        // Cost Summary
        summary: {
          equipmentCost: "number",
          materialCost: "number",
          installationCost: "number",
          subtotal: "number",
          tax: "number",
          totalCost: "number",
          generatedAt: "timestamp"
        }
      },

      // Activity Log
      activityLog: {
        "{timestamp}": {
          action: "string", // "created", "updated", "calculated", "exported"
          section: "string", // "design", "building", "equipment", "boq"
          details: "string",
          userId: "string"
        }
      }
    }
  },

  // Master Data
  masterData: {
    // Standard IDU Types and Capacities
    iduTypes: {
      "wall-mounted": {
        name: "Wall Mounted",
        standardCapacities: [0.8, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0],
        cfmPerTR: 400,
        applications: ["office", "bedroom", "small-spaces"]
      },
      "cassette-4way": {
        name: "4-Way Cassette",
        standardCapacities: [1.5, 2.0, 2.5, 3.0, 4.0, 5.0],
        cfmPerTR: 450,
        applications: ["office", "retail", "restaurant"]
      },
      "ducted": {
        name: "Ducted",
        standardCapacities: [2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0],
        cfmPerTR: 400,
        applications: ["large-office", "auditorium", "lobby"]
      }
    },
    
    // Standard ODU Capacities
    oduCapacities: [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32],
    
    // Diversity Factors by Building Type
    diversityFactors: {
      "office": 1.2,
      "retail": 1.15,
      "hotel": 1.25,
      "hospital": 1.1,
      "residential": 1.3
    },
    
    // Standard Pricing (can be updated)
    pricing: {
      iduPrices: {
        "wall-mounted": { basePrice: 800, pricePerTR: 400 },
        "cassette-4way": { basePrice: 1200, pricePerTR: 500 },
        "ducted": { basePrice: 1000, pricePerTR: 450 }
      },
      oduPrices: { basePricePerHP: 600 },
      accessories: {
        wiredRemote: 150,
        wirelessRemote: 200,
        centralController: 2000,
        copperPipePerMeter: 25,
        refrigerantPerKg: 45
      }
    }
  }
};

// Helper functions for data structure operations
export const createProjectStructure = (projectData) => {
  return {
    meta: {
      ...projectData,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      status: "draft",
      version: 1
    },
    designData: {},
    building: { floors: {} },
    equipmentSelection: {},
    boq: { accessories: {}, summary: {} },
    activityLog: {}
  };
};

export const createFloorStructure = (floorData) => {
  return {
    ...floorData,
    totalArea: 0,
    rooms: {}
  };
};

export const createRoomStructure = (roomData) => {
  return {
    ...roomData,
    heatLoad: {
      sensibleBTU: 0,
      latentBTU: 0,
      totalBTU: 0,
      TR: 0,
      CFM: 0,
      calculated: false,
      breakdown: {}
    }
  };
};
