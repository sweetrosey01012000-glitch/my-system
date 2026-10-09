import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Megaphone, CalendarDays, UserCircle, Image as ImageIcon, Video, X, Clock, ChevronRight, BadgeCheck, ChevronDown } from 'lucide-react';

function Announcements({ styles, setSelectedAnnouncement, selectedAnnouncement }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);
  const [showAll, setShowAll] = useState(false);

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
    const q = query(collection(db, 'announcements'), where("status", "==", "Published"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a,b) => {
        const aTime = a.publishedAt?.seconds || a.createdAt?.seconds || 0;
        const bTime = b.publishedAt?.seconds || b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
      setAnnouncements(data); setLoadingAnnouncements(false);
    }, (error) => { console.error("Error:", error); setLoadingAnnouncements(false); });
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date(); const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'Just now'; if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`; if (diff < 10080) return `${Math.floor(diff/1440)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' • ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };
  const formatFullDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const visibleAnnouncements = showAll ? announcements : announcements.slice(0, 10);
  const remainingCount = announcements.length - 10;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '700px', margin: '0 auto', fontFamily: "'Inter', sans-serif", background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: '#1E3A8A', padding: '8px', borderRadius: '12px' }}><Megaphone size={20} color="#FACC15" /></div>
        <h2 style={{ fontSize: '20px', color: C.text, margin: 0, fontWeight: '800' }}>Announcements</h2>
        <span style={{ background: C.card2, color: C.muted, fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', border: `1px solid ${C.border}` }}>{announcements.length} total</span>
      </div>

      {loadingAnnouncements ? (
        <div style={{ background: C.card, padding: '24px', textAlign: 'center', borderRadius: '16px', border: `1px solid ${C.border}` }}>
          <p style={{ color: C.muted, fontSize: '13px' }}>Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ background: C.card, padding: '40px 20px', textAlign: 'center', borderRadius: '16px', border: `1px solid ${C.border}` }}>
          <Megaphone size={40} color={C.muted} style={{ margin: '0 auto 10px' }} />
          <p style={{ margin: 0, fontSize: '14px', color: C.text, fontWeight: '600' }}>No published announcements yet</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: C.muted }}>Stay tuned for updates from MSWDO</p>
        </div>
      ) : (
        <>
          {visibleAnnouncements.map((ann) => (
            <div key={ann.id} style={{ background: C.card, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: isDark? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)' }}>
              {/* HEADER */}
              <div style={{ padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><UserCircle size={22} color="#FACC15" /></div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', fontWeight: '800', color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.createdBy || ann.authorName || 'MSWDO Naic Admin'}</p>
                    <BadgeCheck size={14} color="#3B82F6" style={{ flexShrink: 0 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <Clock size={11} color={C.muted} /><p style={{ margin: 0, fontSize: '11px', color: C.muted }}>{formatDate(ann.publishedAt || ann.createdAt)}</p>
                    <span style={{ width: '3px', height: '3px', background: C.border, borderRadius: '50%', display: 'inline-block' }}></span>
                    <p style={{ margin: 0, fontSize: '11px', color: C.muted }}>Public</p>
                  </div>
                </div>
              </div>

              {/* TITLE */}
              <div style={{ padding: '0 16px 10px 16px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '900', color: C.text, lineHeight: '1.3', letterSpacing: '-0.2px' }}>{ann.title}</h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: C.muted, lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {ann.details?.length > 180 ? ann.details.substring(0, 180) + '... ' : ann.details}
                  {ann.details?.length > 180 && <span style={{ color: '#facc15', fontWeight: '700', cursor: 'pointer' }} onClick={() => setSelectedAnnouncement(ann)}>See more</span>}
                </p>
              </div>

              {ann.imageUrl && (
                <div style={{ width: '100%', background: C.card2, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  <img src={ann.imageUrl} alt="announcement" style={{ width: '100%', maxHeight: '380px', objectFit: 'cover', cursor: 'pointer', display: 'block' }} onClick={() => setSelectedAnnouncement(ann)} />
                </div>
              )}
              {ann.videoUrl && (
                <div style={{ width: '100%', background: 'black', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
                  <video src={ann.videoUrl} controls style={{ width: '100%', maxHeight: '400px', display: 'block' }} />
                </div>
              )}

              <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: C.muted, fontSize: '11px' }}><CalendarDays size={13} /><span>{formatFullDate(ann.publishedAt || ann.createdAt)}</span></div>
                <button onClick={() => setSelectedAnnouncement(ann)} style={{ background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '20px', padding: '7px 14px', fontSize: '11.5px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>View Details <ChevronRight size={14} /></button>
              </div>
            </div>
          ))}

          {announcements.length > 10 && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              {!showAll ? (
                <button onClick={() => setShowAll(true)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '12px 20px', fontSize: '13px', fontWeight: '700', color: C.text, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: isDark? '0 1px 3px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.05)' }}><ChevronDown size={16} /> View {remainingCount} more announcements</button>
              ) : (
                <button onClick={() => setShowAll(false)} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '10px 18px', fontSize: '12.5px', fontWeight: '700', color: C.muted, cursor: 'pointer' }}>Show less</button>
              )}
            </div>
          )}
        </>
      )}

      {selectedAnnouncement && (
        <div style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}} onClick={() => setSelectedAnnouncement(null)}>
          <div style={{background: C.card, borderRadius: '16px', maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)'}} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, background: C.card, zIndex: 1, borderRadius: '16px 16px 0 0' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserCircle size={20} color="#FACC15" /></div>
                <div><p style={{ margin: 0, fontWeight: '800', fontSize: '13px', color: C.text }}>{selectedAnnouncement.createdBy || selectedAnnouncement.authorName || 'MSWDO Admin'}</p><p style={{ margin: 0, fontSize: '11px', color: C.muted }}>{formatFullDate(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt)}</p></div>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} style={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: '10px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16} color={C.text} /></button>
            </div>
            <div style={{ padding: '18px 16px' }}>
              <h2 style={{ margin: '0 0 12px 0', fontSize: '19px', fontWeight: '900', color: C.text, lineHeight: '1.3' }}>{selectedAnnouncement.title}</h2>
              <p style={{ margin: 0, fontSize: '14px', color: C.muted, lineHeight: '1.7', whiteSpace: 'pre-line' }}>{selectedAnnouncement.details}</p>
            </div>
            {selectedAnnouncement.imageUrl && <img src={selectedAnnouncement.imageUrl} style={{ width: '100%', display: 'block' }} alt="detail" />}
            {selectedAnnouncement.videoUrl && <video src={selectedAnnouncement.videoUrl} controls style={{ width: '100%', display: 'block' }} />}
            <div style={{ padding: '16px', borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => setSelectedAnnouncement(null)} style={{ width: '100%', background: '#1e3a8a', color: '#facc15', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default Announcements;