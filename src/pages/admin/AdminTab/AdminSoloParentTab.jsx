import React, { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Search, Eye, Edit3, Save, X, BadgeCheck, Sparkles, Calendar, Clock } from 'lucide-react';

function AdminSoloParentTab({ soloParents, showToast }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark
   ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#e2e8f0', muted: '#94a3b8', yellow: '#facc15' }
    : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', yellow: '#facc15' };

  const formatDate = (ts) => {
    if (!ts) return 'N/A';
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return 'N/A'; }
  };
  const formatTime = (ts) => {
    if (!ts) return '';
    try { const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
  };

  const filtered = soloParents.filter(s => {
    const st = (s.status || '').toLowerCase();
    return st === 'approved' || st === 'active';
  }).filter(s => {
    const q = search.toLowerCase();
    return (s.name || s.firstName || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q) || (s.soloParentId || s.idNumber || '').toLowerCase().includes(q) || (s.barangay || '').toLowerCase().includes(q);
  }).sort((a,b) => (b.approvedAt?.seconds || b.createdAt?.seconds || 0) - (a.approvedAt?.seconds || a.createdAt?.seconds || 0));

  const openView = (data) => {
    setSelected(data);
    setEditForm({
      soloParentId: data.soloParentId || data.idNumber || '',
      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`,
      email: data.email || '',
      contactNumber: data.contactNumber || data.mobile || data.contact || '',
      barangay: data.barangay || '',
      category: data.category || data.soloParentCategory || '',
      status: data.status || 'approved',
      address: data.address || '',
      benefitCode: data.benefitCode || 'A & B',
    });
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!editForm.soloParentId) { alert('Solo Parent ID is required!'); return; }
    try {
      await updateDoc(doc(db, 'soloparent', selected.id), {
        soloParentId: editForm.soloParentId,
        idNumber: editForm.soloParentId,
        name: editForm.name,
        contactNumber: editForm.contactNumber,
        barangay: editForm.barangay,
        category: editForm.category,
        status: editForm.status,
        address: editForm.address,
        benefitCode: editForm.benefitCode,
        updatedByAdmin: true,
        updatedAt: serverTimestamp(),
      });
      showToast && showToast('Updated successfully');
      setSelected(null);
    } catch (e) { alert('Failed to update: ' + e.message); }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, transition: '0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
       .records-card {
          background: ${C.card};
          border-radius: 16px;
          border: 1.5px solid ${C.border};
          box-shadow: ${isDark? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.04)'};
          overflow: hidden;
          transition: all 0.3s;
        }
       .records-card:hover { box-shadow: ${isDark? '0 6px 24px rgba(0,0,0,0.5)' : '0 6px 24px rgba(0,0,0,0.06)'}; border-color: #facc15; }
       .row-hover { transition: all 0.2s ease; }
       .row-hover:hover { background: ${isDark? '#252a38' : '#fefce8'}!important; }
       .action-btn { background: #1E3A8A; color: white; border: none; padding: 7px 14px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px; transition: all 0.2s; }
       .action-btn:hover { background: #1e40af; transform: translateY(-1px); }
       .search-focus { transition: all 0.2s; font-family: 'Inter', sans-serif !important; background: ${C.card}!important; color: ${C.text}!important; border-color: ${C.border}!important; }
       .search-focus:focus { border-color: #facc15!important; box-shadow: 0 0 0 4px rgba(250,204,21,0.2); background: ${isDark? C.card2 : '#ffffe8'}!important; }
       .approved-badge { background: ${isDark? '#14331f' : '#dcfce7'}; color: ${isDark? '#4ade80' : '#166534'}; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; border: 1px solid ${isDark? '#1f5a2f' : '#86efac'}; }
       .time-badge { background: ${C.card2}; border: 1px solid ${C.border}; padding: 3px 8px; border-radius: 8px; font-size: 10px; color: ${C.muted}; display: inline-flex; align-items: center; gap: 3px; }
       .th-white {
          padding: 14px 16px; text-align: left; font-weight: 800; font-size: 11px; color: ${isDark? C.text : '#1E3A8A'};
          letter-spacing: 0.3px; background: ${C.card}; border-bottom: 3px solid #FACC15;
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: C.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#1E3A8A', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={18} color="#FACC15" /></div>
          Solo Parent Records
        </h2>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input className="search-focus" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, barangay..." style={{ width: '100%', padding: '11px 14px 11px 38px', border: '1.5px solid #e2e8f0', borderRadius: '12px', fontSize: '13px', outline: 'none', fontWeight: '500' }} />
        </div>
      </div>

      <div className="records-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead style={{ background: C.card }}>
              <tr>
                <th className="th-white">SOLO PARENT ID</th>
                <th className="th-white">NAME</th>
                <th className="th-white">BARANGAY</th>
                <th className="th-white"><span style={{display:'flex', gap:'4px', alignItems:'center'}}><Calendar size={12}/> REGISTERED</span></th>
                <th className="th-white"><span style={{display:'flex', gap:'4px', alignItems:'center'}}><Clock size={12}/> APPROVED</span></th>
                <th className="th-white">STATUS</th>
                <th className="th-white">ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: C.muted }}>No approved solo parents yet.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="row-hover" style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '13px 16px', fontWeight: '800', fontFamily: "'Inter', monospace", fontSize: '11px' }}>
                    {s.soloParentId || s.idNumber ? <span style={{ background: '#1E3A8A', color: '#FACC15', padding: '4px 8px', borderRadius: '6px' }}>{s.soloParentId || s.idNumber}</span> : <span style={{ background: C.card2, color: '#f59e0b', padding: '4px 8px', borderRadius: '6px', border: '1px dashed #f59e0b' }}>No ID</span>}
                  </td>
                  <td style={{ padding: '13px 16px', fontWeight: '600', color: C.text }}>{s.name || `${s.firstName || ''} ${s.lastName || ''}`}</td>
                  <td style={{ padding: '13px 16px', color: C.muted }}>{s.barangay || 'N/A'}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                      <span style={{fontSize:'11px', fontWeight:'700', color: C.text}}>{formatDate(s.createdAt || s.registrationDate)}</span>
                      <span className="time-badge"><Clock size={10}/>{formatTime(s.createdAt || s.registrationDate)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{display:'flex', flexDirection:'column', gap:'2px'}}>
                      <span style={{fontSize:'11px', fontWeight:'800', color: isDark? '#4ade80' : '#16a34a'}}>{formatDate(s.approvedAt)}</span>
                      <span className="time-badge" style={{borderColor: isDark? '#1f5a2f' : '#bbf7d0', background: isDark? '#14331f' : '#f0fdf4', color: isDark? '#4ade80' : '#166534'}}>{s.approvedAt ? formatTime(s.approvedAt) : 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 16px' }}><span className="approved-badge">{s.status}</span></td>
                  <td style={{ padding: '13px 16px' }}><button className="action-btn" onClick={() => openView(s)}><Eye size={14} /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelected(null)}>
          <div style={{ background: C.card, borderRadius: '20px', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto', padding: '0', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 3px #facc15', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ background: '#1E3A8A', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: '900', fontSize: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ background: '#FACC15', width: '28px', height: '28px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BadgeCheck size={16} color="#1E3A8A" /></div>{isEditing ? 'Edit Solo Parent' : 'Solo Parent Details'}</h3>
              <div onClick={() => setSelected(null)} style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} color="white" /></div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div style={{ background: isDark? C.card2 : '#fefce8', border: `1.5px solid ${isDark? C.border : '#FACC15'}`, borderRadius: '12px', padding: '12px' }}>
                  <p style={{margin:'0 0 4px 0', fontSize:'10px', fontWeight:'800', color: isDark? C.yellow : '#92400e', display:'flex', gap:'4px', alignItems:'center'}}><Calendar size={12}/> DATE REGISTERED</p>
                  <p style={{margin:0, fontSize:'13px', fontWeight:'800', color: C.text}}>{formatDate(selected.createdAt || selected.registrationDate)}</p>
                  <p style={{margin:'2px 0 0 0', fontSize:'11px', color: C.muted}}>{formatTime(selected.createdAt || selected.registrationDate)}</p>
                </div>
                <div style={{ background: isDark? '#14331f' : '#f0fdf4', border: `1.5px solid ${isDark? '#1f5a2f' : '#86efac'}`, borderRadius: '12px', padding: '12px' }}>
                  <p style={{margin:'0 0 4px 0', fontSize:'10px', fontWeight:'800', color: isDark? '#4ade80' : '#166534', display:'flex', gap:'4px', alignItems:'center'}}><Clock size={12}/> DATE APPROVED</p>
                  <p style={{margin:0, fontSize:'13px', fontWeight:'800', color: isDark? '#4ade80' : '#166534'}}>{formatDate(selected.approvedAt)}</p>
                  <p style={{margin:'2px 0 0 0', fontSize:'11px', color: C.muted}}>{selected.approvedAt ? formatTime(selected.approvedAt) : 'Pending'}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '10px', fontWeight: '800', color: isDark? C.yellow : '#1e3a8a' }}>SOLO PARENT ID *</label>
                  <input disabled={!isEditing} value={editForm.soloParentId} onChange={e => setEditForm({...editForm, soloParentId: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '12px 14px', border: `2px solid ${!editForm.soloParentId? '#facc15' : C.border}`, background: isEditing? (isDark? C.card2 : '#fffff0') : C.card2, borderRadius: '12px', fontWeight: '800', fontSize: '14px', color: C.text }} />
                </div>
                <div><label style={{ fontSize: '10px', fontWeight: '700', color: C.muted }}>Full Name</label><input disabled={!isEditing} value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: '10px', background: isEditing? C.card : C.card2, fontWeight: '600', color: C.text }} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '700', color: C.muted }}>Barangay</label><input disabled={!isEditing} value={editForm.barangay} onChange={e => setEditForm({...editForm, barangay: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: '10px', background: isEditing? C.card : C.card2, color: C.text }} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '700', color: C.muted }}>Contact</label><input disabled={!isEditing} value={editForm.contactNumber} onChange={e => setEditForm({...editForm, contactNumber: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: '10px', background: isEditing? C.card : C.card2, color: C.text }} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: '700', color: C.muted }}>Benefit Code</label><select disabled={!isEditing} value={editForm.benefitCode} onChange={e => setEditForm({...editForm, benefitCode: e.target.value})} style={{ width: '100%', padding: '10px 12px', border: `1.5px solid ${C.border}`, borderRadius: '10px', background: isEditing? C.card : C.card2, fontWeight: '700', color: C.text }}><option>A & B</option><option>A</option><option>B</option></select></div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', gap: '10px' }}>
                {!isEditing? (<button onClick={() => setIsEditing(true)} style={{ flex: 1, padding: '13px', background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}><Edit3 size={16} /> Edit Record</button>) : (<><button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '13px', background: C.card2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontWeight: '700' }}>Cancel</button><button onClick={handleUpdate} style={{ flex: 1, padding: '13px', background: '#FACC15', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', color: '#1e3a8a' }}><Save size={16} /> Update</button></>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSoloParentTab;