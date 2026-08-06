import React from 'react'; 

function RA11861({ styles }) { 
  const sections = [ 
    { 
      title: 'I. Categories of Solo Parent', 
      text: 'Coverage expanded to include: 1. Spouse or family member of low/semi-skilled OFW away for 12 months. 2. Solo grandparents with sole parental care. Reduced: abandonment & legal separation to 6 months. Detention/sentence to 3 months.' 
    }, 
    { 
      title: 'II. Comprehensive Package of Social Protection Services', 
      text: 'DSWD Secretary, with govt agencies, CSOs, and NGOs shall develop comprehensive package of social protection services for solo parents and their families.' 
    }, 
    { 
      title: 'III. Parental Leave and Telecommuting Programs', 
      text: 'Entitled to forfeitable and cumulative parental leave of not more than 7 days. Requirement: worked at least 6 months. Priority also in Telecommuting Program under RA 11165.' 
    }, 
    { 
      title: 'IV. Educational Benefits', 
      text: 'Scholarship programs for solo parents. Full school scholarship for 1 child in basic, higher, and tech-voc education. Requirements: dependent, unmarried, unemployed, 22 years old and below. Priority to other children.' 
    }, 
    { 
      title: 'V. Child Minding Centers', 
      text: 'DOLE and CSC shall encourage establishment of Child-Minding Centers in workplaces or accessible locations for children of solo parents aged 7 and below.' 
    }, 
    { 
      title: 'VI. Social Safety Assistance', 
      text: 'Entitled to food, medicine, and financial aid during disasters, calamities, pandemics, and other public health crises declared by DOH.' 
    }, 
    { 
      title: 'VII. Additional Benefits', 
      text: '1. ₱1,000/month cash subsidy for earning minimum wage and below. 2. 10% discount + VAT exemption on baby\'s milk, food supplements, diapers until child is 6. 3. Automatic PhilHealth coverage with premium paid by National Govt for earning < ₱250,000. 4. Priority in employment, livelihood, scholarships, OFW reintegration. 5. Preference in low-cost housing with liberal payment.' 
    }, 
    { 
      title: 'VIII. Solo Parents Database', 
      text: 'DSWD + DILG to set up centralized database of SPIC holders. Solo parents may apply for SPIC by submitting documentary requirements to avail benefits.' 
    }, 
    { 
      title: 'IX. Protection for Abused, Abandoned, Neglected, and Adolescent Solo Parents', 
      text: 'May seek help from DSWD, brgy officials, and police. Right to retain portion of abusive co-parent income. Assistance extended to adolescent solo parents including victims of child marriage. Counseling from DSWD and DOH.' 
    }, 
  ]; 

  return ( 
    <div style={styles.raContent}> 
      {/* HEADER */}
      <div style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '3px solid #FACC15', textAlign: 'center' }}> 
        <h2 style={{...styles.raTitle, margin: '0 0 6px 0', fontSize: '22px'}}>Republic Act No. 11861</h2> 
        <p style={{ fontSize: '15px', fontWeight: '700', color: '#1E3A8A', margin: '0 0 8px 0', fontFamily: "'Poppins', sans-serif" }}>
          Expanded Solo Parents Welfare Act
        </p> 
        <p style={{...styles.raText, fontSize: '12px', fontStyle: 'italic', margin: '0 0 10px 0'}}>
          Lapsed into law on June 04, 2022. Amends RA 8972 or "Solo Parents' Welfare Act of 2000"
        </p> 
      </div> 

      {/* SECTION: SINO ANG SOLO PARENT - A to F */}
      <div style={{ marginBottom: '24px', padding: '14px', background: '#FFFBEB', borderRadius: '10px', border: '2px solid #FACC15' }}> 
        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1E3A8A', margin: '0 0 12px 0', fontFamily: "'Poppins', sans-serif", textAlign: 'center' }}>
          Sinu-sino ang itinuturing na "Solo Parent" ayon sa batas?
        </h3> 
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr))', gap: '10px' }}> 
          {/* A */}
          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}> 
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}> 
              <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px' }}>A</span> 
              <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>SINGLE PARENT</strong> 
            </div> 
            <ul style={{ fontSize: '11px', margin: '0', paddingLeft: '14px', lineHeight: '1.5' }}> 
              <li>a1. Anak bunga ng panggagahasa kahit walang final hatol</li> 
              <li>a2. Pagkamatay ng asawa</li> 
              <li>a3. Nakakulong asawa ng 3 buwan pataas dahil sa kriminal</li> 
              <li>a4. Piskal/mental na kawalan ng kakayahan - may medical cert</li> 
              <li>a5. Hiwalay ng 6 buwan o higit pa at siya ang nag-aalaga</li> 
              <li>a6. Annulment/nullity of marriage at siya ang nag-aalaga</li> 
              <li>a7. Iniwan ng asawa ng 6 buwan o higit pa</li> 
            </ul> 
          </div> 
          
          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}>
            <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', marginRight: '6px' }}>B</span>
            <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>OFW</strong>
            <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>Asawa/kamag-anak ng low/semi-skilled OFW na 12 buwan nasa abroad at pinag-iwanan ng bata.</p>
          </div> 

          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}>
            <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', marginRight: '6px' }}>C</span>
            <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>UNMARRIED</strong>
            <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>Magulang na hindi kasal ngunit mag-isang nag-aalaga, nag-aasikaso at sumusuporta.</p>
          </div> 

          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}>
            <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', marginRight: '6px' }}>D</span>
            <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>LEGAL GUARDIAN</strong>
            <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>Legal guardian, adoptive o foster parent na mag-isang nag-aalaga at sumusuporta.</p>
          </div> 

          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}>
            <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', marginRight: '6px' }}>E</span>
            <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>RELATIVE</strong>
            <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>Kamag-anak hanggang 4th degree na kumupkop ng 6 buwan dahil sa pagkamatay, pagkawala, o pag-iwan ng magulang. Kasama senior lolo/lola.</p>
          </div> 

          <div style={{ padding: '10px', background: 'white', borderRadius: '8px', borderLeft: '4px solid #FACC15' }}>
            <span style={{ background: '#1E3A8A', color: 'white', fontWeight: '800', padding: '3px 8px', borderRadius: '5px', fontSize: '12px', marginRight: '6px' }}>F</span>
            <strong style={{ color: '#1E3A8A', fontSize: '13px' }}>PREGNANT</strong>
            <p style={{ fontSize: '11px', margin: '6px 0 0 0' }}>Buntis na mag-isang nagbibigay ng suporta sa ipinagbubuntis at/o iba pang anak.</p>
          </div> 
        </div> 

        <div style={{ marginTop: '14px', padding: '12px', background: '#1E3A8A', borderRadius: '8px', color: 'white' }}> 
          <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontFamily: "'Poppins', sans-serif", textAlign: 'center' }}>
            Sinu-sino ang "BATA" o "DEPENDENTS"?
          </h4> 
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}> 
            <div style={{ display: 'flex', gap: '6px' }}><span>☑️</span><span>22 years old and below, walang asawa, umaasa sa suporta</span></div> 
            <div style={{ display: 'flex', gap: '6px' }}><span>☑️</span><span>18-22 years old: dapat nag-aaral</span></div> 
            <div style={{ display: 'flex', gap: '6px' }}><span>☑️</span><span>22+ kung may pisikal/mental na kapansanan na hindi kaya protektahan sarili</span></div> 
          </div> 
          <p style={{ fontSize: '11px', marginTop: '10px', textAlign: 'center', opacity: 0.9 }}>
            Saan humingi ng tulong: Office of the Municipal Social Welfare and Development
          </p>
        </div> 
      </div> 

      {/* SECTION: I TO IX SUNOD-SUNOD */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100%, 1fr))', gap: '12px' }}> 
        {sections.map((sec, i) => ( 
          <div key={i} style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #E2E8F0' }}> 
            <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', margin: '0 0 6px 0', fontFamily: "'Poppins', sans-serif" }}>{sec.title}</h3> 
            <p style={{...styles.raText, fontSize: '12px', lineHeight: '1.5', margin: 0}}>{sec.text}</p> 
          </div> 
        ))} 
      </div> 

      {/* PENALTIES */}
      <div style={{ marginTop: '16px', padding: '12px', background: '#FEE2E2', borderRadius: '8px', border: '2px solid #FCA5A5' }}> 
        <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#991B1B', margin: '0 0 6px 0', fontFamily: "'Poppins', sans-serif", textAlign: 'center' }}>
          X. Prohibited Acts & Penalties
        </h3> 
        <p style={{ fontSize: '12px', color: '#991B1B', margin: 0, textAlign: 'center'}}>
          <strong>Fine: ₱50,000 - ₱100,000</strong> and <strong>Jail: not less than 6 months</strong> for misinterpreting status or falsifying documents to avail benefits.
        </p> 
      </div> 
    </div> 
  ); 
} 

export default RA11861;