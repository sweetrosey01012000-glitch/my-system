import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../../firebase";
import { MessageCircle, X, Send, UserCircle } from 'lucide-react';

function MessagesPage({ userId, soloparentData }) {
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const scrollRef = useRef(null);

  const currentUserId = userId || soloparentData?.uid || 'user1';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "messages"), (snap) => {
      let data = snap.docs.map(d => ({id:d.id,...d.data()}));
      data.sort((a,b) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
      setMsgs(data);
    });
    return () => unsub();
  }, []);

  const groups = {};
  msgs.forEach(m => {
    const otherId = m.senderId === currentUserId? m.receiverId : m.senderId;
    const key = otherId || 'staff';
    if(!groups[key]) groups[key] = { key, otherId: key, otherName: m.senderId === currentUserId? m.receiverId : m.senderName, lastMsg: m, messages: [] };
    groups[key].messages.push(m);
    groups[key].lastMsg = m;
  });

  const list = Object.values(groups);

  const send = async () => {
    if(!text.trim() ||!activeChat) return;
    await addDoc(collection(db, "messages"), {
      text,
      senderId: currentUserId,
      senderName: soloparentData?.name || 'Solo Parent',
      receiverId: activeChat.otherId,
      participants: [currentUserId, activeChat.otherId],
      createdAt: serverTimestamp()
    });
    setText('');
  };

  useEffect(() => {
    if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeChat?.messages, msgs]);

  return (
    <div style={{ display:'flex', height:'100vh', background:'#F0F2F5' }}>
      {/* LEFT LIST - PARANG FB */}
      <div style={{ width:'100%', maxWidth:'360px', background:'white', borderRight:'1px solid #ddd', overflowY:'auto' }}>
        <div style={{ padding:'16px', fontWeight:'800', fontSize:'20px', borderBottom:'1px solid #eee' }}>Messages</div>
        {list.map(c => (
          <div key={c.key} onClick={() => setActiveChat(c)} style={{ padding:'12px', display:'flex', gap:'10px', cursor:'pointer', background: activeChat?.key===c.key?'#E4E6EB':'white', borderBottom:'1px solid #f0f0f0' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'#1E3A8A', color:'#FACC15', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800' }}>M</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:'700', fontSize:'13px' }}>{c.otherName || 'MSWD Staff'}</div>
              <div style={{ fontSize:'11px', color:'#65676B', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'180px' }}>{c.lastMsg?.text}</div>
            </div>
          </div>
        ))}
        {list.length===0 && <div style={{ padding:'20px', fontSize:'12px', color:'gray' }}>No messages yet. Mag send ka muna sa Firebase console.</div>}
      </div>

      {/* CHAT DOCK SA BABA KANAN - FB STYLE */}
      {activeChat && (
        <div style={{ position:'fixed', bottom:0, right:'10px', width:'330px', height:'400px', background:'white', borderRadius:'8px 8px 0 0', boxShadow:'0 2px 12px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column', zIndex:99 }}>
          <div style={{ background:'#1E3A8A', color:'white', padding:'10px', borderRadius:'8px 8px 0 0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <b style={{ fontSize:'13px' }}>{activeChat.otherName}</b>
            <X size={18} style={{ cursor:'pointer' }} onClick={() => setActiveChat(null)}/>
          </div>
          <div ref={scrollRef} style={{ flex:1, overflowY:'auto', padding:'10px', display:'flex', flexDirection:'column', gap:'6px' }}>
            {activeChat.messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.senderId===currentUserId?'flex-end':'flex-start', background: m.senderId===currentUserId?'#0084FF':'#E4E6EB', color: m.senderId===currentUserId?'white':'black', padding:'8px 12px', borderRadius:'16px', fontSize:'13px', maxWidth:'70%' }}>{m.text}</div>
            ))}
          </div>
          <div style={{ padding:'8px', borderTop:'1px solid #ddd', display:'flex', gap:'6px' }}>
            <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Aa" style={{ flex:1, borderRadius:'20px', border:'1px solid #ddd', padding:'8px 12px', fontSize:'13px' }}/>
            <button onClick={send} style={{ border:'none', background:'#0084FF', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer' }}><Send size={14} color="white"/></button>
          </div>
        </div>
      )}
    </div>
  );
}
export default MessagesPage;