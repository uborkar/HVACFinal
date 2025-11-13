/**
 * Building Templates and Floor Configuration System
 * Comprehensive building types with floor configurations and room templates
 */

// Building type configurations with typical floor layouts
export const BUILDING_TEMPLATES = {
  'Independent House': {
    displayName: 'Independent House',
    category: 'Residential',
    icon: '🏠',
    description: 'Single family independent house with multiple rooms',
    typicalFloors: ['Ground', 'Floor 1', 'Floor 2'],
    maxFloors: 4,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Living Room', area: 300, occupancy: 6, type: 'living_room' },
          { name: 'Dining Room', area: 200, occupancy: 6, type: 'dining_room' },
          { name: 'Kitchen', area: 150, occupancy: 2, type: 'kitchen' },
          { name: 'Guest Room', area: 200, occupancy: 2, type: 'guest_room' },
          { name: 'Study Room', area: 120, occupancy: 2, type: 'study_room' },
          { name: 'Powder Room', area: 40, occupancy: 1, type: 'powder_room' }
        ]
      },
      'Upper Floor': {
        name: 'Upper Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Master Bedroom', area: 250, occupancy: 2, type: 'master_bedroom' },
          { name: 'Bedroom', area: 180, occupancy: 2, type: 'bedroom', quantity: 2 },
          { name: 'Kids Room', area: 150, occupancy: 2, type: 'kids_room' },
          { name: 'Family Lounge', area: 200, occupancy: 4, type: 'family_lounge' },
          { name: 'Master Bathroom', area: 80, occupancy: 1, type: 'master_bathroom' },
          { name: 'Common Bathroom', area: 60, occupancy: 1, type: 'common_bathroom' }
        ]
      }
    },
    projectScale: {
      small: { area: '1500-2500 sq.ft', floors: '1-2', description: 'Compact family home' },
      medium: { area: '2500-4000 sq.ft', floors: '2-3', description: 'Standard family home' },
      large: { area: '4000-8000+ sq.ft', floors: '2-4', description: 'Luxury family home' }
    }
  },

  'Villa/Bungalow': {
    displayName: 'Villa/Bungalow',
    category: 'Residential',
    icon: '🏡',
    description: 'Luxury villa or bungalow with premium amenities',
    typicalFloors: ['Ground', 'Floor 1'],
    maxFloors: 3,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Grand Living Room', area: 500, occupancy: 10, type: 'grand_living' },
          { name: 'Formal Dining', area: 300, occupancy: 8, type: 'formal_dining' },
          { name: 'Family Room', area: 350, occupancy: 6, type: 'family_room' },
          { name: 'Kitchen', area: 250, occupancy: 3, type: 'kitchen' },
          { name: 'Pantry', area: 100, occupancy: 1, type: 'pantry' },
          { name: 'Guest Suite', area: 300, occupancy: 2, type: 'guest_suite' },
          { name: 'Home Office', area: 200, occupancy: 2, type: 'home_office' },
          { name: 'Powder Room', area: 50, occupancy: 1, type: 'powder_room' }
        ]
      },
      'Upper Floor': {
        name: 'Upper Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Master Suite', area: 400, occupancy: 2, type: 'master_suite' },
          { name: 'Bedroom Suite', area: 280, occupancy: 2, type: 'bedroom_suite', quantity: 3 },
          { name: 'Family Lounge', area: 300, occupancy: 6, type: 'family_lounge' },
          { name: 'Home Theater', area: 350, occupancy: 8, type: 'home_theater' },
          { name: 'Gym', area: 200, occupancy: 2, type: 'home_gym' }
        ]
      }
    },
    projectScale: {
      small: { area: '3000-5000 sq.ft', floors: '1-2', description: 'Premium villa' },
      medium: { area: '5000-8000 sq.ft', floors: '2-3', description: 'Luxury villa' },
      large: { area: '8000-15000+ sq.ft', floors: '2-3', description: 'Ultra-luxury mansion' }
    }
  },

  'Row House': {
    displayName: 'Row House',
    category: 'Residential',
    icon: '🏘️',
    description: 'Attached row house in residential development',
    typicalFloors: ['Ground', 'Floor 1', 'Floor 2'],
    maxFloors: 4,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Living Room', area: 250, occupancy: 5, type: 'living_room' },
          { name: 'Dining Area', area: 150, occupancy: 4, type: 'dining_area' },
          { name: 'Kitchen', area: 120, occupancy: 2, type: 'kitchen' },
          { name: 'Guest Toilet', area: 30, occupancy: 1, type: 'guest_toilet' },
          { name: 'Store Room', area: 50, occupancy: 1, type: 'store_room' }
        ]
      },
      'Upper Floor': {
        name: 'Upper Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Master Bedroom', area: 200, occupancy: 2, type: 'master_bedroom' },
          { name: 'Bedroom', area: 150, occupancy: 2, type: 'bedroom', quantity: 2 },
          { name: 'Common Bathroom', area: 60, occupancy: 1, type: 'common_bathroom' },
          { name: 'Balcony', area: 80, occupancy: 2, type: 'balcony' }
        ]
      }
    },
    projectScale: {
      small: { area: '1200-2000 sq.ft', floors: '2-3', description: 'Compact row house' },
      medium: { area: '2000-3000 sq.ft', floors: '2-3', description: 'Standard row house' },
      large: { area: '3000-4500+ sq.ft', floors: '3-4', description: 'Premium row house' }
    }
  },

  'Apartment Building': {
    displayName: 'Apartment Building',
    category: 'Residential',
    icon: '🏢',
    description: 'Multi-story residential building with apartments',
    typicalFloors: ['Basement', 'Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'],
    maxFloors: 50,
    floorTypes: {
      'Basement': {
        name: 'Basement',
        code: 'B',
        typical: true,
        defaultRooms: [
          { name: 'Parking Area', area: 2000, occupancy: 50, type: 'parking' },
          { name: 'Storage Room', area: 200, occupancy: 2, type: 'storage' },
          { name: 'Utility Room', area: 150, occupancy: 3, type: 'utility' },
          { name: 'Security Cabin', area: 80, occupancy: 2, type: 'security' }
        ]
      },
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Lobby', area: 400, occupancy: 30, type: 'lobby' },
          { name: 'Reception', area: 120, occupancy: 3, type: 'reception' },
          { name: 'Mailroom', area: 80, occupancy: 2, type: 'utility' },
          { name: 'Manager Office', area: 150, occupancy: 3, type: 'office' }
        ]
      },
      'Typical Floor': {
        name: 'Typical Residential Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: '2 BHK Apartment', area: 900, occupancy: 4, type: 'apartment', quantity: 2 },
          { name: '3 BHK Apartment', area: 1200, occupancy: 6, type: 'apartment', quantity: 2 },
          { name: 'Common Corridor', area: 200, occupancy: 8, type: 'corridor' },
          { name: 'Lift Lobby', area: 60, occupancy: 5, type: 'lobby' }
        ]
      }
    },
    projectScale: {
      small: { floors: '3-8', units: '12-32', description: 'Small residential complex' },
      medium: { floors: '8-15', units: '32-80', description: 'Medium apartment building' },
      large: { floors: '15-50', units: '80-200+', description: 'High-rise apartment complex' }
    }
  },

  'Shopping Mall': {
    displayName: 'Shopping Mall',
    category: 'Commercial',
    icon: '🛍️',
    description: 'Multi-level shopping and entertainment complex',
    typicalFloors: ['Basement 2', 'Basement 1', 'Ground', 'Floor 1', 'Floor 2', 'Floor 3'],
    maxFloors: 10,
    floorTypes: {
      'Basement': {
        name: 'Basement Level',
        code: 'B',
        typical: true,
        defaultRooms: [
          { name: 'Parking Zone', area: 3000, occupancy: 100, type: 'parking', quantity: 3 },
          { name: 'Food Court', area: 1200, occupancy: 150, type: 'food_court' },
          { name: 'Hypermarket', area: 2500, occupancy: 200, type: 'hypermarket' },
          { name: 'Storage Area', area: 500, occupancy: 10, type: 'storage' }
        ]
      },
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Entrance Lobby', area: 800, occupancy: 100, type: 'lobby' },
          { name: 'Anchor Store', area: 2000, occupancy: 150, type: 'anchor_store', quantity: 2 },
          { name: 'Retail Shop', area: 300, occupancy: 20, type: 'retail', quantity: 8 },
          { name: 'Central Atrium', area: 600, occupancy: 80, type: 'atrium' }
        ]
      },
      'Upper Floor': {
        name: 'Upper Shopping Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Retail Shop', area: 250, occupancy: 15, type: 'retail', quantity: 12 },
          { name: 'Restaurant', area: 400, occupancy: 50, type: 'restaurant', quantity: 3 },
          { name: 'Cinema Hall', area: 800, occupancy: 120, type: 'cinema', quantity: 4 },
          { name: 'Gaming Zone', area: 600, occupancy: 40, type: 'gaming' }
        ]
      }
    },
    projectScale: {
      small: { floors: '2-4', area: '50K-150K sq.ft', description: 'Community shopping center' },
      medium: { floors: '4-6', area: '150K-500K sq.ft', description: 'Regional shopping mall' },
      large: { floors: '6-10', area: '500K-2M sq.ft', description: 'Super regional mall complex' }
    }
  },

  'Hospital': {
    displayName: 'Hospital',
    category: 'Healthcare',
    icon: '🏥',
    description: 'Multi-specialty healthcare facility',
    typicalFloors: ['Basement', 'Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'],
    maxFloors: 20,
    floorTypes: {
      'Basement': {
        name: 'Basement Level',
        code: 'B',
        typical: true,
        defaultRooms: [
          { name: 'Parking Area', area: 2500, occupancy: 80, type: 'parking' },
          { name: 'Mortuary', area: 200, occupancy: 5, type: 'mortuary' },
          { name: 'Central Kitchen', area: 400, occupancy: 15, type: 'kitchen' },
          { name: 'Laundry', area: 300, occupancy: 10, type: 'laundry' }
        ]
      },
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Reception', area: 300, occupancy: 20, type: 'reception' },
          { name: 'OPD Waiting', area: 600, occupancy: 80, type: 'waiting' },
          { name: 'OPD Consultation', area: 120, occupancy: 3, type: 'consultation', quantity: 8 },
          { name: 'Pharmacy', area: 200, occupancy: 8, type: 'pharmacy' },
          { name: 'Laboratory', area: 400, occupancy: 12, type: 'laboratory' }
        ]
      },
      'Patient Floor': {
        name: 'Patient Care Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'General Ward', area: 400, occupancy: 12, type: 'ward', quantity: 4 },
          { name: 'Private Room', area: 200, occupancy: 3, type: 'private_room', quantity: 6 },
          { name: 'ICU', area: 300, occupancy: 8, type: 'icu', quantity: 2 },
          { name: 'Nursing Station', area: 150, occupancy: 6, type: 'nursing' },
          { name: 'Doctor Cabin', area: 120, occupancy: 3, type: 'doctor_cabin', quantity: 4 }
        ]
      }
    },
    projectScale: {
      small: { beds: '50-150', floors: '3-6', description: 'Community hospital' },
      medium: { beds: '150-400', floors: '6-12', description: 'Multi-specialty hospital' },
      large: { beds: '400-1000+', floors: '12-20', description: 'Super specialty medical center' }
    }
  },

  'Office Building': {
    displayName: 'Office Building',
    category: 'Commercial',
    icon: '🏢',
    description: 'Multi-tenant commercial office space',
    typicalFloors: ['Basement', 'Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'],
    maxFloors: 50,
    floorTypes: {
      'Basement': {
        name: 'Basement Level',
        code: 'B',
        typical: true,
        defaultRooms: [
          { name: 'Parking Area', area: 2000, occupancy: 60, type: 'parking' },
          { name: 'Server Room', area: 200, occupancy: 3, type: 'server_room' },
          { name: 'UPS Room', area: 150, occupancy: 2, type: 'ups_room' },
          { name: 'Storage', area: 300, occupancy: 5, type: 'storage' }
        ]
      },
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Lobby', area: 500, occupancy: 40, type: 'lobby' },
          { name: 'Reception', area: 150, occupancy: 5, type: 'reception' },
          { name: 'Security Office', area: 80, occupancy: 3, type: 'security' },
          { name: 'Retail Space', area: 200, occupancy: 10, type: 'retail', quantity: 2 }
        ]
      },
      'Office Floor': {
        name: 'Typical Office Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Open Office', area: 1200, occupancy: 60, type: 'open_office', quantity: 2 },
          { name: 'Manager Cabin', area: 150, occupancy: 3, type: 'cabin', quantity: 4 },
          { name: 'Conference Room', area: 200, occupancy: 12, type: 'conference', quantity: 2 },
          { name: 'Pantry', area: 100, occupancy: 8, type: 'pantry' },
          { name: 'Reception Area', area: 120, occupancy: 5, type: 'reception' }
        ]
      }
    },
    projectScale: {
      small: { floors: '3-8', area: '20K-80K sq.ft', description: 'Small office building' },
      medium: { floors: '8-20', area: '80K-300K sq.ft', description: 'Mid-rise office tower' },
      large: { floors: '20-50', area: '300K-1M+ sq.ft', description: 'High-rise commercial tower' }
    }
  },

  'School': {
    displayName: 'School',
    category: 'Educational',
    icon: '🏫',
    description: 'Educational institution with classrooms and facilities',
    typicalFloors: ['Ground', 'Floor 1', 'Floor 2', 'Floor 3'],
    maxFloors: 8,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Hall', area: 800, occupancy: 200, type: 'auditorium' },
          { name: 'Principal Office', area: 200, occupancy: 5, type: 'office' },
          { name: 'Staff Room', area: 300, occupancy: 20, type: 'staff_room' },
          { name: 'Library', area: 600, occupancy: 60, type: 'library' },
          { name: 'Computer Lab', area: 400, occupancy: 40, type: 'computer_lab' }
        ]
      },
      'Classroom Floor': {
        name: 'Classroom Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Classroom', area: 400, occupancy: 40, type: 'classroom', quantity: 8 },
          { name: 'Science Lab', area: 500, occupancy: 35, type: 'lab', quantity: 2 },
          { name: 'Art Room', area: 300, occupancy: 25, type: 'art_room' },
          { name: 'Music Room', area: 250, occupancy: 20, type: 'music_room' }
        ]
      }
    },
    projectScale: {
      small: { students: '200-500', floors: '2-4', description: 'Primary school' },
      medium: { students: '500-1200', floors: '3-6', description: 'Secondary school' },
      large: { students: '1200-3000+', floors: '4-8', description: 'Large educational campus' }
    }
  },

  'Hotel': {
    displayName: 'Hotel',
    category: 'Hospitality',
    icon: '🏨',
    description: 'Hospitality facility with guest rooms and amenities',
    typicalFloors: ['Ground', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5'],
    maxFloors: 30,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Main Lobby', area: 600, occupancy: 50, type: 'lobby' },
          { name: 'Reception', area: 200, occupancy: 8, type: 'reception' },
          { name: 'Restaurant', area: 800, occupancy: 100, type: 'restaurant' },
          { name: 'Banquet Hall', area: 1000, occupancy: 120, type: 'banquet' },
          { name: 'Kitchen', area: 400, occupancy: 20, type: 'kitchen' }
        ]
      },
      'Guest Floor': {
        name: 'Guest Room Floor',
        code: 'F',
        typical: true,
        defaultRooms: [
          { name: 'Standard Room', area: 300, occupancy: 2, type: 'guest_room', quantity: 12 },
          { name: 'Deluxe Room', area: 400, occupancy: 3, type: 'deluxe_room', quantity: 4 },
          { name: 'Suite', area: 600, occupancy: 4, type: 'suite', quantity: 2 },
          { name: 'Housekeeping', area: 80, occupancy: 3, type: 'housekeeping' }
        ]
      }
    },
    projectScale: {
      small: { rooms: '30-80', floors: '3-8', description: 'Boutique hotel' },
      medium: { rooms: '80-200', floors: '6-15', description: 'Business hotel' },
      large: { rooms: '200-500+', floors: '15-30', description: 'Luxury resort hotel' }
    }
  },

  'Gym & Fitness': {
    displayName: 'Gym & Fitness Center',
    category: 'Recreation',
    icon: '🏋️',
    description: 'Fitness and wellness facility',
    typicalFloors: ['Ground', 'Floor 1'],
    maxFloors: 4,
    floorTypes: {
      'Ground': {
        name: 'Ground Floor',
        code: 'G',
        typical: true,
        defaultRooms: [
          { name: 'Reception', area: 150, occupancy: 5, type: 'reception' },
          { name: 'Cardio Area', area: 600, occupancy: 40, type: 'cardio' },
          { name: 'Weight Training', area: 800, occupancy: 50, type: 'weights' },
          { name: 'Group Exercise', area: 400, occupancy: 30, type: 'group_exercise' },
          { name: 'Changing Room M', area: 200, occupancy: 15, type: 'changing_room' },
          { name: 'Changing Room F', area: 200, occupancy: 15, type: 'changing_room' }
        ]
      }
    },
    projectScale: {
      small: { area: '3K-8K sq.ft', floors: '1-2', description: 'Neighborhood gym' },
      medium: { area: '8K-20K sq.ft', floors: '2-3', description: 'Full-service fitness center' },
      large: { area: '20K-50K+ sq.ft', floors: '3-4', description: 'Premium fitness complex' }
    }
  }
};

