import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Megaphone, ArrowLeft, Plus, Edit2, Trash2, Calendar, User } from 'lucide-react';

function AnnouncementsPage() {
  const navigate = useNavigate();
  const { userRole, userData } = useAuth();
  const canManage = ['admin', 'staff'].includes(userRole);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', category: 'General Info', content: '' });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const q = query(collection(db, 'announcements'), orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((document) => { data.push({ id: document.id, ...document.data() }); });
      setAnnouncements(data);
    } catch (error) { console.error('Error fetching announcements:', error); } 
    finally { setLoading(false); }
  };

  const handleOpenModal = (announcement = null) => {
    if (announcement) {
      setEditingId(announcement.id);
      setFormData({ title: announcement.title, category: announcement.category, content: announcement.content });
    } else {
      setEditingId(null);
      setFormData({ title: '', category: 'General Info', content: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title, category: formData.category, content: formData.content,
        author: userData?.name || 'MSWD Staff',
        date: editingId ? announcements.find(a => a.id === editingId).date : new Date().toISOString()
      };
      if (editingId) { await updateDoc(doc(db, 'announcements', editingId), payload); alert('Updated!'); } 
      else { await addDoc(collection(db, 'announcements'), payload); alert('Posted!'); }
      setShowModal(false); fetchAnnouncements();
    } catch (error) { alert('Failed to save. ' + error.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try { await deleteDoc(doc(db, 'announcements', id)); alert('Deleted.'); fetchAnnouncements(); } 
    catch (error) { alert('Failed to delete. ' + error.message); }
  };

  const formatDate = (isoString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString('en-PH', options);
  };

  const styles = {
    body: { fontFamily: "'Inter', Arial, sans-serif", background: '#f8fafc', minHeight: '100vh', padding: '40px 20px' },
    container: { maxWidth: '800px', width: '100%', margin: '0 auto' },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    titleWrap: { display: 'flex', alignItems: 'center', gap: '10px' },
    title: { color: '#1e40af', fontSize: '28px', fontWeight: '800', margin: 0 }, // Mas maliit
    backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#e2e8f0', color: '#334155', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    createBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#1e40af', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
    
    // COMPACT CARD STYLE - GAYA SA PIC MO
    card: { background: 'white', borderRadius: '10px', padding: '18px 20px', marginBottom: '12px', border: '1px solid #e2e8f0' },
    cardTop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' },
    dot: { width: '10px', height: '10px', backgroundColor: '#3B82F6', borderRadius: '50%' }, // Yung blue dot
    meta: { fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' },
    cardTitle: { margin: '6px 0 4px 0', color: '#1e40af', fontSize: '17px', fontWeight: '700' }, // Mas maliit
    content: { color: '#475569', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap', margin: 0 },
    
    adminControls: { display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
    editBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: '#2563eb', padding: '6px 10px', border: '1px solid #dbeafe', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
    deleteBtn: { display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', color: '#dc2626', padding: '6px 10px', border: '1px solid #fee2e2', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' },
    
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' },
    modalContent: { background: 'white', width: '100%', maxWidth: '600px', borderRadius: '12px', padding: '24px' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', marginBottom: '6px', fontWeight: '600', color: '#1e3a8a', fontSize: '14px' },
    input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px' },
    textarea: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '14px', minHeight: '120px', resize: 'vertical' },
    modalBtnGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' },
    submitBtn: { background: '#1e40af', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    cancelBtn: { background: '#e2e8f0', color: '#475569', padding: '10px 18px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
  };

  if(loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading...</div>

  return (
    <div style={styles.body} className="anim-fade-in">
      <div style={styles.container}>
        
        {/* HEADER WITH BACK BUTTON */}
        <div style={styles.headerRow}>
          <button style={styles.backBtn} onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back
          </button>
          {canManage && (
            <button style={styles.createBtn} onClick={() => handleOpenModal()}>
              <Plus size={16} /> Create
            </button>
          )}
        </div>

        <div style={styles.titleWrap}>
          <Megaphone size={28} color="#1e40af" />
          <h2 style={styles.title}>Announcements</h2>
        </div>

        {announcements.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px', background: 'white', borderRadius: '10px'}}>No announcements yet.</div>
        ) : (
          announcements.map((post) => (
            <div key={post.id} style={styles.card} className="anim-slide-up">
              
              <div style={styles.cardTop}>
                <div style={styles.dot}></div> {/* BLUE DOT */}
                <span style={styles.meta}>
                  <Calendar size={12} /> {formatDate(post.date)} • <User size={12} /> {post.author}
                </span>
              </div>

              <h3 style={styles.cardTitle}>{post.title}</h3>
              <p style={styles.content}>{post.content}</p>

              {canManage && (
                <div style={styles.adminControls}>
                  <button style={styles.editBtn} onClick={() => handleOpenModal(post)}>
                    <Edit2 size={12} /> Edit
                  </button>
                  <button style={styles.deleteBtn} onClick={() => handleDelete(post.id)}>
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* MODAL SAME LANG */}
      {showModal && canManage && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="anim-slide-up">
            <h3 style={{ margin: '0 0 20px 0', color: '#1e40af' }}>{editingId ? 'Edit' : 'Create'} Announcement</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Title</label>
                <input style={styles.input} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                  <option>General Info</option><option>Event</option><option>Livelihood Program</option><option>Urgent</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Content</label>
                <textarea style={styles.textarea} value={formData.content} onChange={(e) => setFormData({...formData, content: e.target.value})} required></textarea>
              </div>
              <div style={styles.modalBtnGroup}>
                <button type="button" style={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnnouncementsPage;