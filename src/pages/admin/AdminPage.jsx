import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Wallet, Settings, LogOut, Users, UserCheck, DollarSign, Activity } from 'lucide-react'; // DINAGDAG SI ACTIVITY
import AdminDashboardTab from './AdminTab/AdminDashboardTab';
import AdminContentTab from './AdminTab/AdminContentTab';
import AdminFundTab from './AdminTab/AdminFundTab';
import AdminConfigTab from './AdminTab/AdminConfigTab';
import AdminStaffTab from './AdminTab/AdminStaffTab';
import AdminAuditTab from './AdminTab/AdminAuditTab'; // DINAGDAG

const generatePassword = () => { const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; const lower = 'abcdefghijklmnopqrstuvwxyz'; const nums = '0123456789'; const special = '!@#$%^&*'; const all = upper + lower + nums + special; let pwd = ''; pwd += upper[Math.floor(Math.random() * upper.length)]; pwd += lower[Math.floor(Math.random() * lower.length)]; pwd += nums[Math.floor(Math.random() * nums.length)]; for (let i = 0; i < 7; i++) { pwd += all[Math.floor(Math.random() * all.length)]; } return pwd.split('').sort(() => 0.5 - Math.random()).join(''); };

function AdminPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userName = userData?.name || 'Admin';
  const userInitial = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);

  const [soloCount, setSoloCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [totalFund, setTotalFund] = useState(0);
  const [staffData, setStaffData] = useState([]);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', mobile: '', role: 'MSWD Staff', barangays: [] });
  const [tempPassword, setTempPassword] = useState(generatePassword());

  useEffect(() => {
    const unsubSolo = onSnapshot(collection(db, "soloparent"), (snap) => setSoloCount(snap.size));
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      setStaffCount(snap.size);
      setStaffData(snap.docs.map(doc => ({id: doc.id, ...doc.data()})));
    });
    const unsubFund = onSnapshot(collection(db, "fund"), (snap) => {
      let total = 0;
      snap.forEach(doc => total += doc.data().amount || 0);
      setTotalFund(total);
    });
    return () => { unsubSolo(); unsubStaff(); unsubFund(); }
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleTabChange = (tab) => {
    setCurrentView(tab);
    setShowSidebar(false);
  }

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddStaffSubmit = async (e) => { /* SAME SA CODE MO */ 
    e.preventDefault();
    try {
      const secondaryApp = getApps().find(app => app.name === "StaffCreator") ? getApp("StaffCreator") : initializeApp(firebaseConfig, "StaffCreator");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newStaffForm.email, tempPassword);
      const newUser = userCredential.user;
      await signOut(secondaryAuth);
      const assignedBarangays = newStaffForm.barangays.length > 0 ? newStaffForm.barangays.join(', ') : 'Unassigned';
      await setDoc(doc(db, 'staff', newUser.uid), { name: newStaffForm.name, email: newStaffForm.email, role: newStaffForm.role, barangay: assignedBarangays, status: 'Active', registrationDate: new Date().toISOString() });
      setShowAddStaffModal(false);
      showToast(`Staff account created: ${newStaffForm.email}`);
    } catch (error) {
      alert('Failed to create staff account: ' + error.message);
    }
  };

  const styles = {
    layout: { fontFamily: "'Inter', 'Poppins', Arial, sans-serif", background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', borderBottom: '3px solid #FACC15', position: 'relative', zIndex: 50 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    menuBtn: { width: '40px', height: '40px', background: '#1E3A8A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', border: '2px solid #FACC15', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
    sidebarOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 },
    sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#1E3A8A', zIndex: 101, padding: '24px', display: 'flex', flexDirection: 'column', color: 'white' },
    sidebarHeader: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
    sidebarUser: { marginBottom: '12px', padding: '12px', background: 'rgba(250,204,21,0.15)', borderRadius: '10px', border: '1px solid #FACC15' },
    sidebarUserName: { fontWeight: '800', color: '#FACC15', fontSize: '14px', fontFamily: "'Poppins', sans-serif" },
    sidebarUserId: { fontSize: '11px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' },
    sidebarMenu: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    sidebarMenuItem: { padding: '12px', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'Inter', sans-serif" },
    sidebarMenuItemActive: { background: '#FACC15', color: '#1E3A8A', fontWeight: '800' },
    sidebarFooter: { marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' },
    logoutBtn: { width: '100%', padding: '12px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '10px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    content: { flex: 1, padding: '16px 12px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' },
    card: { background: 'white', borderRadius: '16px', padding: '20px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
    cardTitle: { margin: '0 0 12px 0', color: '#1E3A8A', fontSize: '16px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif" },
    cardValue: { margin: 0, color: '#1E3A8A', fontSize: '26px', fontWeight: '800', fontFamily: "'Poppins', sans-serif" },
    toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#16A34A', color: 'white', padding: '12px 16px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 200, fontSize: '13px', fontWeight: '700', fontFamily: "'Poppins', sans-serif" },
  };

  // COMPLETE NA YUNG MENU
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'staff-table', label: 'Staff Accounts', icon: <Users size={18} /> },
    { key: 'content', label: 'Content Management', icon: <FileText size={18} /> },
    { key: 'fund', label: 'Fund Settings', icon: <Wallet size={18} /> },
    { key: 'config', label: 'System Config', icon: <Settings size={18} /> },
    { key: 'audit', label: 'Audit Logs', icon: <Activity size={18} /> }, // ITO YUNG AUDIT LOGS
  ];

  return (
    <div style={styles.layout} onClick={() => setShowSidebar(false)}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@700;800&display=swap');.sidebar-menu-item:hover { background: rgba(250, 204, 21, 0.2); }.sidebar-menu-item-active:hover { background: #FACC15; }`}</style>

      {showSidebar && (
        <>
          <div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)}></div>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sidebarHeader}>
              <div style={styles.sidebarUser}>
                <div style={styles.sidebarUserName}>{userName}</div>
                <div style={styles.sidebarUserId}>ADMIN</div>
              </div>
            </div>
            <div style={styles.sidebarMenu}>
              {menuItems.map(item => (
                <div key={item.key} style={{...styles.sidebarMenuItem,...(currentView === item.key && styles.sidebarMenuItemActive) }} className={currentView === item.key? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange(item.key)}>
                  {item.icon} {item.label}
                </div>
              ))}
            </div>
            <div style={styles.sidebarFooter}>
              <button style={styles.logoutBtn} onClick={handleLogout}><LogOut size={18} /> Logout</button>
            </div>
          </div>
        </>
      )}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.menuBtn} onClick={(e) => { e.stopPropagation(); setShowSidebar(true); }}>
            {userInitial}
          </button>
          <img src="/images/MSWD.png" alt="Logo" style={{ height: '40px' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div></div>
      </header>

      <div style={styles.content}>
        {currentView === 'dashboard' && (
          <div style={styles.grid}>
            <div style={styles.card}><h3 style={styles.cardTitle}><Users size={18}/> Active Solo Parent</h3><p style={styles.cardValue}>{soloCount}</p></div>
            <div style={styles.card}><h3 style={styles.cardTitle}><UserCheck size={18}/> Active Staff</h3><p style={styles.cardValue}>{staffCount}</p></div>
            <div style={styles.card}><h3 style={styles.cardTitle}><DollarSign size={18}/> Total Fund</h3><p style={styles.cardValue}>₱{totalFund.toLocaleString()}</p></div>
          </div>
        )}
        {currentView === 'staff-table' && <AdminStaffTab staffData={staffData} setCurrentView={setCurrentView} setShowAddStaffModal={setShowAddStaffModal} />}
        {currentView === 'content' && <AdminContentTab showToast={showToast} />}
        {currentView === 'fund' && <AdminFundTab showToast={showToast} />}
        {currentView === 'config' && <AdminConfigTab showToast={showToast} />}
        {currentView === 'audit' && <AdminAuditTab />} {/* ITO YUNG AUDIT LOGS TAB */}
      </div>

      {showAddStaffModal && ( <div> ...modal mo dito... </div> )}
      {toastMsg && <div style={styles.toast}>✓ {toastMsg}</div>}
    </div>
  );
}

export default AdminPage;