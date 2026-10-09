import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const MessagesTab = ({ styles }) => {
  const { userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      // KUNIN LAHAT NG MESSAGE NA PARA SA STAFF
      const q = query(
        collection(db, 'messages'), 
        where('receiverRole', '==', 'staff'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { 
      console.error(err);
      // Kung wala pang receiverRole field, fallback muna sa luma
      const q2 = query(collection(db, 'messages'), where('participants', 'array-contains', 'admin'));
      const snap2 = await getDocs(q2);
      setMessages(snap2.docs.map(d => ({ id: d.id, ...d.data() })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSendReply = async () => {
    if(!replyText.trim() || !selectedChat) return;
    
    try {
      // 1. MAG-SEND NG REPLY
      await addDoc(collection(db, 'messages'), {
        senderId: userData.uid,
        senderName: userData.name,
        senderRole: 'staff',
        receiverId: selectedChat.senderId,
        receiverRole: 'soloparent',
        participants: [userData.uid, selectedChat.senderId],
        text: replyText,
        isRead: false,
        createdAt: serverTimestamp(),
        parentMessageId: selectedChat.id // para naka-thread
      });

      // 2. MARK AS READ YUNG ORIGINAL
      await updateDoc(doc(db, 'messages', selectedChat.id), { isRead: true });

      // 3. NOTIF KAY SOLO PARENT
      await addDoc(collection(db, 'notifications'), {
        title: 'New Reply from Staff',
        message: replyText.substring(0,50) + '...',
        for: 'soloparent',
        forId: selectedChat.senderId,
        isRead: false,
        createdAt: serverTimestamp()
      });

      setReplyText('');
      fetchMessages();
      alert('Reply sent!');

    } catch(err) { console.error(err); }
  }

  if(loading) return <p>Loading messages...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', marginBottom: '16px' }}>Staff Inbox</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
        {/* LEFT: LIST NG MESSAGES */}
        <div style={{...styles.card, padding: '12px', maxHeight: '500px', overflowY: 'auto'}}>
          {messages.length === 0? <p style={{fontSize: '13px'}}>No messages</p> : 
            messages.map(msg => (
              <div 
                key={msg.id} 
                onClick={() => setSelectedChat(msg)}
                style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #FEF3C7', 
                  cursor: 'pointer',
                  background: msg.isRead? 'white' : '#FEF3C7' // YELLOW pag unread
                }}
              >
                <p style={{margin: 0, fontSize: '13px', fontWeight: '600'}}>{msg.senderName || 'Solo Parent'}</p>
                <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#64748b'}}>{msg.text.substring(0,40)}...</p>
              </div>
            ))
          }
        </div>

        {/* RIGHT: CHAT VIEW */}
        <div style={{...styles.card, padding: '16px'}}>
          {selectedChat? (
            <>
              <h3 style={{fontSize: '14px', fontWeight: '700', color: '#1E3A8A', marginTop: 0}}>
                Chat with: {selectedChat.senderName}
              </h3>
              <div style={{background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px'}}>
                <b>Message:</b> {selectedChat.text}
              </div>
              
              <textarea 
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                style={{width: '100%', height: '80px', padding: '10px', border: '1.5px solid #FACC15', borderRadius: '6px', fontSize: '13px'}}
              />
              <button 
                onClick={handleSendReply}
                style={{marginTop: '8px', background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '6px', padding: '10px 16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}
              >
                <Send size={14}/> Send Reply
              </button>
            </>
          ) : (
            <p style={{color: '#64748b', textAlign: 'center', marginTop: '40px'}}>Select a message to reply</p>
          )}
        </div>
      </div>
    </div>
  )
}
export default MessagesTab;