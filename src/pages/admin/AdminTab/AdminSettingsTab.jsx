import React, { useState, useEffect } from 'react';
import { Settings, Users, FileClock, Database, Lock, Filter, EyeOff, Download, Upload, LogOut, Image as ImageIcon, Type, Save, CheckCheck, Sun, Moon, Palette } from 'lucide-react';
import { auth, db } from '../../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, serverTimestamp, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const AdminSettingsTab = () => {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const toggleTheme = () => {
    const newVal = !isDark;
    localStorage.setItem('sp_dark', newVal);
    setIsDark(newVal);
    window.dispatchEvent(new Event('sp_theme_changed'));
  };
  const C = isDark ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#cbd5e1', muted: '#94a3b8' } : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const [systemName, setSystemName] = useState('MSWD Solo Parent System');
  const [twoFA, setTwoFA] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [passPolicy, setPassPolicy] = useState('3 months');
  const [filterSample, setFilterSample] = useState({ barangay: '', children: '3' });
  const [logs, setLogs] = useState([{ user: 'Admin', action: 'Logged in', time: 'Today 09:21 AM' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        setLogs(snap.docs.map(d => {
          const v = d.data();
          return { user: v.performedByName || 'System', action: v.action, time: v.timestamp?.toDate ? v.timestamp.toDate().toLocaleString() : 'Just now' };
        }));
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => { await signOut(auth); navigate('/'); };
  const handleBackup = async () => {
    const snap = await getDocs(collection(db, 'soloparent'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  };
  const handleSaveSystem = async () => {
    setSaving(true);
    await setDoc(doc(db, 'system_config', 'general'), { systemName, maintenance, updatedAt: serverTimestamp() }, { merge: true });
    setSaving(false); alert('Saved Bes!');
  };

  const card = { background: C.card, borderRadius: '16px', padding: '16px', border: `1px solid ${C.border}`, transition: '0.2s', color: C.text };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <style>{`.hover-card:hover{ transform: translateY(-2px); box-shadow: 0 8px 24px rgba(30,58,138,0.12)!important; border-color:#facc15!important; } input{ background:${C.card2}!important; color:${C.text}!important; border-color:${C.border}!important; }`}</style>

      <div style={card} className="hover-card">
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: isDark ? '#facc15' : '#1E3A8A', display: 'flex', gap: '8px' }}><Settings size={18}/> Admin System Settings</h2>
      </div>

      {/* LIGHT/DARK MODE NASA SETTINGS NA BES! */}
      <div style={card} className="hover-card">
        <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', gap: '6px' }}><Palette size={14}/> Appearance</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.card2, padding: '12px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: isDark ? '#252a38' : '#fef3c7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isDark ? <Moon size={18} color="#facc15"/> : <Sun size={18} color="#d97706"/>}
            </div>
            <div><div style={{ fontSize: '12px', fontWeight: '800' }}>{isDark ? 'Dark Mode' : 'Light Mode'}</div><div style={{ fontSize: '10px', color: C.muted }}>{isDark ? 'Soft dark - masakit? hindi na!' : 'Classic light blue-yellow'}</div></div>
          </div>
          <button onClick={toggleTheme} style={{ width: '52px', height: '28px', borderRadius: '20px', background: isDark ? '#1e3a8a' : '#e2e8f0', border: 'none', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
            <div style={{ width: '22px', height: '22px', background: isDark ? '#facc15' : 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: isDark ? '26px' : '3px', transition: '0.25s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isDark ? '🌙' : '☀️'}</div>
          </button>
        </div>
      </div>

      <div style={card} className="hover-card">
        <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', gap: '6px' }}><Type size={14}/> System Configuration</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input value={systemName} onChange={e=>setSystemName(e.target.value)} placeholder="System Name" style={{ padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '12px' }}/>
          <div style={{ display: 'flex', gap: '8px' }}><button style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}`, fontSize: '11px', fontWeight: '700', display: 'flex', gap: '6px', justifyContent: 'center', background: C.card2, color: C.text }}><ImageIcon size={14}/> Change Logo</button><button onClick={handleSaveSystem} style={{ background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '10px', padding: '0 14px', fontWeight: '800' }}>{saving?'...':<Save size={14}/>}</button></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.card2, padding: '10px', borderRadius: '10px', border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: '11px', fontWeight: '700' }}>Maintenance Mode</p><button onClick={()=>setMaintenance(!maintenance)} style={{ width: '44px', height: '24px', borderRadius: '20px', background: maintenance? '#dc2626' : '#e2e8f0', border: 'none', position: 'relative' }}><div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: maintenance? '22px' : '3px', transition: '0.2s' }}></div></button></div>
        </div>
      </div>

      <div style={card} className="hover-card">
        <h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', gap: '6px' }}><Users size={14}/> Role & Permissions + Access Control Matrix</h3>
        <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: C.card2, borderRadius: '10px', border: `1px solid ${C.border}` }}><span>Staff can view Records</span><span style={{ color: '#16a34a', fontWeight: '800', display: 'flex', gap: '4px' }}><CheckCheck size={12}/> Allowed</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: C.card2, borderRadius: '10px', border: `1px solid ${C.border}` }}><span>Staff can view Sensitive Docs</span><span style={{ color: '#dc2626', fontWeight: '800' }}>Restricted - Data Privacy</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: C.card2, borderRadius: '10px', border: `1px solid ${C.border}` }}><span>Staff can Delete</span><span style={{ color: '#dc2626', fontWeight: '800' }}>Not Allowed</span></div>
        </div>
      </div>

      <div style={card} className="hover-card"><h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', gap: '6px' }}><FileClock size={14}/> Audit Logs</h3>{logs.map((l,i) => (<div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '10px', background: C.card2, borderRadius: '10px', marginBottom: '6px', border: `1px solid ${C.border}` }}><span><b>{l.user}</b> - {l.action}</span><span style={{ color: C.muted, fontSize: '10px' }}>{l.time}</span></div>))}</div>

      <div style={card} className="hover-card"><h3 style={{ fontSize: '13px', fontWeight: '800', margin: '0 0 10px 0', display: 'flex', gap: '6px' }}><Filter size={14}/> Beneficiary Selection Filters</h3><p style={{ fontSize: '10px', color: C.muted, margin: '0 0 8px 0' }}>Hal. "Ilabas lahat ng solo parent sa Barangay X na may 3+ anak" para sa grocery/educational assistance</p><div style={{ display: 'flex', gap: '8px' }}><input value={filterSample.barangay} onChange={e=>setFilterSample({...filterSample, barangay: e.target.value})} placeholder="Barangay" style={{ flex: 1, padding: '10px', borderRadius: '10px', fontSize: '11px' }}/><input value={filterSample.children} onChange={e=>setFilterSample({...filterSample, children: e.target.value})} type="number" style={{ width: '80px', padding: '10px', borderRadius: '10px', fontSize: '11px' }}/><button onClick={()=>alert(`Filter: ${filterSample.barangay} ${filterSample.children}+ kids`)} style={{ background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '10px', padding: '0 12px', fontWeight: '800', fontSize: '11px' }}>Filter</button></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={card} className="hover-card"><h3 style={{ fontSize: '12px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', gap: '6px' }}><Database size={14}/> Backup & Recovery</h3><div style={{ display: 'flex', gap: '8px' }}><button onClick={handleBackup} style={{ flex: 1, padding: '10px', background: isDark? '#14331f' : '#dcfce7', color: isDark? '#4ade80' : '#166534', border: `1px solid ${isDark? '#1f5a2f' : '#bbf7d0'}`, borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'flex', gap: '4px', justifyContent: 'center' }}><Download size={12}/> Backup</button><button style={{ flex: 1, padding: '10px', background: isDark? '#332a0f' : '#fef3c7', color: isDark? '#facc15' : '#92400e', border: `1px solid ${isDark? '#5a4a1f' : '#fde68a'}`, borderRadius: '10px', fontSize: '11px', fontWeight: '800', display: 'flex', gap: '4px', justifyContent: 'center' }}><Upload size={12}/> Restore</button></div></div>
        <div style={card} className="hover-card"><h3 style={{ fontSize: '12px', fontWeight: '800', margin: '0 0 8px 0', display: 'flex', gap: '6px' }}><Lock size={14}/> Security Settings</h3><div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}><div style={{ display: 'flex', justifyContent: 'space-between', background: C.card2, padding: '8px', borderRadius: '8px' }}><span>Pass Policy: {passPolicy}</span><button onClick={()=>setPassPolicy(passPolicy==='3 months'?'6 months':'3 months')} style={{ fontSize: '10px', background: C.card, border: `1px solid ${C.border}`, color: C.text, borderRadius: '6px', padding: '4px 8px' }}>Change</button></div><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.card2, padding: '8px', borderRadius: '8px' }}><span>2FA</span><button onClick={()=>setTwoFA(!twoFA)} style={{ width: '36px', height: '20px', borderRadius: '20px', background: twoFA? '#1E3A8A' : '#e2e8f0', border: 'none', position: 'relative' }}><div style={{ width: '14px', height: '14px', background: 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: twoFA? '18px' : '3px', transition: '0.2s' }}></div></button></div></div></div>
      </div>
    </div>
  );
};
export default AdminSettingsTab;