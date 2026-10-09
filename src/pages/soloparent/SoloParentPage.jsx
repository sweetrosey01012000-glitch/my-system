import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Home, MessageSquare, User, LogOut, Bell, BookOpen, Megaphone, FileText, MessageCircle, X, Send, ArrowLeft, Menu } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { collection, query, orderBy, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import HomeSP from "./SoloParentTab/HomeSP";
import RA11861 from "./SoloParentTab/RA11861";
import Announcements from './SoloParentTab/Announcements';
import CommunityForum from './SoloParentTab/CommunityForum';
import Profile from './SoloParentTab/Profile';
import Assistance from './SoloParentTab/Assistance';
import Settings from './SoloParentTab/Settings.jsx';


function SoloParentPage() {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const userName = userData?.name || 'Marijoy Retanal';
  const soloParentId = userData?.idNumber || '2026-001706-SP';
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('id');
  const [showSettings, setShowSettings] = useState(false);
  const idCardRef = useRef(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [soloparentData, setSoloparentData] = useState(null);

  const menuItems = [
    { key: 'id', label: 'Home', icon: Home },
    { key: 'ra11861', label: 'RA 11861', icon: BookOpen },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'community', label: 'Community', icon: MessageSquare },
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'assistance', label: 'Assistance', icon: FileText },
  ];


  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, "soloparent"), where("uid", "==", uid));
    const unsub = onSnapshot(q, (qs) => {
      if (!qs.empty) {
        let data = { id: qs.docs[0].id, ...qs.docs[0].data() };
        if (data.issuanceDate) {
          const issue = new Date(data.issuanceDate);
          if (!isNaN(issue)) {
            issue.setFullYear(issue.getFullYear() + 1);
            data.expiryDate = issue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
          }
        }
        setSoloparentData(data);
      }
    }, (err) => console.error("soloparent:", err));
    return () => unsub();
  }, [userData?.uid, currentUser?.uid]);

  // FIXED: inalis uid sa 'in', client-side filter + sort
  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, 'notifications'), where('for', 'in', ['soloparent', 'all']));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = data.filter(n => !n.uid || n.uid === uid);
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(filtered);
    }, (err) => console.error("notif:", err));
    return () => unsub();
  }, [userData?.uid, currentUser?.uid]);

  // FIXED: walang orderBy sa query, sort sa client
  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(data);
    }, (err) => console.error("messages:", err));
    return () => unsub();
  }, [userData?.uid, currentUser?.uid]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('status', '==', 'published'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoadingAnnouncements(false);
    }, (err) => {
      console.error("announcements:", err);
      setLoadingAnnouncements(false);
    });
    return () => unsub();
  }, []);

  const conversations = useMemo(() => {
    const uid = currentUser?.uid || userData?.uid;
    const groups = {};
    messages.forEach(m => {
      let otherId = m.senderId === uid ? m.receiverId : m.senderId;
      if (otherId === 'staff' || m.senderRole === 'staff' || m.receiverRole === 'staff') {
        otherId = m.senderId === uid ? (m.receiverId === 'staff' ? 'mswd_staff' : m.receiverId) : m.senderId;
        if (m.senderRole === 'staff' || m.receiverId === 'staff' || groups['mswd_staff']) { otherId = 'mswd_staff'; }
      }
      if (!groups[otherId]) {
        groups[otherId] = { id: otherId, name: otherId === 'mswd_staff' ? 'MSWD Staff' : (m.senderId === uid ? 'MSWD Staff' : (m.senderName || 'MSWD Staff')), lastMsg: m, all: [] };
      }
      groups[otherId].all.push(m);
      if ((m.createdAt?.seconds || 0) > (groups[otherId].lastMsg.createdAt?.seconds || 0)) groups[otherId].lastMsg = m;
    });
    return Object.values(groups).sort((a, b) => (b.lastMsg.createdAt?.seconds || 0) - (a.lastMsg.createdAt?.seconds || 0));
  }, [messages, currentUser, userData]);

  const activeConv = conversations.find(c => c.id === selectedChatId);
  const confirmLogout = () => setShowLogoutModal(true);
  const handleLogout = async () => { try { await signOut(auth); localStorage.clear(); navigate('/'); } catch (e) { console.error(e); } };

  const handleDownloadID = async (format) => {
    if (!idCardRef.current) return;
    const printDiv = idCardRef.current.cloneNode(true);
    printDiv.style.position = 'absolute'; printDiv.style.left = '-9999px'; printDiv.style.width = '1011px'; printDiv.style.height = '638px';
    document.body.appendChild(printDiv);
    const canvas = await html2canvas(printDiv, { scale: 1, backgroundColor: '#ffffff', width: 1011, height: 638, useCORS: true });
    document.body.removeChild(printDiv);
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

  const handleSendMsg = async () => {
    const uid = currentUser?.uid || userData?.uid; if (!newMsg.trim() || !uid) return;
    const receiver = selectedChatId && selectedChatId !== 'mswd_staff' ? selectedChatId : "staff";
    await addDoc(collection(db, 'messages'), {
      text: newMsg, senderId: uid, senderName: userData.name, senderRole: 'soloparent',
      receiverId: receiver, receiverName: 'MSWD Staff', receiverRole: 'staff',
      participants: [uid, receiver, "staff"], isRead: false, createdAt: serverTimestamp()
    });
    setNewMsg('');
  };

  const handleAskStaff = () => { setShowMsgModal(true); setSelectedChatId(null); };
  const handleMarkRead = async (id) => await updateDoc(doc(db, 'notifications', id), { isRead: true });

  const profilePic = soloparentData?.profilePic || soloparentData?.photoURL || soloparentData?.image || userData?.profilePic || null;
  const userInitials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const [isDarkGlobal, setIsDarkGlobal] = useState(localStorage.getItem('sp_dark') === 'true');

  const darkColors = {
    bg: '#12151e',        // soft black, di masakit sa mata
    card: '#1e222e',      // warm gray
    card2: '#252a38',
    border: '#2a2f40',
    text: '#cbd5e1',      // soft white, hindi pure white
    textMuted: '#94a3b8',
  };
  const lightColors = {
    bg: '#f8fafc',
    card: '#ffffff',
    card2: '#f1f5f9',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
  };
  const colors = isDarkGlobal ? darkColors : lightColors;

  useEffect(() => {
    const sync = () => {
      const dark = localStorage.getItem('sp_dark') === 'true';
      const font = localStorage.getItem('sp_font') || 'medium';
      setIsDarkGlobal(dark);
      const root = document.documentElement;
      if (font === 'small') root.style.fontSize = '13px';
      if (font === 'medium') root.style.fontSize = '15px';
      if (font === 'large') root.style.fontSize = '18px';
      document.body.style.background = dark ? '#12151e' : '#f8fafc';
    };
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    sync();
    return () => {
      window.removeEventListener('sp_theme_changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const styles = {
    layout: {
      fontFamily: "'Inter', sans-serif",
      background: colors.bg,
      color: colors.text,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      transition: 'background 0.3s ease, color 0.3s ease'
    },
    iconBtn: {
      background: colors.card,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '10px',
      cursor: 'pointer',
      position: 'relative',
      display: 'flex',
      color: colors.text,
      boxShadow: isDarkGlobal ? 'none' : '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.3s'
    },
    badge: {
      position: 'absolute',
      top: '6px',
      right: '6px',
      width: '8px',
      height: '8px',
      background: '#ef4444',
      borderRadius: '50%',
      border: `2px solid ${colors.card}`
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(6px)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    },
    modalLarge: {
      background: colors.card,
      color: colors.text,
      borderRadius: '16px',
      width: '100%',
      maxWidth: '900px',
      height: '80vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      border: `1px solid ${colors.border}`
    },
    modalSmall: {
      background: colors.card,
      color: colors.text,
      borderRadius: '16px',
      width: '100%',
      maxWidth: '500px',
      height: '70vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      border: `1px solid ${colors.border}`
    },
    modalHeader: {
      padding: '16px',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: colors.text,
      fontWeight: '800',
      fontSize: '16px',
      background: colors.card
    },
    modalBody: {
      flex: 1,
      padding: '16px',
      overflowY: 'auto',
      background: colors.bg,
      color: colors.text
    },
    sidebarOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      zIndex: 100
    },
    content: {
      flex: 1,
      padding: '24px 20px',
      maxWidth: '1200px',
      margin: '0 auto',
      width: '100%',
      background: colors.bg,
      color: colors.text,
      transition: 'all 0.3s'
    },
  };

  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    const check = setInterval(sync, 500);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); clearInterval(check); };
  }, []);
  const C = isDark
    ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#e2e8f0', muted: '#94a3b8', icon: '#94a3b8' }
    : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', icon: '#334155' };

  return (
    <div style={styles.layout}>
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { font-family: 'Inter', sans-serif!important; box-sizing: border-box; }
         .app-container { display: flex; height: 100vh; overflow: hidden; background: ${colors.bg}; transition: all 0.3s ease; }
         .left-panel { width: 280px; background: ${isDarkGlobal ? 'linear-gradient(180deg, #0f172a 0%, #1a1e2a 100%)' : 'linear-gradient(180deg, #1e3a8a 0%, #2046a8 50%, #2563eb 100%)'}; display: flex; flex-direction: column; flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow: hidden; box-shadow: 4px 0 24px rgba(0,0,0,0.15); transition: all 0.3s ease; }
         .left-header { height: 72px; background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); display: flex; align-items: center; padding: 0 16px; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
         .left-sidebar { flex: 1; display: flex; flex-direction: column; padding: 14px 12px 12px 12px; overflow: hidden; }
         .menu-list { display: flex; flex-direction: column; gap: 5px; flex: 1; }
         .menu-item { padding: 11px 14px; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 12px; font-size: 13.5px; transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1); color: rgba(255,255,255,0.82); border: 1px solid transparent; position: relative; }
         .menu-item:hover { background: rgba(255,255,255,0.08); backdrop-filter: blur(8px); color: white; transform: translateX(2px); }
         .menu-item.active { background: linear-gradient(135deg, rgba(254, 252, 232, 0.92) 0%, rgba(254, 249, 195, 0.88) 100%); color: #1e3a8a; font-weight: 700; border: 1px solid rgba(250, 204, 21, 0.4); box-shadow: 0 8px 32px rgba(250, 204, 21, 0.22), 0 2px 8px rgba(30, 58, 138, 0.12), inset 0 1px 0 rgba(255,255,255,0.9); transform: translateX(3px); }
         .menu-item.active::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 4px; height: 22px; background: #facc15; border-radius: 0 4px 4px 0; box-shadow: 0 0 12px rgba(250,204,21,0.6); }
         .right-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; background: ${colors.bg}; height: 100vh; overflow: hidden; transition: all 0.3s ease; }
         .right-header { height: 72px; background: ${colors.card}; display: flex; justify-content: flex-end; align-items: center; padding: 0 24px; gap: 10px; box-shadow: ${isDarkGlobal ? `0 1px 0 ${colors.border}` : '0 1px 0 #f1f5f9, 0 4px 20px rgba(30,58,138,0.04)'}; flex-shrink: 0; border-bottom: 1px solid ${colors.border}; transition: all 0.3s ease; }
         .main-content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; background: ${colors.bg}; color: ${colors.text}; transition: all 0.3s ease; }
         .mobile-fab { display: none; }
          @media (max-width: 1024px) {.left-panel { display: none!important; }.mobile-fab { display: flex!important; position: fixed; bottom: 20px; left: 20px; width: 54px; height: 54px; background: #1e3a8a; color: white; border: none; border-radius: 14px; align-items: center; justify-content: center; z-index: 90; cursor: pointer; box-shadow: 0 8px 20px rgba(30,58,138,0.3); } }
        `}</style>

      {/* MODALS - DARK FIXED DIN */}
      {showLogoutModal && (
        <div style={{ ...styles.modalOverlay, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowLogoutModal(false)}>
          <div style={{ background: colors.card, borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center', border: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '56px', height: '56px', background: isDarkGlobal ? '#3a2e0a' : '#fef3c7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}><LogOut size={26} color="#d97706" /></div>
            <h3 style={{ fontWeight: '800', fontSize: '18px', color: colors.text, marginBottom: '8px' }}>Do you want to logout?</h3>
            <p style={{ fontSize: '13px', color: colors.muted, marginBottom: '22px' }}>You will be redirected to the landing page.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '12px', background: colors.card2, color: colors.text, border: `1px solid ${colors.border}`, borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Stay</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {showNotifModal && (<div style={{ ...styles.modalOverlay, background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowNotifModal(false)}><div style={{ ...styles.modalSmall, background: colors.card, border: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}><div style={{ ...styles.modalHeader, color: colors.text, borderBottom: `1px solid ${colors.border}` }}>Notifications <X size={20} onClick={() => setShowNotifModal(false)} style={{ cursor: 'pointer', color: colors.muted }} /></div><div style={styles.modalBody}>{notifications.length === 0 ? <div style={{ textAlign: 'center', padding: '20px', color: colors.muted }}>No notifications</div> : notifications.map(n => <div key={n.id} style={{ padding: '12px', border: `1px solid ${colors.border}`, background: n.isRead ? colors.card : colors.card2, cursor: 'pointer', borderRadius: '12px', marginBottom: '8px' }} onClick={() => handleMarkRead(n.id)}><strong style={{ fontSize: '13px', color: colors.text }}>{n.title}</strong><div style={{ fontSize: '12px', color: colors.muted, marginTop: '2px' }}>{n.message}</div></div>)}</div></div></div>)}

      {showMsgModal && (
        <div style={{ ...styles.modalOverlay, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setShowMsgModal(false); setSelectedChatId(null); }}>
          <div style={{ ...styles.modalLarge, background: colors.card, border: `1px solid ${colors.border}` }} onClick={e => e.stopPropagation()}>
            <div style={{ ...styles.modalHeader, color: colors.text, borderBottom: `1px solid ${colors.border}` }}>{selectedChatId ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ArrowLeft size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedChatId(null)} />{activeConv?.name}</div> : <span>Messages</span>}<X size={20} onClick={() => { setShowMsgModal(false); setSelectedChatId(null); }} style={{ cursor: 'pointer', color: colors.muted }} /></div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              <div style={{ width: selectedChatId ? '0px' : '100%', minWidth: selectedChatId ? '0px' : '100%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${colors.border}`, overflowY: 'auto' }}>
                {conversations.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: colors.muted }}><div style={{ fontWeight: '700', marginBottom: '8px' }}>No conversations yet</div><div style={{ fontSize: '13px' }}>Click "Ask MSWD Staff" in Assistance tab to start</div></div> : conversations.map(conv => (
                  <div key={conv.id} onClick={() => setSelectedChatId(conv.id)} style={{ padding: '14px', cursor: 'pointer', display: 'flex', gap: '12px', background: colors.card, borderBottom: `1px solid ${colors.border}` }}><div style={{ width: '40px', height: '40px', background: '#1e3a8a', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{conv.name[0]?.toUpperCase()}</div><div style={{ flex: 1, overflow: 'hidden' }}><div style={{ fontWeight: '700', color: colors.text, fontSize: '14px' }}>{conv.name}</div><div style={{ fontSize: '12px', color: colors.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMsg.text}</div></div></div>))}
              </div>
              {selectedChatId && (<div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: colors.card }}><div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: colors.bg }}>{activeConv?.all.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)).map(m => (<div key={m.id} style={{ alignSelf: m.senderId === (currentUser?.uid || userData?.uid) ? 'flex-end' : 'flex-start', maxWidth: '75%' }}><div style={{ background: m.senderId === (currentUser?.uid || userData?.uid) ? '#1e3a8a' : colors.card2, color: m.senderId === (currentUser?.uid || userData?.uid) ? 'white' : colors.text, padding: '10px 14px', borderRadius: m.senderId === (currentUser?.uid || userData?.uid) ? '14px 14px 2px 14px' : '14px 14px 14px 2px', fontSize: '13px', border: m.senderId !== (currentUser?.uid || userData?.uid) ? `1px solid ${colors.border}` : 'none' }}>{m.text}</div></div>))}</div><div style={{ display: 'flex', padding: '12px', background: colors.card, borderTop: `1px solid ${colors.border}`, gap: '8px' }}><input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMsg()} placeholder="Type a message..." style={{ flex: 1, padding: '12px 16px', border: `1px solid ${colors.border}`, borderRadius: '12px', outline: 'none', fontSize: '13px', background: colors.card2, color: colors.text }} /><button onClick={handleSendMsg} style={{ width: '42px', height: '42px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={18} /></button></div></div>)}
            </div>
          </div>
        </div>
      )}

      {showSidebar && (
        <div>
          <div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)}></div>
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: isDarkGlobal ? '#0f121b' : 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)', zIndex: 101, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', borderRight: `1px solid ${colors.border}` }}>
            <div style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', background: 'white', flexShrink: 0 }}>{profilePic ? <img src={profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#facc15', color: '#1e3a8a', fontWeight: '900' }}>{userInitials}</div>}</div>
              <div style={{ lineHeight: '1.2', overflow: 'hidden' }}><div style={{ fontWeight: '800', color: 'white', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>ID: {soloParentId}</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '14px 12px', flex: 1 }}>
              <div className="menu-list">{menuItems.map(item => (<div key={item.key} className={`menu-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => { setActiveTab(item.key); setShowSidebar(false); }}><item.icon size={18} /> {item.label}</div>))}</div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}><button style={{ width: '100%', padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={confirmLogout}><LogOut size={18} /> Logout</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ISA LANG NA APP-CONTAINER - DITO YUNG FIX BES */}
      <div className="app-container">
        <div className="left-panel">
          <div className="left-header">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', background: 'white', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              {profilePic ? <img src={profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#facc15', color: '#1e3a8a', fontWeight: '900', fontSize: '15px' }}>{userInitials}</div>}
            </div>
            <div style={{ lineHeight: '1.2', overflow: 'hidden' }}>
              <div style={{ fontWeight: '800', color: 'white', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>ID: {soloParentId}</div>
              <div style={{ fontSize: '11px', color: '#fde68a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }}></span> Online
              </div>
            </div>
          </div>
          <div className="left-sidebar">
            <div className="menu-list">
              {menuItems.map(item => (
                <div key={item.key} className={`menu-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => setActiveTab(item.key)}>
                  <item.icon size={19} /> {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="right-panel">
          {/* DITO YUNG PUTI NA NASA PIC - NGAYON NAKA colors.card NA! */}
          <div className="right-header">
            <button style={{ ...styles.iconBtn, background: colors.card2, border: `1px solid ${colors.border}` }} onClick={() => setShowNotifModal(true)}><Bell size={20} color={colors.muted} />{notifications.some(n => !n.isRead) && <div style={styles.badge}></div>}</button>
            <button style={{ ...styles.iconBtn, background: colors.card2, border: `1px solid ${colors.border}` }} onClick={() => setShowMsgModal(true)}><MessageCircle size={20} color={colors.muted} />{messages.some(m => !m.isRead && m.senderId !== (currentUser?.uid || userData?.uid)) && <div style={styles.badge}></div>}</button>
            <div style={{ position: 'relative' }}>
              <div onClick={() => setShowSettings(!showSettings)} style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #FACC15', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e3a8a', color: 'white', fontWeight: '800', fontSize: '13px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                {profilePic ? <img src={profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>{userInitials || userName?.charAt(0) || 'M'}</span>}
              </div>
              {showSettings && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'transparent' }} onClick={() => setShowSettings(false)}></div>
                  <div style={{ position: 'absolute', top: '52px', right: '0', width: '360px', maxHeight: '85vh', overflowY: 'auto', zIndex: 100, borderRadius: '18px', background: colors.card, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', border: `1px solid ${colors.border}` }}>
                    <Settings onClose={() => setShowSettings(false)} onLogout={confirmLogout} userData={userData} userName={userName} soloParentId={soloParentId} profilePic={profilePic} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="main-content">
            {activeTab === 'id' && <HomeSP styles={styles} soloparentData={soloparentData} handleDownloadID={handleDownloadID} idCardRef={idCardRef} setActiveTab={setActiveTab} announcements={announcements} loadingAnnouncements={loadingAnnouncements} />}
            {activeTab === 'ra11861' && <RA11861 styles={styles} />}
            {activeTab === 'announcements' && <Announcements announcements={announcements} loadingAnnouncements={loadingAnnouncements} styles={styles} setSelectedAnnouncement={setSelectedAnnouncement} selectedAnnouncement={selectedAnnouncement} />}
            {activeTab === 'community' && <CommunityForum user={auth.currentUser} userData={userData} />}
            {activeTab === 'profile' && <Profile styles={styles} soloparentData={soloparentData} userId={soloparentData?.id} setSoloparentData={setSoloparentData} user={auth.currentUser} theme={{ yellow: '#FACC15', text: colors.text, textMuted: colors.muted, red: '#DC2626' }} />}
            {activeTab === 'assistance' && <Assistance styles={styles} onAskStaff={handleAskStaff} />}
          </div>
        </div>
      </div>
      <button className="mobile-fab" onClick={() => setShowSidebar(true)}><Menu size={22} /></button>
    </div>
  );
}

export default SoloParentPage;