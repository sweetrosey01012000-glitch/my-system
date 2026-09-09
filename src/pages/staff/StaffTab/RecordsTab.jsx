import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';

const RecordsTab = ({ styles, selectedRecordId }) => { // 1. TANGGAPIN NATIN YUNG PROP
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchRecord, setSearchRecord] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      console.log("Fetching soloparent...");
      const q = query(collection(db, 'soloparent'), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      console.log("Found:", snap.size, "soloparents");
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setRecords(data);
      setFilteredRecords(data);
    } catch (err) {
      console.error("Firebase Error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 2. DAGDAG: AUTO OPEN PAG GALING SA HEADER MESSAGE
  useEffect(() => {
    if(selectedRecordId && records.length > 0){
      // Hanapin natin yung record. Check natin both id and uid
      const record = records.find(r => r.id === selectedRecordId || r.uid === selectedRecordId);
      if(record){
        setSelectedRecord(record); // AUTO OPEN MODAL
        setSearchRecord(''); // Clear search para makita
      }
    }
  }, [selectedRecordId, records]);

  useEffect(() => {
    if(!searchRecord.trim()){
      setFilteredRecords(records);
    } else {
      const search = searchRecord.toLowerCase();
      setFilteredRecords(records.filter(r => 
        r.name?.toLowerCase().includes(search) || 
        r.idNumber?.toLowerCase().includes(search) || 
        r.address?.toLowerCase().includes(search)
      ));
    }
  }, [searchRecord, records]);

  const getIdStatus = (validUntil) => {
    if(!validUntil) return { label: 'N/A', bg: '#f1f5f9', color: '#475569' };
    const expDate = new Date(validUntil);
    const now = new Date();
    if(now > expDate){
      return { label: 'Expired', bg: '#fee2e2', color: '#991b1b' };
    }
    const daysLeft = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    if(daysLeft <= 30) return { label: 'Expiring Soon', bg: '#fef3c7', color: '#92400e' };
    return { label: 'Active', bg: '#dcfce7', color: '#166534' };
  }

  const formatDate = (dateStr) => {
    if(!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if(loading) return <p style={{ fontSize: '13px' }}>Loading records...</p>;

  return (
    <div>
      <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1E3A8A', margin: 0 }}>View Records</h2>
      <p style={{ color: '#475569', marginTop: '4px', marginBottom: '20px', fontSize: '13px' }}>{filteredRecords.length} registered solo parents</p>

      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" placeholder="Search by Name, ID Number, or Address..." value={searchRecord} onChange={(e) => setSearchRecord(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 32px', border: '1.5px solid #FACC15', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
      </div>

      {!isMobile && filteredRecords.length > 0 && (
        <div style={{...styles.card, padding: 0, overflowX: 'auto'}}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
            <thead style={{ background: '#FEF3C7' }}>
              <tr style={{ borderBottom: '1.5px solid #FACC15', textAlign: 'left', color: '#1E3A8A', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>ID Number</th>
                <th style={{ padding: '12px 16px' }}>Name</th>
                <th style={{ padding: '12px 16px' }}>Address</th>
                <th style={{ padding: '12px 16px' }}>Issuance Date</th>
                <th style={{ padding: '12px 16px' }}>Valid Until</th>
                <th style={{ padding: '12px 16px' }}>ID Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => {
                const idStatus = getIdStatus(record.validUntil || record.expiryDate);
                return (
                  <tr key={record.id} onClick={() => setSelectedRecord(record)} style={{ borderBottom: '1px solid #FEF3C7', cursor: 'pointer' }}>
                    <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', fontWeight: '600' }}>{record.idNumber || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '600' }}>{record.name || 'No Name'}</td>
                    <td style={{ padding: '12px 16px' }}>{record.address || 'N/A'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{formatDate(record.issuanceDate)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '12px' }}>{formatDate(record.validUntil || record.expiryDate)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: idStatus.bg, color: idStatus.color, border: '1px solid #FACC15' }}>{idStatus.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isMobile && filteredRecords.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredRecords.map(record => {
            const idStatus = getIdStatus(record.validUntil || record.expiryDate);
            return (
              <div key={record.id} onClick={() => setSelectedRecord(record)} style={{...styles.card, padding: '14px', cursor: 'pointer'}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1E3A8A' }}>{record.name}</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748b' }}>ID: {record.idNumber}</p>
                  </div>
                  <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: idStatus.bg, color: idStatus.color, border: '1px solid #FACC15' }}>{idStatus.label}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  <p style={{ margin: '0 0 4px 0' }}><b>Address:</b> {record.address}</p>
                  <p style={{ margin: 0 }}><b>Valid Until:</b> {formatDate(record.validUntil)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selectedRecord && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'}} onClick={() => setSelectedRecord(null)}>
          <div style={{background: 'white', borderRadius: '12px', padding: '20px', maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1.5px solid #FACC15'}} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <h3 style={{color: '#1E3A8A', fontSize: '16px', fontWeight: '700', margin: '0'}}>Solo Parent ID</h3>
              <X size={20} style={{ cursor: 'pointer', color: '#1E3A8A' }} onClick={() => setSelectedRecord(null)} />
            </div>
            {selectedRecord.profilePic && <img src={selectedRecord.profilePic} alt="profile" style={{width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px', border: '2px solid #FACC15'}}/>}
            <div style={{ fontSize: '13px' }}>
              <p><b>Name:</b> {selectedRecord.name}</p>
              <p><b>ID Number:</b> {selectedRecord.idNumber}</p>
              <p><b>Email:</b> {selectedRecord.email}</p>
              <p><b>Contact:</b> {selectedRecord.contact}</p>
              <p><b>Address:</b> {selectedRecord.address}</p>
              <p><b>Birthdate:</b> {selectedRecord.birthDate}</p>
              <p><b>Issuance Date:</b> {formatDate(selectedRecord.issuanceDate)}</p>
              <p><b>Valid Until:</b> {formatDate(selectedRecord.validUntil)}</p>
              <p><b>Mayor:</b> {selectedRecord.mayorName}</p>
              <p><b>MSWDO:</b> {selectedRecord.mswdoName}</p>
            </div>
            <button style={{marginTop: '16px', width: '100%', background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '6px', padding: '10px', fontWeight: '600', cursor: 'pointer'}} onClick={() => setSelectedRecord(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
export default RecordsTab;