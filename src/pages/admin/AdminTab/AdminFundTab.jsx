import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, updateDoc, getDocs, query, where, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { logActivity } from '../../../utils/logActivity';
import { Plus, Check, X, Clock } from 'lucide-react';

const styles = {
  container: { background: 'white', borderRadius: '16px', border: '2px solid #FACC15', padding: '24px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' },
  title: { margin: 0, color: '#1E3A8A', fontSize: '20px', fontFamily: "'Poppins', sans-serif" },
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' },
  card: { padding: '20px', borderRadius: '12px', border: '2px solid #FACC15', background: '#FFFBEB' },
  cardLabel: { fontSize: '12px', color: '#64748B', fontFamily: "'Inter', sans-serif", marginBottom: '4px' },
  cardValue: { fontSize: '22px', fontWeight: '800', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif" },
  actionBtn: { padding: '10px 16px', background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' },
  input: { width: '100%', padding: '10px', border: '2px solid #FACC15', borderRadius: '8px', fontSize: '14px', fontFamily: "'Inter', sans-serif", boxSizing: 'border-box', marginBottom: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modalContent: { background: 'white', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '500px', border: '2px solid #FACC15' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #FACC15', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif", fontSize: '11px', textTransform: 'uppercase' },
  td: { padding: '10px', borderBottom: '1px solid #FDE68A', fontSize: '13px' }
};

function AdminFundTab({ showToast, currentUser }) {
  const [fundData, setFundData] = useState({ totalBudget: 0, educationUsed: 0, subsidyUsed: 0, remaining: 0 });
  const [records, setRecords] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // pending | report

  // 1. FUND DATA - REALTIME
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'fund', 'main'), (snap) => {
      if (snap.exists()) setFundData(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2. ASSISTANCE RECORDS - REALTIME
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assistanceRecords'), (snap) => {
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // 3. PENDING CLAIMS GALING SA ClaimsTab NI STAFF - REALTIME
  useEffect(() => {
    const q = query(collection(db, 'claims'), where('status', '==', 'For Approval'));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort latest first
      data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPendingClaims(data);
    });
    return () => unsub();
  }, []);

  // ADD BUDGET
  const handleAddBudget = async () => {
    if (!addAmount || isNaN(addAmount) || Number(addAmount) <= 0) return alert('Enter valid amount');
    try {
      const amount = Number(addAmount);
      const newTotal = (fundData.totalBudget || 0) + amount;
      const newRemaining = (fundData.remaining || 0) + amount;
      await updateDoc(doc(db, 'fund', 'main'), {
        totalBudget: newTotal,
        remaining: newRemaining,
        lastUpdated: serverTimestamp()
      });
      await logActivity({
        action: "ADD_BUDGET",
        performedBy: currentUser?.name || 'Admin',
        performedById: currentUser?.uid || 'unknown',
        details: `Added ₱${amount.toLocaleString()} to budget. New Total: ₱${newTotal.toLocaleString()}`
      });
      await addDoc(collection(db, 'notifications'), {
        title: "Budget Updated",
        message: `Admin added ₱${amount.toLocaleString()}. New remaining: ₱${newRemaining.toLocaleString()}`,
        type: "FUND_UPDATE",
        for: "staff",
        isRead: false,
        createdAt: serverTimestamp()
      });
      showToast(`Added ₱${amount.toLocaleString()}`);
      setAddAmount('');
      setShowModal(false);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // APPROVE CLAIM - CORE LOGIC
  const handleApproveClaim = async (claim) => {
    if ((fundData.remaining || 0) < claim.amount) {
      return alert('Insufficient remaining fund!');
    }
    if (!confirm(`Approve ₱${claim.amount.toLocaleString()} for ${claim.name}?`)) return;

    try {
      // 1. BAWAS SA FUND + DAGDAG SA USED
      const isEducation = claim.type === 'Educational' || claim.type === 'Education';
      const updateData = {
        remaining: (fundData.remaining || 0) - claim.amount,
        lastUpdated: serverTimestamp()
      };
      if (isEducation) {
        updateData.educationUsed = (fundData.educationUsed || 0) + claim.amount;
      } else {
        updateData.subsidyUsed = (fundData.subsidyUsed || 0) + claim.amount;
      }
      await updateDoc(doc(db, 'fund', 'main'), updateData);

      // 2. UPDATE CLAIM STATUS TO Released
      await updateDoc(doc(db, 'claims', claim.id), {
        status: 'Released',
        releasedAt: serverTimestamp(),
        releasedBy: currentUser?.name || 'Admin',
        approvedBy: currentUser?.name || 'Admin'
      });

      // 3. GAWA NG RECORD SA assistanceRecords PARA SA REPORT
      await addDoc(collection(db, 'assistanceRecords'), {
        beneficiary: claim.name,
        amount: claim.amount,
        type: isEducation ? 'Education' : 'Subsidy',
        claimId: claim.id,
        date: serverTimestamp(),
        releasedBy: currentUser?.name || 'Admin',
        recordedBy: claim.recordedBy || 'Staff'
      });

      // 4. AUDIT LOG
      await logActivity({
        action: "APPROVE_CLAIM",
        performedBy: currentUser?.name || 'Admin',
        performedById: currentUser?.uid || 'unknown',
        details: `Approved ${claim.type} Claim: ${claim.name} - ₱${claim.amount.toLocaleString()} (ClaimID: ${claim.id})`
      });

      // 5. NOTIF SA STAFF
      await addDoc(collection(db, 'notifications'), {
        title: "Claim Approved",
        message: `Your ${claim.type} claim for ${claim.name} - ₱${claim.amount.toLocaleString()} was APPROVED by Admin`,
        for: "staff",
        isRead: false,
        createdAt: serverTimestamp()
      });

      showToast(`Approved ${claim.name} - ₱${claim.amount.toLocaleString()}`);
    } catch (err) {
      console.error(err);
      alert('Error approving: ' + err.message);
    }
  };

  // REJECT CLAIM
  const handleRejectClaim = async (claim) => {
    if (!confirm(`Reject claim for ${claim.name}?`)) return;
    try {
      await updateDoc(doc(db, 'claims', claim.id), {
        status: 'Rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: currentUser?.name || 'Admin'
      });
      await logActivity({
        action: "REJECT_CLAIM",
        performedBy: currentUser?.name || 'Admin',
        performedById: currentUser?.uid || 'unknown',
        details: `Rejected ${claim.type} Claim: ${claim.name} - ₱${claim.amount.toLocaleString()}`
      });
      showToast(`Rejected ${claim.name}`);
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const educationTotal = records.filter(r => r.type === 'Education').reduce((sum, r) => sum + (r.amount || 0), 0);
  const subsidyTotal = records.filter(r => r.type === 'Subsidy').reduce((sum, r) => sum + (r.amount || 0), 0);

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading fund...</div>;

  return (
    <div className="anim-fade-in" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Fund Management</h2>
        <button style={styles.actionBtn} onClick={() => setShowModal(true)}>
          <Plus size={14} /> Add Budget
        </button>
      </div>

      <div style={styles.cardGrid}>
        <div style={styles.card}><div style={styles.cardLabel}>Total Budget</div><div style={styles.cardValue}>₱{(fundData.totalBudget || 0).toLocaleString()}</div></div>
        <div style={styles.card}><div style={styles.cardLabel}>Remaining</div><div style={{...styles.cardValue, color: '#16A34A'}}>₱{(fundData.remaining || 0).toLocaleString()}</div></div>
        <div style={styles.card}><div style={styles.cardLabel}>Education Used</div><div style={{...styles.cardValue, color: '#DC2626'}}>₱{educationTotal.toLocaleString()}</div></div>
        <div style={styles.card}><div style={styles.cardLabel}>Subsidy Used</div><div style={{...styles.cardValue, color: '#DC2626'}}>₱{subsidyTotal.toLocaleString()}</div></div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setActiveTab('pending')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #FACC15', fontWeight: '700', cursor: 'pointer', fontSize: '13px', background: activeTab === 'pending' ? '#1E3A8A' : 'white', color: activeTab === 'pending' ? '#FACC15' : '#1E3A8A' }}>
          Pending Claims ({pendingClaims.length}) <Clock size={12} style={{display: 'inline', marginLeft: '4px'}}/>
        </button>
        <button onClick={() => setActiveTab('report')} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #FACC15', fontWeight: '700', cursor: 'pointer', fontSize: '13px', background: activeTab === 'report' ? '#1E3A8A' : 'white', color: activeTab === 'report' ? '#FACC15' : '#1E3A8A' }}>
          Assistance Report
        </button>
      </div>

      {activeTab === 'pending' ? (
        <div style={{...styles.card, padding: 0, overflowX: 'auto', background: 'white'}}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Type</th><th style={styles.th}>Amount</th><th style={styles.th}>Recorded By</th><th style={styles.th}>Action</th></tr></thead>
            <tbody>
              {pendingClaims.length === 0 ? <tr><td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>No pending claims for approval</td></tr> :
                pendingClaims.map(c => (
                  <tr key={c.id}>
                    <td style={styles.td}><b>{c.name}</b></td>
                    <td style={styles.td}>{c.type}</td>
                    <td style={{...styles.td, fontWeight: '700'}}>₱{c.amount?.toLocaleString()}</td>
                    <td style={styles.td}>{c.recordedBy || 'Staff'}</td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', gap: '6px'}}>
                        <button onClick={() => handleApproveClaim(c)} style={{background: '#16A34A', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'}}><Check size={12}/> Approve</button>
                        <button onClick={() => handleRejectClaim(c)} style={{background: '#DC2626', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'}}><X size={12}/> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (
        <table style={styles.table}>
          <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Type</th><th style={styles.th}>Beneficiary</th><th style={{...styles.th, textAlign: 'right'}}>Amount</th></tr></thead>
          <tbody>
            {records.length === 0 ? <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>No records yet</td></tr> :
              records.map(r => (
                <tr key={r.id}><td style={styles.td}>{r.date?.toDate().toLocaleDateString('en-PH') || 'N/A'}</td><td style={styles.td}>{r.type}</td><td style={styles.td}>{r.beneficiary}</td><td style={{...styles.td, textAlign: 'right', fontWeight: '700'}}>₱{(r.amount || 0).toLocaleString()}</td></tr>
              ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#1E3A8A', fontFamily: "'Poppins', sans-serif", marginBottom: '16px'}}>Add Budget</h2>
            <label style={{fontSize: '13px', fontWeight: '700', color: '#1E3A8A'}}>Amount to Add</label>
            <input type="number" placeholder="50000" value={addAmount} onChange={e => setAddAmount(e.target.value)} style={styles.input} />
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button style={{...styles.actionBtn, background: '#FACC15', color: '#1E3A8A'}} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.actionBtn} onClick={handleAddBudget}>Confirm Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminFundTab;