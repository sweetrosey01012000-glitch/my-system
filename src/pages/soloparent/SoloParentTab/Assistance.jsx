import React from 'react';
import { CheckCircle, GraduationCap, Heart, MessageCircle } from 'lucide-react';

function Assistance({ styles, onAskStaff }) {
  const handleAskStaff = () => { if (onAskStaff) { onAskStaff(); } };

  // DARK SYNC BES!
  const [isDark, setIsDark] = React.useState(localStorage.getItem('sp_dark') === 'true');
  React.useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const eligibility = [
    "Must be a registered Solo Parent with valid Solo Parent ID",
    "Resident of the municipality/city for at least 6 months",
    "With an active Solo Parent ID and not expired",
    "Not a beneficiary of other similar government assistance for the same purpose"
  ];

  const cardStyle = { background: C.card, borderRadius: '16px', padding: '20px', border: `1.5px solid ${C.border}`, boxShadow: isDark? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Inter', sans-serif", background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
      `}</style>

      {/* INFO CARD: ELIGIBILITY */}
      <div style={{ ...cardStyle }}>
        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: C.text, margin:'0 0 12px 0' }}>
          <CheckCircle size={22} color={isDark? "#facc15" : "#1e3a8a"} /> Eligibility Requirements
        </h3>
        <p style={{ fontSize: '13.5px', color: C.muted, margin: '0 0 12px 0', lineHeight: '1.6' }}>To qualify for any assistance program, you must meet the following:</p>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {eligibility.map((item, i) => (
            <li key={i} style={{ fontSize: '13.5px', color: C.text, lineHeight: '1.6', fontWeight: '500' }}>{item}</li>
          ))}
        </ul>
      </div>

      {/* 2 CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* CARD 1: SUBSIDY */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: C.card2, borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
              <Heart size={22} color="#facc15" />
            </div>
            <h3 style={{ margin: 0, color: C.text, fontSize: '14.5px', fontWeight: '800', lineHeight: '1.3' }}>Subsidy for Indigent Solo Parent Members</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: C.muted, lineHeight: '1.6', margin: 0 }}>Monthly financial assistance for Solo Parents classified as indigent. Subject to validation by MSWD.</p>
          <div style={{ fontSize: '11px', color: '#facc15', background: C.card2, padding: '8px 10px', borderRadius: '8px', fontWeight: '700', border: `1px solid ${C.border}` }}>Status: Available - Contact MSWD for application</div>
        </div>

        {/* CARD 2: EDUCATIONAL */}
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: C.card2, borderRadius: '12px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
              <GraduationCap size={22} color="#facc15" />
            </div>
            <h3 style={{ margin: 0, color: C.text, fontSize: '14.5px', fontWeight: '800', lineHeight: '1.3' }}>Educational Assistance for 1 Child</h3>
          </div>
          <p style={{ fontSize: '12.5px', color: C.muted, lineHeight: '1.6', margin: 0 }}>Financial support for school expenses of one (1) child of a registered Solo Parent. From Elementary to College.</p>
          <div style={{ fontSize: '11px', color: '#facc15', background: C.card2, padding: '8px 10px', borderRadius: '8px', fontWeight: '700', border: `1px solid ${C.border}` }}>Status: Available - Requirements apply</div>
        </div>
      </div>

      {/* BUTTON CARD */}
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <h3 style={{ justifyContent: 'center', fontWeight: '800', color: C.text, margin:'0 0 8px 0', fontSize:'16px' }}>Need Help?</h3>
        <p style={{ fontSize: '13.5px', color: C.muted, margin: '0 0 16px 0' }}>Have questions about eligibility or requirements? Our MSWD Staff can help you.</p>
        <button onClick={handleAskStaff} style={{ padding: '13px 26px', background: '#1e3a8a', color: '#facc15', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(30,58,138,0.2)' }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#152a63'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#1E3A8A'; e.currentTarget.style.transform = 'translateY(0)' }}
        ><MessageCircle size={18} /> Ask MSWD Staff</button>
        <div style={{ marginTop: '10px', fontSize: '11px', color: C.muted }}>One active staff will reply to you. Click to open messages.</div>
      </div>
    </div>
  );
}
export default Assistance;