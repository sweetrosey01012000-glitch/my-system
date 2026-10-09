import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Wallet, Megaphone, MapPin, HeartHandshake, Sparkles } from 'lucide-react';

function AdminDashboardTab({ setCurrentView }) {
  const [parents, setParents] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [counts, setCounts] = useState({ solo: 0, staff: 0, fund: 0, ann: 0, forId: 0 });

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
    : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#fef08a', text: '#0f172a', muted: '#64748b', yellow: '#facc15' };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, "soloparent"), snap => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setParents(data);
      const approved = data.filter(p => (p.status || '').toLowerCase() === 'approved').length;
      setCounts(c => ({...c, solo: snap.size, forId: approved }));
    });
    const unsub2 = onSnapshot(collection(db, "staff"), snap => setCounts(c => ({...c, staff: snap.size })));
    const unsub3 = onSnapshot(collection(db, "fund"), snap => {
      let total = 0; snap.forEach(d => total += d.data().totalAmount || d.data().amount || 0);
      setCounts(c => ({...c, fund: total }));
    });
    const unsub4 = onSnapshot(collection(db, "announcements"), snap => setCounts(c => ({...c, ann: snap.size })));
    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, []);

  const barangayData = useMemo(() => {
    const map = {};
    parents.forEach(p => { const b = p.barangay || 'Unknown'; map[b] = (map[b] || 0) + 1; });
    return Object.entries(map).map(([name, total]) => ({ name, total }));
  }, [parents]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.bg, transition: '0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800;900&display=swap');
       .dash-card {
          background: ${C.card};
          padding: 18px;
          border-radius: 18px;
          border: 1.5px solid ${C.border};
          box-shadow: ${isDark? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(30,58,138,0.06)'};
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          position: relative;
          overflow: hidden;
        }
       .dash-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: ${isDark? '0 12px 32px rgba(0,0,0,0.5)' : '0 12px 32px rgba(30,58,138,0.15)'};
          border-color: #facc15;
        }
       .dash-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #facc15, #fbbf24); opacity: 0; transition: opacity 0.3s;
        }
       .dash-card:hover::before { opacity: 1; }
       .main-card {
          background: ${isDark? 'linear-gradient(135deg, #1e222e 0%, #252a38 100%)' : 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)'};
          border: 2.5px solid ${isDark? '#2a2f40' : '#1e3a8a'};
        }
       .main-card:hover {
          border-color: #facc15;
        }
       .icon-box { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: transform 0.3s; }
       .count-text { font-weight: 900; }
       .chart-card {
          background: ${C.card};
          padding: 18px;
          border-radius: 18px;
          border: 1.5px solid ${C.border};
          box-shadow: ${isDark? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)'};
          transition: all 0.3s;
        }
       .chart-card:hover { border-color: #facc15; }
      `}</style>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile? '1fr 1fr' : 'repeat(4, 1fr)', gap: '14px', marginBottom: '18px' }}>
        <div className="dash-card main-card" onClick={() => setCurrentView('solo-parents')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="icon-box" style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)' }}><HeartHandshake size={22} color="#facc15" /></div>
            <div style={{ background: '#1e3a8a', color: '#facc15', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '4px' }}><Sparkles size={10}/> {counts.forId} NEW</div>
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: C.muted, fontWeight: '700', letterSpacing: '0.3px' }}>APPROVED SOLO PARENTS</p>
          <h2 className="count-text" style={{ margin: '2px 0 0 0', fontSize: '34px', color: isDark? '#facc15' : '#1e3a8a' }}>{counts.solo}</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: isDark? C.muted : '#1e3a8a', fontWeight: '800' }}>Click to view →</p>
        </div>

        <div className="dash-card" onClick={() => setCurrentView('staff-table')}>
          <div className="icon-box" style={{ background: isDark? C.card2 : '#fef3c7', border: `1px solid ${C.border}` }}><Users size={20} color={isDark? C.text : "#1e3a8a"} /></div>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: C.muted, fontWeight: '600' }}>Staff Accounts</p>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '28px', fontWeight: '800', color: C.text }}>{counts.staff}</h2>
        </div>

        <div className="dash-card" onClick={() => setCurrentView('fund')}>
          <div className="icon-box" style={{ background: isDark? C.card2 : '#fef3c7', border: `1px solid ${C.border}` }}><Wallet size={20} color={isDark? C.text : "#1e3a8a"} /></div>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: C.muted, fontWeight: '600' }}>Total Fund</p>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: '800', color: C.text }}>₱{counts.fund.toLocaleString()}</h2>
        </div>

        <div className="dash-card" onClick={() => setCurrentView('content')}>
          <div className="icon-box" style={{ background: isDark? C.card2 : '#fef3c7', border: `1px solid ${C.border}` }}><Megaphone size={20} color={isDark? C.text : "#1e3a8a"} /></div>
          <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: C.muted, fontWeight: '600' }}>Announcements</p>
          <h2 style={{ margin: '2px 0 0 0', fontSize: '28px', fontWeight: '800', color: C.text }}>{counts.ann}</h2>
        </div>
      </div>

      <div className="chart-card">
        <h3 style={{ margin: '0 0 14px 0', fontSize: '13px', color: C.text, fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#1e3a8a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={14} color="#facc15" /></div>
          Solo Parents Per Barangay
        </h3>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barangayData.length? barangayData : [{ name: 'No data', total: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark? '#2a2f40' : '#fef3c7'} />
              <XAxis dataKey="name" fontSize={10} tick={{ fill: C.muted, fontWeight: 600 }} axisLine={{ stroke: C.border }} />
              <YAxis fontSize={10} tick={{ fill: C.muted }} axisLine={{ stroke: C.border }} />
              <Tooltip contentStyle={{ background: isDark? C.card2 : '#1e3a8a', border: `1px solid ${C.border}`, borderRadius: '12px', color: isDark? C.text : '#facc15' }} cursor={{ fill: isDark? 'rgba(255,255,255,0.05)' : '#fefce8' }} />
              <Bar dataKey="total" fill="url(#blueYellow)" radius={[8,8,0,0]} />
              <defs>
                <linearGradient id="blueYellow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isDark? '#facc15' : '#1e3a8a'} />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardTab;