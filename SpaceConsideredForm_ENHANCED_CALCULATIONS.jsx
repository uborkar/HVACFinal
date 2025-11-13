/**
 * ENHANCED HVAC CALCULATIONS - PASTE THIS CODE
 * Insert after line 548 (after tonsRequired calculation)
 * Replace the existing calculation section
 */

// ==================== CORE CALCULATIONS (Keep existing) ====================
// Keep lines 500-548 as they are - they're correct!

// ==================== NEW ENHANCED CALCULATIONS ====================
// ADD THIS CODE BLOCK AFTER LINE 548

// 1. ESHF - Effective Sensible Heat Factor (CRITICAL for equipment selection)
const ESHF = effectiveRoomTotalHeat > 0 
  ? (ESHT / effectiveRoomTotalHeat) 
  : 0;

// 2. Room SHR - Room Sensible Heat Ratio (before outside air effect)
const roomSensibleTotal = totalSensibleEnvelope() + totalInternalHeat() + sensibleInfiltrationBTU;
const roomLatentTotal = latentInfiltrationBTU + latentPeopleBTU;
const roomTotalBeforeSafety = roomSensibleTotal + roomLatentTotal;
const roomSHR = roomTotalBeforeSafety > 0 
  ? (roomSensibleTotal / roomTotalBeforeSafety) 
  : 0;

// 3. Grand Sensible and Grand Latent (Total System Loads)
const grandSensible = ESHT + outsideAirSensible;
const grandLatent = ELHT + outsideAirLatent;
const grandSHR = GTH > 0 ? (grandSensible / GTH) : 0;

// 4. Coil Load Breakdown (What the cooling coil actually sees)
const coilSensibleLoad = grandSensible;  // Coil handles room + OA sensible
const coilLatentLoad = grandLatent;      // Coil handles room + OA latent
const coilTotalLoad = GTH;               // Total coil load

// 5. Supply Air Temperature - CRITICAL VERIFICATION
// If this is outside 52-58°F, something is wrong with inputs
const supplyAirTemp = dehumidifiedCFM > 0 
  ? (insideDB - (ESHT / (1.08 * dehumidifiedCFM))) 
  : 0;

// 6. Coil Leaving Air Temperature
// Should be 2-4°F above ADP for typical coils
const coilLAT = selectedADP > 0 
  ? (selectedADP + (BF * (insideDB - selectedADP))) 
  : 0;

// 7. Return Air CFM (Critical for duct design)
const returnAirCFM = Math.max(0, dehumidifiedCFM - ventilationCFM);
const returnAirPercentage = dehumidifiedCFM > 0 
  ? ((returnAirCFM / dehumidifiedCFM) * 100) 
  : 0;

// 8. Outside Air Percentage (Should be 15-25% minimum per ASHRAE 62.1)
const outsideAirPercentage = dehumidifiedCFM > 0 
  ? ((ventilationCFM / dehumidifiedCFM) * 100) 
  : 0;

// 9. Temperature Rise Verification
// Should match dehumidifiedRise if calculations are correct
const actualTempRise = dehumidifiedCFM > 0 
  ? (ESHT / (1.08 * dehumidifiedCFM)) 
  : 0;

// 10. CFM per Ton (Typical: 380-420 CFM/Ton for comfort cooling)
const cfmPerTon = tonsRequired > 0 
  ? (dehumidifiedCFM / tonsRequired) 
  : 0;

// 11. BTU/hr per CFM (Cooling intensity metric)
const btuPerCFM = dehumidifiedCFM > 0 
  ? (GTH / dehumidifiedCFM) 
  : 0;

// 12. Mixed Air Temperature (For AHU design)
const mixedAirTemp = dehumidifiedCFM > 0
  ? ((returnAirCFM * insideDB) + (ventilationCFM * parseFloat(formData.outsideDB || 0))) / dehumidifiedCFM
  : 0;

// 13. Validation Warnings Array
const validationWarnings = React.useMemo(() => {
  const warnings = [];
  
  // Supply air temperature validation
  if (supplyAirTemp < 50 && supplyAirTemp > 0) {
    warnings.push("⚠️ Supply air temp < 50°F - Risk of overcooling and humidity issues");
  }
  if (supplyAirTemp > 60) {
    warnings.push("⚠️ Supply air temp > 60°F - May be insufficient cooling capacity");
  }
  
  // CFM per ton validation
  if (cfmPerTon < 350 && cfmPerTon > 0) {
    warnings.push("⚠️ CFM/Ton < 350 - High latent load or undersized airflow");
  }
  if (cfmPerTon > 450) {
    warnings.push("⚠️ CFM/Ton > 450 - May have comfort and air distribution issues");
  }
  
  // ESHF validation
  if (ESHF < 0.65 && ESHF > 0) {
    warnings.push("ℹ️ Low ESHF (<0.65) - High latent load application (e.g., restaurant, gym)");
  }
  if (ESHF > 0.95) {
    warnings.push("ℹ️ High ESHF (>0.95) - Very low latent load (e.g., data center, warehouse)");
  }
  
  // Outside air percentage validation
  if (outsideAirPercentage < 15 && outsideAirPercentage > 0) {
    warnings.push("⚠️ Outside Air < 15% - May not meet ASHRAE 62.1 ventilation requirements");
  }
  
  // Coil LAT validation
  const latDiff = coilLAT - selectedADP;
  if (latDiff < 1 && coilLAT > 0) {
    warnings.push("⚠️ Coil LAT too close to ADP - Verify bypass factor");
  }
  if (latDiff > 6 && coilLAT > 0) {
    warnings.push("⚠️ Coil LAT too far from ADP - Check bypass factor setting");
  }
  
  // Temperature rise verification
  const riseDiff = Math.abs(actualTempRise - dehumidifiedRise);
  if (riseDiff > 1 && dehumidifiedRise > 0) {
    warnings.push("⚠️ Temperature rise mismatch - Verify calculations");
  }
  
  return warnings;
}, [supplyAirTemp, cfmPerTon, ESHF, outsideAirPercentage, coilLAT, selectedADP, actualTempRise, dehumidifiedRise]);

// ==================== END OF ENHANCED CALCULATIONS ====================

