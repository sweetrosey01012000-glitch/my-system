import React, { useState, useEffect } from 'react';
import { ShieldCheck, BadgeInfo } from "lucide-react";

function Profile({ soloparentData }) {
  const [formData, setFormData] = useState({});

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  useEffect(() => { if (soloparentData) { setFormData(soloparentData); } }, [soloparentData]);
  if (!soloparentData) return <p style={{ textAlign: 'center', padding: '20px', fontSize: '13px', color: C.muted }}>Loading profile...</p>;
  const d = formData;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px', fontFamily: "'Inter', sans-serif", background: C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
       .profile-wrapper { display: grid; grid-template-columns: 160px 1fr; gap: 28px; }
       .profile-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px 20px; }
       .emergency-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        @media (max-width: 900px) {.profile-wrapper { grid-template-columns: 1fr!important; }.profile-fields { grid-template-columns: 1fr 1fr!important; }.emergency-grid { grid-template-columns: 1fr!important; } }
        @media (max-width: 550px) {.profile-fields { grid-template-columns: 1fr!important; } }
      `}</style>

      <div style={{ background: isDark? '#172a4a' : '#eff6ff', border: `1px solid ${isDark? '#1e3a5a' : '#bfdbfe'}`, borderRadius: '12px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ background: '#1e3a8a', borderRadius: '8px', padding: '6px', display: 'flex' }}><ShieldCheck size={16} color="#facc15" /></div>
        <div>
          <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '800', color: isDark? '#facc15' : '#1e3a8a' }}>View Only - Protected Information</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: C.muted }}>Hindi mo pwedeng i-edit ito. Si MSWDO Admin lang ang pwedeng mag-update kung may kailangang baguhin.</p>
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px', boxShadow: isDark? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '3px solid #facc15', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '900', color: C.text, margin: 0 }}>PROFILE INFORMATION</h2>
          <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: C.muted }}><BadgeInfo size={14} /> READ ONLY</div>
        </div>

        <div className="profile-wrapper">
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '140px', height: '160px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${C.border}`, background: C.card2 }}>
              <img src={d.profilePic || d.photoURL || ''} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '10px', color: C.muted, fontWeight: '700', letterSpacing: '0.5px' }}>ID NUMBER</p>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: C.text }}>{d.idNumber || d.soloParentId || '-'}</p>
            <div style={{ marginTop: '8px', background: isDark? '#14331f' : '#f0fdf4', border: `1px solid ${isDark? '#1f5a2f' : '#bbf7d0'}`, borderRadius: '8px', padding: '6px', fontSize: '10px', fontWeight: '700', color: '#4ade80' }}>VERIFIED</div>
          </div>

          <div className="profile-fields">
            {[
              { label: 'Full Name', k: 'name' }, { label: 'Birth Date', k: 'birthDate' }, { label: 'Birth Place', k: 'birthPlace' },
              { label: 'Address', k: 'address' }, { label: 'Category', k: 'category' }, { label: 'Benefit Code', k: 'bqc' },
              { label: 'Valid Until', k: 'validUntil' }, { label: 'Contact Number', k: 'contactNumber' }, { label: 'Civil Status', k: 'civilStatus' },
            ].map(f => (
              <div key={f.k} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text }}>{d[f.k] || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: C.card2, border: `1px solid ${C.border}`, borderRadius: '12px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '800', color: '#facc15', display: 'flex', gap: '6px', alignItems: 'center' }}>E-Signature</h3>
          <div style={{ background: C.card, borderRadius: '10px', padding: '10px', minHeight: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: `1px solid ${C.border}` }}>
            {d.signature? <img src={d.signature} style={{ maxHeight: '60px' }} alt="signature" /> : <p style={{ fontSize: '12px', color: C.muted }}>No signature on file</p>}
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '900', color: C.text, borderBottom: '2px solid #facc15', paddingBottom: '8px', marginBottom: '12px' }}>DEPENDENTS ({d.dependents?.length || 0})</h3>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: '12px', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead style={{ background: '#1e3a8a' }}><tr><th style={{ padding: '10px 12px', textAlign: 'left', color: '#facc15', fontWeight: '800' }}>Name</th><th style={{ padding: '10px', color: '#facc15', fontWeight: '800' }}>DOB</th><th style={{ padding: '10px', color: '#facc15', fontWeight: '800' }}>Age</th><th style={{ padding: '10px', color: '#facc15', fontWeight: '800' }}>Relationship</th></tr></thead>
              <tbody>{d.dependents?.length > 0? d.dependents.map((dep, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: C.text }}>{dep.name || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center', color: C.muted }}>{dep.dob || '-'}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: '800', color: C.text }}>{dep.age || '-'}</td>
                  <td style={{ padding: '10px', color: C.muted }}>{dep.relationship || '-'}</td>
                </tr>
              )) : <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: C.muted, fontSize: '12px' }}>No dependents</td></tr>}</tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '900', color: C.text, borderBottom: '2px solid #facc15', paddingBottom: '8px', marginBottom: '12px' }}>EMERGENCY CONTACT</h3>
          <div className="emergency-grid">
            {[{ label: 'Name', k: 'emergencyName' }, { label: 'Contact', k: 'emergencyContact' }, { label: 'Address', k: 'emergencyAddress' }].map(f => (
              <div key={f.k} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '12px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: C.muted, fontWeight: '700', textTransform: 'uppercase' }}>{f.label}</p>
                <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: C.text }}>{d[f.k] || '-'}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '20px', background: C.card2, border: `1px dashed ${C.border}`, borderRadius: '10px', padding: '10px 12px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '11px', color: C.muted }}>Kung may mali sa info mo, pumunta sa MSWDO Office para ipa-update kay Admin.</p>
        </div>
      </div>
    </div>
  );
}
export default Profile;