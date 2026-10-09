import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Eye, Search, Wallet, HandHeart, GraduationCap, MapPin, Clock, User as UserIcon, Camera, PenTool, Check, Upload, Trash2, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const ClaimsTab = () => {
  const { userData } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimsTab, setClaimsTab] = useState('Subsidy');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [proofClaim, setProofClaim] = useState(null);
  const [search, setSearch] = useState('');
  const [claimForm, setClaimForm] = useState({ name: '', amount: '', barangay: '' });
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [hasSignature, setHasSignature] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const assignedBarangay = userData?.assignedBarangay || userData?.barangay || 'All Barangay';
  const isAllBarangay =!assignedBarangay || assignedBarangay.toLowerCase().includes('all');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'claims'), where('type', '==', claimsTab));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      if (!isAllBarangay) {
        data = data.filter(c => {
          const cBarangay = (c.barangay || '').toLowerCase().trim(); const myBrgy = assignedBarangay.toLowerCase().trim();
          if (!c.barangay) return true; return cBarangay.includes(myBrgy) || myBrgy.includes(cBarangay);
        });
      }
      data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setClaims(data); setLoading(false);
    });
    return () => unsub();
  }, [claimsTab, assignedBarangay, isAllBarangay]);

  const filteredClaims = claims.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if ((showRecordModal || showProofModal) && canvasRef.current) {
      const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
      ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = isDark? '#e2e8f0' : '#0f172a';
      const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * 2; canvas.height = 150 * 2; ctx.scale(2,2); clearSignature();
    }
  }, [showRecordModal, showProofModal, isDark]);

  const startDraw = (e) => { setIsDrawing(true); const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); const ctx = canvas.getContext('2d'); const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; ctx.beginPath(); ctx.moveTo(x, y); e.preventDefault(); };
  const draw = (e) => { if (!isDrawing) return; const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect(); const ctx = canvas.getContext('2d'); const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; ctx.lineTo(x, y); ctx.stroke(); setHasSignature(true); e.preventDefault(); };
  const endDraw = () => setIsDrawing(false);
  const clearSignature = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); setHasSignature(false); };
  const handleProofImage = (e) => { const file = e.target.files[0]; if (file) { if (file.size > 5*1024*1024) { alert('Max 5MB lang!'); return; } setProofImage(file); setProofPreview(URL.createObjectURL(file)); } };

  const handleRecordClaim = async () => {
    if (!claimForm.name.trim() ||!claimForm.amount) { alert('Name and Amount required'); return; }
    try {
      await addDoc(collection(db, 'claims'), { name: claimForm.name.trim(), amount: Number(claimForm.amount), type: claimsTab, barangay: claimForm.barangay || assignedBarangay, status: 'For Approval', recordedBy: userData?.name || 'Staff', recordedById: userData?.uid || 'staff-id', createdAt: serverTimestamp() });
      setShowRecordModal(false); setClaimForm({ name: '', amount: '', barangay: assignedBarangay }); clearSignature(); setProofImage(null); setProofPreview(''); alert('Claim recorded for Admin approval!');
    } catch (err) { alert('Error: ' + err.message); }
  };
  const openProofModal = (claim) => { setProofClaim(claim); setShowProofModal(true); setProofImage(null); setProofPreview(''); setHasSignature(false); };
  const handleSubmitProofForVerification = async () => {
    if (!proofImage) { alert('Proof photo required! Picture ng solo parent bago ibigay pera'); return; }
    if (!hasSignature) { alert('E-signature ng solo parent required!'); return; }
    setUploading(true);
    try {
      const canvas = canvasRef.current; const signatureDataUrl = canvas.toDataURL('image/png');
      const imgRef = ref(storage, `claims/proofs/${proofClaim.id}_${Date.now()}.jpg`); await uploadBytes(imgRef, proofImage); const proofUrl = await getDownloadURL(imgRef);
      const sigBlob = await (await fetch(signatureDataUrl)).blob(); const sigRef = ref(storage, `claims/signatures/${proofClaim.id}_${Date.now()}.png`); await uploadBytes(sigRef, sigBlob); const sigUrl = await getDownloadURL(sigRef);
      await updateDoc(doc(db, 'claims', proofClaim.id), { status: 'For Verification', proofImageUrl: proofUrl, signatureUrl: sigUrl, proofSubmittedAt: serverTimestamp(), proofSubmittedBy: userData?.name || 'Staff', });
      await addDoc(collection(db, 'notifications'), { title: `Proof Submitted for ${proofClaim.type} - ${proofClaim.barangay}`, message: `${userData?.name} submitted proof (photo + e-signature) for ${proofClaim.name} - ₱${proofClaim.amount}. Please verify before release.`, for: 'admin', claimId: proofClaim.id, isRead: false, createdAt: serverTimestamp() });
      setShowProofModal(false); alert('Proof submitted! Admin will verify bago ma-release pera.');
    } catch (err) { alert('Error: ' + err.message); }
    setUploading(false);
  };

  const getStatusStyle = (status) => {
    if(status === 'Released') return { bg: isDark? '#14331f' : '#dcfce7', color: isDark? '#4ade80' : '#166534', border: isDark? '#1f5a2f' : '#86efac', label: 'Released ✓' };
    if(status === 'For Verification') return { bg: isDark? '#332a0f' : '#fef9c3', color: isDark? '#facc15' : '#854d0e', border: isDark? '#5a4a1f' : '#fde68a', label: 'For Verification' };
    if(status === 'Approved') return { bg: isDark? '#172a4a' : '#dbeafe', color: isDark? '#60a5fa' : '#1e40af', border: isDark? '#1e3a5a' : '#93c5fd', label: 'Approved - Need Proof' };
    if(status === 'For Approval') return { bg: C.card2, color: C.muted, border: C.border, label: 'For Approval' };
    if(status === 'Rejected') return { bg: isDark? '#3a1f1f' : '#fee2e2', color: '#ef4444', border: '#fecaca', label: 'Rejected' };
    return { bg: C.card2, color: C.muted, border: C.border, label: status };
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *{font-family:'Inter',sans-serif!important;}
       .claims-wrapper{background:${C.card};border-radius:16px;border:1.5px solid ${C.border};overflow:hidden;}
       .claims-header{background:${C.card};padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:1px solid ${C.border};}
       .th-white{padding:12px 14px;text-align:left;font-weight:800;font-size:11px;color:${C.muted};background:${C.card};border-bottom:3px solid #FACC15;}
       .td-cell{padding:11px 14px;font-size:12.5px;border-bottom:1px solid ${C.border};color:${C.text};}
       .row-hover:hover{background:${C.card2}!important;}
       .tab-btn{padding:9px 16px;border-radius:10px;border:1.5px solid ${C.border};font-weight:800;cursor:pointer;font-size:12px;background:${C.card2};color:${C.text};display:flex;gap:6px;align-items:center;}
       .tab-btn.active{background:#1E3A8A;color:#FACC15;border-color:#1E3A8A;}
       .search-inter{padding:9px 14px 9px 34px;border:1.5px solid ${C.border};border-radius:10px;font-size:12px;width:200px;outline:none;background:${C.card2};color:${C.text};}
       .icon-btn{width:32px;height:32px;border-radius:8px;border:1.5px solid ${C.border};background:${C.card2};display:flex;align-items:center;justify-content:center;cursor:pointer;}
       .icon-btn.view{color:${C.text};border-color:${C.border};}
       .icon-btn.view:hover{background:#1E3A8A;color:#FACC15;}
       .icon-btn.proof{color:#facc15;border-color:${C.border};background:${C.card2};}
       .icon-btn.proof:hover{background:#FACC15;color:#1E3A8A;}
       .upload-box{border:1.5px dashed ${C.border};border-radius:10px;padding:16px;text-align:center;cursor:pointer;background:${C.card2};}
       .upload-box:hover{border-color:#FACC15;background:${C.card};}
      `}</style>

      <div className="claims-wrapper">
        <div className="claims-header">
          <h2 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#1E3A8A', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={16} color="#FACC15" /></div>
            Claims Tracking <span style={{ background: C.card2, color: C.muted, fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', border: `1px solid ${C.border}` }}><MapPin size={10} style={{display:'inline'}}/> {isAllBarangay? 'All' : assignedBarangay}</span>
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} /><input className="search-inter" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button onClick={() => { setClaimForm({ name: '', amount: '', barangay: assignedBarangay }); setShowRecordModal(true); }} style={{ padding: '9px 14px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', gap: '5px', fontSize: '12px' }}><Plus size={14}/> Record</button>
          </div>
        </div>
        <div style={{ padding: '10px 16px', background: C.card2, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className={`tab-btn ${claimsTab==='Subsidy'? 'active' : ''}`} onClick={() => setClaimsTab('Subsidy')}><HandHeart size={14}/> Subsidy</button>
          <button className={`tab-btn ${claimsTab==='Educational'? 'active' : ''}`} onClick={() => setClaimsTab('Educational')}><GraduationCap size={14}/> Educational</button>
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: C.muted, background: C.card, padding: '4px 8px', borderRadius: '20px', border: `1px dashed ${C.border}`, display: 'flex', gap: '4px', alignItems: 'center' }}><AlertTriangle size={10}/> Proof required bago i-release pera</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading? <p style={{padding:'20px', fontSize:'12px', color:C.muted}}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead><tr><th className="th-white">NAME</th><th className="th-white">AMOUNT</th><th className="th-white">BARANGAY</th><th className="th-white">STATUS</th><th className="th-white">PROOF FOR ADMIN</th><th className="th-white" style={{ textAlign: 'center' }}>ACTION</th></tr></thead>
              <tbody>
                {filteredClaims.length===0? <tr><td colSpan="6" style={{textAlign:'center', padding:'24px', color:C.muted, fontSize:'12px'}}>No claims</td></tr> : filteredClaims.map(claim => { const s = getStatusStyle(claim.status); return (
                  <tr key={claim.id} className="row-hover">
                    <td className="td-cell" style={{ fontWeight:'700' }}>{claim.name}</td>
                    <td className="td-cell" style={{ fontWeight:'800', color:'#facc15' }}>₱{claim.amount?.toLocaleString()}</td>
                    <td className="td-cell"><span style={{ background:C.card2, border:`1px solid ${C.border}`, padding:'3px 8px', borderRadius:'20px', fontSize:'11px' }}>{claim.barangay || 'N/A'}</span></td>
                    <td className="td-cell"><span style={{padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'800', background:s.bg, color:s.color, border:`1px solid ${s.border}`}}>{s.label}</span></td>
                    <td className="td-cell">
                      {claim.proofImageUrl? <span style={{ color:'#4ade80', fontSize:'11px', fontWeight:'800', display:'flex', gap:'4px', alignItems:'center' }}><Check size={12}/> Photo + Signature submitted</span> : claim.status==='Approved'? <span style={{ color:'#facc15', fontSize:'11px', fontWeight:'700' }}>⚠️ Need proof</span> : <span style={{ color:C.muted, fontSize:'11px' }}>-</span>}
                    </td>
                    <td className="td-cell"><div style={{ display:'flex', gap:'6px', justifyContent:'center' }}><button className="icon-btn view" onClick={()=>setSelectedClaim(claim)}><Eye size={14}/></button>{claim.status === 'Approved' && (<button className="icon-btn proof" onClick={()=>openProofModal(claim)}><Camera size={14}/></button>)}</div></td>
                  </tr> ); })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showRecordModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding:'16px' }} onClick={() => setShowRecordModal(false)}>
          <div style={{background:C.card, width:'100%', maxWidth:'440px', borderRadius:'16px', border:'2.5px solid #FACC15', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 16px', background:'#1E3A8A', display:'flex', justifyContent:'space-between', alignItems:'center'}}><h3 style={{margin:0, fontSize:'14px', fontWeight:'900', color:'white'}}>Record Claim</h3><button onClick={()=>setShowRecordModal(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="white"/></button></div>
            <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'12px'}}>
              <input type="text" placeholder="Full Name *" value={claimForm.name} onChange={e=>setClaimForm({...claimForm, name:e.target.value})} style={{width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'12.5px', outline:'none', boxSizing:'border-box', background:C.card2, color:C.text}}/>
              <input type="number" placeholder="Amount *" value={claimForm.amount} onChange={e=>setClaimForm({...claimForm, amount:e.target.value})} style={{width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'12.5px', outline:'none', boxSizing:'border-box', background:C.card2, color:C.text}}/>
              <input type="text" value={claimForm.barangay} disabled={!isAllBarangay} onChange={e=>setClaimForm({...claimForm, barangay:e.target.value})} style={{width:'100%', padding:'10px 12px', border:`1.5px solid ${C.border}`, borderRadius:'8px', fontSize:'12.5px', outline:'none', boxSizing:'border-box', background:C.card2, color:C.text}}/>
              <div style={{display:'flex', gap:'8px'}}><button onClick={()=>setShowRecordModal(false)} style={{ flex:1, padding:'10px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontWeight:'700', cursor:'pointer', fontSize:'12px' }}>Cancel</button><button onClick={handleRecordClaim} style={{ flex:1, padding:'10px', borderRadius:'8px', border:'none', background:'#1E3A8A', color:'#FACC15', fontWeight:'800', cursor:'pointer', fontSize:'12px' }}>Save for Approval</button></div>
            </div>
          </div>
        </div>
      )}

      {showProofModal && proofClaim && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, padding:'16px' }} onClick={() => setShowProofModal(false)}>
          <div style={{background:C.card, width:'100%', maxWidth:'480px', borderRadius:'16px', border:'2.5px solid #FACC15', overflow:'hidden', maxHeight:'90vh', overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'14px 16px', background:'#1E3A8A', display:'flex', justifyContent:'space-between', alignItems:'center'}}><h3 style={{margin:0, fontSize:'13px', fontWeight:'900', color:'white', display:'flex', gap:'6px', alignItems:'center'}}><AlertTriangle size={14} color="#FACC15"/> Proof Required - {proofClaim.name}</h3><button onClick={()=>setShowProofModal(false)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="white"/></button></div>
            <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'14px'}}>
              <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:'10px', padding:'10px 12px' }}><p style={{margin:0, fontSize:'11px', color:C.muted, fontWeight:'700', display:'flex', gap:'4px'}}><AlertTriangle size={12}/> Hindi maibibigay pera hangga't walang proof. Makikita ni Admin itong photo + signature.</p></div>
              <div><label style={{fontSize:'11px', fontWeight:'800', color:C.text, display:'block', marginBottom:'6px'}}><ImageIcon size={12} style={{display:'inline', marginRight:'4px'}}/> Photo ng Solo Parent (required)</label>
                {!proofPreview? <label className="upload-box" style={{display:'block'}}><Upload size={20} color={C.muted} style={{margin:'0 auto 6px'}}/><p style={{margin:0, fontSize:'11px', color:C.muted, fontWeight:'600'}}>Click to upload</p><input type="file" accept="image/*" capture="environment" onChange={handleProofImage} style={{display:'none'}}/></label> : <div style={{position:'relative', borderRadius:'10px', overflow:'hidden', border:`1.5px solid ${C.border}`}}><img src={proofPreview} alt="proof" style={{width:'100%', maxHeight:'200px', objectFit:'cover', display:'block'}}/><button onClick={()=>{setProofImage(null); setProofPreview('');}} style={{position:'absolute', top:'8px', right:'8px', background:'#DC2626', border:'none', borderRadius:'8px', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Trash2 size={14} color="white"/></button></div>}
              </div>
              <div><label style={{fontSize:'11px', fontWeight:'800', color:C.text, display:'flex', justifyContent:'space-between', marginBottom:'6px'}}><span><PenTool size={12} style={{display:'inline', marginRight:'4px'}}/> E-Signature (required)</span><button onClick={clearSignature} style={{background:C.card2, border:`1px solid ${C.border}`, borderRadius:'6px', padding:'2px 8px', fontSize:'10px', fontWeight:'700', cursor:'pointer', color:C.text}}>Clear</button></label><div style={{border:`1.5px solid ${C.border}`, borderRadius:'10px', background:'white', overflow:'hidden'}}><canvas ref={canvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} style={{width:'100%', height:'150px', cursor:'crosshair', touchAction:'none', display:'block'}}/></div></div>
              <div style={{display:'flex', gap:'8px', marginTop:'4px'}}><button onClick={()=>setShowProofModal(false)} style={{flex:1, padding:'11px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontWeight:'700', cursor:'pointer', fontSize:'12px'}}>Cancel</button><button onClick={handleSubmitProofForVerification} disabled={uploading} style={{flex:1, padding:'11px', borderRadius:'10px', border:'none', background: uploading? C.muted : '#f59e0b', color: uploading? 'white':'#1E3A8A', fontWeight:'800', cursor: uploading? 'not-allowed':'pointer', fontSize:'12px', display:'flex', gap:'6px', alignItems:'center', justifyContent:'center'}}>{uploading? 'Uploading...' : <><Camera size={14}/> Submit Proof</>}</button></div>
            </div>
          </div>
        </div>
      )}

      {selectedClaim && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}} onClick={()=>setSelectedClaim(null)}>
          <div style={{background:C.card, borderRadius:'16px', maxWidth:'440px', width:'100%', border:'2.5px solid #FACC15', overflow:'hidden', maxHeight:'90vh', overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 16px', background:'#1E3A8A'}}><h3 style={{color:'white', fontSize:'14px', fontWeight:'800', margin:0}}>Claim Details</h3><button onClick={()=>setSelectedClaim(null)} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} color="white"/></button></div>
            <div style={{padding:'16px', display:'flex', flexDirection:'column', gap:'10px'}}>
              <p style={{fontSize:'12.5px', margin:0, display:'flex', justifyContent:'space-between', color:C.text}}><span style={{color:C.muted}}>Name:</span><b>{selectedClaim.name}</b></p>
              <p style={{fontSize:'12.5px', margin:0, display:'flex', justifyContent:'space-between', color:C.text}}><span style={{color:C.muted}}>Amount:</span><b style={{color:'#facc15'}}>₱{selectedClaim.amount?.toLocaleString()}</b></p>
              <p style={{fontSize:'12.5px', margin:0, display:'flex', justifyContent:'space-between', color:C.text}}><span style={{color:C.muted}}>Status:</span><span style={{...getStatusStyle(selectedClaim.status), padding:'3px 8px', borderRadius:'20px', fontSize:'11px', fontWeight:'800'}}>{getStatusStyle(selectedClaim.status).label}</span></p>
              {selectedClaim.proofImageUrl && (<><div style={{borderTop:`1px dashed ${C.border}`, paddingTop:'10px', marginTop:'6px'}}><p style={{fontSize:'11px', fontWeight:'800', color:'#4ade80', margin:'0 0 6px 0'}}><Camera size={12} style={{display:'inline', marginRight:'4px'}}/> Proof</p><img src={selectedClaim.proofImageUrl} alt="proof" style={{width:'100%', borderRadius:'10px', border:`1px solid ${C.border}`, maxHeight:'220px', objectFit:'cover'}}/></div>{selectedClaim.signatureUrl && <div><p style={{fontSize:'11px', fontWeight:'800', color:C.text, margin:'0 0 6px 0'}}><PenTool size={12} style={{display:'inline', marginRight:'4px'}}/> E-Signature</p><img src={selectedClaim.signatureUrl} alt="sig" style={{width:'100%', borderRadius:'10px', border:`1px solid ${C.border}`, background:'white', padding:'8px'}}/></div>}</>)}
              <button onClick={()=>setSelectedClaim(null)} style={{ width:'100%', marginTop:'8px', padding:'10px', borderRadius:'10px', border:'none', background:'#1E3A8A', color:'#FACC15', fontWeight:'800', cursor:'pointer', fontSize:'12px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClaimsTab;