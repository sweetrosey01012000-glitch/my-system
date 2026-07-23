import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, Trash2 } from 'lucide-react'; // npm i lucide-react

// ==========================================
// SHARED COMMUNITY FORUM PAGE - MESSENGER STYLE
// ==========================================
function ForumPage() {
  const navigate = useNavigate();
  const { userRole, userData, currentUser } = useAuth();
  const chatEndRef = useRef(null); // auto scroll to bottom

  const canPost = userRole === 'soloparent';
  const canModerate = ['admin', 'staff'].includes(userRole);
  const canDelete = (authorId) => { return canModerate || authorId === currentUser?.uid; };

  const [threads, setThreads] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newReplyBody, setNewReplyBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto scroll pag may bagong reply
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  // Fetch Threads in real-time
  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const threadData = [];
      snapshot.forEach(doc => threadData.push({ id: doc.id,...doc.data() }));
      setThreads(threadData);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Replies in real-time
  useEffect(() => {
    if (!selectedThread) return;
    const q = query(collection(db, 'forum_threads', selectedThread.id, 'replies'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reps = [];
      snapshot.forEach(doc => reps.push({ id: doc.id,...doc.data() }));
      setReplies(reps);
    });
    return () => unsubscribe();
  }, [selectedThread]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!canPost ||!newThreadTitle.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forum_threads'), {
        title: newThreadTitle,
        body: newThreadBody,
        authorId: currentUser.uid,
        authorName: userData?.name || 'Solo Parent',
        createdAt: new Date().toISOString()
      });
      setNewThreadTitle('');
      setNewThreadBody('');
    } catch (error) { alert("Failed to create thread."); }
    finally { setIsSubmitting(false); }
  };

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!canPost ||!selectedThread ||!newReplyBody.trim()) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forum_threads', selectedThread.id, 'replies'), {
        body: newReplyBody,
        authorId: currentUser.uid,
        authorName: userData?.name || 'Solo Parent',
        createdAt: new Date().toISOString()
      });
      setNewReplyBody('');
    } catch (error) { alert("Failed to post reply."); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteThread = async (threadId, threadAuthorId) => {
    if (!canDelete(threadAuthorId)) return;
    if (!window.confirm("Delete this thread?")) return;
    try {
      await deleteDoc(doc(db, 'forum_threads', threadId));
      if (selectedThread && selectedThread.id === threadId) setSelectedThread(null);
    } catch (error) { alert("Failed to delete thread."); }
  };

  const handleDeleteReply = async (replyId, replyAuthorId) => {
    if (!canDelete(replyAuthorId)) return;
    try { 
      await deleteDoc(doc(db, 'forum_threads', selectedThread.id, 'replies', replyId)); 
    } catch (error) { 
      alert("Failed to delete reply."); 
    }
  };
    // <-- KULANG DITO NG }

    const formatDate = (isoString) => {
      if (!isoString) return "";
      const date = isoString.toDate ? isoString.toDate() : new Date(isoString);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000 / 60);
      if (diff < 1) return "Just now";
      if (diff < 60) return `${diff}m ago`;
      if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
      return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    };

  const styles = {
    container: { maxWidth: '700px', margin: '0 auto', background: '#F8FAFC', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
    header: { padding: '16px 24px', background: 'white', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 },
    backBtn: { background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', display: 'flex', color: '#1E3A8A' },
    title: { fontSize: '18px', fontWeight: 'bold', color: '#1E3A8A', margin: 0 },
    chatList: { flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
    chatBubble: { background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0', position: 'relative' },
    myBubble: { background: '#DBEAFE', borderColor: '#BFDBFE', alignSelf: 'flex-end' },
    chatHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
    chatName: { fontWeight: 'bold', color: '#1E3A8A', fontSize: '14px' },
    chatTime: { fontSize: '12px', color: '#64748B' },
    chatMessage: { fontSize: '14px', color: '#334155', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
    inputArea: { padding: '12px 16px', background: 'white', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '8px', position: 'sticky', bottom: 0 },
    input: { flex: 1, padding: '12px 16px', borderRadius: '20px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '14px' },
    sendBtn: { background: '#1E3A8A', color: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    deleteBtn: { position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' },
    threadCard: { background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', cursor: 'pointer' },
    empty: { textAlign: 'center', color: '#64748B', padding: '40px 0' },
    formCard: { background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '16px' }
  };
// ==========================================
  // RENDER: THREAD DETAIL / CHAT VIEW
  // ==========================================
  if (selectedThread) {
    return (
      <div style={styles.container} className="anim-fade-in">
        {/* HEADER */}
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setSelectedThread(null)}>
            <ArrowLeft size={20}/>
          </button>
          <h2 style={styles.title}>{selectedThread.title}</h2>
          <div style={{width: '36px'}}></div> {/* spacer */}
        </div>

        {/* CHAT LIST */}
        <div style={styles.chatList}>
          {/* ORIGINAL POST */}
          <div style={{...styles.chatBubble, ...(selectedThread.authorId === currentUser?.uid ? styles.myBubble : {})}}>
            <div style={styles.chatHeader}>
              <span style={styles.chatName}>{selectedThread.authorName}</span>
              <span style={styles.chatTime}>{formatDate(selectedThread.createdAt)}</span>
            </div>
            <div style={styles.chatMessage}>{selectedThread.body}</div>
            {canDelete(selectedThread.authorId) && (
              <button style={styles.deleteBtn} onClick={() => handleDeleteThread(selectedThread.id, selectedThread.authorId)}>
                <Trash2 size={14}/>
              </button>
            )}
          </div>

          {/* REPLIES */}
          {replies.map((reply) => (
            <div key={reply.id} style={{...styles.chatBubble, ...(reply.authorId === currentUser?.uid ? styles.myBubble : {})}}>
              <div style={styles.chatHeader}>
                <span style={styles.chatName}>{reply.authorName}</span>
                <span style={styles.chatTime}>{formatDate(reply.createdAt)}</span>
              </div>
              <div style={styles.chatMessage}>{reply.body}</div>
              {canDelete(reply.authorId) && (
                <button style={styles.deleteBtn} onClick={() => handleDeleteReply(reply.id, reply.authorId)}>
                  <Trash2 size={14}/>
                </button>
              )}
            </div>
          ))}
          <div ref={chatEndRef} /> {/* auto scroll target */}
        </div>

        {/* INPUT BOX - MESSENGER STYLE. Solo Parent lang pwede mag reply */}
        {canPost && (
          <form style={styles.inputArea} onSubmit={handleCreateReply}>
            <input 
              type="text"
              style={styles.input}
              placeholder="Write a reply..."
              value={newReplyBody}
              onChange={(e) => setNewReplyBody(e.target.value)}
              disabled={isSubmitting}
            />
            <button type="submit" style={{...styles.sendBtn, opacity: isSubmitting ? 0.6 : 1}} disabled={isSubmitting}>
              <Send size={20}/>
            </button>
          </form>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: THREAD LIST VIEW
  // ==========================================
  return (
    <div style={styles.container} className="anim-fade-in">
      {/* HEADER */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          <ArrowLeft size={20}/>
        </button>
        <h2 style={styles.title}>Community Forum</h2>
        <div style={{width: '36px'}}></div>
      </div>

      <div style={{padding: '16px', overflowY: 'auto', flex: 1}}>
        {/* CREATE THREAD FORM - SOLO PARENT LANG */}
        {canPost && (
          <div style={styles.formCard}>
            <h3 style={{margin: '0 0 12px 0', color: '#1E3A8A', fontSize: '16px'}}>Start New Discussion</h3>
            <form onSubmit={handleCreateThread}>
              <input 
                type="text"
                style={{...styles.input, marginBottom: '10px'}}
                placeholder="Thread Title"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                required
              />
              <textarea 
                style={{...styles.input, minHeight: '80px', resize: 'vertical', borderRadius: '12px'}}
                placeholder="What's on your mind?"
                value={newThreadBody}
                onChange={(e) => setNewThreadBody(e.target.value)}
              />
              <button type="submit" style={{...styles.sendBtn, width: '100%', borderRadius: '8px', marginTop: '10px'}} disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post Discussion'}
              </button>
            </form>
          </div>
        )}

        {/* THREAD LIST */}
        {threads.length === 0 ? (
          <p style={styles.empty}>No discussions yet. Be the first! 💬</p>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} style={styles.threadCard} className="hover-card" onClick={() => setSelectedThread(thread)}>
              <div style={styles.chatHeader}>
                <span style={styles.chatName}>{thread.authorName}</span>
                <span style={styles.chatTime}>{formatDate(thread.createdAt)}</span>
              </div>
              <h4 style={{margin: '8px 0', color: '#1E3A8A', fontSize: '16px'}}>{thread.title}</h4>
              <p style={{...styles.chatMessage, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                {thread.body}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ForumPage;