import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HVACDataService from '../../services/hvacDataService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from '../../utils/toast';
import './BOQ.css';

/**
 * BOQ (Bill of Quantities) Component
 * Professional BOQ generation with Excel and PDF export
 * Comprehensive cost breakdown for HVAC projects
 */

const BOQ = ({ 
  designData, 
  spaceData, 
  equipmentData, 
  inventoryData, 
  onRegisterExport,
  onBack,
  onSave,
  projectId,
  user 
}) => {
  const navigate = useNavigate();
  const [boqData, setBOQData] = useState(null);
  const [showPricing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if BOQ was already saved (when loading existing project)
  useEffect(() => {
    const checkIfSaved = async () => {
      if (projectId && user) {
        try {
          const result = await HVACDataService.loadProjectData(projectId, user.uid);
          if (result.success && result.data?.boqData) {
            setIsSaved(true);
            console.log('✅ BOQ already saved in Firebase');
          }
        } catch (error) {
          console.error('Error checking BOQ save status:', error);
        }
      }
    };
    checkIfSaved();
  }, [projectId, user]);

  // Initialize BOQ data
  useEffect(() => {
    const generateIndoorUnitsSection = () => {
      const indoorUnits = {};
      
      // Check if we have equipment spreadsheet data
      if (!equipmentData?.spreadsheetData) return indoorUnits;
      
      // Aggregate IDUs by type from spreadsheet data
      Object.values(equipmentData.spreadsheetData).forEach(floorData => {
        Object.values(floorData.rooms || {}).forEach(room => {
          if (room.selectedACType && room.acQuantity > 0) {
            const acType = room.selectedACType;
            const quantity = parseInt(room.acQuantity) || 0;
            const capacity = room.selectedCapacity || 'Unknown';
            
            const key = `${acType}_${capacity}TR`;
            const displayName = `${getACTypeName(acType)} - ${capacity} TR`;
            
            if (indoorUnits[key]) {
              indoorUnits[key].quantity += quantity;
              indoorUnits[key].totalPrice = indoorUnits[key].quantity * indoorUnits[key].unitPrice;
            } else {
              indoorUnits[key] = {
                type: displayName,
                model: `${getACTypeName(acType)} IDU`,
                quantity: quantity,
                unitPrice: getACTypePrice(acType, capacity),
                totalPrice: quantity * getACTypePrice(acType, capacity),
                unit: 'nos'
              };
            }
          }
        });
      });
      
      return indoorUnits;
    };

    const getACTypeName = (key) => {
      const typeMap = {
        'wallMounted': 'Wall Mounted',
        'roundCST': 'Round CST',
        'cassette4Way2x2': '4 Way Cassette 2x2',
        'cassette4Way3x3': '4 Way Cassette 3x3',
        'cassette2Way': '2 Way Cassette',
        'cassette1Way': '1 Way Cassette',
        'lowStaticDuct': 'Low Static Duct',
        'highStaticDuct': 'High Static Duct',
        'flrs': 'FLRS'
      };
      return typeMap[key] || key;
    };

    const getACTypePrice = (type, capacity) => {
      // Base price calculation based on capacity and type
      const basePrice = parseFloat(capacity) * 15000; // ₹15k per TR base
      const typeMultiplier = {
        'wallMounted': 1.0,
        'roundCST': 1.2,
        'cassette4Way2x2': 1.3,
        'cassette4Way3x3': 1.4,
        'cassette2Way': 1.25,
        'cassette1Way': 1.2,
        'lowStaticDuct': 1.5,
        'highStaticDuct': 1.6,
        'flrs': 1.8
      };
      return Math.round(basePrice * (typeMultiplier[type] || 1.0));
    };

    const generateOutdoorUnitsSection = () => {
      const outdoorUnits = {};
      
      // Check if we have equipment spreadsheet data
      if (!equipmentData?.spreadsheetData) return outdoorUnits;
      
      // Aggregate ODUs by type from spreadsheet data
      Object.values(equipmentData.spreadsheetData).forEach(floorData => {
        Object.values(floorData.rooms || {}).forEach(room => {
          // Combined ODU
          if (room.combinedHP && room.combinedQty > 0) {
            const hp = room.combinedHP;
            const quantity = parseInt(room.combinedQty) || 0;
            const key = `Combined_${hp}HP`;
            
            if (outdoorUnits[key]) {
              outdoorUnits[key].quantity += quantity;
              outdoorUnits[key].totalPrice = outdoorUnits[key].quantity * outdoorUnits[key].unitPrice;
            } else {
              outdoorUnits[key] = {
                type: `Combined ${hp} HP ODU`,
                model: `ODU-Combined-${hp}HP`,
                quantity: quantity,
                unitPrice: parseFloat(hp) * 12000, // ₹12k per HP
                totalPrice: quantity * parseFloat(hp) * 12000,
                unit: 'nos'
              };
            }
          }
          
          // Top Discharge ODU
          if (room.topDischargeHP && room.topDischargeQty > 0) {
            const hp = room.topDischargeHP;
            const quantity = parseInt(room.topDischargeQty) || 0;
            const key = `TopDischarge_${hp}HP`;
            
            if (outdoorUnits[key]) {
              outdoorUnits[key].quantity += quantity;
              outdoorUnits[key].totalPrice = outdoorUnits[key].quantity * outdoorUnits[key].unitPrice;
            } else {
              outdoorUnits[key] = {
                type: `Top Discharge ${hp} HP ODU`,
                model: `ODU-TopDischarge-${hp}HP`,
                quantity: quantity,
                unitPrice: parseFloat(hp) * 13000, // ₹13k per HP (premium)
                totalPrice: quantity * parseFloat(hp) * 13000,
                unit: 'nos'
              };
            }
          }
          
          // Side Discharge ODU
          if (room.sideDischargeHP && room.sideDischargeQty > 0) {
            const hp = room.sideDischargeHP;
            const quantity = parseInt(room.sideDischargeQty) || 0;
            const key = `SideDischarge_${hp}HP`;
            
            if (outdoorUnits[key]) {
              outdoorUnits[key].quantity += quantity;
              outdoorUnits[key].totalPrice = outdoorUnits[key].quantity * outdoorUnits[key].unitPrice;
            } else {
              outdoorUnits[key] = {
                type: `Side Discharge ${hp} HP ODU`,
                model: `ODU-SideDischarge-${hp}HP`,
                quantity: quantity,
                unitPrice: parseFloat(hp) * 11000, // ₹11k per HP (compact)
                totalPrice: quantity * parseFloat(hp) * 11000,
                unit: 'nos'
              };
            }
          }
        });
      });
      
      return outdoorUnits;
    };

    const calculateCostSummary = () => {
      let totalIDU = 0;
      let totalODU = 0;
      let totalAccessories = 0;
      
      // Sum IDU costs
      Object.values(generateIndoorUnitsSection()).forEach(unit => {
        totalIDU += unit.totalPrice || 0;
      });
      
      // Sum ODU costs
      Object.values(generateOutdoorUnitsSection()).forEach(unit => {
        totalODU += unit.totalPrice || 0;
      });
      
      // Sum accessories (if available)
      if (inventoryData?.inventory) {
        Object.values(inventoryData.inventory).forEach(item => {
          totalAccessories += (item.quantity || 0) * (item.unitPrice || 0);
        });
      }
      
      const subtotal = totalIDU + totalODU + totalAccessories;
      const gst = subtotal * 0.18; // 18% GST
      const grandTotal = subtotal + gst;
      
      return {
        totalIDU,
        totalODU,
        totalAccessories,
        subtotal,
        gst,
        grandTotal
      };
    };

    const validateFormsCompletion = () => {
      console.log('🔍 Validating forms completion...');
      console.log('🔍 designData:', designData);
      console.log('🔍 spaceData:', spaceData);
      console.log('🔍 equipmentData:', equipmentData);
      
      // Check if space data exists (heat load calculations)
      if (!spaceData?.roomCalculations || Object.keys(spaceData.roomCalculations).length === 0) {
        console.log('❌ Space/heat load data incomplete');
        return false;
      }
      
      // Check if equipment data exists and has selections
      if (!equipmentData?.spreadsheetData) {
        console.log('❌ Equipment data incomplete - no spreadsheetData');
        return false;
      }
      
      // Check if at least one room has equipment selected
      let hasEquipmentSelection = false;
      let equipmentCount = 0;
      
      Object.values(equipmentData.spreadsheetData).forEach(floorData => {
        Object.values(floorData.rooms || {}).forEach(room => {
          if (room.selectedACType && room.acQuantity > 0) {
            hasEquipmentSelection = true;
            equipmentCount++;
            console.log(`✅ Found equipment: ${room.selectedACType} x${room.acQuantity}`);
          }
        });
      });
      
      if (!hasEquipmentSelection) {
        console.log('❌ No equipment selections found');
        return false;
      }
      
      console.log(`✅ All forms completed - ready to generate BOQ (${equipmentCount} equipment selections)`);
      return true;
    };

    const generateBOQ = () => {
      try {
        setLoading(true);
        
        // Validate that all forms are completed
        if (!validateFormsCompletion()) {
          setBOQData(null);
          setLoading(false);
          return;
        }
        
        const boq = {
          projectInfo: {
            name: designData?.meta?.projectName || spaceData?.buildingData?.name || 'Untitled Project',
            number: designData?.meta?.projectNumber || new Date().getTime().toString(),
            date: new Date().toLocaleDateString('en-IN'),
            buildingType: designData?.meta?.buildingType || spaceData?.buildingData?.buildingType || 'N/A'
          },
          
          // Indoor Units from equipment data
          indoorUnits: generateIndoorUnitsSection(),
          
          // Outdoor Units from equipment data
          outdoorUnits: generateOutdoorUnitsSection(),
          
          // Accessories from inventory data
          accessories: inventoryData?.inventory || {},
          
          // Cost Summary
          summary: calculateCostSummary()
        };
        
        setBOQData(boq);
        console.log('✅ BOQ generated successfully:', boq);
        // Don't show success toast on initial generation, only on save
      } catch (error) {
        console.error('❌ Error generating BOQ:', error);
        toast.error('Error generating BOQ. Please check your data.');
        setBOQData(null);
      } finally {
        setLoading(false);
      }
    };

    generateBOQ();
  }, [designData, spaceData, equipmentData, inventoryData]);

  // Save BOQ data to Firebase
  const handleSaveBOQ = async () => {
    if (!boqData || !projectId || !user) {
      toast.error('Unable to save BOQ. Missing required data.');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Saving BOQ data to Firebase...');
      
      // Convert objects with invalid Firebase keys to arrays
      const sanitizeBOQData = (data) => {
        return {
          projectInfo: data.projectInfo,
          // Convert indoor units object to array to avoid key issues
          indoorUnits: Object.values(data.indoorUnits || {}),
          // Convert outdoor units object to array
          outdoorUnits: Object.values(data.outdoorUnits || {}),
          // Convert accessories object to array
          accessories: Object.values(data.accessories || {}),
          summary: data.summary
        };
      };
      
      const sanitizedBOQData = sanitizeBOQData(boqData);
      
      await HVACDataService.saveProjectData(projectId, {
        boqData: sanitizedBOQData,
        currentStep: 5,
        completed: true,
        completedAt: new Date().toISOString()
      }, user.uid);
      
      setIsSaved(true);
      console.log('✅ BOQ saved successfully');
      
      // Notify parent component
      if (onSave) {
        onSave(boqData);
      }
      
      toast.success('BOQ saved successfully! Redirecting to projects...');
      
      // Redirect to projects page after a short delay
      setTimeout(() => {
        navigate('/projects');
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error saving BOQ:', error);
      toast.error('Failed to save BOQ. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Register export function with parent
  useEffect(() => {
    const exportToPDF = () => {
      if (!boqData) {
        toast.error('No BOQ data to export');
        return;
      }
      
      try {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('BILL OF QUANTITIES', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Project: ${boqData.projectInfo.name}`, 20, 35);
        doc.text(`Project No: ${boqData.projectInfo.number}`, 20, 45);
        doc.text(`Date: ${boqData.projectInfo.date}`, 20, 55);
        
        let yPosition = 70;
        
        // Indoor Units Table
        if (Object.keys(boqData.indoorUnits).length > 0) {
          doc.setFontSize(14);
          doc.text('INDOOR UNITS', 20, yPosition);
          yPosition += 10;
          
          const iduData = Object.values(boqData.indoorUnits).map(unit => [
            unit.type,
            unit.quantity,
            unit.unit,
            `Rs ${unit.unitPrice.toLocaleString('en-IN')}`,
            `Rs ${unit.totalPrice.toLocaleString('en-IN')}`
          ]);
          
          autoTable(doc, {
            head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
            body: iduData,
            startY: yPosition,
            theme: 'striped'
          });
          
          yPosition = doc.lastAutoTable.finalY + 15;
        }
        
        // Outdoor Units Table
        if (Object.keys(boqData.outdoorUnits).length > 0) {
          doc.setFontSize(14);
          doc.text('OUTDOOR UNITS', 20, yPosition);
          yPosition += 10;
          
          const oduData = Object.values(boqData.outdoorUnits).map(unit => [
            unit.type,
            unit.quantity,
            unit.unit,
            `Rs ${unit.unitPrice.toLocaleString('en-IN')}`,
            `Rs ${unit.totalPrice.toLocaleString('en-IN')}`
          ]);
          
          autoTable(doc, {
            head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
            body: oduData,
            startY: yPosition,
            theme: 'striped'
          });
          
          yPosition = doc.lastAutoTable.finalY + 15;
        }
        
        // Summary
        doc.setFontSize(14);
        doc.text('COST SUMMARY', 20, yPosition);
        yPosition += 10;
        
        const summaryData = [
          ['Indoor Units Total', `Rs ${boqData.summary.totalIDU.toLocaleString('en-IN')}`],
          ['Outdoor Units Total', `Rs ${boqData.summary.totalODU.toLocaleString('en-IN')}`],
          ['Accessories Total', `Rs ${boqData.summary.totalAccessories.toLocaleString('en-IN')}`],
          ['Subtotal', `Rs ${boqData.summary.subtotal.toLocaleString('en-IN')}`],
          ['GST (18%)', `Rs ${boqData.summary.gst.toLocaleString('en-IN')}`],
          ['Grand Total', `Rs ${boqData.summary.grandTotal.toLocaleString('en-IN')}`]
        ];
        
        autoTable(doc, {
          body: summaryData,
          startY: yPosition,
          theme: 'plain',
          styles: { fontSize: 12 }
        });
        
        // Save the PDF
        doc.save(`BOQ_${boqData.projectInfo.number}_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('BOQ exported to PDF successfully!');
        
      } catch (error) {
        console.error('Error exporting PDF:', error);
        toast.error('Error exporting PDF');
      }
    };

    if (onRegisterExport) {
      onRegisterExport(exportToPDF);
    }
  }, [boqData, onRegisterExport]);

  if (loading) {
    return (
      <div className="boq-loading">
        <div className="loading-spinner"></div>
        <p>Generating BOQ...</p>
      </div>
    );
  }

  if (!boqData) {
    return (
      <div className="boq-error">
        <h3>📋 BOQ Generation Pending</h3>
        <p>Please complete all the following steps to generate your Bill of Quantities:</p>
        <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '0.5rem 0', color: spaceData?.roomCalculations && Object.keys(spaceData.roomCalculations).length > 0 ? '#10b981' : '#dc2626' }}>
              {spaceData?.roomCalculations && Object.keys(spaceData.roomCalculations).length > 0 ? '✅' : '❌'} <strong>Step 1:</strong> Complete Heat Load Calculations
            </li>
            <li style={{ padding: '0.5rem 0', color: equipmentData?.spreadsheetData ? '#10b981' : '#dc2626' }}>
              {equipmentData?.spreadsheetData ? '✅' : '❌'} <strong>Step 2:</strong> Select Equipment (AC Types, Capacities, Quantities)
            </li>
            <li style={{ padding: '0.5rem 0', color: (() => {
              if (!equipmentData?.spreadsheetData) return '#dc2626';
              let hasSelection = false;
              Object.values(equipmentData.spreadsheetData).forEach(floorData => {
                Object.values(floorData.rooms || {}).forEach(room => {
                  if (room.selectedACType && room.acQuantity > 0) {
                    hasSelection = true;
                  }
                });
              });
              return hasSelection ? '#10b981' : '#dc2626';
            })() }}>
              {(() => {
                if (!equipmentData?.spreadsheetData) return '❌';
                let hasSelection = false;
                Object.values(equipmentData.spreadsheetData).forEach(floorData => {
                  Object.values(floorData.rooms || {}).forEach(room => {
                    if (room.selectedACType && room.acQuantity > 0) {
                      hasSelection = true;
                    }
                  });
                });
                return hasSelection ? '✅' : '❌';
              })()} <strong>Step 3:</strong> At least one room has equipment selected
            </li>
          </ul>
        </div>
        <p style={{ marginTop: '2rem', color: '#64748b' }}>
          Once all steps are completed, the BOQ will be automatically generated.
        </p>
        {onBack && (
          <button onClick={onBack} className="btn-back">
            ← Back to Equipment Selection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="boq-container">
      <div className="boq-header">
        <h2>Bill of Quantities (BOQ)</h2>
        <div className="boq-actions">
          {onBack && (
            <button onClick={onBack} className="btn-back">
              ← Back
            </button>
          )}
          <button onClick={() => {
            if (!boqData) {
              toast.error('No BOQ data to export');
              return;
            }
            
            try {
              const doc = new jsPDF();
              
              // Header
              doc.setFontSize(18);
              doc.text('BILL OF QUANTITIES', 105, 20, { align: 'center' });
              
              doc.setFontSize(12);
              doc.text(`Project: ${boqData.projectInfo.name}`, 20, 35);
              doc.text(`Project No: ${boqData.projectInfo.number}`, 20, 45);
              doc.text(`Date: ${boqData.projectInfo.date}`, 20, 55);
              doc.text(`Building Type: ${boqData.projectInfo.buildingType}`, 20, 65);
              
              let yPosition = 80;
              
              // Indoor Units Table
              if (Object.keys(boqData.indoorUnits).length > 0) {
                doc.setFontSize(14);
                doc.text('INDOOR UNITS', 20, yPosition);
                yPosition += 10;
                
                const iduData = Object.values(boqData.indoorUnits).map(unit => [
                  unit.type,
                  unit.quantity,
                  unit.unit,
                  `Rs ${unit.unitPrice.toLocaleString('en-IN')}`,
                  `Rs ${unit.totalPrice.toLocaleString('en-IN')}`
                ]);
                
                autoTable(doc, {
                  head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
                  body: iduData,
                  startY: yPosition,
                  theme: 'striped',
                  headStyles: { fillColor: [41, 128, 185] }
                });
                
                yPosition = doc.lastAutoTable.finalY + 15;
              }
              
              // Outdoor Units Table
              if (Object.keys(boqData.outdoorUnits).length > 0) {
                // Add new page if needed
                if (yPosition > 250) {
                  doc.addPage();
                  yPosition = 20;
                }
                
                doc.setFontSize(14);
                doc.text('OUTDOOR UNITS', 20, yPosition);
                yPosition += 10;
                
                const oduData = Object.values(boqData.outdoorUnits).map(unit => [
                  unit.type,
                  unit.quantity,
                  unit.unit,
                  `Rs ${unit.unitPrice.toLocaleString('en-IN')}`,
                  `Rs ${unit.totalPrice.toLocaleString('en-IN')}`
                ]);
                
                autoTable(doc, {
                  head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
                  body: oduData,
                  startY: yPosition,
                  theme: 'striped',
                  headStyles: { fillColor: [41, 128, 185] }
                });
                
                yPosition = doc.lastAutoTable.finalY + 15;
              }
              
              // Accessories Table (if available)
              if (Object.keys(boqData.accessories).length > 0) {
                // Add new page if needed
                if (yPosition > 250) {
                  doc.addPage();
                  yPosition = 20;
                }
                
                doc.setFontSize(14);
                doc.text('ACCESSORIES', 20, yPosition);
                yPosition += 10;
                
                const accessoryData = Object.values(boqData.accessories).map(item => [
                  item.name || item.type || 'Accessory',
                  item.quantity || 0,
                  item.unit || 'nos',
                  `Rs ${(item.unitPrice || 0).toLocaleString('en-IN')}`,
                  `Rs ${((item.quantity || 0) * (item.unitPrice || 0)).toLocaleString('en-IN')}`
                ]);
                
                autoTable(doc, {
                  head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
                  body: accessoryData,
                  startY: yPosition,
                  theme: 'striped',
                  headStyles: { fillColor: [41, 128, 185] }
                });
                
                yPosition = doc.lastAutoTable.finalY + 15;
              }
              
              // Add new page for summary if needed
              if (yPosition > 220) {
                doc.addPage();
                yPosition = 20;
              }
              
              // Cost Summary
              doc.setFontSize(14);
              doc.text('COST SUMMARY', 20, yPosition);
              yPosition += 10;
              
              const summaryData = [
                ['Indoor Units Total', `Rs ${boqData.summary.totalIDU.toLocaleString('en-IN')}`],
                ['Outdoor Units Total', `Rs ${boqData.summary.totalODU.toLocaleString('en-IN')}`],
                ['Accessories Total', `Rs ${boqData.summary.totalAccessories.toLocaleString('en-IN')}`],
                ['Subtotal', `Rs ${boqData.summary.subtotal.toLocaleString('en-IN')}`],
                ['GST (18%)', `Rs ${boqData.summary.gst.toLocaleString('en-IN')}`],
                ['Grand Total', `Rs ${boqData.summary.grandTotal.toLocaleString('en-IN')}`]
              ];
              
              autoTable(doc, {
                body: summaryData,
                startY: yPosition,
                theme: 'plain',
                styles: { fontSize: 12, cellPadding: 5 },
                columnStyles: {
                  0: { fontStyle: 'bold' },
                  1: { halign: 'right', fontStyle: 'bold' }
                }
              });
              
              // Save the PDF
              doc.save(`BOQ_${boqData.projectInfo.number}_${new Date().toISOString().split('T')[0]}.pdf`);
              toast.success('BOQ exported to PDF successfully!');
              
            } catch (error) {
              console.error('Error exporting PDF:', error);
              toast.error('Error exporting PDF');
            }
          }} className="btn-export">
            Export PDF
          </button>
        </div>
      </div>

      <div className="boq-content">
        {/* Project Info */}
        <div className="project-info-section">
          <h3>Project Information</h3>
          <div className="info-grid">
            <div><strong>Project Name:</strong> {boqData.projectInfo.name}</div>
            <div><strong>Project Number:</strong> {boqData.projectInfo.number}</div>
            <div><strong>Date:</strong> {boqData.projectInfo.date}</div>
            <div><strong>Building Type:</strong> {boqData.projectInfo.buildingType}</div>
          </div>
        </div>

        {/* Indoor Units */}
        {Object.keys(boqData.indoorUnits).length > 0 && (
          <div className="boq-section">
            <h3>Indoor Units</h3>
            <table className="boq-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Model</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  {showPricing && <th>Rate (₹)</th>}
                  {showPricing && <th>Amount (₹)</th>}
                </tr>
              </thead>
              <tbody>
                {Object.values(boqData.indoorUnits).map((unit, index) => (
                  <tr key={index}>
                    <td>{unit.type}</td>
                    <td>{unit.model}</td>
                    <td>{unit.quantity}</td>
                    <td>{unit.unit}</td>
                    {showPricing && <td>₹{unit.unitPrice.toLocaleString()}</td>}
                    {showPricing && <td>₹{unit.totalPrice.toLocaleString()}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Outdoor Units */}
        {Object.keys(boqData.outdoorUnits).length > 0 && (
          <div className="boq-section">
            <h3>Outdoor Units</h3>
            <table className="boq-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Model</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  {showPricing && <th>Rate (₹)</th>}
                  {showPricing && <th>Amount (₹)</th>}
                </tr>
              </thead>
              <tbody>
                {Object.values(boqData.outdoorUnits).map((unit, index) => (
                  <tr key={index}>
                    <td>{unit.type}</td>
                    <td>{unit.model}</td>
                    <td>{unit.quantity}</td>
                    <td>{unit.unit}</td>
                    {showPricing && <td>₹{unit.unitPrice.toLocaleString()}</td>}
                    {showPricing && <td>₹{unit.totalPrice.toLocaleString()}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cost Summary */}
        {showPricing && (
          <div className="boq-section summary-section">
            <h3>Cost Summary</h3>
            <table className="summary-table">
              <tbody>
                <tr>
                  <td>Indoor Units Total</td>
                  <td>₹{boqData.summary.totalIDU.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Outdoor Units Total</td>
                  <td>₹{boqData.summary.totalODU.toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Accessories Total</td>
                  <td>₹{boqData.summary.totalAccessories.toLocaleString()}</td>
                </tr>
                <tr className="subtotal-row">
                  <td><strong>Subtotal</strong></td>
                  <td><strong>₹{boqData.summary.subtotal.toLocaleString()}</strong></td>
                </tr>
                <tr>
                  <td>GST (18%)</td>
                  <td>₹{boqData.summary.gst.toLocaleString()}</td>
                </tr>
                <tr className="total-row">
                  <td><strong>Grand Total</strong></td>
                  <td><strong>₹{boqData.summary.grandTotal.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Action Buttons */}
      <div className="boq-bottom-actions">
        <button 
          onClick={handleSaveBOQ} 
          className={`btn-save-bottom ${isSaved ? 'saved' : ''}`}
          disabled={saving || isSaved}
        >
          {saving ? 'Saving...' : isSaved ? '✓ Saved & Completed' : 'Save & Complete'}
        </button>
      </div>
    </div>
  );
};

export default BOQ;
