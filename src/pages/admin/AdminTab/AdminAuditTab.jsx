import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { ShieldCheck, User, Clock, FileText } from 'lucide-react';

const styles = {
  container: { background: 'white', borderRadius: '16px', border: '2px solid #FACC15', padding: '24px', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { margin: 0, color: '#1E3A8A', fontSize: '20px', fontFamily: "'Poppins', sans-serif" },
  logItem: { display: 'flex', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A', background: '#FFFBEB', marginBottom: '12px' },
  iconBox: { padding: '10px', background: '#1E3A8A', borderRadius: '8px', color: '#FACC15', height: 'fit-content' },
  logContent: { flex: 1 },
  logAction: { fontWeight: '800', color: '#1E3A8A', fontFamily: "'Poppins', sans-serif", fontSize: '14px' },
  logDetails: { color: '#64748B', fontSize: '13px', fontFamily: "'Inter', sans-serif", marginTop: '4px' },
  logMeta: { fontSize: '11px', color: '#94A3B8', marginTop: '6px' }
};

export default function AdminAuditTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) return <div style={{textAlign: 'center', padding: '40px'}}>Loading logs...</div>;

  return (
    <div className="anim-fade-in" style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Audit Logs</h2>
      </div>

      {logs.length === 0 ? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748B'}}>No activity yet</div> :
        logs.map(log => (
          <div key={log.id} style={styles.logItem}>
            <div style={styles.iconBox}>
              <ShieldCheck size={18} />
            </div>
            <div style={styles.logContent}>
              <div style={styles.logAction}>{log.action}</div>
              <div style={styles.logDetails}>{log.details}</div>
              <div style={styles.logMeta}>
                By: {log.performedBy} • {log.timestamp?.toDate().toLocaleString()}
              </div>
            </div>
          </div>
        ))
      }
    </div>
  );
}