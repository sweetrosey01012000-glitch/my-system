import React, { useState, useRef, useEffect } from 'react';
import { Download, Bell, ChevronDown, ChevronUp, BadgeCheck, ShieldCheck } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

function HomeSP({ styles, soloparentData, setActiveTab, announcements, loadingAnnouncements }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [notif, setNotif] = useState(null);
  const [showNotif, setShowNotif] = useState(false);
  const [showFullCondition, setShowFullCondition] = useState(false);
  const d = soloparentData || {};
  const pdfFrontRef = useRef(null);
  const pdfBackRef = useRef(null);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  useEffect(() => {
    if (!d.id &&!d.uid) return;
    const q = query(collection(db, "notifications"), where("uid", "==", d.uid || d.userId || d.id), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const latest = { id: snap.docs[0].id,...snap.docs[0].data() };
        if (!latest.isRead && latest.type === 'benefit_assigned') { setNotif(latest); setShowNotif(true); }
      }
    });
    return () => unsub();
  }, [d.id, d.uid, d.userId]);

  const handleCloseNotif = async () => { if (notif?.id) await updateDoc(doc(db, "notifications", notif.id), { isRead: true }); setShowNotif(false); };
  if (!soloparentData) return <p style={{ textAlign: 'center', padding: '20px', color:C.muted }}>Loading ID...</p>;

  const formatIdNumber = () => {
    if (d.soloParentId && d.soloParentId.trim()!== '') return d.soloParentId;
    const year = d.idYear || d.createdYear || new Date().getFullYear();
    let raw = d.idNumber || '';
    if (/^\d{4}-\d{6}-SP$/.test(raw)) return raw;
    let num = parseInt(String(raw).replace(/\D/g, '').slice(-6)) || d.sequence || 1;
    return `${year}-${String(num).padStart(6, '0')}-SP`;
  };
  const formattedId = formatIdNumber();
  const isAdminAssigned =!!d.soloParentId;
  const benefitCode = d.benefitCode || d.bqc || 'N/A';
  const benefitReason = d.benefitReason || '';
  const rawDeps = d.dependents || [];
  const displayDeps = rawDeps.length >= 5? rawDeps : [...rawDeps,...Array(5 - rawDeps.length).fill({ name: '', dob: '', age: '', relationship: '' })];

  const handleDownloadID = async () => {
    const canvasFront = await html2canvas(pdfFrontRef.current, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const canvasBack = await html2canvas(pdfBackRef.current, { scale: 4, useCORS: true, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', [90, 130]);
    pdf.addImage(canvasFront.toDataURL('image/png'), 'PNG', 2, 6, 85.6, 53.98);
    pdf.setDrawColor(150); pdf.setLineDashPattern([1, 1], 0); pdf.line(2, 62, 87.6, 62);
    pdf.addImage(canvasBack.toDataURL('image/png'), 'PNG', 2, 68, 85.6, 53.98);
    pdf.save(`SoloParent-ID-${formattedId}.pdf`);
  };

  const FrontContent = () => (
    <div style={{ width: '100%', height: '100%', background: '#FFFEF7', border: '0.8px solid #000', fontFamily: 'Arial', color: '#000', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '1.5mm 2mm', borderBottom: '0.8px solid #000', background: 'white', justifyContent: 'space-between' }}>
        <img src="/vids/cavite.png" style={{ width: '10mm', height: '10mm' }} />
        <div style={{ flex: 1, textAlign: 'center', lineHeight: '1.1' }}><p style={{ margin: 0, fontWeight: '700', fontSize: '2.1mm' }}>Republic of the Philippines</p><p style={{ margin: 0, fontWeight: '700', fontSize: '2.1mm' }}>Province of Cavite</p><p style={{ margin: 0, fontSize: '1.7mm' }}>MSWDO - Naic, Cavite</p></div>
        <img src="/vids/naic.jpg" style={{ width: '10mm', height: '10mm' }} />
      </div>
      <div style={{ background: '#FFE500', padding: '1mm', textAlign: 'center', borderBottom: '0.8px solid #000' }}><p style={{ margin: 0, fontWeight: '900', fontSize: '2.6mm' }}>SOLO PARENT IDENTIFICATION CARD</p></div>
      <div style={{ padding: '1.5mm 2mm', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.6mm' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><p style={{ margin: 0, fontWeight: '700', fontSize: '2mm', fontStyle: 'italic' }}>ID No.</p><div style={{ borderBottom: '0.8px solid #000', marginLeft: '2mm', minWidth: '32mm', textAlign: 'center' }}><p style={{ margin: 0, fontSize: '2.4mm', fontWeight: isAdminAssigned? '900' : '400' }}>{formattedId}</p></div></div>
        <div style={{ display: 'flex', gap: '2mm' }}>
          <div style={{ width: '18mm', height: '22mm', border: '0.8px solid #999', background: '#F5F5F0', flexShrink: 0 }}>{d.profilePic? <img src={d.profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ textAlign: 'center', fontSize: '1.7mm', paddingTop: '6mm' }}>1x1 ID<br />Picture</div>}</div>
          <div style={{ flex: 1, fontSize: '1.7mm', display: 'flex', flexDirection: 'column', gap: '0.6mm' }}>
            <div style={{ borderBottom: '0.8px solid #000', textAlign: 'center', paddingBottom: '0.6mm' }}><p style={{ margin: 0, fontWeight: '800', fontSize: '2.8mm', textTransform: 'uppercase' }}>{d.name || 'N/A'}</p></div>
            <div style={{ display: 'flex', borderBottom: '0.5px solid #000', padding: '0.4mm 0' }}><p style={{ margin: 0, fontStyle: 'italic', width: '20mm', fontWeight: '700' }}>Date and Place of Birth:</p><p style={{ margin: 0, flex: 1, textAlign: 'center' }}>{d.birthDate || ''} - {d.birthPlace || ''}</p></div>
            <div style={{ display: 'flex', borderBottom: '0.5px solid #000', padding: '0.4mm 0' }}><p style={{ margin: 0, fontStyle: 'italic', width: '12mm', fontWeight: '700' }}>Address:</p><p style={{ margin: 0, flex: 1, textAlign: 'center' }}>{d.address || ''}</p></div>
            <div style={{ display: 'flex', borderBottom: '0.5px solid #000', padding: '0.4mm 0' }}><p style={{ margin: 0, fontStyle: 'italic', width: '22mm', fontWeight: '700' }}>Category:</p><p style={{ margin: 0, flex: 1, textAlign: 'center' }}>{d.category || ''}</p></div>
            <div style={{ display: 'flex', borderBottom: '0.8px solid #000', background: '#FFF9C4', padding: '0.4mm 0' }}><p style={{ margin: 0, fontStyle: 'italic', width: '22mm', fontWeight: '700' }}>Benefit Code</p><p style={{ margin: 0, color: '#2E9CDB', flex: 1, textAlign: 'center', fontWeight: '900', fontSize: '2.5mm' }}>{benefitCode}</p></div>
          </div>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '1mm' }}>
          <p style={{ margin: 0, fontWeight: '700', fontSize: '1.5mm' }}>This Card is Non-Transferable</p>
          <div style={{ display: 'flex', gap: '2mm', alignItems: 'flex-end' }}><p style={{ margin: 0, fontWeight: '700', fontSize: '1.5mm' }}>Valid Until:</p><div style={{ borderBottom: '0.8px solid #000', minWidth: '32mm', textAlign: 'center' }}><p style={{ margin: 0, fontSize: '1.7mm' }}>{d.expiryDate || 'July 6, 2027'}</p></div></div>
          <div style={{ marginTop: '1.5mm', display: 'flex', justifyContent: 'center' }}><div style={{ textAlign: 'center' }}><div style={{ width: '42mm', height: '5mm', borderBottom: '0.8px solid #000', display: 'flex', justifyContent: 'center' }}>{d.signature && <img src={d.signature} style={{ height: '4.5mm' }} />}</div><p style={{ margin: '0.5mm 0 0 0', fontSize: '1.3mm', fontWeight: '600' }}>Signature or Thumbprint of Solo Parent</p></div></div>
        </div>
      </div>
    </div>
  );
  const BackContent = () => (
    <div style={{ width: '100%', height: '100%', background: '#FFFEF7', border: '0.8px solid #000', fontFamily: 'Arial', color: '#000', boxSizing: 'border-box', padding: '2mm', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><p style={{ margin: 0, fontWeight: '700', fontSize: '1.8mm' }}>DEPENDENTS ({rawDeps.length})</p><p style={{ margin: 0, fontSize: '1.4mm' }}>{formattedId} - {benefitCode}</p></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1mm' }}><thead><tr><th style={{ border: '0.8px solid #000', padding: '0.8mm', fontSize: '1.5mm' }}>NAME</th><th style={{ border: '0.8px solid #000', padding: '0.8mm', fontSize: '1.5mm' }}>DOB</th><th style={{ border: '0.8px solid #000', padding: '0.8mm', fontSize: '1.5mm' }}>AGE</th><th style={{ border: '0.8px solid #000', padding: '0.8mm', fontSize: '1.5mm' }}>RELATION</th></tr></thead><tbody>{displayDeps.map((dep, i) => (<tr key={i}><td style={{ border: '0.8px solid #000', padding: '0.6mm', textAlign: 'center', fontSize: '1.5mm', height: '3.8mm' }}>{dep.name || ''}</td><td style={{ border: '0.8px solid #000', padding: '0.6mm', textAlign: 'center', fontSize: '1.4mm' }}>{dep.dob || ''}</td><td style={{ border: '0.8px solid #000', padding: '0.6mm', textAlign: 'center' }}>{dep.age || ''}</td><td style={{ border: '0.8px solid #000', padding: '0.6mm', textAlign: 'center', fontSize: '1.4mm' }}>{dep.relationship || ''}</td></tr>))}</tbody></table>
      <div style={{ marginTop: '2mm' }}><p style={{ margin: 0, fontWeight: '700', fontSize: '1.6mm' }}>IN CASE OF EMERGENCY:</p><p style={{ margin: 0, fontSize: '1.5mm' }}>Name: {d.emergencyName || ''} | Address: {d.emergencyAddress || ''} | Contact: {d.emergencyContact || ''}</p></div>
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '2mm' }}>
        <div style={{ textAlign: 'center' }}><div style={{ height: '5mm', borderBottom: '0.8px solid #000', width: '30mm' }}></div><p style={{ margin: 0, fontWeight: '700', fontSize: '1.5mm' }}>ROMMEL ANTHONY V. MAGBITANG</p><p style={{ margin: 0, fontSize: '1.2mm' }}>Municipal Mayor</p></div>
        <div style={{ textAlign: 'center' }}><div style={{ height: '5mm', borderBottom: '0.8px solid #000', width: '30mm' }}></div><p style={{ margin: 0, fontWeight: '700', fontSize: '1.5mm' }}>CRISTINA P. ILAGAN, RSW</p><p style={{ margin: 0, fontSize: '1.2mm' }}>MSWDO Head</p></div>
      </div>
    </div>
  );

  const isLongBenefit = benefitCode.includes('A') || benefitCode.includes('B') || benefitReason.length > 200;
  const truncatedReason = benefitReason.slice(0, 180);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 4px', background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
       .sp-home-grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 900px) {.sp-home-grid { grid-template-columns: 1fr!important; } }
      `}</style>

      {showNotif && notif && (
        <div style={{ background: isDark? '#0f2a1e' : '#ECFDF5', border: `2px solid ${isDark? '#1f5a3a' : '#10B981'}`, borderRadius: '12px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <Bell size={22} color="#4ade80" style={{ marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', color: C.text, fontSize: '14px' }}>{notif.title}</h4>
            <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#4ade80', fontWeight: '700' }}>Your Benefit Code is now {notif.benefitCode}</p>
            <div style={{ background: C.card, padding: '10px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: '700', color: C.text }}>CONDITION: </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: C.muted, whiteSpace: 'pre-line' }}>{notif.reason || benefitReason}</p>
            </div>
          </div>
          <button onClick={handleCloseNotif} style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Got it</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', color: C.text, margin: 0, fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Your Digital ID - {formattedId}
            {isAdminAssigned && <span style={{ background: isDark? '#14331f' : '#dcfce7', color: '#4ade80', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px', border:`1px solid ${isDark? '#1f5a2f' : '#86efac'}` }}><BadgeCheck size={12} /> Admin Verified</span>}
          </h2>
          {isAdminAssigned && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#4ade80', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={12}/> Solo Parent ID assigned by MSWDO Admin</p>}
        </div>
        <button style={{ background: '#1E3A8A', color: '#FFE500', borderRadius: '10px', padding: '8px 14px', display: 'flex', gap: '6px', fontWeight: '700', cursor: 'pointer', border: 'none' }} onClick={handleDownloadID}><Download size={18} /> Download ID</button>
      </div>

      <div className="sp-home-grid">
        <div style={{ width: '100%', maxWidth: '380px', aspectRatio: '85.6 / 60', perspective: '1000px', cursor: 'pointer', border: '0.8px solid #000', borderRadius: '6px', overflow: 'hidden' }} onClick={() => setIsFlipped(!isFlipped)}>
          <div style={{ position: 'relative', width: '100%', height: '100%', transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: isFlipped? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
            <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' }}><FrontContent /></div>
            <div style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}><BackContent /></div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '16px', border: `1px solid ${C.border}`, borderRadius: '16px', background: C.card, boxShadow: isDark? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', color: C.text, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#facc15', color:'#000', padding: '4px 8px', borderRadius: '6px', fontSize: '12px' }}>{benefitCode}</span> Benefits & Conditions
            </h3>
            {benefitCode === 'N/A'? (
              <div style={{ padding: '20px', background: C.card2, borderRadius: '12px', textAlign: 'center', border: `1px dashed ${C.border}` }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#facc15', fontWeight: '700' }}>No benefits assigned yet.</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: C.muted }}>Waiting for MSWDO approval. Please check back later.</p>
              </div>
            ) : (
              <>
                <div style={{ background: isDark? '#14331f' : '#f0fdf4', padding: '12px', borderRadius: '10px', border: `1px solid ${isDark? '#1f5a2f' : '#bbf7d0'}`, textAlign: 'center', marginBottom: '12px' }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: isDark? '#4ade80' : '#065F46' }}>Your Benefit Code is {benefitCode}</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: C.muted }}>Assigned by MSWDO</p>
                </div>
                <div style={{ background: C.card2, padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: '800', color: '#facc15', letterSpacing: '0.5px' }}>CONDITIONS & QUALIFICATIONS</p>
                  <p style={{ margin: '8px 0 0 0', fontSize: '12.5px', color: C.text, lineHeight: '1.6', whiteSpace: 'pre-line', display: isLongBenefit &&!showFullCondition? '-webkit-box' : 'block', WebkitLineClamp: isLongBenefit &&!showFullCondition? 4 : 'unset', WebkitBoxOrient: 'vertical', overflow: isLongBenefit &&!showFullCondition? 'hidden' : 'visible' }}>
                    {isLongBenefit &&!showFullCondition? truncatedReason + '...' : benefitReason || 'No specific conditions listed.'}
                  </p>
                  {isLongBenefit && benefitReason.length > 180 && (
                    <button onClick={() => setShowFullCondition(!showFullCondition)} style={{ marginTop: '10px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: '700', color: C.text, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {showFullCondition? <><ChevronUp size={14} /> Show Less</> : <><ChevronDown size={14} /> See More - All Conditions</>}
                    </button>
                  )}
                </div>
                <div style={{ marginTop: '12px', padding: '10px', background: C.card2, borderRadius: '8px', border: `1px solid ${C.border}` }}>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: '700', color: '#facc15' }}>💡 NOTE:</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: C.muted, lineHeight: '1.4' }}>Present your ID {isAdminAssigned? `(${formattedId})` : ''} and this benefit code when claiming assistance at MSWDO office.</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', left: '-10000px', top: 0 }}>
        <div ref={pdfFrontRef} style={{ width: '340px', height: '214px', background: 'white' }}><FrontContent /></div>
        <div ref={pdfBackRef} style={{ width: '340px', height: '214px', background: 'white' }}><BackContent /></div>
      </div>
    </div>
  );
}
export default HomeSP;