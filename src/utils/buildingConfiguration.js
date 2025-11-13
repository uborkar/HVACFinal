/**
 * HVAC Building Configuration Database
 * Based on ASHRAE Standards for Indoor Design Conditions
 * Comprehensive building types with space categories and design parameters
 */

export const BUILDING_CONFIGURATIONS = {
  // RESIDENTIAL BUILDINGS
  independent_house: {
    name: "Independent House",
    description: "Single family independent house with multiple rooms",
    category: "Residential",
    summer: {
      deluxe: { db: 74, wb: 62.5, rh: 50, tempSwing: 2 },
      commercial: { db: 78, wb: 65, rh: 50, tempSwing: 4 }
    },
    winter: {
      withHumidification: { db: 74, rh: 35, tempSwing: -3 },
      withoutHumidification: { db: 74, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Living Areas",
        subcategories: ["Living Room", "Family Room", "Drawing Room", "Lounge", "TV Room"]
      },
      {
        name: "Bedrooms", 
        subcategories: ["Master Bedroom", "Bedroom", "Kids Room", "Guest Room", "Study Room"]
      },
      {
        name: "Kitchen & Dining",
        subcategories: ["Kitchen", "Dining Room", "Breakfast Area", "Pantry", "Utility Room"]
      },
      {
        name: "Bathrooms",
        subcategories: ["Master Bathroom", "Common Bathroom", "Powder Room", "Guest Toilet"]
      },
      {
        name: "Other Spaces",
        subcategories: ["Home Office", "Store Room", "Balcony", "Terrace", "Garage"]
      }
    ]
  },

  villa_bungalow: {
    name: "Villa/Bungalow",
    description: "Luxury villa or bungalow with premium amenities",
    category: "Residential",
    summer: {
      deluxe: { db: 74, wb: 62.5, rh: 50, tempSwing: 2 },
      commercial: { db: 76, wb: 63, rh: 50, tempSwing: 3 }
    },
    winter: {
      withHumidification: { db: 74, rh: 40, tempSwing: -2 },
      withoutHumidification: { db: 75, tempSwing: -3 }
    },
    spaceCategories: [
      {
        name: "Grand Living Areas",
        subcategories: ["Grand Living Room", "Formal Living", "Family Room", "Entertainment Room", "Home Theater"]
      },
      {
        name: "Luxury Bedrooms", 
        subcategories: ["Master Suite", "Bedroom Suite", "Guest Suite", "Kids Room", "Nanny Room"]
      },
      {
        name: "Kitchen & Dining",
        subcategories: ["Gourmet Kitchen", "Formal Dining", "Casual Dining", "Breakfast Nook", "Butler Pantry"]
      },
      {
        name: "Recreation Areas",
        subcategories: ["Home Gym", "Game Room", "Library", "Wine Cellar", "Spa Room"]
      },
      {
        name: "Utility & Service",
        subcategories: ["Home Office", "Laundry Room", "Storage", "Garage", "Staff Quarters"]
      }
    ]
  },

  row_house: {
    name: "Row House",
    description: "Attached row house in residential development",
    category: "Residential",
    summer: {
      deluxe: { db: 74, wb: 62.5, rh: 50, tempSwing: 2 },
      commercial: { db: 78, wb: 65, rh: 50, tempSwing: 4 }
    },
    winter: {
      withHumidification: { db: 74, rh: 35, tempSwing: -3 },
      withoutHumidification: { db: 74, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Living Areas",
        subcategories: ["Living Room", "Dining Area", "Family Area", "TV Lounge"]
      },
      {
        name: "Bedrooms", 
        subcategories: ["Master Bedroom", "Bedroom", "Kids Room", "Study Room"]
      },
      {
        name: "Kitchen & Utility",
        subcategories: ["Kitchen", "Breakfast Area", "Utility Room", "Store Room"]
      },
      {
        name: "Bathrooms",
        subcategories: ["Master Bathroom", "Common Bathroom", "Guest Toilet"]
      },
      {
        name: "Other Areas",
        subcategories: ["Balcony", "Terrace", "Staircase", "Corridor"]
      }
    ]
  },

  // GENERAL COMFORT APPLICATIONS
  general_comfort: {
    name: "General Comfort",
    description: "Apt, House, Hotel, Office, Hospital, School",
    category: "Mixed Use",
  },

  // RETAIL SHOPS
  retail_shops: {
    name: "Retail Shops",
    description: "Short term occupancy - Bank, Barber or Beauty Shop, Dept. Store, Supermarket, etc.",
    summer: {
      deluxe: { db: 76, wb: 63, rh: 50, tempSwing: 2 },
      commercial: { db: 78, wb: 65, rh: 50, tempSwing: 4 }
    },
    winter: {
      withHumidification: { db: 72, rh: 35, tempSwing: -3 },
      withoutHumidification: { db: 74, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Retail Spaces",
        subcategories: ["Sales Floor", "Showroom", "Fitting Room", "Storage", "Cash Counter", "Customer Service"]
      },
      {
        name: "Department Store",
        subcategories: ["Ground Floor", "Fashion Section", "Electronics", "Home Appliances", "Food Court", "Escalator Area"]
      },
      {
        name: "Supermarket",
        subcategories: ["Fresh Produce", "Frozen Section", "Grocery Aisles", "Checkout Area", "Customer Area", "Storage"]
      },
      {
        name: "Banking",
        subcategories: ["Customer Area", "Teller Counter", "Manager Cabin", "Waiting Area", "ATM Area", "Safe Room"]
      },
      {
        name: "Beauty/Salon",
        subcategories: ["Treatment Room", "Reception", "Waiting Area", "Hair Washing", "Styling Area", "Storage"]
      }
    ]
  },

  // LOW SENSIBLE HEAT FACTOR APPLICATIONS
  low_sensible_heat: {
    name: "Low Sensible Heat Factor",
    description: "High Latent Load - Auditorium, Church, Bar, Restaurant, Kitchen, etc.",
    summer: {
      deluxe: { db: 76, wb: 65, rh: 55, tempSwing: 1 },
      commercial: { db: 78, wb: 67, rh: 60, tempSwing: 2 }
    },
    winter: {
      withHumidification: { db: 72, rh: 40, tempSwing: -2 },
      withoutHumidification: { db: 75, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Entertainment Venues",
        subcategories: ["Auditorium", "Theater", "Cinema Hall", "Concert Hall", "Stage Area", "Green Room"]
      },
      {
        name: "Religious Buildings",
        subcategories: ["Main Hall", "Prayer Room", "Community Hall", "Office", "Storage", "Entrance Lobby"]
      },
      {
        name: "Restaurants",
        subcategories: ["Dining Area", "Bar Area", "Kitchen", "Prep Area", "Storage", "Staff Area"]
      },
      {
        name: "Bars & Pubs",
        subcategories: ["Bar Counter", "Seating Area", "Dance Floor", "DJ Area", "Storage", "Restroom"]
      },
      {
        name: "Commercial Kitchen",
        subcategories: ["Cooking Area", "Prep Area", "Dishwashing", "Cold Storage", "Dry Storage", "Staff Area"]
      }
    ]
  },

  // FACTORY COMFORT
  factory_comfort: {
    name: "Factory Comfort",
    description: "Assembly Area, Machining Rooms, etc.",
    summer: {
      deluxe: { db: 78, wb: 66, rh: 55, tempSwing: 3 },
      commercial: { db: 82, wb: 69, rh: 60, tempSwing: 6 }
    },
    winter: {
      withHumidification: { db: 68, rh: 35, tempSwing: -4 },
      withoutHumidification: { db: 70, tempSwing: -6 }
    },
    spaceCategories: [
      {
        name: "Manufacturing Areas",
        subcategories: ["Assembly Line", "Machining Area", "Quality Control", "Packaging", "Dispatch", "Raw Material Storage"]
      },
      {
        name: "Industrial Spaces",
        subcategories: ["Production Floor", "Tool Room", "Maintenance Shop", "Electrical Room", "Compressor Room", "Boiler Room"]
      },
      {
        name: "Warehouse",
        subcategories: ["Storage Area", "Loading Dock", "Sorting Area", "Office Area", "Security Room", "Canteen"]
      },
      {
        name: "Textile Industry",
        subcategories: ["Spinning", "Weaving", "Dyeing", "Finishing", "Quality Check", "Packing"]
      }
    ]
  },

  // HOSPITALS (Specialized)
  hospital: {
    name: "Hospital",
    description: "Medical facilities with specialized requirements",
    summer: {
      deluxe: { db: 74, wb: 62, rh: 50, tempSwing: 1 },
      commercial: { db: 76, wb: 63, rh: 50, tempSwing: 2 }
    },
    winter: {
      withHumidification: { db: 74, rh: 45, tempSwing: -2 },
      withoutHumidification: { db: 75, tempSwing: -3 }
    },
    spaceCategories: [
      {
        name: "Critical Care Areas",
        subcategories: ["ICU", "NICU", "CCU", "Operation Theater", "Recovery Room", "Emergency Room"]
      },
      {
        name: "Patient Areas",
        subcategories: ["General Ward", "Private Room", "Semi-Private Room", "Pediatric Ward", "Maternity Ward", "Isolation Room"]
      },
      {
        name: "Diagnostic Areas",
        subcategories: ["X-Ray Room", "CT Scan", "MRI Room", "Ultrasound", "Laboratory", "Pathology"]
      },
      {
        name: "Support Areas",
        subcategories: ["Pharmacy", "Blood Bank", "Central Sterilization", "Laundry", "Kitchen", "Morgue"]
      },
      {
        name: "Administrative Areas",
        subcategories: ["Reception", "Waiting Area", "Doctor's Office", "Nurse Station", "Medical Records", "Conference Room"]
      }
    ]
  },

  // SHOPPING MALLS
  shopping_mall: {
    name: "Shopping Mall",
    description: "Large retail complexes with mixed occupancy",
    summer: {
      deluxe: { db: 76, wb: 63, rh: 50, tempSwing: 2 },
      commercial: { db: 78, wb: 65, rh: 50, tempSwing: 3 }
    },
    winter: {
      withHumidification: { db: 72, rh: 40, tempSwing: -3 },
      withoutHumidification: { db: 74, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Retail Stores",
        subcategories: ["Anchor Store", "Brand Outlets", "Kiosks", "Pop-up Stores", "Jewelry Store", "Electronics Store"]
      },
      {
        name: "Food & Beverage",
        subcategories: ["Food Court", "Restaurant", "Cafe", "Fast Food", "Ice Cream Parlor", "Bakery"]
      },
      {
        name: "Entertainment",
        subcategories: ["Multiplex", "Gaming Zone", "Kids Play Area", "Bowling Alley", "Fitness Center", "Spa"]
      },
      {
        name: "Common Areas",
        subcategories: ["Atrium", "Corridors", "Escalator Area", "Elevator Lobby", "Seating Area", "Information Desk"]
      },
      {
        name: "Service Areas",
        subcategories: ["Security Office", "Maintenance Room", "Storage", "Loading Dock", "Parking", "Restrooms"]
      }
    ]
  },

  // HOTELS (Detailed)
  hotel: {
    name: "Hotel",
    description: "Hospitality industry with diverse space requirements",
    summer: {
      deluxe: { db: 74, wb: 62, rh: 50, tempSwing: 2 },
      commercial: { db: 76, wb: 63, rh: 50, tempSwing: 3 }
    },
    winter: {
      withHumidification: { db: 74, rh: 40, tempSwing: -2 },
      withoutHumidification: { db: 75, tempSwing: -3 }
    },
    spaceCategories: [
      {
        name: "Guest Rooms",
        subcategories: ["Standard Room", "Deluxe Room", "Suite", "Presidential Suite", "Connecting Rooms", "Accessible Rooms"]
      },
      {
        name: "Public Areas",
        subcategories: ["Lobby", "Reception", "Concierge", "Business Center", "Gift Shop", "Lounge"]
      },
      {
        name: "Food & Beverage",
        subcategories: ["Restaurant", "Bar", "Coffee Shop", "Banquet Hall", "Kitchen", "Room Service Pantry"]
      },
      {
        name: "Recreation",
        subcategories: ["Swimming Pool", "Fitness Center", "Spa", "Sauna", "Game Room", "Terrace"]
      },
      {
        name: "Support Areas",
        subcategories: ["Housekeeping", "Laundry", "Storage", "Staff Areas", "Mechanical Room", "Back Office"]
      }
    ]
  },

  // EDUCATIONAL INSTITUTIONS
  educational: {
    name: "Educational Institution",
    description: "Schools, colleges, and universities",
    summer: {
      deluxe: { db: 75, wb: 62.5, rh: 50, tempSwing: 2 },
      commercial: { db: 78, wb: 65, rh: 50, tempSwing: 4 }
    },
    winter: {
      withHumidification: { db: 72, rh: 40, tempSwing: -3 },
      withoutHumidification: { db: 74, tempSwing: -4 }
    },
    spaceCategories: [
      {
        name: "Academic Spaces",
        subcategories: ["Classroom", "Lecture Hall", "Laboratory", "Computer Lab", "Library", "Study Hall"]
      },
      {
        name: "Administrative",
        subcategories: ["Principal Office", "Staff Room", "Admission Office", "Accounts Office", "Reception", "Conference Room"]
      },
      {
        name: "Recreational",
        subcategories: ["Auditorium", "Gymnasium", "Sports Room", "Music Room", "Art Room", "Cafeteria"]
      },
      {
        name: "Support Areas",
        subcategories: ["Storage", "Maintenance", "Security Office", "Medical Room", "Corridor", "Staircase"]
      }
    ]
  },

  // DATA CENTERS
  data_center: {
    name: "Data Center",
    description: "IT infrastructure facilities",
    summer: {
      deluxe: { db: 70, wb: 59, rh: 45, tempSwing: 1 },
      commercial: { db: 72, wb: 60, rh: 45, tempSwing: 2 }
    },
    winter: {
      withHumidification: { db: 70, rh: 45, tempSwing: -1 },
      withoutHumidification: { db: 70, tempSwing: -2 }
    },
    spaceCategories: [
      {
        name: "Server Areas",
        subcategories: ["Server Room", "Network Room", "Storage Room", "Backup Room", "Cold Aisle", "Hot Aisle"]
      },
      {
        name: "Support Areas",
        subcategories: ["UPS Room", "Generator Room", "Electrical Room", "Cooling Plant", "Control Room", "Office Area"]
      }
    ]
  }
};

