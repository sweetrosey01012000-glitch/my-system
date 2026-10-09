import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { doc, setDoc, collection, onSnapshot } from 'firebase/firestore';
import { auth, db, firebaseConfig } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Wallet, Settings, LogOut, Users, Menu, X, Activity, HeartHandshake, Sun, Moon, Clock } from 'lucide-react';
import AdminDashboardTab from './AdminTab/AdminDashboardTab';
import AdminContentTab from './AdminTab/AdminContentTab';
import AdminFundTab from './AdminTab/AdminFundTab';
import AdminStaffTab from './AdminTab/AdminStaffTab';
import AdminSoloParentTab from './AdminTab/AdminSoloParentTab.jsx';
import AdminSettingsTab from './AdminTab/AdminSettingsTab';
import AdminPending from './AdminTab/AdminPending.jsx'

const generatePassword = () => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const special = '!@#$%^&*';
  const all = upper + lower + nums + special;
  let pwd = '';
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += nums[Math.floor(Math.random() * nums.length)];
  for (let i = 0; i < 7; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd.split('').sort(() => 0.5 - Math.random()).join('');
};

function AdminPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userName = userData?.name || 'Admin';
  const userInitial = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [toastMsg, setToastMsg] = useState(null);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [soloCount, setSoloCount] = useState(0);
  const [soloApprovedCount, setSoloApprovedCount] = useState(0);
  const [soloParents, setSoloParents] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [staffData, setStaffData] = useState([]);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', mobile: '', role: 'MSWD Staff', barangays: [] });
  const [tempPassword, setTempPassword] = useState(generatePassword());
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');

  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);

  const C = isDark ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#cbd5e1', muted: '#94a3b8' } : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  useEffect(() => {
    const unsubSolo = onSnapshot(collection(db, "soloparent"), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSoloParents(data);
      setSoloCount(snap.size);
      setSoloApprovedCount(data.filter(s => s.status === 'Approved' || s.status === 'Active').length);
    });
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      setStaffCount(snap.size);
      setStaffData(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubSolo(); unsubStaff(); }
  }, []);

  const confirmLogout = () => setShowLogoutModal(true);
  const handleLogout = async () => { try { await signOut(auth); localStorage.clear(); navigate('/'); } catch (error) { console.error(error); } };
  const handleTabChange = (tab) => { setCurrentView(tab); setShowSidebar(false); }
  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 4000); };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const secondaryApp = getApps().find(app => app.name === "StaffCreator") ? getApp("StaffCreator") : initializeApp(firebaseConfig, "StaffCreator");
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newStaffForm.email, tempPassword);
      await signOut(secondaryAuth);
      const assignedBarangays = newStaffForm.barangays.length > 0 ? newStaffForm.barangays.join(', ') : 'Unassigned';
      await setDoc(doc(db, 'staff', userCredential.user.uid), { name: newStaffForm.name, email: newStaffForm.email, role: newStaffForm.role, barangay: assignedBarangays, status: 'Active', registrationDate: new Date().toISOString() });
      setShowAddStaffModal(false);
      showToast(`Staff account created: ${newStaffForm.email}`);
      setNewStaffForm({ name: '', email: '', mobile: '', role: 'MSWD Staff', barangays: [] });
      setTempPassword(generatePassword());
    } catch (error) { alert('Failed: ' + error.message); }
  };

  // UPDATED MENU WITH PENDING BES!
  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'pending', label: 'Pending Approvals', icon: Clock },
    { key: 'solo-parents', label: 'Solo Parents', icon: HeartHandshake, badge: soloApprovedCount },
    { key: 'staff-table', label: 'Staff Accounts', icon: Users },
    { key: 'content', label: 'Content Management', icon: FileText },
    { key: 'fund', label: 'Fund Settings', icon: Wallet },
  ];

  const styles = {
    layout: { fontFamily: "'Inter', sans-serif", background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: '0.3s' },
    content: { flex: 1, padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', background: C.bg },
    toast: { position: 'fixed', bottom: '24px', right: '24px', background: '#16a34a', color: 'white', padding: '12px 18px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 999, fontSize: '13px', fontWeight: '700' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    iconBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text, transition: '0.2s' }
  };

  return (
    <div style={styles.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; box-sizing: border-box; }
        .app-container { display: flex; height: 100vh; overflow: hidden; background: ${C.bg}; }
        .left-panel { width: 280px; background: ${isDark ? 'linear-gradient(180deg, #151a27 0%, #1e222e 100%)' : 'linear-gradient(180deg, #1e3a8a 0%, #2046a8 50%, #2563eb 100%)'}; display: flex; flex-direction: column; flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow: hidden; box-shadow: 4px 0 24px rgba(30, 58, 138, 0.15); border-right: 1px solid ${C.border}; }
        .left-header { height: 72px; background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); display: flex; align-items: center; padding: 0 16px; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
        .left-sidebar { flex: 1; display: flex; flex-direction: column; padding: 14px 12px 12px 12px; overflow: hidden; }
        .menu-list { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .menu-item { padding: 11px 14px; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 13.5px; color: rgba(255,255,255,0.82); border: 1px solid transparent; position: relative; transition: all 0.3s; }
        .menu-item:hover { background: rgba(255,255,255,0.08); color: white; transform: translateX(2px); }
        .menu-item.active { background: #fefce8; color: #1e3a8a; font-weight: 700; transform: translateX(3px); box-shadow: 0 8px 32px rgba(250,204,21,0.22); }
        .right-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; background: ${C.bg}; height: 100vh; overflow: hidden; }
        .right-header { height: 72px; background: ${C.card}; display: flex; justify-content: space-between; align-items: center; padding: 0 24px; gap: 10px; box-shadow: 0 1px 0 ${C.border}; flex-shrink: 0; }
        .main-content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; background: ${C.bg}; }
        .mobile-fab { display: none; }
        @media (max-width: 1024px) {.left-panel { display: none!important; }.mobile-fab { display: flex!important; position: fixed; bottom: 20px; left: 20px; width: 54px; height: 54px; background: #1e3a8a; color: white; border: none; border-radius: 14px; align-items: center; justify-content: center; z-index: 90; cursor: pointer; } }
      `}</style>

      {showLogoutModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div style={{ background: C.card, borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', background: '#fef3c7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}><LogOut size={26} color="#d97706" /></div>
            <h3 style={{ fontWeight: '800', fontSize: '18px', color: C.text, marginBottom: '8px' }}>Do you want to logout?</h3>
            <p style={{ fontSize: '13px', color: C.muted, marginBottom: '22px' }}>You will be redirected to the landing page.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '12px', background: C.card2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Stay</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '12px', background: '#facc15', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100 }} onClick={() => setShowSidebar(false)}></div>
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: isDark ? C.card : 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)', zIndex: 101, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>
            <div style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e3a8a' }}>{userInitial}</div>
              <div><div style={{ fontWeight: '800', color: 'white', fontSize: '13px' }}>{userName}</div><div style={{ fontSize: '10px', color: '#fde68a' }}>Online - Admin</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '14px 12px', flex: 1 }}>
              <div className="menu-list">{menuItems.map(item => (
                <div key={item.key} className={`menu-item ${currentView === item.key ? 'active' : ''}`} onClick={() => handleTabChange(item.key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><item.icon size={18} /> {item.label}</div>
                  {item.badge > 0 && <span style={{ background: '#facc15', color: '#1e3a8a', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>{item.badge}</span>}
                </div>
              ))}</div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button style={{ width: '100%', padding: '12px', background: '#facc15', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={confirmLogout}><LogOut size={18} /> Logout</button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="app-container">
        <div className="left-panel">
          <div className="left-header">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e3a8a' }}>{userInitial}</div>
            <div><div style={{ fontWeight: '800', color: 'white', fontSize: '14px' }}>{userName}</div><div style={{ fontSize: '11px', color: '#fde68a', fontWeight: '600' }}>Online - Admin</div></div>
          </div>
          <div className="left-sidebar">
            <div className="menu-list">
              {menuItems.map(item => (
                <div key={item.key} className={`menu-item ${currentView === item.key ? 'active' : ''}`} onClick={() => handleTabChange(item.key)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><item.icon size={19} /> {item.label}</div>
                  {item.badge > 0 && <span style={{ background: '#facc15', color: '#1e3a8a', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '20px' }}>{item.badge}</span>}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button style={{ width: '100%', padding: '13px', background: '#facc15', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }} onClick={confirmLogout}><LogOut size={18} /> Logout</button>
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="right-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src="/images/MSWD.png" alt="Logo" style={{ height: '32px' }} onError={(e) => e.target.style.display = 'none'} />
              <div style={{ fontWeight: '800', color: C.text, fontSize: '14px', textTransform: 'capitalize' }}>{currentView.replace('-', ' ')}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button style={{ ...styles.iconBtn, background: currentView === 'settings' ? '#1e3a8a' : C.card, border: `1px solid ${currentView === 'settings' ? '#1e3a8a' : C.border}`, }} onClick={() => setCurrentView('settings')} title="Admin Settings">
                <Settings size={20} color={currentView === 'settings' ? '#facc15' : C.text} />
              </button>
            </div>
          </div>
          <div className="main-content" style={styles.content}>
            {currentView === 'dashboard' && <AdminDashboardTab setCurrentView={setCurrentView} soloApprovedCount={soloApprovedCount} />}
            {currentView === 'pending' && <AdminPending />}
            {currentView === 'solo-parents' && <AdminSoloParentTab soloParents={soloParents} showToast={showToast} />}
            {currentView === 'staff-table' && <AdminStaffTab staffData={staffData} setCurrentView={setCurrentView} setShowAddStaffModal={setShowAddStaffModal} />}
            {currentView === 'content' && <AdminContentTab showToast={showToast} />}
            {currentView === 'fund' && <AdminFundTab showToast={showToast} />}
            {currentView === 'settings' && <AdminSettingsTab />}
          </div>
        </div>
      </div>
      <button className="mobile-fab" onClick={() => setShowSidebar(true)}><Menu size={22} /></button>

      {showAddStaffModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddStaffModal(false)}>
          <div style={{ background: C.card, borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '20px', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: C.text }}><h3 style={{ margin: 0, fontWeight: '800' }}>Add New Staff</h3><X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddStaffModal(false)} /></div>
            <form onSubmit={handleAddStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Full Name" value={newStaffForm.name} onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })} required style={{ padding: '11px 14px', border: `1px solid ${C.border}`, borderRadius: '10px', background: C.card2, color: C.text }} />
              <input placeholder="Email" type="email" value={newStaffForm.email} onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })} required style={{ padding: '11px 14px', border: `1px solid ${C.border}`, borderRadius: '10px', background: C.card2, color: C.text }} />
              <div style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: C.text }}>Temp: <b>{tempPassword}</b></div>
              <button type="submit" style={{ background: '#1e3a8a', color: '#facc15', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>Create Staff</button>
            </form>
          </div>
        </div>
      )}
      {toastMsg && <div style={styles.toast}>✓ {toastMsg}</div>}
    </div>
  );
}
export default AdminPage;