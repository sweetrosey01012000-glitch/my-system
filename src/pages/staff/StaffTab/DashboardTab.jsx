import React, { useState, useEffect } from 'react';
import { Users2, FileClock, Wallet, Megaphone, MapPin, TrendingUp, Clock3, BarChart3 } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const DashboardTab = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, claims: 0, announcements: 0 });
  const [barangayData, setBarangayData] = useState([]);
  const [loading, setLoading] = useState(true);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const assignedBarangay = userData?.assignedBarangay || userData?.barangay || 'All Barangays';
  const isAllBarangay =!assignedBarangay || assignedBarangay.toLowerCase().includes('all');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        let spSnap = await getDocs(collection(db, 'soloparent'));
        let spData = spSnap.docs.map(d => ({ id: d.id,...d.data() }));
        if (!isAllBarangay) { spData = spData.filter(d => (d.barangay || d.address || '').toLowerCase().includes(assignedBarangay.toLowerCase())); }
        let pendSnap = await getDocs(collection(db, 'pending_users'));
        let pendData = pendSnap.docs.map(d => ({ id: d.id,...d.data() })).filter(d => (d.status || 'pending').toLowerCase() === 'pending');
        if (!isAllBarangay) pendData = pendData.filter(d => (d.barangay || '').toLowerCase().includes(assignedBarangay.toLowerCase()));
        let claimsSnap = await getDocs(collection(db, 'claims'));
        let claimsData = claimsSnap.docs.map(d => ({ id: d.id,...d.data() }));
        if (!isAllBarangay) claimsData = claimsData.filter(c =>!c.barangay || c.barangay.toLowerCase().includes(assignedBarangay.toLowerCase()));
        let annSnap = await getDocs(query(collection(db, 'announcements'), where('status', '==', 'Published')));
        setStats({ total: spData.length, pending: pendData.length, claims: claimsData.length, announcements: annSnap.size });
        const months = {};
        spData.forEach(d => {
          const dateObj = d.createdAt?.toDate? d.createdAt.toDate() : new Date(d.createdAt || Date.now());
          if (!isNaN(dateObj)) { const month = dateObj.toLocaleString('en-PH', { month: 'short' }); months[month] = (months[month] || 0) + 1; }
        });
        setBarangayData(Object.entries(months).slice(-6).map(([label, value]) => ({ label, value })));
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchAll();
  }, [assignedBarangay, isAllBarangay]);

  if (loading) return <p style={{ padding: '20px', fontSize: '12px', color: C.muted }}>Loading dashboard...</p>;

  const cards = [
    { label: 'Total Solo Parents', value: stats.total, sub: assignedBarangay, icon: Users2, color: isDark? '#60a5fa' : '#1E3A8A', bg: isDark? '#172a4a' : '#dbeafe' },
    { label: 'Pending Applications', value: stats.pending, sub: 'From pending_users', icon: FileClock, color: isDark? '#facc15' : '#92400e', bg: isDark? '#332a0f' : '#fef3c7' },
    { label: 'Total Claims', value: stats.claims, sub: 'All claims', icon: Wallet, color: isDark? '#4ade80' : '#065f46', bg: isDark? '#14331f' : '#dcfce7' },
    { label: 'Active Announcements', value: stats.announcements, sub: 'Published by Admin', icon: Megaphone, color: isDark? '#a78bfa' : '#7c3aed', bg: isDark? '#231e3a' : '#ede9fe' },
  ];
  const maxGraph = Math.max(...barangayData.map(d => d.value), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: C.bg, transition:'0.3s' }}>
      <style>{`
       .dash-wrapper{ background:${C.card}; border-radius:16px; border:1.5px solid ${C.border}; overflow:hidden; box-shadow:${isDark? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'}; }
       .dash-header{ background:${C.card}; padding:14px 16px; border-bottom:3px solid #FACC15; display:flex; justify-content:space-between; align-items:center; }
       .stat-card{ background:${C.card}; border-radius:14px; border:1.5px solid ${C.border}; padding:16px; display:flex; justify-content:space-between; align-items:center; transition: all 0.25s ease; }
       .stat-card:hover{ border-color:#FACC15; box-shadow:0 8px 24px rgba(0,0,0,0.2); transform:translateY(-3px) scale(1.01); }
       .stat-card:hover h3{ color:#FACC15; }
      `}</style>

      <div className="dash-wrapper">
        <div className="dash-header">
          <h2 style={{ fontSize: '16px', fontWeight: '900', color: C.text, margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ width:'32px', height:'32px', background:'#1E3A8A', borderRadius:'9px', display:'flex', alignItems:'center', justifyContent:'center' }}><TrendingUp size={16} color="#FACC15"/></div>
            Staff Dashboard <span style={{ background:C.card2, color:C.muted, fontSize:'10px', fontWeight:'800', padding:'3px 8px', borderRadius:'20px', border:`1px solid ${C.border}`, display:'inline-flex', gap:'4px', alignItems:'center' }}><MapPin size={10}/>{assignedBarangay}</span>
          </h2>
          <div style={{ background:C.card2, borderRadius:'10px', padding:'8px 12px', display:'flex', gap:'6px', alignItems:'center', border:`1px solid ${C.border}` }}><Clock3 size={14} color={C.muted}/><span style={{ fontSize:'11px', fontWeight:'600', color:C.text }}>{new Date().toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit'})}</span></div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'12px' }}>
        {cards.map(c => (
          <div key={c.label} className="stat-card">
            <div>
              <p style={{ margin:0, color:C.muted, fontSize:'10px', fontWeight:'800', textTransform:'uppercase' }}>{c.label}</p>
              <h3 style={{ margin:'6px 0 2px 0', fontSize:'26px', fontWeight:'900', color:C.text, transition:'0.2s' }}>{c.value}</h3>
              <p style={{ margin:0, color:C.muted, fontSize:'10px', display:'flex', gap:'4px', alignItems:'center' }}><MapPin size={10}/>{c.sub}</p>
            </div>
            <div style={{ background:c.bg, padding:'14px', borderRadius:'12px' }}><c.icon size={22} color={c.color}/></div>
          </div>
        ))}
      </div>

      <div className="dash-wrapper" style={{ padding:'16px' }}>
        <h3 style={{ margin:'0 0 12px 0', fontSize:'13px', fontWeight:'800', color:C.text, display:'flex', gap:'6px', alignItems:'center' }}><BarChart3 size={14} color="#facc15"/> Latest Updates - Solo Parents Registration</h3>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'140px' }}>
          {barangayData.length===0? <p style={{ fontSize:'11px', color:C.muted }}>No data yet for {assignedBarangay}</p> : barangayData.map((d,i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
              <div style={{ background:'linear-gradient(180deg, #1E3A8A 0%, #2563eb 100%)', width:'100%', maxWidth:'50px', height:`${(d.value/maxGraph)*100}%`, minHeight:'10px', borderRadius:'8px 8px 4px 4px', display:'flex', justifyContent:'center', paddingTop:'4px' }}>
                <span style={{ fontSize:'10px', fontWeight:'800', color:'#FACC15' }}>{d.value}</span>
              </div>
              <span style={{ fontSize:'10px', fontWeight:'700', color:C.muted }}>{d.label}</span>
            </div>
          ))}
        </div>
        <p style={{ margin:'10px 0 0 0', fontSize:'10px', color:C.muted, textAlign:'right' }}>Updated: {new Date().toLocaleString('en-PH')} • {assignedBarangay}</p>
      </div>
    </div>
  );
};
export default DashboardTab;