// Default indoor conditions based on building type and application level
export const getIndoorConditions = (buildingType, applicationLevel = 'commercial', season = 'summer') => {
  const config = BUILDING_CONFIGURATIONS[buildingType];
  if (!config) return null;
  
  return config[season][applicationLevel];
};

// Get space categories for a building type
export const getSpaceCategories = (buildingType) => {
  const config = BUILDING_CONFIGURATIONS[buildingType];
  return config ? config.spaceCategories : [];
};

// Get all subcategories for a building type (flattened)
export const getAllSubcategories = (buildingType) => {
  const categories = getSpaceCategories(buildingType);
  return categories.reduce((acc, category) => {
    return [...acc, ...category.subcategories];
  }, []);
};

// Occupancy standards per space type
export const OCCUPANCY_STANDARDS = {
  // Office spaces (sq.ft per person)
  "Executive Office": 150,
  "General Office": 100,
  "Conference Room": 25,
  "Reception": 50,
  "Lobby": 30,
  
  // Residential
  "Living Room": 200,
  "Bedroom": 150,
  "Kitchen": 100,
  "Dining Room": 100,
  
  // Hotel
  "Guest Room": 200,
  "Suite": 300,
  "Restaurant": 15,
  "Banquet Hall": 10,
  
  // Hospital
  "Patient Room": 200,
  "ICU": 250,
  "Operation Theater": 300,
  "Waiting Area": 20,
  
  // Retail
  "Sales Floor": 30,
  "Showroom": 50,
  "Food Court": 15,
  
  // Default
  "default": 100
};

// Lighting standards (watts per sq.ft)
export const LIGHTING_STANDARDS = {
  "Office": 1.2,
  "Retail": 2.0,
  "Hospital": 1.5,
  "Hotel": 1.0,
  "Restaurant": 1.5,
  "Warehouse": 0.8,
  "default": 1.0
};

// Equipment load standards (watts per sq.ft)
export const EQUIPMENT_STANDARDS = {
  "Office": 1.0,
  "Data Center": 50.0,
  "Hospital": 2.0,
  "Kitchen": 5.0,
  "Retail": 0.5,
  "default": 0.75
};

// Ventilation requirements (CFM per person)
export const VENTILATION_STANDARDS = {
  "Office": 20,
  "Restaurant": 30,
  "Hospital": 25,
  "Retail": 15,
  "Hotel": 20,
  "Classroom": 15,
  "default": 20
};
