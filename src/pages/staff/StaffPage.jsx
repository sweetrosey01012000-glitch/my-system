import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase'; // ayusin mo path kung iba sayo
import { useAuth } from '../../context/AuthContext'; // ayusin mo path kung iba sayo
import { collection, getDocs, doc, updateDoc, query, where, orderBy, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  Menu, X, LayoutDashboard, FileText, Users, Megaphone, Wallet, BarChart3,
  MessageSquare, Bell, ChevronDown, LogOut, Users2, FileClock, Download
} from 'lucide-react';

function StaffPage() {
  const storage = getStorage();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const userName = userData?.name || 'Staff';
  const userId = userData?.id || 'N/A';
  const userInitial = userName.charAt(0).toUpperCase();

  const [announcements, setAnnouncements] = useState([]);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', details: '', category: 'General', file: null });
  const [selectedAnnounce, setSelectedAnnounce] = useState(null);
  const [showAnnounceViewModal, setShowAnnounceViewModal] = useState(false);

  const [parents, setParents] = useState([]);
  const [reportType, setReportType] = useState('masterlist');
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingApps, setPendingApps] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchRecord, setSearchRecord] = useState('');

  // CLAIMS TRACKING STATES
  const [claimsTab, setClaimsTab] = useState('Subsidy'); // Subsidy or Educational
  const [claims, setClaims] = useState([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showClaimDetailsModal, setShowClaimDetailsModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimForm, setClaimForm] = useState({ name: '', amount: 2500, type: 'Subsidy' });


  // DASHBOARD STATS
  const [dashboardStats, setDashboardStats] = useState({
    total: 0,
    pending: 0,
    claims: 0,
    announcements: 0
  });

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboard();
    if (activeTab === 'applicants') fetchPending();
    if (activeTab === 'records') fetchRecords();
    if (activeTab === 'announcements') fetchAnnouncements();
    if (activeTab === 'claims') fetchClaims();
    if (activeTab === 'summary') fetchSummary();
  }, [activeTab, claimsTab]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const totalSnap = await getDocs(collection(db, "soloparent"));
      const pendingSnap = await getDocs(collection(db, "pending_users"));
      const claimsSnap = await getDocs(collection(db, "rsvps"));
      const announceSnap = await getDocs(collection(db, "announcements"));

      setDashboardStats({
        total: totalSnap.size,
        pending: pendingSnap.size,
        claims: claimsSnap.size,
        announcements: announceSnap.size
      });
    } catch (error) {  // <-- DITO NA AGAD YUNG CATCH NG DASHBOARD
      console.error("Error fetching dashboard:", error);
    }
    setLoading(false);
  }; // <-- DULO NG fetchDashboard

  const fetchPending = async () => { // <-- START NG fetchPending
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "pending_users"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingApps(data);
    } catch (error) {
      console.error("Error fetching pending:", error);
    }
    setLoading(false);
  };// <-- DULO NG fetchPending

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "soloparent"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(data);
    } catch (error) {
      console.error("Error fetching records:", error);
    }
    setLoading(false);
  };

  const getIdStatus = (registrationDate) => {
    if (!registrationDate) return { label: 'Unknown', color: '#94a3b8', bg: '#f1f5f9' };
    const regDate = new Date(registrationDate);
    const expiryDate = new Date(regDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity
    const today = new Date();
    const diffDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Expired', color: '#dc2626', bg: '#fee2e2' };
    if (diffDays <= 30) return { label: 'Expiring', color: '#d97706', bg: '#fef3c7' };
    return { label: 'Active', color: '#16a34a', bg: '#dcfce7' };
  };

  const handleNotify = (record) => {
    alert(`Notify: ${record.name} - ID is ${getIdStatus(record.registrationDate).label}`);
    // Dito mo ilalagay yung logic para mag-send ng notif/email later
  };

  const filteredRecords = records.filter(r =>
    (r.name || '').toLowerCase().includes(searchRecord.toLowerCase()) ||
    (r.address || '').toLowerCase().includes(searchRecord.toLowerCase()) ||
    (r.id || '').toLowerCase().includes(searchRecord.toLowerCase())
  );

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "pending_users", id), { status: "approved" });
    setSelectedApp(null);
    fetchPending();
    fetchDashboard();
  };

  const handleReject = async (id) => {
    await updateDoc(doc(db, "pending_users", id), { status: "rejected", reason: rejectReason });
    setSelectedApp(null);
    setShowRejectInput(false);
    setRejectReason('');
    fetchPending();
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate('/');
  };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "announcements"));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAnnouncements(data.sort((a, b) => b.date?.seconds - a.date?.seconds));
      setDashboardStats(prev => ({ ...prev, announcements: data.length })); // update dashboard count
    } catch (error) { console.error("Error fetching announcements:", error); }
    setLoading(false);
  };
  // FETCH CLAIMS
  const fetchClaims = async () => {
    setLoading(true);
    const claimsCollection = collection(db, 'claims');
    const q = query(claimsCollection, where("type", "==", claimsTab)); // TINANGGAL ORDERBY
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    data.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)); // DITO NA MAG SORT
    setClaims(data);
    setLoading(false);
  };
  // RECORD CLAIM - AUTO SAVE
  const handleRecordClaim = async () => {
    if (!claimForm.name) return alert("Name is required");
    const claimsCollection = collection(db, 'claims'); // ITO LANG DAGDAG
    await addDoc(claimsCollection, {
      ...claimForm,
      status: 'Pending', // Default
      date: serverTimestamp(), // Auto date from Firebase
      notes: ''
    });
    setClaimForm({ name: '', amount: 2500, type: claimsTab });
    setShowClaimModal(false);
    fetchClaims(); // Refresh
  };
  const handleViewClaim = (claim) => {
    setSelectedClaim(claim);
    setShowClaimDetailsModal(true);
  }
  // SAVE CHANGES SA DETAILS
  const handleSaveClaimChanges = async () => {
    const claimRef = doc(db, 'claims', selectedClaim.id);
    await updateDoc(claimRef, {
      status: selectedClaim.status,
      amount: selectedClaim.amount,
      notes: selectedClaim.notes
    });
    setSelectedClaim(null);
    setShowClaimDetailsModal(false);
    fetchClaims();
  };

  // ===== CREATE ANNOUNCEMENT FUNCTION =====
  const handleCreateAnnouncement = async () => {
    if (!announceForm.title || !announceForm.details) return alert("Fill up Title and Details");

    await addDoc(collection(db, 'announcements'), {
      title: announceForm.title,
      details: announceForm.details,
      category: announceForm.category,
      status: 'Pending', // Para sa Admin approval
      createdBy: userName,
      createdAt: serverTimestamp(),
      imageUrl: ''
    });

    // NOTIFY ADMIN
    await addDoc(collection(db, 'notifications'), {
      to: 'Admin',
      message: `New Announcement: "${announceForm.title}" - Needs Approval`,
      type: 'announcement',
      read: false,
      createdAt: serverTimestamp()
    });

    alert("Sent to Admin for Approval!");
    setShowAnnounceModal(false);
    setAnnounceForm({ title: '', details: '', category: 'General', file: null });
    fetchAnnouncements(); // Refresh list
  };
  // ===== TAPOS =====

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const snap = await getDocs(collection(db, "soloparent"));
      const data = snap.docs.map(doc => {
        const d = doc.data();
        const age = d.dob ? new Date().getFullYear() - new Date(d.dob).getFullYear() : 0;
        return {
          id: doc.id,
          ...d,
          name: `${d.firstName || ''} ${d.lastName || ''}`,
          age: age
        };
      });
      setParents(data);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
    setLoadingSummary(false);
  };

  // SUMMARY COMPUTATIONS
  const totalParents = parents.length;

  const genderCount = parents.reduce((acc, p) => {
    const gender = p.gender || 'Unknown';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {});

  const ageGroups = parents.reduce((acc, p) => {
    if (p.age <= 25) acc['18-25']++;
    else if (p.age <= 35) acc['26-35']++;
    else if (p.age <= 45) acc['36-45']++;
    else if (p.age <= 60) acc['46-60']++;
    else acc['60+']++;
    return acc;
  }, { '18-25': 0, '26-35': 0, '36-45': 0, '46-60': 0, '60+': 0 });

  const barangayCount = parents.reduce((acc, p) => {
    const brgy = p.barangay || 'Unknown';
    acc[brgy] = (acc[brgy] || 0) + 1;
    return acc;
  }, {});


  const thStyle = { padding: '12px', textAlign: 'left', fontWeight: '600', color: '#64748b', fontSize: '12px' };
  const tdStyle = { padding: '12px' };

  const getTableData = () => {
    if (reportType === 'masterlist') {
      return parents.map(p => ({
        name: p.name, age: p.age > 0 ? p.age : 'N/A', gender: p.gender || 'N/A',
        barangay: p.barangay || 'N/A', contact: p.contact || 'N/A',
        children: p.childrenCount || 0, category: p.category || 'N/A'
      }));
    }
    if (reportType === 'age') return Object.entries(ageGroups).map(([range, count]) => ({ 'Age Group': range, Count: count }));
    if (reportType === 'gender') return parents.map(p => ({ Name: p.name, Gender: p.gender || 'N/A', Contact: p.contact || 'N/A' }));
    if (reportType === 'barangay') return Object.entries(barangayCount).map(([brgy, count]) => ({ Barangay: brgy, Count: count }));
    if (reportType === 'children') return parents.map(p => ({ Name: p.name, 'No. of Children': p.childrenCount || 0 }));
    if (reportType === 'idstatus') return parents.map(p => {
      const status = getIdStatus(p.registrationDate);
      return { Name: p.name, 'Reg Date': p.registrationDate ? new Date(p.registrationDate).toLocaleDateString() : 'N/A', Status: status.label }
    });
    if (reportType === 'category') return parents.map(p => ({ Name: p.name, 'Category Code': p.category || 'N/A', Reason: p.reason || 'N/A' }));
    return [];
  };

  const exportToCSV = () => {
    const data = getTableData();
    if (data.length === 0) return alert("No data to export");
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${reportType}_report.csv`; a.click();
  };

  // STATUS COLOR[]
  const getStatusStyle = (status) => {
    if (status === 'Released') return { background: '#dcfce7', color: '#166534' };
    if (status === 'Processing') return { background: '#dbeafe', color: '#1e40af' };
    return { background: '#fef3c7', color: '#92400e' }; // Pending
  };

  const handleAnnounceFile = (e) => setAnnounceFile(e.target.files[0]);

  const handleSubmitAnnouncement = async () => {
    if (!announceForm.title || !announceForm.content) return alert("Title and Details required");
    setUploading(true);
    try {
      let fileURL = '';
      let fileType = '';
      if (announceFile) {
        const fileRef = ref(storage, `announcements/${Date.now()}_${announceFile.name}`);
        const upload = await uploadBytes(fileRef, announceFile);
        fileURL = await getDownloadURL(upload.ref);
        fileType = announceFile.type.startsWith('video') ? 'video' : 'image';
      }
      const dataToSave = { ...announceForm, date: serverTimestamp(), status: 'pending', fileURL, fileType };

      if (editingAnnounce) {
        await updateDoc(doc(db, "announcements", editingAnnounce.id), dataToSave);
      } else {
        await addDoc(collection(db, "announcements"), dataToSave);
      }

      setAnnounceForm({ title: '', content: '', author: userName, category: 'General' });
      setAnnounceFile(null); setEditingAnnounce(null); fetchAnnouncements();
      alert("Submitted to Admin for review!");
    } catch (error) { alert("Error submitting"); console.error(error); }
    setUploading(false);
  };

  const handleDeleteAnnounce = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      await deleteDoc(doc(db, "announcements", id)); fetchAnnouncements();
    }
  };

  const getTimeAgo = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return 'just now'; // FIX DITO
    const seconds = Math.floor((new Date() - timestamp.toDate()) / 1000);
    if (seconds < 60) return 'just now';
    const hours = Math.floor(seconds / 3600);
    return hours > 0 ? `about ${hours} hours ago` : `about ${Math.floor(seconds / 60)} mins ago`;
  }

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'applicants', label: 'Review Application', icon: FileText },
    { key: 'records', label: 'View Records', icon: Users },
    { key: 'announcements', label: 'Announcement', icon: Megaphone },
    { key: 'claims', label: 'Track Claims', icon: Wallet },
    { key: 'summary', label: 'Summary Report', icon: BarChart3 },
  ];

  const styles = {
    layout: { display: 'flex', minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Arial, sans-serif' },
    sidebar: {
      width: '260px', background: '#1e293b', color: 'white', position: 'fixed',
      top: 0, bottom: 0, left: sidebarOpen ? 0 : '-260px', transition: 'left 0.3s ease', zIndex: 100, padding: '16px'
    },
    overlay: {
      display: sidebarOpen ? 'block' : 'none', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', zIndex: 99
    },
    header: {
      height: '64px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0 20px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50
    },
    content: { flex: 1, padding: '24px' },
    menuItem: {
      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '8px',
      cursor: 'pointer', color: '#cbd5e1', fontSize: '14px', marginBottom: '4px'
    },
    menuItemActive: { background: '#2563eb', color: 'white', fontWeight: 'bold' },
    avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' },
    card: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }
  };

  return (
    <div style={styles.layout}>
      {/* OVERLAY PAG NAKA OPEN SIDEBAR SA MOBILE */}
      <div style={styles.overlay} onClick={() => setSidebarOpen(false)}></div>

      {/* 1. SIDEBAR */}
      {/* SIDEBAR - PUTI NA MAY ICONS */}
      {/* SIDEBAR - PUTI NA */}
      <aside style={{
        width: '280px',
        background: 'white',
        color: '#334155',
        position: 'fixed',
        top: 0, bottom: 0, left: sidebarOpen ? 0 : '-280px',
        transition: 'left 0.3s ease',
        zIndex: 100,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.05)'
      }}>

        {/* TITLE */}
        <div style={{ marginBottom: '24px', padding: '8px', position: 'relative' }}>
          <h2 style={{ margin: 0, color: '#1e40af', fontSize: '22px', fontWeight: '800' }}>Solo Parent</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>Digital Services Portal</p>
          <X size={20} style={{ position: 'absolute', top: 0, right: 0, cursor: 'pointer' }} onClick={() => setSidebarOpen(false)} />
        </div>

        {/* MENU */}
        <div style={{ flex: 1 }}>
          {menuItems.map(item => (
            <div
              key={item.key}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '12px', borderRadius: '8px',
                cursor: 'pointer', marginBottom: '4px',
                background: activeTab === item.key ? '#eff6ff' : 'transparent',
                color: activeTab === item.key ? '#2563eb' : '#475569',
                fontWeight: activeTab === item.key ? '700' : '500'
              }}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
            >
              <item.icon size={20} /> {item.label}
            </div>
          ))}
        </div>

        {/* USER INFO + LOGOUT SA PINAKA BABA */}
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
          <p style={{ margin: '0 0 4px 0', color: '#1e40af', fontWeight: '700', fontSize: '16px' }}>{userName}</p>
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '12px' }}>Staff ID: {userId}</p>

          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '12px', border: 'none',
              background: '#fee2e2', color: '#dc2626',
              borderRadius: '8px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>

      </aside>
      {/* 2. MAIN CONTENT */}
      <div style={{ flex: 1 }}>
        {/* HEADER */}
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Menu size={24} style={{ cursor: 'pointer' }} onClick={() => setSidebarOpen(true)} />
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: 0 }}>MSWD InfoLink Staff</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <MessageSquare size={20} style={{ cursor: 'pointer' }} />
            <div style={{ position: 'relative' }}><Bell size={20} style={{ cursor: 'pointer' }} /><span style={{ position: 'absolute', top: -4, right: -4, background: 'red', color: 'white', fontSize: '10px', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <div style={styles.avatar}>{userInitial}</div>
              <ChevronDown size={16} />
            </div>
          </div>
        </header>

        {/* 3. CONTENT NG TAB */}
        <main style={styles.content}>
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Dashboard</h2>
              <p style={{ color: '#64748b', marginTop: '4px', marginBottom: '24px' }}>Overview of solo parent records and activity</p>

              {loading ? <p>Loading...</p> :
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

                  {/* CARD 1 */}
                  <div style={styles.card}>
                    <div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Total Solo Parents</p>
                      <h3 style={{ margin: '8px 0', fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{dashboardStats.total}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Registered & active</p>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px' }}><Users2 size={20} color="#1e40af" /></div>
                  </div>

                  {/* CARD 2 */}
                  <div style={styles.card}>
                    <div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Pending Applications</p>
                      <h3 style={{ margin: '8px 0', fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{dashboardStats.pending}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Awaiting review</p>
                    </div>
                    <div style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px' }}><FileClock size={20} color="#d97706" /></div>
                  </div>

                  {/* CARD 3 */}
                  <div style={styles.card}>
                    <div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>New Claims</p>
                      <h3 style={{ margin: '8px 0', fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{dashboardStats.claims}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>This period</p>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '8px' }}><Wallet size={20} color="#059669" /></div>
                  </div>

                  {/* CARD 4 */}
                  <div style={styles.card}>
                    <div>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Active Announcements</p>
                      <h3 style={{ margin: '8px 0', fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>{dashboardStats.announcements}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Published</p>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px' }}><Megaphone size={20} color="#2563eb" /></div>
                  </div>

                </div>}
            </div>
          )}

          {activeTab === 'applicants' && (
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>Review Applications</h2>
              <p style={{ color: '#64748b', marginTop: '4px', marginBottom: '24px' }}>{pendingApps.length} pending applications awaiting review</p>

              {/* TABLE */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc' }}>
                    <tr>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Address</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Date Applied</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApps.map(app => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        style={{ cursor: 'pointer', borderBottom: '1px solid #e2e8f0' }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{app.name}</td>
                        <td style={{ padding: '12px 16px' }}>{app.email}</td>
                        <td style={{ padding: '12px 16px' }}>{app.address}</td>
                        <td style={{ padding: '12px 16px' }}>{new Date(app.registrationDate).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', background: '#fef3c7', color: '#92400e' }}>
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))
                    }
                  </tbody>
                </table>
              </div>

              {/* MODAL */}
              {selectedApp && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '95%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Application Details</h3>
                      <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedApp(null)} />
                    </div>

                    {/* DETAILS GRID */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Full Name</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.name}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Email</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.email}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Contact</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.contact}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>DOB</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.dob}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Occupation</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.occupation}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Category</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.category}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Children Count</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.childrenCount}</p>
                      </div>

                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Date Applied</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{new Date(selectedApp.registrationDate).toLocaleDateString()}</p>
                      </div>

                      <div style={{ gridColumn: '1 / -1' }}>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Address</p>
                        <p style={{ margin: '0 0 12px 0', fontWeight: '600' }}>{selectedApp.address}</p>
                      </div>

                      <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>Documents Submitted</p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                          {selectedApp.documents && Object.entries(selectedApp.documents).map(([key, value]) => (
                            typeof value === 'string' && value.startsWith('data:image') && (
                              <div key={key} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                                <img src={value} alt={key} style={{ width: '100%', height: '200px', objectFit: 'contain', borderRadius: '6px', marginBottom: '10px', background: 'white' }} />
                                <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '500', textAlign: 'center', textTransform: 'capitalize' }}>{key}</p>
                                <button onClick={() => setPreviewImage(value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', borderRadius: '6px', cursor: 'pointer' }}>
                                  View Full
                                </button>
                              </div>
                            )
                          ))}
                        </div>

                        {/* PREVIEW AREA - DITO LALABAS YUNG IMAGE */}
                        {previewImage && (
                          <div onClick={() => setPreviewImage(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
                            <img src={previewImage} alt="full" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                            <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '20px', right: '40px', background: 'white', border: 'none', borderRadius: '50%', width: '35px', height: '35px', fontSize: '20px', cursor: 'pointer' }}>X</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* REJECT REASON INPUT */}
                    {showRejectInput && (
                      <textarea
                        placeholder="Reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '16px', minHeight: '80px' }}
                      />
                    )}

                    {/* BUTTONS */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => handleApprove(selectedApp.id)}
                        style={{ flex: 1, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => showRejectInput ? handleReject(selectedApp.id) : setShowRejectInput(true)}
                        style={{ flex: 1, padding: '12px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer' }}
                      >
                        ✕ {showRejectInput ? 'Confirm Reject' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'records' && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e3a8a', margin: 0 }}>View Records</h2>
              <p style={{ color: '#64748b', marginTop: '4px', marginBottom: '24px' }}>{filteredRecords.length} registered solo parents</p>

              {/* SEARCH BAR */}
              <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '400px' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by Name, ID, or Address..."
                  value={searchRecord}
                  onChange={(e) => setSearchRecord(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px 10px 36px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* TABLE */}
              {loading ? <p>Loading records...</p> : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600' }}>
                        <th style={{ padding: '12px' }}>ID Number</th>
                        <th style={{ padding: '12px' }}>Name</th>
                        <th style={{ padding: '12px' }}>Address</th>
                        <th style={{ padding: '12px' }}>ID Expiry</th>
                        <th style={{ padding: '12px' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map(record => {
                        const idStatus = getIdStatus(record.registrationDate);
                        const expiryDate = new Date(new Date(record.registrationDate).setFullYear(new Date(record.registrationDate).getFullYear() + 1));
                        return (
                          <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 12px', fontSize: '12px', fontFamily: 'monospace' }}>{record.id.substring(0, 8)}...</td>
                            <td style={{ padding: '14px 12px', fontWeight: '600' }}>{record.name || 'No Name'}</td>
                            <td style={{ padding: '14px 12px' }}>{record.address || 'N/A'}</td>
                            <td style={{ padding: '14px 12px' }}>{expiryDate.toLocaleDateString()}</td>
                            <td style={{ padding: '14px 12px' }}>
                              <span
                                onClick={() => setSelectedRecord(record)}
                                style={{
                                  padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: '600',
                                  background: idStatus.bg, color: idStatus.color, cursor: 'pointer'
                                }}>
                                {idStatus.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {activeTab === 'announcements' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Announcements</h2>
                  <p style={{ color: '#64748b', marginTop: '4px' }}>Submit announcements for Admin approval</p>
                </div>
                <button onClick={() => setShowAnnounceModal(true)} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)' }}>
                  + Create Announcement
                </button>
              </div>

              {/* LIST OF ANNOUNCEMENTS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {announcements.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No announcements yet</p>
                ) : (
                  announcements.map(ann => (
                    <div key={ann.id} style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#eff6ff', color: '#1e40af' }}>{ann.category}</span>
                            <span style={{
                              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                              background: ann.status === 'Approved' ? '#dcfce7' : ann.status === 'Rejected' ? '#fee2e2' : '#fef9c3',
                              color: ann.status === 'Approved' ? '#14532d' : ann.status === 'Rejected' ? '#991b1b' : '#713f12'
                            }}>{ann.status}</span>
                          </div>
                          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>{ann.title}</h3>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.details}</p>
                          <p style={{ margin: '8px 0 0 0', color: '#94a3b8', fontSize: '12px' }}>
                            {ann.createdAt?.toDate ? ann.createdAt.toDate().toLocaleDateString() : 'N/A'} • By: {ann.createdBy}
                          </p>
                        </div>
                        <button
                          onClick={() => { setSelectedAnnounce(ann); setShowAnnounceViewModal(true); }}
                          style={{ padding: '8px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '12px', marginLeft: '12px' }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* CREATE ANNOUNCEMENT MODAL */}
              {showAnnounceModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Create New Announcement</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      <input type="text" placeholder="Title" value={announceForm.title} onChange={e => setAnnounceForm({ ...announceForm, title: e.target.value })} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }} />
                      <textarea placeholder="Details" rows="4" value={announceForm.details} onChange={e => setAnnounceForm({ ...announceForm, details: e.target.value })} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', resize: 'vertical' }} />
                      <select value={announceForm.category} onChange={e => setAnnounceForm({ ...announceForm, category: e.target.value })} style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}>
                        <option value="General">General</option>
                        <option value="Event">Event</option>
                        <option value="Reminder">Reminder</option>
                        <option value="Urgent">Urgent</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Distribution">Distribution</option>
                      </select>
                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Upload Image/Video</label>
                        <input type="file" onChange={e => setAnnounceForm({ ...announceForm, file: e.target.files[0] })} style={{ fontSize: '14px' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowAnnounceModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button onClick={handleCreateAnnouncement} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Send to Admin</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* VIEW ANNOUNCEMENT DETAILS MODAL */}
          {showAnnounceViewModal && selectedAnnounce && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>Announcement Details</h3>
                  <button onClick={() => setShowAnnounceViewModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: '#eff6ff', color: '#1e40af' }}>{selectedAnnounce.category}</span>
                  <span style={{
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                    background: selectedAnnounce.status === 'Approved' ? '#dcfce7' : selectedAnnounce.status === 'Rejected' ? '#fee2e2' : '#fef9c3',
                    color: selectedAnnounce.status === 'Approved' ? '#14532d' : selectedAnnounce.status === 'Rejected' ? '#991b1b' : '#713f12'
                  }}>{selectedAnnounce.status}</span>
                </div>

                <h2 style={{ margin: '0 0 12px 0', fontSize: '24px', fontWeight: '800', color: '#1e293b' }}>{selectedAnnounce.title}</h2>

                <p style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '16px' }}>
                  {selectedAnnounce.createdAt?.toDate ? selectedAnnounce.createdAt.toDate().toLocaleString() : 'N/A'} • By: {selectedAnnounce.createdBy}
                </p>

                {selectedAnnounce.imageUrl && (
                  <img src={selectedAnnounce.imageUrl} alt="Announcement" style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }} />
                )}

                <p style={{ color: '#334155', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{selectedAnnounce.details}</p>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowAnnounceViewModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Close</button>
                </div>
              </div>
            </div>
          )}    
          {activeTab === 'claims' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Claims Tracking</h2>
                <button
                  onClick={() => setShowClaimModal(true)}
                  style={{
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }}
                >
                  + Record Claim
                </button>
              </div>

              {/* TABS */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {['Subsidy', 'Educational'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setClaimsTab(tab)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: '600',
                      cursor: 'pointer',
                      background: claimsTab === tab ? '#3b82f6' : '#f1f5f9',
                      color: claimsTab === tab ? 'white' : '#64748b',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* TABLE CARD */}
              <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No claims found</td>
                      </tr>
                    ) : (
                      claims.map(claim => (
                        <tr key={claim.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '16px', fontWeight: '500', color: '#1e293b' }}>{claim.name}</td>
                          <td style={{ padding: '16px', color: '#1e293b' }}>₱{claim.amount?.toLocaleString()}</td>
                          <td style={{ padding: '16px', color: '#64748b' }}>{claim.date?.toDate ? claim.date.toDate().toLocaleDateString() : 'N/A'}</td>
                          <td style={{ padding: '16px' }}>
                            <span style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: '600',
                              ...getStatusStyle(claim.status)
                            }}>
                              {claim.status}
                            </span>
                          </td>
                          <td style={{ padding: '16px' }}>
                            <button
                              onClick={() => handleViewClaim(claim)}
                              style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* MODAL */}
              {showClaimModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Record New {claimsTab} Claim</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={claimForm.name}
                        onChange={e => setClaimForm({ ...claimForm, name: e.target.value })}
                        style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={claimForm.amount}
                        onChange={e => setClaimForm({ ...claimForm, amount: Number(e.target.value) })}
                        style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setShowClaimModal(false)} style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                      <button onClick={handleRecordClaim} style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '600' }}>Save</button>
                    </div>
                  </div>
                </div>
              )}
              {showClaimDetailsModal && selectedClaim && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Claim Details</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>NAME</label>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1e293b' }}>{selectedClaim.name}</div>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>AMOUNT</label>
                        <input
                          type="number"
                          value={selectedClaim.amount}
                          onChange={e => setSelectedClaim({ ...selectedClaim, amount: Number(e.target.value) })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>STATUS</label>
                        <select
                          value={selectedClaim.status}
                          onChange={e => setSelectedClaim({ ...selectedClaim, status: e.target.value })}
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
                        >
                          <option>Pending</option>
                          <option>Processing</option>
                          <option>Released</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>NOTES</label>
                        <textarea
                          value={selectedClaim.notes || ''}
                          onChange={e => setSelectedClaim({ ...selectedClaim, notes: e.target.value })}
                          rows="3"
                          style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowClaimDetailsModal(false)}
                        style={{ padding: '10px 20px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Close
                      </button>
                      <button
                        onClick={handleSaveClaimChanges}
                        style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Summary Report</h2>
                  <p style={{ color: '#64748b', marginTop: '4px' }}>Filter and export solo parent data</p>
                </div>
                <button onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  <Download size={16} /> Export CSV
                </button>
              </div>

              {/* FILTER DROPDOWN */}
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px' }}>Select Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ width: '100%', maxWidth: '400px', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px' }}
                >
                  <option value="masterlist">Master List</option>
                  <option value="age">List Based on Age</option>
                  <option value="gender">Name List Based on Gender</option>
                  <option value="barangay">Barangay Breakdown</option>
                  <option value="children">List by Number of Children/Dependent</option>
                  <option value="idstatus">Status of Solo Parent ID Card</option>
                  <option value="category">Category of being Solo Parent</option>
                </select>
              </div>

              {loadingSummary ? <p style={{ textAlign: 'center', padding: '40px' }}>Loading data...</p> : (
                <>


                  {/* DYNAMIC TABLE BASED ON DROPDOWN */}
                  <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>
                      {reportType === 'masterlist' && 'Master List'}
                      {reportType === 'age' && 'List Based on Age'}
                      {reportType === 'gender' && 'List Based on Gender'}
                      {reportType === 'barangay' && 'Barangay Breakdown'}
                      {reportType === 'children' && 'List by Number of Children'}
                      {reportType === 'idstatus' && 'ID Card Status'}
                      {reportType === 'category' && 'Category of Solo Parent'}
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            {reportType === 'masterlist' && <>
                              <th style={thStyle}>Name</th><th style={thStyle}>Age</th><th style={thStyle}>Gender</th><th style={thStyle}>Barangay</th><th style={thStyle}>Contact</th><th style={thStyle}>Children</th><th style={thStyle}>Category</th>
                            </>}
                            {reportType === 'age' && <>
                              <th style={thStyle}>Age Group</th><th style={thStyle}>Count</th>
                            </>}
                            {reportType === 'gender' && <>
                              <th style={thStyle}>Name</th><th style={thStyle}>Gender</th><th style={thStyle}>Contact</th>
                            </>}
                            {reportType === 'barangay' && <>
                              <th style={thStyle}>Barangay</th><th style={thStyle}>Count</th>
                            </>}
                            {reportType === 'children' && <>
                              <th style={thStyle}>Name</th><th style={thStyle}>No. of Children</th>
                            </>}
                            {reportType === 'idstatus' && <>
                              <th style={thStyle}>Name</th><th style={thStyle}>Registration Date</th><th style={thStyle}>ID Status</th>
                            </>}
                            {reportType === 'category' && <>
                              <th style={thStyle}>Name</th><th style={thStyle}>Category Code</th><th style={thStyle}>Reason</th>
                            </>}
                          </tr>
                        </thead>
                        <tbody>
                          {getTableData().map((row, index) => (
                            <tr key={index} style={{ borderTop: '1px solid #e2e8f0' }}>
                              {Object.values(row).map((cell, i) => <td key={i} style={tdStyle}>{cell}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {selectedRecord && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{ background: 'white', borderRadius: '12px', padding: '24px', width: '95%', maxWidth: '500px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Solo Parent Digital ID</h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedRecord(null)} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src={selectedRecord.profilePic || selectedRecord.idImage} alt="ID" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #2563eb' }} />
              <h4 style={{ margin: '12px 0 4px 0' }}>{selectedRecord.name}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>ID: {selectedRecord.id}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
              <div><b>DOB:</b> {selectedRecord.dob}</div>
              <div><b>Contact:</b> {selectedRecord.contact}</div>
              <div><b>Email:</b> {selectedRecord.email}</div>
              <div><b>Children:</b> {selectedRecord.childrenCount}</div>
              <div style={{ gridColumn: '1 / -1' }}><b>Address:</b> {selectedRecord.address}</div>
            </div>

            {(getIdStatus(selectedRecord.registrationDate).label === 'Expiring' || getIdStatus(selectedRecord.registrationDate).label === 'Expired') && (
              <button onClick={() => handleNotify(selectedRecord)} style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
                🔔 Send Notification
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
export default StaffPage;