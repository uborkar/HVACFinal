import React, { useState, useEffect } from "react";
import { ref, get, set, update } from "firebase/database";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import { 
  calculatePsychrometrics, 
  getClimateData, 
  getStandardIndoorConditions,
  INDIAN_CLIMATE_DATA,
  STANDARD_INDOOR_CONDITIONS 
} from "../../utils/psychrometrics";
import "../../styles/forms.css";
import "./DesignDataLocationForm.css";

// Helper conversions
const cToF = (c) => (c * 9) / 5 + 32;
const fToC = (f) => ((f - 32) * 5) / 9;

const defaultAmbient = {
  dbF: 104,
  wbF: 81.623,
  rh: 40,
  pressure: 1013.25,
};

const insidePresets = {
  "GENERAL COMFORT": {
    dbF: 75.2,
    rh: 50,
    description: "Apartment, school, house, hospital, hotel, office, etc."
  },
  "RETAIL SHOPS": {
    dbF: 75.2,
    rh: 50,
    description: "Bank, barber and salon shops, department store, supermarket, etc."
  },
  "LOW SENSIBLE HEAT FACTORS (HIGH LATENT LOAD)": {
    dbF: 75.2,
    rh: 60,
    description: "Auditorium, church, bar, restaurant, kitchen, etc."
  },
  "FACTORY COMFORT": {
    dbF: 75.2,
    rh: 45,
    description: "Assembly areas, machining rooms, etc."
  }
};

