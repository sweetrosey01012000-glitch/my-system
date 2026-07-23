import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FileText, Gift, Building2, MessageSquare, User, Square, LogOut, Bell } from 'lucide-react';

// ==========================================
// SOLO PARENT DASHBOARD PAGE
// ==========================================
function SoloParentPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();

  const userName = userData?.name || 'Loading...';
  const soloParentId = userData?.idNumber || 'SP-000000';
  const category = userData?.category || 'A1';
  const expiryDate = userData?.expiryDate || 'Dec 31, 2026';
  const userInitial = userName !== 'Loading...' ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';

  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      localStorage.clear();
      navigate('/'); // Direct sa landingpage
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const styles = {
    layout: { fontFamily: 'Arial, sans-serif', background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '72px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', borderBottom: '1px solid #E2E8F0', position: 'relative', zIndex: 50 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },

    // BILOG NA PROFILE BUTTON
    profileBtn: {
      width: '40px',
      height: '40px',
      background: '#1E3A8A',
      color: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      fontWeight: 'bold',
      border: 'none',
      cursor: 'pointer'
    },

    iconBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748B', position: 'relative', display: 'flex' },
    badge: { position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#DC2626', borderRadius: '50%', border: '2px solid white' },
    dropdown: { position: 'absolute', top: '50px', right: '0', background: 'white', border: '1px solid #E2E8F0', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '8px 0', minWidth: '200px', zIndex: 60 },

    // SIDEBAR STYLES
    sidebarOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 },
    sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: 'white', zIndex: 101, padding: '24px', display: 'flex', flexDirection: 'column' },
    sidebarHeader: { marginBottom: '24px' },
    sidebarTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1E3A8A', margin: 0 },
    sidebarSubtitle: { fontSize: '12px', color: '#64748B', margin: 0 },
    sidebarMenu: { display: 'flex', flexDirection: 'column', gap: '4px' },
    sidebarMenuItem: { padding: '12px', borderRadius: '8px', cursor: 'pointer', color: '#334155', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '12px' },
    sidebarFooter: { marginTop: 'auto', borderTop: '1px solid #E2E8F0', paddingTop: '16px' },
    sidebarUser: { marginBottom: '12px' },
    sidebarUserName: { fontWeight: 'bold', color: '#1E3A8A' },
    sidebarUserId: { fontSize: '12px', color: '#64748B' },
    logoutBtn: { width: '100%', padding: '12px', background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },

    content: { flex: 1, padding: '24px', maxWidth: '1000px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }, // TINANGGAL GRID
    card: { background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    cardTitle: { margin: '0 0 16px 0', color: '#1E3A8A', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    idCard: { background: 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)', borderRadius: '16px', padding: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 25px rgba(30, 58, 138, 0.2)' },
    idHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    idGovText: { fontSize: '11px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 },
    idTitle: { fontSize: '18px', fontWeight: 'bold', margin: '4px 0 0 0' },
    idNumber: { fontSize: '20px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace' },
    idBody: { display: 'flex', gap: '20px', alignItems: 'center' },
    idPhotoFrame: { width: '90px', height: '90px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' },
    idDetails: { display: 'flex', flexDirection: 'column', gap: '8px' },
    idLabel: { fontSize: '11px', opacity: 0.7, margin: 0 },
    idValue: { fontSize: '15px', fontWeight: 'bold', margin: 0 },
    announcementItem: { padding: '16px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
    announcementDate: { fontSize: '12px', color: '#64748B', marginBottom: '4px' },
    announcementTitle: { fontSize: '15px', color: '#1E3A8A', fontWeight: 'bold', margin: 0 },
    announcementPreview: { fontSize: '13px', color: '#475569', marginTop: '6px', lineHeight: '1.4' }
  };

  return (
    <div style={styles.layout} onClick={() => { setShowSidebar(false); setShowNotifDropdown(false); }}>
      <style>{`
       .sidebar-menu-item:hover { background: #F1F5F9; }
       .announcement-hover:hover { background: #F8FAFC; }
      `}</style>

      {/* SIDEBAR */}
      {showSidebar && (
        <>
          <div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)}></div>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sidebarHeader}>
              <h2 style={styles.sidebarTitle}>Solo Parent</h2>
              <p style={styles.sidebarSubtitle}>Digital Services Portal</p>
            </div>
            <div style={styles.sidebarMenu}>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/dashboard')}>
                <LayoutDashboard size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Dashboard
              </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/applications')}>
                <FileText size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> My Applications
              </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/benefits')}>
                <Gift size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Benefits </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/programs')}>
                <Building2 size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> LGU Programs
              </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/forum')}>
                <MessageSquare size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Community
              </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/profile')}>
                <User size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Profile
              </div>
              <div style={styles.sidebarMenuItem} className="sidebar-menu-item" onClick={() => navigate('/support-tickets')}>
                <Square size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} /> Assistance
              </div>
            </div>
            <div style={styles.sidebarFooter}>
              <div style={styles.sidebarUser}>
                <div style={styles.sidebarUserName}>{userName}</div>
                <div style={styles.sidebarUserId}>ID: {soloParentId}</div>
              </div>
              <button style={styles.logoutBtn} onClick={handleLogout}>
                <LogOut size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* HEADER */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.profileBtn} onClick={(e) => { e.stopPropagation(); setShowSidebar(true); }}>
            {userInitial}
          </button>
          <img src="/images/MSWD.png" alt="Logo" style={{ height: '36px' }} onError={(e) => e.target.style.display = 'none'} />
          <span style={{ fontWeight: '900', fontSize: '18px', color: '#1E3A8A' }}>Solo Parent Portal</span>
        </div>

        <div style={styles.headerRight}>
          {/* TINANGGAL: Yung profile icon sa right */}
          <div style={{ position: 'relative' }}>
            <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
              <Bell size={24} color="#F59E0B" /> <div style={styles.badge}></div>
            </button>
            {showNotifDropdown && (
              <div style={{ ...styles.dropdown, right: '-10px', width: '280px' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 'bold', color: '#1E3A8A' }}>Notifications</div>
                <div style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #F1F5F9' }}>
                  <strong>Benefit Claim Available:</strong> You are eligible for the Q3 Educational Assistance.
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY CONTENT - DIGITAL ID LANG NASA TAAS */}
      <div style={styles.content} className="sp-content">
        {/* DIGITAL ID CARD */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', color: '#1E3A8A', margin: '0 0 16px 0' }}>Your Digital ID</h2>
          <div style={styles.idCard}>
            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            <div style={styles.idHeader}>
              <div>
                <p style={styles.idGovText}>Republic of the Philippines</p>
                <h3 style={styles.idTitle}>Solo Parent Identification Card</h3>
              </div>
              <div>
                <p style={{ ...styles.idGovText, textAlign: 'right', opacity: 0.8, fontSize: '10px', margin: '0 0 4px 0' }}>ID Number</p>
                <div style={styles.idNumber}>{soloParentId}</div>
              </div>
            </div>
            <div style={styles.idBody}>
              <div style={styles.idPhotoFrame}>👤</div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={styles.idDetails}>
                  <p style={styles.idLabel}>Full Name</p>
                  <p style={styles.idValue}>{userName}</p>
                </div>
                <div style={styles.idDetails}>
                  <p style={styles.idLabel}>Category</p>
                  <p style={styles.idValue}>{category.toUpperCase()}</p>
                </div>
                <div style={styles.idDetails}>
                  <p style={styles.idLabel}>Status</p>
                  <p style={{ ...styles.idValue, color: '#A7F3D0' }}>Active & Verified</p>
                </div>
                <div style={styles.idDetails}>
                  <p style={styles.idLabel}>Valid Until</p>
                  <p style={styles.idValue}>{expiryDate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENTS / NOTICES - NASA BABA NA NG ID */}
        <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
            <h3 style={{ ...styles.cardTitle, margin: 0 }}>📢 Latest Updates</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={styles.announcementItem} className="announcement-hover" onClick={() => navigate('/announcements')}>
              <div style={styles.announcementDate}>Oct 2, 2026 • General Info</div>
              <h4 style={styles.announcementTitle}>PhilHealth Registration Drive for Solo Parents</h4>
              <p style={styles.announcementPreview}>Ensure your dependents are covered. Join us at the town plaza this coming Friday...</p>
            </div>
            <div style={styles.announcementItem} className="announcement-hover" onClick={() => navigate('/announcements')}>
              <div style={styles.announcementDate}>Sep 28, 2026 • Livelihood</div>
              <h4 style={styles.announcementTitle}>Free Technical-Vocational Training</h4>
              <p style={styles.announcementPreview}>TESDA partnership courses are now open for enrollment. Limited slots available...</p>
            </div>
          </div>
          <button style={{ width: '100%', padding: '12px', background: 'white', border: 'none', color: '#2563EB', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }} onClick={() => navigate('/announcements')}>
            View All Announcements →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SoloParentPage;