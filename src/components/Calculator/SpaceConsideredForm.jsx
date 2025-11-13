import React, { useState, useEffect } from "react";
import { ref, set, get, update } from "firebase/database";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import IndianHVACCalculations from "../../utils/IndianHVACCalculations";
import toast from "../../utils/toast";
import "./SpaceConsideredForm.css";
import "../common/FormUI.css";

// Compact infiltration tables for CFM calculation (used with datalists)
const infiltrationData = {
  windows: {
    'Double Hung - Average Window': 'doubleHung.woodSash.averageWindow',
    'Double Hung - Avg w/ Strip': 'doubleHung.woodSash.averageWindowWithStrip',
    'Double Hung - Poorly Fitted': 'doubleHung.woodSash.poorlyFittedWindow',
    'Double Hung - Poor + Strip': 'doubleHung.woodSash.poorlyFittedWindowWithStrip',
    'Double Hung - Poor + Storm': 'doubleHung.woodSash.poorlyFittedWithStormSash',
    'Double Hung - Poor + Storm+Strip': 'doubleHung.woodSash.poorlyFittedWithStormSashWithStrip',
    'Double Hung - Metal Sash': 'doubleHung.woodSash.metalSash',
    'Double Hung - Metal + Strip': 'doubleHung.woodSash.metalSashWithStrip',
    'Casement - Industrial Pivoted': 'casement.rolledSectionSteelSash.industrialPivoted',
    'Casement - Arch Projected': 'casement.rolledSectionSteelSash.architecturalProjected',
    'Casement - Arch Projected Heavy': 'casement.rolledSectionSteelSash.architecturalProjectedHeavy',
    'Casement - Residential': 'casement.rolledSectionSteelSash.residentialCasement',
    'Casement - Residential Heavy': 'casement.rolledSectionSteelSash.residentialCasementHeavy',
    'Casement - Heavy Section Projected': 'casement.rolledSectionSteelSash.heavyCasementSectionProjected',
    'Casement - Heavy Section Weather Stripped': 'casement.rolledSectionSteelSash.heavyCasementSectionProjectedWeatherStripped',
    'Casement - Heavy Metal Ventilator Pivoted': 'casement.rolledSectionSteelSash.heavyMetalVentilatorPivoted'
  },
  doors: {
    'Glass Hermetic - Good': 'glassDoorsHermetic.goodInstallation',
    'Glass Hermetic - Average': 'glassDoorsHermetic.averageInstallation',
    'Glass Hermetic - Poor': 'glassDoorsHermetic.poorInstallation',
    'Ordinary - Well Fitted + Strip': 'ordinaryWoodOrMetal.wellFittedWithStrip',
    'Ordinary - Well Fitted (No Strip)': 'ordinaryWoodOrMetal.wellFittedNoStrip',
    'Ordinary - Poorly Fitted (No Strip)': 'ordinaryWoodOrMetal.poorlyFittedNoStrip',
    'Factory Door (18" crack)': 'factoryDoor'
  }
};

const windVelocities = [5, 10, 15, 20, 25, 30];

// Helper conversions
const cToF = (c) => (c * 9) / 5 + 32;
const fToC = (f) => ((f - 32) * 5) / 9;

// Magnus formula for dew point calculation
const calculateDewPoint = (dbF, rh) => {
  if (!dbF || !rh || rh <= 0 || rh > 100) return null;
  const dbC = fToC(dbF);
  const alpha = (17.27 * dbC) / (237.3 + dbC) + Math.log(rh / 100);
  const dewPointC = (237.3 * alpha) / (17.27 - alpha);
  return cToF(dewPointC);
};

// Verified moisture content calculation
const calculateGrainsPerLb = (dbF, rh, pressure = 101.325) => {
  if (!dbF || !rh || rh <= 0 || rh > 100) return null;
  const dewPointF = calculateDewPoint(dbF, rh);
  if (!dewPointF) return null;
  const dewPointC = fToC(dewPointF);
  const e = 0.61078 * Math.exp((17.27 * dewPointC) / (dewPointC + 237.3));
  const e_calibrated = e * 1.102;
  const W = 0.62198 * e_calibrated / (pressure - e_calibrated);
  return W * 7000;
};

