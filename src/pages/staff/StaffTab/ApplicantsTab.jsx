import { useState, useEffect } from 'react';
import { X, RefreshCw, Eye, Calendar, MapPin, User, Mail, Clock, FileText, CheckCircle2, XCircle, Search, Users2, AlertCircle } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const ApplicantsTab = () => {
  const { userData } = useAuth();
  const [pendingApps, setPendingApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [customAlert, setCustomAlert] = useState(null);
  const [staffBarangay, setStaffBarangay] = useState('All Barangays');
  const [search, setSearch] = useState('');
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');

  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);

  const C = isDark? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8', thBg:'#1e222e' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b', thBg:'#ffffff' };
  const assignedBarangay = userData?.assignedBarangay || userData?.barangay || 'All Barangays';
  const isAllBarangay = !assignedBarangay || assignedBarangay.toLowerCase().includes('all');
  const formatDate = (ts) => { if (!ts) return 'N/A'; const d = ts.toDate ? ts.toDate() : new Date(ts); return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };

  useEffect(() => {
    const getStaffBarangay = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const staffDoc = await getDoc(doc(db, 'staff', currentUser.uid));
          if (staffDoc.exists()) setStaffBarangay(staffDoc.data().assignedBarangay || assignedBarangay);
        }
      } catch (e) {}
    };
    getStaffBarangay();
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'pending_users'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      let apps = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      if (!isAllBarangay) {
        apps = apps.filter(app => {
          const b1 = (app.barangay || '').toLowerCase();
          const b2 = (app.address || '').toLowerCase();
          return b1.includes(assignedBarangay.toLowerCase()) || b2.includes(assignedBarangay.toLowerCase());
        });
      }
      setPendingApps(apps);
      setLoading(false);
    });
    return () => unsub();
  }, [assignedBarangay, isAllBarangay]);

  const filteredApps = pendingApps.filter(app => (app.name || '').toLowerCase().includes(search.toLowerCase()) || (app.email || '').toLowerCase().includes(search.toLowerCase()));

  const handleApprove = async (appId) => {
    try {
      const pendingRef = doc(db, 'pending_users', appId);
      await updateDoc(pendingRef, {
        status: 'approved_by_staff',
        approvedByStaff: userData?.name || 'Staff',
        approvedByStaffId: auth.currentUser?.uid || '',
        approvedByStaffAt: serverTimestamp(),
        forAdminIdAssignment: true,
        canLogin: true,
        hasId: false
      });
      setSelectedApp(null);
      setCustomAlert({ type: 'success', title: 'Approved by Staff!', message: `Approved - waiting for Admin ID assignment` });
    } catch (err) { setCustomAlert({ type: 'error', title: 'Error', message: err.message }); }
  };

  const handleReject = async (appId) => {
    if (!rejectReason.trim()) return alert('Lagay ka reason Bes!');
    try {
      await updateDoc(doc(db, 'pending_users', appId), {
        status: 'rejected',
        rejectReason,
        reviewedBy: userData?.name || 'Staff',
        reviewedAt: serverTimestamp(),
        rejectedAt: serverTimestamp(),
        canLogin: true
      });
      setSelectedApp(null); setShowRejectInput(false); setRejectReason('');
    } catch (err) { alert(err.message); }
  };

  // HELPER PARA MAKUHA SEX KAHIT SAAN NAKALAGAY BES!
  const getSex = (app) => app?.sex || app?.gender || app?.sexAtBirth || app?.personalInfo?.sex || app?.formData?.step1?.sex || app?.step1?.sex || 'N/A';

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', background: C.bg, minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif !important; }
        .app-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; box-shadow: ${isDark?'0 2px 10px rgba(0,0,0,0.2)':'0 2px 10px rgba(0,0,0,0.03)'}; }
        .app-header { background: ${C.card}; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 3px solid #FACC15; }
        .th-white { padding: 12px 14px; text-align: left; font-weight: 800; font-size: 11px; color: ${isDark? '#94a3b8' : '#1E3A8A'}; background: ${C.thBg}; border-bottom: 3px solid #FACC15; letter-spacing: 0.3px; }
        .td-cell { padding: 11px 14px; font-size: 12.5px; border-bottom: 1px solid ${C.border}; color: ${C.text}; }
        .row-hover:hover { background: ${C.card2}!important; cursor: pointer; }
        .search-inter { padding: 9px 14px 9px 34px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 12px; width: 200px; outline: none; background: ${C.card2}; color: ${C.text}; }
        .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid ${C.border}; background: ${C.card2}; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .icon-btn.view:hover { background: #1E3A8A; color: #FACC15; }
      `}</style>

      <div className="app-wrapper">
        <div className="app-header">
          <h2 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#1E3A8A', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users2 size={16} color="#FACC15" /></div> Review Applications
            <span style={{ background: C.card2, color: C.muted, fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '20px', border: `1px solid ${C.border}` }}><MapPin size={10}/>{isAllBarangay ? 'All Barangays' : assignedBarangay}</span>
            <span style={{ background: '#1E3A8A', color: '#FACC15', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>{filteredApps.length} pending</span>
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} /><input className="search-inter" placeholder="Search name..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button onClick={() => window.location.reload()} style={{ border: `1.5px solid ${C.border}`, background: C.card2, borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><RefreshCw size={14} color={C.muted}/></button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? <p style={{ padding: '20px', fontSize: '12px', color: C.muted }}>Loading...</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '850px' }}>
              <thead><tr><th className="th-white">NAME</th><th className="th-white">SEX</th><th className="th-white">EMAIL</th><th className="th-white"><span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12}/> REGISTERED</span></th><th className="th-white">ADDRESS / BARANGAY</th><th className="th-white" style={{ textAlign: 'center' }}>ACTION</th></tr></thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id} className="row-hover" onClick={() => setSelectedApp(app)}>
                    <td className="td-cell" style={{ fontWeight: '700' }}><User size={12} color={C.muted}/> {app.name || `${app.firstName||''} ${app.lastName||''}`}</td>
                    <td className="td-cell" style={{ fontWeight: '800', color: getSex(app).toLowerCase()==='female'?'#ec4899':'#3b82f6' }}>{getSex(app)}</td>
                    <td className="td-cell" style={{ color: C.muted }}><Mail size={12}/> {app.email}</td>
                    <td className="td-cell" style={{ fontSize: '11px', color: C.muted }}><Clock size={11}/> {formatDate(app.createdAt)}</td>
                    <td className="td-cell"><span style={{ background: C.card2, border: `1px solid ${C.border}`, padding: '3px 8px', borderRadius: '20px', fontSize: '11px' }}><MapPin size={10}/>{app.barangay || app.address || 'N/A'}</span></td>
                    <td className="td-cell"><div style={{ display: 'flex', justifyContent: 'center' }}><button className="icon-btn view"><Eye size={14}/></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAILS MODAL - STEP 1-7 FORM BES! */}
      {selectedApp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedApp(null)}>
          <div style={{ background: C.card, width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '2.5px solid #FACC15' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#1E3A8A', position: 'sticky', top: 0, zIndex: 1 }}>
              <h3 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '900' }}><FileText size={16} color="#FACC15"/> Application Details - {selectedApp.barangay || 'N/A'}</h3>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '28px', height: '28px', cursor: 'pointer' }}><X size={14} color="white"/></button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* STEP 1-7 DISPLAY BES */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: '10px', color: C.muted, fontWeight: '800' }}>FULL NAME</p><p style={{ margin: 0, fontSize: '13px', fontWeight: '800' }}>{selectedApp.name}</p></div>
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: '10px', color: C.muted, fontWeight: '800' }}>SEX</p><p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: getSex(selectedApp).toLowerCase()==='female'?'#ec4899':'#3b82f6' }}>{getSex(selectedApp)}</p></div>
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: '10px', color: C.muted, fontWeight: '800' }}>BIRTHDATE / AGE</p><p style={{ margin: 0, fontSize: '12px' }}>{selectedApp.birthdate || selectedApp.dob || 'N/A'} - {selectedApp.age || ''}</p></div>
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><p style={{ margin: 0, fontSize: '10px', color: C.muted, fontWeight: '800' }}>CIVIL STATUS</p><p style={{ margin: 0, fontSize: '12px' }}>{selectedApp.civilStatus || selectedApp.status || 'Solo Parent'}</p></div>
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, gridColumn: '1 / -1' }}><p style={{ margin: 0, fontSize: '10px', color: C.muted, fontWeight: '800' }}>COMPLETE ADDRESS</p><p style={{ margin: 0, fontSize: '12px' }}>{selectedApp.address || selectedApp.fullAddress || selectedApp.barangay}</p></div>
              </div>

              {/* ITO YUNG STEP 1-7 FORM DATA BES - KUNG NASA formData */}
              {selectedApp.formData && (
                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '800', color: C.text, borderBottom: '2px solid #FACC15', paddingBottom: '6px' }}>Form Steps 1-7 Data</h4>
                  <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', color: C.text }}>{JSON.stringify(selectedApp.formData || selectedApp, null, 2)}</pre>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '800', color: C.text, borderBottom: '2px solid #FACC15', paddingBottom: '6px' }}><FileText size={14}/> Requirements ({(selectedApp.requirementImages || []).length})</h4>
                {(selectedApp.requirementImages || []).length === 0 ? <p style={{ fontSize: '11px', color: C.muted }}>No requirements</p> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                    {(selectedApp.requirementImages || []).map((url, i) => (
                      <div key={i} style={{ border: `1.5px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                        <img src={typeof url === 'string' ? url : url.url} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        <button onClick={() => setPreviewImage({ url: typeof url === 'string' ? url : url.url, label: `Requirement ${i+1}` })} style={{ width: '100%', background: '#1E3A8A', color: '#FACC15', border: 'none', padding: '6px', fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}><Eye size={12}/> View Full</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showRejectInput && (<div><label style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444' }}>Reason for Rejection *</label><textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Kulang requirements, Wrong info, Hindi tugma pangalan sa ID..." style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #ef4444', background: isDark?'#2a1f1f':'#fef2f2', color: C.text, minHeight: '80px' }} /></div>)}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleApprove(selectedApp.id)} style={{ flex: 1, padding: '11px', background: '#1E3A8A', color: '#FACC15', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}><CheckCircle2 size={14}/> Approve</button>
                <button onClick={() => showRejectInput ? handleReject(selectedApp.id) : setShowRejectInput(true)} style={{ flex: 1, padding: '11px', background: showRejectInput ? '#dc2626' : C.card2, color: showRejectInput ? 'white' : '#dc2626', border: '1.5px solid #dc2626', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '12px', display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}><XCircle size={14}/>{showRejectInput ? 'Confirm Reject' : 'Reject'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewImage && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setPreviewImage(null)}><img src={previewImage.url} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '12px' }} /></div>)}
      {customAlert && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}><div style={{ background: C.card, padding: '20px', borderRadius: '16px', maxWidth: '360px', width: '100%', textAlign: 'center', border: '2.5px solid #FACC15' }}><h3 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '800' }}>{customAlert.title}</h3><p style={{ fontSize: '12px', color: C.muted }}>{customAlert.message}</p><button onClick={() => setCustomAlert(null)} style={{ marginTop: '16px', background: '#1E3A8A', color: '#FACC15', padding: '10px 24px', borderRadius: '10px', border: 'none', fontWeight: '800', width: '100%' }}>OK</button></div></div>)}
    </div>
  );
};

export default ApplicantsTab;