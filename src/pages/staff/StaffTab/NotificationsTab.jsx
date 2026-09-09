import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Bell, CheckCircle } from 'lucide-react';

const styles = {
  container: { background: 'white', borderRadius: '16px', border: '2px solid #FACC15', padding: '24px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, color: '#1E3A8A', fontSize: '20px', fontFamily: "'Poppins', sans-serif" },
  notifItem: { display: 'flex', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A', background: '#FFFBEB', marginBottom: '12px', cursor: 'pointer', transition: '0.2s' },
  notifItemRead: { opacity: 0.6, background: '#F8FAFC' },
  iconBox: { padding: '10px', background: '#1E3A8A', borderRadius: '8px', color: '#FACC15', height: 'fit-content' },
  notifContent: { flex: 1 },
  notifTitle: { fontWeight: '800', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif", fontSize: '14px' },
  notifMessage: { color: '#64748B', fontSize: '13px', fontFamily: "'Inter', sans-serif", marginTop: '4px' },
  notifTime: { fontSize: '11px', color: '#94A3B8', marginTop: '6px' },
  unreadDot: { width: '8px', height: '8px', background: '#DC2626', borderRadius: '50%', marginTop: '6px' }
};

function NotificationsTab({ currentUser }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // REALTIME KUHA NG NOTIF PARA SA STAFF
  useEffect(() => {
    const q = query(
      collection(db, 'notifications'), 
      where('for', 'in', ['staff', 'all']), // staff or all
      orderBy('createdAt', 'desc')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id,...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // MARK AS READ PAG CLICK
  const handleMarkRead = async (id) => {
    await updateDoc(doc(db, 'notifications', id), { isRead: true });
  }

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading notifications...</div>;

  return (
    <div className="anim-fade-in" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Notifications</h2>
      </div>

      {notifications.length === 0? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748B'}}>
          <Bell size={32} style={{marginBottom: '10px', opacity: 0.5}} />
          <div>No notifications yet</div>
        </div> :
        notifications.map(notif => (
          <div 
            key={notif.id} 
            style={{...styles.notifItem,...(notif.isRead && styles.notifItemRead)}} 
            onClick={() => handleMarkRead(notif.id)}
          >
            <div style={styles.iconBox}>
              <Bell size={18} />
            </div>
            <div style={styles.notifContent}>
              <div style={styles.notifTitle}>{notif.title}</div>
              <div style={styles.notifMessage}>{notif.message}</div>
              <div style={styles.notifTime}>
                {notif.createdAt?.toDate().toLocaleString('en-PH', {dateStyle: 'medium', timeStyle: 'short'})}
              </div>
            </div>
            {!notif.isRead && <div style={styles.unreadDot}></div>}
          </div>
        ))
      }
    </div>
  );
}

export default NotificationsTab;