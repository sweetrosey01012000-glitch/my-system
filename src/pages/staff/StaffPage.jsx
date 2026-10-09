import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, FolderKanban, Megaphone, BarChart3, LogOut, Bell, MessageCircle, X, Send, ArrowLeft, Menu, CheckCheck, Settings } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import DashboardTab from './StaffTab/DashboardTab';
import ApplicantsTab from './StaffTab/ApplicantsTab';
import ClaimsTab from './StaffTab/ClaimsTab';
import RecordsTab from './StaffTab/RecordsTab';
import SummaryTab from './StaffTab/SummaryTab';
import SettingsTab from './StaffTab/SettingsTab';

function StaffPage() {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const staffName = userData?.name || 'Staff';
  const staffId = userData?.staffId || 'ST-000';
  const staffInitial = staffName !== 'Staff' ? staffName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';

  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const notifRef = useRef(null);
  const bellRef = useRef(null);

  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);

  const C = isDark ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#cbd5e1', muted: '#94a3b8' } : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const menuItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'applicants', label: 'Applicants', icon: Users },
    { key: 'claims', label: 'Claims', icon: FileText },
    { key: 'records', label: 'Records', icon: FolderKanban },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'summary', label: 'Summary', icon: BarChart3 },
  ];

  useEffect(() => {
    const q = query(collection(db, 'notifications'), where('for', 'in', ['staff', 'all']));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const handleClickOutside = (e) => { if (notifRef.current && !notifRef.current.contains(e.target) && bellRef.current && !bellRef.current.contains(e.target)) setShowNotifDropdown(false); };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid; if (!uid) return;
    const q = query(collection(db, 'messages'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(m => m.receiverId === 'staff' || m.receiverId === uid || m.senderId === uid || m.participants?.includes(uid) || m.participants?.includes('staff'));
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMessages(filtered);
    });
    return () => unsub();
  }, [userData, currentUser]);

  const conversations = useMemo(() => {
    const uid = currentUser?.uid || userData?.uid; if (!uid) return [];
    const groups = {};
    messages.forEach(m => {
      const isMeSender = m.senderId === uid; let otherId;
      if (m.receiverId === 'staff' && m.senderId !== uid) otherId = m.senderId;
      else if (isMeSender) { otherId = m.receiverId; if (otherId === 'staff') otherId = m.participants?.find(p => p !== uid && p !== 'staff') || m.receiverId; }
      else otherId = m.senderId;
      if (!otherId || otherId === 'staff' || otherId === uid) return;
      if (!groups[otherId]) groups[otherId] = { id: otherId, name: isMeSender ? (m.receiverName || 'Solo Parent') : (m.senderName || 'Solo Parent'), lastMsg: m, all: [], unread: 0 };
      groups[otherId].all.push(m); if (!m.isRead && !isMeSender) groups[otherId].unread++;
      if ((m.createdAt?.seconds || 0) > (groups[otherId].lastMsg.createdAt?.seconds || 0)) groups[otherId].lastMsg = m;
    });
    return Object.values(groups).sort((a, b) => (b.lastMsg.createdAt?.seconds || 0) - (a.lastMsg.createdAt?.seconds || 0));
  }, [messages, userData, currentUser]);

  const activeConv = conversations.find(c => c.id === selectedChatId);
  const handleSendMsg = async () => {
    const uid = currentUser?.uid || userData?.uid; if (!newMsg.trim() || !uid || !selectedChatId) return;
    await addDoc(collection(db, 'messages'), { text: newMsg, senderId: uid, senderName: userData.name, senderRole: 'staff', receiverId: selectedChatId, receiverName: activeConv?.name || 'Solo Parent', receiverRole: 'soloparent', participants: [uid, selectedChatId], isRead: false, createdAt: serverTimestamp() });
    setNewMsg('');
  };
  const handleMarkRead = async (id) => await updateDoc(doc(db, 'notifications', id), { isRead: true });
  const handleMarkAllRead = async () => { const unread = notifications.filter(n => !n.isRead); for (const n of unread) await updateDoc(doc(db, 'notifications', n.id), { isRead: true }); };
  const handleNotifClick = async (n) => {
    await handleMarkRead(n.id); setShowNotifDropdown(false);
    const type = n.type || ''; const title = (n.title || '').toLowerCase();
    if (type === 'applicants' || title.includes('applicant')) setActiveTab('applicants');
    else if (type === 'claims' || title.includes('claim')) setActiveTab('claims');
    else if (type === 'records' || title.includes('record')) setActiveTab('records');
    else if (type === 'announcement') setActiveTab('announcements');
    else if (type === 'message' || title.includes('message')) setShowMsgModal(true);
    else setActiveTab('dashboard');
  };
  const confirmLogout = () => setShowLogoutModal(true);
  const handleLogout = async () => { try { await signOut(auth); localStorage.clear(); navigate('/'); } catch (e) { console.error(e); } };
  const handleTabChange = (tab) => { setActiveTab(tab); setShowSidebar(false); setSelectedRecordId(null); };
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const styles = {
    layout: { fontFamily: "'Inter', sans-serif", background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', transition: 'all 0.3s' },
    iconBtn: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px', cursor: 'pointer', position: 'relative', display: 'flex', color: C.text },
    badge: { position: 'absolute', top: '6px', right: '6px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: `2px solid ${C.card}` },
    badgeCount: { position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center', border: `2px solid ${C.card}` },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modalLarge: { background: C.card, borderRadius: '16px', width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid ${C.border}` },
    modalHeader: { padding: '16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.text, fontWeight: '800', fontSize: '16px', background: C.card },
    content: { flex: 1, padding: '24px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', background: C.bg },
    card: { background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px', color: C.text },
    sidebarOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 }
  };

  return (
    <div style={styles.layout}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      .app-container { display: flex; height: 100vh; overflow: hidden; background: ${C.bg}; }
      .left-panel { width: 280px; background: ${isDark ? 'linear-gradient(180deg, #151a27 0%, #1e222e 100%)' : 'linear-gradient(180deg, #1e3a8a 0%, #2046a8 50%, #2563eb 100%)'}; display: flex; flex-direction: column; flex-shrink: 0; height: 100vh; position: sticky; top: 0; overflow: hidden; border-right: 1px solid ${C.border}; }
      .left-header { height: 72px; background: rgba(255,255,255,0.06); backdrop-filter: blur(10px); display: flex; align-items: center; padding: 0 16px; gap: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); flex-shrink: 0; }
      .left-sidebar { flex: 1; display: flex; flex-direction: column; padding: 14px 12px 12px 12px; overflow: hidden; }
      .menu-list { display: flex; flex-direction: column; gap: 5px; flex: 1; }
      .menu-item { padding: 11px 14px; border-radius: 12px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 12px; font-size: 13.5px; transition: all 0.35s; color: rgba(255,255,255,0.82); border: 1px solid transparent; position: relative; }
      .menu-item:hover { background: rgba(255,255,255,0.08); color: white; transform: translateX(2px); }
      .menu-item.active { background: linear-gradient(135deg, rgba(254,252,232,0.92) 0%, rgba(254,249,195,0.88) 100%); color: #1e3a8a; font-weight: 700; border: 1px solid rgba(250,204,21,0.4); box-shadow: 0 8px 32px rgba(250,204,21,0.22); transform: translateX(3px); }
      .menu-item.active::before { content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%); width: 4px; height: 22px; background: #facc15; border-radius: 0 4px 4px 0; }
      .right-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; background: ${C.bg}; height: 100vh; overflow: hidden; }
      .right-header { height: 72px; background: ${C.card}; display: flex; justify-content: flex-end; align-items: center; padding: 0 24px; gap: 10px; box-shadow: 0 1px 0 ${C.border}; flex-shrink: 0; position: relative; }
      .main-content { flex: 1; padding: 24px; overflow-y: auto; overflow-x: hidden; background: ${C.bg}; }
      .mobile-fab { display: none; }
        @media (max-width: 1024px) {.left-panel { display: none!important; }.mobile-fab { display: flex!important; position: fixed; bottom: 20px; left: 20px; width: 54px; height: 54px; background: #1e3a8a; color: white; border: none; border-radius: 14px; align-items: center; justify-content: center; z-index: 90; cursor: pointer; } }
      `}</style>

      {showLogoutModal && (<div style={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}><div style={{ background: C.card, borderRadius: '20px', width: '100%', maxWidth: '380px', padding: '28px', textAlign: 'center', border: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}><div style={{ width: '56px', height: '56px', background: '#fef3c7', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}><LogOut size={26} color="#d97706" /></div><h3 style={{ fontWeight: '800', fontSize: '18px', color: C.text, marginBottom: '8px' }}>Do you want to logout?</h3><p style={{ fontSize: '13px', color: C.muted, marginBottom: '22px' }}>You will be redirected.</p><div style={{ display: 'flex', gap: '10px' }}><button onClick={() => setShowLogoutModal(false)} style={{ flex: 1, padding: '12px', background: C.card2, color: C.text, border: `1px solid ${C.border}`, borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>Stay</button><button onClick={handleLogout} style={{ flex: 1, padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}>Logout</button></div></div></div>)}

      {previewImage && (<div style={{ ...styles.modalOverlay, zIndex: 600 }} onClick={() => setPreviewImage(null)}><div style={{ background: C.card, padding: '12px', borderRadius: '16px', border: `1px solid ${C.border}`, maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: C.text, fontWeight: '800' }}><span>{previewImage.label}</span><X size={20} style={{ cursor: 'pointer' }} onClick={() => setPreviewImage(null)} /></div><img src={previewImage.url} alt="req" style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '8px' }} /></div></div>)}
      {showMsgModal && (<div style={styles.modalOverlay} onClick={() => { setShowMsgModal(false); setSelectedChatId(null); }}><div style={styles.modalLarge} onClick={e => e.stopPropagation()}><div style={styles.modalHeader}>{selectedChatId ? <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><ArrowLeft size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedChatId(null)} />{activeConv?.name}</div> : <span>Inbox ({conversations.length})</span>}<X size={20} onClick={() => { setShowMsgModal(false); setSelectedChatId(null); }} style={{ cursor: 'pointer', color: C.muted }} /></div><div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}><div style={{ width: selectedChatId ? '0px' : '100%', minWidth: selectedChatId ? '0px' : '100%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}`, overflowY: 'auto', background: C.card }}>{conversations.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: '13px' }}>No conversations</div> : conversations.map(conv => (<div key={conv.id} onClick={async () => { setSelectedChatId(conv.id); conv.all.forEach(async (m) => { if (!m.isRead && m.senderId !== (currentUser?.uid || userData?.uid)) await updateDoc(doc(db, 'messages', m.id), { isRead: true }); }); }} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', gap: '10px', background: selectedChatId === conv.id ? C.card2 : C.card, borderBottom: `1px solid ${C.border}` }}><div style={{ width: '40px', height: '40px', background: '#1e3a8a', color: '#facc15', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>{conv.name[0]?.toUpperCase()}</div><div style={{ flex: 1, overflow: 'hidden' }}><div style={{ fontWeight: '700', color: C.text, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}><span>{conv.name}</span>{conv.unread > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{conv.unread}</span>}</div><div style={{ fontSize: '11.5px', color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMsg.text}</div></div></div>))}</div>{selectedChatId && (<div style={{ width: '100%', display: 'flex', flexDirection: 'column', background: C.card }}><div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: C.bg }}>{activeConv?.all.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)).map(m => (<div key={m.id} style={{ alignSelf: m.senderId === (currentUser?.uid || userData?.uid) ? 'flex-end' : 'flex-start', maxWidth: '75%' }}><div style={{ background: m.senderId === (currentUser?.uid || userData?.uid) ? '#1e3a8a' : C.card, color: m.senderId === (currentUser?.uid || userData?.uid) ? 'white' : C.text, padding: '10px 14px', borderRadius: m.senderId === (currentUser?.uid || userData?.uid) ? '14px 14px 2px 14px' : '14px 14px 14px 2px', fontSize: '13px', border: m.senderId !== (currentUser?.uid || userData?.uid) ? `1px solid ${C.border}` : 'none' }}>{m.text}</div></div>))}</div><div style={{ display: 'flex', padding: '12px', background: C.card, borderTop: `1px solid ${C.border}`, gap: '8px' }}><input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMsg()} placeholder="Reply..." style={{ flex: 1, padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: '12px', outline: 'none', fontSize: '13px', background: C.card2, color: C.text }} /><button onClick={handleSendMsg} style={{ width: '42px', height: '42px', background: '#1e3a8a', color: '#facc15', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Send size={18} /></button></div></div>)}</div></div></div>)}
      {showSidebar && (<><div style={styles.sidebarOverlay} onClick={() => setShowSidebar(false)}></div><div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: isDark ? C.card : 'linear-gradient(180deg, #1e3a8a 0%, #2563eb 100%)', zIndex: 101, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', borderRight: `1px solid ${C.border}` }}><div style={{ height: '72px', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '10px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}><div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e3a8a' }}>{staffInitial}</div><div style={{ lineHeight: '1.2', overflow: 'hidden' }}><div style={{ fontWeight: '800', color: 'white', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staffName}</div><div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>ID: {staffId}</div><div style={{ fontSize: '10px', color: '#fde68a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block' }}></span>Online - Staff</div></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '14px 12px', flex: 1, overflow: 'hidden' }}><div className="menu-list">{menuItems.map(item => (<div key={item.key} className={`menu-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => handleTabChange(item.key)}><item.icon size={18} /> {item.label}</div>))}</div><div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}><button style={{ width: '100%', padding: '12px', background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px' }} onClick={confirmLogout}><LogOut size={18} /> Logout</button></div></div></div></>)}

      <div className="app-container">
        <div className="left-panel">
          <div className="left-header">
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'white', flexShrink: 0, border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#1e3a8a' }}>{staffInitial}</div>
            <div style={{ lineHeight: '1.2', overflow: 'hidden' }}>
              <div style={{ fontWeight: '800', color: 'white', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staffName}</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>ID: {staffId}</div>
              <div style={{ fontSize: '11px', color: '#fde68a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}><span style={{ width: '6px', height: '6px', background: '#4ade80', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }}></span> Online - Staff</div>
            </div>
          </div>
          <div className="left-sidebar">
            <div className="menu-list">{menuItems.map(item => (<div key={item.key} className={`menu-item ${activeTab === item.key ? 'active' : ''}`} onClick={() => handleTabChange(item.key)}><item.icon size={19} /> {item.label}</div>))}</div>
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}><button style={{ width: '100%', padding: '13px', background: '#facc15', color: '#000', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13.5px' }} onClick={confirmLogout}><LogOut size={18} /> Logout</button></div>
          </div>
        </div>

        <div className="right-panel">
          <div className="right-header">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', position: 'relative' }}>

              <button
                style={{
                  ...styles.iconBtn,
                  background: activeTab === 'settings' ? '#1e3a8a' : C.card,
                  border: `1px solid ${activeTab === 'settings' ? '#1e3a8a' : C.border}`,
                  color: activeTab === 'settings' ? '#facc15' : C.text
                }}
                onClick={() => setActiveTab('settings')}
                title="Settings"
              >
                <Settings size={20} color={activeTab === 'settings' ? '#facc15' : C.text} />
              </button>

              <button ref={bellRef} style={styles.iconBtn} onClick={() => setShowNotifDropdown(!showNotifDropdown)}>
                <Bell size={20} color={C.text} />
                {unreadCount > 0 && <div style={styles.badgeCount}>{unreadCount}</div>}
              </button>

              <button style={styles.iconBtn} onClick={() => setShowMsgModal(true)}>
                <MessageCircle size={20} color={C.text} />
                {messages.some(m => !m.isRead && m.senderId !== (currentUser?.uid || userData?.uid)) && <div style={styles.badge}></div>}
              </button>

              {showNotifDropdown && (
                <div ref={notifRef} style={{ position: 'absolute', top: '48px', right: '90px', width: '360px', maxWidth: '92vw', background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', zIndex: 50, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: C.text }}>Notifications <span style={{ background: isDark ? C.card2 : '#fef3c7', color: isDark ? C.muted : '#92400e', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', marginLeft: '6px' }}>{notifications.length}</span></h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {unreadCount > 0 && <button onClick={handleMarkAllRead} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '20px', padding: '4px 10px', fontSize: '10px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: C.text }}><CheckCheck size={12} /> Mark all read</button>}
                      <X size={16} style={{ cursor: 'pointer', color: C.muted }} onClick={() => setShowNotifDropdown(false)} />
                    </div>
                  </div>
                  <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? <div style={{ textAlign: 'center', padding: '30px 20px', color: C.muted, fontSize: '13px' }}>No notifications yet</div> : notifications.map(n => (
                      <div key={n.id} onClick={() => handleNotifClick(n)} style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: n.isRead ? C.card : C.card2, cursor: 'pointer', display: 'flex', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Bell size={16} color="white" /></div>
                        <div style={{ flex: 1, minWidth: 0 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}><strong style={{ fontSize: '12.5px', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</strong>{!n.isRead && <span style={{ width: '6px', height: '6px', background: '#ef4444', borderRadius: '50%', flexShrink: 0, marginTop: '6px' }}></span>}</div><div style={{ fontSize: '11.5px', color: C.muted, marginTop: '2px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div><div style={{ fontSize: '10px', color: C.muted, marginTop: '4px' }}>{n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'Just now'}</div></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="main-content" style={styles.content}>
            {activeTab === 'dashboard' && <DashboardTab styles={styles} setPreviewImage={setPreviewImage} />}
            {activeTab === 'applicants' && <ApplicantsTab styles={styles} setPreviewImage={setPreviewImage} />}
            {activeTab === 'claims' && <ClaimsTab styles={styles} setPreviewImage={setPreviewImage} />}
            {activeTab === 'records' && <RecordsTab styles={styles} selectedRecordId={selectedRecordId} setPreviewImage={setPreviewImage} />}
            {activeTab === 'announcements' && <AnnouncementsTab styles={styles} />}
            {activeTab === 'summary' && <SummaryTab styles={styles} />}
            {activeTab === 'settings' && <SettingsTab />}
          </div>
        </div>
      </div>
      <button className="mobile-fab" onClick={() => setShowSidebar(true)}><Menu size={22} /></button>
    </div>
  );
}
export default StaffPage;