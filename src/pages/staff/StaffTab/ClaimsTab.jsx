import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

// Reusable Yellow -> Blue Hover Button
const HoverButton = ({ children, onClick, style={}, type="primary" }) => {
  const [isHover, setIsHover] = useState(false);
  const baseYellow = { background:'#FACC15', color:'#1E3A8A', border:'2px solid #FACC15' };
  const hoverBlue = { background:'#1E3A8A', color:'#FACC15', border:'2px solid #1E3A8A' };
  const baseBlue = { background:'#1E3A8A', color:'#FACC15', border:'2px solid #1E3A8A' };
  const hoverYellow = { background:'#FACC15', color:'#1E3A8A', border:'2px solid #FACC15' };

  let finalStyle = {};
  if(type==="primary"){ // yellow default, blue hover
    finalStyle = isHover? hoverBlue : baseYellow;
  } else { // blue default, yellow hover
    finalStyle = isHover? hoverYellow : baseBlue;
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={()=>setIsHover(true)}
      onMouseLeave={()=>setIsHover(false)}
      style={{ padding:'10px 16px', borderRadius:'10px', fontWeight:'800', cursor:'pointer', fontSize:'13px', transition:'all 0.2s ease', display:'flex', alignItems:'center', gap:'6px',...finalStyle,...style }}
    >
      {children}
    </button>
  );
};

const ClaimsTab = ({ styles }) => {
  const { userData } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [claimsTab, setClaimsTab] = useState('Subsidy');
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimForm, setClaimForm] = useState({ name: '', amount: '' });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'claims'), where('type', '==', claimsTab));
      const snap = await getDocs(q);
      let data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setClaims(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchClaims(); }, [claimsTab]);

  const handleRecordClaim = async () => {
    if (!claimForm.name.trim() ||!claimForm.amount) { alert('Please fill out Name and Amount'); return; }
    try {
      const staffName = userData?.name || 'Staff';
      const newClaimData = { name: claimForm.name.trim(), amount: Number(claimForm.amount), type: claimsTab, status: 'For Approval', recordedBy: staffName, recordedById: userData?.uid || 'staff-id', createdAt: serverTimestamp() };
      const claimRef = await addDoc(collection(db, 'claims'), newClaimData);
      try { await addDoc(collection(db, 'notifications'), { title: `New ${claimsTab} Claim`, message: `${staffName} recorded a claim for ${claimForm.name} - ₱${Number(claimForm.amount).toLocaleString()}`, for: 'admin', isRead: false, createdAt: serverTimestamp() }); } catch(e){}
      try { await addDoc(collection(db, 'auditLogs'), { action: `Recorded ${claimsTab} Claim`, details: `Claim ID: ${claimRef.id}`, performedBy: staffName, performedById: userData?.uid || 'staff-id', role: 'Staff', timestamp: serverTimestamp() }); } catch(e){}
      setShowClaimModal(false); setClaimForm({ name: '', amount: '' }); fetchClaims(); alert('Claim recorded!');
    } catch (err) { alert('Error: ' + err.message); }
  };

  const getStatusStyle = (status) => {
    if(status === 'Released') return { bg: '#dcfce7', color: '#166534' };
    if(status === 'Approved') return { bg: '#dbeafe', color: '#1e40af' };
    if(status === 'For Approval') return { bg: '#fef3c7', color: '#92400e' };
    if(status === 'Rejected') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#f1f5f9', color: '#475569' };
  }

  if(loading) return <p style={{ fontSize: '13px', color: '#64748b' }}>Loading claims...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', margin: 0, fontFamily: "'Poppins', sans-serif" }}>Claims Tracking</h2>
          <p style={{ color: '#475569', marginTop: '4px', fontSize: '13px' }}>Track subsidy and educational claims</p>
        </div>
        <HoverButton type="primary" onClick={() => setShowClaimModal(true)}><Plus size={16} /> Record Claim</HoverButton>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['Subsidy', 'Educational'].map(tab => (
          <HoverButton key={tab} type={claimsTab===tab? "secondary" : "primary"} onClick={() => setClaimsTab(tab)}>{tab}</HoverButton>
        ))}
      </div>

      <div style={{background:'white', border:'2px solid #FACC15', borderRadius:'12px', padding: 0, overflowX: 'auto'}}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '500px' }}>
          <thead><tr style={{borderBottom: '3px solid #FACC15', background: '#FFFBEB'}}>
            <th style={{padding:'12px 16px',textAlign:'left',color:'#1E3A8A',fontSize:'11px',fontWeight:'800'}}>Name</th>
            <th style={{padding:'12px 16px',textAlign:'left',color:'#1E3A8A',fontSize:'11px',fontWeight:'800'}}>Amount</th>
            <th style={{padding:'12px 16px',textAlign:'left',color:'#1E3A8A',fontSize:'11px',fontWeight:'800'}}>Status</th>
            <th style={{padding:'12px 16px',textAlign:'left',color:'#1E3A8A',fontSize:'11px',fontWeight:'800'}}>Action</th>
          </tr></thead>
          <tbody>
            {claims.length===0? <tr><td colSpan="4" style={{textAlign:'center', padding:'20px', color:'#64748b'}}>No {claimsTab} claims yet</td></tr> :
            claims.map(claim => {
              const s = getStatusStyle(claim.status);
              return <tr key={claim.id} style={{borderBottom:'1px solid #FEF3C7'}}>
                <td style={{padding:'12px 16px', fontWeight:'700', color:'#1E3A8A'}}>{claim.name}</td>
                <td style={{padding:'12px 16px', fontWeight:'600', color:'#1E3A8A'}}>₱{claim.amount?.toLocaleString()}</td>
                <td style={{padding:'12px 16px'}}><span style={{padding:'4px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:'700', background:s.bg, color:s.color}}>{claim.status}</span></td>
                <td style={{padding:'12px 16px'}}><HoverButton type="primary" style={{padding:'5px 10px', fontSize:'11px'}} onClick={()=>setSelectedClaim(claim)}>View →</HoverButton></td>
              </tr>
            })}
          </tbody>
        </table>
      </div>

      {showClaimModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding:'16px' }} onClick={() => setShowClaimModal(false)}>
          <div style={{background:'#FFFFFF', width:'100%', maxWidth:'440px', borderRadius:'16px', border:'3px solid #FACC15', boxShadow:'0 20px 40px rgba(0,0,0,0.4)', overflow:'hidden'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'16px 20px', background:'#FFFBEB', borderBottom:'3px solid #FACC15', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0, fontSize:'17px', fontWeight:'800', color:'#1E3A8A'}}>Record New {claimsTab} Claim</h3>
              <X size={20} style={{cursor:'pointer', color:'#1E3A8A'}} onClick={()=>setShowClaimModal(false)}/>
            </div>
            <div style={{padding:'20px', display:'flex', flexDirection:'column', gap:'14px', background:'white'}}>
              <div>
                <label style={{fontSize:'13px', fontWeight:'800', color:'#1E3A8A', display:'block', marginBottom:'6px'}}>Full Name</label>
                <input type="text" placeholder="Enter full name" value={claimForm.name} onChange={e=>setClaimForm({...claimForm, name:e.target.value})} style={{width:'100%', padding:'12px 14px', border:'2px solid #1E3A8A', borderRadius:'10px', fontSize:'14px', color:'#1E3A8A', fontWeight:'600', background:'white', outline:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:'13px', fontWeight:'800', color:'#1E3A8A', display:'block', marginBottom:'6px'}}>Amount</label>
                <input type="number" placeholder="2500" value={claimForm.amount} onChange={e=>setClaimForm({...claimForm, amount:e.target.value})} style={{width:'100%', padding:'12px 14px', border:'2px solid #1E3A8A', borderRadius:'10px', fontSize:'14px', color:'#1E3A8A', fontWeight:'600', background:'white', outline:'none'}}/>
              </div>
            </div>
            <div style={{display:'flex', gap:'10px', justifyContent:'flex-end', padding:'16px 20px', background:'#FFFBEB', borderTop:'2px solid #FEF3C7'}}>
              <HoverButton type="primary" onClick={()=>setShowClaimModal(false)}>Cancel</HoverButton>
              <HoverButton type="secondary" onClick={handleRecordClaim}>Save Claim</HoverButton>
            </div>
          </div>
        </div>
      )}

      {selectedClaim && (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.75)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}} onClick={()=>setSelectedClaim(null)}>
          <div style={{background:'white', borderRadius:'16px', maxWidth:'400px', width:'100%', border:'3px solid #FACC15', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.4)'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 20px', background:'#FFFBEB', borderBottom:'3px solid #FACC15'}}>
              <h3 style={{color:'#1E3A8A', fontSize:'16px', fontWeight:'800', margin:0}}>Claim Details</h3>
              <X size={20} style={{cursor:'pointer', color:'#1E3A8A'}} onClick={()=>setSelectedClaim(null)}/>
            </div>
            <div style={{padding:'20px'}}>
              <p style={{fontSize:'14px', margin:'8px 0', color:'#1E3A8A'}}><b>Name:</b> {selectedClaim.name}</p>
              <p style={{fontSize:'14px', margin:'8px 0', color:'#1E3A8A'}}><b>Amount:</b> ₱{selectedClaim.amount?.toLocaleString()}</p>
              <p style={{fontSize:'14px', margin:'8px 0', color:'#1E3A8A'}}><b>Status:</b> {selectedClaim.status}</p>
              <HoverButton type="secondary" style={{width:'100%', justifyContent:'center', marginTop:'16px'}} onClick={()=>setSelectedClaim(null)}>Close</HoverButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default ClaimsTab;