// Floor naming conventions
export const FLOOR_NAMING = {
  basement: {
    prefix: 'B',
    names: ['Basement 3', 'Basement 2', 'Basement 1'],
    codes: ['B3', 'B2', 'B1']
  },
  ground: {
    names: ['Ground Floor', 'Ground'],
    codes: ['G', 'GF']
  },
  upper: {
    prefix: 'Floor',
    names: (num) => `Floor ${num}`,
    codes: (num) => `F${num}`
  }
};

// Room type configurations with heat load factors
export const ROOM_TYPE_CONFIG = {
  // Residential - House/Villa/Bungalow
  'living_room': { lighting: 1.5, equipment: 3.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'dining_room': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'dining_area': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'kitchen': { lighting: 3.0, equipment: 8.0, sensibleFactor: 0.60, cfmPerPerson: 30 },
  'master_bedroom': { lighting: 1.2, equipment: 2.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'bedroom': { lighting: 1.2, equipment: 2.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'bedroom_suite': { lighting: 1.5, equipment: 2.5, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'kids_room': { lighting: 1.5, equipment: 2.5, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'guest_room': { lighting: 1.2, equipment: 1.5, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'guest_suite': { lighting: 1.5, equipment: 2.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'study_room': { lighting: 2.5, equipment: 3.0, sensibleFactor: 0.80, cfmPerPerson: 20 },
  'home_office': { lighting: 2.0, equipment: 4.0, sensibleFactor: 0.80, cfmPerPerson: 20 },
  'family_room': { lighting: 1.5, equipment: 3.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'family_lounge': { lighting: 1.5, equipment: 2.5, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'grand_living': { lighting: 2.0, equipment: 4.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'formal_dining': { lighting: 2.5, equipment: 1.5, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'master_suite': { lighting: 1.5, equipment: 3.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'home_theater': { lighting: 1.0, equipment: 8.0, sensibleFactor: 0.70, cfmPerPerson: 20 },
  'home_gym': { lighting: 2.0, equipment: 3.0, sensibleFactor: 0.80, cfmPerPerson: 30 },
  'pantry': { lighting: 2.0, equipment: 2.0, sensibleFactor: 0.70, cfmPerPerson: 20 },
  'powder_room': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.70, cfmPerPerson: 15 },
  'guest_toilet': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.70, cfmPerPerson: 15 },
  'master_bathroom': { lighting: 2.0, equipment: 2.0, sensibleFactor: 0.70, cfmPerPerson: 15 },
  'common_bathroom': { lighting: 2.0, equipment: 1.5, sensibleFactor: 0.70, cfmPerPerson: 15 },
  'store_room': { lighting: 1.0, equipment: 0.5, sensibleFactor: 0.85, cfmPerPerson: 10 },
  'balcony': { lighting: 1.0, equipment: 0.2, sensibleFactor: 0.90, cfmPerPerson: 15 },
  
  // Residential - Apartments
  'apartment': { lighting: 1.2, equipment: 2.0, sensibleFactor: 0.75, cfmPerPerson: 25 },
  'lobby': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.70, cfmPerPerson: 20 },
  
  // Commercial
  'retail': { lighting: 3.0, equipment: 1.5, sensibleFactor: 0.75, cfmPerPerson: 20 },
  'office': { lighting: 1.5, equipment: 2.0, sensibleFactor: 0.80, cfmPerPerson: 20 },
  'open_office': { lighting: 1.5, equipment: 2.5, sensibleFactor: 0.80, cfmPerPerson: 20 },
  
  // Healthcare
  'patient_room': { lighting: 2.0, equipment: 3.0, sensibleFactor: 0.75, cfmPerPerson: 30 },
  'icu': { lighting: 3.0, equipment: 8.0, sensibleFactor: 0.70, cfmPerPerson: 50 },
  'operation_theater': { lighting: 5.0, equipment: 15.0, sensibleFactor: 0.80, cfmPerPerson: 100 },
  
  // Food service
  'restaurant': { lighting: 2.5, equipment: 5.0, sensibleFactor: 0.60, cfmPerPerson: 25 },
  'kitchen': { lighting: 3.0, equipment: 20.0, sensibleFactor: 0.50, cfmPerPerson: 40 },
  'food_court': { lighting: 2.5, equipment: 8.0, sensibleFactor: 0.65, cfmPerPerson: 25 },
  
  // Entertainment
  'cinema': { lighting: 1.0, equipment: 3.0, sensibleFactor: 0.75, cfmPerPerson: 15 },
  'gaming': { lighting: 2.5, equipment: 8.0, sensibleFactor: 0.70, cfmPerPerson: 20 },
  
  // Education
  'classroom': { lighting: 2.0, equipment: 1.0, sensibleFactor: 0.75, cfmPerPerson: 15 },
  'lab': { lighting: 3.0, equipment: 4.0, sensibleFactor: 0.75, cfmPerPerson: 20 },
  'library': { lighting: 2.5, equipment: 1.5, sensibleFactor: 0.75, cfmPerPerson: 15 },
  
  // Utility
  'parking': { lighting: 1.0, equipment: 0.2, sensibleFactor: 0.90, cfmPerPerson: 5 },
  'storage': { lighting: 1.0, equipment: 0.5, sensibleFactor: 0.85, cfmPerPerson: 5 },
  'corridor': { lighting: 1.0, equipment: 0.2, sensibleFactor: 0.80, cfmPerPerson: 10 },
  
  // Default
  'default': { lighting: 2.0, equipment: 1.5, sensibleFactor: 0.75, cfmPerPerson: 20 }
};

/**
 * Generate floor configuration based on building type and number of floors
 */
export function generateFloorConfiguration(buildingType, totalFloors, basementFloors = 0) {
  const template = BUILDING_TEMPLATES[buildingType];
  if (!template) return null;

  const floors = [];
  
  // Add basement floors
  for (let i = basementFloors; i > 0; i--) {
    floors.push({
      id: `B${i}`,
      name: `Basement ${i}`,
      code: `B${i}`,
      type: 'Basement',
      level: -i,
      template: template.floorTypes['Basement'] || template.floorTypes['Ground']
    });
  }
  
  // Add ground floor
  floors.push({
    id: 'G',
    name: 'Ground Floor',
    code: 'G',
    type: 'Ground',
    level: 0,
    template: template.floorTypes['Ground']
  });
  
  // Add upper floors
  for (let i = 1; i < totalFloors; i++) {
    const floorType = template.floorTypes['Typical Floor'] || 
                     template.floorTypes['Office Floor'] || 
                     template.floorTypes['Guest Floor'] ||
                     template.floorTypes['Classroom Floor'] ||
                     template.floorTypes['Upper Floor'];
    
    floors.push({
      id: `F${i}`,
      name: `Floor ${i}`,
      code: `F${i}`,
      type: floorType?.name || 'Upper Floor',
      level: i,
      template: floorType
    });
  }
  
  return floors;
}

/**
 * Generate room templates for a specific floor
 */
export function generateRoomTemplates(floorTemplate, floorArea = null) {
  if (!floorTemplate?.defaultRooms) return [];
  
  return floorTemplate.defaultRooms.map((room, index) => {
    const quantity = room.quantity || 1;
    const rooms = [];
    
    for (let i = 0; i < quantity; i++) {
      const roomId = `${room.type}_${index}_${i}`;
      const roomName = quantity > 1 ? `${room.name} ${i + 1}` : room.name;
      
      rooms.push({
        id: roomId,
        name: roomName,
        type: room.type,
        area: room.area,
        occupancy: room.occupancy,
        config: ROOM_TYPE_CONFIG[room.type] || ROOM_TYPE_CONFIG.default,
        heatLoad: {
          sensible: 0,
          latent: 0,
          total: 0
        },
        cfm: {
          ventilation: 0,
          infiltration: 0,
          total: 0
        },
        calculated: false
      });
    }
    
    return rooms;
  }).flat();
}

export default {
  BUILDING_TEMPLATES,
  FLOOR_NAMING,
  ROOM_TYPE_CONFIG,
  generateFloorConfiguration,
  generateRoomTemplates
};