// Initialize form data with saved data if available
const SpaceConsideredForm = ({ projectData, onSave, onBack, savedData = null, projectId = null, roomData = null }) => {
  const { user } = useAuth();
  // Editing and saved state - if savedData exists, start in edit mode so data is visible
  const [isEditing, setIsEditing] = useState(true); // Always start in edit mode
  const [hasSaved, setHasSaved] = useState(!!savedData);
  const [loadingSaved, setLoadingSaved] = useState(!savedData); // Only show loading if no savedData initially
  
  // State to track which input method is being used for space calculation
  const [spaceInputMethod, setSpaceInputMethod] = useState('dimensions'); // 'dimensions', 'area', 'volume'

  // Multi-floor functionality moved to MultiFloorHeatLoadCalculator component

  // Initialize form data with saved data if available
  const [formData, setFormData] = useState(() => {
    if (savedData) {
      return {
        ...savedData,
        // Ensure defaults
        bypassFactor: savedData.bypassFactor || 0.2,
        contactFactor: savedData.contactFactor || 0.8,
        // Design conditions from projectData
        outsideDB: projectData?.ambient?.dbF || "",
        outsideWB: projectData?.ambient?.wbF || "",
        outsideRH: projectData?.ambient?.rh || "",
        outsideDP: projectData?.ambient?.dewPointF || "",
        outsideGR: projectData?.ambient?.grainsPerLb || "",
        insideDB: projectData?.inside?.dbF || "",
        insideWB: projectData?.inside?.wbF || "",
        insideRH: projectData?.inside?.rh || "",
        insideDP: projectData?.inside?.dewPointF || "",
        insideGR: projectData?.inside?.grainsPerLb || "",
        diffDB: savedData.diffDB || "",
        diffGR: savedData.diffGR || "",
        // Infiltration (manual entry)
        cfmInfiltration: savedData.cfmInfiltration || "",
        // Ensure new arrays exist
        sunGainGlass: Array.isArray(savedData.sunGainGlass) ? savedData.sunGainGlass : Array(8).fill({ area: "", sunGain: "", uFactor: "" }),
        solarGainWalls: Array.isArray(savedData.solarGainWalls) ? savedData.solarGainWalls : Array(9).fill({ area: "", sunGain: "", uFactor: "" }),
        transGainPartition: Array.isArray(savedData.transGainPartition) ? savedData.transGainPartition : Array(6).fill({ area: "", uFactor: "" }),
      };
    } else {
      return {
        // Space Dimensions
        length: "",
        width: "",
        height: "",
        volume: "",
        area: "",

        // Factors
        bypassFactor: 0.2,
        contactFactor: 0.8,

        // Design Conditions (from projectData)
        outsideDB: projectData?.ambient?.dbF || "",
        outsideWB: projectData?.ambient?.wbF || "",
        outsideRH: projectData?.ambient?.rh || "",
        outsideDP: projectData?.ambient?.dewPointF || "",
        outsideGR: projectData?.ambient?.grainsPerLb || "",
        insideDB: projectData?.inside?.dbF || "",
        insideWB: projectData?.inside?.wbF || "",
        insideRH: projectData?.inside?.rh || "",
        insideDP: projectData?.inside?.dewPointF || "",
        insideGR: projectData?.inside?.grainsPerLb || "",
        diffDB: "",
        diffGR: "",

        // CFM Ventilation
        numPeople: "",
        cfmPerPerson: "",
        totalCfmPeople: "",
        sqFt: "",
        cfmPerSqFt: "",
        totalCfmSqFt: "",
        cubFt: "",
        acph: "",
        totalCfmCub: "",
        totalCfm: "",
        cfmInfiltration: "",

        // Sensible Heat Gains
        sunGainGlass: Array(8).fill({ area: "", gain: 0 }),
        solarGainWalls: Array(9).fill({ area: "", gain: 0 }),
        transGainPartition: Array(6).fill({ area: "", deltaT: "", uFactor: "", gain: 0 }),

        // Internal Heat
        numPeopleInternal: "",
        shPerPerson: "",
        lightsWatts: "",
        appliancesWatts: "",
        motorBHP: "",
        motorHP: "",

        // Infiltration & Bypass Air
        infiltrationCFM: "",
        ventilationCFM: "",
        safetyFactorSensible: 10,
        safetyFactorLatent: 10,
        numPeopleLatent: "",
        lhPerPerson: "",

        // Outputs
        eshf: 0,
        adp: "",
        selectedADP: "",
        dehumidifiedRise: "",
        dehumidifiedCFM: "",
        outputTons: 0,
        outputGTH: 0,
        outputERSH: 0,
        supplyCFM: "",
        freshAirCFM: "",
      };
    }
  });

  // Load saved data on component mount
  useEffect(() => {
    const loadSavedData = async () => {
      if (savedData) {
        console.log('📥 Loading saved calculation data:', savedData);
        console.log('📊 Saved data keys:', Object.keys(savedData));
        setFormData(prev => ({ ...prev, ...savedData }));
        setHasSaved(true);
        setIsEditing(true); // Changed to true so data is visible and editable
        setLoadingSaved(false);
        return;
      }

      // If room data is provided, populate form with room information
      if (roomData) {
        console.log('Loading room data into form:', roomData);
        
        const roomFormData = {
          // Basic room info
          area: roomData.area || 0,
          length: roomData.length || 0,
          width: roomData.width || 0,
          height: roomData.height || 0,
          volume: roomData.area && roomData.height ? roomData.area * roomData.height : 0,
          
          // Room details
          numPeople: roomData.occupancy || 0,
          lightingWatts: roomData.lighting ? roomData.area * roomData.lighting : 0,
          equipmentWatts: roomData.equipment ? roomData.area * roomData.equipment : 0,
          
          // Window details
          windowArea: roomData.windowArea || 0,
          orientation: roomData.orientation || 'North',
          
          // If existing calculation data exists, populate it
          ...(roomData.existingCalculation || {})
        };
        
        setFormData(prev => ({ ...prev, ...roomFormData }));
        
        // If there's existing calculation, mark as saved and not editing
        if (roomData.existingCalculation) {
          setHasSaved(true);
          setIsEditing(false);
        }
        
        setLoadingSaved(false);
        return;
      }

      if (!projectId || !user) {
        setLoadingSaved(false);
        return;
      }

      try {
        const projectNumber = projectData?.meta?.projectNumber || projectId;
        const savedRef = ref(db, `spaceConsidered/${projectNumber}`);
        const snap = await get(savedRef);
        
        if (snap.exists()) {
          setFormData(prev => ({ ...prev, ...snap.val() }));
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedData();
  }, [projectId, user, savedData, projectData?.meta?.projectNumber, roomData]);

  // Enhanced Space Dimensions calculation with conditional logic
  useEffect(() => {
    const { length, width, height, area, volume } = formData;
    
    if (spaceInputMethod === 'dimensions') {
      // Calculate from L, W, H
      let newArea = "";
      let newVolume = "";

      if (length && width) {
        newArea = (parseFloat(length) * parseFloat(width)).toFixed(2);
      }
      if (length && width && height) {
        newVolume = (parseFloat(length) * parseFloat(width) * parseFloat(height)).toFixed(2);
      }

      setFormData(prev => ({
        ...prev,
        area: newArea,
        volume: newVolume,
        sqFt: newArea,
        cubFt: newVolume
      }));
    } else if (spaceInputMethod === 'area' && area && height) {
      // Calculate volume from area and height, clear L & W
      const newVolume = (parseFloat(area) * parseFloat(height)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        volume: newVolume,
        cubFt: newVolume,
        sqFt: area,
        length: "",
        width: ""
      }));
    } else if (spaceInputMethod === 'volume' && volume && height) {
      // Calculate area from volume and height, clear L & W
      const newArea = (parseFloat(volume) / parseFloat(height)).toFixed(2);
      setFormData(prev => ({
        ...prev,
        area: newArea,
        sqFt: newArea,
        cubFt: volume,
        length: "",
        width: ""
      }));
    }
  }, [formData.length, formData.width, formData.height, formData.area, formData.volume, spaceInputMethod]);

  // Auto-calculate Room DP and GR/lb when DB, WB, or RH changes
  useEffect(() => {
    const { insideDB, insideRH } = formData;
    
    if (insideDB && insideRH) {
      const dewPoint = calculateDewPoint(parseFloat(insideDB), parseFloat(insideRH));
      const grains = calculateGrainsPerLb(parseFloat(insideDB), parseFloat(insideRH));
      
      if (dewPoint !== null && grains !== null) {
        setFormData(prev => ({
          ...prev,
          insideDP: dewPoint.toFixed(2),
          insideGR: grains.toFixed(2)
        }));
      }
    }
  }, [formData.insideDB, formData.insideRH]);

  // Auto-calculate Difference values
  useEffect(() => {
    const { outsideDB, insideDB, outsideGR, insideGR } = formData;
    
    if (outsideDB && insideDB) {
      const diffDB = (parseFloat(outsideDB) - parseFloat(insideDB)).toFixed(2);
      setFormData(prev => ({ ...prev, diffDB }));
    }
    
    if (outsideGR && insideGR) {
      const diffGR = (parseFloat(outsideGR) - parseFloat(insideGR)).toFixed(2);
      setFormData(prev => ({ ...prev, diffGR }));
    }
  }, [formData.outsideDB, formData.insideDB, formData.outsideGR, formData.insideGR]);

  // Auto calculate Contact Factor
  useEffect(() => {
    if (formData.bypassFactor !== undefined && formData.bypassFactor !== null && formData.bypassFactor !== "") {
      setFormData(prev => ({
        ...prev,
        contactFactor: (1 - parseFloat(prev.bypassFactor)).toFixed(2)
      }));
    }
  }, [formData.bypassFactor]);

  // Auto calculate differences (DB and GR)
  useEffect(() => {
    if (formData.outsideDB && formData.insideDB) {
      const diffDB = (parseFloat(formData.outsideDB) - parseFloat(formData.insideDB)).toFixed(2);
      setFormData(prev => ({ ...prev, diffDB }));
    }
    if (formData.outsideGR && formData.insideGR) {
      const diffGR = (parseFloat(formData.outsideGR) - parseFloat(formData.insideGR)).toFixed(2);
      setFormData(prev => ({ ...prev, diffGR }));
    }
  }, [formData.outsideDB, formData.insideDB, formData.outsideGR, formData.insideGR]);

  // Calculate CFM from people
  useEffect(() => {
    if (formData.numPeople && formData.cfmPerPerson) {
      const totalCfmPeople = (parseFloat(formData.numPeople) * parseFloat(formData.cfmPerPerson)).toFixed(2);
      setFormData(prev => ({ ...prev, totalCfmPeople }));
    }
  }, [formData.numPeople, formData.cfmPerPerson]);

  // Sync numPeople to Internal Heat sections (runs when numPeople changes)
  useEffect(() => {
    const numPeople = formData.numPeople;
    if (numPeople !== undefined && numPeople !== '') {
      setFormData(prev => {
        // Only update if the values are different to avoid infinite loops
        if (prev.numPeopleInternal !== numPeople || prev.numPeopleLatent !== numPeople) {
          return {
            ...prev, 
            numPeopleInternal: numPeople,
            numPeopleLatent: numPeople
          };
        }
        return prev;
      });
    }
  }, [formData.numPeople]);

  // Initial sync on mount or when saved data loads (runs once after data is loaded)
  useEffect(() => {
    if (!loadingSaved && formData.numPeople && !formData.numPeopleInternal) {
      setFormData(prev => ({
        ...prev,
        numPeopleInternal: formData.numPeople,
        numPeopleLatent: formData.numPeople
      }));
    }
  }, [loadingSaved]);

  // Calculate CFM from area
  useEffect(() => {
    if (formData.sqFt && formData.cfmPerSqFt) {
      const totalCfmSqFt = (parseFloat(formData.sqFt) * parseFloat(formData.cfmPerSqFt)).toFixed(2);
      setFormData(prev => ({ ...prev, totalCfmSqFt }));
    }
  }, [formData.sqFt, formData.cfmPerSqFt]);

  // Calculate CFM from volume
  useEffect(() => {
    if (formData.cubFt && formData.acph) {
      const totalCfmCub = (parseFloat(formData.cubFt) * parseFloat(formData.acph) / 60).toFixed(2);
      setFormData(prev => ({ ...prev, totalCfmCub }));
    }
  }, [formData.cubFt, formData.acph]);

  // Calculate total CFM - Use MAX value instead of SUM
  useEffect(() => {
    // Get the maximum value from the three CFM calculations
    const total = Math.max(
      parseFloat(formData.totalCfmPeople || 0),
      parseFloat(formData.totalCfmSqFt || 0),
      parseFloat(formData.totalCfmCub || 0)
    ).toFixed(2);
    setFormData(prev => ({ ...prev, totalCfm: total }));
  }, [formData.totalCfmPeople, formData.totalCfmSqFt, formData.totalCfmCub]);

  // --- Sensible Heat Gains Calculations using Indian HVAC Standards ---
  const computeGlassGain = (item, index) => {
    if (!item) return 0;
    const orientation = IndianHVACCalculations.getOrientations()[index];
    if (!orientation) return 0;
    
    return IndianHVACCalculations.calculateSolarHeatGain(
      orientation,
      parseFloat(item.area || 0),
      item.glassType || 'Ordinary Glass',
      item.shadingType || 'No Shade'
    );
  };

  const computeWallRoofGain = (item, index) => {
    if (!item) return 0;
    
    // Check if this is a wall or roof item
    const orientations = ['North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'];
    
    if (index < orientations.length) {
      // Wall calculation
      const orientation = orientations[index];
      const wallType = item.wallType || '6 inch Brick Wall';
      const wallWeight = item.wallWeight || '60';
      const tempDiff = parseFloat(formData.diffDB || 0);
      
      return IndianHVACCalculations.calculateWallHeatGain(
        parseFloat(item.area || 0),
        wallType,
        orientation,
        wallWeight,
        tempDiff
      );
    } else {
      // Roof calculation (for backward compatibility)
      const area = parseFloat(item?.area || 0);
      const sunGain = parseFloat(item?.sunGain || 0) || 0;
      const uFactor = parseFloat(item?.uFactor || 0) || 0;
      return (area * sunGain * uFactor) || 0;
    }
  };

  const computeTransGain = (item) => {
    const area = parseFloat(item?.area || 0);
    const u = parseFloat(item?.uFactor || 0) || 0;
    // Use diffDB - 5 for partition temperature difference
    const dT = Math.max(0, parseFloat(formData.diffDB || 0) - 5) || 0;
    return (area * u * dT) || 0;
  };

  const totalGlassGain = () => (formData.sunGainGlass || []).reduce((s, it, index) => s + computeGlassGain(it, index), 0);
  const totalWallRoofGain = () => {
    // Wall gains
    const wallGains = (formData.solarGainWalls || []).reduce((s, it, index) => s + computeWallRoofGain(it, index), 0);
    
    // Roof gains
    const roofGains = (formData.roofGains || []).reduce((total, roof) => {
      const roofType = roof?.roofType || 'Concrete Slab 6 inch';
      const sunExposure = roof?.sunExposure || 'Exposed to Sun';
      const roofWeight = roof?.roofWeight || '60';
      const tempDiff = parseFloat(formData.diffDB || 0);
      return total + IndianHVACCalculations.calculateRoofHeatGain(
        parseFloat(roof?.area || 0), roofType, sunExposure, roofWeight, tempDiff
      );
    }, 0);
    
    return wallGains + roofGains;
  };
  const totalTransGain = () => (formData.transGainPartition || []).reduce((s, it) => s + computeTransGain(it), 0);
  const totalSensibleEnvelope = () => totalGlassGain() + totalWallRoofGain() + totalTransGain();

  // Internal heat total
  const totalInternalHeat = () => (
    (parseFloat(formData.numPeople||formData.numPeopleInternal||0) * parseFloat(formData.shPerPerson||0)) +
    ((parseFloat(formData.lightsWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41) +
    ((parseFloat(formData.appliancesWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41) +
    (parseFloat(formData.motorBHP||0) * 2545) +
    (parseFloat(formData.motorHP||0) * 2545)
  );

  // Ventilation CFM (highest value from People, Area, or Volume)
  const ventilationCFM = Math.max(
    parseFloat(formData.totalCfmPeople || 0),
    parseFloat(formData.totalCfmSqFt || 0),
    parseFloat(formData.totalCfmCub || 0)
  );

  // Sensible via air = 1.08 * CFM * ΔT
  const sensibleInfiltrationBTU = 1.08 * parseFloat(formData.cfmInfiltration || 0) * (parseFloat(formData.diffDB || 0) || 0);
  const sensibleVentilationBTU = 1.08 * ventilationCFM * (parseFloat(formData.diffDB || 0) || 0);
  // For ERSH exclude ventilation; ventilation will be accounted in Outside Air section
  const sensibleSubtotal = totalSensibleEnvelope() + totalInternalHeat() + sensibleInfiltrationBTU;
  const ESHT = sensibleSubtotal * (1 + (parseFloat(formData.safetyFactorSensible || 0) / 100));

  // Latent via air = 0.68 * CFM * ΔGrains + people latent
  const latentInfiltrationBTU = 0.68 * parseFloat(formData.cfmInfiltration || 0) * (parseFloat(formData.diffGR || 0) || 0);
  const latentVentilationBTU = 0.68 * ventilationCFM * (parseFloat(formData.diffGR || 0) || 0);
  const latentPeopleBTU = parseFloat(formData.numPeople || 0) * parseFloat(formData.lhPerPerson || 0);
  // For ERLH exclude ventilation; ventilation will be accounted in Outside Air section
  const latentSubtotal = latentInfiltrationBTU + latentPeopleBTU;
  const ELHT = latentSubtotal * (1 + (parseFloat(formData.safetyFactorLatent || 0) / 100));

  const effectiveRoomTotalHeat = ESHT + ELHT;

  // Outside Air Heat (Ventilation Air adjusted by (1 - BF))
  const BF = parseFloat(formData.bypassFactor || 0) || 0;
  const outsideAirSensible = sensibleVentilationBTU * (1 - BF);
  const outsideAirLatent = latentVentilationBTU * (1 - BF);
  const outsideAirTotal = outsideAirSensible + outsideAirLatent;

  // Dehumidified Rise and Dehumidified CFM
  const insideDB = parseFloat(formData.insideDB || 0) || 0;
  const selectedADP = parseFloat(formData.selectedADP || 0) || 0;
  const dehumidifiedRise = (1 - BF) * Math.max(0, insideDB - selectedADP);
  const dehumidifiedCFM = dehumidifiedRise > 0 ? (ESHT / (1.08 * dehumidifiedRise)) : 0;

  // Final Output
  const GTH = effectiveRoomTotalHeat + outsideAirTotal;
  const tonsRequired = GTH / 12000;

  // ==================== ENHANCED CALCULATIONS ====================
  
  // 1. ESHF - Effective Sensible Heat Factor
  const ESHF = effectiveRoomTotalHeat > 0 ? (ESHT / effectiveRoomTotalHeat) : 0;

  // 2. Room SHR - Room Sensible Heat Ratio
  const roomSensibleTotal = totalSensibleEnvelope() + totalInternalHeat() + sensibleInfiltrationBTU;
  const roomLatentTotal = latentInfiltrationBTU + latentPeopleBTU;
  const roomTotalBeforeSafety = roomSensibleTotal + roomLatentTotal;
  const roomSHR = roomTotalBeforeSafety > 0 ? (roomSensibleTotal / roomTotalBeforeSafety) : 0;

  // 3. Grand Sensible and Grand Latent
  const grandSensible = ESHT + outsideAirSensible;
  const grandLatent = ELHT + outsideAirLatent;
  const grandSHR = GTH > 0 ? (grandSensible / GTH) : 0;

  // 4. Coil Load Breakdown
  const coilSensibleLoad = grandSensible;
  const coilLatentLoad = grandLatent;
  const coilTotalLoad = GTH;

  // 5. Supply Air Temperature
  const supplyAirTemp = dehumidifiedCFM > 0 ? (insideDB - (ESHT / (1.08 * dehumidifiedCFM))) : 0;

  // 6. Coil Leaving Air Temperature
  const coilLAT = selectedADP > 0 ? (selectedADP + (BF * (insideDB - selectedADP))) : 0;

  // 7. Return Air CFM
  const returnAirCFM = Math.max(0, dehumidifiedCFM - ventilationCFM);
  const returnAirPercentage = dehumidifiedCFM > 0 ? ((returnAirCFM / dehumidifiedCFM) * 100) : 0;

  // 8. Outside Air Percentage
  const outsideAirPercentage = dehumidifiedCFM > 0 ? ((ventilationCFM / dehumidifiedCFM) * 100) : 0;

  // 9. Temperature Rise Verification
  const actualTempRise = dehumidifiedCFM > 0 ? (ESHT / (1.08 * dehumidifiedCFM)) : 0;

  // 10. CFM per Ton
  const cfmPerTon = tonsRequired > 0 ? (dehumidifiedCFM / tonsRequired) : 0;

  // 11. BTU/hr per CFM
  const btuPerCFM = dehumidifiedCFM > 0 ? (GTH / dehumidifiedCFM) : 0;

  // 12. Mixed Air Temperature
  const mixedAirTemp = dehumidifiedCFM > 0
    ? ((returnAirCFM * insideDB) + (ventilationCFM * parseFloat(formData.outsideDB || 0))) / dehumidifiedCFM
    : 0;

  // 13. Validation Warnings
  const validationWarnings = [];
  
  if (supplyAirTemp < 50 && supplyAirTemp > 0) {
    validationWarnings.push("⚠️ Supply air temp < 50°F - Risk of overcooling");
  }
  if (supplyAirTemp > 60) {
    validationWarnings.push("⚠️ Supply air temp > 60°F - Insufficient cooling");
  }
  if (cfmPerTon < 350 && cfmPerTon > 0) {
    validationWarnings.push("⚠️ CFM/Ton < 350 - High latent load or low airflow");
  }
  if (cfmPerTon > 450) {
    validationWarnings.push("⚠️ CFM/Ton > 450 - Comfort issues possible");
  }
  if (ESHF < 0.65 && ESHF > 0) {
    validationWarnings.push("ℹ️ Low ESHF - High latent load application");
  }
  if (ESHF > 0.95) {
    validationWarnings.push("ℹ️ High ESHF - Very low latent load");
  }
  if (outsideAirPercentage < 15 && outsideAirPercentage > 0) {
    validationWarnings.push("⚠️ Outside Air < 15% - Check ASHRAE 62.1 compliance");
  }

  // Enhanced handlers with space input method detection
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Detect which input method is being used
    if (['length', 'width', 'height'].includes(name) && value) {
      setSpaceInputMethod('dimensions');
    } else if (name === 'area' && value) {
      setSpaceInputMethod('area');
    } else if (name === 'volume' && value) {
      setSpaceInputMethod('volume');
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    setFormData(prev => {
      const newArray = Array.isArray(prev[arrayName]) ? [...prev[arrayName]] : [];
      newArray[index] = { ...(newArray[index] || {}), [field]: value };
      return { ...prev, [arrayName]: newArray };
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert("You must be logged in to save projects.");
      return;
    }
    
    try {
      const projectNumber = projectData?.meta?.projectNumber || projectId;
      if (!projectNumber) {
        alert("Project number is required to save data.");
        return;
      }

      // Calculate totals for summary using existing calculated values
      const calculatedData = {
        ...formData,
        // Use the calculated values from the component
        GTH: GTH.toFixed(2),
        ESHT: ESHT.toFixed(2),
        ELHT: ELHT.toFixed(2),
        tons: tonsRequired.toFixed(2),
        supplyCFM: dehumidifiedCFM.toFixed(2),
        freshAirCFM: ventilationCFM.toFixed(2),
        
        // Enhanced calculations
        ESHF: ESHF.toFixed(3),
        roomSHR: roomSHR.toFixed(3),
        grandSHR: grandSHR.toFixed(3),
        grandSensible: grandSensible.toFixed(2),
        grandLatent: grandLatent.toFixed(2),
        coilSensibleLoad: coilSensibleLoad.toFixed(2),
        coilLatentLoad: coilLatentLoad.toFixed(2),
        coilTotalLoad: coilTotalLoad.toFixed(2),
        supplyAirTemp: supplyAirTemp.toFixed(2),
        coilLAT: coilLAT.toFixed(2),
        returnAirCFM: returnAirCFM.toFixed(2),
        returnAirPercentage: returnAirPercentage.toFixed(1),
        outsideAirPercentage: outsideAirPercentage.toFixed(1),
        cfmPerTon: cfmPerTon.toFixed(0),
        btuPerCFM: btuPerCFM.toFixed(2),
        actualTempRise: actualTempRise.toFixed(2),
        mixedAirTemp: mixedAirTemp.toFixed(2),
        validationWarnings: validationWarnings,
        
        // Add heat load data structure for room card integration
        heatLoadData: {
          area: parseFloat(formData.area) || 0,
          tonnage: tonsRequired,
          totalCfm: dehumidifiedCFM,
          sensibleHeat: ESHT, // Use actual ESHT, not approximation
          latentHeat: ELHT,   // Use actual ELHT
          totalHeat: GTH,
          calculated: true,
          timestamp: new Date().toISOString(),
          // Add enhanced parameters
          ESHF: parseFloat(ESHF.toFixed(3)),
          supplyAirTemp: parseFloat(supplyAirTemp.toFixed(2)),
          cfmPerTon: parseFloat(cfmPerTon.toFixed(0))
        },
        // Metadata
        savedAt: new Date().toISOString(),
        userId: user.uid,
        userEmail: user.email
      };

      // Get existing project data
      const projectRef = ref(db, `projects/${projectNumber}`);
      const snapshot = await get(projectRef);
      
      if (snapshot.exists()) {
        // Update existing project with space data
        const existingData = snapshot.val();
        await update(projectRef, {
          spaceData: calculatedData,
          meta: {
            ...existingData.meta,
            savedAt: new Date().toISOString()
          }
        });
      } else {
        // Create new project structure if it doesn't exist
        await set(projectRef, {
          meta: {
            projectNumber,
            savedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            userId: user.uid,
            userEmail: user.email
          },
          spaceData: calculatedData
        });
      }
      
      if (onSave) onSave(calculatedData);
      
      // If this is a room calculation, call the room completion callback
      if (roomData && roomData.onCalculationComplete) {
        const roomCalculationData = {
          floorId: roomData.floorId,
          roomId: roomData.roomId,
          roomName: roomData.roomName || 'Room',
          roomType: roomData.roomType || 'General',
          floorName: roomData.floorName || 'Floor',
          
          // Calculated values
          GTH: parseFloat(GTH.toFixed(2)),
          ESHT: parseFloat(ESHT.toFixed(2)),
          ELHT: parseFloat(ELHT.toFixed(2)),
          tons: parseFloat(tonsRequired.toFixed(2)),
          supplyCFM: parseFloat(dehumidifiedCFM.toFixed(2)),
          freshAirCFM: parseFloat(ventilationCFM.toFixed(2)),
          area: parseFloat(formData.area) || 0,
          
          // Complete form data for viewing later
          formData: calculatedData,
          
          // Structured heat load data for equipment selection
          heatLoadData: {
            area: parseFloat(formData.area) || 0,
            tonnage: parseFloat(tonsRequired.toFixed(2)),
            totalCfm: parseFloat(dehumidifiedCFM.toFixed(2)),
            sensibleHeat: parseFloat(ESHT.toFixed(2)),
            latentHeat: parseFloat(ELHT.toFixed(2)),
            totalHeat: parseFloat(GTH.toFixed(2)),
            outsideAirCfm: parseFloat(ventilationCFM.toFixed(2)),
            diversity: 85,
            calculated: true,
            calculatedOn: new Date().toISOString()
          },
          
          // Breakdown for detailed view
          breakdown: {
            sensibleGlass: totalGlassGain(),
            sensibleWalls: totalWallRoofGain(),
            sensiblePartitions: totalTransGain(),
            internalHeat: totalInternalHeat(),
            sensibleInfiltration: sensibleInfiltrationBTU,
            sensibleVentilation: sensibleVentilationBTU,
            latentInfiltration: latentInfiltrationBTU,
            latentVentilation: latentVentilationBTU,
            latentPeople: latentPeopleBTU,
            outsideAirSensible: outsideAirSensible,
            outsideAirLatent: outsideAirLatent
          }
        };
        
        console.log('✅ Calling room calculation complete callback:', roomCalculationData);
        roomData.onCalculationComplete(roomCalculationData);
      }
      
      setHasSaved(true);
      setIsEditing(false);
      
      // Show success toast with calculated results
      toast.success(`Heat Load Calculation Saved! 📊 Total: ${GTH.toFixed(0)} BTU/hr | Tonnage: ${tonsRequired.toFixed(2)} TR | CFM: ${dehumidifiedCFM.toFixed(0)}`);
    } catch (err) {
      console.error("Firebase save error:", err);
      toast.error("Error saving calculation. Please try again.");
    }
  };

  // --- Compact Calculated CFM Infiltration (collapsible) ---
  const [windVelocity, setWindVelocity] = useState(15);
  const [infiltrationItems, setInfiltrationItems] = useState([
    { kind: 'Window', type: '', crackLength: '', quantity: 1 },
  ]);

  // Raw tables to get CFM/ft by velocity (mph)
  const cfmTables = {
    doubleHung: {
      woodSash: {
        averageWindow: [0.12, 0.35, 0.65, 0.98, 1.33, 1.73],
        averageWindowWithStrip: [0.07, 0.22, 0.40, 0.60, 0.82, 1.05],
        poorlyFittedWindow: [0.45, 1.16, 2.55, 2.60, 3.30, 4.20],
        poorlyFittedWindowWithStrip: [0.10, 0.32, 0.57, 0.85, 1.18, 1.53],
        poorlyFittedWithStormSash: [0.23, 0.57, 0.93, 1.30, 1.60, 2.10],
        poorlyFittedWithStormSashWithStrip: [0.05, 0.16, 0.29, 0.43, 0.59, 0.76],
        metalSash: [0.33, 0.78, 1.23, 1.73, 2.23, 2.80],
        metalSashWithStrip: [0.10, 0.32, 0.63, 0.77, 1.00, 1.27]
      }
    },
    casement: {
      rolledSectionSteelSash: {
        industrialPivoted: [1.07, 1.80, 2.9, 4.1, 5.1, 6.2],
        architecturalProjected: [0.62, 1.03, 1.43, 1.86, 2.3, 2.7],
        architecturalProjectedHeavy: [0.84, 1.47, 1.93, 2.5, 3.0, 3.5],
        residentialCasement: [0.35, 0.50, 0.75, 0.90, 1.23, 1.40],
        residentialCasementHeavy: [0.67, 1.17, 1.71, 2.10, 2.67, 3.20],
        heavyCasementSectionProjected: [0.48, 0.87, 1.21, 1.62, 1.96, 2.40],
        heavyCasementSectionProjectedWeatherStripped: [0.14, 0.24, 0.31, 0.38, 0.48, 0.57],
        heavyMetalVentilatorPivoted: [0.46, 0.82, 1.12, 1.42, 1.78, 2.10]
      }
    },
    doors: {
      glassDoorsHermetic: {
        goodInstallation: [3.2, 6.4, 9.6, 13.0, 16.0, 19.0],
        averageInstallation: [4.8, 10.0, 14.0, 20.0, 24.0, 29.0],
        poorInstallation: [6.4, 13.0, 19.0, 26.0, 32.0, 38.0]
      },
      ordinaryWoodOrMetal: {
        wellFittedWithStrip: [0.45, 0.90, 1.30, 1.70, 2.10, 2.50],
        wellFittedNoStrip: [0.90, 1.80, 2.60, 3.30, 4.20, 5.00],
        poorlyFittedNoStrip: [1.90, 3.70, 5.20, 6.60, 8.40, 10.00]
      },
      factoryDoor: [3.2, 6.4, 9.6, 13.0, 16.0, 19.0]
    }
  };

  const getCfmPerFt = (path) => {
    if (!path) return 0;
    try {
      const parts = path.split('.');
      let v = cfmTables;
      for (const p of parts) v = v[p];
      const idx = windVelocities.indexOf(parseInt(windVelocity));
      return idx >= 0 ? (v[idx] || 0) : 0;
    } catch {
      return 0;
    }
  };

  const calcInfiltrationCFM = () =>
    infiltrationItems.reduce((sum, it) => {
      const cfmFt = getCfmPerFt(it.type);
      const crack = parseFloat(it.crackLength || 0);
      const qty = parseFloat(it.quantity || 0);
      return sum + cfmFt * crack * qty;
    }, 0);

  const addInfItem = () => setInfiltrationItems((arr) => [...arr, { kind: 'Window', type: '', crackLength: '', quantity: 1 }]);
  const removeInfItem = (i) => setInfiltrationItems((arr) => arr.filter((_, idx) => idx !== i));
  const updateInfItem = (i, field, value) => setInfiltrationItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [field]: value } : it));

  const reloadSaved = async () => {
    const projectNumber = projectData?.meta?.projectNumber || projectId;
    if (!projectNumber) return;
    try {
      setLoadingSaved(true);
      const snap = await get(ref(db, `projects/${projectNumber}/spaceData`));
      if (snap.exists()) {
        setFormData(prev => ({ ...prev, ...snap.val() }));
        setHasSaved(true);
        setIsEditing(false);
      }
    } finally {
      setLoadingSaved(false);
    }
  };


  return (
    <div className="form-page">
      <div className="form-card">
        <header>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <h2>Space Considered & Heat Load Calculation</h2>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              {loadingSaved ? (
                <span style={{color:'#64748b', fontSize:12}}>Loading saved…</span>
              ) : hasSaved && !isEditing ? (
                <>
                  <span style={{color:'#16a34a', fontSize:12}}>Saved</span>
                  <button type="button" className="calculate-button" onClick={()=>setIsEditing(true)}>Edit</button>
                </>
              ) : null}
            </div>
          </div>
        </header>
        <div className="form-body">
          
          {/* Multi-Floor Building Management */}
         
          <form onSubmit={handleSubmit}>
          <fieldset disabled={!isEditing} style={{border:'none', padding:0, margin:0}}>
          {/* Project Info */}
          <div className="form-section">
            <h3>Project Information</h3>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Name of Project</label>
                <input type="text" value={projectData?.meta?.projectName || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Project Number</label>
                <input type="text" value={projectData?.meta?.projectNumber || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={projectData?.meta?.address || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Estimated by</label>
                <input type="text" value={projectData?.meta?.estimatedBy || ""} readOnly />
              </div>
              {/* <div className="form-group">
                <label>Space Considered</label>
                <input type="text" value={projectData?.meta?.spaceConsidered || ""} readOnly />
              </div> */}
              <div className="form-group">
                <label>Heat load for</label>
                <input type="text" value={projectData?.meta?.heatLoadFor || ""} readOnly />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input type="text" value={projectData?.meta?.floor || ""} readOnly />
              </div>
            </div>
          </div>

          {/* Space Dimensions */}
          <div className="form-section">
            <h3>Space Dimensions</h3>
            <div className="space-dimensions-container">
              <div className="dimensions-input-method">
                <div className="method-selector">
                  <label className="method-option">
                    <input 
                      type="radio" 
                      name="inputMethod" 
                      value="dimensions"
                      checked={spaceInputMethod === 'dimensions'}
                      onChange={(e) => setSpaceInputMethod(e.target.value)}
                    />
                    <span>Calculate from L × W × H</span>
                  </label>
                  <label className="method-option">
                    <input 
                      type="radio" 
                      name="inputMethod" 
                      value="area"
                      checked={spaceInputMethod === 'area'}
                      onChange={(e) => setSpaceInputMethod(e.target.value)}
                    />
                    <span>Enter Area directly</span>
                  </label>
                  <label className="method-option">
                    <input 
                      type="radio" 
                      name="inputMethod" 
                      value="volume"
                      checked={spaceInputMethod === 'volume'}
                      onChange={(e) => setSpaceInputMethod(e.target.value)}
                    />
                    <span>Enter Volume directly</span>
                  </label>
                </div>
              </div>

              <div className="dimensions-grid">
                {spaceInputMethod === 'dimensions' && (
                  <>
                    <div className="form-group">
                      <label>L (Ft.)</label>
                      <input
                        type="number"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Length"
                      />
                    </div>
                    <div className="form-group">
                      <label>W (Ft.)</label>
                      <input
                        type="number"
                        name="width"
                        value={formData.width}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Width"
                      />
                    </div>
                    <div className="form-group">
                      <label>H (Ft.)</label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Height"
                      />
                    </div>
                  </>
                )}

                {spaceInputMethod === 'area' && (
                  <>
                    <div className="form-group">
                      <label>Area (Sq.Ft.)</label>
                      <input
                        type="number"
                        name="area"
                        value={formData.area}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Area"
                      />
                    </div>
                    <div className="form-group">
                      <label>H (Ft.)</label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Height"
                      />
                    </div>
                  </>
                )}

                {spaceInputMethod === 'volume' && (
                  <>
                    <div className="form-group">
                      <label>Volume (Cu.Ft.)</label>
                      <input
                        type="number"
                        name="volume"
                        value={formData.volume}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Volume"
                      />
                    </div>
                    <div className="form-group">
                      <label>H (Ft.)</label>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        step="0.01"
                        placeholder="Height"
                      />
                    </div>
                  </>
                )}

                {/* Calculated Results */}
                <div className="calculated-results">
                  <div className="form-group">
                    <label>Area</label>
                    <input
                      type="number"
                      value={formData.area}
                      readOnly
                      className="calculated-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Volume</label>
                    <input
                      type="number"
                      value={formData.volume}
                      readOnly
                      className="calculated-field"
                    />
                  </div>
                </div>

                {/* Bypass Factor and Contact Factor */}
                <div className="factors-section">
                  <div className="form-group">
                    <label>By Pass Factor</label>
                    <input
                      type="number"
                      name="bypassFactor"
                      value={formData.bypassFactor}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Contact Factor</label>
                    <input
                      type="number"
                      name="contactFactor"
                      value={formData.contactFactor}
                      readOnly
                      className="calculated-field"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Design Conditions */}
          <div className="form-section">
            <h3>Design Conditions</h3>
            <div className="conditions-grid-table">
              <div className="conditions-header">
                <div>Conditions</div>
                <div>DB (Deg. F)</div>
                <div>WB (Deg. F)</div>
                <div>% RH</div>
                <div>DP</div>
                <div>GR/lb</div>
              </div>
              <div className="conditions-row">
                <div>Outside</div>
                <div>{formData.outsideDB}</div>
                <div>{formData.outsideWB}</div>
                <div>{formData.outsideRH}</div>
                <div>{formData.outsideDP}</div>
                <div>{formData.outsideGR}</div>
              </div>
              <div className="conditions-row editable-row">
                <div>Room</div>
                <div>
                  <input
                    type="number"
                    name="insideDB"
                    value={formData.insideDB}
                    onChange={handleChange}
                    placeholder="Enter DB"
                    step="0.1"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="insideWB"
                    value={formData.insideWB}
                    onChange={handleChange}
                    placeholder="Enter WB"
                    step="0.1"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="insideRH"
                    value={formData.insideRH}
                    onChange={handleChange}
                    placeholder="Enter RH"
                    step="1"
                  />
                </div>
                <div>{formData.insideDP}</div>
                <div>{formData.insideGR}</div>
              </div>
              <div className="conditions-row">
                <div>Difference</div>
                <div>{formData.diffDB}</div>
                <div></div>
                <div></div>
                <div></div>
                <div>{formData.diffGR}</div>
              </div>
            </div>
          </div>

          {/* CFM Ventilation */}
          <div className="form-section">
            <h3>CFM Ventilation</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label>No. of People</label>
                <input
                  type="number"
                  name="numPeople"
                  value={formData.numPeople}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>CFM/person</label>
                <input
                  type="number"
                  name="cfmPerPerson"
                  value={formData.cfmPerPerson}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Total CFM (People)</label>
                <input
                  type="number"
                  name="totalCfmPeople"
                  value={formData.totalCfmPeople}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Sq. Ft</label>
                <input
                  type="number"
                  name="sqFt"
                  value={formData.sqFt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>CFM/Sq.Ft.</label>
                <input
                  type="number"
                  name="cfmPerSqFt"
                  value={formData.cfmPerSqFt}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Total CFM (Area)</label>
                <input
                  type="number"
                  name="totalCfmSqFt"
                  value={formData.totalCfmSqFt}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Cub. Ft.</label>
                <input
                  type="number"
                  name="cubFt"
                  value={formData.cubFt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>ACPH</label>
                <input
                  type="number"
                  name="acph"
                  value={formData.acph}
                  onChange={handleChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Total CFM (Volume)</label>
                <input
                  type="number"
                  name="totalCfmCub"
                  value={formData.totalCfmCub}
                  readOnly
                />
              </div>
              <div className="form-group full-width">
                <label>CFM Infiltration</label>
                <input
                  type="number"
                  name="cfmInfiltration"
                  value={formData.cfmInfiltration}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Total CFM Ventilation</label>
                <input
                  type="number"
                  name="totalCfm"
                  value={formData.totalCfm}
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Calculated CFM Infiltration (Optional) */}
          <div className="form-section">
            <details>
              <summary>Calculated CFM Infiltration (optional)</summary>
              <div className="subsection">
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Wind Velocity (mph)</label>
                    <select value={windVelocity} onChange={(e)=>setWindVelocity(parseInt(e.target.value))}>
                      {windVelocities.map(v=> <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Calculated Total (CFM)</label>
                    <input type="number" readOnly value={calcInfiltrationCFM().toFixed(2)} />
                  </div>
                  <div className="form-group">
                    <label>Apply to CFM Infiltration</label>
                    <button type="button" className="calculate-button" onClick={()=>handleChange({ target: { name:'cfmInfiltration', value: calcInfiltrationCFM().toFixed(2) }})}>Apply</button>
                  </div>
                </div>

                <div className="infiltration-list">
                  {infiltrationItems.map((it, i)=> (
                    <div className="form-grid-3" key={i}>
                      <div className="form-group">
                        <label>Type</label>
                        <input list={`inf-types-${i}`} value={it.type} onChange={(e)=>updateInfItem(i,'type', e.target.value)} placeholder="Start typing..." />
                        <datalist id={`inf-types-${i}`}>
                          {Object.entries(infiltrationData.windows).map(([label, value])=> (
                            <option key={`w-${value}`} value={value}>{label}</option>
                          ))}
                          {Object.entries(infiltrationData.doors).map(([label, value])=> (
                            <option key={`d-${value}`} value={value}>{label}</option>
                          ))}
                        </datalist>
                        <small className="hint">CFM/ft: {getCfmPerFt(it.type).toFixed(2)}</small>
                      </div>
                      <div className="form-group">
                        <label>Crack Length (ft)</label>
                        <input type="number" step="0.01" value={it.crackLength} onChange={(e)=>updateInfItem(i,'crackLength', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <div className="inline-with-action">
                          <input type="number" min="1" value={it.quantity} onChange={(e)=>updateInfItem(i,'quantity', e.target.value)} />
                          <button type="button" className="remove-button" onClick={()=>removeInfItem(i)}>×</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="add-button" onClick={addInfItem}>+ Add Item</button>
                </div>
              </div>
            </details>
          </div>

          {/* Sensible Heat Gains */}
          <div className="form-section">
            <h3>Sensible Heat Gains</h3>

            {/* 1. Sun Gain Glass: Direct Exposure - Indian Standards */}
            <div className="subsection">
              <h4>1. Sun Gain Glass: Direct Exposure (Indian Standards - 20° Latitude, May)</h4>
              <div className="table-grid-8 glass-heat-gain-table">
                <div className="table-header">Orientation</div>
                <div className="table-header">Area (Sq.ft.)</div>
                <div className="table-header">Glass Type</div>
                <div className="table-header">Shading</div>
                <div className="table-header">Solar Gain (BTU/hr·ft²)</div>
                <div className="table-header">Sun Gain</div>
                <div className="table-header">U Factor</div>
                <div className="table-header">Total BTU/hr</div>
                {IndianHVACCalculations.getOrientations().map((orientation, i) => {
                  const glassItem = formData.sunGainGlass[i] || {};
                  const solarGainValue = IndianHVACCalculations.getSolarGainForOrientation(orientation);
                  const shadingFactor = IndianHVACCalculations.shadingFactors[glassItem.shadingType || 'No Shade'] || 1.00;
                  const glassInfo = IndianHVACCalculations.glassTypes[glassItem.glassType || 'Ordinary Glass'] || { uFactor: 1.00 };
                  const calculatedGain = IndianHVACCalculations.calculateSolarHeatGain(
                    orientation,
                    parseFloat(glassItem.area || 0),
                    glassItem.glassType || 'Ordinary Glass',
                    glassItem.shadingType || 'No Shade'
                  );
                  
                  return (
                    <React.Fragment key={i}>
                      <div className="table-cell"><strong>{orientation}</strong></div>
                      <div className="table-cell">
                        <input type="number" step="0.01"
                          value={glassItem.area || ""}
                          onChange={(e)=>handleArrayChange('sunGainGlass', i, 'area', e.target.value)}
                          placeholder="Area" />
                      </div>
                      <div className="table-cell">
                        <select
                          value={glassItem.glassType || 'Ordinary Glass'}
                          onChange={(e)=>handleArrayChange('sunGainGlass', i, 'glassType', e.target.value)}
                        >
                          {IndianHVACCalculations.getGlassTypes().map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <select
                          value={glassItem.shadingType || 'No Shade'}
                          onChange={(e)=>handleArrayChange('sunGainGlass', i, 'shadingType', e.target.value)}
                        >
                          {IndianHVACCalculations.getShadingTypes().map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{solarGainValue}</span>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{shadingFactor.toFixed(2)}</span>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{glassInfo.uFactor.toFixed(2)}</span>
                      </div>
                      <div className="table-cell">
                        <input type="number" readOnly
                          value={calculatedGain.toFixed(2)}
                          className="calculated-field" />
                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="table-footer" style={{gridColumn: '1 / 8'}}><strong>Total Solar Heat Gain</strong></div>
                <div className="table-footer"><strong>{totalGlassGain().toFixed(2)} BTU/hr</strong></div>
              </div>
            </div>

            {/* 2. Wall Heat Gain - Indian Standards with ETD */}
            <div className="subsection">
              <h4>2. Wall Heat Gain (Indian Standards with ETD)</h4>
              <div className="table-grid-8 wall-heat-gain-table">
                <div className="table-header">Orientation</div>
                <div className="table-header">Area (Sq.ft.)</div>
                <div className="table-header">Wall Type</div>
                <div className="table-header">Wall Weight (lbs/ft²)</div>
                <div className="table-header">ETD (°F)</div>
                <div className="table-header">Sun Gain</div>
                <div className="table-header">U-Factor</div>
                <div className="table-header">Heat Gain (BTU/hr)</div>
                {[
                  'North', 'North East', 'East', 'South East', 'South', 'South West', 'West', 'North West'
                ].map((orientation, i) => {
                  const wallItem = formData.solarGainWalls[i] || {};
                  const wallWeight = wallItem.wallWeight || '60';
                  const wallType = wallItem.wallType || '6 inch Brick Wall';
                  const etdValue = IndianHVACCalculations.getWallETD(orientation, wallWeight);
                  const uFactor = IndianHVACCalculations.wallUFactors[wallType] || 0.58;
                  const tempDiff = parseFloat(formData.diffDB || 0);
                  const heatGain = IndianHVACCalculations.calculateWallHeatGain(
                    parseFloat(wallItem.area || 0),
                    wallType,
                    orientation,
                    wallWeight,
                    tempDiff
                  );
                  
                  return (
                    <React.Fragment key={i}>
                      <div className="table-cell"><strong>{orientation}</strong></div>
                      <div className="table-cell">
                        <input type="number" step="0.01"
                          value={wallItem.area || ""}
                          onChange={(e)=>handleArrayChange('solarGainWalls', i, 'area', e.target.value)}
                          placeholder="Area" />
                      </div>
                      <div className="table-cell">
                        <select
                          value={wallType}
                          onChange={(e)=>handleArrayChange('solarGainWalls', i, 'wallType', e.target.value)}
                        >
                          {IndianHVACCalculations.getWallTypes().map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <select
                          value={wallWeight}
                          onChange={(e)=>handleArrayChange('solarGainWalls', i, 'wallWeight', e.target.value)}
                        >
                          {IndianHVACCalculations.getWallWeights().map(weight => (
                            <option key={weight} value={weight}>{weight} lbs/ft²</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{etdValue}</span>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">1.00</span>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{uFactor.toFixed(2)}</span>
                      </div>
                      <div className="table-cell">
                        <input type="number" readOnly
                          value={heatGain.toFixed(2)}
                          className="calculated-field" />
                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="table-footer" style={{gridColumn: '1 / 8'}}><strong>Total Wall Heat Gain</strong></div>
                <div className="table-footer"><strong>{totalWallRoofGain().toFixed(2)} BTU/hr</strong></div>
              </div>
            </div>

            {/* 3. Roof Heat Gain - Indian Standards with ETD */}
            <div className="subsection">
              <h4>3. Roof Heat Gain (Indian Standards with ETD)</h4>
              <div className="table-grid-6">
                <div className="table-header">Roof Type</div>
                <div className="table-header">Area (Sq.ft.)</div>
                <div className="table-header">Sun Exposure</div>
                <div className="table-header">Roof Weight (lbs/ft²)</div>
                <div className="table-header">ETD (°F)</div>
                <div className="table-header">Heat Gain (BTU/hr)</div>
                {[
                  'Main Roof', 'Shed Roof', 'Canopy'
                ].map((roofName, i) => {
                  const roofItem = formData.roofGains?.[i] || {};
                  const roofType = roofItem.roofType || 'Concrete Slab 6 inch';
                  const sunExposure = roofItem.sunExposure || 'Exposed to Sun';
                  const roofWeight = roofItem.roofWeight || '60';
                  const etdValue = IndianHVACCalculations.getRoofETD(sunExposure, roofWeight);
                  const tempDiff = parseFloat(formData.diffDB || 0);
                  const heatGain = IndianHVACCalculations.calculateRoofHeatGain(
                    parseFloat(roofItem.area || 0),
                    roofType,
                    sunExposure,
                    roofWeight,
                    tempDiff
                  );
                  
                  return (
                    <React.Fragment key={i}>
                      <div className="table-cell"><strong>{roofName}</strong></div>
                      <div className="table-cell">
                        <input type="number" step="0.01"
                          value={roofItem.area || ""}
                          onChange={(e)=>{
                            const newRoofGains = [...(formData.roofGains || [])];
                            newRoofGains[i] = {...newRoofGains[i], area: e.target.value};
                            setFormData(prev => ({...prev, roofGains: newRoofGains}));
                          }}
                          placeholder="Area" />
                      </div>
                      <div className="table-cell">
                        <select
                          value={sunExposure}
                          onChange={(e)=>{
                            const newRoofGains = [...(formData.roofGains || [])];
                            newRoofGains[i] = {...newRoofGains[i], sunExposure: e.target.value};
                            setFormData(prev => ({...prev, roofGains: newRoofGains}));
                          }}
                        >
                          {IndianHVACCalculations.getSunExposureOptions().map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <select
                          value={roofWeight}
                          onChange={(e)=>{
                            const newRoofGains = [...(formData.roofGains || [])];
                            newRoofGains[i] = {...newRoofGains[i], roofWeight: e.target.value};
                            setFormData(prev => ({...prev, roofGains: newRoofGains}));
                          }}
                        >
                          {IndianHVACCalculations.getRoofWeights().map(weight => (
                            <option key={weight} value={weight}>{weight} lbs/ft²</option>
                          ))}
                        </select>
                      </div>
                      <div className="table-cell">
                        <span className="readonly-value">{etdValue}</span>
                      </div>
                      <div className="table-cell">
                        <input type="number" readOnly
                          value={heatGain.toFixed(2)}
                          className="calculated-field" />
                      </div>
                    </React.Fragment>
                  );
                })}
                <div className="table-footer" style={{gridColumn: '1 / 6'}}><strong>Total Roof Heat Gain</strong></div>
                <div className="table-footer"><strong>{(formData.roofGains || []).reduce((total, roof) => {
                  const roofType = roof?.roofType || 'Concrete Slab 6 inch';
                  const sunExposure = roof?.sunExposure || 'Exposed to Sun';
                  const roofWeight = roof?.roofWeight || '60';
                  const tempDiff = parseFloat(formData.diffDB || 0);
                  return total + IndianHVACCalculations.calculateRoofHeatGain(
                    parseFloat(roof?.area || 0), roofType, sunExposure, roofWeight, tempDiff
                  );
                }, 0).toFixed(2)} BTU/hr</strong></div>
              </div>
            </div>

            {/* 3. Trans Gain through Partition */}
            <div className="subsection">
              <h4>3. Trans Gain through Partition</h4>
              <div className="table-grid-5">
                <div className="table-header">Partition</div>
                <div className="table-header">Area (Sq.ft.)</div>
                <div className="table-header">ΔT (Deg.F)</div>
                <div className="table-header">U Factor</div>
                <div className="table-header">BTU/hr</div>
                {[
                  'Outside Walls','Partition Walls','Other Partition','Ceiling','Floor','Roof'
                ].map((label, i)=> (
                  <React.Fragment key={i}>
                    <div className="table-cell">{label}</div>
                    <div className="table-cell">
                      <input type="number" step="0.01"
                        value={formData.transGainPartition[i]?.area || ""}
                        onChange={(e)=>handleArrayChange('transGainPartition', i, 'area', e.target.value)} />
                    </div>
                    <div className="table-cell">
                      <input type="number" step="0.01" readOnly
                        value={(Math.max(0, parseFloat(formData.diffDB || 0) - 5)).toFixed(2)}
                        title="Auto-calculated as Design Condition Difference - 5" />
                    </div>
                    <div className="table-cell">
                      <input type="number" step="0.01"
                        value={formData.transGainPartition[i]?.uFactor || ""}
                        onChange={(e)=>handleArrayChange('transGainPartition', i, 'uFactor', e.target.value)} />
                    </div>
                    <div className="table-cell">
                      <input type="number" readOnly
                        value={computeTransGain(formData.transGainPartition[i]).toFixed(2)} />
                    </div>
                  </React.Fragment>
                ))}
                <div className="table-footer">Total</div>
                <div className="table-footer"></div>
                <div className="table-footer"></div>
                <div className="table-footer"></div>
                <div className="table-footer">{totalTransGain().toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* CFM Ventilation */}
          {/* <div className="form-section">
            <h3>CFM Ventilation</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label>No. of People</label>
                <input
                  type="number"
                  name="numPeople"
                  value={formData.numPeople}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>CFM/person</label>
                <input
                  type="number"
                  name="cfmPerPerson"
                  value={formData.cfmPerPerson}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Total CFM (People)</label>
                <input
                  type="number"
                  name="totalCfmPeople"
                  value={formData.totalCfmPeople}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Sq. Ft</label>
                <input
                  type="number"
                  name="sqFt"
                  value={formData.sqFt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>CFM/Sq.Ft.</label>
                <input
                  type="number"
                  name="cfmPerSqFt"
                  value={formData.cfmPerSqFt}
                  onChange={handleChange}
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Total CFM (Area)</label>
                <input
                  type="number"
                  name="totalCfmSqFt"
                  value={formData.totalCfmSqFt}
                  readOnly
                />
              </div>
              <div className="form-group">
                <label>Cub. Ft.</label>
                <input
                  type="number"
                  name="cubFt"
                  value={formData.cubFt}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>ACPH</label>
                <input
                  type="number"
                  name="acph"
                  value={formData.acph}
                  onChange={handleChange}
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Total CFM (Volume)</label>
                <input
                  type="number"
                  name="totalCfmCub"
                  value={formData.totalCfmCub}
                  readOnly
                />
              </div>
              <div className="form-group full-width">
                <label>CFM Infiltration</label>
                <input
                  type="number"
                  name="cfmInfiltration"
                  value={formData.cfmInfiltration}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group full-width">
                <label>Total CFM Ventilation</label>
                <input
                  type="number"
                  name="totalCfm"
                  value={formData.totalCfm}
                  readOnly
                />
              </div>
            </div>
          </div> */}

          {/* Internal Heat */}
          <div className="form-section">
            <h3>Internal Heat</h3>
            <div className="subsection">
              <div className="table-grid-6">
                <div className="table-header">Source</div>
                <div className="table-header">Value</div>
                <div className="table-header">Unit</div>
                <div className="table-header">Area (Sq.ft.)</div>
                <div className="table-header">Factor</div>
                <div className="table-header">BTU/hr</div>

                {/* People (Sensible Heat per person) */}
                <div className="table-cell">People (Sensible)</div>
                <div className="table-cell"><input type="number" name="numPeopleInternal" value={formData.numPeople || formData.numPeopleInternal || ''} readOnly title="Auto-populated from CFM Ventilation" style={{backgroundColor: '#f0f0f0'}} /></div>
                <div className="table-cell">Persons × SH/Person</div>
                <div className="table-cell">—</div>
                <div className="table-cell"><input type="number" name="shPerPerson" step="0.01" value={formData.shPerPerson || ''} onChange={handleChange} /></div>
                <div className="table-cell">
                  <input type="number" readOnly value={(parseFloat(formData.numPeople||formData.numPeopleInternal||0) * parseFloat(formData.shPerPerson||0)).toFixed(2)} />
                </div>

                {/* Lighting */}
                <div className="table-cell">Lighting</div>
                <div className="table-cell"><input type="number" name="lightsWatts" step="0.01" value={formData.lightsWatts} onChange={handleChange} /></div>
                <div className="table-cell">Watts/Sq.ft</div>
                <div className="table-cell"><input type="number" readOnly value={parseFloat(formData.sqFt||formData.area||0)} /></div>
                <div className="table-cell">3.41 BTU/W</div>
                <div className="table-cell">
                  <input type="number" readOnly value={((parseFloat(formData.lightsWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41).toFixed(2)} />
                </div>

                {/* Appliances */}
                <div className="table-cell">Appliances</div>
                <div className="table-cell"><input type="number" name="appliancesWatts" step="0.01" value={formData.appliancesWatts} onChange={handleChange} /></div>
                <div className="table-cell">Watts/Sq.ft</div>
                <div className="table-cell"><input type="number" readOnly value={parseFloat(formData.sqFt||formData.area||0)} /></div>
                <div className="table-cell">3.41 BTU/W</div>
                <div className="table-cell">
                  <input type="number" readOnly value={((parseFloat(formData.appliancesWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41).toFixed(2)} />
                </div>

                {/* Motors (BHP) */}
                <div className="table-cell">Motor (BHP)</div>
                <div className="table-cell"><input type="number" name="motorBHP" step="0.01" value={formData.motorBHP} onChange={handleChange} /></div>
                <div className="table-cell">BHP × 2545</div>
                <div className="table-cell">—</div>
                <div className="table-cell">—</div>
                <div className="table-cell">
                  <input type="number" readOnly value={(parseFloat(formData.motorBHP||0) * 2545).toFixed(2)} />
                </div>

                {/* Motors (HP) */}
                <div className="table-cell">Motor (HP)</div>
                <div className="table-cell"><input type="number" name="motorHP" step="0.01" value={formData.motorHP} onChange={handleChange} /></div>
                <div className="table-cell">HP × 2545</div>
                <div className="table-cell">—</div>
                <div className="table-cell">—</div>
                <div className="table-cell">
                  <input type="number" readOnly value={(parseFloat(formData.motorHP||0) * 2545).toFixed(2)} />
                </div>

                {/* Section total */}
                <div className="table-footer">Total Internal Heat</div>
                <div className="table-footer"></div>
                <div className="table-footer"></div>
                <div className="table-footer"></div>
                <div className="table-footer"></div>
                <div className="table-footer">
                  {(
                    (parseFloat(formData.numPeople||0) * parseFloat(formData.shPerPerson||0)) +
                    ((parseFloat(formData.lightsWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41) +
                    ((parseFloat(formData.appliancesWatts||0) * parseFloat(formData.sqFt||formData.area||0)) * 3.41) +
                    (parseFloat(formData.motorBHP||0) * 2545) +
                    (parseFloat(formData.motorHP||0) * 2545)
                  ).toFixed(2)} BTU/hr
                </div>
              </div>
            </div>
          </div>

          {/* 5. Infiltration & Bypass Air */}
          <div className="form-section">
            <h3>5. Infiltration & Bypass Air</h3>
            <div className="subsection">
              <div className="table-grid-8" style={{gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 1fr'}}>
                {/* Infiltration (cfm) */}
                <div className="table-cell">Infiltration (cfm)</div>
                <div className="table-cell">
                  <input type="number" name="cfmInfiltration" value={formData.cfmInfiltration || ''} onChange={handleChange} placeholder="0" />
                </div>
                <div className="table-cell">T Diff</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffDB || 0).toFixed(1)} />
                </div>
                <div className="table-cell" style={{gridColumn: 'span 3', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>1.08</div>
                <div className="table-cell">
                  <input type="number" readOnly value={sensibleInfiltrationBTU.toFixed(0)} />
                </div>

                {/* Ventilation Air (cfm) */}
                <div className="table-cell">Ventilation Air (cfm)</div>
                <div className="table-cell">
                  <input type="number" readOnly value={ventilationCFM.toFixed(2)} />
                </div>
                <div className="table-cell">T Diff</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffDB || 0).toFixed(1)} />
                </div>
                <div className="table-cell">BF</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.bypassFactor || 0)} />
                </div>
                <div className="table-cell">1.08</div>
                <div className="table-cell">
                  <input type="number" readOnly value={(sensibleVentilationBTU * (1 - parseFloat(formData.bypassFactor || 0))).toFixed(0)} />
                </div>

                {/* Sensible Heat Gain Total */}
                <div className="table-footer" style={{gridColumn: '1 / 8', textAlign: 'center'}}><strong>Sensible Heat Gain Total</strong></div>
                <div className="table-footer"><strong>{sensibleSubtotal.toFixed(0)}</strong></div>

                {/* Safety Factor (10%) */}
                <div className="table-footer" style={{gridColumn: '1 / 8', textAlign: 'center'}}>
                  <strong>Safety Factor (
                    <input 
                      type="number" 
                      name="safetyFactorSensible" 
                      value={formData.safetyFactorSensible} 
                      onChange={handleChange}
                      style={{width: '50px', display: 'inline-block', margin: '0 5px'}}
                    />
                    %)
                  </strong>
                </div>
                <div className="table-footer"><strong>{(sensibleSubtotal * (parseFloat(formData.safetyFactorSensible || 0) / 100)).toFixed(0)}</strong></div>

                {/* Effective Sensible Heat Gain Total (ESH) */}
                <div className="table-footer highlight" style={{gridColumn: '1 / 8', textAlign: 'center'}}><strong>Effective Sensible Heat Gain Total (ESH)</strong></div>
                <div className="table-footer highlight"><strong>{ESHT.toFixed(0)}</strong></div>
              </div>
            </div>
          </div>

          {/* 6. Latent Heat Gains */}
          <div className="form-section">
            <h3>6. Latent Heat Gains</h3>
            <div className="subsection">
              <div className="table-grid-8" style={{gridTemplateColumns: '1.5fr 1fr 0.8fr 1fr 0.8fr 0.8fr 0.8fr 1fr'}}>
                {/* Infiltration (cfm) */}
                <div className="table-cell">Infiltration (cfm)</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.cfmInfiltration || 0).toFixed(0)} />
                </div>
                <div className="table-cell">Gr/lb</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffGR || 0).toFixed(1)} />
                </div>
                <div className="table-cell" style={{gridColumn: 'span 3', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>0.68</div>
                <div className="table-cell">
                  <input type="number" readOnly value={latentInfiltrationBTU.toFixed(0)} />
                </div>

                {/* Outside Air */}
                <div className="table-cell">Outside Air</div>
                <div className="table-cell">
                  <input type="number" readOnly value={ventilationCFM.toFixed(0)} />
                </div>
                <div className="table-cell">Gr/lb</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffGR || 0).toFixed(1)} />
                </div>
                <div className="table-cell">BF</div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.bypassFactor || 0)} />
                </div>
                <div className="table-cell">0.68</div>
                <div className="table-cell">
                  <input type="number" readOnly value={(latentVentilationBTU * (1 - parseFloat(formData.bypassFactor || 0))).toFixed(0)} />
                </div>

                {/* People (Nos.) */}
                <div className="table-cell">People (Nos.)</div>
                <div className="table-cell">
                  <input type="number" readOnly value={formData.numPeople || 0} />
                </div>
                <div className="table-cell" style={{gridColumn: 'span 4', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>LH/Person</div>
                <div className="table-cell">
                  <input type="number" name="lhPerPerson" value={formData.lhPerPerson} onChange={handleChange} placeholder="0" />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={latentPeopleBTU.toFixed(0)} />
                </div>

                {/* Latent Heat Gain Total */}
                <div className="table-footer" style={{gridColumn: '1 / 8', textAlign: 'center'}}><strong>Latent Heat Gain Total</strong></div>
                <div className="table-footer"><strong>{latentSubtotal.toFixed(0)}</strong></div>

                {/* Safety Factor */}
                <div className="table-footer" style={{gridColumn: '1 / 8', textAlign: 'center'}}>
                  <strong>Safety Factor (
                    <input 
                      type="number" 
                      name="safetyFactorLatent" 
                      value={formData.safetyFactorLatent} 
                      onChange={handleChange}
                      style={{width: '50px', display: 'inline-block', margin: '0 5px'}}
                    />
                    %)
                  </strong>
                </div>
                <div className="table-footer"><strong>{(latentSubtotal * (parseFloat(formData.safetyFactorLatent || 0) / 100)).toFixed(0)}</strong></div>

                {/* Effective Latent Heat Gain Total (ELH) */}
                <div className="table-footer highlight" style={{gridColumn: '1 / 8', textAlign: 'center'}}><strong>Effective Latent Heat Gain Total (ELH)</strong></div>
                <div className="table-footer highlight"><strong>{ELHT.toFixed(0)}</strong></div>
              </div>
            </div>
          </div>

          {/* Effective Room Total Heat Gain (ESH + ELH) */}
          <div className="form-section">
            <div className="subsection">
              <div className="table-grid-2" style={{gridTemplateColumns: '3fr 1fr'}}>
                <div className="table-footer highlight" style={{textAlign: 'center', fontSize: '1.1em', padding: '12px'}}>
                  <strong>Effective Room Total Heat Gain Total (ESH + ELH)</strong>
                </div>
                <div className="table-footer highlight" style={{fontSize: '1.1em', padding: '12px'}}>
                  <strong>{effectiveRoomTotalHeat.toFixed(0)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Outside Air Heat/Ventilation Air */}
          <div className="form-section">
            <h3>Outside Air Heat/ Ventilation Air</h3>
            <div className="subsection">
              <div className="table-grid-6" style={{gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 2fr'}}>
                {/* Header Row */}
                <div className="table-header" style={{gridColumn: '1 / 7', textAlign: 'center', background: '#e5e7eb', fontWeight: 'bold', padding: '8px'}}>
                  Outside Air Heat/ Ventilation Air
                </div>

                {/* Column Headers */}
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}></div>
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}>cfm</div>
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}>F (TD)</div>
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}>(1-BF)</div>
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}></div>
                <div className="table-cell" style={{textAlign: 'center', fontWeight: 'bold'}}></div>

                {/* Sensible Row */}
                <div className="table-cell" style={{fontWeight: 'bold'}}>Sensible</div>
                <div className="table-cell">
                  <input type="number" readOnly value={ventilationCFM.toFixed(0)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffDB || 0).toFixed(2)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={(1 - parseFloat(formData.bypassFactor || 0)).toFixed(2)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value="1.08" />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={outsideAirSensible.toFixed(2)} />
                </div>

                {/* Latent Row */}
                <div className="table-cell" style={{fontWeight: 'bold'}}>Latent</div>
                <div className="table-cell">
                  <input type="number" readOnly value={ventilationCFM.toFixed(0)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={parseFloat(formData.diffGR || 0).toFixed(2)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={(1 - parseFloat(formData.bypassFactor || 0)).toFixed(2)} />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value="0.68" />
                </div>
                <div className="table-cell">
                  <input type="number" readOnly value={outsideAirLatent.toFixed(2)} />
                </div>

                {/* Outside Air Heat Gain Total */}
                <div className="table-footer" style={{gridColumn: '1 / 6', textAlign: 'center', fontWeight: 'bold'}}>
                  Outside Air Heat Gain Total
                </div>
                <div className="table-footer" style={{fontWeight: 'bold'}}>
                  <input type="number" readOnly value={outsideAirTotal.toFixed(0)} />
                </div>

                {/* GTH (Grand Total Heat) */}
                <div className="table-footer highlight" style={{gridColumn: '1 / 6', textAlign: 'center', fontWeight: 'bold'}}>
                  GTH (Grand Total Heat) -BTU/hr
                </div>
                <div className="table-footer highlight" style={{fontWeight: 'bold'}}>
                  <input type="number" readOnly value={GTH.toFixed(0)} />
                </div>

                {/* Tons (Heat Gain Grand Total/12000) */}
                <div className="table-footer highlight" style={{gridColumn: '1 / 6', textAlign: 'center', fontWeight: 'bold', background: '#3b82f6', color: 'white'}}>
                  Tons (Heat Gain Grand Total/12000)
                </div>
                <div className="table-footer highlight" style={{fontWeight: 'bold', background: '#3b82f6', color: 'white'}}>
                  <input type="number" readOnly value={tonsRequired.toFixed(2)} style={{fontWeight: 'bold', background: '#3b82f6', color: 'white'}} />
                </div>
              </div>
            </div>
          </div>

          {/* Supply CFM from Machines + Dehumidified */}
          <div className="form-section">
            <h3>Supply CFM from Machines</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label>Eff. Room Sensible Heat (ERSH)</label>
                <input type="number" readOnly value={ESHT.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>ADP (Apparatus Dew Point)</label>
                <input type="number" name="selectedADP" value={formData.selectedADP} onChange={handleChange} step="0.1" />
              </div>
              <div className="form-group">
                <label>Dehumidified Rise = (1 - BF) × (Room DB - ADP)</label>
                <input type="number" readOnly value={dehumidifiedRise.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>Dehumidified CFM = ERSH / (1.08 × Dehumidified Rise)</label>
                <input type="number" readOnly value={dehumidifiedCFM.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>CFM (Supply Air)</label>
                <input type="number" readOnly value={dehumidifiedCFM.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>CFM (Fresh Air)</label>
                <input type="number" readOnly value={ventilationCFM.toFixed(2)} />
              </div>
            </div>
          </div>

          {/* Final Output */}
          <div className="form-section">
            <h3>Output</h3>
            <div className="form-grid-3">
              <div className="form-group">
                <label>ESHT (Effective Sensible)</label>
                <input type="number" readOnly value={ESHT.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>ELHT (Effective Latent)</label>
                <input type="number" readOnly value={ELHT.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>Effective Room Total Heat (ESHT + ELHT)</label>
                <input type="number" readOnly value={effectiveRoomTotalHeat.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>Outside Air Total Heat</label>
                <input type="number" readOnly value={outsideAirTotal.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>GTH (Grand Total Heat) - BTU/hr</label>
                <input type="number" readOnly value={GTH.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>ERSH (Effective Room Sensible Heat)</label>
                <input type="number" readOnly value={ESHT.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>ADP (Apparatus Dew Point)</label>
                <input type="number" readOnly value={selectedADP.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>CFM (Supply Air)</label>
                <input type="number" readOnly value={dehumidifiedCFM.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>CFM (Fresh Air)</label>
                <input type="number" readOnly value={ventilationCFM.toFixed(2)} />
              </div>
              <div className="form-group">
                <label>Tons</label>
                <input type="number" readOnly value={tonsRequired.toFixed(2)} />
              </div>
            </div>
          </div>

          {/* Enhanced Analysis Section */}
          <div className="form-section">
            <h3>📊 Detailed Analysis & Verification</h3>
            
            {/* Heat Ratios */}
            <div className="subsection">
              <h4>Heat Ratios</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>ESHF (Effective Sensible Heat Factor)</label>
                  <input 
                    type="number" 
                    readOnly 
                    value={ESHF.toFixed(3)} 
                    style={{background: ESHF < 0.70 || ESHF > 0.95 ? '#fef3c7' : '#d1fae5'}} 
                  />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Typical: 0.70 - 0.85 for comfort cooling</small>
                </div>
                <div className="form-group">
                  <label>Room SHR (Sensible Heat Ratio)</label>
                  <input type="number" readOnly value={roomSHR.toFixed(3)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Room psychrometric process</small>
                </div>
                <div className="form-group">
                  <label>Grand SHR (System Level)</label>
                  <input type="number" readOnly value={grandSHR.toFixed(3)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Overall system sensible ratio</small>
                </div>
              </div>
            </div>

            {/* Coil Loads */}
            <div className="subsection">
              <h4>Cooling Coil Loads</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Coil Sensible Load (BTU/hr)</label>
                  <input type="number" readOnly value={coilSensibleLoad.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>= ESHT + Outside Air Sensible</small>
                </div>
                <div className="form-group">
                  <label>Coil Latent Load (BTU/hr)</label>
                  <input type="number" readOnly value={coilLatentLoad.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>= ELHT + Outside Air Latent</small>
                </div>
                <div className="form-group">
                  <label>Coil Total Load (BTU/hr)</label>
                  <input type="number" readOnly value={coilTotalLoad.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>= GTH (Grand Total Heat)</small>
                </div>
              </div>
            </div>

            {/* Temperatures */}
            <div className="subsection">
              <h4>Temperature Verification</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Supply Air Temperature (°F)</label>
                  <input 
                    type="number" 
                    readOnly 
                    value={supplyAirTemp.toFixed(2)} 
                    style={{background: supplyAirTemp < 50 || supplyAirTemp > 60 ? '#fef3c7' : '#d1fae5'}} 
                  />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Typical: 52°F - 58°F</small>
                </div>
                <div className="form-group">
                  <label>Coil Leaving Air Temp (°F)</label>
                  <input type="number" readOnly value={coilLAT.toFixed(2)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Should be 2-4°F above ADP</small>
                </div>
                <div className="form-group">
                  <label>Actual Temp Rise (°F)</label>
                  <input type="number" readOnly value={actualTempRise.toFixed(2)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Should match Dehumidified Rise</small>
                </div>
              </div>
            </div>

            {/* Airflow Details */}
            <div className="subsection">
              <h4>Airflow Breakdown</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>Return Air CFM</label>
                  <input type="number" readOnly value={returnAirCFM.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>{returnAirPercentage.toFixed(1)}% of Supply CFM</small>
                </div>
                <div className="form-group">
                  <label>Outside Air %</label>
                  <input 
                    type="number" 
                    readOnly 
                    value={outsideAirPercentage.toFixed(1)} 
                    style={{background: outsideAirPercentage < 15 ? '#fef3c7' : 'white'}} 
                  />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Min 15-20% per ASHRAE 62.1</small>
                </div>
                <div className="form-group">
                  <label>CFM per Ton</label>
                  <input 
                    type="number" 
                    readOnly 
                    value={cfmPerTon.toFixed(0)} 
                    style={{background: cfmPerTon < 350 || cfmPerTon > 450 ? '#fef3c7' : '#d1fae5'}} 
                  />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Typical: 380-420 CFM/Ton</small>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="subsection">
              <h4>Performance Metrics</h4>
              <div className="form-grid-3">
                <div className="form-group">
                  <label>BTU/hr per CFM</label>
                  <input type="number" readOnly value={btuPerCFM.toFixed(2)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>Cooling intensity</small>
                </div>
                <div className="form-group">
                  <label>Grand Sensible (BTU/hr)</label>
                  <input type="number" readOnly value={grandSensible.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>ESHT + OA Sensible</small>
                </div>
                <div className="form-group">
                  <label>Grand Latent (BTU/hr)</label>
                  <input type="number" readOnly value={grandLatent.toFixed(0)} />
                  <small style={{color: '#64748b', fontSize: '11px'}}>ELHT + OA Latent</small>
                </div>
              </div>
            </div>

            {/* Validation Warnings */}
            {validationWarnings.length > 0 && (
              <div style={{
                marginTop: '16px', 
                padding: '12px', 
                background: '#fef3c7', 
                borderRadius: '6px', 
                border: '1px solid #fbbf24'
              }}>
                <strong style={{color: '#92400e'}}>⚠️ Design Considerations:</strong>
                <ul style={{marginTop: '8px', marginBottom: 0, paddingLeft: '20px'}}>
                  {validationWarnings.map((warning, idx) => (
                    <li key={idx} style={{marginBottom: '4px', color: '#78350f'}}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          </fieldset>
          <div className="form-actions">
            <button type="button" className="calculate-button secondary" onClick={onBack}>
              Back
            </button>
            {isEditing ? (
              <button type="submit" className="calculate-button">Save & Continue</button>
            ) : (
              <>
                <button type="button" className="calculate-button" onClick={()=>setIsEditing(true)}>Edit</button>
                <button type="button" className="calculate-button secondary" onClick={reloadSaved}>Reload</button>
              </>
            )}
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SpaceConsideredForm;