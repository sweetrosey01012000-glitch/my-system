import React from 'react';
import { CheckCircle, GraduationCap, Heart, MessageCircle } from 'lucide-react';

function Assistance({ styles, onAskStaff }) {

  const handleAskStaff = () => {
    // Kung may onAskStaff galing SoloParentPage (bubukas messenger modal)
    if (onAskStaff) {
      onAskStaff();
    }
  };

  const eligibility = [
    "Must be a registered Solo Parent with valid Solo Parent ID",
    "Resident of the municipality/city for at least 6 months",
    "With an active Solo Parent ID and not expired",
    "Not a beneficiary of other similar government assistance for the same purpose"
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* INFO CARD: ELIGIBILITY */}
      <div style={{ ...styles.card }}>
        <h3 style={{ ...styles.cardTitle, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={22} /> Eligibility Requirements
        </h3>
        <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 12px 0' }}>
          To qualify for any assistance program, you must meet the following:
        </p>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {eligibility.map((item, i) => (
            <li key={i} style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>{item}</li>
          ))}
        </ul>
      </div>

      {/* 2 CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* CARD 1: SUBSIDY */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.2)', borderRadius: '10px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #FACC15' }}>
              <Heart size={22} color="#1E3A8A" />
            </div>
            <h3 style={{ margin: 0, color: '#1E3A8A', fontSize: '16px', fontWeight: '800', fontFamily: "'Poppins', sans-serif" }}>
              Subsidy for Indigent Solo Parent Members
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
            Monthly financial assistance for Solo Parents classified as indigent. Subject to validation by MSWD.
          </p>
          <div style={{ fontSize: '12px', color: '#92400E', background: '#FFFBEB', padding: '8px', borderRadius: '8px', fontWeight: '600' }}>
            Status: Available - Contact MSWD for application
          </div>
        </div>

        {/* CARD 2: EDUCATIONAL */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '20px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(250, 204, 21, 0.2)', borderRadius: '10px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #FACC15' }}>
              <GraduationCap size={22} color="#1E3A8A" />
            </div>
            <h3 style={{ margin: 0, color: '#1E3A8A', fontSize: '16px', fontWeight: '800', fontFamily: "'Poppins', sans-serif" }}>
              Educational Assistance for 1 Child
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
            Financial support for school expenses of one (1) child of a registered Solo Parent. From Elementary to College.
          </p>
          <div style={{ fontSize: '12px', color: '#92400E', background: '#FFFBEB', padding: '8px', borderRadius: '8px', fontWeight: '600' }}>
            Status: Available - Requirements apply
          </div>
        </div>
      </div>

      {/* BUTTON CARD - UPDATED */}
      <div style={{ ...styles.card, textAlign: 'center' }}>
        <h3 style={{ ...styles.cardTitle, justifyContent: 'center' }}> Need Help? </h3>
        <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 16px 0' }}>
          Have questions about eligibility or requirements? Our MSWD Staff can help you.
        </p>
        <button
          onClick={handleAskStaff}
          style={{
            padding: '14px 28px',
            background: '#1E3A8A',
            color: '#FACC15',
            border: '2px solid #1E3A8A',
            borderRadius: '12px',
            fontWeight: '800',
            cursor: 'pointer',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {e.currentTarget.style.background = '#152a63'; e.currentTarget.style.transform = 'translateY(-2px)'}}
          onMouseOut={(e) => {e.currentTarget.style.background = '#1E3A8A'; e.currentTarget.style.transform = 'translateY(0)'}}
        >
          <MessageCircle size={18} /> Ask MSWD Staff
        </button>
        <div style={{marginTop:'10px', fontSize:'11px', color:'#64748b'}}>
          One active staff will reply to you. Click to open messages.
        </div>
      </div>
    </div>
  );
}

export default Assistance;