export default function DesignDataLocationForm({ onSave = () => {}, savedData = null, projectId = null }) {
  const { user } = useAuth();
  
  // Form 1 - Design Data & Location fields (matching uploaded sheet exactly)
  const [projectName, setProjectName] = useState(savedData?.meta?.projectName || "");
  const [address, setAddress] = useState(savedData?.meta?.address || "");
  const [spaceConsidered, setSpaceConsidered] = useState(savedData?.meta?.spaceConsidered || "");
  const [floor, setFloor] = useState(savedData?.meta?.floor || "");
  const [projectNumber, setProjectNumber] = useState(savedData?.meta?.projectNumber || "");
  const [estimatedBy, setEstimatedBy] = useState(savedData?.meta?.estimatedBy || "");
  const [heatLoadFor, setHeatLoadFor] = useState(savedData?.meta?.heatLoadFor || "Summer");
  
  // Location to be considered
  const [locationConsidered, setLocationConsidered] = useState(savedData?.meta?.locationConsidered || "");
  
  // Climate data options
  const [useIndianClimate, setUseIndianClimate] = useState(savedData?.meta?.useIndianClimate || false);
  const [selectedCity, setSelectedCity] = useState(savedData?.meta?.selectedCity || 'Delhi');
  const [selectedSeason, setSelectedSeason] = useState(savedData?.meta?.selectedSeason || 'summer');
  
  // Location-based weather API
  const [useLocationAPI, setUseLocationAPI] = useState(savedData?.meta?.useLocationAPI || false);
  const [locationInput, setLocationInput] = useState(savedData?.meta?.locationInput || "");
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  
  // Manual override for ambient conditions
  const [manualAmbientOverride, setManualAmbientOverride] = useState(savedData?.meta?.manualAmbientOverride || false);
  
  // API key for weather service
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  // Ambient Conditions
  const [ambient, setAmbient] = useState(
    savedData?.ambient
      ? {
          dbF: savedData.ambient.dbF || defaultAmbient.dbF,
          wbF: savedData.ambient.wbF || defaultAmbient.wbF,
          rh: savedData.ambient.rh || defaultAmbient.rh,
          dpF: savedData.ambient.dpF || "",
          grLb: savedData.ambient.grLb || "",
          pressure: savedData.ambient.pressure || defaultAmbient.pressure
        }
      : { 
          ...defaultAmbient,
          dpF: "",
          grLb: ""
        }
  );

  // Inside Room Conditions
  const [insideCategory, setInsideCategory] = useState(
    savedData?.inside?.category || "GENERAL COMFORT"
  );
  const [manualOverride, setManualOverride] = useState(
    savedData?.inside?.manualOverride || false
  );
  const [inside, setInside] = useState(
    savedData?.inside
      ? {
          dbF: savedData.inside.dbF || insidePresets["GENERAL COMFORT"].dbF,
          wbF: savedData.inside.wbF || "",
          rh: savedData.inside.rh || insidePresets["GENERAL COMFORT"].rh,
          dpF: savedData.inside.dpF || "",
          grLb: savedData.inside.grLb || "",
          category: savedData.inside.category || "GENERAL COMFORT",
          manualOverride: savedData.inside.manualOverride || false
        }
      : {
          dbF: insidePresets["GENERAL COMFORT"].dbF,
          wbF: "",
          rh: insidePresets["GENERAL COMFORT"].rh,
          dpF: "",
          grLb: "",
          category: "GENERAL COMFORT",
          manualOverride: false
        }
  );

  // Auto-calculate psychrometric properties
  useEffect(() => {
    if (ambient.dbF && ambient.rh && !isNaN(parseFloat(ambient.dbF)) && !isNaN(parseFloat(ambient.rh))) {
      try {
        const psychrometrics = calculatePsychrometrics({
          dbF: parseFloat(ambient.dbF),
          rh: parseFloat(ambient.rh)
        }, ambient.pressure);
        setAmbient(prev => ({
          ...prev,
          wbF: psychrometrics.wbF,
          dpF: psychrometrics.dewPoint,
          grLb: psychrometrics.humidityRatio
        }));
      } catch (error) {
        console.warn('Error calculating ambient psychrometrics:', error);
      }
    }
  }, [ambient.dbF, ambient.rh, ambient.pressure]);

  useEffect(() => {
    if (inside.dbF && inside.rh && !isNaN(parseFloat(inside.dbF)) && !isNaN(parseFloat(inside.rh))) {
      try {
        const psychrometrics = calculatePsychrometrics({
          dbF: parseFloat(inside.dbF),
          rh: parseFloat(inside.rh)
        }, ambient.pressure);
        setInside(prev => ({
          ...prev,
          wbF: psychrometrics.wbF,
          dpF: psychrometrics.dewPoint,
          grLb: psychrometrics.humidityRatio
        }));
      } catch (error) {
        console.warn('Error calculating inside psychrometrics:', error);
      }
    }
  }, [inside.dbF, inside.rh, ambient.pressure]);

  // Handle Indian climate data selection
  useEffect(() => {
    if (useIndianClimate && selectedCity && selectedSeason) {
      try {
        const climateData = INDIAN_CLIMATE_DATA[selectedCity]?.[selectedSeason];
        if (climateData) {
          setAmbient(prev => ({
            ...prev,
            dbF: climateData.db,
            wbF: climateData.wb,
            rh: climateData.rh
          }));
        }
      } catch (error) {
        console.warn('Error loading Indian climate data:', error);
      }
    }
  }, [useIndianClimate, selectedCity, selectedSeason]);

  // Handle inside condition category change
  useEffect(() => {
    if (!manualOverride && insidePresets[insideCategory]) {
      try {
        const preset = insidePresets[insideCategory];
        setInside(prev => ({
          ...prev,
          dbF: preset.dbF,
          rh: preset.rh,
          category: insideCategory
        }));
      } catch (error) {
        console.warn('Error updating inside conditions from category:', error);
      }
    }
  }, [insideCategory, manualOverride]);

  // Generate unique project number if not provided
  useEffect(() => {
    if (!projectNumber) {
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      setProjectNumber(`HVAC-${timestamp}-${randomNum}`);
    }
  }, [projectNumber]);

  // Weather API functions
  const fetchCitySuggestions = async (query) => {
    if (!query || query.length < 3 || !apiKey) return;
    
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const suggestions = data.map(city => ({
          name: city.name,
          country: city.country,
          state: city.state,
          lat: city.lat,
          lon: city.lon,
          display: `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`
        }));
        setCitySuggestions(suggestions);
      }
    } catch (error) {
      console.warn('Error fetching city suggestions:', error);
    }
  };

  const fetchWeatherData = async (cityData) => {
    if (!apiKey) {
      alert('Weather API key not configured. Please add VITE_OPENWEATHER_API_KEY to your environment variables.');
      return;
    }

    setIsLoadingWeather(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${cityData.lat}&lon=${cityData.lon}&appid=${apiKey}&units=imperial`
      );
      
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
        
        // Convert weather data to HVAC conditions
        const temperature = data.main.temp; // Already in Fahrenheit
        const humidity = data.main.humidity;
        
        // Set ambient conditions from weather data
        if (!manualAmbientOverride) {
          setAmbient(prev => ({
            ...prev,
            dbF: temperature,
            rh: humidity
          }));
        }
        
        setLocationConsidered(`${cityData.display} (Weather: ${temperature.toFixed(1)}°F, ${humidity}% RH)`);
        
      } else {
        throw new Error('Weather data not available');
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      alert('Error fetching weather data. Please try again or use manual input.');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Debounced city search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationInput && useLocationAPI) {
        fetchCitySuggestions(locationInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput, useLocationAPI, apiKey]);

  const handleSave = async () => {
    const formData = {
      meta: {
        projectName,
        address,
        spaceConsidered,
        floor,
        projectNumber,
        estimatedBy,
        heatLoadFor,
        locationConsidered,
        useIndianClimate,
        selectedCity,
        selectedSeason,
        useLocationAPI,
        locationInput,
        manualAmbientOverride
      },
      ambient: {
        dbF: parseFloat(ambient.dbF) || 0,
        wbF: parseFloat(ambient.wbF) || 0,
        rh: parseFloat(ambient.rh) || 0,
        dpF: parseFloat(ambient.dpF) || 0,
        grLb: parseFloat(ambient.grLb) || 0,
        pressure: parseFloat(ambient.pressure) || 1013.25
      },
      inside: {
        dbF: parseFloat(inside.dbF) || 0,
        wbF: parseFloat(inside.wbF) || 0,
        rh: parseFloat(inside.rh) || 0,
        dpF: parseFloat(inside.dpF) || 0,
        grLb: parseFloat(inside.grLb) || 0,
        category: insideCategory,
        manualOverride
      }
    };

    // Save to Firebase
    if (user && projectNumber) {
      try {
        const projectRef = ref(db, `projects/${projectNumber}`);
        await update(projectRef, {
          ...formData,
          lastUpdated: new Date().toISOString(),
          userId: user.uid
        });
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      }
    }

    onSave(formData);
  };

  return (
    <div className="design-data-location-form">
      <div className="form-header">
        <h2>Design Data, Location</h2>
        <div className="page-indicator">Page 1</div>
      </div>

      <div className="form-content">
        {/* Project Information Section */}
        <div className="project-info-section">
          <div className="project-info-grid">
            <div className="project-info-left">
              <div className="form-group">
                <label>Name of Project</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Enter project name"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter project address"
                />
              </div>
              <div className="form-group">
                <label>Space Considered</label>
                <input
                  type="text"
                  value={spaceConsidered}
                  onChange={(e) => setSpaceConsidered(e.target.value)}
                  placeholder="Enter space details"
                />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="Enter floor details"
                />
              </div>
            </div>
            
            <div className="project-info-right">
              <div className="form-group">
                <label>Project Number</label>
                <input
                  type="text"
                  value={projectNumber}
                  onChange={(e) => setProjectNumber(e.target.value)}
                  placeholder="Auto-generated"
                />
              </div>
              <div className="form-group">
                <label>Estimated by</label>
                <input
                  type="text"
                  value={estimatedBy}
                  onChange={(e) => setEstimatedBy(e.target.value)}
                  placeholder="Enter estimator name"
                />
              </div>
              <div className="form-group">
                <label>Heat load for</label>
                <select
                  value={heatLoadFor}
                  onChange={(e) => setHeatLoadFor(e.target.value)}
                >
                  <option value="Summer">Summer</option>
                  <option value="Winter">Winter</option>
                  <option value="Monsoon">Monsoon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Location Section */}
        <div className="location-section">
          <div className="form-group">
            <label>Location to be considered</label>
            <input
              type="text"
              value={locationConsidered}
              onChange={(e) => setLocationConsidered(e.target.value)}
              placeholder="Enter location details"
            />
          </div>

          {/* Climate Data Options */}
          <div className="climate-data-options">
            <div className="climate-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useIndianClimate}
                  onChange={(e) => {
                    setUseIndianClimate(e.target.checked);
                    if (e.target.checked) {
                      setUseLocationAPI(false);
                      setManualAmbientOverride(false);
                    }
                  }}
                />
                Use Indian Climate Data (ISHRAE Standards)
              </label>
            </div>

            <div className="climate-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={useLocationAPI}
                  onChange={(e) => {
                    setUseLocationAPI(e.target.checked);
                    if (e.target.checked) {
                      setUseIndianClimate(false);
                      setManualAmbientOverride(false);
                    }
                  }}
                />
                Use Live Weather Data (OpenWeather API)
              </label>
            </div>

            <div className="climate-option">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={manualAmbientOverride}
                  onChange={(e) => {
                    setManualAmbientOverride(e.target.checked);
                    if (e.target.checked) {
                      setUseIndianClimate(false);
                      setUseLocationAPI(false);
                    }
                  }}
                />
                Manual Input (Override Automatic Data)
              </label>
            </div>
          </div>
            
            {useIndianClimate && (
              <div className="climate-selection">
                <div className="form-group">
                  <label>City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                  >
                    {Object.keys(INDIAN_CLIMATE_DATA).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Season</label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(e.target.value)}
                  >
                    <option value="summer">Summer</option>
                    <option value="monsoon">Monsoon</option>
                    <option value="winter">Winter</option>
                  </select>
                </div>
              </div>
            )}

            {useLocationAPI && (
              <div className="weather-api-section">
                <div className="form-group">
                  <label>Search City for Weather Data</label>
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter city name (e.g., New York, London, Mumbai)"
                    disabled={isLoadingWeather}
                  />
                  {isLoadingWeather && <div className="loading-indicator">Loading weather data...</div>}
                </div>

                {citySuggestions.length > 0 && (
                  <div className="city-suggestions">
                    <label>Select City:</label>
                    {citySuggestions.map((city, index) => (
                      <button
                        key={index}
                        type="button"
                        className="city-suggestion-btn"
                        onClick={() => {
                          fetchWeatherData(city);
                          setCitySuggestions([]);
                          setLocationInput(city.display);
                        }}
                      >
                        📍 {city.display}
                      </button>
                    ))}
                  </div>
                )}

                {weatherData && (
                  <div className="weather-info-panel">
                    <h5>🌤️ Current Weather Data</h5>
                    <div className="weather-details">
                      <span><strong>Location:</strong> {weatherData.name}, {weatherData.sys.country}</span>
                      <span><strong>Temperature:</strong> {weatherData.main.temp.toFixed(1)}°F</span>
                      <span><strong>Humidity:</strong> {weatherData.main.humidity}%</span>
                      <span><strong>Condition:</strong> {weatherData.weather[0].description}</span>
                      <span><strong>Source:</strong> OpenWeather API</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ambient Conditions */}
        <div className="conditions-section">
          <h3>Ambient Conditions</h3>
          <div className="conditions-table">
            <div className="conditions-header">
              <div>DB (Deg. F)</div>
              <div>WB (Deg. F)</div>
              <div>% RH</div>
            </div>
            <div className="conditions-row">
              <input
                type="number"
                value={ambient.dbF}
                onChange={(e) => setAmbient(prev => ({ ...prev, dbF: e.target.value }))}
                step="0.1"
                disabled={!manualAmbientOverride && (useIndianClimate || useLocationAPI)}
                min="0"
                max="150"
              />
              <input
                type="number"
                value={ambient.wbF}
                readOnly
                className="calculated-field"
              />
              <input
                type="number"
                value={ambient.rh}
                onChange={(e) => setAmbient(prev => ({ ...prev, rh: e.target.value }))}
                step="0.1"
                disabled={!manualAmbientOverride && (useIndianClimate || useLocationAPI)}
                min="0"
                max="100"
              />
              <input
                type="number"
                value={ambient.dpF}
                readOnly
                className="calculated-field"
                step="0.1"
              />
              <input
                type="number"
                value={ambient.grLb}
                readOnly
                className="calculated-field"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Inside Room Conditions */}
        <div className="conditions-section">
          <h3>Inside Room Conditions</h3>
          
          <div className="inside-category-selection">
            <div className="form-group">
              <label>Usage Category</label>
              <select
                value={insideCategory}
                onChange={(e) => setInsideCategory(e.target.value)}
                disabled={manualOverride}
              >
                {Object.keys(insidePresets).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={manualOverride}
                onChange={(e) => setManualOverride(e.target.checked)}
              />
              Manual Override
            </label>
          </div>

          <div className="conditions-table">
            <div className="conditions-header">
              <div>DB (Deg. F)</div>
              <div>WB (Deg. F)</div>
              <div>% RH</div>
              <div>DP</div>
              <div>GR/lb</div>
            </div>
            <div className="conditions-row">
              <input
                type="number"
                value={inside.dbF}
                onChange={(e) => setInside(prev => ({ ...prev, dbF: e.target.value }))}
                step="0.1"
                disabled={!manualOverride}
                min="0"
                max="150"
              />
              <input
                type="number"
                value={inside.wbF}
                readOnly
                className="calculated-field"
                step="0.1"
              />
              <input
                type="number"
                value={inside.rh}
                onChange={(e) => setInside(prev => ({ ...prev, rh: e.target.value }))}
                step="0.1"
                disabled={!manualOverride}
                min="0"
                max="100"
              />
              <input
                type="number"
                value={inside.dpF}
                readOnly
                className="calculated-field"
                step="0.1"
              />
              <input
                type="number"
                value={inside.grLb}
                readOnly
                className="calculated-field"
                step="0.1"
              />
            </div>
          </div>

          {!manualOverride && (
            <div className="category-description">
              <p><strong>{insideCategory}:</strong> {insidePresets[insideCategory]?.description}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button type="button" onClick={handleSave} className="save-button">
            Save & Continue to Space Considered
          </button>
        </div>
      </div>
    
  );

}

