import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { CheckCircle, XCircle, Eye, Clock, Send, Download, FileText } from 'lucide-react';
import jsPDF from "jspdf";
import "jspdf-autotable";

const styles = {
  card: { background: 'white', borderRadius: '16px', padding: '24px', border: '2px solid #FACC15', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.1)' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  cardTitle: { margin: 0, color: '#1E3A8A', fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: "'Poppins', sans-serif" },
  exportBtn: { padding: '8px 14px', background: '#1E3A8A', color: '#FACC15', border: '2px solid #1E3A8A', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '2px solid #FEF3C7' },
  tab: (active) => ({ padding: '10px 16px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: active ? '800' : '600', color: active ? '#1E3A8A' : '#64748B', borderBottom: active ? '3px solid #FACC15' : '3px solid transparent', fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', gap: '6px' }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #FACC15', color: '#1E3A8A', fontWeight: '700', fontFamily: "'Poppins', sans-serif", fontSize: '13px' },
  td: { padding: '12px', borderBottom: '1px solid #FEF3C7', fontSize: '14px', color: '#334155', fontFamily: "'Inter', sans-serif" },
  badge: (status) => ({ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', background: status.toLowerCase() === 'pending' ? '#FEF3C7' : status.toLowerCase() === 'published' ? '#DCFCE7' : '#FEE2E2', color: status.toLowerCase() === 'pending' ? '#92400E' : status.toLowerCase() === 'published' ? '#166534' : '#991B1B' }),
  actionBtn: { padding: '6px 12px', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' },
  approveBtn: { background: '#16A34A', color: 'white' },
  rejectBtn: { background: '#DC2626', color: 'white' },
  viewBtn: { background: '#1E3A8A', color: '#FACC15' },
};

function AdminContentTab({ showToast }) {
  const [activeTab, setActiveTab] = useState('Pending');
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleDateString('en-PH');
    return new Date(date).toLocaleDateString('en-PH');
  };

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setContents(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredContents = contents.filter(c => c.status === activeTab);

  const exportCSV = () => {
    const headers = ['Title', 'Author', 'Category', 'Date', 'Status'];
    const rows = filteredContents.map(c => [
      `"${c.title}"`,
      `"${c.createdBy || 'Unknown'}"`,
      `"${c.category || 'General'}"`,
      `"${formatDate(c.createdAt)}"`,
      `"${c.status}"`
    ]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Content-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported to CSV');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 138);
    doc.text(`MSWD Content Report - ${activeTab.toUpperCase()}`, 14, 20);
    doc.autoTable({
      startY: 30,
      head: [['Title', 'Author', 'Category', 'Date', 'Status']],
      body: filteredContents.map(c => [
        c.title,
        c.createdBy || 'Unknown',
        c.category || 'General',
        formatDate(c.createdAt),
        c.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    });
    doc.save(`Content-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
    showToast('Exported to PDF');
  };

  // FIXED APPROVE WITH PROPER NOTIF
  const handleApprove = async (item) => {
    try {
      // 1. Update to Published
      await updateDoc(doc(db, 'announcements', item.id), {
        status: 'Published',
        publishedAt: serverTimestamp()
      });

      // 2. CREATE NOTIF NA KAYA I-CLICK PUNTA SA ANNOUNCEMENT PAGE
      await addDoc(collection(db, 'notifications'), {
        title: "New Announcement",
        message: item.title, // ITO YUNG IPAPAKITA SA NOTIF
        type: 'announcement', // IMPORTANT: PARA MA DETECT SA SOLOPARENT
        target: 'all_soloparents',
        forAll: true,
        announcementId: item.id, // ITO YUNG ID PARA MA-OPEN
        category: item.category || 'General',
        createdAt: serverTimestamp(),
        read: false
      });

      // 3. AUDIT LOG
      await addDoc(collection(db, 'auditLogs'), {
        action: `Published Announcement: ${item.title}`,
        user: 'Admin',
        timestamp: serverTimestamp()
      });

      showToast(`Approved & Notified: ${item.title}`);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleReject = async (item) => {
    const reason = prompt('Reason for rejection:');
    if (reason) {
      await updateDoc(doc(db, 'announcements', item.id), {
        status: 'Rejected',
        rejectionReason: reason
      });
      showToast(`Rejected: ${item.title}`);
    }
  };

  return (
    <div className="anim-fade-in">
      <div style={styles.card}>
        <div style={styles.headerRow}>
          <h3 style={styles.cardTitle}><Send size={20} /> Content Approval Center</h3>
          <div style={{display: 'flex', gap: '8px'}}>
            <button style={styles.exportBtn} onClick={exportCSV}><Download size={14} /> Export CSV</button>
            <button style={styles.exportBtn} onClick={exportPDF}><FileText size={14} /> Export PDF</button>
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={styles.tab(activeTab === 'Pending')} onClick={() => setActiveTab('Pending')}>
            <Clock size={14} /> For Approval ({contents.filter(c => c.status === 'Pending').length})
          </button>
          <button style={styles.tab(activeTab === 'Published')} onClick={() => setActiveTab('Published')}>Published ({contents.filter(c => c.status === 'Published').length})</button>
          <button style={styles.tab(activeTab === 'Rejected')} onClick={() => setActiveTab('Rejected')}>Rejected ({contents.filter(c => c.status === 'Rejected').length})</button>
        </div>

        {loading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading...</p> : filteredContents.length === 0 ? <p style={{textAlign: 'center', padding: '20px', color: '#64748B'}}>No content in this tab</p> : (
          <div style={{overflowX: 'auto'}}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Author</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}>{item.title}</td>
                    <td style={styles.td}>{item.createdBy || 'Unknown'}</td>
                    <td style={styles.td}>{item.category || 'General'}</td>
                    <td style={styles.td}>{formatDate(item.createdAt)}</td>
                    <td style={styles.td}><span style={styles.badge(item.status)}>{item.status}</span></td>
                    <td style={styles.td}>
                      {item.status === 'Pending' && (
                        <div style={{display: 'flex', gap: '8px', marginBottom: '6px'}}>
                          <button style={{...styles.actionBtn, ...styles.approveBtn}} onClick={() => handleApprove(item)}><CheckCircle size={14} /> Approve</button>
                          <button style={{...styles.actionBtn, ...styles.rejectBtn}} onClick={() => handleReject(item)}><XCircle size={14} /> Reject</button>
                        </div>
                      )}
                      <button style={{...styles.actionBtn, ...styles.viewBtn}}><Eye size={14} /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminContentTab;