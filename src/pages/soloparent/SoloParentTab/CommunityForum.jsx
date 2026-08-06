import React, { useState, useEffect } from 'react';
import { db, storage } from '../../../firebase';
import {
  collection, addDoc, onSnapshot, orderBy, query, serverTimestamp, where, getDocs, deleteDoc, doc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Users, X, ArrowLeft, Send, Trash2, Reply as ReplyIcon } from 'lucide-react';

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
  const [expandedComments, setExpandedComments] = useState({}); // PARA SA SHOW/HIDE
  const [posting, setPosting] = useState(false);

  // FETCH THREADS
  useEffect(() => {
    const q = query(collection(db, 'forum_threads'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id,...doc.data() }));
      setThreads(data);
      setLoadingThreads(false);
    });
    return () => unsubscribe();
  }, []);

  // OPEN THREAD + FETCH COMMENTS
  const openThread = async (thread) => {
    setSelectedThread(thread);
    setExpandedComments({}); // reset pag bago thread
    const q = query(collection(db, 'forum_comments'), where("threadId", "==", thread.id), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    setComments(snap.docs.map(doc => ({id: doc.id,...doc.data()})));
  }

  // POST COMMENT OR REPLY
  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    await addDoc(collection(db, 'forum_comments'), {
      threadId: selectedThread.id,
      authorId: user.uid,
      authorName: userData.name,
      comment: newComment,
      parentId: replyingTo || null,
      createdAt: serverTimestamp()
    });
    setNewComment('');
    setReplyingTo(null);
    setPosting(false);
    openThread(selectedThread); // refresh
  }

  // DELETE COMMENT
  const handleDelete = async (commentId) => {
    if(!window.confirm("Delete this comment?")) return;
    await deleteDoc(doc(db, 'forum_comments', commentId));
    openThread(selectedThread);
  }

  // TOGGLE SHOW/HIDE REPLIES
  const toggleReplies = (commentId) => {
    setExpandedComments(prev => ({...prev, [commentId]:!prev[commentId]}));
  }

  // POST NEW THREAD
  const handlePostThread = async () => {
    if (!newThreadTitle.trim() ||!newThreadBody.trim()) return;
    setPosting(true);
    let fileUrl = '';
    if (newThreadFile) {
      const storageRef = ref(storage, `forum/${Date.now()}_${newThreadFile.name}`);
      const snap = await uploadBytes(storageRef, newThreadFile);
      fileUrl = await getDownloadURL(snap.ref);
    }
    await addDoc(collection(db, 'forum_threads'), {
      authorId: user.uid, authorName: userData.name, title: newThreadTitle,
      body: newThreadBody, imageUrl: fileUrl, createdAt: serverTimestamp()
    });
    await addDoc(collection(db, 'notifications'), {
      type: 'new_thread', title: 'New Discussion', body: `${userData.name}: ${newThreadTitle}`,
      createdAt: serverTimestamp(), read: false
    });
    setPosting(false);
    setShowNewThreadModal(false); setNewThreadTitle(''); setNewThreadBody(''); setNewThreadFile(null);
  };

  // RECURSIVE RENDER NG COMMENTS
  const renderComments = (parentId = null, level = 0) => {
    const filtered = comments.filter(c => c.parentId === parentId);
    if(filtered.length === 0) return null;

    return filtered.map(c => {
      const replyCount = comments.filter(x => x.parentId === c.id).length;
      const isExpanded = expandedComments[c.id];

      return (
        <div key={c.id} style={{marginLeft: level * 20}}>
          <div className="comment-box">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <p className="comment-author">{c.authorName}</p>
              <div style={{display: 'flex', gap: '10px'}}>
                <button style={styles.miniBtn} onClick={() => setReplyingTo(c.id)}><ReplyIcon size={14}/> Reply</button>
                {c.authorId === user.uid &&
                  <button style={{...styles.miniBtn, color: '#DC2626'}} onClick={() => handleDelete(c.id)}><Trash2 size={14}/> Delete</button>
                }
              </div>
            </div>
            <p style={{margin: '4px 0 0 0', whiteSpace: 'pre-wrap'}}>{c.comment}</p>

            {/* SHOW/HIDE REPLIES BUTTON */}
            {replyCount > 0 && (
              <button
                style={{background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '12px', marginTop: '8px', fontWeight: '500'}}
                onClick={() => toggleReplies(c.id)}
              >
                {isExpanded? '▲ Hide' : '▼ Show'} {replyCount} {replyCount > 1? 'replies' : 'reply'}
              </button>
            )}

            {replyingTo === c.id && (
              <div style={{display: 'flex', gap: '8px', marginTop: '8px'}}>
                <input
                  autoFocus
                  placeholder={`Replying to ${c.authorName}...`}
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handlePostComment()}
                  style={{flex: 1, padding: '6px', border: '1px solid #FACC15', borderRadius: '6px'}}/>
                <button className="btn-primary" style={{padding: '6px 12px'}} onClick={handlePostComment}>Send</button>
              </div>
            )}
          </div>

          {/* IRENDER LANG KUNG NAKA EXPAND */}
          {isExpanded && renderComments(c.id, level + 1)}
        </div>
      )
    })
  }

  return (
    <>
      <style>{`
      .community-container { background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; padding: 24px; font-family: system-ui; }
      .community-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
      .community-title { font-size: 20px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
      .btn-primary { background: #2563eb; color: white; padding: 10px 16px; border-radius: 8px; border: none; font-weight: 500; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px; }
      .btn-primary:hover { background: #1d4ed8; }
      .btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
      .btn-secondary { padding: 10px 16px; border: 1px solid #d1d5db; border-radius: 8px; background: white; cursor: pointer; font-size: 14px; }
      .btn-back { background: #f1f5f9; color: #1E3A8A; padding: 8px 12px; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; font-weight: 500; }
      .thread-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; cursor: pointer; margin-bottom: 16px; transition: background 0.2s; }
      .thread-card:hover { background: #f9fafb; }
      .thread-author { font-size: 12px; color: #6b7280; margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
      .thread-title { font-size: 18px; font-weight: 700; margin: 4px 0; color: #1E3A8A; }
      .thread-body { font-size: 14px; color: #4b5563; margin-top: 4px; white-space: pre-wrap; }
      .thread-img { margin-top: 8px; border-radius: 8px; max-height: 250px; width: 100%; object-fit: cover; }
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 16px; }
      .modal-box { background: white; border-radius: 12px; padding: 24px; width: 100%; max-width: 672px; }
      .modal-input,.modal-textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 12px; font-size: 14px; box-sizing: border-box; }
      .modal-actions { display: flex; gap: 12px; justify-content: flex-end; }
      .comment-box { background: #FFFBEB; padding: 12px; border-radius: 8px; margin-bottom: 10px; border: 1px solid #FEF3C7; }
      .comment-author { font-weight: 700; font-size: 13px; color: #1E3A8A; }
      .comment-input-wrap { display: flex; gap: 10px; margin-top: 16px; }
      .comment-input { flex: 1; border: 1px solid #FACC15; border-radius: 8px; padding: 10px; font-size: 14px; }
        @media (max-width: 768px) {
        .community-header { flex-direction: column; align-items: flex-start; gap: 12px; }
        .btn-primary { width: 100%; justify-content: center; }
        .comment-input-wrap { flex-direction: column; }
        }
      `}</style>

      <div className="community-container">
        {/* LIST VIEW */}
        {!selectedThread? (
          <>
            <div className="community-header">
              <h2 className="community-title"> <Users size={20} color="#2563eb" /> Community Forum </h2>
              <button onClick={() => setShowNewThreadModal(true)} className="btn-primary" disabled={posting}> + Start New Discussion </button>
            </div>

            {loadingThreads? <p>Loading...</p> : (
              <div>
                {threads.length === 0 && <p style={{textAlign: 'center', color: '#6b7280'}}>Wala pang discussions. Ikaw na mauna! 👇</p>}
                {threads.map(thread => (
                  <div key={thread.id} onClick={() => openThread(thread)} className="thread-card">
                    <p className="thread-author">👤 {thread.authorName}</p>
                    <h3 className="thread-title">{thread.title}</h3>
                    <p className="thread-body"> {thread.body.length > 150? thread.body.substring(0,150)+'...' : thread.body} </p>
                    {thread.imageUrl && <img src={thread.imageUrl} className="thread-img" alt="attachment" />}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* THREAD VIEW */
          <>
            <button className="btn-back" onClick={() => setSelectedThread(null)}>
              <ArrowLeft size={16}/> Back to Forum
            </button>

            <div className="thread-card" style={{cursor: 'default'}}>
              <p className="thread-author">👤 {selectedThread.authorName}</p>
              <h3 className="thread-title">{selectedThread.title}</h3>
              <p className="thread-body">{selectedThread.body}</p>
              {selectedThread.imageUrl && <img src={selectedThread.imageUrl} className="thread-img" alt="attachment" />}
            </div>

            <h3 style={{fontSize: '16px', marginTop: '24px', marginBottom: '12px'}}>Comments ({comments.filter(c => c.parentId === null).length})</h3>

            {comments.length === 0? <p style={{color: '#6b7280'}}>No comments yet. Be the first to comment!</p> : renderComments()}

            <div className="comment-input-wrap">
              <input
                type="text"
                className="comment-input"
                placeholder={replyingTo? "Write a reply..." : "Write a comment..."}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handlePostComment()}
              />
              <button className="btn-primary" onClick={handlePostComment} disabled={posting}>
                <Send size={16}/> {posting? 'Posting...' : 'Comment'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* MODAL FOR NEW THREAD */}
      {showNewThreadModal && (
        <div className="modal-overlay" onClick={() => setShowNewThreadModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
              <h3 className="thread-title">Start New Discussion</h3>
              <X size={20} onClick={() => setShowNewThreadModal(false)} style={{cursor: 'pointer'}}/>
            </div>
            <input type="text" placeholder="Title" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} className="modal-input"/>
            <textarea placeholder="Ano ang iyong naiisip?" value={newThreadBody} onChange={(e) => setNewThreadBody(e.target.value)} rows="5" className="modal-textarea"/>
            <input type="file" onChange={(e) => setNewThreadFile(e.target.files[0])} style={{marginBottom: '16px'}}/>
            <div className="modal-actions">
              <button onClick={() => setShowNewThreadModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={handlePostThread} className="btn-primary" disabled={posting}>{posting? 'Posting...' : 'Post'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  miniBtn: {background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500'}
}
export default CommunityForum;