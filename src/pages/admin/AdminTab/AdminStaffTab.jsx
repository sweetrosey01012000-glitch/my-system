import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { Plus, UserX, KeyRound, X } from 'lucide-react';

const secondaryApp = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
}, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

const NAIC_BARANGAYS = ["All Barangays","Bagong Kalsada","Balsahan","Bancaan","Bucana Malaki","Bucana Sasahan","Calubcob","Capt. C. Nazareno (Pob.)","Gombalza (Pob.)","Halang","Humbac","Ibayo Estacion","Ibayo Silangan","Kanluran","Labac","Latoria","Maquina","Malainen Bago","Malainen Luma","Molino","Munting Mapino","Muzon","Palangue 1","Palangue 2 & 3","Sabang","San Roque","Santulan","Sapa","Timalan Balsahan","Timalan Concepcion"];

function AdminStaffTab({ showToast }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', password:'', assignedBarangay:'All Barangays' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStaffList(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStaff = staffList.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const handleToggleStatus = async (staff) => {
    const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    if (window.confirm(`${newStatus === 'Inactive' ? 'Deactivate' : 'Activate'} ${staff.name}?`)) {
      await updateDoc(doc(db, 'staff', staff.id), { status: newStatus });
      showToast(`${staff.name} is now ${newStatus}`);
    }
  };
  const handleResetPassword = async (email) => {
    try { await sendPasswordResetEmail(auth, email); showToast(`Password reset sent to ${email}`); } 
    catch (e) { alert(e.message); }
  };
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      await setDoc(doc(db, 'staff', cred.user.uid), { 
        name: form.name,
        email: form.email,
        role: 'MSWD Staff', // AUTO STAFF NA
        assignedBarangay: form.assignedBarangay,
        status:'Active', 
        createdAt: new Date().toISOString(), 
        uid: cred.user.uid 
      });
      showToast(`Staff ${form.name} added!`);
      setShowModal(false);
      setForm({ name:'', email:'', password:'', assignedBarangay:'All Barangays' });
    } catch (err) { alert(err.message); } finally { setCreating(false); }
  };

  return (
    <div style={{padding:'0 12px'}}>
      <style>{`
        .staff-card{background:#fff; border-radius:14px; border:1.5px solid #fde68a; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04)}
        .staff-header{display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; gap:10px; flex-wrap:wrap}
        .staff-title{margin:0; color:#1E3A8A; font-size:18px; font-weight:900}
        .search-input{padding:10px 12px; border:1.5px solid #e5e7eb; border-radius:10px; font-size:14px; width:100%; max-width:260px; outline:none}
        .add-btn{padding:10px 14px; background:#1E3A8A; color:#FACC15; border:none; border-radius:10px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; font-size:13px}
        .table-wrap{overflow-x:auto}
        .staff-table{width:100%; border-collapse:collapse; min-width:600px}
        .staff-th{text-align:left; padding:10px 12px; border-bottom:2px solid #fde68a; color:#1E3A8A; font-weight:700; font-size:12px}
        .staff-td{padding:10px 12px; border-bottom:1px solid #fef3c7; font-size:13px}
        .badge{padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700}
        .badge-active{background:#dcfce7; color:#16a34a}
        .badge-inactive{background:#fef9c3; color:#d97706}
        .action-link{background:none; border:none; font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px}
        .mobile-cards{display:none; flex-direction:column; gap:12px}
        .m-card{background:#fff; border:1.5px solid #fde68a; border-radius:12px; padding:14px}
        .m-row{display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px}
        .m-label{color:#64748b; font-weight:600}
        .m-value{color:#1e293b; font-weight:600}
        .m-actions{display:flex; gap:12px; margin-top:10px; border-top:1px solid #fef3c7; padding-top:10px}
        @media(max-width:768px){
          .staff-card{padding:12px}
          .staff-header{flex-direction:column; align-items:stretch}
          .search-input{max-width:100%}
          .table-wrap{display:none}
          .mobile-cards{display:flex}
          .modal-box{width:92%!important; padding:16px!important}
        }
      `}</style>

      <div className="staff-card">
        <div className="staff-header">
          <h2 className="staff-title">Staff Accounts</h2>
          <div style={{display:'flex', gap:'10px', width:'100%', justifyContent:'space-between', alignItems:'center'}}>
            <input className="search-input" type="text" placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{flex:1}} />
            <button className="add-btn" onClick={()=>setShowModal(true)}><Plus size={14}/> Add Staff</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="staff-table">
            <thead><tr><th className="staff-th">Name</th><th className="staff-th">Email</th><th className="staff-th">Barangay</th><th className="staff-th">Status</th><th className="staff-th">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>Loading...</td></tr>
              : filteredStaff.map(s=>(
                <tr key={s.id}>
                  <td className="staff-td"><b>{s.name}</b></td>
                  <td className="staff-td">{s.email}</td>
                  <td className="staff-td">{s.assignedBarangay}</td>
                  <td className="staff-td"><span className={`badge ${s.status==='Active'?'badge-active':'badge-inactive'}`}>{s.status}</span></td>
                  <td className="staff-td">
                    <div style={{display:'flex', gap:'10px'}}>
                      <button className="action-link" style={{color:'#DC2626'}} onClick={()=>handleToggleStatus(s)}><UserX size={12}/>{s.status==='Active'?'Deactivate':'Activate'}</button>
                      <button className="action-link" style={{color:'#1E3A8A'}} onClick={()=>handleResetPassword(s.email)}><KeyRound size={12}/>Reset</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {filteredStaff.map(s=>(
            <div key={s.id} className="m-card">
              <div className="m-row"><span className="m-label">Name</span><span className="m-value">{s.name}</span></div>
              <div className="m-row"><span className="m-label">Email</span><span className="m-value" style={{fontSize:'11px'}}>{s.email}</span></div>
              <div className="m-row"><span className="m-label">Barangay</span><span className="m-value">{s.assignedBarangay}</span></div>
              <div className="m-row"><span className="m-label">Status</span><span className={`badge ${s.status==='Active'?'badge-active':'badge-inactive'}`}>{s.status}</span></div>
              <div className="m-actions">
                <button className="action-link" style={{color:'#DC2626'}} onClick={()=>handleToggleStatus(s)}><UserX size={12}/>{s.status==='Active'?'Deactivate':'Activate'}</button>
                <button className="action-link" style={{color:'#1E3A8A'}} onClick={()=>handleResetPassword(s.email)}><KeyRound size={12}/>Reset</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'12px'}}>
          <div className="modal-box" style={{background:'#fff', borderRadius:'14px', width:'100%', maxWidth:'400px', padding:'20px', border:'1.5px solid #FACC15'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
              <h3 style={{margin:0, color:'#1E3A8A', fontWeight:'900', fontSize:'16px'}}>Add Staff</h3>
              <button onClick={()=>setShowModal(false)} style={{background:'#f1f5f9', border:'none', borderRadius:'50%', width:'28px', height:'28px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><X size={14}/></button>
            </div>
            <form onSubmit={handleAddStaff} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="Full Name *" style={{padding:'11px', borderRadius:'8px', border:'1.5px solid #e5e7eb', fontSize:'14px'}} required />
              <input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="Email Address *" type="email" style={{padding:'11px', borderRadius:'8px', border:'1.5px solid #e5e7eb', fontSize:'14px'}} required />
              <input value={form.password} onChange={e=>setForm({...form, password:e.target.value})} placeholder="Password (min 6) *" type="password" style={{padding:'11px', borderRadius:'8px', border:'1.5px solid #e5e7eb', fontSize:'14px'}} required />
              <select value={form.assignedBarangay} onChange={e=>setForm({...form, assignedBarangay:e.target.value})} style={{padding:'11px', borderRadius:'8px', border:'1.5px solid #e5e7eb', fontSize:'14px'}}>
                {NAIC_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <div style={{background:'#eff6ff', padding:'10px', borderRadius:'8px', fontSize:'11px', color:'#1E3A8A', fontWeight:'600', textAlign:'center', border:'1px solid #bfdbfe'}}>
                Auto role: <b>MSWD Staff</b>
              </div>
              <div style={{display:'flex', gap:'10px', marginTop:'6px'}}>
                <button type="button" onClick={()=>setShowModal(false)} style={{flex:1, padding:'11px', borderRadius:'8px', border:'1.5px solid #e5e7eb', background:'#fff', fontWeight:'700', cursor:'pointer', fontSize:'13px'}}>Cancel</button>
                <button type="submit" disabled={creating} style={{flex:1, padding:'11px', borderRadius:'8px', border:'none', background: creating?'#9ca3af':'#1E3A8A', color:'#FACC15', fontWeight:'700', cursor:'pointer', fontSize:'13px'}}>{creating?'Creating...':'Create Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminStaffTab;