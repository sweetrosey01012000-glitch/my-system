import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logActivity } from '../../../utils/logActivity';
import { Plus, Check, X, Clock, Wallet, PiggyBank, GraduationCap, HandHeart, AlertTriangle } from 'lucide-react';

function AdminFundTab({ showToast, currentUser }) {
  const [fundData, setFundData] = useState({ totalBudget: 0, educationUsed: 0, subsidyUsed: 0, remaining: 0 });
  const [records, setRecords] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [showApproveAlert, setShowApproveAlert] = useState(false);
  const [showRejectAlert, setShowRejectAlert] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark ? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'fund', 'main'), (snap) => { if (snap.exists()) setFundData(snap.data()); setLoading(false); });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assistanceRecords'), (snap) => { setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() }))); });
    return () => unsub();
  }, []);
  useEffect(() => {
    const q = query(collection(db, 'claims'), where('status', '==', 'For Approval'));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPendingClaims(data);
    });
    return () => unsub();
  }, []);

  const handleAddBudget = async () => {
    if (!addAmount || isNaN(addAmount) || Number(addAmount) <= 0) return alert('Enter valid amount');
    try {
      const amount = Number(addAmount);
      const newTotal = (fundData.totalBudget || 0) + amount;
      const newRemaining = (fundData.remaining || 0) + amount;
      await updateDoc(doc(db, 'fund', 'main'), { totalBudget: newTotal, remaining: newRemaining, lastUpdated: serverTimestamp() });
      await logActivity({ action: "ADD_BUDGET", performedBy: currentUser?.name || 'Admin', details: `Added ₱${amount.toLocaleString()}` });
      await addDoc(collection(db, 'notifications'), { title: "Budget Updated", message: `Admin added ₱${amount.toLocaleString()}`, type: "FUND_UPDATE", for: "staff", isRead: false, createdAt: serverTimestamp() });
      showToast && showToast(`Added ₱${amount.toLocaleString()}`);
      setAddAmount(''); setShowModal(false);
    } catch (error) { alert('Error: ' + error.message); }
  };

  const openApproveAlert = (claim) => { setSelectedClaim(claim); setShowApproveAlert(true); };
  const confirmApprove = async () => {
    if (!selectedClaim) return;
    if ((fundData.remaining || 0) < selectedClaim.amount) return alert('Insufficient remaining fund!');
    try {
      const isEducation = selectedClaim.type === 'Educational' || selectedClaim.type === 'Education';
      const updateData = { remaining: (fundData.remaining || 0) - selectedClaim.amount, lastUpdated: serverTimestamp() };
      if (isEducation) updateData.educationUsed = (fundData.educationUsed || 0) + selectedClaim.amount;
      else updateData.subsidyUsed = (fundData.subsidyUsed || 0) + selectedClaim.amount;
      await updateDoc(doc(db, 'fund', 'main'), updateData);
      await updateDoc(doc(db, 'claims', selectedClaim.id), { status: 'Released', releasedAt: serverTimestamp(), releasedBy: currentUser?.name || 'Admin', approvedBy: currentUser?.name || 'Admin' });
      await addDoc(collection(db, 'assistanceRecords'), { beneficiary: selectedClaim.name, amount: selectedClaim.amount, type: isEducation ? 'Education' : 'Subsidy', claimId: selectedClaim.id, date: serverTimestamp(), releasedBy: currentUser?.name || 'Admin', recordedBy: selectedClaim.recordedBy || 'Staff' });
      await logActivity({ action: "APPROVE_CLAIM", performedBy: currentUser?.name || 'Admin', details: `Approved ${selectedClaim.type}: ${selectedClaim.name} - ₱${selectedClaim.amount.toLocaleString()}` });
      showToast && showToast(`Approved ${selectedClaim.name} - ₱${selectedClaim.amount.toLocaleString()}`);
      setShowApproveAlert(false); setSelectedClaim(null);
    } catch (err) { alert('Error: ' + err.message); }
  };
  const openRejectAlert = (claim) => { setSelectedClaim(claim); setShowRejectAlert(true); };
  const confirmReject = async () => {
    try {
      await updateDoc(doc(db, 'claims', selectedClaim.id), { status: 'Rejected', rejectedAt: serverTimestamp(), rejectedBy: currentUser?.name || 'Admin' });
      await logActivity({ action: "REJECT_CLAIM", performedBy: currentUser?.name || 'Admin', details: `Rejected ${selectedClaim.type}: ${selectedClaim.name}` });
      showToast && showToast(`Rejected ${selectedClaim.name}`);
      setShowRejectAlert(false); setSelectedClaim(null);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const educationTotal = records.filter(r => r.type === 'Education').reduce((sum, r) => sum + (r.amount || 0), 0);
  const subsidyTotal = records.filter(r => r.type === 'Subsidy').reduce((sum, r) => sum + (r.amount || 0), 0);
  if (loading) return <div style={{ textAlign: 'center', padding: '40px', fontFamily: "'Inter', sans-serif", color:C.muted }}>Loading fund...</div>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
       .fund-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; }
       .fund-header { background: ${C.card}; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid ${C.border}; }
       .f-card { padding: 16px; border-radius: 12px; border: 1.5px solid ${C.border}; }
       .th-white { padding: 14px 12px; text-align: left; font-weight: 800; font-size: 11px; color: ${C.text}; background: ${C.card}; border-bottom: 3px solid #FACC15; }
       .row-hover:hover { background: ${isDark? '#252a38' : '#fefce8'}!important; }
       .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid ${C.border}; background: ${C.card}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
       .icon-btn.approve { color: #4ade80; }.icon-btn.approve:hover { background: #16A34A; color: white; }
       .icon-btn.reject { color: #ef4444; }.icon-btn.reject:hover { background: #DC2626; color: white; }
       .tab-btn { padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 700; font-size: 12px; color: ${C.muted}; border-bottom: 3px solid transparent; display: flex; gap: 6px; align-items: center; }
       .tab-btn.active { color: ${C.text}; border-bottom: 3px solid #FACC15; font-weight: 800; }
      `}</style>

      <div className="fund-wrapper">
        <div className="fund-header">
          <h2 style={{ margin: 0, color: C.text, fontSize: '18px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', background: '#1E3A8A', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Wallet size={18} color="#FACC15" /></div>
            Fund Management
          </h2>
          <button onClick={() => setShowModal(true)} style={{ padding: '10px 16px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}><Plus size={16} /> Add Budget</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', padding: '16px 20px' }}>
          <div className="f-card" style={{ background: isDark? C.card2 : '#FFFBEB', borderColor: C.border }}>
            <div style={{ fontSize: '11px', color: C.muted, fontWeight: '700', display: 'flex', gap: '6px', alignItems: 'center' }}><PiggyBank size={12}/> TOTAL BUDGET</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: C.text }}>₱{(fundData.totalBudget || 0).toLocaleString()}</div>
          </div>
          <div className="f-card" style={{ background: isDark? '#14331f' : '#f0fdf4', borderColor: isDark? '#1f5a2f' : '#86efac' }}>
            <div style={{ fontSize: '11px', color: isDark? '#4ade80' : '#166534', fontWeight: '700' }}>REMAINING</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: isDark? '#4ade80' : '#16A34A' }}>₱{(fundData.remaining || 0).toLocaleString()}</div>
          </div>
          <div className="f-card" style={{ background: C.card2, borderColor: C.border }}>
            <div style={{ fontSize: '11px', color: C.muted, fontWeight: '700', display: 'flex', gap: '6px' }}><GraduationCap size={12}/> EDUCATION USED</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>₱{educationTotal.toLocaleString()}</div>
          </div>
          <div className="f-card" style={{ background: C.card2, borderColor: C.border }}>
            <div style={{ fontSize: '11px', color: C.muted, fontWeight: '700', display: 'flex', gap: '6px' }}><HandHeart size={12}/> SUBSIDY USED</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ef4444' }}>₱{subsidyTotal.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '4px', padding: '0 20px', borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, background: C.card }}>
          <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}><Clock size={14} /> Pending Claims ({pendingClaims.length})</button>
          <button className={`tab-btn ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')}>Assistance Report ({records.length})</button>
        </div>

        {activeTab === 'pending' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th className="th-white">NAME</th><th className="th-white">TYPE</th><th className="th-white">AMOUNT</th><th className="th-white">RECORDED BY</th><th className="th-white" style={{ textAlign: 'center' }}>ACTION</th></tr></thead>
              <tbody>
                {pendingClaims.length === 0 ? <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: C.muted }}>No pending claims for approval</td></tr> : pendingClaims.map(c => (
                  <tr key={c.id} className="row-hover" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px', fontWeight: '700', fontSize: '13px', color:C.text }}>{c.name}</td>
                    <td style={{ padding: '12px' }}><span style={{ background: C.card2, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', color: C.muted }}>{c.type}</span></td>
                    <td style={{ padding: '12px', fontWeight: '800', fontSize: '13px', color: C.text }}>₱{c.amount?.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: C.muted }}>{c.recordedBy || 'Staff'}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="icon-btn approve" onClick={() => openApproveAlert(c)} title="Approve"><Check size={14} /></button>
                        <button className="icon-btn reject" onClick={() => openRejectAlert(c)} title="Reject"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th className="th-white">DATE</th><th className="th-white">TYPE</th><th className="th-white">BENEFICIARY</th><th className="th-white" style={{ textAlign: 'right' }}>AMOUNT</th></tr></thead>
              <tbody>
                {records.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color:C.muted }}>No records yet</td></tr> : records.map(r => (
                  <tr key={r.id} className="row-hover" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px', fontSize: '12px', color:C.muted }}>{r.date?.toDate?.()?.toLocaleDateString('en-PH') || 'N/A'}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color:C.muted }}>{r.type}</td>
                    <td style={{ padding: '12px', fontWeight: '600', fontSize: '13px', color:C.text }}>{r.beneficiary}</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: C.text }}>₱{(r.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }} onClick={() => setShowModal(false)}>
          <div style={{ background: C.card, borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '400px', border: '2.5px solid #FACC15' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: C.text, fontWeight: '900', marginBottom: '16px', fontSize: '16px', display: 'flex', gap: '8px' }}><Wallet size={18}/> Add Budget</h2>
            <input type="number" placeholder="50000" value={addAmount} onChange={e => setAddAmount(e.target.value)} style={{ width: '100%', padding: '12px', border: `1.5px solid ${C.border}`, borderRadius: '10px', fontSize: '14px', marginBottom: '12px', outline: 'none', background:C.card2, color:C.text }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '10px 16px', borderRadius: '10px', border: `1.5px solid ${C.border}`, background: C.card2, color:C.text, fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAddBudget} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#1E3A8A', color: '#FACC15', fontWeight: '800', cursor: 'pointer' }}>Confirm Add</button>
            </div>
          </div>
        </div>
      )}

      {showApproveAlert && selectedClaim && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: C.card, borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '24px', textAlign: 'center', border: '3px solid #FACC15' }}>
            <div style={{ width: '64px', height: '64px', background: isDark? '#14331f' : '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: `2px solid ${isDark? '#1f5a2f' : '#86efac'}` }}><Check size={32} color="#16A34A" /></div>
            <h3 style={{ margin: '0 0 8px 0', color: C.text, fontWeight: '900', fontSize: '18px' }}>Approve this claim?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: C.muted }}>Approve <b style={{color:C.text}}>₱{selectedClaim.amount?.toLocaleString()}</b> for <b style={{color:C.text}}>{selectedClaim.name}</b>?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowApproveAlert(false); setSelectedClaim(null); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1.5px solid ${C.border}`, background: C.card2, color:C.text, fontWeight: '700', cursor: 'pointer' }}>No, Cancel</button>
              <button onClick={confirmApprove} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#16A34A', color: 'white', fontWeight: '900', cursor: 'pointer' }}>Yes, Approve</button>
            </div>
          </div>
        </div>
      )}

      {showRejectAlert && selectedClaim && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '16px' }}>
          <div style={{ background: C.card, borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '24px', textAlign: 'center', border: '3px solid #FACC15' }}>
            <div style={{ width: '64px', height: '64px', background: isDark? '#3a1f1f' : '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid #fecaca' }}><AlertTriangle size={32} color="#DC2626" /></div>
            <h3 style={{ margin: '0 0 8px 0', color: C.text, fontWeight: '900', fontSize: '18px' }}>Reject this claim?</h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: C.muted }}>Reject claim for <b style={{color:C.text}}>{selectedClaim.name}</b>?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setShowRejectAlert(false); setSelectedClaim(null); }} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: `1.5px solid ${C.border}`, background: C.card2, color:C.text, fontWeight: '700', cursor: 'pointer' }}>No, Cancel</button>
              <button onClick={confirmReject} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#DC2626', color: 'white', fontWeight: '900', cursor: 'pointer' }}>Yes, Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminFundTab;