import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Plus, X, Eye, EyeOff, CheckCircle2, Sparkles, Users, Pencil, Trash2, Save, AlertTriangle } from 'lucide-react';

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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({ name:'', email:'', password:'', assignedBarangay:'All Barangays' });
  const [editForm, setEditForm] = useState({ name:'', assignedBarangay:'All Barangays', status:'Active' });
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [successName, setSuccessName] = useState('');
  const [localToast, setLocalToast] = useState('');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [focused, setFocused] = useState('');
  const [passError, setPassError] = useState('');

  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);

  const C = isDark ? { bg:'#12151e', card:'#1e222e', card2:'#252a38', border:'#2a2f40', text:'#e2e8f0', muted:'#94a3b8' } : { bg:'#f8fafc', card:'#ffffff', card2:'#f8fafc', border:'#e2e8f0', text:'#0f172a', muted:'#64748b' };

  const safeToast = (msg) => {
    if (typeof showToast === 'function') showToast(msg);
    else { setLocalToast(msg); setTimeout(() => setLocalToast(''), 3000); }
  };

  const getPassError = (pass) => {
    if(!pass) return '';
    if(pass.length < 8) return 'Password must be at least 8 characters';
    if(!/[A-Z]/.test(pass)) return 'Must include uppercase letter';
    if(!/[a-z]/.test(pass)) return 'Must include lowercase letter';
    if(!/[0-9]/.test(pass)) return 'Must include a number';
    if(!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return 'Must include special character (!@#$%)';
    return '';
  };

  useEffect(() => {
    const q = query(collection(db, 'staff'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStaffList(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredStaff = staffList.filter(s => s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setEditForm({ name: staff.name, assignedBarangay: staff.assignedBarangay, status: staff.status || 'Active' });
    setShowEditModal(true);
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'staff', editingStaff.id), { name: editForm.name, assignedBarangay: editForm.assignedBarangay, status: editForm.status });
      await updateDoc(doc(db, 'users', editingStaff.id), { name: editForm.name, assignedBarangay: editForm.assignedBarangay, status: editForm.status }).catch(()=>{});
      safeToast(`${editForm.name} updated`);
      setShowEditModal(false);
    } catch (err) { alert(err.message); }
  };

  const openDeleteAlert = (staff) => { setStaffToDelete(staff); setShowDeleteAlert(true); };
  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try { await deleteDoc(doc(db, 'staff', staffToDelete.id)); safeToast(`${staffToDelete.name} deleted`); setShowDeleteAlert(false); setStaffToDelete(null); } 
    catch (err) { alert(err.message); }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    const err = getPassError(form.password);
    if(err){ setPassError(err); return; }
    setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password);
      const staffData = { name: form.name.trim(), email: form.email.trim().toLowerCase(), role: 'MSWD Staff', assignedBarangay: form.assignedBarangay, status:'Active', createdAt: serverTimestamp(), uid: cred.user.uid, canLogin: true };
      await setDoc(doc(db, 'staff', cred.user.uid), staffData);
      await setDoc(doc(db, 'users', cred.user.uid), staffData);
      setSuccessName(form.name); setShowSuccessAlert(true);
      await secondaryAuth.signOut();
      setShowModal(false);
      setForm({ name:'', email:'', password:'', assignedBarangay:'All Barangays' });
      setShowPassword(false); setFocused(''); setPassError('');
    } catch (err) { 
      const msg = err.message.includes('email-already') ? 'Email already exists Bes!' : err.message;
      setPassError(''); 
      safeToast(msg);
    }
    finally { setCreating(false); }
  };

  const floatWrap = { position:'relative', width:'100%' };
  const floatInput = (isActive, hasErr=false) => ({
    width:'100%', padding:'18px 12px 8px 12px', borderRadius:'10px',
    border:`1.5px solid ${hasErr ? '#ef4444' : (isActive ? '#FACC15' : C.border)}`,
    background:C.card2, color:C.text, fontSize:'13px', outline:'none'
  });
  const floatLabel = (isActive, isFocused) => ({
    position:'absolute', left:'12px', top: isActive ? '4px' : '50%',
    transform: isActive ? 'none' : 'translateY(-50%)',
    fontSize: isActive ? '10px' : '13px', fontWeight: isActive ? '800' : '500',
    color: isFocused ? '#1E3A8A' : C.muted, background: isActive ? C.card2 : 'transparent',
    padding: isActive ? '0 4px' : '0', transition:'all 0.2s ease',
    pointerEvents:'none', textTransform: isActive ? 'uppercase' : 'none'
  });

  return (
    <div style={{fontFamily: "'Inter', sans-serif", background: C.bg}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .staff-wrapper { background: ${C.card}; border-radius: 16px; border: 1.5px solid ${C.border}; overflow: hidden; }
        .staff-header-white { background: ${C.card}; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid ${C.border}; }
        .search-inter { padding: 10px 14px; border: 1.5px solid ${C.border}; border-radius: 12px; font-size: 13px; width: 260px; outline: none; background: ${C.card2}!important; color: ${C.text}!important; }
        .th-white { padding: 14px 12px; text-align: left; font-weight: 800; font-size: 11px; color: ${C.text}; background: ${C.card}; border-bottom: 3px solid #FACC15; }
        .row-hover:hover { background: ${isDark? '#252a38' : '#fefce8'}!important; }
        .icon-btn { width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid ${C.border}; background: ${C.card}; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .icon-btn.edit:hover { background: #1E3A8A; color: #FACC15; } .icon-btn.delete:hover { background: #DC2626; color: white; }
        .badge-active { background: ${isDark? '#14331f' : '#dcfce7'}; color: ${isDark? '#4ade80' : '#166534'}; border: 1px solid ${isDark? '#1f5a2f' : '#86efac'}; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; }
        .badge-inactive { background: ${isDark? '#332a0f' : '#fef9c3'}; color: ${isDark? '#facc15' : '#92400e'}; border: 1px solid ${isDark? '#5a4a1f' : '#fbbf24'}; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; }
      `}</style>

      {localToast && (<div style={{position:'fixed', top:'20px', right:'20px', background:'#1E3A8A', color:'#FACC15', padding:'12px 18px', borderRadius:'12px', zIndex:10000, fontSize:'13px', fontWeight:'800'}}>{localToast}</div>)}
      <div className="staff-wrapper">
        <div className="staff-header-white">
          <h2 style={{margin:0, color:C.text, fontSize:'18px', fontWeight:'900', display:'flex', alignItems:'center', gap:'10px'}}>
            <div style={{width:'34px', height:'34px', background:'#1E3A8A', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center'}}><Users size={18} color="#FACC15"/></div>
            Staff Accounts <span style={{background:'#1E3A8A', color:'#FACC15', padding:'3px 10px', borderRadius:'20px', fontSize:'11px'}}>{filteredStaff.length}</span>
          </h2>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <input className="search-inter" placeholder="Search staff..." value={search} onChange={(e)=>setSearch(e.target.value)} autoComplete="off" />
            <button onClick={()=>{ setShowModal(true); setPassError(''); }} style={{padding:'10px 16px', background:'#FACC15', color:'#1E3A8A', border:'none', borderRadius:'12px', fontWeight:'900', cursor:'pointer', display:'flex', gap:'6px', fontSize:'13px'}}><Plus size={16}/> Add Staff</button>
          </div>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:'600px'}}>
            <thead><tr><th className="th-white">NAME</th><th className="th-white">EMAIL</th><th className="th-white">BARANGAY</th><th className="th-white">STATUS</th><th className="th-white" style={{textAlign:'center'}}>ACTION</th></tr></thead>
            <tbody>
              {loading? <tr><td colSpan="5" style={{textAlign:'center', padding:'30px', color:C.muted}}>Loading...</td></tr> : filteredStaff.map(s=>(
                <tr key={s.id} className="row-hover" style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:'12px', fontWeight:'700', fontSize:'13px', color:C.text}}>{s.name}</td>
                  <td style={{padding:'12px', fontSize:'12px', color:C.muted}}>{s.email}</td>
                  <td style={{padding:'12px'}}><span style={{background:C.card2, border:`1px solid ${C.border}`, padding:'4px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:'700', color:C.muted}}>{s.assignedBarangay}</span></td>
                  <td style={{padding:'12px'}}><span className={s.status==='Active'?'badge-active':'badge-inactive'}>{s.status}</span></td>
                  <td style={{padding:'12px'}}><div style={{display:'flex', gap:'8px', justifyContent:'center'}}><button className="icon-btn edit" onClick={()=>handleEdit(s)}><Pencil size={14}/></button><button className="icon-btn delete" onClick={()=>openDeleteAlert(s)}><Trash2 size={14}/></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'12px'}}>
          <div style={{background:C.card, borderRadius:'20px', width:'100%', maxWidth:'400px', overflow:'hidden', border:'2.5px solid #FACC15'}}>
            <div style={{background:'#1E3A8A', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0, color:'white', fontWeight:'900', fontSize:'15px', display:'flex', gap:'8px'}}><Sparkles size={16} color="#FACC15"/> Add Staff</h3>
              <button onClick={()=>{ setShowModal(false); setPassError(''); }} style={{background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><X size={16} color="white"/></button>
            </div>
            <form onSubmit={handleAddStaff} autoComplete="off" style={{display:'flex', flexDirection:'column', gap:'16px', padding:'20px'}}>
              
              <div style={floatWrap}>
                <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} onFocus={()=>setFocused('name')} onBlur={()=>setFocused('')} placeholder={focused==='name' || form.name ? 'Juan Dela Cruz' : ''} style={floatInput(focused==='name' || form.name)} autoComplete="off" required />
                <label style={floatLabel(focused==='name' || form.name, focused==='name')}>Full Name</label>
              </div>

              <div style={floatWrap}>
                <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} onFocus={()=>setFocused('email')} onBlur={()=>setFocused('')} placeholder={focused==='email' || form.email ? 'ex@gmail.com' : ''} style={floatInput(focused==='email' || form.email)} autoComplete="off" required />
                <label style={floatLabel(focused==='email' || form.email, focused==='email')}>Email</label>
              </div>

              <div style={floatWrap}>
                <input type={showPassword? 'text':'password'} value={form.password} onChange={e=>{
                  const v = e.target.value;
                  setForm({...form, password:v});
                  if(passError) setPassError(getPassError(v));
                }} onFocus={()=>setFocused('pass')} onBlur={()=>{
                  setFocused('');
                  if(form.password) setPassError(getPassError(form.password));
                }} placeholder={focused==='pass' || form.password ? 'Min 8 chars with !@#$%' : ''} style={{...floatInput(focused==='pass' || form.password, !!passError), paddingRight:'40px'}} autoComplete="new-password" required />
                <label style={floatLabel(focused==='pass' || form.password, focused==='pass')}>Password</label>
                <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:C.muted}}>{showPassword? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                {passError && <div style={{ marginTop:'6px', fontSize:'11px', fontWeight:'700', color:'#ef4444', display:'flex', gap:'4px', alignItems:'center' }}><AlertTriangle size={12}/> {passError}</div>}
              </div>

              <div style={{position:'relative'}}>
                <select value={form.assignedBarangay} onChange={e=>setForm({...form, assignedBarangay:e.target.value})} style={{width:'100%', padding:'14px 12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontSize:'13px', fontWeight:'600'}} required>
                  {NAIC_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}
                </select>
                <label style={{position:'absolute', left:'12px', top:'-7px', fontSize:'10px', fontWeight:'800', color:'#1E3A8A', background:C.card2, padding:'0 4px'}}>ASSIGNED BARANGAY</label>
              </div>

              <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
                <button type="button" onClick={()=>{ setShowModal(false); setPassError(''); }} style={{flex:1, padding:'12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontWeight:'700', cursor:'pointer'}}>Cancel</button>
                <button type="submit" disabled={creating} style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'#1E3A8A', color:'#FACC15', fontWeight:'800', cursor:'pointer'}}>{creating?'Creating...':'Create Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, padding:'12px'}}>
          <div style={{background:C.card, borderRadius:'20px', width:'100%', maxWidth:'400px', overflow:'hidden', border:'2.5px solid #FACC15'}}>
            <div style={{background:'#1E3A8A', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0, color:'white', fontWeight:'900', fontSize:'15px', display:'flex', gap:'8px'}}><Pencil size={16} color="#FACC15"/> Edit Staff</h3>
              <button onClick={()=>setShowEditModal(false)} style={{background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><X size={16} color="white"/></button>
            </div>
            <form onSubmit={handleUpdateStaff} autoComplete="off" style={{display:'flex', flexDirection:'column', gap:'12px', padding:'20px'}}>
              <input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontSize:'13px', fontWeight:'700'}} required autoComplete="off" />
              <select value={editForm.assignedBarangay} onChange={e=>setEditForm({...editForm, assignedBarangay:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontSize:'13px', fontWeight:'600'}}>
                {NAIC_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}
              </select>
              <select value={editForm.status} onChange={e=>setEditForm({...editForm, status:e.target.value})} style={{padding:'12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontSize:'13px', fontWeight:'700'}}>
                <option value="Active">Active</option><option value="Inactive">Inactive</option>
              </select>
              <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
                <button type="button" onClick={()=>setShowEditModal(false)} style={{flex:1, padding:'12px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontWeight:'700', cursor:'pointer'}}>Cancel</button>
                <button type="submit" style={{flex:1, padding:'12px', borderRadius:'10px', border:'none', background:'#FACC15', color:'#1E3A8A', fontWeight:'900', cursor:'pointer', display:'flex', gap:'6px', justifyContent:'center', alignItems:'center'}}><Save size={16}/> Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteAlert && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:'16px'}}>
          <div style={{background:C.card, borderRadius:'20px', width:'100%', maxWidth:'380px', padding:'24px', textAlign:'center', border:`3px solid #FACC15`}}>
            <div style={{width:'64px', height:'64px', background:'#fef2f2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', border:'2px solid #fecaca'}}><AlertTriangle size={32} color="#DC2626"/></div>
            <h3 style={{margin:'0 0 8px 0', color:C.text, fontWeight:'900', fontSize:'18px'}}>Delete this account?</h3>
            <p style={{margin:'0 0 20px 0', fontSize:'13px', color:C.muted}}>Do you want to delete <b style={{color:C.text}}>{staffToDelete?.name}</b>?</p>
            <div style={{display:'flex', gap:'10px'}}>
              <button onClick={()=>{ setShowDeleteAlert(false); setStaffToDelete(null); }} style={{flex:1, padding:'12px', borderRadius:'12px', border:`1.5px solid ${C.border}`, background:C.card2, color:C.text, fontWeight:'700', cursor:'pointer'}}>Cancel</button>
              <button onClick={confirmDelete} style={{flex:1, padding:'12px', borderRadius:'12px', border:'none', background:'#DC2626', color:'white', fontWeight:'900', cursor:'pointer'}}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessAlert && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:10000, padding:'16px'}}>
          <div style={{background:C.card, borderRadius:'20px', width:'100%', maxWidth:'360px', padding:'24px', textAlign:'center', border:'3px solid #FACC15'}}>
            <div style={{width:'70px', height:'70px', background:'#dcfce7', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px'}}><CheckCircle2 size={36} color="#16a34a" /></div>
            <h3 style={{margin:'0 0 8px 0', color:C.text, fontWeight:'900', fontSize:'18px'}}>Staff Created!</h3>
            <p style={{margin:'0 0 16px 0', fontSize:'13px', color:C.muted}}><b style={{color:C.text}}>{successName}</b> can now login.</p>
            <button onClick={()=>setShowSuccessAlert(false)} style={{width:'100%', padding:'12px', borderRadius:'12px', border:'none', background:'#1E3A8A', color:'#FACC15', fontWeight:'900', cursor:'pointer'}}>OK, Got it!</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminStaffTab;