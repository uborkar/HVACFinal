import React, { useState } from 'react';
import { 
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Calculator,
  CheckCircle
} from 'lucide-react';

const RoomCard = ({ 
  room, 
  floorKey, 
  buildingType, 
  roomTypes, 
  onUpdate, 
  onCalculate, 
  onCopy, 
  onRemove, 
  isCalculating 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`room-card ${room.isCalculated ? 'calculated' : ''} ${isExpanded ? 'expanded' : ''}`}>
      <div className="room-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="room-title">
          <input
            type="text"
            value={room.roomName}
            onChange={(e) => onUpdate({ roomName: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="room-name-input"
          />
          {room.isCalculated && <CheckCircle className="calculated-icon" size={16} />}
        </div>
        <div className="room-actions">
          {room.isCalculated && (
            <div className="room-results">
              <span>{room.tonnage?.toFixed(2)} TR</span>
              <span>{room.cfm?.toFixed(0)} CFM</span>
            </div>
          )}
          <button onClick={(e) => { e.stopPropagation(); onCopy(); }} title="Copy Room">
            <Copy size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove Room">
            <Trash2 size={14} />
          </button>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {isExpanded && (
        <div className="room-details">
          {/* Room Type */}
          <div className="form-group">
            <label>Room Type</label>
            <select
              value={room.roomType}
              onChange={(e) => onUpdate({ roomType: e.target.value })}
            >
              {roomTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Dimensions */}
          <div className="form-group">
            <label>Dimensions (ft)</label>
            <div className="input-row">
              <input
                type="number"
                placeholder="Length"
                value={room.dimensions.length}
                onChange={(e) => onUpdate({
                  dimensions: { ...room.dimensions, length: parseFloat(e.target.value) || 0 }
                })}
              />
              <input
                type="number"
                placeholder="Width"
                value={room.dimensions.width}
                onChange={(e) => onUpdate({
                  dimensions: { ...room.dimensions, width: parseFloat(e.target.value) || 0 }
                })}
              />
              <input
                type="number"
                placeholder="Height"
                value={room.dimensions.height}
                onChange={(e) => onUpdate({
                  dimensions: { ...room.dimensions, height: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>
          </div>

          {/* Occupancy */}
          <div className="form-group">
            <label>Occupancy</label>
            <div className="input-row">
              <input
                type="number"
                placeholder="No. of People"
                value={room.occupancy.numberOfPeople}
                onChange={(e) => onUpdate({
                  occupancy: { ...room.occupancy, numberOfPeople: parseInt(e.target.value) || 0 }
                })}
              />
              <select
                value={room.occupancy.activityLevel}
                onChange={(e) => onUpdate({
                  occupancy: { ...room.occupancy, activityLevel: e.target.value }
                })}
              >
                <option value="seated">Seated</option>
                <option value="office">Office Work</option>
                <option value="standing">Standing</option>
                <option value="walking">Walking</option>
                <option value="heavy">Heavy Work</option>
              </select>
            </div>
          </div>

          {/* Equipment */}
          <div className="form-group">
            <label>Equipment Load</label>
            <div className="equipment-inputs">
              <div className="input-row">
                <label>Lights</label>
                <input
                  type="number"
                  placeholder="Watts"
                  value={room.equipment.lights.watts}
                  onChange={(e) => onUpdate({
                    equipment: {
                      ...room.equipment,
                      lights: { ...room.equipment.lights, watts: parseFloat(e.target.value) || 0 }
                    }
                  })}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={room.equipment.lights.quantity}
                  onChange={(e) => onUpdate({
                    equipment: {
                      ...room.equipment,
                      lights: { ...room.equipment.lights, quantity: parseInt(e.target.value) || 0 }
                    }
                  })}
                />
              </div>
              <div className="input-row">
                <label>Computers</label>
                <input
                  type="number"
                  placeholder="Watts"
                  value={room.equipment.computers.watts}
                  onChange={(e) => onUpdate({
                    equipment: {
                      ...room.equipment,
                      computers: { ...room.equipment.computers, watts: parseFloat(e.target.value) || 0 }
                    }
                  })}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={room.equipment.computers.quantity}
                  onChange={(e) => onUpdate({
                    equipment: {
                      ...room.equipment,
                      computers: { ...room.equipment.computers, quantity: parseInt(e.target.value) || 0 }
                    }
                  })}
                />
              </div>
              <div className="input-row">
                <label>Other Equipment</label>
                <input
                  type="number"
                  placeholder="Total Watts"
                  value={room.equipment.other.watts}
                  onChange={(e) => onUpdate({
                    equipment: {
                      ...room.equipment,
                      other: { watts: parseFloat(e.target.value) || 0 }
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Ventilation */}
          <div className="form-group">
            <label>Ventilation (CFM)</label>
            <div className="input-row">
              <input
                type="number"
                placeholder="Fresh Air CFM"
                value={room.ventilation.freshAirCFM}
                onChange={(e) => onUpdate({
                  ventilation: { ...room.ventilation, freshAirCFM: parseFloat(e.target.value) || 0 }
                })}
              />
              <input
                type="number"
                placeholder="Exhaust CFM"
                value={room.ventilation.exhaustCFM}
                onChange={(e) => onUpdate({
                  ventilation: { ...room.ventilation, exhaustCFM: parseFloat(e.target.value) || 0 }
                })}
              />
            </div>
          </div>

          {/* Wall Configuration */}
          <div className="form-group">
            <label>Wall Configuration</label>
            <div className="walls-config">
              {['north', 'south', 'east', 'west'].map(direction => (
                <div key={direction} className="wall-input">
                  <label>{direction.charAt(0).toUpperCase() + direction.slice(1)}</label>
                  <select
                    value={room.walls[direction].type}
                    onChange={(e) => onUpdate({
                      walls: {
                        ...room.walls,
                        [direction]: { ...room.walls[direction], type: e.target.value }
                      }
                    })}
                  >
                    <option value="external">External</option>
                    <option value="internal">Internal</option>
                    <option value="partition">Partition</option>
                  </select>
                  <label>
                    <input
                      type="checkbox"
                      checked={room.walls[direction].hasWindow}
                      onChange={(e) => onUpdate({
                        walls: {
                          ...room.walls,
                          [direction]: { ...room.walls[direction], hasWindow: e.target.checked }
                        }
                      })}
                    />
                    Window
                  </label>
                  {room.walls[direction].hasWindow && (
                    <input
                      type="number"
                      placeholder="Window Area (sq.ft)"
                      value={room.walls[direction].windowArea}
                      onChange={(e) => onUpdate({
                        walls: {
                          ...room.walls,
                          [direction]: { ...room.walls[direction], windowArea: parseFloat(e.target.value) || 0 }
                        }
                      })}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={onCalculate}
            className="btn-calculate-room"
            disabled={isCalculating}
          >
            {isCalculating ? (
              <>Calculating...</>
            ) : (
              <>
                <Calculator size={16} />
                Calculate Heat Load
              </>
            )}
          </button>

          {/* Results Display */}
          {room.isCalculated && room.calculatedLoad && (
            <div className="room-calculation-results">
              <h4>Calculation Results</h4>
              <div className="results-grid">
                <div className="result-item">
                  <span>Sensible Load:</span>
                  <strong>{room.calculatedLoad.sensibleLoad?.toFixed(0)} BTU/hr</strong>
                </div>
                <div className="result-item">
                  <span>Latent Load:</span>
                  <strong>{room.calculatedLoad.latentLoad?.toFixed(0)} BTU/hr</strong>
                </div>
                <div className="result-item">
                  <span>Total Load:</span>
                  <strong>{room.calculatedLoad.totalLoad?.toFixed(0)} BTU/hr</strong>
                </div>
                <div className="result-item">
                  <span>Tonnage:</span>
                  <strong className="highlight">{room.tonnage?.toFixed(2)} TR</strong>
                </div>
                <div className="result-item">
                  <span>Supply CFM:</span>
                  <strong>{room.cfm?.toFixed(0)}</strong>
                </div>
                <div className="result-item">
                  <span>Room SHF:</span>
                  <strong>{room.calculatedLoad.roomSHF?.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomCard;
