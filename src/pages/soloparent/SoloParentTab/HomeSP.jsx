import React, { useState, useRef } from 'react';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function HomeSP({ styles, soloparentData, setActiveTab, announcements, loadingAnnouncements }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const d = soloparentData || {};
  const pdfFrontRef = useRef(null);
  const pdfBackRef = useRef(null);

  if (!soloparentData) return <p style={{ textAlign: 'center', padding: '20px' }}>Loading ID...</p>;

  const dependents = d.dependents?.length > 0 ? d.dependents : [
    { name: '', dob: '', age: '', relationship: '' },
    { name: '', dob: '', age: '', relationship: '' },
    { name: '', dob: '', age: '', relationship: '' },
    { name: '', dob: '', age: '', relationship: '' },
    { name: '', dob: '', age: '', relationship: '' },
  ];

  const handleDownloadID = async () => {
    try {
      await new Promise(r => setTimeout(r, 200));
      const frontEl = pdfFrontRef.current;
      const backEl = pdfBackRef.current;
      const canvasFront = await html2canvas(frontEl, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const canvasBack = await html2canvas(backEl, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });

      // ID SIZE PDF: 90mm x 120mm - front + back sa 1 page
      const pdf = new jsPDF('p', 'mm', [90, 130]); 
      pdf.setFontSize(6);
      pdf.setTextColor(100,100,100);
      pdf.text('CUT HERE - FRONT', 45, 4, { align: 'center' });
      
      // FRONT - exact ID size 85.6 x 53.98mm
      pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 2, 6, 85.6, 53.98);
      
      // line guide
      pdf.setDrawColor(180);
      pdf.setLineDashPattern([1,1], 0);
      pdf.line(2, 62, 87.6, 62);
      
      pdf.text('CUT HERE - BACK', 45, 66, { align: 'center' });
      
      // BACK - exact ID size din
      pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 2, 68, 85.6, 53.98);

      pdf.save(`SoloParent-ID-${d.idNumber || 'card'}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Failed');
    }
  };

  const FrontContent = () => (
    <div style={{ width: '100%', height: '100%', background: 'white', border: '1px solid #000', fontFamily: "'Arial', sans-serif", fontSize: 'clamp(8px, 2.2vw, 11px)', color: '#000', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '1.5mm 2mm', borderBottom: '0.3mm solid #000', flexShrink: 0 }}>
        <img src="https://via.placeholder.com/10" alt="Cavite Logo" style={{ width: '8mm', height: '8mm', marginRight: '2mm' }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: 'clamp(7px, 1.8vw, 2.4mm)' }}>Republic of the Philippines</p>
          <p style={{ margin: 0, fontWeight: '700', fontSize: 'clamp(7px, 1.8vw, 2.4mm)' }}>Province of Cavite</p>
          <p style={{ margin: 0, fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>Municipal Social Welfare and Development Office - Naic, Cavite</p>
        </div>
        <img src="https://via.placeholder.com/10" alt="Naic Logo" style={{ width: '8mm', height: '8mm', marginLeft: '2mm' }} />
      </div>
      <div style={{ background: '#FACC15', padding: '1mm', textAlign: 'center', borderBottom: '0.3mm solid #000', flexShrink: 0 }}>
        <p style={{ margin: 0, fontWeight: '800', fontSize: 'clamp(8px, 2vw, 2.6mm)', letterSpacing: '0.2mm' }}>SOLO PARENT IDENTIFICATION CARD</p>
      </div>
      <div style={{ padding: '2mm', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1mm' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: 'clamp(8px, 2vw, 2.5mm)' }}>ID No.</p>
          <p style={{ margin: '0 0 0 2mm', color: '#DC2626', fontWeight: '700', fontSize: 'clamp(8px, 2vw, 2.5mm)' }}>{d.idNumber || 'N/A'}</p>
        </div>
        <div style={{ display: 'flex', gap: '2mm', flex: 1 }}>
          <div style={{ width: '20mm', height: '24mm', border: '0.3mm solid #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(6px, 1.5vw, 2mm)', textAlign: 'center', flexShrink: 0 }}>
            {d.profilePic ? <img src={d.profilePic} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <>1x1 ID<br />Picture</>}
          </div>
          <div style={{ flex: 1, fontSize: 'clamp(7px, 1.8vw, 2mm)' }}>
            <div style={{ borderBottom: '0.3mm solid #000', marginBottom: '1mm' }}>
              <p style={{ margin: 0, color: '#DC2626', fontWeight: '700', fontSize: 'clamp(9px, 2.5vw, 3mm)', textTransform: 'uppercase', textAlign: 'center' }}>{d.name || 'N/A'}</p>
              <p style={{ margin: 0, fontWeight: '700', textAlign: 'center', fontSize: 'clamp(6px, 1.5vw, 1.8mm)' }}>NAME</p>
            </div>
            <div style={{ display: 'flex', borderBottom: '0.3mm solid #000', marginBottom: '1mm' }}>
              <p style={{ margin: 0, fontStyle: 'italic', width: '35mm' }}>Date and Place of Birth:</p>
              <p style={{ margin: 0, color: '#DC2626', flex: 1 }}>{d.birthDate || 'N/A'}</p>
            </div>
            <div style={{ borderBottom: '0.3mm solid #000', marginBottom: '1mm', textAlign: 'right' }}>
              <p style={{ margin: 0, color: '#DC2626' }}>{d.birthPlace || d.placeOfBirth || 'N/A'}</p>
            </div>
            <div style={{ display: 'flex', borderBottom: '0.3mm solid #000', marginBottom: '1mm' }}>
              <p style={{ margin: 0, fontStyle: 'italic', width: '15mm' }}>Address:</p>
              <p style={{ margin: 0, color: '#DC2626', flex: 1 }}>{d.address || 'N/A'}</p>
            </div>
            <div style={{ display: 'flex', borderBottom: '0.3mm solid #000', marginBottom: '1mm' }}>
              <p style={{ margin: 0, fontStyle: 'italic', width: '35mm' }}>Solo Parent Category:</p>
              <p style={{ margin: 0, color: '#DC2626', textAlign: 'center', flex: 1 }}>{d.category || d.role || 'N/A'}</p>
            </div>
            <div style={{ display: 'flex', borderBottom: '0.3mm solid #000' }}>
              <p style={{ margin: 0, fontStyle: 'italic', width: '35mm' }}>Benefit Qualification Code</p>
              <p style={{ margin: 0, color: '#2563EB', textAlign: 'center', flex: 1 }}>{d.bqc || d.benefitCode || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '1mm' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>This Card is Non-Transferable</p>
          <p style={{ margin: 0, fontWeight: '700', fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>Valid Until: <span style={{ color: '#DC2626' }}>{d.expiryDate || d.validUntil || 'N/A'}</span></p>
          <p style={{ margin: '2mm 0 0 0', textAlign: 'center', fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>Signature or Thumbprint of Solo Parent</p>
        </div>
      </div>
    </div>
  );

  const BackContent = () => (
    <div style={{ width: '100%', height: '100%', background: 'white', border: '1px solid #000', fontFamily: "'Arial', sans-serif", fontSize: 'clamp(7px, 1.8vw, 10px)', color: '#000', boxSizing: 'border-box', padding: '2mm', display: 'flex', flexDirection: 'column' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2mm' }}>
        <thead><tr><th style={{ border: '0.3mm solid #000', padding: '1mm', fontWeight: '700' }}>NAME</th><th style={{ border: '0.3mm solid #000', padding: '1mm', fontWeight: '700' }}>DATE OF BIRTH</th><th style={{ border: '0.3mm solid #000', padding: '1mm', fontWeight: '700' }}>AGE</th><th style={{ border: '0.3mm solid #000', padding: '1mm', fontWeight: '700' }}>RELATIONSHIP</th></tr></thead>
        <tbody>{dependents.slice(0,5).map((dep, i) => (<tr key={i} style={{ color: '#DC2626' }}><td style={{ border: '0.3mm solid #000', padding: '1mm', textAlign: 'center' }}>{dep.name || ''}</td><td style={{ border: '0.3mm solid #000', padding: '1mm', textAlign: 'center' }}>{dep.dob || ''}</td><td style={{ border: '0.3mm solid #000', padding: '1mm', textAlign: 'center' }}>{dep.age || ''}</td><td style={{ border: '0.3mm solid #000', padding: '1mm', textAlign: 'center' }}>{dep.relationship || ''}</td></tr>))}</tbody>
      </table>
      <div style={{ marginTop: '1mm', marginBottom: '3mm' }}>
        <p style={{ margin: '0 0 1mm 0', fontWeight: '700' }}>IN CASE OF EMERGENCY:</p>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div><p style={{ margin: 0 }}>Name: <span style={{ color: '#DC2626' }}>{d.emergencyName || ''}</span></p><p style={{ margin: 0 }}>Address: <span style={{ color: '#DC2626' }}>{d.emergencyAddress || ''}</span></p></div>
          <div><p style={{ margin: 0 }}>Contact Number: <span style={{ color: '#DC2626' }}>{d.emergencyContact || ''}</span></p></div>
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ textAlign: 'center' }}><div style={{ height: '8mm' }}></div><p style={{ margin: 0, fontWeight: '700' }}>{d.mayorName || 'ROMMEL ANTHONY V. MAGBITANG'}</p><p style={{ margin: 0, fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>Municipal Mayor</p></div>
        <div style={{ textAlign: 'center' }}><div style={{ height: '8mm' }}></div><p style={{ margin: 0, fontWeight: '700' }}>{d.mswdoName || 'CRISTINA P. ILAGAN, RSW'}</p><p style={{ margin: 0, fontSize: 'clamp(6px, 1.5vw, 2mm)' }}>MSWDO Head</p></div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 4px' }}>
      <style>{` @media (max-width: 900px) { .sp-home-grid { grid-template-columns: 1fr !important; gap: 16px !important; } .sp-multimedia-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; } } `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <h2 style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#1E3A8A', margin: '0', fontWeight: '800', fontFamily: "'Poppins', sans-serif" }}>Your Digital ID</h2>
        <button style={{ background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '10px', cursor: 'pointer', padding: '8px', display: 'flex' }} onClick={handleDownloadID}><Download size={18} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }} className="sp-home-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto', aspectRatio: '85.6 / 53.98', perspective: '1000px', cursor: 'pointer', overflow: 'hidden', borderRadius: '8px' }} onClick={() => setIsFlipped(!isFlipped)}>
            <div style={{ position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}><FrontContent /></div>
              <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><BackContent /></div>
            </div>
          </div>
          <div style={{ ...styles.card, padding: '16px', border: '1px solid #FEF3C7' }}>
            <h3 style={{ ...styles.cardTitle, fontSize: '16px', marginBottom: '12px' }}>🎥 Multimedia Guides</h3>
            <div className="sp-multimedia-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ border: '1px solid #FEF3C7', borderRadius: '10px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer', background: '#FFFBEB' }}>📹<p style={{margin: '8px 0 0 0', fontSize: '12px'}}>Video Guide</p></div>
              <div style={{ border: '1px solid #FEF3C7', borderRadius: '10px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer', background: '#FFFBEB' }}>🖼️<p style={{margin: '8px 0 0 0', fontSize: '12px'}}>Image Gallery</p></div>
              <div style={{ border: '1px solid #FEF3C7', borderRadius: '10px', padding: '16px 8px', textAlign: 'center', cursor: 'pointer', background: '#FFFBEB' }}>📖<p style={{margin: '8px 0 0 0', fontSize: '12px'}}>Text Guide</p></div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ ...styles.card, padding: '16px', border: '1px solid #FEF3C7' }}>
            <h3 style={{ ...styles.cardTitle, fontSize: '16px' }}>📜 Your Benefits Under RA 11861</h3>
            <ul style={{ paddingLeft: '18px', color: '#334155', fontSize: '13px', lineHeight: '1.6' }}>
              <li>10% Discount on Baby's Milk, Food, and Medicine</li><li>Educational Assistance for Children</li><li>Livelihood and Skills Training Programs</li><li>Priority in Government Housing</li><li>Additional Leave Credits</li>
            </ul>
            <button style={{ ...styles.downloadBtn, width: '100%' }} onClick={() => setActiveTab('ra11861')}>Read Full RA 11861 →</button>
          </div>
          <div style={{ ...styles.card, padding: '16px', border: '1px solid #FEF3C7', maxHeight: '450px', overflowY: 'auto' }}>
            <h3 style={{ ...styles.cardTitle, fontSize: '16px' }}>📢 Latest Updates</h3>
            {loadingAnnouncements ? <p>Loading...</p> : announcements.length === 0 ? <p style={{color: '#64748b'}}>No updates yet.</p> : announcements.map(a => (
              <div key={a.id} style={{marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px dashed #FEF3C7'}}>
                <p style={{margin: 0, fontSize: '11px', color: '#92400E', fontWeight: '600'}}>{a.date?.toDate ? a.date.toDate().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : a.date}</p>
                <p style={{margin: '4px 0 0 0', fontWeight: '700', fontSize: '14px', color: '#1E3A8A'}}>{a.title}</p>
                <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#475569'}}>{a.preview}</p>
              </div>
            ))}
            <button style={{ ...styles.downloadBtn, width: '100%', marginTop: '10px' }} onClick={() => setActiveTab('announcements')}>View All Updates →</button>
          </div>
        </div>
      </div>

      {/* HIDDEN - PANG PDF LANG - 1 PAGE SIZE */}
      <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        <div ref={pdfFrontRef} style={{ width: '340px', height: '214px', background: 'white' }}><FrontContent /></div>
        <div ref={pdfBackRef} style={{ width: '340px', height: '214px', background: 'white' }}><BackContent /></div>
      </div>
    </div>
  );
}
export default HomeSP;