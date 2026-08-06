import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Home, MessageSquare, User, Square, LogOut, Bell, BookOpen, Megaphone, Download, FileText, Image } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { collection, query, orderBy, where, onSnapshot } from 'firebase/firestore';

import HomeSP from "./SoloParentTab/HomeSP";
import RA11861 from "./SoloParentTab/RA11861";
import Announcements from './SoloParentTab/Announcements';
import CommunityForum from './SoloParentTab/CommunityForum';
import Profile from './SoloParentTab/Profile';
import Assistance from './SoloParentTab/Assistance';

// ==========================================
// SOLO PARENT DASHBOARD PAGE - V4 FULL MOBILE
// THEME: YELLOW #FACC15, WHITE #FFFFFF, BLUE #1E3A8A
// ==========================================
function SoloParentPage() {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userName = userData?.name || 'Loading...';
  const soloParentId = userData?.idNumber || 'SP-000';
  const category = userData?.category || 'A1';
  const expiryDate = userData?.expiryDate || 'Dec 31, 2026';
  const userInitial = userName !== 'Loading...' ? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';

  const [showSidebar, setShowSidebar] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('id');
  const idCardRef = useRef(null);

  // PARA SA ANNOUNCEMENTS
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null); // PARA SA MODAL

  const [soloparentData, setSoloparentData] = useState(null); // PARA SA ID
  const [loadingSP, setLoadingSP] = useState(true); // LOADING NG ID

  useEffect(() => {
    if (!userData?.uid) return;
    setLoadingSP(true);
    const q = query(collection(db, "soloparent"), where("uid", "==", userData.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (!querySnapshot.empty) {
        let data = {
          id: querySnapshot.docs[0].id, // <-- DAGDAG MO ITO
          ...querySnapshot.docs[0].data()
        };

        // 2. COMPUTE EXPIRY KUNG MERON ISSUANCE
        if (data.issuanceDate) {
          const issue = new Date(data.issuanceDate);
          if (!isNaN(issue)) { // check kung valid date
            issue.setFullYear(issue.getFullYear() + 1);
            data.expiryDate = issue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          }
        }

        setSoloparentData(data);
      } else {
        setSoloparentData(null); // Gawin nating null hindi {}
      }
      setLoadingSP(false);
    });
    return () => unsubscribe();
  }, [userData]);
  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      where('status', '==', 'published'), // PUBLISHED LANG
      orderBy('date', 'desc') // LATEST FIRST
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAnnouncements(data);
      setLoadingAnnouncements(false);
    });

    return () => unsubscribe();
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
    setActiveTab(tab);
    setShowSidebar(false);
  }

  const handleDownloadID = async (format) => {
    if (!idCardRef.current) return;

    // GUMAWA TAYO NG HIDDEN DIV NA STANDARD SIZE
    const printDiv = idCardRef.current.cloneNode(true);
    printDiv.style.position = 'absolute';
    printDiv.style.left = '-9999px';
    printDiv.style.width = '1011px'; // 85.6mm * 300dpi / 25.4
    printDiv.style.height = '638px'; // 53.98mm * 300dpi / 25.4
    printDiv.style.transform = 'scale(1)';
    printDiv.style.fontSize = '24px'; // Palakihin fonts para sa print
    document.body.appendChild(printDiv);

    const canvas = await html2canvas(printDiv, {
      scale: 1,
      backgroundColor: '#ffffff',
      width: 1011,
      height: 638,
      useCORS: true
    });

    document.body.removeChild(printDiv); // Tanggalin after

    const imgData = canvas.toDataURL('image/png');

    if (format === 'pdf') {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [53.98, 85.6] });
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`SoloParentID-${soloParentId}.pdf`);
    }
    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `SoloParentID-${soloParentId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const styles = {
    layout: { fontFamily: "'Inter', 'Poppins', Arial, sans-serif", background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px', borderBottom: '3px solid #FACC15', position: 'relative', zIndex: 50 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '20px' },
    profileBtn: { width: '44px', height: '44px', background: '#1E3A8A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', border: '2px solid #FACC15', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
    iconBtn: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#1E3A8A', position: 'relative', display: 'flex' },
    badge: { position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#DC2626', borderRadius: '50%', border: '2px solid white' },
    dropdown: { position: 'absolute', top: '50px', right: '0', background: 'white', border: '2px solid #FACC15', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '8px 0', minWidth: '240px', zIndex: 60 },
    sidebarOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 },
    sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#1E3A8A', zIndex: 101, padding: '24px', display: 'flex', flexDirection: 'column', color: 'white' },
    sidebarHeader: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
    sidebarUser: { marginBottom: '12px', padding: '12px', background: 'rgba(250,204,21,0.15)', borderRadius: '10px', border: '1px solid #FACC15' },
    sidebarUserName: { fontWeight: '800', color: '#FACC15', fontSize: '16px', fontFamily: "'Poppins', sans-serif" },
    sidebarUserId: { fontSize: '12px', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' },
    sidebarMenu: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    sidebarMenuItem: { padding: '14px', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Inter', sans-serif" },
    sidebarMenuItemActive: { background: '#FACC15', color: '#1E3A8A', fontWeight: '800' },
    sidebarFooter: { marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' },
    logoutBtn: { width: '100%', padding: '14px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    content: { flex: 1, padding: '16px 12px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '20px', },
    downloadBtn: { padding: '10px 16px', background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
    card: { background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
    cardTitle: { margin: '0 0 16px 0', color: '#1E3A8A', fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif" },
    idCard: { background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', borderRadius: '12px', padding: '20px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(30, 58, 138, 0.3)', border: '2px solid #FACC15', width: '101.6mm', height: '63.9mm', boxSizing: 'border-box' },
    idHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    idGovText: { fontSize: '12px', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0, color: '#FACC15' },
    idTitle: { fontSize: '20px', fontWeight: '800', margin: '6px 0 0 0', fontFamily: "'Poppins', sans-serif" },
    idNumber: { fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'monospace', color: '#FACC15' },
    idBody: { display: 'flex', gap: '16px', alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' },
    idPhotoFrame: { width: 'clamp(60px, 20vw, 90px)', height: 'clamp(60px, 20vw, 90px)', background: 'rgba(250,204,21,0.2)', borderRadius: '12px', border: '3px solid #FACC15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' },
    idDetails: { display: 'flex', flexDirection: 'column', gap: '10px' },
    idLabel: { fontSize: '12px', opacity: 0.8, margin: 0, color: '#FACC15' },
    idValue: { fontSize: '16px', fontWeight: '700', margin: 0 },
    announcementItem: { padding: '18px 20px', borderBottom: '1px solid #FEF3C7', cursor: 'pointer' },
    announcementDate: { fontSize: '12px', color: '#92400E', marginBottom: '6px', fontWeight: '600' },
    announcementTitle: { fontSize: '16px', color: '#1E3A8A', fontWeight: '800', margin: 0, fontFamily: "'Poppins', sans-serif" },
    announcementPreview: { fontSize: '14px', color: '#475569', marginTop: '8px', lineHeight: '1.5' },
    raContent: { background: 'white', borderRadius: '16px', padding: '28px', border: '2px solid #FACC15' },
    raTitle: { fontSize: '24px', fontWeight: '800', color: '#1E3A8A', marginBottom: '16px', fontFamily: "'Poppins', sans-serif" },
    raText: { fontSize: '15px', lineHeight: '1.8', color: '#334155' }
  };

  return (
    <div style={styles.layout} onClick={() => { setShowSidebar(false); setShowNotifDropdown(false); }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Poppins:wght@700;800&display=swap');
       .sidebar-menu-item:hover { background: rgba(250, 204, 21, 0.2); }
       .sidebar-menu-item-active:hover { background: #FACC15; }
       .announcement-hover:hover { background: #FFFBEB; }
       .download-btn:hover { background: #FACC15; color: #1E3A8A; }

        /* MOBILE RESPONSIVE */
        @media (max-width: 900px) {
         .sp-home-grid {
            grid-template-columns: 1fr!important;
          }
         .sp-id-wrapper {
            flex-direction: column!important;
            align-items: center!important;
          }
         .sp-download-btn {
            align-self: flex-end!important;
            margin-left: 0!important;
            margin-top: -10px!important;
          }
         .sp-multimedia-grid {
            grid-template-columns: repeat(3, 1fr)!important;
          }
        }
        @media (max-width: 600px) {
         .sp-multimedia-grid {
            grid-template-columns: 1fr!important;
          }
        }
      `}</style>

      {showSidebar && (
        <>
          <div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)}></div>
          <div style={styles.sidebar} onClick={(e) => e.stopPropagation()}>
            <div style={styles.sidebarHeader}>
              <div style={styles.sidebarUser}>
                <div style={styles.sidebarUserName}>{userName}</div>
                <div style={styles.sidebarUserId}>ID: {soloParentId}</div>
              </div>
            </div>
            <div style={styles.sidebarMenu}>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'id' && styles.sidebarMenuItemActive) }} className={activeTab === 'id' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('id')}> <Home size={20} /> Home </div>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'ra11861' && styles.sidebarMenuItemActive) }} className={activeTab === 'ra11861' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('ra11861')}> <BookOpen size={20} /> RA 11861 </div>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'announcements' && styles.sidebarMenuItemActive) }} className={activeTab === 'announcements' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('announcements')}> <Megaphone size={20} /> Announcements </div>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'community' && styles.sidebarMenuItemActive) }} className={activeTab === 'community' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('community')} > <MessageSquare size={20} /> Community </div>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'profile' && styles.sidebarMenuItemActive) }} className={activeTab === 'profile' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('profile')} > <User size={20} /> Profile </div>
              <div style={{ ...styles.sidebarMenuItem, ...(activeTab === 'assistance' && styles.sidebarMenuItemActive) }} className={activeTab === 'assistance' ? "sidebar-menu-item-active" : "sidebar-menu-item"} onClick={() => handleTabChange('assistance')} > <User size={20} /> Assistance </div>
            </div>
            <div style={styles.sidebarFooter}>
              <button style={styles.logoutBtn} onClick={handleLogout}> <LogOut size={20} /> Logout </button>
            </div>
          </div>
        </>
      )}

      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.profileBtn} onClick={(e) => { e.stopPropagation(); setShowSidebar(true); }}> {userInitial} </button>
          <img src="/images/MSWD.png" alt="Logo" style={{ height: '40px' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div style={styles.headerRight}>
          <div style={{ position: 'relative' }}>
            <button style={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setShowNotifDropdown(!showNotifDropdown); }}>
              <Bell size={26} color="#FACC15" />
              <div style={styles.badge}></div>
            </button>
            {showNotifDropdown && (<div style={{ ...styles.dropdown, right: '-10px', width: '280px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '2px solid #FACC15', fontWeight: '800', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif" }}>Notifications</div>
              <div style={{ padding: '12px 16px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #FEF3C7' }}>
                <strong>Benefit Claim Available:</strong> You are eligible for the Q3 Educational Assistance.
              </div>
            </div>)}
          </div>
        </div>
      </header>

      <div style={styles.content} className="sp-content">
        {activeTab === 'id' && (
          <HomeSP
            styles={styles}
            soloparentData={soloparentData}
            handleDownloadID={handleDownloadID}
            idCardRef={idCardRef}
            setActiveTab={setActiveTab} // DAGDAG TO
            announcements={announcements} // DAGDAG TO
            loadingAnnouncements={loadingAnnouncements} // DAGDAG TO
          />
        )}

        {activeTab === 'ra11861' && (
          <RA11861 styles={styles} />
        )}

        {activeTab === 'announcements' && (
          <Announcements
            announcements={announcements}
            loadingAnnouncements={loadingAnnouncements}
            styles={styles}
            setSelectedAnnouncement={setSelectedAnnouncement}
            selectedAnnouncement={selectedAnnouncement} />
        )}

        {activeTab === 'community' && (
          <CommunityForum user={auth.currentUser} userData={userData} />
        )}

        {activeTab === 'profile' && (
          <Profile
            styles={styles}
            soloparentData={soloparentData}
            userId={soloparentData?.id} // <-- DAGDAG MO ITO
            setSoloparentData={setSoloparentData}
            user={auth.currentUser}
            theme={{ yellow: '#FACC15', text: '#1E3A8A', textMuted: '#64748b', red: '#DC2626' }} />
        )}

        {activeTab === 'assistance' && (
          <Assistance styles={styles} />
        )}
      </div>
    </div>
  );
}

export default SoloParentPage;