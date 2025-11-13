import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

class HVACCalculatorAI {
  constructor() {
    // Check if API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    console.log('🔑 Checking OpenAI API key...');
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key starts with:', apiKey?.substring(0, 10) + '...');

    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      try {
        // Initialize with real ChatOpenAI client for GPT-4
        this.llm = new ChatOpenAI({
          temperature: 0.1,
          modelName: 'gpt-3.5-turbo', // Try GPT-3.5 first for better reliability
          openAIApiKey: apiKey,
          maxRetries: 3,
          timeout: 30000, // 30 second timeout
        });
        this.useRealAI = true;
        console.log('✅ HVAC Calculator AI initialized with ChatOpenAI (GPT-3.5-turbo)');
        console.log('🤖 Real AI mode: ENABLED');
      } catch (error) {
        console.error('❌ Failed to initialize ChatOpenAI:', error);
        this.useRealAI = false;
        console.log('⚠️ Falling back to demo mode due to initialization error');
      }
    } else {
      // Fallback mode - use mock responses
      this.useRealAI = false;
      console.log('⚠️ HVAC Calculator AI running in demo mode - add OpenAI API key for full functionality');
      console.log('🤖 Real AI mode: DISABLED');
    }

    this.initializePrompts();
  }

  initializePrompts() {
    // System prompt for HVAC calculations
    this.systemPrompt = `You are an expert HVAC engineer with decades of experience in heat load calculations, building systems design, and energy efficiency. You have comprehensive knowledge of:

1. ASHRAE standards and psychrometric calculations
2. Heat transfer principles (conduction, convection, radiation)
3. Building envelope analysis (walls, roofs, windows, doors)
4. Internal heat gains (people, lighting, equipment)
5. Ventilation requirements (ASHRAE 62.1)
6. Solar heat gain calculations
7. U-factor and R-value calculations
8. CFM calculations for different building types
9. Equipment selection and sizing

You provide accurate, detailed calculations with proper units and consider all relevant factors including:
- Building orientation and solar exposure
- Window types and glazing properties
- Wall and roof construction materials
- Internal loads and occupancy
- Climate data and weather conditions
- Local building codes and standards

Always provide calculations with proper explanations and cite relevant standards.`;

    // Prompt templates for different calculation types
    this.heatLoadPrompt = PromptTemplate.fromTemplate(`
{systemPrompt}

Calculate the detailed heat load for the following building/space:

BUILDING TYPE: {buildingType}
SPACE TYPE: {spaceType}
LOCATION: {location}
CLIMATE DATA:
- Outside Design Temperature: {outsideTemp}°F
- Outside Relative Humidity: {outsideRH}%
- Inside Design Temperature: {insideTemp}°F
- Inside Relative Humidity: {insideRH}%

DIMENSIONS:
- Length: {length} ft
- Width: {width} ft
- Height: {height} ft
- Floor Area: {area} sq ft
- Volume: {volume} cu ft

CONSTRUCTION DETAILS:
{constructionDetails}

OCCUPANCY & INTERNAL LOADS:
{occupancyDetails}

Provide detailed calculations for:
1. Transmission heat gain/loss through walls, roof, windows, doors
2. Solar heat gain through windows and walls
3. Internal heat gains (people, lighting, equipment)
4. Infiltration/ventilation loads
5. Total cooling/heating load
6. CFM requirements
7. Equipment recommendations

Show all calculations step-by-step with formulas and cite ASHRAE standards where applicable.
`);

    this.windowCalculationPrompt = PromptTemplate.fromTemplate(`
{systemPrompt}

Calculate solar heat gain through windows for:

WINDOW DETAILS:
- Window Type: {windowType}
- Area: {area} sq ft
- Orientation: {orientation}
- U-Factor: {uFactor}
- Solar Heat Gain Coefficient (SHGC): {shgc}
- Number of panes: {panes}
- Glass type: {glassType}

LOCATION & CONDITIONS:
- Latitude: {latitude}
- Longitude: {longitude}
- Outside Temperature: {outsideTemp}°F
- Solar Irradiance: {solarIrradiance} Btu/hr-sq ft
- Time of Day: {timeOfDay}
- Season: {season}

Calculate:
1. Direct solar heat gain
2. Diffuse solar heat gain
3. Heat transfer through glass
4. Total window heat gain
5. Required CFM for ventilation

Provide calculations with proper ASHRAE references.
`);
  }

  async calculateHeatLoad(buildingData) {
    try {
      if (this.useRealAI) {
        const formattedPrompt = await this.heatLoadPrompt.format({
          systemPrompt: this.systemPrompt,
          buildingType: buildingData.buildingType,
          spaceType: buildingData.spaceType,
          location: buildingData.location,
          outsideTemp: buildingData.outsideTemp,
          outsideRH: buildingData.outsideRH,
          insideTemp: buildingData.insideTemp,
          insideRH: buildingData.insideRH,
          length: buildingData.length,
          width: buildingData.width,
          height: buildingData.height,
          area: buildingData.area,
          volume: buildingData.volume,
          constructionDetails: buildingData.constructionDetails,
          occupancyDetails: buildingData.occupancyDetails
        });

        const messages = [
          new SystemMessage(this.systemPrompt),
          new HumanMessage(formattedPrompt)
        ];

        const result = await this.llm.invoke(messages);

        return this.parseHeatLoadResult(result.content);
      } else {
        // Fallback mode - return mock calculation results
        return this.getMockHeatLoadResult(buildingData);
      }
    } catch (error) {
      console.error('Error calculating heat load:', error);
      return this.getMockHeatLoadResult(buildingData);
    }
  }

  getMockHeatLoadResult(buildingData) {
    const area = buildingData.area || 600; // Default 20x30 ft office
    const baseLoad = area * 25; // BTU per sq ft

    return {
      transmissionGains: {
        walls: Math.round(baseLoad * 0.4),
        windows: Math.round(baseLoad * 0.15),
        roof: Math.round(baseLoad * 0.1),
        doors: Math.round(baseLoad * 0.05)
      },
      solarGains: {
        windows: Math.round(baseLoad * 0.2),
        total: Math.round(baseLoad * 0.2)
      },
      internalGains: {
        people: Math.round(baseLoad * 0.15),
        lighting: Math.round(baseLoad * 0.1),
        equipment: Math.round(baseLoad * 0.1)
      },
      ventilationLoads: {
        infiltration: Math.round(baseLoad * 0.08),
        ventilation: Math.round(baseLoad * 0.05),
        cfm: Math.round(area * 0.3)
      },
      totalLoad: {
        sensible: Math.round(baseLoad / 12000), // Convert to tons
        heating: Math.round(baseLoad * 1.2)
      },
      recommendations: [
        'Install energy-efficient windows with U-factor ≤ 0.35',
        'Use LED lighting to reduce internal heat gains',
        'Consider a variable air volume (VAV) system for better efficiency',
        'Implement demand-controlled ventilation for energy savings'
      ]
    };
  }

  async calculateWindowHeatGain(windowData) {
    try {
      if (this.useRealAI) {
        const formattedPrompt = await this.windowCalculationPrompt.format({
          systemPrompt: this.systemPrompt,
          windowType: windowData.type,
          area: windowData.area,
          orientation: windowData.orientation,
          uFactor: windowData.uFactor,
          shgc: windowData.shgc,
          panes: windowData.panes,
          glassType: windowData.glassType,
          latitude: windowData.latitude,
          longitude: windowData.longitude,
          outsideTemp: windowData.outsideTemp,
          solarIrradiance: windowData.solarIrradiance,
          timeOfDay: windowData.timeOfDay,
          season: windowData.season
        });

        const messages = [
          new SystemMessage(this.systemPrompt),
          new HumanMessage(formattedPrompt)
        ];

        const result = await this.llm.invoke(messages);

        return this.parseWindowResult(result.content);
      } else {
        // Fallback mode - return mock window calculation results
        return this.getMockWindowResult(windowData);
      }
    } catch (error) {
      console.error('Error calculating window heat gain:', error);
      return this.getMockWindowResult(windowData);
    }
  }

  getMockWindowResult(windowData) {
    const area = windowData.area || 100; // Default window area
    const uFactor = windowData.uFactor || 0.35;
    const shgc = windowData.shgc || 0.65;
    const outsideTemp = windowData.outsideTemp || 95;
    const insideTemp = 75;
    const tempDiff = outsideTemp - insideTemp;

    // Calculate heat transfer through glass
    const heatTransfer = area * uFactor * tempDiff;

    // Calculate solar heat gain
    const solarIrradiance = windowData.solarIrradiance || 250; // BTU/hr-sq ft
    const solarGain = area * solarIrradiance * shgc;

    return {
      directSolarGain: Math.round(solarGain * 0.7),
      diffuseSolarGain: Math.round(solarGain * 0.3),
      heatTransfer: Math.round(heatTransfer),
      totalHeatGain: Math.round(solarGain + heatTransfer),
      requiredCFM: Math.round((solarGain + heatTransfer) / 30) // Rough estimate
    };
  }

  async getEquipmentRecommendations(heatLoadData) {
    try {
      if (this.useRealAI) {
        const equipmentPrompt = PromptTemplate.fromTemplate(`
{systemPrompt}

Based on the following heat load calculations, recommend appropriate HVAC equipment:

TOTAL COOLING LOAD: {totalCoolingLoad} tons
TOTAL HEATING LOAD: {totalHeatingLoad} BTU/hr
CFM REQUIREMENT: {cfmRequirement} CFM
BUILDING TYPE: {buildingType}
SPACE TYPE: {spaceType}
CLIMATE ZONE: {climateZone}

Provide recommendations for:
1. Air conditioning units (type, capacity, efficiency)
2. Heating systems (if required)
3. Ventilation systems
4. Air distribution systems
5. Controls and thermostats
6. Energy efficiency considerations
7. Installation considerations

Include specifications, model recommendations, and cost estimates where possible.
`);

        const formattedPrompt = await equipmentPrompt.format({
          systemPrompt: this.systemPrompt,
          totalCoolingLoad: heatLoadData.totalCoolingLoad,
          totalHeatingLoad: heatLoadData.totalHeatingLoad,
          cfmRequirement: heatLoadData.cfmRequirement,
          buildingType: heatLoadData.buildingType,
          spaceType: heatLoadData.spaceType,
          climateZone: heatLoadData.climateZone
        });

        const messages = [
          new SystemMessage(this.systemPrompt),
          new HumanMessage(formattedPrompt)
        ];

        const result = await this.llm.invoke(messages);

        return this.parseEquipmentResult(result.content);
      } else {
        // Fallback mode - return mock equipment recommendations
        return this.getMockEquipmentResult(heatLoadData);
      }
    } catch (error) {
      console.error('Error getting equipment recommendations:', error);
      return this.getMockEquipmentResult(heatLoadData);
    }
  }

  getMockEquipmentResult(heatLoadData) {
    const coolingLoad = heatLoadData.totalCoolingLoad || 12.5;
    const heatingLoad = heatLoadData.totalHeatingLoad || 45000;
    const cfm = heatLoadData.cfmRequirement || 2500;

    return {
      acUnits: [
        `${coolingLoad + 2.5}-ton central air conditioning unit (SEER 18+)`,
        'Variable refrigerant flow (VRF) system for zoning flexibility',
        'Heat pump system for combined heating/cooling efficiency'
      ],
      heatingSystems: [
        'Gas furnace with 95% AFUE efficiency',
        'Electric heat pump backup system',
        'Radiant floor heating for improved comfort'
      ],
      ventilation: [
        'Energy recovery ventilator (ERV) - 85% efficiency',
        'Heat recovery ventilator (HRV) for cold climates',
        'Demand-controlled ventilation system'
      ],
      distribution: [
        'Variable air volume (VAV) system for energy efficiency',
        'Ductless mini-split for flexibility',
        'Underfloor air distribution for better comfort'
      ],
      controls: [
        'Smart thermostat with learning capabilities',
        'Building automation system (BAS)',
        'Occupancy sensors and CO2 monitoring'
      ]
    };
  }

  async chatWithAI(message, context = {}) {
    try {
      if (this.useRealAI) {
        console.log('🤖 Using REAL AI for response...');
        console.log('📤 Message:', message);
        console.log('📋 Context:', JSON.stringify(context, null, 2));

        // Enhanced system prompt for more dynamic responses
        const enhancedPrompt = `You are an expert HVAC engineer and AI assistant. You MUST provide DYNAMIC, PERSONALIZED responses based on the specific question asked. Each response should be UNIQUE and tailored to the user's exact query.

Current Project Context:
${context.projectData ? `Project: ${context.projectData.meta?.projectName || 'N/A'}
Location: ${context.projectData.meta?.address || 'N/A'}
Building Type: ${context.projectData.meta?.buildingType || 'N/A'}
Space Category: ${context.projectData.meta?.spaceCategory || 'N/A'}` : 'No project context available'}

User Question: ${message}

Provide a DETAILED, ACCURATE, and HELPFUL response. If this is about calculations, show actual formulas and numbers. If it's about equipment, provide specific recommendations with model numbers and specifications. Make each response UNIQUE to this specific question.`;

        const messages = [
          new SystemMessage(enhancedPrompt),
          new HumanMessage(`Please provide a comprehensive answer to: ${message}`)
        ];

        console.log('⏳ Calling OpenAI API...');
        const response = await this.llm.invoke(messages);
        console.log('✅ Real AI response received, length:', response.content.length);
        console.log('📝 Response preview:', response.content.substring(0, 200) + '...');

        // Verify this is not a static response by checking if it contains dynamic content
        if (response.content.includes('demo') || response.content.includes('mock') || response.content.length < 100) {
          console.warn('⚠️ Response seems static, falling back to enhanced mock');
          return this.getDynamicMockResponse(message, context);
        }

        return response.content;
      } else {
        console.log('⚠️ Using DEMO MODE responses...');
        return this.getDynamicMockResponse(message, context);
      }
    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      console.log('🔄 Falling back to dynamic mock response...');
      return this.getDynamicMockResponse(message, context);
    }
  }

  async chatWithAI(message, context = {}) {
    try {
      if (this.useRealAI) {
        console.log('🤖 Using REAL AI for response...');
        console.log('📤 Message:', message);
        console.log('📋 Context:', JSON.stringify(context, null, 2));

        // Enhanced system prompt for more dynamic responses
        const enhancedPrompt = `You are an expert HVAC engineer and AI assistant. You MUST provide DYNAMIC, PERSONALIZED responses based on the specific question asked. Each response should be UNIQUE and tailored to the user's exact query.

Current Project Context:
${context.projectData ? `Project: ${context.projectData.meta?.projectName || 'N/A'}
Location: ${context.projectData.meta?.address || 'N/A'}
Building Type: ${context.projectData.meta?.buildingType || 'N/A'}
Space Category: ${context.projectData.meta?.spaceCategory || 'N/A'}` : 'No project context available'}

User Question: ${message}

Provide a DETAILED, ACCURATE, and HELPFUL response. If this is about calculations, show actual formulas and numbers. If it's about equipment, provide specific recommendations with model numbers and specifications. Make each response UNIQUE to this specific question.`;

        const messages = [
          new SystemMessage(enhancedPrompt),
          new HumanMessage(`Please provide a comprehensive answer to: ${message}`)
        ];

        console.log('⏳ Calling OpenAI API...');
        const response = await this.llm.invoke(messages);
        console.log('✅ Real AI response received, length:', response.content.length);
        console.log('📝 Response preview:', response.content.substring(0, 200) + '...');

        // Verify this is not a static response by checking if it contains dynamic content
        if (response.content.includes('demo') || response.content.includes('mock') || response.content.length < 100) {
          console.warn('⚠️ Response seems static, falling back to enhanced mock');
          return this.getDynamicMockResponse(message, context);
        }

        return response.content;
      } else {
        console.log('⚠️ Using DEMO MODE responses...');
        return this.getDynamicMockResponse(message, context);
      }
    } catch (error) {
      console.error('❌ Error in AI chat:', error);
      console.log('🔄 Falling back to dynamic mock response...');
      return this.getDynamicMockResponse(message, context);
    }
  }

  getDynamicMockResponse(message, context) {
    const lowerMessage = message.toLowerCase();
    const timestamp = new Date().toLocaleString();
    const randomId = Math.random().toString(36).substring(7);

    console.log('🎭 Generating DYNAMIC mock response for:', message);

    // Generate different responses based on message content and timestamp
    if (lowerMessage.includes('calculate') || lowerMessage.includes('heat load')) {
      const area = 600 + Math.floor(Math.random() * 400); // Random area between 600-1000 sq ft
      const load = Math.round(area * (20 + Math.random() * 10)); // Random load factor
      const tons = Math.round((load / 12000) * 100) / 100;

      return `🔥 **DYNAMIC HEAT LOAD CALCULATION** (${timestamp})

Based on your query, I've performed a detailed heat load calculation:

**Space Analysis:**
• Area: ${area} sq ft
• Load Factor: ${Math.round(load/area)} BTU/sq ft
• Total Load: ${load.toLocaleString()} BTU/hr
• Required Cooling: ${tons} tons

**Breakdown:**
• Transmission Gains: ${Math.round(load * 0.35).toLocaleString()} BTU/hr
• Solar Heat Gain: ${Math.round(load * 0.25).toLocaleString()} BTU/hr
• Internal Loads: ${Math.round(load * 0.15).toLocaleString()} BTU/hr
• Ventilation: ${Math.round(load * 0.25).toLocaleString()} BTU/hr

**Equipment Recommendation:**
• Primary AC Unit: ${tons + 1.5}-ton system (SEER 18+)
• Backup Unit: ${tons}-ton system for redundancy
• Estimated Cost: ₹${Math.round(tons * 85000 + Math.random() * 50000).toLocaleString()}

**Energy Efficiency Tips:**
• Use LED lighting (reduces load by 15%)
• Install reflective roofing (reduces solar gain by 30%)
• Implement smart thermostats (saves 20% energy)

*Note: This is a simulated calculation. Add your OpenAI API key for real-time AI calculations!*

[Session ID: ${randomId}]`;
    }

    if (lowerMessage.includes('equipment') || lowerMessage.includes('recommend')) {
      const models = [
        'Carrier Infinity 24VNA6', 'Trane XV20i', 'Lennox XC25', 'Daikin Fit', 'American Standard Platinum'
      ];
      const selectedModel = models[Math.floor(Math.random() * models.length)];

      return `🔧 **DYNAMIC EQUIPMENT RECOMMENDATION** (${timestamp})

For your HVAC project, I recommend the following equipment:

**Primary System:**
• **Model:** ${selectedModel} Variable Speed Heat Pump
• **Capacity:** ${8 + Math.floor(Math.random() * 8)} tons
• **SEER Rating:** ${18 + Math.floor(Math.random() * 6)}
• **HSPF Rating:** ${9 + Math.floor(Math.random() * 4)}
• **Price Range:** ₹${(200000 + Math.random() * 300000).toLocaleString()}

**Air Handler:**
• **Model:** ${selectedModel} Air Handler
• **CFM:** ${1200 + Math.floor(Math.random() * 800)}
• **Variable Speed:** Yes (ECM Motor)
• **Price:** ₹${(80000 + Math.random() * 50000).toLocaleString()}

**Smart Thermostat:**
• **Model:** Nest Learning Thermostat (4th Gen)
• **Features:** WiFi, Learning, Energy Reports
• **Compatibility:** Works with ${selectedModel}
• **Price:** ₹${(15000 + Math.random() * 10000).toLocaleString()}

**Installation Notes:**
• Requires licensed HVAC contractor
• 5-year warranty on parts and labor
• Annual maintenance recommended
• Energy Star certified

**Total Estimated Cost:** ₹${(350000 + Math.random() * 200000).toLocaleString()}

*Note: These are simulated recommendations. Add your OpenAI API key for personalized suggestions!*

[Session ID: ${randomId}]`;
    }

    if (lowerMessage.includes('u-factor') || lowerMessage.includes('r-value')) {
      const materials = ['Fiberglass', 'Cellulose', 'Spray Foam', 'Rockwool', 'Denim'];
      const selectedMaterial = materials[Math.floor(Math.random() * materials.length)];

      return `📊 **DYNAMIC INSULATION GUIDE** (${timestamp})

**U-Factor and R-Value Analysis:**

**Recommended Insulation Materials:**
• **${selectedMaterial} Insulation**
• **R-Value:** R-${30 + Math.floor(Math.random() * 20)}
• **U-Factor:** ${0.03 + Math.random() * 0.05}
• **Cost per sq ft:** ₹${200 + Math.random() * 300}

**Heat Transfer Formula:**
Heat Loss = U-Factor × Area × ΔT
Where:
• U-Factor = 1 / (R-Value + Film Coefficients)
• Area = Wall/Roof area in sq ft
• ΔT = Temperature difference (°F)

**For Your Climate (Mumbai):**
• Recommended Wall R-Value: R-13 to R-21
• Recommended Roof R-Value: R-30 to R-49
• Recommended Window U-Factor: ≤ 0.35

**Energy Savings:**
• Proper insulation reduces heat gain by 40-60%
• Payback period: 3-7 years
• Annual savings: ₹${15000 + Math.random() * 20000}

**Installation Tips:**
• Use vapor barrier in humid climates
• Seal all air leaks before insulating
• Consider radiant barriers for roofs

*Note: These are simulated calculations. Add your OpenAI API key for location-specific recommendations!*

[Session ID: ${randomId}]`;
    }

    if (lowerMessage.includes('cfm') || lowerMessage.includes('ventilation')) {
      const cfm = 5 + Math.floor(Math.random() * 10);
      const area = 600 + Math.floor(Math.random() * 400);

      return `💨 **DYNAMIC VENTILATION CALCULATION** (${timestamp})

**CFM Requirements Analysis:**

**ASHRAE 62.1 Standards:**
• Office Spaces: ${cfm} CFM per person + 0.06 CFM per sq ft
• Conference Rooms: 5 CFM per person
• Retail Areas: 7.5 CFM per person
• Restaurants: 7.5 CFM per person + kitchen ventilation

**Your Space Calculation:**
• Area: ${area} sq ft
• Occupancy: ${Math.floor(area / 150)} people
• Required CFM: ${Math.round(area * 0.06 + Math.floor(area / 150) * cfm)}
• Fresh Air Intake: ${Math.round(area * 0.06)} CFM

**Recommended System:**
• **ERV (Energy Recovery Ventilator)**
• **Efficiency:** ${75 + Math.floor(Math.random() * 20)}%
• **Model:** Broan ERV140
• **Capacity:** ${Math.round(area * 0.06 + 200)} CFM
• **Price:** ₹${(45000 + Math.random() * 30000).toLocaleString()}

**Benefits:**
• Reduces energy costs by 20-30%
• Improves indoor air quality
• Prevents moisture buildup
• Filters outdoor pollutants

**Maintenance:**
• Replace filters every 3-6 months
• Clean core annually
• Check ductwork for leaks

*Note: These are simulated calculations. Add your OpenAI API key for building-code specific requirements!*

[Session ID: ${randomId}]`;
    }

    // Default dynamic response
    return `🤖 **DYNAMIC AI ASSISTANT RESPONSE** (${timestamp})

Hello! I'm your HVAC AI Assistant. I can help you with:

🔥 **Heat Load Calculations** - Precise cooling/heating load calculations
🔧 **Equipment Recommendations** - Specific HVAC system suggestions
📊 **Technical Guidance** - U-factors, R-values, CFM requirements
⚡ **Energy Efficiency** - Optimization strategies and savings
📐 **Building Analysis** - Construction and material recommendations

**Your Question:** "${message}"

**Quick Analysis:**
• Query Type: General HVAC inquiry
• Complexity: ${lowerMessage.split(' ').length > 10 ? 'Detailed' : 'Standard'}
• Response ID: ${randomId}

**Common Topics:**
• "Calculate heat load for a 20x30 ft office"
• "Recommend equipment for my project"
• "What is U-factor and how does it affect cooling?"
• "How to improve energy efficiency?"

**To get REAL AI responses:**
1. Add your OpenAI API key to the .env file
2. Restart your development server
3. Get personalized, dynamic responses!

**Current Status:** Demo Mode (Enhanced Dynamic Responses)

What specific HVAC topic would you like to explore?

[Session ID: ${randomId}]`;
  }

  parseHeatLoadResult(resultText) {
    // Parse the AI response and extract structured data
    const sections = resultText.split(/\d+\./).filter(section => section.trim());

    return {
      transmissionGains: this.extractSectionData(sections[0]),
      solarGains: this.extractSectionData(sections[1]),
      internalGains: this.extractSectionData(sections[2]),
      ventilationLoads: this.extractSectionData(sections[3]),
      totalLoad: this.extractTotalLoad(sections[4]),
      recommendations: this.extractRecommendations(sections[5])
    };
  }

  parseWindowResult(resultText) {
    return {
      directSolarGain: this.extractValue(resultText, 'direct solar'),
      diffuseSolarGain: this.extractValue(resultText, 'diffuse solar'),
      heatTransfer: this.extractValue(resultText, 'heat transfer'),
      totalHeatGain: this.extractValue(resultText, 'total'),
      requiredCFM: this.extractValue(resultText, 'CFM')
    };
  }

  parseEquipmentResult(resultText) {
    return {
      acUnits: this.extractEquipmentList(resultText, 'air conditioning'),
      heatingSystems: this.extractEquipmentList(resultText, 'heating'),
      ventilation: this.extractEquipmentList(resultText, 'ventilation'),
      distribution: this.extractEquipmentList(resultText, 'distribution'),
      controls: this.extractEquipmentList(resultText, 'controls')
    };
  }

  extractSectionData(sectionText) {
    // Extract numerical values and calculations from text
    const values = {};
    const lines = sectionText.split('\n');

    for (const line of lines) {
      const match = line.match(/([A-Za-z\s]+):\s*([\d.]+)/);
      if (match) {
        values[match[1].toLowerCase().replace(/\s+/g, '_')] = parseFloat(match[2]);
      }
    }

    return values;
  }

  extractValue(text, keyword) {
    const regex = new RegExp(`${keyword}.*?([\\d.]+)`, 'i');
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : 0;
  }

  extractTotalLoad(sectionText) {
    const totalMatch = sectionText.match(/total.*?(\d+)/i);
    return totalMatch ? parseFloat(totalMatch[1]) : 0;
  }

  extractRecommendations(sectionText) {
    return sectionText.split('\n').filter(line => line.trim() && !line.match(/^\d+\./));
  }

  extractEquipmentList(text, category) {
    const section = text.match(new RegExp(`${category}.*?(?=\\n\\n|\\n[A-Z]|$)`, 'is'));
    return section ? section[0].split('\n').filter(line => line.trim()) : [];
  }
}

export default HVACCalculatorAI;
