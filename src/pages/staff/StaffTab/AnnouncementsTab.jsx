import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

// Yellow -> Blue Hover Button
const HoverButton = ({ children, onClick, style={}, type="primary", fullWidth=false }) => {
  const [isHover, setIsHover] = useState(false);
  const baseYellow = { background:'#FACC15', color:'#1E3A8A', border:'2px solid #FACC15' };
  const hoverBlue = { background:'#1E3A8A', color:'#FACC15', border:'2px solid #1E3A8A' };
  const baseBlue = { background:'#1E3A8A', color:'#FACC15', border:'2px solid #1E3A8A' };
  const hoverYellow = { background:'#FACC15', color:'#1E3A8A', border:'2px solid #FACC15' };
  const finalStyle = type==="primary" ? (isHover? hoverBlue : baseYellow) : (isHover? hoverYellow : baseBlue);
  return (
    <button onClick={onClick} onMouseEnter={()=>setIsHover(true)} onMouseLeave={()=>setIsHover(false)}
      style={{ padding:'10px 16px', borderRadius:'10px', fontWeight:'800', cursor:'pointer', fontSize:'13px', transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', width: fullWidth?'100%':'auto',...finalStyle,...style }}>
      {children}
    </button>
  );
};

const AnnouncementsTab = ({ styles }) => {
  const { userData } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({ title: '', details: '', category: 'General', file: null });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreateAnnouncement = async () => {
    if (!announceForm.title.trim() || !announceForm.details.trim()) { alert('Please fill out Title and Details'); return; }
    try {
      await addDoc(collection(db, 'announcements'), {
        title: announceForm.title, details: announceForm.details, category: announceForm.category, status: 'Pending',
        createdBy: userData?.name || 'Staff', createdAt: serverTimestamp()
      });
      setShowAnnounceModal(false);
      setAnnounceForm({ title: '', details: '', category: 'General', file: null });
      fetchAnnouncements();
      alert('Announcement sent to Admin for approval!');
    } catch (err) { console.error(err); alert('Error creating announcement'); }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = timestamp.toDate? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date)) return 'No date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const getEmoji = (title, category) => {
    const t = (title + category)?.toLowerCase() || '';
    if (t.includes('educ')) return '📚';
    if (t.includes('tesda') || t.includes('training')) return '🎓';
    if (t.includes('discount') || t.includes('pharmacy') || t.includes('subsidy')) return '💊';
    if (t.includes('meeting')) return '📅';
    if (t.includes('urgent') || t.includes('reminder')) return '⚠️';
    if (t.includes('distribution')) return '📦';
    return '📢';
  };
  const getStatusColor = (status) => {
    if (status === 'Approved') return { bg: '#dcfce7', color: '#166534' };
    if (status === 'Rejected') return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#fef9c3', color: '#713f12' };
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', color: '#1E3A8A', margin: '0', fontWeight: '800', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>📢 Announcements</h2>
        <HoverButton type="primary" onClick={() => setShowAnnounceModal(true)}><Plus size={16} /> Create</HoverButton>
      </div>

      <div style={{background:'white', border:'2px solid #FACC15', borderRadius:'12px', padding: '0', overflow: 'hidden'}}>
        {loading? (
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '24px' }}>Loading announcements...</p>
        ) : announcements.length === 0? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#64748B' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
            <p style={{ margin: 0, fontSize: '13px' }}>No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann, index) => {
            const statusStyle = getStatusColor(ann.status);
            return (
              <div key={ann.id} style={{ padding: '14px 16px', borderBottom: index!== announcements.length - 1? '1px solid #FEF3C7' : 'none', background:'white' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{getEmoji(ann.title, ann.category)}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <p style={{ margin: '0', fontSize: '11px', fontWeight: '600', color: '#64748B' }}>📅 {formatDate(ann.createdAt)}</p>
                      <span style={{ fontSize: '11px' }}>•</span>
                      <p style={{ margin: '0', fontSize: '11px', fontWeight: '600', color: '#64748B' }}>👤 {ann.createdBy || 'Staff'}</p>
                      <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', background: statusStyle.bg, color: statusStyle.color }}>{ann.status}</span>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1E3A8A', lineHeight: '1.5', fontWeight: '700', fontFamily: "'Poppins', sans-serif" }}>{ann.title}</p>
                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>{ann.details?.length > 120? ann.details.substring(0, 120) + '...' : ann.details}</p>
                    <HoverButton type="secondary" style={{padding:'6px 12px', fontSize:'12px'}} onClick={() => setSelectedAnnouncement(ann)}>View Details →</HoverButton>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {showAnnounceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: isMobile? '16px' : '20px' }} onClick={() => setShowAnnounceModal(false)}>
          <div style={{ background:'#FFFFFF', width: '100%', maxWidth: '500px', borderRadius: '16px', border:'3px solid #FACC15', display: 'flex', flexDirection: 'column', boxShadow:'0 20px 40px rgba(0,0,0,0.4)', overflow:'hidden' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:'16px 20px', background:'#FFFBEB', borderBottom:'3px solid #FACC15' }}>
              <h3 style={{ margin: '0', fontSize: '16px', fontWeight: '800', color: '#1E3A8A' }}>Create New Announcement</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#1E3A8A' }} onClick={() => setShowAnnounceModal(false)} />
            </div>
            <div style={{ padding:'20px', background:'white', display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', display: 'block', marginBottom: '6px' }}>Title</label>
                <input type="text" placeholder="e.g. Subsidy Distribution" value={announceForm.title} onChange={e => setAnnounceForm({...announceForm, title: e.target.value })} style={{ width: '100%', padding: '12px 14px', border: '2px solid #1E3A8A', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', color:'#1E3A8A', fontWeight:'600', background:'white', outline:'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', display: 'block', marginBottom: '6px' }}>Details</label>
                <textarea placeholder="Write announcement details here..." rows={4} value={announceForm.details} onChange={e => setAnnounceForm({...announceForm, details: e.target.value })} style={{ width: '100%', padding: '12px 14px', border: '2px solid #1E3A8A', borderRadius: '10px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', color:'#1E3A8A', background:'white', outline:'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '800', color: '#1E3A8A', display: 'block', marginBottom: '6px' }}>Category</label>
                <select value={announceForm.category} onChange={e => setAnnounceForm({...announceForm, category: e.target.value })} style={{ width: '100%', padding: '12px 14px', border: '2px solid #1E3A8A', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box', color:'#1E3A8A', fontWeight:'600', background:'white', outline:'none' }}>
                  <option value="General">General</option><option value="Event">Event</option><option value="Reminder">Reminder</option><option value="Urgent">Urgent</option><option value="Meeting">Meeting</option><option value="Distribution">Distribution</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', padding:'16px 20px', background:'#FFFBEB', borderTop:'2px solid #FEF3C7', justifyContent:'flex-end' }}>
              <HoverButton type="primary" onClick={() => setShowAnnounceModal(false)}>Cancel</HoverButton>
              <HoverButton type="secondary" onClick={handleCreateAnnouncement}>Send to Admin</HoverButton>
            </div>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}} onClick={() => setSelectedAnnouncement(null)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '0', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '3px solid #FACC15', boxShadow:'0 20px 40px rgba(0,0,0,0.4)', overflow:'hidden'}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding:'14px 20px', background:'#FFFBEB', borderBottom:'3px solid #FACC15' }}>
              <h3 style={{color: '#1E3A8A', fontSize: '16px', fontWeight: '800', margin: '0', fontFamily: "'Poppins', sans-serif"}}>{selectedAnnouncement.title}</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#1E3A8A' }} onClick={() => setSelectedAnnouncement(null)} />
            </div>
            <div style={{padding:'20px', background:'white'}}>
              <p style={{color: '#64748B', fontSize: '11px', margin: '0 0 12px 0', fontWeight:'600'}}>📅 {formatDate(selectedAnnouncement.createdAt)} • 👤 {selectedAnnouncement.createdBy}</p>
              {selectedAnnouncement.imageUrl && <img src={selectedAnnouncement.imageUrl} alt="announcement" style={{width: '100%', borderRadius: '10px', marginBottom: '12px', border: '2px solid #FEF3C7'}}/>}
              <p style={{color: '#1E3A8A', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-line', fontWeight:'500'}}>{selectedAnnouncement.details}</p>
              <HoverButton type="secondary" fullWidth style={{marginTop:'16px'}} onClick={() => setSelectedAnnouncement(null)}>Close</HoverButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AnnouncementsTab;