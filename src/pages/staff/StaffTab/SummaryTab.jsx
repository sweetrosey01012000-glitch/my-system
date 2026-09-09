import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const SummaryTab = ({ reportType: initialType, styles }) => {
  // SARILING STATE NA - hindi na need ng prop na setReportType
  const [reportType, setReportType] = useState(initialType || 'masterlist');
  const [summaryData, setSummaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const thStyle = { padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#1E3A8A', fontSize: '11px', background: '#FEF3C7', borderBottom: '1.5px solid #FACC15' };
  const tdStyle = { padding: '12px 16px', fontSize: '13px', borderBottom: '1px solid #FEF3C7' };

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        // TRY MO PALITAN TO KUNG IBA COLLECTION NAME MO
        const snapshot = await getDocs(collection(db, "soloparent"));
        console.log("Fetched:", snapshot.docs.length); // para makita sa console
        const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
        setSummaryData(data);
      } catch (e) { console.error("Fetch error:", e); }
      setLoadingSummary(false);
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    let data = [...summaryData];
    if (reportType === 'age') data.sort((a,b) => (parseInt(a.age||0) - parseInt(b.age||0)));
    if (reportType === 'gender') data.sort((a,b) => String(a.gender||'').localeCompare(String(b.gender||'')));
    if (reportType === 'barangay') data.sort((a,b) => String(a.barangay||a.address||'').localeCompare(String(b.barangay||b.address||'')));
    setFilteredData(data);
  }, [summaryData, reportType]);

  const getName = (d) => d.name || d.fullName || `${d.firstName||''} ${d.lastName||''}`.trim() || 'N/A';
  const getGender = (d) => d.gender || d.Gender || 'N/A';
  const getAge = (d) => d.age || d.Age || 'N/A';
  const getAddress = (d) => d.address || d.barangay || 'N/A';

  const handleExport = () => {
    if (!filteredData.length) return alert("No data to export");
    const headers = ["Name","Age","Gender","Address"];
    const rows = filteredData.map(d => [`"${getName(d)}"`,`"${getAge(d)}"`,`"${getGender(d)}"`,`"${String(getAddress(d)).replace(/"/g,'""')}"`]);
    const csv = [headers.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `Report_${reportType}.csv`; a.click();
  };

  const safeCard = styles?.card || { background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #eee' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', margin: 0 }}>Summary Report</h2>
          <p style={{ color: '#475569', fontSize: '13px' }}>{filteredData.length} total records - {reportType}</p>
        </div>
        <button onClick={handleExport} style={{ background: '#1E3A8A', color: '#FACC15', borderRadius: '8px', padding: '8px 14px', display: 'flex', gap: '6px' }}><Download size={14}/> Export CSV</button>
      </div>

      <div style={{...safeCard, marginBottom: '16px'}}>
        <select value={reportType} onChange={(e)=>setReportType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1.5px solid #FACC15', borderRadius: '6px' }}>
          <option value="masterlist">Master List</option>
          <option value="age">List Based on Age</option>
          <option value="gender">List Based on Gender</option>
          <option value="barangay">Barangay Breakdown</option>
        </select>
      </div>

      <div style={{...safeCard, padding: '0', overflowX: 'auto'}}>
        {loadingSummary? <p style={{padding:'20px'}}>Loading...</p> : filteredData.length === 0? <p style={{padding:'20px'}}>No records - check collection name in Firebase</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={thStyle}>Name</th><th style={thStyle}>Age</th><th style={thStyle}>Gender</th><th style={thStyle}>Address</th></tr></thead>
            <tbody>{filteredData.map(d=>(
              <tr key={d.id}><td style={tdStyle}>{getName(d)}</td><td style={tdStyle}>{getAge(d)}</td><td style={tdStyle}>{getGender(d)}</td><td style={tdStyle}>{getAddress(d)}</td></tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
export default SummaryTab;