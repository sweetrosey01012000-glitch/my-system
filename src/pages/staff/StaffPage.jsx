import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Users, FileText, FolderKanban, Megaphone, BarChart3, LogOut, Bell, MessageCircle, X, Send, ArrowLeft } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, where } from 'firebase/firestore';
import DashboardTab from './StaffTab/DashboardTab';
import ApplicantsTab from './StaffTab/ApplicantsTab';
import ClaimsTab from './StaffTab/ClaimsTab';
import RecordsTab from './StaffTab/RecordsTab';
import AnnouncementsTab from './StaffTab/AnnouncementsTab';
import SummaryTab from './StaffTab/SummaryTab';

function StaffPage() {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const staffName = userData?.name || 'Staff';
  const staffId = userData?.staffId || 'ST-000';
  const staffNumber = userData?.contactNumber || 'N/A';
  const staffInitial = staffName!== 'Staff'? staffName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setNotifications(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, 'messages'));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id,...d.data() }));
      const filtered = all.filter(m => m.receiverId === 'staff' || m.receiverId === uid || m.senderId === uid || m.participants?.includes(uid) || m.participants?.includes('staff'));
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setMessages(filtered);
    });
    return () => unsub();
  }, [userData, currentUser]);

  const conversations = useMemo(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return [];
    const groups = {};
    messages.forEach(m => {
      const isMeSender = m.senderId === uid;
      let otherId;
      if (m.receiverId === 'staff' && m.senderId!== uid) otherId = m.senderId;
      else if (isMeSender) {
        otherId = m.receiverId;
        if (otherId === 'staff') otherId = m.participants?.find(p => p!== uid && p!== 'staff') || m.receiverId;
      } else otherId = m.senderId;
      if (!otherId || otherId === 'staff' || otherId === uid) return;
      if (!groups[otherId]) groups[otherId] = { id: otherId, name: isMeSender? (m.receiverName || 'Solo Parent') : (m.senderName || 'Solo Parent'), lastMsg: m, all: [], unread: 0 };
      groups[otherId].all.push(m);
      if (!m.isRead &&!isMeSender) groups[otherId].unread++;
      if ((m.createdAt?.seconds || 0) > (groups[otherId].lastMsg.createdAt?.seconds || 0)) groups[otherId].lastMsg = m;
    });
    return Object.values(groups).sort((a,b) => (b.lastMsg.createdAt?.seconds||0) - (a.lastMsg.createdAt?.seconds||0));
  }, [messages, userData, currentUser]);

  const activeConv = conversations.find(c => c.id === selectedChatId);
  const handleSendMsg = async () => {
    const uid = currentUser?.uid || userData?.uid;
    if (!newMsg.trim() ||!uid ||!selectedChatId) return;
    await addDoc(collection(db, 'messages'), {
      text: newMsg, senderId: uid, senderName: userData.name, senderRole: 'staff',
      receiverId: selectedChatId, receiverName: activeConv?.name || 'Solo Parent', receiverRole: 'soloparent',
      participants: [uid, selectedChatId], isRead: false, createdAt: serverTimestamp()
    });
    setNewMsg('');
  };
  const handleMarkRead = async (id) => await updateDoc(doc(db, 'notifications', id), { isRead: true });
  const handleLogout = async (e) => { e.preventDefault(); try { await signOut(auth); localStorage.clear(); navigate('/'); } catch (error) { console.error(error); } };
  const handleTabChange = (tab) => { setActiveTab(tab); setShowSidebar(false); setSelectedRecordId(null); }

  const styles = {
    layout: { fontFamily: "'Inter', 'Poppins', Arial, sans-serif", background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', borderBottom: '3px solid #FACC15', position: 'relative', zIndex: 50 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    headerTitle: { fontWeight:'800', color:'#1E3A8A', fontSize:'18px', fontFamily:"'Poppins', sans-serif" },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    profileBtn: { width: '44px', height: '44px', background: '#1E3A8A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', border: '2px solid #FACC15', cursor: 'pointer' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A8A', position: 'relative', display: 'flex', padding: '8px' },
    badge: { position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#DC2626', borderRadius: '50%', border: '2px solid white' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modalLarge: { background: '#FFFFFF', borderRadius: '16px', border: '3px solid #FACC15', width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.4)' },
    modalBox: { background: '#FFFFFF', borderRadius: '16px', border: '3px solid #FACC15', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.4)' },
    modalHeader: { padding: '14px 16px', borderBottom: '3px solid #FACC15', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1E3A8A', fontWeight: '800', fontSize: '16px', background:'#FFFBEB' },
    modalBody: { flex: 1, padding: '16px', overflowY: 'auto', background:'white' },
    primaryBtn: { background:'#1E3A8A', color:'#FFFFFF', border:'2px solid #1E3A8A', padding:'10px 20px', borderRadius:'10px', fontWeight:'800', cursor:'pointer' },
    yellowBtn: { background:'#FACC15', color:'#1E3A8A', border:'2px solid #FACC15', padding:'10px 20px', borderRadius:'10px', fontWeight:'800', cursor:'pointer' },
    secondaryBtn: { background:'white', color:'#1E3A8A', border:'2px solid #1E3A8A', padding:'10px 20px', borderRadius:'10px', fontWeight:'800', cursor:'pointer' },
    sidebarOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100 },
    sidebar: { position: 'fixed', top: 0, left: 0, bottom: 0, width: '280px', background: '#1E3A8A', zIndex: 101, padding: '24px', display: 'flex', flexDirection: 'column', color: 'white' },
    sidebarHeader: { marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.2)' },
    sidebarUser: { marginBottom: '12px', padding: '12px', background: 'rgba(250,204,21,0.15)', borderRadius: '10px', border: '1px solid #FACC15' },
    sidebarUserName: { fontWeight: '800', color: '#FACC15', fontSize: '16px' },
    sidebarUserId: { fontSize: '12px', color: 'rgba(255,255,255,0.9)' },
    sidebarMenu: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    sidebarMenuItem: { padding: '14px', borderRadius: '10px', cursor: 'pointer', color: 'white', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' },
    sidebarMenuItemActive: { background: '#FACC15', color: '#1E3A8A', fontWeight: '800' },
    sidebarFooter: { marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' },
    logoutBtn: { width: '100%', padding: '14px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    content: { flex: 1, padding: '16px 12px', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  };

  return (
    <div style={styles.layout}>
      {previewImage && (
        <div style={{...styles.modalOverlay, zIndex:600}} onClick={()=>setPreviewImage(null)}>
          <div style={{background:'white', padding:'12px', borderRadius:'16px', border:'3px solid #FACC15', maxWidth:'90vw', maxHeight:'90vh'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px', color:'#1E3A8A', fontWeight:'800'}}><span>{previewImage.label}</span><X size={20} style={{cursor:'pointer'}} onClick={()=>setPreviewImage(null)}/></div>
            <img src={previewImage.url} alt="requirement" style={{maxWidth:'85vw', maxHeight:'75vh', objectFit:'contain', borderRadius:'8px'}}/>
          </div>
        </div>
      )}
      {showNotifModal && (<div style={styles.modalOverlay} onClick={() => setShowNotifModal(false)}><div style={{...styles.modalLarge, maxWidth:'500px', height:'70vh'}} onClick={e => e.stopPropagation()}><div style={styles.modalHeader}>Notifications <X size={20} onClick={() => setShowNotifModal(false)} style={{cursor:'pointer'}}/></div><div style={styles.modalBody}>{notifications.length===0? <div>No notifications</div> : notifications.map(n=><div key={n.id} style={{padding:'12px', borderBottom:'1px solid #FEF3C7', background:n.isRead?'transparent':'#FFFBEB', cursor:'pointer'}} onClick={()=>handleMarkRead(n.id)}><strong>{n.title}</strong><div style={{fontSize:'13px'}}>{n.message}</div></div>)}</div></div></div>)}
      {showMsgModal && (
        <div style={styles.modalOverlay} onClick={() => {setShowMsgModal(false); setSelectedChatId(null);}}>
          <div style={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              {selectedChatId? <div style={{display:'flex', alignItems:'center', gap:'10px'}}><ArrowLeft size={20} style={{cursor:'pointer'}} onClick={()=>setSelectedChatId(null)}/><span>{activeConv?.name}</span></div> : <span>Inbox ({conversations.length}) - Latest First</span>}
              <X size={20} onClick={() => {setShowMsgModal(false); setSelectedChatId(null);}} style={{cursor:'pointer'}}/>
            </div>
            <div style={{flex:1, display:'flex', overflow:'hidden'}}>
              <div style={{width: selectedChatId? '0px' : '100%', minWidth: selectedChatId? '0px':'100%', display:'flex', flexDirection:'column', borderRight:'2px solid #FEF3C7', overflowY:'auto', background:'white'}}>
                {conversations.length===0? <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>No conversations yet</div> :
                  conversations.map(conv=>(
                    <div key={conv.id} onClick={async ()=>{
                      setSelectedChatId(conv.id);
                      conv.all.forEach(async (m) => {
                        if (!m.isRead && m.senderId!== (currentUser?.uid || userData?.uid)) {
                          await updateDoc(doc(db, 'messages', m.id), { isRead: true });
                        }
                      });
                    }} style={{padding:'12px 14px', cursor:'pointer', display:'flex', gap:'10px', background: selectedChatId===conv.id?'#FFFBEB':'white', borderBottom:'1px solid #FEF3C7'}}>
                      <div style={{width:'40px', height:'40px', background:'#1E3A8A', color:'#FACC15', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', flexShrink:0}}>{conv.name[0]?.toUpperCase()}</div>
                      <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{fontWeight:'700', color:'#1E3A8A', fontSize:'14px', display:'flex', justifyContent:'space-between'}}><span>{conv.name}</span>{conv.unread>0&&<span style={{background:'#DC2626', color:'white', fontSize:'10px', padding:'2px 6px', borderRadius:'10px'}}>{conv.unread}</span>}</div>
                        <div style={{fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{conv.lastMsg.text}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
              {selectedChatId && (
                <div style={{width:'100%', display:'flex', flexDirection:'column', background:'#FFFBEA'}}>
                  <div style={{flex:1, padding:'12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px'}}>
                    {activeConv?.all.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)).map(m=>(
                      <div key={m.id} style={{alignSelf: m.senderId===(currentUser?.uid||userData?.uid)?'flex-end':'flex-start', maxWidth:'75%'}}>
                        <div style={{background: m.senderId===(currentUser?.uid||userData?.uid)?'#1E3A8A':'#FACC15', color: m.senderId===(currentUser?.uid||userData?.uid)?'white':'#1E3A8A', padding:'10px 14px', borderRadius: m.senderId===(currentUser?.uid||userData?.uid)?'16px 16px 0 16px':'16px 16px 16px 0', fontSize:'14px'}}>{m.text}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex', padding:'10px', background:'white', borderTop:'2px solid #FACC15', gap:'8px'}}>
                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMsg()} placeholder="Reply..." style={{flex:1, padding:'12px', border:'2px solid #FACC15', borderRadius:'24px', outline:'none'}}/>
                    <button onClick={handleSendMsg} style={{width:'44px', height:'44px', background:'#1E3A8A', color:'#FACC15', border:'none', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Send size={18}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showSidebar && (<><div style={styles.sidebarOverlay} onClick={()=>setShowSidebar(false)}></div><div style={styles.sidebar}><div style={styles.sidebarHeader}><div style={styles.sidebarUser}><div style={styles.sidebarUserName}>{staffName}</div><div style={styles.sidebarUserId}>ID: {staffId}</div><div style={styles.sidebarUserId}>Contact: {staffNumber}</div></div></div><div style={styles.sidebarMenu}>{menuItems.map(item=><div key={item.key} style={{...styles.sidebarMenuItem,...(activeTab===item.key&&styles.sidebarMenuItemActive)}} onClick={()=>handleTabChange(item.key)}><item.icon size={20}/> {item.label}</div>)}</div><div style={styles.sidebarFooter}><button style={styles.logoutBtn} onClick={handleLogout}><LogOut size={20}/> Logout</button></div></div></>)}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.profileBtn} onClick={()=>setShowSidebar(true)}>{staffInitial}</button>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={()=>setShowNotifModal(true)}><Bell size={26} color="#1E3A8A"/>{notifications.some(n=>!n.isRead)&&<div style={styles.badge}></div>}</button>
          <button style={styles.iconBtn} onClick={()=>setShowMsgModal(true)}><MessageCircle size={26} color="#1E3A8A"/>{messages.some(m=>!m.isRead && m.senderId!==(currentUser?.uid||userData?.uid))&&<div style={styles.badge}></div>}</button>
        </div>
      </header>
      <div style={styles.content}>
        {activeTab==='dashboard'&&<DashboardTab styles={styles} setPreviewImage={setPreviewImage}/>}
        {activeTab==='applicants'&&<ApplicantsTab styles={styles} setPreviewImage={setPreviewImage}/>}
        {activeTab==='claims'&&<ClaimsTab styles={styles} setPreviewImage={setPreviewImage}/>}
        {activeTab==='records'&&<RecordsTab styles={styles} selectedRecordId={selectedRecordId} setPreviewImage={setPreviewImage}/>}
        {activeTab==='announcements'&&<AnnouncementsTab styles={styles}/>}
        {activeTab==='summary'&&<SummaryTab styles={styles}/>}
      </div>
    </div>
  );
}
export default StaffPage;