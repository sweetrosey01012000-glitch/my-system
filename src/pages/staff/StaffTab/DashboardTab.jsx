import React, { useState, useEffect } from 'react';
import { Users2, FileClock, Wallet, Megaphone } from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';

const DashboardTab = ({ styles = {} }) => { 
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    claims: 0,
    announcements: 0
  });
  const [loading, setLoading] = useState(true);

  // FALLBACK STYLE KUNG WALA NAGPADALA
  const defaultCardStyle = {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '2px solid #FACC15',
    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)'
  }

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const spSnap = await getDocs(collection(db, 'soloparent'));
        const pendingSnap = await getDocs(query(collection(db, 'applicants'), where('status', '==', 'pending')));
        const claimsSnap = await getDocs(collection(db, 'claims'));
        const annSnap = await getDocs(query(collection(db, 'announcements'), where('status', '==', 'published')));

        setStats({
          total: spSnap.size,
          pending: pendingSnap.size,
          claims: claimsSnap.size,
          announcements: annSnap.size
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if(loading) return <p style={{ fontSize: '13px', color: '#64748b' }}>Loading...</p>;

  const cards = [
    { label: 'Total Solo Parents', value: stats.total, sub: 'Registered & active', icon: Users2 },
    { label: 'Pending Applications', value: stats.pending, sub: 'Awaiting review', icon: FileClock },
    { label: 'New Claims', value: stats.claims, sub: 'This period', icon: Wallet },
    { label: 'Active Announcements', value: stats.announcements, sub: 'Published', icon: Megaphone },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', margin: 0, fontFamily: "'Poppins', sans-serif" }}>
        Dashboard
      </h2>
      <p style={{ color: '#475569', marginTop: '4px', marginBottom: '20px', fontSize: '13px' }}>
        Overview of solo parent records and activity
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {cards.map(c => (
          <div key={c.label} style={{...(styles.card || defaultCardStyle), padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <p style={{ margin: 0, color: '#475569', fontSize: '12px', fontWeight: '500' }}>{c.label}</p>
              <h3 style={{ margin: '6px 0', fontSize: '20px', fontWeight: '700', color: '#1E3A8A' }}>{c.value}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{c.sub}</p>
            </div>
            <div style={{ background: '#FEF3C7', padding: '10px', borderRadius: '8px', border: '1px solid #FACC15' }}>
              <c.icon size={18} color="#1E3A8A" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ) 
}
export default DashboardTab;