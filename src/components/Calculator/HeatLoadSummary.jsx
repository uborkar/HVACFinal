import React, { useEffect, useMemo, useState } from "react";
import { ref, get, set } from "firebase/database";
import { db } from "../../firebase/config";
import "../common/FormUI.css";

/*
  HeatLoadSummary is the 3rd main step after SpaceConsideredForm.
  It summarizes heat load per floor and lets the user plan IDU/ODU selection.
  Data is persisted under: heatLoadSummary/{projectNumber}/{floor}
*/
export default function HeatLoadSummary({ designData, spaceData, onBack, onNext }) {
  const projectNumber = designData?.meta?.projectNumber || "";
  const floor = designData?.meta?.floor ?? 0;

  const [rows, setRows] = useState([
    { areaName: "", areaSqFt: "", heatLoadSH: "", heatLoadTR: "", iduType: "", machineTR: "", iduCount: "", totalTR: "", mixCFM: "", totalCFM: "", diversityPct: "", oduHP: "", selectedODUHP: "", revisedDiversity: "" }
  ]);
  const [diversityDefault, setDiversityDefault] = useState(0);
  const [loading, setLoading] = useState(true);
  const loadDemo = () => {
    const demo = [
      { areaName: "Reception", areaSqFt: 350, heatLoadSH: 9000, heatLoadTR: 0.75, iduType: "4-Way Cassette", machineTR: 0.8, iduCount: 1, totalTR: 0.8, mixCFM: 350, totalCFM: 350, diversityPct: 0, oduHP: "", selectedODUHP: "", revisedDiversity: "" },
      { areaName: "Conference", areaSqFt: 500, heatLoadSH: 12000, heatLoadTR: 1.0, iduType: "Ducted", machineTR: 1.2, iduCount: 1, totalTR: 1.2, mixCFM: 450, totalCFM: 450, diversityPct: 0, oduHP: "", selectedODUHP: "", revisedDiversity: "" },
      { areaName: "Work Area", areaSqFt: 1200, heatLoadSH: 30000, heatLoadTR: 2.5, iduType: "4-Way Cassette", machineTR: 3.0, iduCount: 2, totalTR: 6.0, mixCFM: 1800, totalCFM: 1800, diversityPct: 0, oduHP: "", selectedODUHP: "", revisedDiversity: "" },
    ];
    setRows(demo);
    setDiversityDefault(10);
  };

  // Compute sensible and total from spaceData if available, use as defaults
  const computedFromSpace = useMemo(() => {
    const ESHT = parseFloat(spaceData?.ESHT || spaceData?.esht || 0);
    const ELHT = parseFloat(spaceData?.ELHT || spaceData?.elht || 0);
    const outside = parseFloat(spaceData?.outsideAirTotal || 0);
    const GTH = parseFloat(spaceData?.GTH || 0) || (ESHT + ELHT + outside);
    const tons = GTH / 12000 || 0;
    const supplyCFM = parseFloat(spaceData?.dehumidifiedCFM || 0);
    const freshCFM = parseFloat(spaceData?.ventilationCFM || 0);
    return { ESHT, ELHT, GTH, tons, supplyCFM, freshCFM };
  }, [spaceData]);

  const addRow = () => setRows((r) => [...r, { areaName: "", areaSqFt: "", heatLoadSH: "", heatLoadTR: "", iduType: "", machineTR: "", iduCount: "", totalTR: "", mixCFM: "", totalCFM: "", diversityPct: diversityDefault, oduHP: "", selectedODUHP: "", revisedDiversity: "" }]);
  const removeRow = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i, field, value) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

  // Load existing summary for this project and floor
  useEffect(() => {
    (async () => {
      if (!projectNumber) { setLoading(false); return; }
      try {
        const snap = await get(ref(db, `heatLoadSummary/${projectNumber}/${floor}`));
        if (snap.exists()) {
          const data = snap.val();
          setRows(Array.isArray(data.rows) && data.rows.length ? data.rows : rows);
          setDiversityDefault(data.diversityDefault ?? 0);
        } else {
          // Set some defaults from space computation if first time
          setRows([{ areaName: "Lower Ground", areaSqFt: designData?.meta?.spaceConsidered ? "" : "", heatLoadSH: computedFromSpace.ESHT.toFixed(2), heatLoadTR: computedFromSpace.tons.toFixed(2), iduType: "", machineTR: computedFromSpace.tons.toFixed(2), iduCount: 1, totalTR: computedFromSpace.tons.toFixed(2), mixCFM: computedFromSpace.supplyCFM.toFixed(2), totalCFM: computedFromSpace.supplyCFM.toFixed(2), diversityPct: 0, oduHP: "", selectedODUHP: "", revisedDiversity: "" }]);
        }
      } catch (e) {
        console.error("Summary load error", e);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectNumber, floor]);

  // Totals
  const totalTR = rows.reduce((s, r) => s + (parseFloat(r.totalTR || r.machineTR || 0) || 0), 0);
  const totalBTU = totalTR * 12000;
  const totalCFM = rows.reduce((s, r) => s + (parseFloat(r.totalCFM || r.mixCFM || 0) || 0), 0);

  const handleSave = async () => {
    if (!projectNumber) { alert("Project Number missing."); return; }
    try {
      const payload = { rows, diversityDefault, totals: { totalTR, totalBTU, totalCFM }, meta: { projectNumber, floor } };
      await set(ref(db, `heatLoadSummary/${projectNumber}/${floor}`), payload);
      if (onNext) onNext(payload);
    } catch (e) {
      console.error("Summary save error", e);
      alert("Error saving summary");
    }
  };

  return (
    <div className="form-page">
      <div className="form-card">
        <header>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
            <h2>Heat Load Summary - Floor {floor}</h2>
            <button type="button" className="calculate-button secondary" onClick={loadDemo}>Load Demo Data</button>
          </div>
        </header>
        <div className="form-body">
          {loading ? (
            <div className="form-section">Loading...</div>
          ) : (
            <>
              <div className="form-section">
                <div className="table-grid-6" style={{gridTemplateColumns:'1.2fr 0.8fr 0.9fr 0.9fr 1fr 0.8fr'}}>
                  <div className="table-header">Area/Zone</div>
                  <div className="table-header">Area (Sq.ft)</div>
                  <div className="table-header">Heat Load (SH) BTU</div>
                  <div className="table-header">Heat Load (TR)</div>
                  <div className="table-header">IDU Type</div>
                  <div className="table-header">Machine (TR)</div>

                  {rows.map((row, i) => (
                    <React.Fragment key={i}>
                      <div className="table-cell"><input value={row.areaName} onChange={(e)=>updateRow(i,'areaName', e.target.value)} /></div>
                      <div className="table-cell"><input type="number" value={row.areaSqFt} onChange={(e)=>updateRow(i,'areaSqFt', e.target.value)} /></div>
                      <div className="table-cell"><input type="number" value={row.heatLoadSH} onChange={(e)=>updateRow(i,'heatLoadSH', e.target.value)} /></div>
                      <div className="table-cell"><input type="number" value={row.heatLoadTR} onChange={(e)=>updateRow(i,'heatLoadTR', e.target.value)} /></div>
                      <div className="table-cell"><input value={row.iduType} onChange={(e)=>updateRow(i,'iduType', e.target.value)} /></div>
                      <div className="table-cell"><input type="number" value={row.machineTR} onChange={(e)=>updateRow(i,'machineTR', e.target.value)} /></div>
                    </React.Fragment>
                  ))}

                  <div className="table-footer">TOTAL (Tonnage)</div>
                  <div className="table-footer"></div>
                  <div className="table-footer">{totalBTU.toFixed(2)}</div>
                  <div className="table-footer">{totalTR.toFixed(2)}</div>
                  <div className="table-footer"></div>
                  <div className="table-footer"></div>
                </div>
                <div style={{marginTop:12, display:'flex', gap:8}}>
                  <button type="button" className="calculate-button" onClick={addRow}>Add Row</button>
                  {rows.length>1 && (
                    <button type="button" className="calculate-button secondary" onClick={()=>removeRow(rows.length-1)}>Remove Last</button>
                  )}
                </div>
              </div>

              {/* IDU Selection sub-table */}
              <div className="form-section">
                <h3>IDU Selection</h3>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>Total TR (sum)</label>
                    <input type="number" readOnly value={totalTR.toFixed(2)} />
                  </div>
                  <div className="form-group">
                    <label>Mix CFM</label>
                    <input type="number" readOnly value={computedFromSpace.supplyCFM.toFixed(2)} />
                  </div>
                  <div className="form-group">
                    <label>Total CFM</label>
                    <input type="number" readOnly value={totalCFM.toFixed(2)} />
                  </div>
                  <div className="form-group">
                    <label>Diversity (%)</label>
                    <input type="number" step="0.1" value={diversityDefault} onChange={(e)=>setDiversityDefault(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* ODU Selection stub */}
              <div className="form-section">
                <h3>ODU Selection</h3>
                <div className="form-grid-3">
                  <div className="form-group">
                    <label>ODU HP</label>
                    <input type="text" placeholder="e.g., 120 HP" />
                  </div>
                  <div className="form-group">
                    <label>Selected ODU (HP)</label>
                    <input type="text" placeholder="e.g., 96 HP" />
                  </div>
                  <div className="form-group">
                    <label>Revised Diversity (%)</label>
                    <input type="number" step="0.1" placeholder="e.g., 120" />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="calculate-button secondary" onClick={onBack}>Back</button>
                <button type="button" className="calculate-button" onClick={handleSave}>Save & Continue</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
