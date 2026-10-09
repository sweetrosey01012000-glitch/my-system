import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Calendar, Clock, User, IdCard, Eye, BadgeCheck, AlertCircle, Bell, Send, AlertTriangle } from 'lucide-react';
import { collection, query, orderBy, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const RecordsTab = ({ selectedRecordId }) => {
  const { userData } = useAuth();
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchRecord, setSearchRecord] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [staffBarangay, setStaffBarangay] = useState('All Barangays');
  const [notifying, setNotifying] = useState(false);
  const [notifyModal, setNotifyModal] = useState(null);

  // DARK SYNC BES!
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);
  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const assignedBarangay = userData?.assignedBarangay || userData?.barangay || 'All Barangays';
  const isAllBarangay =!assignedBarangay || assignedBarangay.toLowerCase().includes('all');

  useEffect(() => {
    const fetchStaffBarangay = async () => {
      try {
        const user = auth.currentUser; if (!user) { setStaffBarangay(assignedBarangay); return; }
        const staffDoc = await getDoc(doc(db, 'staff', user.uid));
        if (staffDoc.exists()) setStaffBarangay(staffDoc.data().assignedBarangay || assignedBarangay); else setStaffBarangay(assignedBarangay);
      } catch { setStaffBarangay(assignedBarangay); }
    };
    fetchStaffBarangay();
  }, [assignedBarangay]);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'soloparent'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      if (!isAllBarangay) {
        const myBrgy = assignedBarangay.toLowerCase();
        data = data.filter(r => { const brgyField = (r.barangay || '').toLowerCase(); const addrField = (r.address || '').toLowerCase(); return brgyField.includes(myBrgy) || addrField.includes(myBrgy) || myBrgy.includes(brgyField); });
      }
      setRecords(data); setFilteredRecords(data); setLoading(false);
    });
    return () => unsub();
  }, [assignedBarangay, isAllBarangay]);

  useEffect(() => { if (selectedRecordId && records.length > 0) { const record = records.find(r => r.id === selectedRecordId || r.uid === selectedRecordId); if (record) setSelectedRecord(record); } }, [selectedRecordId, records]);
  useEffect(() => { if (!searchRecord.trim()) setFilteredRecords(records); else { const s = searchRecord.toLowerCase(); setFilteredRecords(records.filter(r => r.name?.toLowerCase().includes(s) || r.idNumber?.toLowerCase().includes(s) || r.address?.toLowerCase().includes(s) || r.barangay?.toLowerCase().includes(s) )); } }, [searchRecord, records]);

  const getIdStatus = (validUntil) => {
    if (!validUntil) return { label: 'N/A', bg: C.card2, color: C.muted, border: C.border, daysLeft: 9999, isExpiring: false, isExpired: false };
    const expDate = new Date(validUntil); const now = new Date(); const diff = expDate - now; const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (now > expDate) return { label: 'Expired', bg: isDark? '#3a1f1f' : '#fee2e2', color: '#ef4444', border: isDark? '#5a2a2a' : '#fecaca', daysLeft, isExpiring: true, isExpired: true };
    if (daysLeft <= 30) return { label: `Expiring in ${daysLeft}d`, bg: isDark? '#332a0f' : '#fef3c7', color: '#facc15', border: isDark? '#5a4a1f' : '#fde68a', daysLeft, isExpiring: true, isExpired: false };
    return { label: 'Active', bg: isDark? '#14331f' : '#dcfce7', color: '#4ade80', border: isDark? '#1f5a2f' : '#86efac', daysLeft, isExpiring: false, isExpired: false };
  };
  const formatDate = (dateStr) => { if (!dateStr) return 'N/A'; const date = new Date(dateStr); return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };

  const handleNotifyExpiry = async (record) => {
    const status = getIdStatus(record.validUntil || record.expiryDate);
    if (!status.isExpiring) { setNotifyModal({ name: record.name, message: 'Active pa ID nya, no need notify', type: 'info' }); return; }
    setNotifying(true);
    try {
      await addDoc(collection(db, 'notifications'), { title: status.isExpired? '⚠️ Solo Parent ID Expired' : `⏰ ID Expiring in ${status.daysLeft} days`, message: status.isExpired? `Hi ${record.name}, expired na ang Solo Parent ID mo (${record.idNumber}) noong ${formatDate(record.validUntil)}. Pumunta na sa MSWDO ${assignedBarangay} para mag-renew.` : `Hi ${record.name}, mag-eexpire na ang Solo Parent ID mo (${record.idNumber}) sa ${formatDate(record.validUntil)} - ${status.daysLeft} days left. Mag-renew ka na sa MSWDO para tuloy benefits mo.`, for: record.id, forUserId: record.id, type: 'id_expiry', barangay: record.barangay, idNumber: record.idNumber, validUntil: record.validUntil, daysLeft: status.daysLeft, isRead: false, createdAt: serverTimestamp(), sentBy: userData?.name || 'Staff', sentByBarangay: assignedBarangay });
      await updateDoc(doc(db, 'soloparent', record.id), { lastExpiryNotifiedAt: serverTimestamp(), lastExpiryNotifiedBy: userData?.name || 'Staff', expiryNotifiedCount: (record.expiryNotifiedCount || 0) + 1 });
      setNotifyModal({ name: record.name, message: `Na-notify na si ${record.name} na ${status.isExpired? 'expired na ID nya' : `mag-eexpire na in ${status.daysLeft} days`} - makikita nya sa notifications nya at magre-renew na sya.`, type: 'success' }); setSelectedRecord(null);
    } catch (err) { setNotifyModal({ name: record.name, message: 'Error: ' + err.message, type: 'error' }); }
    setNotifying(false);
  };
  const handleNotifyAllExpiring = async () => {
    const expiring = filteredRecords.filter(r => getIdStatus(r.validUntil || r.expiryDate).isExpiring);
    if (expiring.length === 0) { setNotifyModal({ name: 'Info', message: 'Wala nang expiring sa barangay mo', type: 'info' }); return; }
    setNotifying(true);
    try {
      for (const record of expiring) { const status = getIdStatus(record.validUntil || record.expiryDate); await addDoc(collection(db, 'notifications'), { title: status.isExpired? '⚠️ Solo Parent ID Expired' : `⏰ ID Expiring in ${status.daysLeft} days`, message: `Hi ${record.name}, ${status.isExpired? `expired na ID mo noong ${formatDate(record.validUntil)}` : `mag-eexpire ID mo sa ${status.daysLeft} days (${formatDate(record.validUntil)})`}. Renew na sa MSWDO ${assignedBarangay}.`, for: record.id, forUserId: record.id, type: 'id_expiry', isRead: false, createdAt: serverTimestamp(), sentBy: userData?.name || 'Staff', }); }
      setNotifyModal({ name: `${expiring.length} Solo Parents`, message: `Na-notify lahat ng ${expiring.length} solo parents sa ${assignedBarangay} na mag-renew na! Makikita nila sa app nila.`, type: 'success' });
    } catch (err) { setNotifyModal({ name: 'Error', message: err.message, type: 'error' }); }
    setNotifying(false);
  };
  const expiringCount = filteredRecords.filter(r => getIdStatus(r.validUntil || r.expiryDate).isExpiring).length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', background:C.bg, transition:'0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
       .records-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; box-shadow: ${isDark?'0 2px 10px rgba(0,0,0,0.2)':'0 2px 10px rgba(0,0,0,0.03)'}; }
       .records-header { background: ${C.card}; padding: 14px 16px; border-bottom: 3px solid #FACC15; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
       .th-white { padding: 12px 14px; text-align: left; font-weight: 800; font-size: 11px; color: ${C.muted}; background: ${C.card}; border-bottom: 3px solid #FACC15; }
       .td-cell { padding: 11px 14px; font-size: 12.5px; border-bottom: 1px solid ${C.border}; color:${C.text}; }
       .row-hover { cursor: pointer; transition: all 0.15s; }
       .row-hover:hover { background: ${C.card2}!important; }
       .row-expiring { background: ${isDark?'#2a2210':'#fef9c3'}!important; border-left: 4px solid #f59e0b; }
       .row-expiring:hover { background: ${isDark?'#332a14':'#fef3c7'}!important; }
       .row-expired { background: ${isDark?'#2a1a1a':'#fee2e2'}!important; border-left: 4px solid #dc2626; }
       .row-expired:hover { background: ${isDark?'#3a2020':'#fecaca'}!important; }
       .search-inter { padding: 9px 14px 9px 34px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 12px; width: 260px; outline: none; background:${C.card2}; color:${C.text}; }
       .search-inter:focus { border-color: #FACC15!important; box-shadow: 0 0 0 3px rgba(250,204,21,0.2); }
       .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid ${C.border}; background: ${C.card2}; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
       .icon-btn.view { color: ${C.text}; border-color: ${C.border}; }.icon-btn.view:hover { background: #1E3A8A; color: #FACC15; }
       .icon-btn.notify { color: #facc15; border-color: ${C.border}; background: ${C.card2}; }.icon-btn.notify:hover { background: #f59e0b; color: white; }
      `}</style>

      <div className="records-wrapper">
        <div className="records-header">
          <h2 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ width: '32px', height: '32px', background: '#1E3A8A', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IdCard size={16} color="#FACC15" /></div>
            View Records
            <span style={{ background: C.card2, color: C.muted, fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', border: `1px solid ${C.border}`, display: 'flex', gap: '4px', alignItems: 'center' }}><MapPin size={10}/>{isAllBarangay? 'All Barangays' : assignedBarangay}</span>
            <span style={{ background: '#1E3A8A', color: '#FACC15', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>{filteredRecords.length} records</span>
            {expiringCount > 0 && <span style={{ background: '#dc2626', color: 'white', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', display: 'flex', gap: '4px', alignItems: 'center' }}><AlertTriangle size={11}/>{expiringCount} expiring/expired</span>}
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
              <input className="search-inter" placeholder="Search Name, ID..." value={searchRecord} onChange={e => setSearchRecord(e.target.value)} />
            </div>
            {expiringCount > 0 && (
              <button onClick={handleNotifyAllExpiring} disabled={notifying} style={{ padding: '9px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: notifying? 'not-allowed':'pointer', display: 'flex', gap: '5px', fontSize: '11px', alignItems: 'center' }}><Bell size={14}/>{notifying? 'Sending...' : `Notify All ${expiringCount}`}</button>
            )}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading? <p style={{ padding: '20px', fontSize: '12px', color: C.muted }}>Loading records for {staffBarangay}...</p> : filteredRecords.length === 0? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}><AlertCircle size={32} color={C.muted} style={{ margin: '0 auto 8px' }} /><p style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: C.text }}>No records found for {staffBarangay}</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
              <thead><tr><th className="th-white">ID NUMBER</th><th className="th-white">NAME</th><th className="th-white">BARANGAY</th><th className="th-white">VALID UNTIL</th><th className="th-white">ID STATUS</th><th className="th-white" style={{ textAlign: 'center' }}>ACTION</th></tr></thead>
              <tbody>
                {filteredRecords.map(record => {
                  const idStatus = getIdStatus(record.validUntil || record.expiryDate); const rowClass = idStatus.isExpired? 'row-expired' : idStatus.isExpiring? 'row-expiring' : 'row-hover';
                  return (
                    <tr key={record.id} className={rowClass} onClick={() => setSelectedRecord(record)} title={idStatus.isExpiring? 'Click to notify solo parent!' : 'Click to view'}>
                      <td className="td-cell" style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '11px', color: '#facc15' }}>{record.idNumber || 'N/A'}</td>
                      <td className="td-cell" style={{ fontWeight: '700', color: C.text, display: 'flex', gap: '6px', alignItems: 'center' }}>{idStatus.isExpiring && <AlertTriangle size={12} color={idStatus.isExpired? '#dc2626' : '#f59e0b'}/>} {record.name}</td>
                      <td className="td-cell"><span style={{ background: C.card2, border: `1px solid ${C.border}`, padding: '3px 8px', borderRadius: '20px', fontSize: '11px', display: 'inline-flex', gap: '3px', alignItems: 'center' }}><MapPin size={10}/>{record.barangay || record.address || 'N/A'}</span></td>
                      <td className="td-cell" style={{ fontSize: '11px', color: C.muted }}><span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}><Calendar size={11}/>{formatDate(record.validUntil || record.expiryDate)}</span></td>
                      <td className="td-cell"><span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', background: idStatus.bg, color: idStatus.color, border: `1px solid ${idStatus.border}`, display: 'inline-flex', gap: '4px', alignItems: 'center' }}>{idStatus.isExpiring && <Bell size={11}/>}{idStatus.label}</span></td>
                      <td className="td-cell"><div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}><button className="icon-btn view" onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }}><Eye size={14}/></button>{idStatus.isExpiring && <button className="icon-btn notify" onClick={(e) => { e.stopPropagation(); setSelectedRecord(record); }} title="Notify"><Bell size={14}/></button>}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedRecord(null)}>
          <div style={{ background: C.card, borderRadius: '16px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '2.5px solid #FACC15', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            {(() => { const status = getIdStatus(selectedRecord.validUntil || selectedRecord.expiryDate); return (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: status.isExpired? '#dc2626' : status.isExpiring? '#f59e0b' : '#1E3A8A', position: 'sticky', top: 0, zIndex: 1 }}>
                  <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '900', margin: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>{status.isExpiring? <><Bell size={16}/> {status.isExpired? 'EXPIRED ID' : `EXPIRING IN ${status.daysLeft} DAYS`}</> : <><BadgeCheck size={16} color="#FACC15"/> Solo Parent ID</>} • {selectedRecord.barangay || 'N/A'}</h3>
                  <button onClick={() => setSelectedRecord(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} color="white"/></button>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {status.isExpiring && (
                    <div style={{ background: status.isExpired? (isDark? '#2a1a1a' : '#fee2e2') : (isDark? '#2a2210' : '#fef3c7'), border: `1.5px solid ${status.border}`, borderRadius: '10px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ width: '36px', height: '36px', background: status.isExpired? '#dc2626' : '#f59e0b', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={18} color="white"/></div>
                      <div>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: status.color }}>{status.isExpired? `Expired na noong ${formatDate(selectedRecord.validUntil)}!` : `Mag-eexpire in ${status.daysLeft} days - ${formatDate(selectedRecord.validUntil)}`}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: C.muted }}>I-notify si solo parent para mag-renew sa MSWDO</p>
                      </div>
                    </div>
                  )}
                  {selectedRecord.profilePic && <div style={{ display: 'flex', justifyContent: 'center' }}><img src={selectedRecord.profilePic} alt="profile" style={{ width: '90px', height: '90px', borderRadius: '50%', border: '3px solid #FACC15', objectFit: 'cover' }} /></div>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { label: 'NAME', value: selectedRecord.name }, { label: 'ID NUMBER', value: selectedRecord.idNumber || 'N/A' },
                      { label: 'CONTACT', value: selectedRecord.contact || selectedRecord.phone || 'N/A' }, { label: 'BARANGAY', value: selectedRecord.barangay || 'N/A' },
                      { label: 'ISSUANCE DATE', value: formatDate(selectedRecord.issuanceDate) }, { label: 'VALID UNTIL', value: formatDate(selectedRecord.validUntil || selectedRecord.expiryDate) },
                    ].map((item, i) => (
                      <div key={i} style={{ background: C.card2, padding: '10px 12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                        <p style={{ margin: '0 0 3px 0', fontSize: '10px', color: C.muted, fontWeight: '800' }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', color: C.text }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setSelectedRecord(null)} style={{ flex: 1, background: C.card2, color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: '10px', padding: '11px', fontWeight: '700', cursor: 'pointer', fontSize: '12px' }}>Close</button>
                    {status.isExpiring? (
                      <button onClick={() => handleNotifyExpiry(selectedRecord)} disabled={notifying} style={{ flex: 2, background: status.isExpired? '#dc2626' : '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '800', cursor: notifying? 'not-allowed' : 'pointer', fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
                        <Send size={14}/>{notifying? 'Sending...' : status.isExpired? 'Notify Expired!' : `Notify - ${status.daysLeft} days left!`}
                      </button>
                    ) : (
                      <button onClick={() => setSelectedRecord(null)} style={{ flex: 1, background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '10px', padding: '11px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>Active pa ✓</button>
                    )}
                  </div>
                  {selectedRecord.lastExpiryNotifiedAt && <p style={{ margin: 0, fontSize: '10px', color: C.muted, textAlign: 'center' }}>Last notified: {selectedRecord.lastExpiryNotifiedAt?.toDate?.()?.toLocaleString('en-PH') || 'N/A'} • {selectedRecord.expiryNotifiedCount || 0}x notified</p>}
                </div>
              </>
            ); })()}
          </div>
        </div>
      )}

      {notifyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setNotifyModal(null)}>
          <div style={{ background: C.card, borderRadius: '16px', maxWidth: '380px', width: '100%', border: '2.5px solid #FACC15', overflow: 'hidden', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '20px 16px 12px 16px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: notifyModal.type === 'success'? (isDark? '#14331f' : '#dcfce7') : notifyModal.type === 'error'? (isDark? '#3a1f1f' : '#fee2e2') : (isDark? '#332a0f' : '#fef3c7'), display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                {notifyModal.type === 'success'? <Bell size={24} color="#4ade80"/> : notifyModal.type === 'error'? <X size={24} color="#ef4444"/> : <AlertCircle size={24} color="#facc15"/>}
              </div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: C.text }}>{notifyModal.type === 'success'? `${notifyModal.name} Notified!` : notifyModal.name}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: C.muted, lineHeight: '1.5' }}>{notifyModal.message}</p>
            </div>
            <div style={{ padding: '0 16px 16px 16px' }}>
              <button onClick={() => setNotifyModal(null)} style={{ width: '100%', padding: '11px', background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12px' }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RecordsTab;