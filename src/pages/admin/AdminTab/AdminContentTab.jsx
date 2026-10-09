import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Plus, X, Eye, Pencil, Trash2, Save, CheckCircle2, Megaphone, Image as ImageIcon, MapPin, Users, AlertTriangle, Sparkles, Calendar, Tag } from 'lucide-react';

const NAIC_BARANGAYS = ["All Barangays","Bagong Kalsada","Balsahan","Bancaan","Bucana Malaki","Bucana Sasahan","Calubcob","Capt. C. Nazareno (Pob.)","Gombalza (Pob.)","Halang","Humbac","Ibayo Estacion","Ibayo Silangan","Kanluran","Labac","Latoria","Maquina","Malainen Bago","Malainen Luma","Molino","Munting Mapino","Muzon","Palangue 1","Palangue 2 & 3","Sabang","San Roque","Santulan","Sapa","Timalan Balsahan","Timalan Concepcion"];

function AdminContentTab() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selected, setSelected] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [focused, setFocused] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [form, setForm] = useState({ title:'', details:'', category:'Event', benefitCode:'All', barangay:'All Barangays', mediaUrl:'', mediaType:'' });

  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  useEffect(() => {
    const sync = () => setIsDark(localStorage.getItem('sp_dark') === 'true');
    window.addEventListener('sp_theme_changed', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('sp_theme_changed', sync); window.removeEventListener('storage', sync); };
  }, []);

  const C = isDark? { bg:'#0f1219', card:'#1a1f2e', card2:'#232a3d', border:'#2a334d', text:'#e8edf5', muted:'#8a94a8' } : { bg:'#f6f7fb', card:'#ffffff', card2:'#f8f9fc', border:'#e8eaf0', text:'#121827', muted:'#6b7280' };

  const formatDate = (d) => {
    if(!d) return 'N/A';
    const date = d.toDate? d.toDate() : new Date(d);
    return date.toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' });
  };

  useEffect(() => {
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map(d=>({ id:d.id,...d.data() })));
      setLoading(false);
    }, (err)=>{ console.log(err); setLoading(false); });
    return () => unsub();
  }, []);

  // BASE64 BES! NO STORAGE NEEDED!
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 800000){ alert("Bes max 800KB lang image para kasya sa Firestore Bes! Compress mo muna Bes!"); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
      setForm(prev=>({...prev, mediaUrl: reader.result, mediaType: file.type.startsWith('image')?'image':'video' }));
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if(!form.title.trim() ||!form.details.trim()) return;
    setUploading(true);
    try{
      await addDoc(collection(db, 'announcements'), {
        title: form.title.trim(),
        details: form.details.trim(),
        content: form.details.trim(),
        category: form.category,
        benefitCode: form.benefitCode, targetBenefit: form.benefitCode,
        barangay: form.barangay, targetBarangay: form.barangay,
        mediaUrl: form.mediaUrl || '',
        mediaType: form.mediaType || '',
        status:'Published', createdBy:'Admin',
        createdAt: serverTimestamp(), publishedAt: serverTimestamp()
      });
      setShowCreate(false);
      setForm({ title:'', details:'', category:'Event', benefitCode:'All', barangay:'All Barangays', mediaUrl:'', mediaType:'' });
      setMediaPreview(''); setFocused(''); setShowSuccess(true);
      setTimeout(()=>setShowSuccess(false), 3000);
    }catch(err){ alert(err.message); console.log(err); }
    finally{ setUploading(false); }
  };

  const handleView = (item) => { setSelected(item); setShowView(true); };
  const handleEditOpen = (item) => { setSelected(item); setForm({ title: item.title, details: item.details || item.content || '', category: item.category || 'Event', benefitCode: item.benefitCode || 'All', barangay: item.barangay || 'All Barangays', mediaUrl: item.mediaUrl || '', mediaType: item.mediaType || '' }); setMediaPreview(item.mediaUrl || ''); setShowEdit(true); };
  const handleEditSave = async (e) => {
    e.preventDefault();
    try{
      await updateDoc(doc(db, 'announcements', selected.id), {
        title: form.title, details: form.details, content: form.details,
        category: form.category, benefitCode: form.benefitCode, targetBenefit: form.benefitCode,
        barangay: form.barangay, targetBarangay: form.barangay,
        mediaUrl: form.mediaUrl, mediaType: form.mediaType,
        updatedAt: serverTimestamp()
      });
      setShowEdit(false); setMediaPreview(''); setForm({ title:'', details:'', category:'Event', benefitCode:'All', barangay:'All Barangays', mediaUrl:'', mediaType:'' });
    }catch(err){ alert(err.message); }
  };

  const openDelete = (item) => { setItemToDelete(item); setShowDelete(true); };
  const confirmDelete = async () => { await deleteDoc(doc(db, 'announcements', itemToDelete.id)); setShowDelete(false); setItemToDelete(null); };

  const catColor = (cat) => {
    if(cat==='Urgent') return { bg:isDark?'#3a1f1f':'#fef2f2', color:'#dc2626', border:'#fecaca' };
    if(cat==='Event') return { bg:isDark?'#1f2333':'#eff6ff', color:'#2563eb', border:'#bfdbfe' };
    if(cat==='Meeting') return { bg:isDark?'#2a2342':'#f5f3ff', color:'#7c3aed', border:'#ddd6fe' };
    if(cat==='Distribution') return { bg:isDark?'#14331f':'#f0fdf4', color:'#16a34a', border:'#bbf7d0' };
    return { bg:isDark?'#332a0f':'#fefce8', color:'#ca8a04', border:'#fde68a' };
  };

  return (
    <div style={{ fontFamily:"'Inter', sans-serif", background:C.bg, minHeight:'100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{font-family:'Inter', sans-serif!important;}.ann-card{background:${C.card};border:1.5px solid ${C.border};border-radius:16px;overflow:hidden;transition:all 0.2s ease;}.ann-card:hover{border-color:#FACC15;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.08);}.ann-media{width:100%;height:180px;object-fit:cover;background:${C.card2};}`}</style>

      <div style={{background:C.card, border:`1.5px solid ${C.border}`, borderRadius:'16px', padding:'18px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
        <div>
          <h2 style={{margin:'0 0 4px 0', color:C.text, fontSize:'18px', fontWeight:'900', display:'flex', gap:'10px', alignItems:'center'}}><div style={{width:'38px',height:'38px',background:'#1E3A8A',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center'}}><Megaphone size={18} color="#FACC15"/></div>Announcements</h2>
          <p style={{margin:0, fontSize:'12px', color:C.muted}}>{announcements.length} Published!</p>
        </div>
        <button onClick={()=>{ setShowCreate(true); setForm({ title:'', details:'', category:'Event', benefitCode:'All', barangay:'All Barangays', mediaUrl:'', mediaType:'' }); setMediaPreview(''); }} style={{padding:'11px 18px',background:'#1E3A8A',color:'#FACC15',border:'none',borderRadius:'12px',fontWeight:'800',cursor:'pointer',display:'flex',gap:'8px',fontSize:'13px',alignItems:'center'}}><Plus size={16}/> Create New</button>
      </div>

      {loading? <p style={{textAlign:'center',padding:'40px',color:C.muted}}>Loading...</p> : announcements.length===0? (
        <div style={{background:C.card,border:`1.5px dashed ${C.border}`,borderRadius:'16px',padding:'40px',textAlign:'center'}}><Megaphone size={32} color={C.muted} style={{margin:'0 auto 12px'}}/><p style={{color:C.muted,fontSize:'13px',fontWeight:'600'}}>No announcements yet</p></div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'14px'}}>
          {announcements.map(item=>{
            const cc = catColor(item.category);
            return (
              <div key={item.id} className="ann-card">
                {item.mediaUrl && <img src={item.mediaUrl} className="ann-media" />}
                <div style={{padding:'14px'}}>
                  <div style={{display:'flex',gap:'6px',marginBottom:'10px',flexWrap:'wrap'}}>
                    <span style={{background:cc.bg,color:cc.color,border:`1px solid ${cc.border}`,padding:'4px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'800',display:'flex',gap:'4px',alignItems:'center'}}><Tag size={10}/>{item.category}</span>
                    <span style={{background:'#1E3A8A',color:'#FACC15',padding:'4px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'800'}}>{item.benefitCode || 'All'}</span>
                    <span style={{background:C.card2,border:`1px solid ${C.border}`,padding:'4px 10px',borderRadius:'20px',fontSize:'10px',fontWeight:'700',color:C.muted}}><MapPin size={10}/>{item.barangay || 'All'}</span>
                  </div>
                  <h4 style={{margin:'0 0 6px 0',color:C.text,fontWeight:'800',fontSize:'14.5px'}}>{item.title}</h4>
                  <p style={{margin:'0 0 12px 0',color:C.muted,fontSize:'12.5px',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{item.details || item.content}</p>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingTop:'10px',borderTop:`1px solid ${C.border}`}}>
                    <span style={{fontSize:'11px',color:C.muted,display:'flex',gap:'4px',alignItems:'center'}}><Calendar size={11}/>{formatDate(item.createdAt)}</span>
                    <div style={{display:'flex',gap:'6px'}}>
                      <button onClick={()=>handleView(item)} style={{width:'30px',height:'30px',borderRadius:'8px',border:`1px solid ${C.border}`,background:C.card2,cursor:'pointer'}}><Eye size={14}/></button>
                      <button onClick={()=>handleEditOpen(item)} style={{width:'30px',height:'30px',borderRadius:'8px',border:`1px solid ${C.border}`,background:C.card2,cursor:'pointer'}}><Pencil size={14}/></button>
                      <button onClick={()=>openDelete(item)} style={{width:'30px',height:'30px',borderRadius:'8px',border:`1px solid #fecaca`,background:isDark?'#3a1f1f':'#fef2f2',cursor:'pointer',color:'#dc2626'}}><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showCreate || showEdit) && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'12px'}}>
          <div style={{background:C.card,borderRadius:'20px',width:'100%',maxWidth:'520px',maxHeight:'92vh',overflowY:'auto',border:`1.5px solid ${C.border}`}}>
            <div style={{background:C.card,padding:'18px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:`1px solid ${C.border}`,position:'sticky',top:0,zIndex:1}}>
              <h3 style={{margin:0,color:C.text,fontWeight:'900',fontSize:'15px',display:'flex',gap:'10px',alignItems:'center'}}><div style={{width:'32px',height:'32px',background:'#1E3A8A',borderRadius:'10px',display:'flex',alignItems:'center',justifyContent:'center'}}><Sparkles size={16} color="#FACC15"/></div>{showCreate?'Create':'Edit'} Announcement</h3>
              <button onClick={()=>{setShowCreate(false); setShowEdit(false); setMediaPreview('');}} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:'10px',width:'32px',height:'32px',cursor:'pointer'}}><X size={16} color={C.muted}/></button>
            </div>
            <form onSubmit={showCreate? handleCreate : handleEditSave} autoComplete="off" style={{display:'flex',flexDirection:'column',gap:'14px',padding:'20px'}}>
              <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} placeholder="Title *" style={{width:'100%',padding:'14px 12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:'13px',fontWeight:'600'}} required />
              <textarea value={form.details} onChange={e=>setForm({...form, details:e.target.value})} placeholder="Details *" rows={4} style={{width:'100%',padding:'14px 12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:'13px'}} required />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={{padding:'14px 12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:'13px',fontWeight:'600'}}><option>Event</option><option>Reminder</option><option>Urgent</option><option>Meeting</option><option>Distribution</option></select>
                <select value={form.benefitCode} onChange={e=>setForm({...form, benefitCode:e.target.value})} style={{padding:'14px 12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:'13px',fontWeight:'600'}}><option value="All">All Parents</option><option value="A">Benefit A</option><option value="B">Benefit B</option><option value="A&B">A&B</option></select>
              </div>
              <select value={form.barangay} onChange={e=>setForm({...form, barangay:e.target.value})} style={{padding:'14px 12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontSize:'13px',fontWeight:'600'}}>{NAIC_BARANGAYS.map(b=><option key={b} value={b}>{b}</option>)}</select>
              <div style={{border:`1.5px dashed ${C.border}`,borderRadius:'12px',padding:'14px',background:C.card2}}>
                <label style={{fontSize:'11px',fontWeight:'800',color:C.text,display:'flex',gap:'6px',alignItems:'center',marginBottom:'8px'}}><ImageIcon size={14}/> Upload Image </label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{width:'100%',fontSize:'12px',color:C.muted}} />
                {mediaPreview && <div style={{marginTop:'10px',borderRadius:'12px',overflow:'hidden',border:`1px solid ${C.border}`}}><img src={mediaPreview} style={{width:'100%',maxHeight:'200px',objectFit:'cover'}}/></div>}
              </div>
              <div style={{display:'flex',gap:'10px'}}><button type="button" onClick={()=>{setShowCreate(false); setShowEdit(false);}} style={{flex:1,padding:'12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontWeight:'700',cursor:'pointer'}}>Cancel</button><button type="submit" disabled={uploading} style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',background:'#1E3A8A',color:'#FACC15',fontWeight:'800',cursor:'pointer'}}>{uploading?'Publishing...': showCreate?'Publish Now':'Save'}</button></div>
            </form>
          </div>
        </div>
      )}

      {showView && selected && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(10px)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'}} onClick={()=>setShowView(false)}>
          <div style={{background:C.card,borderRadius:'20px',width:'100%',maxWidth:'520px',overflow:'hidden',border:`1.5px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
            {selected.mediaUrl && <img src={selected.mediaUrl} style={{width:'100%',maxHeight:'300px',objectFit:'cover'}}/>}
            <div style={{padding:'18px'}}><h3 style={{margin:'0 0 8px 0',color:C.text,fontWeight:'900'}}>{selected.title}</h3><p style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:'12px',padding:'14px',fontSize:'13px',color:C.text,whiteSpace:'pre-wrap'}}>{selected.details || selected.content}</p></div>
          </div>
        </div>
      )}

      {showDelete && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(10px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:'16px'}}>
          <div style={{background:C.card,borderRadius:'20px',width:'100%',maxWidth:'360px',padding:'24px',textAlign:'center',border:`1.5px solid ${C.border}`}}>
            <div style={{width:'64px',height:'64px',background:isDark?'#3a1f1f':'#fef2f2',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><AlertTriangle size={32} color="#DC2626"/></div>
            <h3 style={{margin:'0 0 8px 0',color:C.text,fontWeight:'800'}}>Delete this?</h3>
            <p style={{margin:'0 0 20px 0',fontSize:'13px',color:C.muted}}><b style={{color:C.text}}>{itemToDelete?.title}</b> will be deleted.</p>
            <div style={{display:'flex',gap:'10px'}}><button onClick={()=>setShowDelete(false)} style={{flex:1,padding:'12px',borderRadius:'12px',border:`1.5px solid ${C.border}`,background:C.card2,color:C.text,fontWeight:'700'}}>Cancel</button><button onClick={confirmDelete} style={{flex:1,padding:'12px',borderRadius:'12px',border:'none',background:'#DC2626',color:'white',fontWeight:'800'}}>Delete</button></div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{position:'fixed',inset:0,background:'rgba(15,18,25,0.4)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10000,padding:'16px'}}>
          <div style={{background:'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',borderRadius:'24px',width:'100%',maxWidth:'340px',padding:'30px 24px',textAlign:'center',border:'1px solid rgba(250,204,21,0.3)',boxShadow:'0 24px 64px rgba(30,58,138,0.4)',animation:'pop 0.35s cubic-bezier(0.34,1.56,0.64,1)'}}>
            <div style={{width:'72px',height:'72px',background:'rgba(255,255,255,0.12)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',border:'1.5px solid rgba(250,204,21,0.4)'}}><CheckCircle2 size={38} color="#FACC15"/></div>
            <h3 style={{margin:'0 0 6px 0',color:'white',fontWeight:'900',fontSize:'18px'}}>Announcement Published!</h3>
            <p style={{margin:'0 0 20px 0',fontSize:'13px',color:'rgba(255,255,255,0.75)'}}>Successful • Live now Bes!</p>
            <button onClick={()=>setShowSuccess(false)} style={{width:'100%',padding:'12px',borderRadius:'12px',border:'none',background:'#FACC15',color:'#1E3A8A',fontWeight:'800',cursor:'pointer',fontSize:'13px'}}>Awesome!</button>
          </div>
          <style>{`@keyframes pop{0%{transform:scale(0.85);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}
    </div>
  );
}
export default AdminContentTab;