import React, { useState, useEffect, useMemo } from 'react';
import './RoomForm.css';

const RoomForm = ({ floor, room, onClose, onUpdate, buildingType }) => {
  const [customType, setCustomType] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'office',
    area: '',
    length: '',
    width: '',
    height: '3',
    occupancy: '',
    lighting: '',
    equipment: '',
    orientation: 'north',
    windowArea: '',
    description: '',
    buildingType: buildingType || ''
  });

  // ---- Building-aware room type catalog ----
  const BUILDING_TYPESETS = useMemo(() => ({
    commercial: [
      { value: 'office', label: 'Office' },
      { value: 'conference', label: 'Conference Room' },
      { value: 'lobby', label: 'Lobby' },
      { value: 'corridor', label: 'Corridor' },
      { value: 'restroom', label: 'Restroom' },
      { value: 'storage', label: 'Storage' },
      { value: 'kitchen', label: 'Pantry / Kitchen' },
      { value: 'server', label: 'Server / IT Room' },
      { value: 'retail', label: 'Retail Space' }
    ],
    residential: [
      { value: 'bedroom', label: 'Bedroom' },
      { value: 'living', label: 'Living Room' },
      { value: 'dining', label: 'Dining' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'toilet', label: 'Toilet / Bath' },
      { value: 'study', label: 'Study' },
      { value: 'balcony', label: 'Balcony' },
      { value: 'utility', label: 'Utility / Store' }
    ],
    hospitality: [
      { value: 'guestroom', label: 'Guest Room' },
      { value: 'suite', label: 'Suite' },
      { value: 'banquet', label: 'Banquet Hall' },
      { value: 'restaurant', label: 'Restaurant' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'backoffice', label: 'Back Office' },
      { value: 'gym', label: 'Gym / Spa' },
      { value: 'corridor', label: 'Corridor' }
    ],
    education: [
      { value: 'classroom', label: 'Classroom' },
      { value: 'lab', label: 'Laboratory' },
      { value: 'library', label: 'Library' },
      { value: 'office', label: 'Staff Room / Office' },
      { value: 'auditorium', label: 'Auditorium' },
      { value: 'corridor', label: 'Corridor' },
      { value: 'restroom', label: 'Restroom' }
    ],
    healthcare: [
      { value: 'ward', label: 'Ward' },
      { value: 'icu', label: 'ICU' },
      { value: 'ot', label: 'Operation Theatre' },
      { value: 'lab', label: 'Lab' },
      { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'reception', label: 'Reception / OPD' }
    ],
    // fallback: your original commercial-ish set
    default: [
      { value: 'office', label: 'Office' },
      { value: 'conference', label: 'Conference Room' },
      { value: 'lobby', label: 'Lobby' },
      { value: 'corridor', label: 'Corridor' },
      { value: 'restroom', label: 'Restroom' },
      { value: 'storage', label: 'Storage' },
      { value: 'kitchen', label: 'Kitchen' },
      { value: 'server', label: 'Server Room' },
      { value: 'retail', label: 'Retail Space' }
    ]
  }), []);

  // Pick the set based on buildingType (string like 'commercial', 'residential', etc.)
  const baseOptions = useMemo(() => {
    const key = (buildingType || '').toLowerCase();
    return BUILDING_TYPESETS[key] || BUILDING_TYPESETS.default;
  }, [buildingType, BUILDING_TYPESETS]);

  // Filtered room types based on search
  const filteredRoomTypes = useMemo(() => {
    if (!searchTerm.trim()) return baseOptions;
    const search = searchTerm.toLowerCase();
    return baseOptions.filter(option => 
      option.label.toLowerCase().includes(search) || 
      option.value.toLowerCase().includes(search)
    );
  }, [baseOptions, searchTerm]);

  // Note: Legacy roomTypes removed - now using filteredRoomTypes for modern combo box

  // For duplicates prevention, normalize labels & values
  const normalizedCatalog = useMemo(() => {
    const norm = (s) => String(s || '').trim().toLowerCase();
    const set = new Set();
    baseOptions.forEach(o => {
      set.add(norm(o.value));
      set.add(norm(o.label));
    });
    return set;
  }, [baseOptions]);

  const isOtherSelected = formData.type === 'other';
  const norm = (s) => String(s || '').trim().toLowerCase();
  const customClashesWithCatalog = isOtherSelected && customType.trim() && normalizedCatalog.has(norm(customType));
  
  // Check if current search term matches existing options
  const searchMatchesExisting = searchTerm.trim() && baseOptions.some(option => 
    norm(option.label) === norm(searchTerm) || norm(option.value) === norm(searchTerm)
  );
  
  // Get the display value for the input
  const getDisplayValue = () => {
    if (isTyping) return searchTerm;
    if (isOtherSelected) return customType;
    if (formData.type && formData.type !== '') {
      const option = baseOptions.find(opt => opt.value === formData.type);
      return option ? option.label : formData.type;
    }
    return '';
  };

  // Smart suggestions chips based on buildingType
  const suggestionChips = useMemo(() => {
    // show top 4 from the base set as quick-adds when "Other" selected
    return baseOptions.slice(0, 6).map(o => o.label);
  }, [baseOptions]);

  // ---- Initialize when room changes (supports edit mode with custom types) ----
  useEffect(() => {
    if (room) {
      const current = room.type || 'office';
      const isCustom = !normalizedCatalog.has(norm(current));
      setFormData({
        name: room.name || '',
        type: isCustom ? 'other' : current,
        area: room.area || '',
        length: room.length || '',
        width: room.width || '',
        height: room.height || '3',
        occupancy: room.occupancy || '',
        lighting: room.lighting || '',
        equipment: room.equipment || '',
        orientation: room.orientation || 'north',
        windowArea: room.windowArea || '',
        description: room.description || '',
        buildingType: buildingType || ''
      });
      setCustomType(isCustom ? current : '');
    } else {
      setFormData(prev => ({
        ...prev,
        name: '',
        type: 'office',
        area: '',
        length: '',
        width: '',
        height: '3',
        occupancy: '',
        lighting: '',
        equipment: '',
        orientation: 'north',
        windowArea: '',
        description: '',
        buildingType: buildingType || ''
      }));
      setCustomType('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, buildingType]);

  // ---- Input handlers ----
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // auto area
    if (field === 'length' || field === 'width') {
      const length = field === 'length' ? parseFloat(value) : parseFloat(formData.length);
      const width = field === 'width' ? parseFloat(value) : parseFloat(formData.width);
      if (!isNaN(length) && !isNaN(width) && length > 0 && width > 0) {
        setFormData(prev => ({ ...prev, area: (length * width).toFixed(2) }));
      }
    }
  };

  // Handle room type input changes (combo box functionality)
  const handleRoomTypeInput = (value) => {
    setSearchTerm(value);
    setIsTyping(true);
    setIsDropdownOpen(true);
    
    // Check if the input matches an existing option exactly
    const exactMatch = baseOptions.find(option => 
      norm(option.label) === norm(value) || norm(option.value) === norm(value)
    );
    
    if (exactMatch) {
      setFormData(prev => ({ ...prev, type: exactMatch.value }));
      setCustomType('');
    } else {
      // If no exact match, treat as custom type
      setFormData(prev => ({ ...prev, type: 'other' }));
      setCustomType(value);
    }
  };

  // Handle selecting from dropdown
  const handleRoomTypeSelect = (option) => {
    if (option.value === 'other') {
      setFormData(prev => ({ ...prev, type: 'other' }));
      setCustomType('');
      setSearchTerm('');
    } else {
      setFormData(prev => ({ ...prev, type: option.value }));
      setCustomType('');
      setSearchTerm(option.label);
    }
    setIsTyping(false);
    setIsDropdownOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsDropdownOpen(true);
    if (!isTyping && formData.type && formData.type !== 'other') {
      const option = baseOptions.find(opt => opt.value === formData.type);
      setSearchTerm(option ? option.label : '');
    }
  };

  // Handle input blur
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsDropdownOpen(false);
      setIsTyping(false);
      
      // If user typed something that doesn't match existing options, keep it as custom
      if (searchTerm.trim() && !searchMatchesExisting) {
        setFormData(prev => ({ ...prev, type: 'other' }));
        setCustomType(searchTerm.trim());
      }
    }, 200); // Delay to allow dropdown clicks
  };

  // ---- Validation helpers ----
  const nameValid = formData.name.trim().length > 0;
  const customValid = !isOtherSelected || (customType.trim().length > 0 && !customClashesWithCatalog);
  const canSave = nameValid && customValid;

  // ---- Submit ----
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!nameValid) {
      alert('Please enter a room name.');
      return;
    }
    if (isOtherSelected) {
      if (!customType.trim()) {
        alert('Please specify the custom room type.');
        return;
      }
      if (customClashesWithCatalog) {
        alert('This type already exists in the list. Please select it from the dropdown instead.');
        return;
      }
    }

    let finalArea = parseFloat(formData.area) || 0;
    if (!finalArea && formData.length && formData.width) {
      const length = parseFloat(formData.length);
      const width = parseFloat(formData.width);
      if (!isNaN(length) && !isNaN(width)) finalArea = length * width;
    }

    const finalType = isOtherSelected ? customType.trim() : formData.type;

    const roomData = {
      id: room?.id || `room_${Date.now()}`,
      name: formData.name.trim(),
      type: finalType,
      area: isNaN(finalArea) ? 0 : finalArea,
      length: isNaN(parseFloat(formData.length)) ? null : parseFloat(formData.length),
      width: isNaN(parseFloat(formData.width)) ? null : parseFloat(formData.width),
      height: isNaN(parseFloat(formData.height)) ? 3 : parseFloat(formData.height),
      occupancy: isNaN(parseInt(formData.occupancy)) ? 0 : parseInt(formData.occupancy),
      lighting: isNaN(parseFloat(formData.lighting)) ? 0 : parseFloat(formData.lighting),
      equipment: isNaN(parseFloat(formData.equipment)) ? 0 : parseFloat(formData.equipment),
      orientation: formData.orientation,
      windowArea: isNaN(parseFloat(formData.windowArea)) ? 0 : parseFloat(formData.windowArea),
      description: formData.description.trim(),
      createdAt: room?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onUpdate(roomData);
  };

  return (
    <div className="room-form-overlay">
      <div className="room-form-modal">
        <div className="room-form-header header-gradient">
          <div className="header-title">
            <h3>{room ? 'Edit Room' : 'Add New Room'}</h3>
            <span className="badge-building" title="Building Type">
              {formData.buildingType ? formData.buildingType : 'General'}
            </span>
          </div>
          <p>Floor: {floor?.name || 'Unknown Floor'}</p>
          <button className="close-btn" onClick={onClose} aria-label="Close form">×</button>
        </div>

        <form onSubmit={handleSubmit} className="room-form">
          <div className="form-grid">
            {/* Basic Information */}
            <div className="form-section">
              <h4>Basic Information</h4>

              <div className="form-group">
                <label>Room Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Conference Room A"
                  required
                />
              </div>

              <div className="form-group">
                <label>Room Type *</label>
                
                <div className="roomtype-container">
                  <div className={`roomtype-combo-wrapper ${isDropdownOpen ? 'roomtype-active' : ''}`}>
                    <input
                      type="text"
                      className={`roomtype-input ${customClashesWithCatalog ? 'roomtype-error' : ''}`}
                      placeholder="Search or select room type..."
                      value={getDisplayValue()}
                      onChange={(e) => handleRoomTypeInput(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      autoComplete="off"
                    />
                    
                    <button
                      type="button"
                      className={`roomtype-dropdown-toggle ${isDropdownOpen ? 'roomtype-open' : ''}`}
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <div className="roomtype-dropdown-panel">
                        <div className="roomtype-panel-header">
                          <div className="roomtype-header-info">
                            <h4>Available Types</h4>
                            <span className="roomtype-building-badge">{buildingType || 'General'}</span>
                          </div>
                          <span className="roomtype-results-count">{filteredRoomTypes.length} found</span>
                        </div>
                        
                        <div className="roomtype-options-list">
                          {filteredRoomTypes.length > 0 ? (
                            filteredRoomTypes.map((option) => (
                              <div
                                key={option.value}
                                className={`roomtype-option-item ${formData.type === option.value ? 'roomtype-selected' : ''}`}
                                onClick={() => handleRoomTypeSelect(option)}
                              >
                                <div className="roomtype-option-info">
                                  <span className="roomtype-option-name">{option.label}</span>
                                  <span className="roomtype-option-code">{option.value}</span>
                                </div>
                                {formData.type === option.value && (
                                  <div className="roomtype-selected-icon">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="roomtype-no-options">
                              <p>No matching types found</p>
                              <small>Your input will be saved as custom</small>
                            </div>
                          )}
                          
                          <div className="roomtype-divider"></div>
                          
                          <div
                            className="roomtype-option-item roomtype-custom-option"
                            onClick={() => handleRoomTypeSelect({ value: 'other', label: 'Custom Type' })}
                          >
                            <div className="roomtype-option-info">
                              <span className="roomtype-option-name">✨ Custom Type</span>
                              <span className="roomtype-option-desc">Create your own</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Messages */}
                  {customClashesWithCatalog && (
                    <div className="roomtype-status-message roomtype-error">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                      This type already exists in the list.
                    </div>
                  )}

                  {(isOtherSelected || (searchTerm.trim() && !searchMatchesExisting)) && !customClashesWithCatalog && (
                    <div className="roomtype-status-message roomtype-success">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m9 12 2 2 4-4"></path>
                      </svg>
                      Custom type: <strong>{customType || searchTerm}</strong>
                    </div>
                  )}

                  {/* Quick Suggestions */}
                  {suggestionChips?.length > 0 && !isDropdownOpen && !formData.type && (
                    <div className="roomtype-quick-picks">
                      <span className="roomtype-picks-label">Popular for {buildingType || 'buildings'}:</span>
                      <div className="roomtype-picks-list">
                        {suggestionChips.slice(0, 3).map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="roomtype-pick-chip"
                            onClick={() => {
                              const match = baseOptions.find(o => norm(o.label) === norm(label));
                              if (match) {
                                handleRoomTypeSelect(match);
                              }
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional description"
                  rows="2"
                />
              </div>
            </div>

            {/* (Your other sections remain commented as in your original code) */}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={!canSave} title={!canSave ? 'Complete required fields' : 'Save'}>
              {room ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomForm;
