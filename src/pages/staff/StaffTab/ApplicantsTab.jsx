import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Eye } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const ApplicantsTab = ({ styles }) => {
  const { userData } = useAuth();
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchPendingApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'pending_users'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setPendingApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Firebase Error:", err);
      setError("Hindi makaconnect sa database. Check mo internet/Firebase config");
    }
    setLoading(false);
  };

  useEffect(() => { fetchPendingApps(); }, []);

  const handleApprove = async (appId) => {
    try {
      await updateDoc(doc(db, 'pending_users', appId), { status: 'approved', reviewedBy: userData?.name || 'Staff', reviewedAt: new Date() });
      setSelectedApp(null);
      fetchPendingApps();
      alert('Application Approved!');
    } catch (err) { console.error(err); alert('Error approving'); }
  };

  const handleReject = async (appId) => {
    if (!rejectReason.trim()) return alert('Please provide a reason for rejection');
    try {
      await updateDoc(doc(db, 'pending_users', appId), { status: 'rejected', rejectReason: rejectReason, reviewedBy: userData?.name || 'Staff', reviewedAt: new Date() });
      setSelectedApp(null);
      setShowRejectInput(false);
      setRejectReason('');
      fetchPendingApps();
      alert('Application Rejected');
    } catch (err) { console.error(err); alert('Error rejecting'); }
  };

  if (loading) return <p style={{ fontSize: '13px', color: '#64748b' }}>Loading applications...</p>;

  return (
    <div>
      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}} onClick={()=>setPreviewImage(null)}>
          <div style={{background:'white', padding:'12px', borderRadius:'16px', border:'3px solid #FACC15', maxWidth:'90vw', maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'#1E3A8A', fontWeight:'800'}}><span>{previewImage.label}</span><X size={20} style={{cursor:'pointer'}} onClick={()=>setPreviewImage(null)}/></div>
            <img src={previewImage.url} alt="requirement" style={{maxWidth:'85vw', maxHeight:'75vh', objectFit:'contain', borderRadius:'8px'}}/>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', margin: 0, fontFamily: "'Poppins', sans-serif" }}>Review Applications</h2>
          <p style={{ color: '#475569', marginTop: '4px', fontSize: '13px' }}>{pendingApps.length} pending applications awaiting review</p>
        </div>
        <button onClick={fetchPendingApps} style={{background: 'transparent', border: '1.5px solid #1E3A8A', borderRadius: '6px', padding: '6px', cursor: 'pointer'}}><RefreshCw size={14} color="#1E3A8A"/></button>
      </div>

      {error && (
        <div style={{padding: '16px', background: '#fee2e2', border:'2px solid #dc2626', borderRadius:'10px', marginBottom: '16px'}}>
          <p style={{margin: 0, color: '#991b1b', fontSize: '13px'}}>{error}</p>
        </div>
      )}

      {!error && pendingApps.length === 0 && (
        <div style={{background:'white', border:'2px solid #FACC15', borderRadius:'12px', textAlign: 'center', padding: '32px'}}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>No pending applications</p>
        </div>
      )}

      {!isMobile && pendingApps.length > 0 && (
        <div style={{background:'white', border:'2px solid #FACC15', borderRadius:'12px', padding: 0, overflowX: 'auto'}}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '650px', fontSize: '13px' }}>
            <thead style={{ background: '#FEF3C7' }}>
              <tr>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',color:'#1E3A8A',fontWeight:'700',textTransform:'uppercase'}}>Name</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',color:'#1E3A8A',fontWeight:'700',textTransform:'uppercase'}}>Email</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',color:'#1E3A8A',fontWeight:'700',textTransform:'uppercase'}}>Address</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'11px',color:'#1E3A8A',fontWeight:'700',textTransform:'uppercase'}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingApps.map(app => (
                <tr key={app.id} onClick={() => {setSelectedApp(app); setShowRejectInput(false);}} style={{ cursor: 'pointer', borderBottom: '1px solid #FEF3C7' }}>
                  <td style={{ padding: '12px 16px', fontWeight: '600', color:'#1E3A8A' }}>{app.name}</td>
                  <td style={{ padding: '12px 16px', color:'#334155' }}>{app.email}</td>
                  <td style={{ padding: '12px 16px', color:'#334155' }}>{app.address}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', background: '#FEF3C7', color: '#1E3A8A', border: '1px solid #FACC15', fontWeight: '600' }}>{app.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isMobile && pendingApps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingApps.map(app => (
            <div key={app.id} onClick={() => {setSelectedApp(app); setShowRejectInput(false);}} style={{background:'white', border:'2px solid #FACC15', borderRadius:'12px', padding: '14px', cursor: 'pointer'}}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E3A8A' }}>{app.name}</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#475569' }}>{app.email}</p>
                </div>
                <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', background: '#FEF3C7', color: '#1E3A8A', border: '1px solid #FACC15', fontWeight: '600', whiteSpace: 'nowrap' }}>{app.status}</span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}><b>Address:</b> {app.address}</p>
            </div>
          ))}
        </div>
      )}

      {/* FIXED MODAL - SOLID WHITE, KITA NA + MAY PICTURES */}
      {selectedApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: isMobile ? '0' : '20px' }} onClick={() => setSelectedApp(null)}>
          <div style={{ background:'#FFFFFF', width: '100%', maxWidth: '750px', height: isMobile ? '100%' : 'auto', maxHeight: '90vh', overflowY: 'auto', borderRadius: isMobile ? '0' : '16px', border:'3px solid #FACC15', display: 'flex', flexDirection: 'column', boxShadow:'0 20px 40px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:'16px 20px', background:'#FFFBEB', borderBottom:'3px solid #FACC15' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#1E3A8A' }}>Application Details</h3>
              <X size={22} style={{ cursor: 'pointer', color: '#1E3A8A' }} onClick={() => setSelectedApp(null)} />
            </div>

            <div style={{ padding:'20px', background:'white' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
                <div><p style={{ margin: '0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Full Name</p><p style={{ margin: '0 0 10px 0', fontWeight: '700', fontSize: '13px', color:'#1E3A8A' }}>{selectedApp.name}</p></div>
                <div><p style={{ margin: '0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Email</p><p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '13px', color:'#1E3A8A' }}>{selectedApp.email}</p></div>
                <div><p style={{ margin: '0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Contact</p><p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '13px', color:'#1E3A8A' }}>{selectedApp.contact || selectedApp.contactNumber}</p></div>
                <div><p style={{ margin: '0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Category</p><p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '13px', color:'#1E3A8A' }}>{selectedApp.category || 'Solo Parent'}</p></div>
                <div style={{ gridColumn: '1 / -1' }}><p style={{ margin: '0', fontSize: '11px', color: '#64748b', fontWeight: '700' }}>Address</p><p style={{ margin: '0 0 10px 0', fontWeight: '600', fontSize: '13px', color:'#1E3A8A' }}>{selectedApp.address}</p></div>
              </div>

              {/* PICTURES NG REQUIREMENTS */}
              <h4 style={{fontWeight:'800', color:'#1E3A8A', borderBottom:'3px solid #FACC15', paddingBottom:'8px', margin:'20px 0 12px 0'}}>Submitted Requirements - Pictures</h4>
              <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'12px'}}>
                {[
                  {label:'Valid ID', url: selectedApp.validIdUrl || selectedApp.idImageUrl || selectedApp.validIDUrl},
                  {label:'Barangay Certificate', url: selectedApp.barangayCertUrl || selectedApp.barangayCertificateUrl},
                  {label:'Birth Certificate', url: selectedApp.birthCertUrl || selectedApp.childBirthCertUrl || selectedApp.birthCertificateUrl},
                  {label:'Solo Parent Proof', url: selectedApp.soloParentProofUrl || selectedApp.proofUrl || selectedApp.soloParentIdUrl},
                  {label:'1x1 Photo', url: selectedApp.photoUrl || selectedApp.oneByOneUrl || selectedApp.profilePhotoUrl},
                  {label:'Other Document', url: selectedApp.otherDocUrl},
                 ...(Array.isArray(selectedApp.requirementsImages) ? selectedApp.requirementsImages.map((u,i)=>({label:`Requirement ${i+1}`, url: typeof u==='string'? u : u.url})) : []),
                 ...(Array.isArray(selectedApp.documents) ? selectedApp.documents.map((u,i)=>({label:`Document ${i+1}`, url: typeof u==='string'? u : u.url})) : []),
                 ...(selectedApp.requirements && typeof selectedApp.requirements==='object' && !Array.isArray(selectedApp.requirements) ? Object.entries(selectedApp.requirements).map(([k,v])=>({label:k, url: typeof v==='string'? v : v.url})) : []),
                ].filter(d=>d.url && typeof d.url==='string' && d.url.startsWith('http')).map((doc, i)=>(
                  <div key={i} style={{border:'2px solid #FACC15', borderRadius:'12px', overflow:'hidden', background:'white'}}>
                    <div style={{background:'#1E3A8A', color:'#FACC15', padding:'6px 10px', fontSize:'12px', fontWeight:'800'}}>{doc.label}</div>
                    <img src={doc.url} alt={doc.label} style={{width:'100%', height:'170px', objectFit:'cover', cursor:'pointer', background:'#f1f5f9'}} onClick={()=>setPreviewImage({url:doc.url, label:doc.label})}/>
                    <button onClick={()=>setPreviewImage({url:doc.url, label:doc.label})} style={{width:'100%', background:'#FACC15', color:'#1E3A8A', border:'none', padding:'8px', fontWeight:'800', cursor:'pointer', fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Eye size={14}/> View Full</button>
                  </div>
                ))}
              </div>

              {showRejectInput && (
                <textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #1E3A8A', margin: '16px 0 0 0', minHeight: '80px', boxSizing: 'border-box', fontSize: '13px', color:'#1E3A8A', background:'white', outline:'none' }} />
              )}

              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '10px', marginTop: '20px', paddingTop:'16px', borderTop:'2px solid #FEF3C7' }}>
                <button onClick={() => handleApprove(selectedApp.id)} style={{ flex: 1, padding: '12px', background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>✓ Approve</button>
                <button onClick={() => showRejectInput ? handleReject(selectedApp.id) : setShowRejectInput(true)} style={{ flex: 1, padding: '12px', background: 'white', color: '#dc2626', border: '2px solid #dc2626', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '14px' }}>{showRejectInput ? 'Confirm Reject' : 'Reject'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApplicantsTab;