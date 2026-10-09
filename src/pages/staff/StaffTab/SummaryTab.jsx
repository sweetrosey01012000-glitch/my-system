import React, { useState, useEffect } from 'react';
import { Download, Search, FileText, MapPin, Users, ShieldCheck } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';

const SummaryTab = ({ reportType: initialType }) => {
  const { userData } = useAuth();
  const [reportType, setReportType] = useState(initialType || 'masterlist');
  const [summaryData, setSummaryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [search, setSearch] = useState('');

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const assignedBarangay = userData?.assignedBarangay || userData?.barangay || 'All Barangay';
  const isAllBarangay = !assignedBarangay || assignedBarangay.toLowerCase().includes('all');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try { const snapshot = await getDocs(collection(db, "soloparent")); const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setSummaryData(data); } 
      catch (e) { console.error("Fetch error:", e); }
      setLoadingSummary(false);
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    let data = [...summaryData];
    if (!isAllBarangay) {
      data = data.filter(d => {
        const dBarangay = (d.barangay || d.address || '').toLowerCase().trim(); const myBarangay = assignedBarangay.toLowerCase().trim();
        return dBarangay.includes(myBarangay) || myBarangay.includes(dBarangay);
      });
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(d => {
        const name = (d.name || d.fullName || `${d.firstName||''} ${d.lastName||''}`).toLowerCase(); const addr = (d.address || d.barangay || '').toLowerCase();
        return name.includes(s) || addr.includes(s) || String(d.age||'').includes(s) || String(d.gender||'').toLowerCase().includes(s);
      });
    }
    if (reportType === 'age') data.sort((a,b) => (parseInt(a.age||0) - parseInt(b.age||0)));
    if (reportType === 'gender') data.sort((a,b) => String(a.gender||'').localeCompare(String(b.gender||'')));
    if (reportType === 'barangay') data.sort((a,b) => String(a.barangay||a.address||'').localeCompare(String(b.barangay||b.address||'')));
    setFilteredData(data);
  }, [summaryData, reportType, assignedBarangay, isAllBarangay, search]);

  const getName = (d) => d.name || d.fullName || `${d.firstName||''} ${d.lastName||''}`.trim() || 'N/A';
  const getGender = (d) => d.gender || d.Gender || 'N/A';
  const getAge = (d) => d.age || d.Age || 'N/A';
  const getAddress = (d) => d.address || d.barangay || 'N/A';
  const handleExport = () => {
    if (!filteredData.length) return alert("No data to export");
    const headers = ["Name","Age","Gender","Address","Barangay"];
    const rows = filteredData.map(d => [`"${getName(d)}"`,`"${getAge(d)}"`,`"${getGender(d)}"`,`"${String(getAddress(d)).replace(/"/g,'""')}"`,`"${String(d.barangay||'').replace(/"/g,'""')}"`]);
    const csv = [headers.join(","),...rows.map(r=>r.join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Report_${reportType}_${assignedBarangay}_${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
        .summary-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; box-shadow: ${isDark? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'}; }
        .summary-header { background: ${C.card}; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid ${C.border}; }
        .th-white { padding: 12px 14px; text-align: left; font-weight: 800; font-size: 11px; color: ${C.muted}; background: ${C.card}; border-bottom: 3px solid #FACC15; letter-spacing: 0.3px; }
        .td-cell { padding: 10px 14px; font-size: 12.5px; border-bottom: 1px solid ${C.border}; color: ${C.text}; }
        .row-hover:hover { background: ${C.card2}!important; }
        .search-inter { padding: 9px 14px 9px 34px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 12px; width: 200px; outline: none; background:${C.card2}; color:${C.text}; }
        .search-inter:focus { border-color: #FACC15!important; box-shadow: 0 0 0 3px rgba(250,204,21,0.2); }
      `}</style>

      <div className="summary-wrapper">
        <div className="summary-header">
          <h2 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#1E3A8A', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={16} color="#FACC15" /></div>
            Summary Report <span style={{ background: C.card2, color: C.muted, fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', gap: '4px', alignItems: 'center' }}><MapPin size={10}/>{isAllBarangay ? 'All Barangay' : assignedBarangay}</span>
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input className="search-inter" placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={handleExport} style={{ background: '#1E3A8A', color: '#FACC15', borderRadius: '10px', padding: '9px 14px', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: '800', fontSize: '12px', border: 'none', cursor: 'pointer' }}><Download size={14}/> Export</button>
          </div>
        </div>

        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: C.card2, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Users size={14} color={C.muted} />
            <p style={{ margin: 0, color: C.muted, fontSize: '12px', fontWeight: '700' }}>{filteredData.length} total records</p>
            <span style={{ fontSize: '11px', color: C.muted }}>• {reportType}</span>
            {!isAllBarangay && <span style={{ fontSize: '11px', color: '#4ade80', background: isDark? '#14331f' : '#dcfce7', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', border: `1px solid ${isDark? '#1f5a2f' : '#86efac'}` }}>Filtered by your barangay</span>}
          </div>
          <select value={reportType} onChange={(e)=>setReportType(e.target.value)} style={{ padding: '8px 12px', border: `1.5px solid ${C.border}`, borderRadius: '8px', fontSize: '12px', fontWeight: '600', background: C.card, color:C.text, outline: 'none' }}>
            <option value="masterlist">Master List</option><option value="age">List Based on Age</option><option value="gender">List Based on Gender</option><option value="barangay">Barangay Breakdown</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loadingSummary? <p style={{padding:'20px', fontSize:'12px', color:C.muted}}>Loading...</p> : filteredData.length === 0? <div style={{padding:'36px 20px', textAlign:'center'}}><MapPin size={32} color={C.muted} style={{margin:'0 auto 8px'}}/><p style={{margin:0, fontSize:'13px', color:C.muted, fontWeight:'600'}}>No records for {isAllBarangay? 'any barangay' : assignedBarangay}</p><p style={{margin:'4px 0 0 0', fontSize:'11px', color:C.muted}}>{!isAllBarangay? `Only ${assignedBarangay} records are shown to you` : 'Check collection name in Firebase'}</p></div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead style={{ background: C.card }}><tr><th className="th-white">NAME</th><th className="th-white">AGE</th><th className="th-white">GENDER</th><th className="th-white">ADDRESS / BARANGAY</th></tr></thead>
              <tbody>
                {filteredData.map(d=>(
                  <tr key={d.id} className="row-hover">
                    <td className="td-cell" style={{ fontWeight:'700', color:C.text }}>{getName(d)}</td>
                    <td className="td-cell">{getAge(d)}</td>
                    <td className="td-cell"><span style={{ background: getGender(d).toLowerCase()==='female'? (isDark? '#3a1f2a' : '#fce7f3') : (isDark? '#172a4a' : '#dbeafe'), border: `1px solid ${getGender(d).toLowerCase()==='female'? (isDark? '#5a2a3a' : '#f9a8d4') : (isDark? '#1e3a5a' : '#93c5fd')}`, padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', color: getGender(d).toLowerCase()==='female'? '#f9a8d4' : '#60a5fa' }}>{getGender(d)}</span></td>
                    <td className="td-cell"><span style={{ display:'flex', gap:'4px', alignItems:'center' }}><MapPin size={12} color={C.muted}/>{getAddress(d)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default SummaryTab;