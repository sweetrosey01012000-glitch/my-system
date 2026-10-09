import React, { useState } from 'react';
function RA11861({ styles }) {
  const [expandedLetter, setExpandedLetter] = useState(null);

  // DARK SYNC BES!
  const [isDark, setIsDark] = React.useState(localStorage.getItem('sp_dark') === 'true');
  React.useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const soloParentLetters = [
    { code: 'A', title: 'SINGLE PARENT', items: ['a1. Anak bunga ng panggagahasa kahit walang final hatol','a2. Pagkamatay ng asawa','a3. Nakakulong asawa ng 3 buwan pataas dahil sa kriminal','a4. Piskal/mental na kawalan ng kakayahan - may medical cert','a5. Hiwalay ng 6 buwan o higit pa at siya ang nag-aalaga','a6. Annulment/nullity of marriage at siya ang nag-aalaga','a7. Iniwan ng asawa ng 6 buwan o higit pa'] },
    { code: 'B', title: 'OFW', text: 'Asawa/kamag-anak ng low/semi-skilled OFW na 12 buwan nasa abroad at pinag-iwanan ng bata.' },
    { code: 'C', title: 'UNMARRIED', text: 'Magulang na hindi kasal ngunit mag-isang nag-aalaga, nag-aasikaso at sumusuporta.' },
    { code: 'D', title: 'LEGAL GUARDIAN', text: 'Legal guardian, adoptive o foster parent na mag-isang nag-aalaga at sumusuporta.' },
    { code: 'E', title: 'RELATIVE', text: 'Kamag-anak hanggang 4th degree na kumupkop ng 6 buwan dahil sa pagkamatay, pagkawala, o pag-iwan ng magulang. Kasama senior lolo/lola.' },
    { code: 'F', title: 'PREGNANT', text: 'Buntis na mag-isang nagbibigay ng suporta sa ipinagbubuntis at/o iba pang anak.' },
  ];
  const sections = [
    { title: 'I. Categories of Solo Parent', text: 'Coverage expanded to include: 1. Spouse or family member of low/semi-skilled OFW away for 12 months. 2. Solo grandparents with sole parental care. Reduced: abandonment & legal separation to 6 months. Detention/sentence to 3 months.' },
    { title: 'II. Comprehensive Package', text: 'DSWD Secretary, with govt agencies, CSOs, and NGOs shall develop comprehensive package of social protection services for solo parents and their families.' },
    { title: 'III. Parental Leave', text: 'Entitled to forfeitable and cumulative parental leave of not more than 7 days. Requirement: worked at least 6 months. Priority also in Telecommuting Program under RA 11165.' },
    { title: 'IV. Educational Benefits', text: 'Scholarship programs for solo parents. Full school scholarship for 1 child in basic, higher, and tech-voc education. Requirements: dependent, unmarried, unemployed, 22 years old and below.' },
    { title: 'V. Child Minding Centers', text: 'DOLE and CSC shall encourage establishment of Child-Minding Centers in workplaces or accessible locations for children of solo parents aged 7 and below.' },
    { title: 'VI. Social Safety Assistance', text: 'Entitled to food, medicine, and financial aid during disasters, calamities, pandemics, and other public health crises declared by DOH.' },
    { title: 'VII. Additional Benefits', text: '1. ₱1,000/month cash subsidy for earning minimum wage and below. 2. 10% discount + VAT exemption on baby\'s milk, food supplements, diapers until child is 6. 3. Automatic PhilHealth coverage. 4. Priority in employment, livelihood, scholarships. 5. Preference in low-cost housing.' },
    { title: 'VIII. Solo Parents Database', text: 'DSWD + DILG to set up centralized database of SPIC holders. Solo parents may apply for SPIC by submitting documentary requirements to avail benefits.' },
    { title: 'IX. Protection for Abused', text: 'May seek help from DSWD, brgy officials, and police. Right to retain portion of abusive co-parent income. Assistance extended to adolescent solo parents.' },
  ];

  return (
    <div style={{ ...styles.raContent, fontFamily: "'Inter', sans-serif", background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
      `}</style>

      <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '4px solid #FACC15', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', color: C.text }}>Republic Act No. 11861</h2>
        <p style={{ fontSize: '18px', fontWeight: '800', color: '#facc15', margin: '0 0 8px 0' }}>Expanded Solo Parents Welfare Act</p>
        <p style={{ fontSize: '13px', fontStyle: 'italic', margin: '0', color: C.muted }}>Lapsed into law on June 04, 2022. Amends RA 8972</p>
      </div>

      <div style={{ marginBottom: '28px', padding: '20px', background: C.card, borderRadius: '14px', border: `1px solid ${C.border}`, boxShadow: isDark? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: C.text, margin: '0 0 6px 0', textAlign: 'center' }}>Sinu-sino ang itinuturing na "Solo Parent" ayon sa batas?</h3>
        <div style={{ width: '60px', height: '4px', background: '#FACC15', margin: '0 auto 16px auto', borderRadius: '10px' }} />
        <p style={{ fontSize: '11px', color: C.muted, textAlign: 'center', margin: '0 0 14px 0' }}>Pindutin ang category para makita ang laman</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {soloParentLetters.map((letter, idx) => {
            const isOpen = expandedLetter === letter.code;
            return (
              <div key={idx} style={{ background: C.card2, border: `1px solid ${isOpen ? '#facc15' : C.border}`, borderRadius: '12px', overflow: 'hidden', transition: 'all 0.2s' }}>
                <div onClick={() => setExpandedLetter(isOpen ? null : letter.code)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', cursor: 'pointer', background: isOpen ? (isDark? '#252a1e' : '#fffbeb') : C.card2 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: isOpen ? '#1E3A8A' : '#0f172a', color: isOpen ? '#FACC15' : '#fff', fontWeight: '800', padding: '5px 11px', borderRadius: '8px', fontSize: '13px' }}>{letter.code}</span>
                    <strong style={{ color: C.text, fontSize: '13.5px', fontWeight: '700' }}>{letter.title}</strong>
                  </div>
                  <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: isOpen ? '#1E3A8A' : C.card, color: isOpen ? '#fff' : C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</div>
                </div>
                {isOpen && (
                  <div style={{ padding: '14px 16px', background: isDark? '#1e222e' : '#fffbeb', borderTop: `1px solid ${C.border}` }}>
                    {letter.items ? (
                      <ul style={{ fontSize: '13px', margin: '0', paddingLeft: '18px', lineHeight: '1.8', color: C.text }}>
                        {letter.items.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
                      </ul>
                    ) : (<p style={{ fontSize: '13px', margin: '0', lineHeight: '1.7', color: C.text }}>{letter.text}</p>)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '16px', padding: '16px', background: '#1E3A8A', borderRadius: '12px', color: 'white' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '800', textAlign: 'center' }}>Sinu-sino ang "BATA" o "DEPENDENTS"?</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px', lineHeight: '1.6' }}>
            <div style={{ display: 'flex', gap: '8px' }}><span>☑️</span><span>22 years old and below, walang asawa, umaasa sa suporta</span></div>
            <div style={{ display: 'flex', gap: '8px' }}><span>☑️</span><span>18-22 years old: dapat nag-aaral</span></div>
            <div style={{ display: 'flex', gap: '8px' }}><span>☑️</span><span>22+ kung may pisikal/mental na kapansanan</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        {sections.map((sec, i) => (
          <div key={i} style={{ padding: '16px', background: C.card, borderRadius: '12px', border: `1px solid ${C.border}`, borderLeft: '4px solid #facc15' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: '800', color: C.text, margin: '0 0 8px 0' }}>{sec.title}</h3>
            <p style={{ fontSize: '12.5px', lineHeight: '1.6', margin: 0, color: C.muted }}>{sec.text}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', padding: '16px', background: isDark? '#2a1a1a' : '#fef2f2', borderRadius: '12px', border: `1px solid ${isDark? '#5a2a2a' : '#fecaca'}`, textAlign: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '800', color: C.text, margin: '0 0 6px 0' }}>X. Prohibited Acts & Penalties</h3>
        <p style={{ fontSize: '12.5px', color: C.muted, margin: 0, fontWeight: '500' }}><strong style={{ color: '#ef4444' }}>Fine: ₱50,000 - ₱100,000</strong> and <strong style={{ color: '#ef4444' }}>Jail: 6 months</strong></p>
      </div>
    </div>
  );
}
export default RA11861;