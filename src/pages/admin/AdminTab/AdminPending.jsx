import { useState, useEffect } from 'react';
import { X, Eye, Search, ShieldCheck, FileText, CheckCircle2, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { collection, query, where, doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAuth } from '../../../context/AuthContext';

const AdminPending = () => {
    const { userData } = useAuth();
    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('approved_by_staff');
    const [selectedApp, setSelectedApp] = useState(null);
    const [search, setSearch] = useState('');
    const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
    const [idNumber, setIdNumber] = useState('');
    const [benefitCode, setBenefitCode] = useState('');
    const [category, setCategory] = useState('Solo Parent');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
        window.addEventListener('sp_theme_changed', sync);
        return () => window.removeEventListener('sp_theme_changed', sync);
    }, []);

    const C = isDark ? { bg: '#12151e', card: '#1e222e', card2: '#252a38', border: '#2a2f40', text: '#e2e8f0', muted: '#94a3b8', thBg: '#1e222e' } : { bg: '#f8fafc', card: '#ffffff', card2: '#f8fafc', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', thBg: '#ffffff' };

    useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'pending_users'), where('status', 'in', ['approved_by_staff', 'rejected']));
        const unsub = onSnapshot(q, (snap) => {
            let data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.approvedByStaffAt?.seconds || b.rejectedAt?.seconds || 0) - (a.approvedByStaffAt?.seconds || a.rejectedAt?.seconds || 0));
            setApps(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filtered = apps.filter(a => {
        if (activeTab !== 'all' && a.status !== activeTab) return false;
        return (a.name || a.fullName || '').toLowerCase().includes(search.toLowerCase()) || (a.email || '').toLowerCase().includes(search.toLowerCase());
    });

    const getSex = (app) => app?.sex || app?.gender || app?.personalInfo?.sex || app?.step1?.sex || 'N/A';
    const getField = (app, keys) => { for (let k of keys) { if (app[k]) return app[k]; if (app.step1 && app.step1[k]) return app.step1[k]; if (app.personalInfo && app.personalInfo[k]) return app.personalInfo[k]; } return 'N/A'; };
    const openDetails = (app) => { setSelectedApp(app); setIdNumber(app.idNumber || `SP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`); setBenefitCode(app.benefitCode || 'BEN-001'); setCategory(app.category || 'Solo Parent'); setRemarks(''); };
    const handleFinalApprove = async () => { if (!idNumber.trim() || !benefitCode.trim()) return alert('Lagyan mo ID at Benefit Code Bes!'); try { const data = selectedApp; const finalData = { ...data, uid: data.id, idNumber, benefitCode, category, status: 'approved', isApproved: true, canLogin: true, hasId: true, approvedByAdmin: userData?.name || 'Admin', approvedByAdminId: auth.currentUser?.uid, approvedAt: serverTimestamp(), adminRemarks: remarks, forAdminIdAssignment: false }; await setDoc(doc(db, 'soloparent', data.id), finalData, { merge: true }); await setDoc(doc(db, 'users', data.id), { ...finalData, role: 'soloparent' }, { merge: true }); await updateDoc(doc(db, 'pending_users', data.id), { status: 'admin_approved', idNumber, benefitCode, adminApprovedAt: serverTimestamp() }); setSelectedApp(null); alert(`✅ ${data.name || data.fullName} Final Approved! ID: ${idNumber}`); } catch (e) { alert(e.message); } };
    const handleReturnToPending = async (id) => { await updateDoc(doc(db, 'pending_users', id), { status: 'pending', rejectReason: '', adminRemarks: 'Returned by Admin', returnedAt: serverTimestamp() }); setSelectedApp(null); };
    const DetailRow = ({ label, value }) => (<div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px dashed ${C.border}` }}><span style={{ fontSize: '11px', fontWeight: '700', color: C.muted, textTransform: 'uppercase' }}>{label}</span><span style={{ fontSize: '12px', fontWeight: '700', color: C.text, textAlign: 'right', maxWidth: '60%' }}>{value || 'N/A'}</span></div>);

    // GET REQUIREMENTS URL HELPER BES!
    const getDocUrl = (app, keys) => {
        for (let k of keys) {
            if (app[k]) return app[k];
            if (app.documents && app.documents[k]) return app.documents[k];
            if (app.requirements && app.requirements[k]) return app.requirements[k];
            if (app.step7 && app.step7[k]) return app.step7[k];
            if (app.files && app.files[k]) return app.files[k];
        }
        return null;
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", display: 'flex', flexDirection: 'column', gap: '12px', background: C.bg, minHeight: '100vh' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif!important; }
       .app-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
       .app-header { background: ${C.card}; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 3px solid #FACC15; }
       .th-white { padding: 12px 14px; text-align: left; font-weight: 800; font-size: 11px; color: ${isDark ? '#94a3b8' : '#1E3A8A'}; background: ${C.thBg}; border-bottom: 3px solid #FACC15; }
       .td-cell { padding: 11px 14px; font-size: 12.5px; border-bottom: 1px solid ${C.border}; color: ${C.text}; transition: all 0.3s; }
       .row-hover { transition: all 0.3s ease; border-left: 3px solid transparent; }
       .row-hover:hover { background: ${C.card2}!important; cursor: pointer; transform: translateX(3px); box-shadow: 0 8px 32px rgba(250,204,21,0.22); border-left: 3px solid #FACC15; }
       .search-inter { padding: 9px 14px 9px 34px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 12px; width: 200px; outline: none; background: ${C.card2}; color: ${C.text}; transition: 0.3s; }
       .search-inter:focus { border-color: #FACC15; box-shadow: 0 0 0 3px rgba(250,204,21,0.15); transform: translateY(-1px); }
       .dropdown-filter { padding: 8px 32px 8px 12px; border: 1.5px solid ${C.border}; border-radius: 10px; font-size: 12px; font-weight: 800; background: ${C.card2}; color: ${C.text}; appearance: none; cursor: pointer; transition: all 0.3s; }
       .dropdown-filter:hover { border-color: #FACC15; transform: translateX(2px); box-shadow: 0 4px 12px rgba(250,204,21,0.15); }
       .view-btn { padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; background: #1E3A8A; color: #FACC15; border: none; transition: all 0.3s; }
       .view-btn:hover { background: #FACC15; color: #1E3A8A; transform: translateX(2px) scale(1.05); box-shadow: 0 4px 12px rgba(250,204,21,0.3); }
       .doc-card { transition: all 0.3s ease; }
       .doc-card:hover { transform: translateY(-3px) translateX(2px); box-shadow: 0 12px 32px rgba(30,58,138,0.18); border-color: #FACC15!important; }
      `}</style>

            <div className="app-wrapper">
                <div className="app-header">
                    <h2 style={{ margin: 0, color: C.text, fontSize: '15px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#1E3A8A', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={16} color="#FACC15" /></div> Admin - Full Form Review <span style={{ background: '#1E3A8A', color: '#FACC15', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>{filtered.length}</span>
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}><select value={activeTab} onChange={e => setActiveTab(e.target.value)} className="dropdown-filter"><option value="approved_by_staff">✅ Staff Approved</option><option value="rejected">❌ Staff Rejected</option><option value="all">📋 All</option></select><ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.muted }} /></div>
                        <div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: C.muted }} /><input className="search-inter" placeholder="Search name/email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                    </div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    {loading ?
                        <p style={{ padding: '20px', color: C.muted }}>Loading...</p> :
                        (<table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                            <thead>
                                <tr>
                                    <th className="th-white">NAME</th>
                                    <th className="th-white">BARANGAY</th>
                                    <th className="th-white">GENDER</th>
                                    <th className="th-white">CIVIL STATUS</th>
                                    <th className="th-white">STAFF DECISION</th>
                                    <th className="th-white">ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(app => (
                                    <tr key={app.id} className="row-hover" onClick={() => openDetails(app)}>
                                        <td className="td-cell" style={{ fontWeight: '700' }}>{app.name || app.fullName}<br /><span style={{ fontSize: '10px', color: C.muted }}>{app.email}</span></td>
                                        <td className="td-cell" style={{ fontWeight: '800' }}>
                                            <span style={{ background: '#fef9c3', color: '#1e3a8a', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', border: '1px solid #facc15' }}>
                                                {app.barangay || app.addressBarangay || app.brgy || getVal(app, ['barangay']) || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="td-cell" style={{ fontWeight: '800', color: getSex(app).toLowerCase() === 'female' ? '#ec4899' : '#3b82f6' }}>{getSex(app)}</td>
                                        <td className="td-cell" style={{ fontWeight: '700' }}>{getVal(app, ['civilStatus', 'civil_status', 'maritalStatus'])}</td>
                                        <td className="td-cell"><span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: '800', background: app.status === 'approved_by_staff' ? '#dcfce7' : '#fee2e2', color: app.status === 'approved_by_staff' ? '#16a34a' : '#dc2626' }}>{app.status}</span></td>
                                        <td className="td-cell"><button className="view-btn"><Eye size={12} /> View</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        )}
                </div>
            </div>

            {selectedApp && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={() => setSelectedApp(null)}>
                    <div style={{ background: C.card, width: '100%', maxWidth: '950px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', border: '2.5px solid #FACC15' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: '#1E3A8A', position: 'sticky', top: 0, zIndex: 10 }}><h3 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: '900' }}><FileText size={16} color="#FACC15" /> Full Form - {selectedApp.name || selectedApp.fullName} ({selectedApp.status})</h3><button onClick={() => setSelectedApp(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', width: '28px', height: '28px' }}><X size={14} color="white" /></button></div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, gridColumn: '1/-1' }}><h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#1E3A8A', background: '#FACC15', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>STEP 1-2: PERSONAL INFO</h4><DetailRow label="Full Name" value={selectedApp.name || selectedApp.fullName} /><DetailRow label="Sex / Gender" value={getSex(selectedApp)} /><DetailRow label="Birthday / Age" value={`${getField(selectedApp, ['birthday', 'bday', 'birthdate'])} / ${getField(selectedApp, ['age'])}`} /><DetailRow label="Civil Status" value={getField(selectedApp, ['civilStatus', 'status'])} /><DetailRow label="Contact / Email" value={`${getField(selectedApp, ['mobile', 'phone', 'contact'])} / ${selectedApp.email}`} /><DetailRow label="Address / Barangay" value={`${getField(selectedApp, ['address', 'fullAddress'])} - ${getField(selectedApp, ['barangay'])}`} /></div>
                                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#1E3A8A', background: '#BFDBFE', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>STEP 3-4: FAMILY & CHILDREN</h4><DetailRow label="No. of Children" value={getField(selectedApp, ['childrenCount', 'noOfChildren', 'children'])} /><DetailRow label="Children Names" value={JSON.stringify(selectedApp.children || selectedApp.step3 || selectedApp.family || '').slice(0, 100)} /><DetailRow label="Reason for Solo Parent" value={getField(selectedApp, ['reason', 'soloParentReason'])} /></div>
                                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}` }}><h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '900', color: '#1E3A8A', background: '#BBF7D0', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>STEP 5-6: ECONOMIC / WORK</h4><DetailRow label="Occupation" value={getField(selectedApp, ['occupation', 'work', 'job'])} /><DetailRow label="Monthly Income" value={getField(selectedApp, ['income', 'monthlyIncome'])} /><DetailRow label="Education" value={getField(selectedApp, ['education', 'educationalAttainment'])} /></div>

                                {/* UPDATED REQUIREMENTS SECTION BES! */}
                                <div style={{ background: C.card2, padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, gridColumn: '1/-1' }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '900', color: '#1E3A8A', background: '#FDE68A', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', gap: '6px' }}><ImageIcon size={12} /> STEP 7: UPLOADED REQUIREMENTS</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                                        {[
                                            { label: 'Valid ID', keys: ['validId', 'validIdUrl', 'governmentId'] },
                                            { label: 'Barangay Cert', keys: ['barangayCert', 'barangayCertUrl', 'brgyCert'] },
                                            { label: 'Solo Parent Proof', keys: ['soloParentProof', 'soloProofUrl', 'proof'] },
                                            { label: 'Birth Cert', keys: ['birthCert', 'birthCertUrl', 'childBirthCert'] },
                                            { label: 'Income Proof', keys: ['incomeProof', 'incomeProofUrl', 'income'] },
                                            { label: '2x2 Photo', keys: ['photo', 'photoUrl', 'profilePhoto', '2x2'] },
                                        ].map(doc => {
                                            const url = getDocUrl(selectedApp, doc.keys);
                                            return url ? (
                                                <div key={doc.label} className="doc-card" style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{ padding: '6px 8px', background: '#1E3A8A', color: '#FACC15', fontSize: '10px', fontWeight: '800', textAlign: 'center' }}>{doc.label}</div>
                                                    <img src={url} alt={doc.label} style={{ width: '100%', height: '110px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => window.open(url, '_blank')} />
                                                    <button onClick={() => window.open(url, '_blank')} style={{ width: '100%', padding: '6px', background: '#FACC15', border: 'none', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}>View Full</button>
                                                </div>
                                            ) : (
                                                <div key={doc.label} style={{ background: C.card, border: `1.5px dashed ${C.border}`, borderRadius: '10px', padding: '16px', textAlign: 'center' }}><div style={{ fontSize: '10px', fontWeight: '800', color: C.muted }}>{doc.label}</div><div style={{ fontSize: '9px', color: '#ef4444' }}>No file</div></div>
                                            );
                                        })}
                                    </div>
                                    <div style={{ marginTop: '12px' }}><DetailRow label="Staff Decision" value={`${selectedApp.status} by ${selectedApp.approvedByStaff || selectedApp.reviewedBy || 'Staff'}`} />{selectedApp.rejectReason && <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '6px', marginTop: '6px', border: '1px solid #fecaca' }}><p style={{ margin: 0, fontSize: '11px', color: '#dc2626', fontWeight: '800' }}>Staff Reject Reason: {selectedApp.rejectReason}</p></div>}</div>
                                </div>
                            </div>

                            <details style={{ background: '#0f172a', padding: '10px', borderRadius: '8px' }}><summary style={{ color: '#FACC15', fontSize: '11px', fontWeight: '800', cursor: 'pointer' }}>Click to View Raw Full Form Data (Step 1-7)</summary><pre style={{ color: '#e2e8f0', fontSize: '10px', overflowX: 'auto', marginTop: '8px', whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedApp, null, 2)}</pre></details>

                            <div style={{ background: '#FFFBEB', padding: '14px', borderRadius: '12px', border: '1.5px solid #FACC15' }}><h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '900', color: '#1E3A8A' }}>Admin Final Assignment</h4><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}><div><label style={{ fontSize: '10px', fontWeight: '800' }}>Solo Parent ID *</label><input value={idNumber} onChange={e => setIdNumber(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px' }} /></div><div><label style={{ fontSize: '10px', fontWeight: '800' }}>Benefit Code *</label><input value={benefitCode} onChange={e => setBenefitCode(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '12px' }} /></div></div></div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                {selectedApp.status === 'approved_by_staff' && <button onClick={handleFinalApprove} style={{ flex: 1, padding: '11px', background: '#16a34a', color: '#fff', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer' }}><CheckCircle2 size={14} /> Final Approve & Assign ID</button>}
                                {selectedApp.status === 'rejected' && (<><button onClick={() => handleReturnToPending(selectedApp.id)} style={{ flex: 1, padding: '11px', background: C.card2, borderRadius: '10px', fontWeight: '800', border: `1.5px solid ${C.border}`, cursor: 'pointer', color: C.text }}>↩️ Return to Pending</button><button onClick={handleFinalApprove} style={{ flex: 1, padding: '11px', background: '#1E3A8A', color: '#FACC15', borderRadius: '10px', fontWeight: '800', border: 'none', cursor: 'pointer' }}>✔️ Valid - Approve Anyway</button></>)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminPending;