import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Home, MessageSquare, User, LogOut, Bell, BookOpen, Megaphone, FileText, MessageCircle, X, Send, ArrowLeft } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { collection, query, orderBy, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import HomeSP from "./SoloParentTab/HomeSP";
import RA11861 from "./SoloParentTab/RA11861";
import Announcements from './SoloParentTab/Announcements';
import CommunityForum from './SoloParentTab/CommunityForum';
import Profile from './SoloParentTab/Profile';
import Assistance from './SoloParentTab/Assistance';

function SoloParentPage() {
  const navigate = useNavigate();
  const { userData, currentUser } = useAuth();
  const userName = userData?.name || 'Loading...';
  const soloParentId = userData?.idNumber || 'SP-000';
  const userInitial = userName!== 'Loading...'? userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'S';
  const [showSidebar, setShowSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState('id');
  const idCardRef = useRef(null);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showMsgModal, setShowMsgModal] = useState(false);
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
        let data = { id: qs.docs[0].id,...qs.docs[0].data() };
        if (data.issuanceDate) {
          const issue = new Date(data.issuanceDate);
          if (!isNaN(issue)) { issue.setFullYear(issue.getFullYear() + 1); data.expiryDate = issue.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
        }
        setSoloparentData(data);
      }
    });
    return () => unsub();
  }, [userData, currentUser]);

  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, 'notifications'), where('for', 'in', ['soloparent', 'all', uid]));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setNotifications(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    });
    return () => unsub();
  }, [userData, currentUser]);

  useEffect(() => {
    const uid = currentUser?.uid || userData?.uid;
    if (!uid) return;
    const q = query(collection(db, 'messages'), where('participants', 'array-contains', uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      data.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      setMessages(data);
    });
    return () => unsub();
  }, [userData, currentUser]);

  useEffect(() => {
    const q = query(collection(db, 'announcements'), where('status', '==', 'published'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setAnnouncements(snapshot.docs.map(doc => ({ id: doc.id,...doc.data() })));
      setLoadingAnnouncements(false);
    }, () => setLoadingAnnouncements(false));
    return () => unsub();
  }, []);

  const conversations = useMemo(() => {
    const uid = currentUser?.uid || userData?.uid;
    const groups = {};
    messages.forEach(m => {
      let otherId = m.senderId === uid? m.receiverId : m.senderId;
      // FIX: Lahat ng "staff" at staffUid i-merge sa isang key lang
      if (otherId === 'staff' || m.senderRole === 'staff' || m.receiverRole === 'staff') {
        otherId = m.senderId === uid? (m.receiverId === 'staff'? 'mswd_staff' : m.receiverId) : m.senderId;
        // kung staff ang kausap, gawin isang group lang na "MSWD Staff"
        if (m.senderRole === 'staff' || m.receiverId === 'staff' || groups['mswd_staff']) {
          otherId = 'mswd_staff';
        }
      }
      if (!groups[otherId]) {
        groups[otherId] = { id: otherId, name: otherId === 'mswd_staff'? 'MSWD Staff' : (m.senderId === uid? 'MSWD Staff' : (m.senderName || 'MSWD Staff')), lastMsg: m, all: [] };
      }
      groups[otherId].all.push(m);
      if ((m.createdAt?.seconds || 0) > (groups[otherId].lastMsg.createdAt?.seconds || 0)) groups[otherId].lastMsg = m;
    });
    return Object.values(groups).sort((a,b) => (b.lastMsg.createdAt?.seconds||0) - (a.lastMsg.createdAt?.seconds||0));
  }, [messages, currentUser, userData]);

  const activeConv = conversations.find(c => c.id === selectedChatId);

  const handleLogout = async (e) => { e.preventDefault(); try { await signOut(auth); localStorage.clear(); navigate('/'); } catch (error) { console.error(error); } };

  const handleDownloadID = async (format) => {
    if (!idCardRef.current) return;
    const printDiv = idCardRef.current.cloneNode(true);
    printDiv.style.position = 'absolute'; printDiv.style.left = '-9999px'; printDiv.style.width = '1011px'; printDiv.style.height = '638px';
    document.body.appendChild(printDiv);
    const canvas = await html2canvas(printDiv, { scale: 1, backgroundColor: '#ffffff', width: 1011, height: 638, useCORS: true });
    document.body.removeChild(printDiv);
    const imgData = canvas.toDataURL('image/png');
    if (format === 'pdf') { const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [53.98, 85.6] }); pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98); pdf.save(`SoloParentID-${soloParentId}.pdf`); }
    if (format === 'png') { const link = document.createElement('a'); link.download = `SoloParentID-${soloParentId}.png`; link.href = canvas.toDataURL('image/png'); link.click(); }
  };

  const handleSendMsg = async () => {
    const uid = currentUser?.uid || userData?.uid;
    if (!newMsg.trim() ||!uid) return;
    const receiver = selectedChatId && selectedChatId!== 'mswd_staff'? selectedChatId : "staff";
  
    await addDoc(collection(db, 'messages'), {
      text: newMsg,
      senderId: uid,
      senderName: userData.name,
      senderRole: 'soloparent',
      receiverId: receiver,
      receiverName: 'MSWD Staff',
      receiverRole: 'staff',
      // IMPORTANT: lagay mo pareho para makita sa both old at new query
      participants: [uid, receiver, "staff"],
      isRead: false,
      createdAt: serverTimestamp()
    });
    setNewMsg('');
  };

  const handleAskStaff = () => {
    setShowMsgModal(true);
    setSelectedChatId(null); // list lang muna, hindi bungad
  };

  const handleMarkRead = async (id) => await updateDoc(doc(db, 'notifications', id), { isRead: true });

  const styles = {
    layout: { fontFamily: "'Inter', 'Poppins', Arial, sans-serif", background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { height: '64px', background: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', borderBottom: '3px solid #FACC15', position: 'relative', zIndex: 50 },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    headerTitle: { fontWeight:'800', color:'#1E3A8A', fontSize:'16px', fontFamily:"'Poppins', sans-serif" },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    profileBtn: { width: '44px', height: '44px', background: '#1E3A8A', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', border: '2px solid #FACC15', cursor: 'pointer' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#1E3A8A', position: 'relative', display: 'flex', padding:'8px' },
    badge: { position: 'absolute', top: '-4px', right: '-4px', width: '10px', height: '10px', background: '#DC2626', borderRadius: '50%', border: '2px solid white' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' },
    modalLarge: { background: 'white', borderRadius: '16px', border: '3px solid #FACC15', width: '100%', maxWidth: '900px', height: '80vh', display: 'flex', flexDirection: 'column', overflow:'hidden' },
    modalSmall: { background: 'white', borderRadius: '16px', border: '3px solid #FACC15', width: '100%', maxWidth: '500px', height: '70vh', display: 'flex', flexDirection: 'column' },
    modalHeader: { padding: '14px 16px', borderBottom: '2px solid #FACC15', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1E3A8A', fontWeight: '800', fontSize: '16px' },
    modalBody: { flex: 1, padding: '16px', overflowY: 'auto' },
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
    <div style={styles.layout} onClick={() => setShowSidebar(false)}>
      {showNotifModal && (<div style={styles.modalOverlay} onClick={() => setShowNotifModal(false)}><div style={styles.modalSmall} onClick={e => e.stopPropagation()}><div style={styles.modalHeader}>Notifications <X size={20} onClick={() => setShowNotifModal(false)} style={{cursor:'pointer'}}/></div><div style={styles.modalBody}>{notifications.length===0? <div>No notifications</div> : notifications.map(n=><div key={n.id} style={{padding:'12px', borderBottom:'1px solid #FEF3C7', background:n.isRead?'transparent':'#FFFBEB', cursor:'pointer'}} onClick={()=>handleMarkRead(n.id)}><strong>{n.title}</strong><div style={{fontSize:'13px'}}>{n.message}</div></div>)}</div></div></div>)}

      {showMsgModal && (
        <div style={styles.modalOverlay} onClick={() => {setShowMsgModal(false); setSelectedChatId(null);}}>
          <div style={styles.modalLarge} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              {selectedChatId? <div style={{display:'flex', alignItems:'center', gap:'10px'}}><ArrowLeft size={20} style={{cursor:'pointer'}} onClick={()=>setSelectedChatId(null)}/>{activeConv?.name}</div> : <span>Messages - Click to open conversation</span>}
              <X size={20} onClick={() => {setShowMsgModal(false); setSelectedChatId(null);}} style={{cursor:'pointer'}}/>
            </div>
            <div style={{flex:1, display:'flex', overflow:'hidden'}}>
              {/* LIST - HINDI BUNGAD CONVERSATION */}
              <div style={{width: selectedChatId? '0px' : '100%', minWidth: selectedChatId? '0px':'100%', display:'flex', flexDirection:'column', borderRight:'2px solid #FEF3C7', overflowY:'auto'}}>
                {conversations.length===0?
                  <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>
                    <div style={{fontWeight:'700', marginBottom:'8px'}}>No conversations yet</div>
                    <div style={{fontSize:'13px'}}>Click "Ask MSWD Staff" in Assistance tab to start</div>
                  </div> :
                  conversations.map(conv=>(
                    <div key={conv.id} onClick={()=>setSelectedChatId(conv.id)} style={{padding:'14px', cursor:'pointer', display:'flex', gap:'12px', background:'white', borderBottom:'1px solid #FEF3C7'}}>
                      <div style={{width:'42px', height:'42px', background:'#1E3A8A', color:'#FACC15', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800'}}>{conv.name[0]?.toUpperCase()}</div>
                      <div style={{flex:1, overflow:'hidden'}}>
                        <div style={{fontWeight:'700', color:'#1E3A8A', fontSize:'14px'}}>{conv.name}</div>
                        <div style={{fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{conv.lastMsg.text}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
              {/* CHAT - LALABAS LANG PAG CLICK */}
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
                    <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMsg()} placeholder="Type a message..." style={{flex:1, padding:'12px', border:'2px solid #FACC15', borderRadius:'24px', outline:'none'}}/>
                    <button onClick={handleSendMsg} style={{width:'44px', height:'44px', background:'#1E3A8A', color:'#FACC15', border:'none', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Send size={18}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSidebar && (<><div style={styles.sidebarOverlay} onClick={()=>setShowSidebar(false)}></div><div style={styles.sidebar} onClick={e=>e.stopPropagation()}><div style={styles.sidebarHeader}><div style={styles.sidebarUser}><div style={styles.sidebarUserName}>{userName}</div><div style={styles.sidebarUserId}>ID: {soloParentId}</div></div></div><div style={styles.sidebarMenu}>{menuItems.map(item=><div key={item.key} style={{...styles.sidebarMenuItem,...(activeTab===item.key&&styles.sidebarMenuItemActive)}} onClick={()=>{setActiveTab(item.key); setShowSidebar(false);}}><item.icon size={20}/> {item.label}</div>)}</div><div style={styles.sidebarFooter}><button style={styles.logoutBtn} onClick={handleLogout}><LogOut size={20}/> Logout</button></div></div></>)}

      {/* LOGO TANGGAL */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.profileBtn} onClick={e=>{e.stopPropagation(); setShowSidebar(true);}}>{userInitial}</button>
          <div style={styles.headerTitle}>SOLO PARENT PORTAL</div>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.iconBtn} onClick={()=>setShowNotifModal(true)}><Bell size={26} color="#1E3A8A"/>{notifications.some(n=>!n.isRead)&&<div style={styles.badge}></div>}</button>
          <button style={styles.iconBtn} onClick={()=>setShowMsgModal(true)}><MessageCircle size={26} color="#1E3A8A"/>{messages.some(m=>!m.isRead&&m.senderId!==(currentUser?.uid||userData?.uid))&&<div style={styles.badge}></div>}</button>
        </div>
      </header>

      <div style={styles.content}>
        {activeTab==='id'&&<HomeSP styles={styles} soloparentData={soloparentData} handleDownloadID={handleDownloadID} idCardRef={idCardRef} setActiveTab={setActiveTab} announcements={announcements} loadingAnnouncements={loadingAnnouncements}/>}
        {activeTab==='ra11861'&&<RA11861 styles={styles}/>}
        {activeTab==='announcements'&&<Announcements announcements={announcements} loadingAnnouncements={loadingAnnouncements} styles={styles} setSelectedAnnouncement={setSelectedAnnouncement} selectedAnnouncement={selectedAnnouncement}/>}
        {activeTab==='community'&&<CommunityForum user={auth.currentUser} userData={userData}/>}
        {activeTab==='profile'&&<Profile styles={styles} soloparentData={soloparentData} userId={soloparentData?.id} setSoloparentData={setSoloparentData} user={auth.currentUser} theme={{yellow:'#FACC15', text:'#1E3A8A', textMuted:'#64748b', red:'#DC2626'}}/>}
        {activeTab==='assistance'&&<Assistance styles={styles} onAskStaff={handleAskStaff} />}
      </div>
    </div>
  );
}
export default SoloParentPage;