import React from 'react';

function Announcements({ announcements, loadingAnnouncements, styles, setSelectedAnnouncement, selectedAnnouncement }) {
  
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    if (isNaN(date)) return 'No date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getEmoji = (title) => {
    const t = title?.toLowerCase() || '';
    if (t.includes('educ')) return '📚';
    if (t.includes('tesda') || t.includes('training')) return '🎓';
    if (t.includes('discount') || t.includes('pharmacy')) return '💊';
    if (t.includes('meeting') || t.includes('meetup')) return '📅';
    if (t.includes('system') || t.includes('down')) return '⚠️';
    return '📢';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '20px', color: '#1E3A8A', margin: '0', fontWeight: '800', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' }}>
          📢 Announcements
        </h2>
        <button style={{background: 'transparent', color: '#1E3A8A', border: '1px solid #1E3A8A', borderRadius: '8px', padding: '6px 12px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Inter', sans-serif"}} onClick={() => alert('View All Page - 2nd pic mo. Gagawa pa tayo ng separate page dito')} >
          View All →
        </button>
      </div>

      {/* CARD NG LIST */}
      <div style={{...styles.card, padding: '0', overflow: 'hidden'}}>
        {loadingAnnouncements ? (
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '13px', padding: '24px' }}>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#64748B' }}>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>📭</div>
            <p style={{ margin: 0, fontSize: '13px' }}>No announcements yet</p>
          </div>
        ) : (
          announcements.map((ann, index) => (
            <div key={ann.id} style={{ padding: '16px 20px', borderBottom: index !== announcements.length - 1 ? '1px solid #FEF3C7' : 'none' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '22px', flexShrink: 0 }}>{getEmoji(ann.title)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: '600', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    📅 {formatDate(ann.date || ann.createdAt)} • 👤 {ann.author || 'Admin'}
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#1E3A8A', lineHeight: '1.5', fontWeight: '800', fontFamily: "'Poppins', sans-serif" }}>
                    {ann.title}
                  </p>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', lineHeight: '1.5' }}>
                    {ann.content?.length > 120 ? ann.content.substring(0, 120) + '...' : ann.content}
                  </p>
                  <button style={{background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif"}} onClick={() => setSelectedAnnouncement(ann)} >
                    View Full Details →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL FOR FULL DETAILS */}
      {selectedAnnouncement && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'}} onClick={() => setSelectedAnnouncement(null)}>
          <div style={{background: 'white', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '2px solid #FACC15'}} onClick={(e) => e.stopPropagation()}>
            <h3 style={{color: '#1E3A8A', fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', fontFamily: "'Poppins', sans-serif"}}>{selectedAnnouncement.title}</h3>
            <p style={{color: '#64748B', fontSize: '12px', margin: '0 0 16px 0'}}>📅 {formatDate(selectedAnnouncement.date || selectedAnnouncement.createdAt)} • 👤 {selectedAnnouncement.author}</p>
            {selectedAnnouncement.imageUrl && <img src={selectedAnnouncement.imageUrl} alt="announcement" style={{width: '100%', borderRadius: '8px', marginBottom: '16px'}}/>}
            {selectedAnnouncement.videoUrl && <video src={selectedAnnouncement.videoUrl} controls style={{width: '100%', borderRadius: '8px', marginBottom: '16px'}}/>}
            <p style={{color: '#334155', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line'}}>{selectedAnnouncement.content}</p>
            <button style={{marginTop: '16px', background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '8px', padding: '10px 16px', fontWeight: '700', cursor: 'pointer'}} onClick={() => setSelectedAnnouncement(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Announcements;