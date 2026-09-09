import React, { useState, useMemo } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

function Messenger({ messages, currentUid, onSend, currentUserData }) {
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');

  // GROUP BY OTHER USER - LATEST FIRST
  const conversations = useMemo(() => {
    const groups = {};
    messages.forEach(m => {
      // kung staff literal, gamitin senderId as key
      let otherId = m.senderId === currentUid? m.receiverId : m.senderId;
      if (otherId === 'staff') otherId = m.senderId === currentUid? 'staff' : m.senderId;

      if (!groups[otherId]) {
        groups[otherId] = {
          id: otherId,
          name: m.senderId === currentUid? (m.receiverName || 'MSWD Staff') : (m.senderName || 'User'),
          photo: m.senderId === currentUid? null : m.senderName?.[0],
          lastMsg: m,
          all: []
        };
      }
      groups[otherId].all.push(m);
      if ((m.createdAt?.seconds || 0) > (groups[otherId].lastMsg.createdAt?.seconds || 0)) {
        groups[otherId].lastMsg = m;
      }
    });
    return Object.values(groups).sort((a,b) => (b.lastMsg.createdAt?.seconds||0) - (a.lastMsg.createdAt?.seconds||0));
  }, [messages, currentUid]);

  const activeChat = conversations.find(c => c.id === selectedId);

  return (
    <div style={{display:'flex', height:'70vh', background:'white', borderRadius:'16px', overflow:'hidden', border:'2px solid #FACC15'}}>
      {/* LEFT LIST - MOBILE: HIDE PAG MAY SELECTED */}
      <div style={{width: selectedId? '0%' : '100%', minWidth: selectedId? '0' : '100%', display:'flex', flexDirection:'column', borderRight:'2px solid #FEF3C7'}} className="messenger-list">
        <div style={{padding:'12px', fontWeight:'800', color:'#1E3A8A', borderBottom:'2px solid #FACC15', background:'#FFFBEB'}}>Messages</div>
        <div style={{flex:1, overflowY:'auto'}}>
          {conversations.length===0? <div style={{padding:'20px', textAlign:'center', color:'#64748b'}}>No conversations yet</div> :
          conversations.map(conv => (
            <div key={conv.id} onClick={() => setSelectedId(conv.id)}
              style={{padding:'14px 12px', cursor:'pointer', display:'flex', gap:'10px', background: selectedId===conv.id? '#FFFBEB':'white', borderBottom:'1px solid #FEF3C7'}}>
              <div style={{width:'40px', height:'40px', background:'#1E3A8A', color:'#FACC15', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800'}}>{conv.name[0]?.toUpperCase()}</div>
              <div style={{flex:1, overflow:'hidden'}}>
                <div style={{fontWeight:'700', color:'#1E3A8A', fontSize:'14px'}}>{conv.name}</div>
                <div style={{fontSize:'12px', color:'#64748b', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{conv.lastMsg.text}</div>
              </div>
              <div style={{fontSize:'10px', color:'#94a3b8'}}>{conv.lastMsg.createdAt? new Date(conv.lastMsg.createdAt.seconds*1000).toLocaleDateString() : ''}</div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT CHAT */}
      {selectedId && (
        <div style={{width:'100%', display:'flex', flexDirection:'column', background:'#FFFBEA'}}>
          <div style={{padding:'12px', background:'white', borderBottom:'2px solid #FACC15', display:'flex', alignItems:'center', gap:'10px'}}>
            <ArrowLeft size={20} style={{cursor:'pointer', color:'#1E3A8A'}} onClick={()=>setSelectedId(null)}/>
            <div style={{width:'32px', height:'32px', background:'#1E3A8A', color:'#FACC15', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800'}}>{activeChat?.name[0]}</div>
            <strong style={{color:'#1E3A8A'}}>{activeChat?.name}</strong>
          </div>
          <div style={{flex:1, padding:'12px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px'}}>
            {activeChat?.all.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0)).map(m=>(
              <div key={m.id} style={{alignSelf: m.senderId===currentUid?'flex-end':'flex-start', maxWidth:'75%'}}>
                <div style={{background: m.senderId===currentUid?'#1E3A8A':'#FACC15', color: m.senderId===currentUid?'white':'#1E3A8A', padding:'10px 14px', borderRadius: m.senderId===currentUid?'16px 16px 0 16px':'16px 16px 16px 0', fontSize:'14px'}}>{m.text}</div>
                <div style={{fontSize:'10px', color:'#94a3b8', marginTop:'2px', textAlign: m.senderId===currentUid?'right':'left'}}>{m.createdAt?.seconds? new Date(m.createdAt.seconds*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex', padding:'10px', background:'white', borderTop:'2px solid #FACC15', gap:'8px'}}>
            <input value={reply} onChange={e=>setReply(e.target.value)} onKeyDown={e=>e.key==='Enter'&&reply.trim()&& (onSend(activeChat.id, reply), setReply(''))} placeholder="Type a message..." style={{flex:1, padding:'12px', border:'2px solid #FACC15', borderRadius:'24px', outline:'none'}}/>
            <button onClick={()=>{ if(!reply.trim())return; onSend(activeChat.id, reply); setReply('');}} style={{width:'44px', height:'44px', background:'#1E3A8A', color:'#FACC15', border:'none', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><Send size={18}/></button>
          </div>
        </div>
      )}
      {!selectedId && <div style={{width:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b', background:'#FFFBEA'}} className="hidden md:flex">Select a conversation</div>}
    </div>
  );
}

export default Messenger;