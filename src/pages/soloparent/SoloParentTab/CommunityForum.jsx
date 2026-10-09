import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, where, getDocs, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Users, X, ArrowLeft, Send, Trash2, Reply as ReplyIcon, Archive, ArchiveRestore, MessageSquare, Clock } from 'lucide-react';

function CommunityForum({ user, userData }) {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadBody, setNewThreadBody] = useState('');
  const [newThreadFile, setNewThreadFile] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState('active');

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setThreads(data); setLoadingThreads(false);
    }, () => setLoadingThreads(false));
    return () => unsubscribe();
  }, []);

  const openThread = async (thread) => {
    setSelectedThread(thread); setExpandedComments({});
    const q = query(collection(db, 'forum_comments'), where("threadId", "==", thread.id), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q); setComments(snap.docs.map(doc => ({id: doc.id,...doc.data()})));
  }
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (replyingTo) { const depth = getDepth(replyingTo); if (depth >= 2) return; }
    setPosting(true);
    await addDoc(collection(db, 'forum_comments'), { threadId: selectedThread.id, authorId: user.uid, authorName: userData.name, comment: newComment, parentId: replyingTo || null, createdAt: serverTimestamp() });
    setNewComment(''); setReplyingTo(null); setPosting(false); openThread(selectedThread);
  }
  const getDepth = (commentId) => { let depth = 0; let curr = comments.find(c => c.id === commentId); while (curr && curr.parentId) { depth++; curr = comments.find(c => c.id === curr.parentId); } return depth; }
  const handleDelete = async (commentId) => {
    if(!window.confirm("Delete this comment at lahat ng replies nito?")) return;
    const toDelete = [commentId]; const collectChildren = (pid) => { comments.filter(c => c.parentId === pid).forEach(child => { toDelete.push(child.id); collectChildren(child.id); }); }; collectChildren(commentId);
    const batch = writeBatch(db); toDelete.forEach(id => batch.delete(doc(db, 'forum_comments', id))); await batch.commit(); openThread(selectedThread);
  }
  const handleDeleteThread = async (threadId) => {
    if(!window.confirm("Delete this forum at lahat ng comments? Di na maibabalik.")) return;
    const q = query(collection(db, 'forum_comments'), where("threadId", "==", threadId)); const snap = await getDocs(q); const batch = writeBatch(db); snap.docs.forEach(d => batch.delete(d.ref)); batch.delete(doc(db, 'forum_threads', threadId)); await batch.commit(); setSelectedThread(null);
  }
  const handleArchive = async (thread, arch) => { await updateDoc(doc(db, 'forum_threads', thread.id), { isArchived: arch, archivedAt: arch? serverTimestamp() : null }); if (selectedThread?.id === thread.id) setSelectedThread({...thread, isArchived: arch}); }
  const toggleReplies = (commentId) => { setExpandedComments(prev => ({...prev, [commentId]:!prev[commentId]})); }
  const handlePostThread = async () => {
    if (!newThreadTitle.trim() ||!newThreadBody.trim()) return; setPosting(true);
    let fileUrl = ''; if (newThreadFile) { const storageRef = ref(storage, `forum/${Date.now()}_${newThreadFile.name}`); const snap = await uploadBytes(storageRef, newThreadFile); fileUrl = await getDownloadURL(snap.ref); }
    await addDoc(collection(db, 'forum_threads'), { authorId: user.uid, authorName: userData.name, title: newThreadTitle, body: newThreadBody, imageUrl: fileUrl, isArchived: false, createdAt: serverTimestamp() });
    setPosting(false); setShowNewThreadModal(false); setNewThreadTitle(''); setNewThreadBody(''); setNewThreadFile(null);
  };
  const renderComments = (parentId = null, level = 0) => {
    const filtered = comments.filter(c => c.parentId === parentId); if(filtered.length === 0) return null; if (level > 2) return null;
    return filtered.map(c => {
      const replyCount = comments.filter(x => x.parentId === c.id).length; const isExpanded = expandedComments[c.id]; const depth = getDepth(c.id); const canReply = depth < 2;
      return (
        <div key={c.id} style={{marginLeft: level > 0? '16px' : '0', borderLeft: level > 0? `2px solid ${C.border}` : 'none', paddingLeft: level > 0? '12px' : '0'}}>
          <div style={{background: level === 0? C.card2 : C.card, padding: '12px', borderRadius: '12px', marginBottom: '10px', border: `1px solid ${C.border}`, boxShadow: isDark? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.03)'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div><p style={{margin: 0, fontWeight: '800', fontSize: '12.5px', color: '#facc15'}}>{c.authorName}</p><p style={{margin: '2px 0 0 0', fontSize: '10px', color: C.muted}}>{c.createdAt?.toDate? c.createdAt.toDate().toLocaleString() : 'Just now'}</p></div>
              <div style={{display: 'flex', gap: '8px'}}>
                {canReply && <button style={{...localStyles.miniBtn, color: C.text}} onClick={() => setReplyingTo(c.id)}><ReplyIcon size={13}/> Reply</button>}
                {c.authorId === user.uid && <button style={{...localStyles.miniBtn, color: '#ef4444'}} onClick={() => handleDelete(c.id)}><Trash2 size={13}/> Delete</button>}
              </div>
            </div>
            <p style={{margin: '6px 0 0 0', whiteSpace: 'pre-wrap', fontSize: '13px', color: C.text, lineHeight: '1.5'}}>{c.comment}</p>
            {replyCount > 0 && (
              <button style={{background: 'none', border: 'none', color: '#facc15', cursor: 'pointer', fontSize: '11px', marginTop: '8px', fontWeight: '700'}} onClick={() => toggleReplies(c.id)}>
                {isExpanded? `▲ Hide ${replyCount} ${replyCount > 1? 'replies' : 'reply'}` : `▼ Show ${replyCount} ${replyCount > 1? 'replies' : 'reply'}`}
              </button>
            )}
            {replyingTo === c.id && (
              <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                <input autoFocus placeholder={`Replying to ${c.authorName}...`} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostComment()} style={{flex: 1, padding: '8px 12px', border: '1.5px solid #facc15', borderRadius: '10px', fontSize: '13px', outline: 'none', background:C.card, color:C.text}}/>
                <button onClick={handlePostComment} style={{padding: '8px 14px', background: '#1e3a8a', color: '#facc15', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer'}}>Send</button>
              </div>
            )}
          </div>
          {isExpanded && level < 2 && renderComments(c.id, level + 1)}
        </div>
      )
    })
  }
  const filteredThreads = threads.filter(t => { if (filter === 'archived') return t.isArchived; if (filter === 'mine') return t.authorId === user.uid &&!t.isArchived; return!t.isArchived; });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
       .community-container { background: ${C.card}; border-radius: 16px; border: 1px solid ${C.border}; padding: 20px; box-shadow: ${isDark? '0 2px 10px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.03)'}; }
       .filter-tab { padding: 6px 14px; border-radius: 20px; border: 1px solid ${C.border}; background: ${C.card2}; cursor: pointer; font-size: 12px; font-weight: 700; color: ${C.muted}; transition: all 0.2s; }
       .filter-tab.active { background: #1e3a8a; color: #facc15; border-color: #1e3a8a; }
       .thread-card { border: 1px solid ${C.border}; border-radius: 14px; padding: 14px; cursor: pointer; margin-bottom: 12px; transition: all 0.2s; background: ${C.card2}; }
       .thread-card:hover { border-color: #facc15; background: ${isDark? '#252a1e' : '#fffbeb'}; transform: translateY(-1px); }
       .thread-card.archived { opacity: 0.7; background: ${C.card}; }
      `}</style>

      <div className="community-container" style={{background:C.card}}>
        {!selectedThread? (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px'}}>
              <h2 style={{fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: C.text}}><div style={{background: '#1e3a8a', padding: '6px', borderRadius: '10px'}}><Users size={16} color="#facc15"/></div> Community Forum <span style={{fontSize: '11px', background: C.card2, color: C.muted, padding: '3px 8px', borderRadius: '10px', border:`1px solid ${C.border}`}}>{threads.length}</span></h2>
              <button onClick={() => setShowNewThreadModal(true)} style={{background: '#1e3a8a', color: '#facc15', padding: '10px 16px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px'}} disabled={posting}> + New Discussion </button>
            </div>
            <div style={{display: 'flex', gap: '8px', marginBottom: '16px'}}>
              <button className={`filter-tab ${filter==='active'?'active':''}`} onClick={()=>setFilter('active')}>Active ({threads.filter(t=>!t.isArchived).length})</button>
              <button className={`filter-tab ${filter==='mine'?'active':''}`} onClick={()=>setFilter('mine')}>My Posts</button>
              <button className={`filter-tab ${filter==='archived'?'active':''}`} onClick={()=>setFilter('archived')}><Archive size={12}/> Archived</button>
            </div>
            {loadingThreads? <p style={{textAlign: 'center', color: C.muted, fontSize: '13px'}}>Loading...</p> : (
              <div>
                {filteredThreads.length === 0 && <p style={{textAlign: 'center', color: C.muted, fontSize: '13px', padding: '20px'}}>{filter==='archived'?'No archived forums':'Wala pang discussions. Ikaw na mauna! 👇'}</p>}
                {filteredThreads.map(thread => (
                  <div key={thread.id} onClick={() => openThread(thread)} className={`thread-card ${thread.isArchived?'archived':''}`}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <p style={{fontSize: '11px', color: C.muted, margin: 0, display: 'flex', alignItems: 'center', gap: '4px'}}>👤 {thread.authorName} • {thread.createdAt?.toDate? thread.createdAt.toDate().toLocaleDateString() : 'now'} {thread.isArchived && <span style={{background: C.border, padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '700'}}>ARCHIVED</span>}</p>
                      {thread.authorId === user.uid && (
                        <div style={{display: 'flex', gap: '6px'}} onClick={e=>e.stopPropagation()}>
                          <button onClick={()=>handleArchive(thread,!thread.isArchived)} style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', color:C.text}}>
                            {thread.isArchived? <><ArchiveRestore size={12}/> Unarchive</> : <><Archive size={12}/> Archive</>}
                          </button>
                          <button onClick={()=>handleDeleteThread(thread.id)} style={{background: isDark? '#3a1f1f' : '#fef2f2', border: `1px solid ${isDark? '#5a2a2a' : '#fecaca'}`, borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '3px'}}><Trash2 size={12}/> Delete</button>
                        </div>
                      )}
                    </div>
                    <h3 style={{fontSize: '15px', fontWeight: '800', margin: '6px 0', color: C.text}}>{thread.title}</h3>
                    <p style={{fontSize: '13px', color: C.muted, margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{thread.body.length > 150? thread.body.substring(0,150)+'...' : thread.body}</p>
                    {thread.imageUrl && <img src={thread.imageUrl} style={{marginTop: '10px', borderRadius: '12px', maxHeight: '200px', width: '100%', objectFit: 'cover'}} alt="attachment" />}
                    <div style={{marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: C.muted}}><MessageSquare size={12}/> Comments</div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <button onClick={() => setSelectedThread(null)} style={{background: C.card2, color: C.text, padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontWeight: '700', fontSize: '12px'}}><ArrowLeft size={14}/> Back to Forum</button>
            <div style={{border: `2px solid #facc15`, borderRadius: '16px', padding: '16px', background: C.card2}}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <p style={{fontSize: '11px', color: '#facc15', margin: 0, fontWeight: '700'}}>👤 {selectedThread.authorName} {selectedThread.isArchived && '(ARCHIVED)'}</p>
                {selectedThread.authorId === user.uid && (
                  <div style={{display: 'flex', gap: '6px'}}>
                    <button onClick={()=>handleArchive(selectedThread,!selectedThread.isArchived)} style={{background: C.card, border: `1px solid ${C.border}`, borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', color:C.text}}>{selectedThread.isArchived? 'Unarchive' : 'Archive'}</button>
                    <button onClick={()=>handleDeleteThread(selectedThread.id)} style={{background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer'}}>Delete Forum</button>
                  </div>
                )}
              </div>
              <h3 style={{fontSize: '18px', fontWeight: '900', margin: '8px 0', color: C.text}}>{selectedThread.title}</h3>
              <p style={{fontSize: '14px', color: C.text, whiteSpace: 'pre-wrap', lineHeight: '1.6'}}>{selectedThread.body}</p>
              {selectedThread.imageUrl && <img src={selectedThread.imageUrl} style={{marginTop: '10px', borderRadius: '12px', maxHeight: '300px', width: '100%', objectFit: 'cover'}} alt="attachment" />}
            </div>
            <h3 style={{fontSize: '14px', marginTop: '20px', marginBottom: '12px', fontWeight: '800', color: C.text}}>Comments ({comments.filter(c => c.parentId === null).length})</h3>
            {comments.length === 0? <p style={{color: C.muted, fontSize: '13px'}}>No comments yet. Be the first!</p> : renderComments()}
            {!selectedThread.isArchived && (
              <div style={{display: 'flex', gap: '10px', marginTop: '16px', position: 'sticky', bottom: 0, background: C.card, padding: '10px 0', borderTop:`1px solid ${C.border}`}}>
                <input type="text" placeholder={replyingTo? "Write a reply..." : "Write a comment..."} value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePostComment()} style={{flex: 1, border: '1.5px solid #facc15', borderRadius: '12px', padding: '12px', fontSize: '13px', outline: 'none', background:C.card2, color:C.text}}/>
                <button onClick={handlePostComment} disabled={posting} style={{background: '#1e3a8a', color: '#facc15', padding: '12px 18px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'}}><Send size={16}/> {posting? '...' : 'Post'}</button>
              </div>
            )}
          </>
        )}
      </div>

      {showNewThreadModal && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'}} onClick={() => setShowNewThreadModal(false)}>
          <div style={{background: C.card, borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '600px', border:`1.5px solid ${C.border}`}} onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center'}}>
              <h3 style={{fontSize: '16px', fontWeight: '800', margin: 0, color: C.text}}>Start New Discussion</h3>
              <X size={20} onClick={() => setShowNewThreadModal(false)} style={{cursor: 'pointer', background: C.card2, borderRadius: '8px', padding: '4px', color:C.text}}/>
            </div>
            <input type="text" placeholder="Title" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} style={{width: '100%', border: `1.5px solid ${C.border}`, borderRadius: '12px', padding: '12px', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box', background:C.card2, color:C.text}}/>
            <textarea placeholder="Ano ang iyong naiisip?" value={newThreadBody} onChange={(e) => setNewThreadBody(e.target.value)} rows="5" style={{width: '100%', border: `1.5px solid ${C.border}`, borderRadius: '12px', padding: '12px', marginBottom: '12px', fontSize: '13px', boxSizing: 'border-box', resize: 'none', background:C.card2, color:C.text}}/>
            <input type="file" accept="image/*" onChange={(e) => setNewThreadFile(e.target.files[0])} style={{marginBottom: '16px', fontSize: '12px', color:C.muted}}/>
            <div style={{display: 'flex', gap: '12px', justifyContent: 'flex-end'}}>
              <button onClick={() => setShowNewThreadModal(false)} style={{padding: '10px 16px', border: `1px solid ${C.border}`, borderRadius: '12px', background: C.card2, cursor: 'pointer', fontSize: '13px', fontWeight: '700', color:C.text}}>Cancel</button>
              <button onClick={handlePostThread} disabled={posting} style={{background: '#1e3a8a', color: '#facc15', padding: '10px 18px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '13px'}}>{posting? 'Posting...' : 'Post Forum'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
const localStyles = { miniBtn: {background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700'} }
export default CommunityForum;