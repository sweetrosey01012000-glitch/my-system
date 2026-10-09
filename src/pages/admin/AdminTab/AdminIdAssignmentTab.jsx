import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { X, Search, BadgeCheck } from 'lucide-react';

function AdminIdAssignmentTab() {
  const [forIdAssignment, setForIdAssignment] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [idForm, setIdForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [customAlert, setCustomAlert] = useState(null);
  const [lastIdNumber, setLastIdNumber] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'pending_users'), where('status', '==', 'approved_by_staff'));
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(d => ({ id: d.id,...d.data() }));
      setForIdAssignment(data);
      setFiltered(data);

      // Kunin last ID number para auto increment
      try {
        const soloparentQ = query(collection(db, 'soloparent'), orderBy('createdAt', 'desc'));
        const soloparentSnap = await getDocs(soloparentQ);
        if (!soloparentSnap.empty) {
          const last = soloparentSnap.docs[0].data().idNumber || 'SP-NAIC-2026-0000';
          setLastIdNumber(last);
        }
      } catch (e) {}

      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!search.trim()) setFiltered(forIdAssignment);
    else {
      const s = search.toLowerCase();
      setFiltered(forIdAssignment.filter(a =>
        a.name?.toLowerCase().includes(s) ||
        a.barangay?.toLowerCase().includes(s) ||
        a.email?.toLowerCase().includes(s)
      ));
    }
  }, [search, forIdAssignment]);

  const generateIdNumber = (barangay) => {
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    // Format: SP-NAIC-YYYY-XXXXX
    return `SP-NAIC-${year}-${random}`;
  };

  const handleAssignId = async (applicant) => {
    const form = idForm[applicant.id];
    if (!form?.idNumber) {
      setCustomAlert({ type: 'error', title: 'Required', message: 'Lagyan mo muna ng ID Number!' });
      return;
    }
    if (!form?.issuanceDate ||!form?.validUntil) {
      setCustomAlert({ type: 'error', title: 'Required', message: 'Lagyan ng Issuance at Valid Until date!' });
      return;
    }

    try {
      const issuance = form.issuanceDate;
      const validUntil = form.validUntil;

      // 1. UPDATE soloparent collection - MAY ID NA + HASID TRUE = LALABAS SA DASHBOARD
      await setDoc(doc(db, 'soloparent', applicant.id), {
      ...applicant,
        idNumber: form.idNumber,
        issuanceDate: issuance,
        validUntil: validUntil,
        expiryDate: validUntil,
        mayorName: form.mayorName || 'Hon. Mayor',
        mswdoName: form.mswdoName || 'MSWDO Officer',
        status: 'Active',
        idStatus: 'Active',
        hasId: true, // MAY ID NA!
        canLogin: true,
        approvedByAdmin: true,
        approvedByAdminAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // 2. UPDATE users collection - para sa login
      await setDoc(doc(db, 'users', applicant.id), {
        idNumber: form.idNumber,
        issuanceDate: issuance,
        validUntil: validUntil,
        status: 'Active',
        hasId: true,
        canLogin: true,
        idStatus: 'Active',
        approvedByAdmin: true,
        approvedByAdminAt: serverTimestamp(),
      }, { merge: true });

      // 3. UPDATE pending_users to completed
      await updateDoc(doc(db, 'pending_users', applicant.id), {
        status: 'completed',
        idNumber: form.idNumber,
        hasId: true,
        completedAt: serverTimestamp(),
      });

      setCustomAlert({ type: 'success', title: 'ID Assigned!', message: `ID ${form.idNumber} assigned to ${applicant.name}. Makikita na nya sa dashboard nya Digital ID nya!` });

      // Clear form
      setIdForm(prev => {
        const n = {...prev};
        delete n[applicant.id];
        return n;
      });

    } catch (err) {
      setCustomAlert({ type: 'error', title: 'Error', message: err.message });
    }
  };

  if (loading) return <p style={{ fontSize: '13px' }}>Loading for ID assignment...</p>;

  return (
    <div style={{ padding: '0 12px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#1E3A8A', margin: 0 }}>Admin ID Assignment</h2>
      <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 12px 0' }}>{forIdAssignment.length} approved by Staff, waiting for ID • Last ID: {lastIdNumber || 'None'}</p>

      <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '16px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, barangay..." style={{ width: '100%', padding: '10px 10px 10px 32px', borderRadius: '8px', border: '1.5px solid #FACC15', fontSize: '13px' }} />
      </div>

      {filtered.length === 0 && <div style={{ background: '#fff', border: '2px solid #FACC15', borderRadius: '12px', padding: '32px', textAlign: 'center' }}><p style={{ fontSize: '13px', color: '#64748b' }}>No applications waiting for ID assignment</p></div>}

      {filtered.map(app => (
        <div key={app.id} style={{ background: '#fff', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontWeight: '800', color: '#1E3A8A', fontSize: '14px' }}>{app.name || app.fullName}</p>
              <p style={{ margin: '2px 0', fontSize: '11px', color: '#64748b' }}>{app.barangay} • {app.categoryTitle || app.category} • Approved by {app.approvedByStaff}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#475569' }}>{app.email} • {app.contact}</p>
            </div>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', height: 'fit-content' }}>Can Login • No ID yet</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' }}>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px' }}>
              <input
                placeholder="SP-NAIC-2026-XXXXX"
                value={idForm[app.id]?.idNumber || ''}
                onChange={e => setIdForm({...idForm, [app.id]: {...idForm[app.id], idNumber: e.target.value.toUpperCase()}})}
                style={{ flex: 1, padding: '11px', borderRadius: '8px', border: '1.5px solid #1E3A8A', fontSize: '13px', fontWeight: '700', fontFamily: 'monospace' }}
              />
              <button onClick={() => setIdForm({...idForm, [app.id]: {...idForm[app.id], idNumber: generateIdNumber(app.barangay)}})} style={{ padding: '11px 14px', background: '#FACC15', color: '#1E3A8A', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '11px' }}>Generate</button>
            </div>
            <div><label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Issuance Date *</label><input type="date" value={idForm[app.id]?.issuanceDate || new Date().toISOString().split('T')[0]} onChange={e => setIdForm({...idForm, [app.id]: {...idForm[app.id], issuanceDate: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} /></div>
            <div><label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>Valid Until *</label><input type="date" value={idForm[app.id]?.validUntil || ''} onChange={e => setIdForm({...idForm, [app.id]: {...idForm[app.id], validUntil: e.target.value}})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px', boxSizing: 'border-box' }} /></div>
            <input placeholder="Mayor Name" value={idForm[app.id]?.mayorName || ''} onChange={e => setIdForm({...idForm, [app.id]: {...idForm[app.id], mayorName: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px' }} />
            <input placeholder="MSWDO Name" value={idForm[app.id]?.mswdoName || ''} onChange={e => setIdForm({...idForm, [app.id]: {...idForm[app.id], mswdoName: e.target.value}})} style={{ padding: '10px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '13px' }} />
          </div>

          <button onClick={() => handleAssignId(app)} style={{ width: '100%', marginTop: '14px', padding: '13px', background: '#1E3A8A', color: '#FACC15', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <BadgeCheck size={16} /> Assign ID & Activate Digital ID
          </button>
        </div>
      ))}

      {customAlert && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', maxWidth: '360px', width: '90%', textAlign: 'center', border: '3px solid #FACC15' }}>
            <div style={{ width: '56px', height: '56px', background: customAlert.type === 'success'? '#dcfce7' : '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '24px' }}>{customAlert.type === 'success'? '✅' : '⚠️'}</div>
            <h3 style={{ margin: 0, fontWeight: '900' }}>{customAlert.title}</h3>
            <p style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>{customAlert.message}</p>
            <button onClick={() => setCustomAlert(null)} style={{ marginTop: '16px', background: '#1E3A8A', color: '#FACC15', padding: '10px 24px', borderRadius: '10px', border: 'none', fontWeight: '800' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminIdAssignmentTab;