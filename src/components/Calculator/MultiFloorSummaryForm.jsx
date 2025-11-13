import React, { useState, useEffect } from 'react';
import { ref, set, get, update } from 'firebase/database';
import { db } from '../../firebase/config';
import { useAuth } from '../../hooks/useAuth';
import { calculateBuildingTotals } from '../../utils/multiFloorCalculations';
import './MultiFloorSummaryForm.css';

const MultiFloorSummaryForm = ({ 
  designData, 
  spaceData = null, 
  multiFloorSpaceData = null, 
  onSave, 
  onBack, 
  savedData = null, 
  projectId = null 
}) => {
  const { user } = useAuth();
  
  // Form states
  const [isEditing, setIsEditing] = useState(true);
  const [hasSaved, setHasSaved] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  
  // Summary data state
  const [summaryData, setSummaryData] = useState({
    projectSummary: null,
    floorSummaries: {},
    buildingTotals: null,
    diversityFactors: {},
    recommendations: [],
    calculatedAt: null
  });

  // Determine if this is a multi-floor project
  const isMultiFloor = multiFloorSpaceData && multiFloorSpaceData.multiFloorProject;

  // Initialize summary data
  useEffect(() => {
    if (isMultiFloor) {
      // Multi-floor project summary
      const project = multiFloorSpaceData.multiFloorProject;
      const buildingTotals = calculateBuildingTotals(project.floors);
      
      // Generate floor summaries
      const floorSummaries = {};
      Object.keys(project.floors).forEach(floorId => {
        const floor = project.floors[floorId];
        floorSummaries[floorId] = {
          floorName: floor.name,
          floorCode: floor.code,
          totalRooms: floor.rooms.length,
          calculatedRooms: floor.progress.calculatedRooms,
          completionPercentage: floor.progress.percentage,
          totals: floor.totals || {
            sensibleHeat: 0,
            latentHeat: 0,
            totalHeat: 0,
            totalCFM: 0,
            tonnage: 0
          },
          roomBreakdown: floor.rooms.map(room => ({
            name: room.name,
            type: room.type,
            area: room.area,
            occupancy: room.occupancy,
            quantity: room.quantity,
            calculated: room.calculated,
            heatLoad: room.heatGains?.totals || null
          }))
        };
      });

      setSummaryData({
        projectSummary: {
          projectName: designData.meta.projectName,
          buildingType: designData.meta.buildingType,
          totalFloors: Object.keys(project.floors).length,
          totalRooms: Object.values(floorSummaries).reduce((sum, floor) => sum + floor.totalRooms, 0),
          totalArea: buildingTotals.totalArea,
          projectScale: designData.meta.projectScale,
          buildingComplexity: designData.meta.buildingComplexity
        },
        floorSummaries,
        buildingTotals,
        diversityFactors: {
          floorLevel: 0.85,
          buildingLevel: buildingTotals.diversityFactor,
          overall: buildingTotals.diversityFactor
        },
        recommendations: generateRecommendations(buildingTotals, designData.meta.buildingType),
        calculatedAt: new Date().toISOString()
      });
    } else if (spaceData) {
      // Single-room project summary
      setSummaryData({
        projectSummary: {
          projectName: designData.meta.projectName,
          buildingType: designData.meta.buildingType || 'Single Room',
          totalFloors: 1,
          totalRooms: 1,
          totalArea: spaceData.roomArea || 0,
          projectScale: 'single',
          buildingComplexity: 'simple'
        },
        floorSummaries: {
          'single': {
            floorName: 'Single Room',
            floorCode: 'SR',
            totalRooms: 1,
            calculatedRooms: 1,
            completionPercentage: 100,
            totals: {
              sensibleHeat: spaceData.sensibleHeatTotal || 0,
              latentHeat: spaceData.latentHeatTotal || 0,
              totalHeat: spaceData.totalHeatLoad || 0,
              totalCFM: spaceData.totalCFM || 0,
              tonnage: Math.round(((spaceData.totalHeatLoad || 0) / 12000) * 100) / 100
            },
            roomBreakdown: [{
              name: designData.meta.spaceConsidered || 'Main Room',
              type: 'single_room',
              area: spaceData.roomArea || 0,
              occupancy: spaceData.occupancy || 0,
              quantity: 1,
              calculated: true,
              heatLoad: {
                sensible: spaceData.sensibleHeatTotal || 0,
                latent: spaceData.latentHeatTotal || 0,
                total: spaceData.totalHeatLoad || 0,
                cfm: spaceData.totalCFM || 0,
                tonnage: Math.round(((spaceData.totalHeatLoad || 0) / 12000) * 100) / 100
              }
            }]
          }
        },
        buildingTotals: {
          sensibleHeat: spaceData.sensibleHeatTotal || 0,
          latentHeat: spaceData.latentHeatTotal || 0,
          totalHeat: spaceData.totalHeatLoad || 0,
          totalCFM: spaceData.totalCFM || 0,
          totalArea: spaceData.roomArea || 0,
          tonnage: Math.round(((spaceData.totalHeatLoad || 0) / 12000) * 100) / 100,
          diversityFactor: 1.0,
          adjustedLoad: spaceData.totalHeatLoad || 0
        },
        diversityFactors: {
          floorLevel: 1.0,
          buildingLevel: 1.0,
          overall: 1.0
        },
        recommendations: generateRecommendations({
          tonnage: Math.round(((spaceData.totalHeatLoad || 0) / 12000) * 100) / 100,
          totalCFM: spaceData.totalCFM || 0
        }, 'Single Room'),
        calculatedAt: new Date().toISOString()
      });
    }
  }, [multiFloorSpaceData, spaceData, designData]);

  // Load saved data
  useEffect(() => {
    const loadSavedData = async () => {
      const projectNumber = designData?.meta?.projectNumber || projectId;
      if (!projectNumber) {
        setLoadingSaved(false);
        return;
      }

      try {
        const snap = await get(ref(db, `projects/${projectNumber}/summaryData`));
        if (snap.exists()) {
          const data = snap.val();
          setSummaryData(data);
          setHasSaved(true);
          setIsEditing(false);
        }
      } catch (error) {
        console.error('Error loading saved summary data:', error);
      } finally {
        setLoadingSaved(false);
      }
    };

    loadSavedData();
  }, [designData?.meta?.projectNumber, projectId]);

  // Generate recommendations based on building totals
  const generateRecommendations = (totals, buildingType) => {
    const recommendations = [];
    
    if (totals.tonnage > 100) {
      recommendations.push({
        type: 'equipment',
        priority: 'high',
        message: 'Consider chiller system for large cooling load (>100 TR)',
        details: 'Central chiller plant with chilled water distribution recommended for efficiency'
      });
    } else if (totals.tonnage > 50) {
      recommendations.push({
        type: 'equipment',
        priority: 'medium',
        message: 'VRF system recommended for medium load (50-100 TR)',
        details: 'Variable Refrigerant Flow system provides good efficiency and zoning control'
      });
    } else {
      recommendations.push({
        type: 'equipment',
        priority: 'low',
        message: 'Split AC units suitable for smaller load (<50 TR)',
        details: 'Individual split units or small package units recommended'
      });
    }

    if (totals.totalCFM > 50000) {
      recommendations.push({
        type: 'ventilation',
        priority: 'high',
        message: 'Dedicated outdoor air system (DOAS) recommended',
        details: 'High ventilation requirements suggest need for dedicated fresh air handling'
      });
    }

    // Building-specific recommendations
    if (buildingType?.toLowerCase().includes('hospital')) {
      recommendations.push({
        type: 'special',
        priority: 'high',
        message: 'Medical-grade filtration and redundancy required',
        details: 'HEPA filtration, backup systems, and infection control measures needed'
      });
    } else if (buildingType?.toLowerCase().includes('mall')) {
      recommendations.push({
        type: 'special',
        priority: 'medium',
        message: 'High occupancy ventilation and smoke management',
        details: 'Enhanced ventilation rates and smoke evacuation systems required'
      });
    }

    return recommendations;
  };

  // Save summary data
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('You must be logged in to save projects.');
      return;
    }

    try {
      const projectNumber = designData?.meta?.projectNumber || projectId;
      if (!projectNumber) {
        alert('Project number is required to save data.');
        return;
      }

      const projectRef = ref(db, `projects/${projectNumber}`);
      const existingProject = await get(projectRef);

      if (existingProject.exists()) {
        await update(projectRef, {
          summaryData: summaryData
        });
      } else {
        await set(projectRef, {
          meta: designData?.meta || {},
          summaryData: summaryData
        });
      }

      if (onSave) onSave(summaryData);
      setHasSaved(true);
      setIsEditing(false);
      alert('Summary data saved successfully!');
    } catch (error) {
      console.error('Error saving summary data:', error);
      alert('Error saving summary. Please try again.');
    }
  };

  if (loadingSaved) {
    return <div className="loading-spinner">Loading summary data...</div>;
  }

  return (
    <div className="multi-floor-summary-container">
      <div className="multi-floor-summary-form">
        {/* Header */}
        <header className="form-header">
          <div className="header-content">
            <h2>📊 Project Summary & Analysis</h2>
            <div className="header-actions">
              {hasSaved && !isEditing ? (
                <>
                  <span style={{color:'#16a34a', fontSize:12}}>Saved</span>
                  <button type="button" className="edit-button" onClick={()=>setIsEditing(true)}>Edit</button>
                </>
              ) : null}
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={!isEditing} style={{border:'none', padding:0, margin:0}}>
            
            {/* Project Overview */}
            <div className="project-overview-section">
              <h3>🏢 Project Overview</h3>
              <div className="overview-grid">
                <div className="overview-item">
                  <span className="overview-label">Project Name:</span>
                  <span className="overview-value">{summaryData.projectSummary?.projectName}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Building Type:</span>
                  <span className="overview-value">{summaryData.projectSummary?.buildingType}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Total Floors:</span>
                  <span className="overview-value">{summaryData.projectSummary?.totalFloors}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Total Rooms:</span>
                  <span className="overview-value">{summaryData.projectSummary?.totalRooms}</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Total Area:</span>
                  <span className="overview-value">{summaryData.projectSummary?.totalArea?.toLocaleString()} sq.ft</span>
                </div>
                <div className="overview-item">
                  <span className="overview-label">Project Scale:</span>
                  <span className="overview-value">{summaryData.projectSummary?.projectScale}</span>
                </div>
              </div>
            </div>

            {/* Building Totals */}
            <div className="building-totals-section">
              <h3>🔥 Building Heat Load Summary</h3>
              <div className="totals-grid">
                <div className="total-item major">
                  <div className="total-icon">🌡️</div>
                  <div className="total-content">
                    <span className="total-label">Total Cooling Load</span>
                    <span className="total-value">{summaryData.buildingTotals?.tonnage} TR</span>
                    <span className="total-subtext">{summaryData.buildingTotals?.totalHeat?.toLocaleString()} BTU/hr</span>
                  </div>
                </div>
                <div className="total-item">
                  <div className="total-icon">☀️</div>
                  <div className="total-content">
                    <span className="total-label">Sensible Heat</span>
                    <span className="total-value">{summaryData.buildingTotals?.sensibleHeat?.toLocaleString()}</span>
                    <span className="total-subtext">BTU/hr</span>
                  </div>
                </div>
                <div className="total-item">
                  <div className="total-icon">💧</div>
                  <div className="total-content">
                    <span className="total-label">Latent Heat</span>
                    <span className="total-value">{summaryData.buildingTotals?.latentHeat?.toLocaleString()}</span>
                    <span className="total-subtext">BTU/hr</span>
                  </div>
                </div>
                <div className="total-item">
                  <div className="total-icon">🌪️</div>
                  <div className="total-content">
                    <span className="total-label">Total CFM</span>
                    <span className="total-value">{summaryData.buildingTotals?.totalCFM?.toLocaleString()}</span>
                    <span className="total-subtext">Cubic Feet per Minute</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floor-wise Summary */}
            {isMultiFloor && (
              <div className="floor-summary-section">
                <h3>🏗️ Floor-wise Heat Load Breakdown</h3>
                <div className="floor-summary-table">
                  <div className="table-header">
                    <div className="header-cell">Floor</div>
                    <div className="header-cell">Rooms</div>
                    <div className="header-cell">Area (sq.ft)</div>
                    <div className="header-cell">Sensible (BTU/hr)</div>
                    <div className="header-cell">Latent (BTU/hr)</div>
                    <div className="header-cell">Total Load (TR)</div>
                    <div className="header-cell">CFM</div>
                    <div className="header-cell">Status</div>
                  </div>
                  {Object.entries(summaryData.floorSummaries || {}).map(([floorId, floor]) => (
                    <div key={floorId} className="table-row">
                      <div className="table-cell floor-info">
                        <span className="floor-code">{floor.floorCode}</span>
                        <span className="floor-name">{floor.floorName}</span>
                      </div>
                      <div className="table-cell">{floor.totalRooms}</div>
                      <div className="table-cell">{floor.totals?.totalArea?.toLocaleString() || 'N/A'}</div>
                      <div className="table-cell">{floor.totals?.sensibleHeat?.toLocaleString() || 0}</div>
                      <div className="table-cell">{floor.totals?.latentHeat?.toLocaleString() || 0}</div>
                      <div className="table-cell load-value">{floor.totals?.tonnage || 0} TR</div>
                      <div className="table-cell">{floor.totals?.totalCFM?.toLocaleString() || 0}</div>
                      <div className="table-cell">
                        <div className={`status-badge ${floor.completionPercentage === 100 ? 'complete' : 'incomplete'}`}>
                          {floor.completionPercentage}% Complete
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Diversity Factors */}
            <div className="diversity-factors-section">
              <h3>⚖️ Diversity Factors Applied</h3>
              <div className="diversity-grid">
                <div className="diversity-item">
                  <span className="diversity-label">Floor Level Diversity:</span>
                  <span className="diversity-value">{(summaryData.diversityFactors?.floorLevel * 100).toFixed(0)}%</span>
                  <span className="diversity-description">Applied to individual floor calculations</span>
                </div>
                <div className="diversity-item">
                  <span className="diversity-label">Building Level Diversity:</span>
                  <span className="diversity-value">{(summaryData.diversityFactors?.buildingLevel * 100).toFixed(0)}%</span>
                  <span className="diversity-description">Applied to total building load</span>
                </div>
                <div className="diversity-item">
                  <span className="diversity-label">Overall Diversity:</span>
                  <span className="diversity-value">{(summaryData.diversityFactors?.overall * 100).toFixed(0)}%</span>
                  <span className="diversity-description">Final diversity factor used</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="recommendations-section">
              <h3>💡 System Recommendations</h3>
              <div className="recommendations-list">
                {summaryData.recommendations?.map((rec, index) => (
                  <div key={index} className={`recommendation-item ${rec.priority}`}>
                    <div className="recommendation-header">
                      <span className={`priority-badge ${rec.priority}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                      <span className="recommendation-type">{rec.type.toUpperCase()}</span>
                    </div>
                    <div className="recommendation-content">
                      <h4>{rec.message}</h4>
                      <p>{rec.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Details */}
            <div className="calculation-details-section">
              <h3>🧮 Calculation Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Calculated At:</span>
                  <span className="detail-value">
                    {summaryData.calculatedAt ? new Date(summaryData.calculatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Calculation Method:</span>
                  <span className="detail-value">ASHRAE/ISHRAE Standards</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Climate Zone:</span>
                  <span className="detail-value">{designData?.ambient?.location || 'Manual Entry'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Inside Conditions:</span>
                  <span className="detail-value">
                    {designData?.inside?.dbF}°F, {designData?.inside?.rh}% RH
                  </span>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" onClick={onBack} className="secondary-button">
                ← Back to Space Considered
              </button>
              <button type="submit" className="primary-button">
                Save Summary & Continue
              </button>
            </div>

          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default MultiFloorSummaryForm;
