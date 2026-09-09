import React, { useState, useEffect } from 'react';
import { Users, FileText, BookOpen, Wallet, Settings, Activity, AlertTriangle } from 'lucide-react';
import { db } from '../../../firebase';
import { collection, onSnapshot, doc } from 'firebase/firestore'; // DINAGDAG SI doc

const styles = {
  overviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  summaryCard: { background: 'white', borderRadius: '16px', padding: '20px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  summaryIcon: { width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(250, 204, 21, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1E3A8A' },
  summaryLabel: { fontSize: '13px', color: '#64748B', fontFamily: "'Inter', sans-serif", margin: 0 },
  summaryValue: { fontSize: '24px', fontWeight: '800', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif", margin: '4px 0 0 0' },
  mainGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' },
  card: { background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
  cardTitle: { margin: '0 0 16px 0', color: '#1E3A8A', fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif" },
  chartBox: { height: '200px', background: '#FFFBEB', borderRadius: '12px', border: '1px dashed #FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400E', fontWeight: '600', fontFamily: "'Inter', sans-serif" },
  logItem: { padding: '12px 0', borderBottom: '1px solid #FEF3C7', fontSize: '13px', fontFamily: "'Inter', sans-serif" },
  logTime: { color: '#64748B', fontSize: '12px' },
  actionBtn: { padding: '10px 16px', background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
  alertBox: { background: 'rgba(220, 38, 38, 0.1)', border: '2px solid #DC2626', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#DC2626', fontWeight: '600', fontFamily: "'Inter', sans-serif" }
};

export default function AdminDashboardTab({ setCurrentView, pendingInvitesCount }) {
  const [soloCount, setSoloCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [totalFund, setTotalFund] = useState(0);
  const [totalClaimed, setTotalClaimed] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);

  useEffect(() => {
    const unsubSolo = onSnapshot(collection(db, "soloparent"), (snap) => setSoloCount(snap.size));
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => setStaffCount(snap.size));

    // FIX: CHECK KUNG SINGLE DOC O MULTIPLE DOCS
    const unsubFund = onSnapshot(collection(db, "fund"), (snap) => {
      if (snap.empty) {
        setTotalFund(0);
        return;
      }
      // KUNG 1 LANG YUNG DOC, KUNIN YUNG totalAmount O amount
      if (snap.size === 1) {
        const data = snap.docs[0].data();
        setTotalFund(data.totalAmount || data.amount || 0);
      } else {
        // KUNG MARAMI, I-ADD LAHAT
        let total = 0;
        snap.forEach(doc => total += doc.data().amount || doc.data().totalAmount || 0);
        setTotalFund(total);
      }
    });

    const unsubClaims = onSnapshot(collection(db, "claims"), (snap) => {
      let claimed = 0;
      snap.forEach(doc => claimed += doc.data().amount || 0);
      setTotalClaimed(claimed);
    });

    const unsubAnn = onSnapshot(collection(db, "announcements"), (snap) => setAnnouncementCount(snap.size));

    return () => { unsubSolo(); unsubStaff(); unsubFund(); unsubClaims(); unsubAnn(); }
  }, []);

  const availableFund = totalFund - totalClaimed;

  return (
    <div className="anim-fade-in">
      {pendingInvitesCount > 0 && (
        <div style={styles.alertBox}>
          <AlertTriangle size={20} />
          <span>{pendingInvitesCount} Pending Staff Invites</span>
          <button style={{...styles.actionBtn, marginLeft: 'auto'}} onClick={() => setCurrentView('staff-table')}>Review</button>
        </div>
      )}

      <div style={styles.overviewGrid}>
        <div style={styles.summaryCard}><div><p style={styles.summaryLabel}>Active SP</p><h3 style={styles.summaryValue}>{soloCount.toLocaleString()}</h3></div><div style={styles.summaryIcon}><Users size={24} /></div></div>
        <div style={styles.summaryCard}><div><p style={styles.summaryLabel}>Active Staff</p><h3 style={styles.summaryValue}>{staffCount}</h3></div><div style={styles.summaryIcon}><Users size={24} /></div></div>
        <div style={styles.summaryCard}><div><p style={styles.summaryLabel}>Available Fund</p><h3 style={styles.summaryValue}>₱{availableFund.toLocaleString()}</h3></div><div style={styles.summaryIcon}><Wallet size={24} /></div></div>
        <div style={styles.summaryCard}><div><p style={styles.summaryLabel}>Total Fund</p><h3 style={styles.summaryValue}>₱{totalFund.toLocaleString()}</h3></div><div style={styles.summaryIcon}><Wallet size={24} /></div></div>
        <div style={styles.summaryCard}><div><p style={styles.summaryLabel}>Announcements</p><h3 style={styles.summaryValue}>{announcementCount}</h3></div><div style={styles.summaryIcon}><FileText size={24} /></div></div>
      </div>

      <div style={styles.mainGrid}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><Wallet size={20} /> Fund Utilization</h3>
          <div style={styles.chartBox}>
            Used: ₱{totalClaimed.toLocaleString()} / ₱{totalFund.toLocaleString()}
          </div>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}><Activity size={20} /> Recent Activity</h3>
          <div style={styles.logItem}><div><strong>System</strong> Dashboard Loaded</div><div style={styles.logTime}>Just now</div></div>
          <button style={{...styles.actionBtn, width: '100%', marginTop: '16px', justifyContent: 'center'}} onClick={() => setCurrentView('audit')}>View All Logs</button>
        </div>
      </div>

      <div style={{...styles.overviewGrid, marginTop: '20px'}}>
        <div style={{...styles.summaryCard, flexDirection: 'column', alignItems: 'flex-start'}}><div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><Users size={18} color="#1E3A8A" /><h4 style={{margin: 0, color: '#1E3A8A', fontFamily: "'Poppins', sans-serif"}}>Staff Accounts</h4></div><p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>Manage users and roles</p><button style={styles.actionBtn} onClick={() => setCurrentView('staff-table')}>+ Add Staff</button></div>
        <div style={{...styles.summaryCard, flexDirection: 'column', alignItems: 'flex-start'}}><div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><FileText size={18} color="#1E3A8A" /><h4 style={{margin: 0, color: '#1E3A8A', fontFamily: "'Poppins', sans-serif"}}>Content CMS</h4></div><p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>News, videos, posts</p><button style={styles.actionBtn} onClick={() => setCurrentView('content')}>Manage All</button></div>
        <div style={{...styles.summaryCard, flexDirection: 'column', alignItems: 'flex-start'}}><div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}><BookOpen size={18} color="#1E3A8A" /><h4 style={{margin: 0, color: '#1E3A8A', fontFamily: "'Poppins', sans-serif"}}>Resources</h4></div><p style={{fontSize: '13px', color: '#64748B', margin: '0 0 12px 0'}}>RA 11861 v2.1</p><button style={styles.actionBtn}>Update</button></div>
      </div>
    </div>
  );
}