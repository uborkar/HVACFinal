import React, { useState, useRef, useEffect } from 'react';
import HVACCalculatorAI from '../services/HVACCalculatorAI';
import './AIChatbot.css';

const AIChatbot = ({ projectData, onCalculationRequest, onEquipmentRecommendation }) => {
  // Initialize HVAC AI instance first
  const hvacAI = new HVACCalculatorAI();

  const [messages, setMessages] = useState(() => [
    {
      type: 'bot',
      content: hvacAI.useRealAI
        ? 'Hello! I\'m your HVAC AI assistant. I can help you with heat load calculations, equipment recommendations, and answer any HVAC-related questions. What would you like to know?'
        : 'Hello! I\'m your HVAC AI assistant running in demo mode. I can help you with heat load calculations, equipment recommendations, and answer any HVAC-related questions. Add your OpenAI API key to get personalized AI responses!',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if we're in demo mode
  useEffect(() => {
    setIsDemoMode(!hvacAI.useRealAI);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    console.log('📤 Sending message to AI:', inputMessage);
    console.log('🤖 AI Mode:', hvacAI.useRealAI ? 'REAL AI' : 'DEMO MODE');

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Analyze the user message for intent
      const intent = analyzeIntent(inputMessage);
      let botResponse = '';

      console.log('🎯 Detected intent:', intent.type);

      switch (intent.type) {
        case 'calculation':
          console.log('🔢 Processing calculation request...');
          botResponse = await handleCalculationRequest(intent, inputMessage);
          break;
        case 'equipment':
          console.log('🔧 Processing equipment request...');
          botResponse = await handleEquipmentRequest(intent, inputMessage);
          break;
        case 'technical':
          console.log('📚 Processing technical question...');
          botResponse = await handleTechnicalQuestion(inputMessage);
          break;
        case 'general':
          console.log('💬 Processing general question...');
          botResponse = await handleGeneralQuestion(inputMessage);
          break;
        default:
          console.log('🤖 Processing with general AI...');
          botResponse = await hvacAI.chatWithAI(inputMessage, projectData);
      }

      console.log('✅ Bot response received, length:', botResponse.length);

      const botMessage = {
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        intent: intent.type
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('❌ Error processing message:', error);
      const errorMessage = {
        type: 'bot',
        content: 'I apologize, but I encountered an error processing your request. Please try again or contact support if the issue persists.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    // Calculation intents
    if (lowerMessage.includes('calculate') || lowerMessage.includes('heat load') ||
        lowerMessage.includes('cooling load') || lowerMessage.includes('cfm') ||
        lowerMessage.includes('btu') || lowerMessage.includes('ton')) {
      return { type: 'calculation', confidence: 0.9 };
    }

    // Equipment intents
    if (lowerMessage.includes('equipment') || lowerMessage.includes('recommend') ||
        lowerMessage.includes('ac unit') || lowerMessage.includes('hvac system') ||
        lowerMessage.includes('air conditioner') || lowerMessage.includes('furnace')) {
      return { type: 'equipment', confidence: 0.9 };
    }

    // Technical questions
    if (lowerMessage.includes('u-factor') || lowerMessage.includes('r-value') ||
        lowerMessage.includes('shgc') || lowerMessage.includes('solar gain') ||
        lowerMessage.includes('infiltration') || lowerMessage.includes('ventilation') ||
        lowerMessage.includes('psychrometric') || lowerMessage.includes('ashrae')) {
      return { type: 'technical', confidence: 0.8 };
    }

    return { type: 'general', confidence: 0.5 };
  };

  const handleCalculationRequest = async (intent, originalMessage) => {
    try {
      // Extract parameters from the message
      const params = extractCalculationParameters(originalMessage);

      // Use AI to perform calculation
      const calculationResult = await hvacAI.calculateHeatLoad({
        buildingType: params.buildingType || projectData?.spaceConsidered || 'Commercial',
        spaceType: params.spaceType || 'Office',
        location: projectData?.address || 'Unknown',
        outsideTemp: projectData?.ambient?.dbF || 95,
        outsideRH: projectData?.ambient?.rh || 50,
        insideTemp: projectData?.inside?.dbF || 75,
        insideRH: projectData?.inside?.rh || 50,
        length: params.length,
        width: params.width,
        height: params.height,
        area: params.area,
        volume: params.volume,
        constructionDetails: params.construction,
        occupancyDetails: params.occupancy
      });

      // Format the response
      return formatCalculationResponse(calculationResult, params);
    } catch (error) {
      return 'I\'m having trouble performing that calculation. Could you please provide more specific details about the space dimensions, construction materials, and occupancy?';
    }
  };

  const handleEquipmentRequest = async (intent, originalMessage) => {
    try {
      const equipmentResult = await hvacAI.getEquipmentRecommendations({
        totalCoolingLoad: 10, // This would come from actual calculations
        totalHeatingLoad: 50000,
        cfmRequirement: 2000,
        buildingType: projectData?.spaceConsidered || 'Commercial',
        spaceType: 'Office',
        climateZone: getClimateZone(projectData?.address || '')
      });

      return formatEquipmentResponse(equipmentResult);
    } catch (error) {
      return 'I\'d be happy to recommend equipment for your project. Could you tell me more about the total cooling/heating loads and the type of building?';
    }
  };

  const handleTechnicalQuestion = async (message) => {
    return await hvacAI.chatWithAI(message, {
      context: 'technical_hvac_question',
      projectData: projectData
    });
  };

  const handleGeneralQuestion = async (message) => {
    return await hvacAI.chatWithAI(message, {
      context: 'general_hvac_inquiry',
      projectData: projectData
    });
  };

  const extractCalculationParameters = (message) => {
    const params = {};

    // Extract dimensions
    const dimensionMatch = message.match(/(\d+(?:\.\d+)?)\s*(?:ft|feet|m|meter)/gi);
    if (dimensionMatch) {
      const dimensions = dimensionMatch.map(d => parseFloat(d.match(/(\d+(?:\.\d+)?)/)[1]));
      if (dimensions.length >= 3) {
        params.length = dimensions[0];
        params.width = dimensions[1];
        params.height = dimensions[2];
        params.area = dimensions[0] * dimensions[1];
        params.volume = dimensions[0] * dimensions[1] * dimensions[2];
      }
    }

    // Extract building type
    const buildingTypes = ['office', 'apartment', 'mall', 'hotel', 'warehouse', 'retail', 'restaurant'];
    const foundType = buildingTypes.find(type => message.toLowerCase().includes(type));
    if (foundType) params.buildingType = foundType;

    return params;
  };

  const getClimateZone = (location) => {
    // Simple climate zone determination based on location
    if (location.toLowerCase().includes('mumbai') || location.toLowerCase().includes('india')) {
      return '1A - Very Hot Humid';
    }
    return '4A - Mixed Humid';
  };

  const formatCalculationResponse = (result, params) => {
    return `
Based on your requirements, I've calculated the heat load for your ${params.buildingType || 'building'}:

**Key Results:**
- Total Cooling Load: ${result.totalLoad?.sensible || 'TBD'} tons
- Total Heating Load: ${result.totalLoad?.heating || 'TBD'} BTU/hr
- Required CFM: ${result.ventilationLoads?.cfm || 'TBD'} CFM

**Breakdown:**
• Transmission Gains: ${result.transmissionGains?.walls || 0} BTU/hr (walls), ${result.transmissionGains?.windows || 0} BTU/hr (windows)
• Solar Heat Gain: ${result.solarGains?.total || 0} BTU/hr
• Internal Loads: ${result.internalGains?.people || 0} BTU/hr (people), ${result.internalGains?.equipment || 0} BTU/hr (equipment)
• Ventilation/Infiltration: ${result.ventilationLoads?.infiltration || 0} BTU/hr

**Recommendations:**
${result.recommendations?.join('\n• ') || 'Standard HVAC system recommended'}

Would you like me to recommend specific equipment or perform more detailed calculations for specific areas?`;
  };

  const formatEquipmentResponse = (result) => {
    return `
Here are my equipment recommendations for your project:

**Air Conditioning Systems:**
${result.acUnits?.slice(0, 3).join('\n• ') || '• Central air conditioning unit (10-15 tons)'}

**Heating Systems:**
${result.heatingSystems?.slice(0, 3).join('\n• ') || '• Gas furnace with heat pump backup'}

**Ventilation Systems:**
${result.ventilation?.slice(0, 3).join('\n• ') || '• Energy recovery ventilator (ERV)'}

**Air Distribution:**
${result.distribution?.slice(0, 3).join('\n• ') || '• Variable air volume (VAV) system'}

**Controls & Automation:**
${result.controls?.slice(0, 3).join('\n• ') || '• Smart thermostat with zoning controls'}

These recommendations are based on standard HVAC engineering practices and ASHRAE guidelines. For detailed specifications and quotes, I recommend consulting with a licensed HVAC contractor.

Would you like more specific recommendations or information about any of these systems?`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="ai-chatbot">
      <div className="chatbot-header">
        <h3>HVAC AI Assistant</h3>
        <div className="chatbot-status">
          {isDemoMode ? 'Demo Mode' : 'Online'}
          {isDemoMode && <span className="demo-indicator">⚠️</span>}
        </div>
      </div>

      <div className="chatbot-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.type} ${message.isError ? 'error' : ''}`}
          >
            <div className="message-content">
              {message.content}
            </div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot loading">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about HVAC calculations, equipment, or building requirements..."
          rows={3}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !inputMessage.trim()}
          className="send-button"
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </div>

      <div className="chatbot-suggestions">
        <div className="suggestion-chips">
          <button onClick={() => setInputMessage('Calculate heat load for a 20x30 ft office')}>
            Calculate heat load
          </button>
          <button onClick={() => setInputMessage('Recommend equipment for a small office')}>
            Equipment recommendations
          </button>
          <button onClick={() => setInputMessage('What is U-factor and how does it affect cooling?')}>
            Technical questions
          </button>
          <button onClick={() => setInputMessage('How to improve energy efficiency?')}>
            Energy efficiency tips
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatbot;
