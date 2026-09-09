import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import { soloParentCategories as localCategories } from '../../../data/soloParentCategories';

function AdminConfigTab({ showToast }) {
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({ 
    idValidity: '1', 
    autoVerify: false, 
    maintenanceMode: false,
    maxFamilyMembers: '5',
    requireEmergencyContact: true
  });
  const [loading, setLoading] = useState(true);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({ code: '', title: '', requirements: '' });

  useEffect(() => {
    const load = async () => {
      const catSnap = await getDocs(collection(db, 'system_categories'));
      if (catSnap.empty) setCategories(localCategories);
      else setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const setSnap = await getDocs(collection(db, 'system_config'));
      const setDocData = setSnap.docs.find(d => d.id === 'settings');
      if (setDocData) setSettings(prev => ({ ...prev, ...setDocData.data() }));
      setLoading(false);
    };
    load();
  }, []);

  const saveCategory = async () => {
    if (!catForm.code || !catForm.title) return alert('Code and Title required');
    const reqArray = catForm.requirements.split('\n').filter(r => r.trim() !== '');
    const data = { code: catForm.code.toLowerCase(), title: catForm.title, requirements: reqArray };
    if (editingCat) await setDoc(doc(db, 'system_categories', editingCat.id), data);
    else await addDoc(collection(db, 'system_categories'), data);
    setShowCatModal(false); window.location.reload();
  };
  const deleteCategory = async (id) => { if (!confirm('Delete?')) return; await deleteDoc(doc(db, 'system_categories', id)); setCategories(c=>c.filter(x=>x.id!==id)); };
  const saveSettings = async () => { await setDoc(doc(db, 'system_config', 'settings'), settings); showToast?.('Settings saved'); };

  if (loading) return <div style={{padding:'20px', fontSize:'13px'}}>Loading...</div>;

  return (
    <div style={{padding:'0 12px'}}>
      <style>{`
        .config-card{background:#fff; border-radius:14px; border:1.5px solid #fde68a; padding:16px}
        .tab-row{display:flex; gap:8px; margin-bottom:16px}
        .tab-btn{padding:8px 16px; border-radius:20px; border:1.5px solid #1E3A8A; cursor:pointer; font-weight:700; font-size:12px}
        .tab-active{background:#1E3A8A; color:#FACC15}
        .tab-inactive{background:#fff; color:#1E3A8A}
        .item-card{padding:12px; border-radius:10px; border:1.5px solid #fef3c7; background:#fffbeb; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center}
        .input{width:100%; padding:10px; border:1.5px solid #e5e7eb; border-radius:8px; font-size:13px; box-sizing:border-box}
        .btn{padding:9px 16px; background:#1E3A8A; color:#FACC15; border-radius:8px; border:none; cursor:pointer; font-weight:700; font-size:12px; display:flex; align-items:center; gap:6px}
        @media(max-width:768px){.config-card{padding:12px}}
      `}</style>

      <div className="config-card">
        <div className="tab-row">
          <button onClick={()=>setActiveTab('categories')} className={`tab-btn ${activeTab==='categories'?'tab-active':'tab-inactive'}`}>Categories</button>
          <button onClick={()=>setActiveTab('system')} className={`tab-btn ${activeTab==='system'?'tab-active':'tab-inactive'}`}>System Config</button>
        </div>

        {activeTab==='categories' && (
          <div>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'12px', alignItems:'center'}}><h3 style={{margin:0, color:'#1E3A8A', fontSize:'14px', fontWeight:'900'}}>Solo Parent Categories</h3><button className="btn" onClick={()=>{setCatForm({code:'',title:'',requirements:''}); setEditingCat(null); setShowCatModal(true);}}><Plus size={14}/>Add Category</button></div>
            {categories.map(cat=>(
              <div key={cat.id||cat.code} className="item-card">
                <div><b style={{color:'#1E3A8A', fontSize:'13px'}}>{cat.code}</b> - <span style={{fontSize:'13px'}}>{cat.title}</span><div style={{fontSize:'11px', color:'#64748b'}}>{(cat.requirements||[]).length} requirements</div></div>
                <div style={{display:'flex', gap:'6px'}}><button style={{background:'#e0e7ff', border:'1px solid #c7d2fe', borderRadius:'6px', padding:'6px', cursor:'pointer'}} onClick={()=>{setEditingCat(cat); setCatForm({code:cat.code, title:cat.title, requirements:(cat.requirements||[]).join('\n')}); setShowCatModal(true);}}><Edit2 size={12}/></button><button style={{background:'#fee2e2', border:'1px solid #fecaca', borderRadius:'6px', padding:'6px', cursor:'pointer'}} onClick={()=>deleteCategory(cat.id)}><Trash2 size={12}/></button></div>
              </div>
            ))}
          </div>
        )}

        {activeTab==='system' && (
          <div style={{display:'flex', flexDirection:'column', gap:'14px', maxWidth:'420px'}}>
            <h3 style={{margin:0, color:'#1E3A8A', fontSize:'14px', fontWeight:'900'}}>System Configuration</h3>
            
            <div style={{background:'#f8fafc', padding:'12px', borderRadius:'10px', border:'1.5px solid #e2e8f0'}}>
              <label style={{fontSize:'12px', fontWeight:'700'}}>ID Validity (Years)</label>
              <input className="input" style={{marginTop:'6px'}} type="number" value={settings.idValidity} onChange={e=>setSettings({...settings, idValidity:e.target.value})}/>
              <div style={{fontSize:'10px', color:'#64748b', marginTop:'4px'}}>Ilang taon valid ang Solo Parent ID</div>
            </div>

            <div style={{background:'#f8fafc', padding:'12px', borderRadius:'10px', border:'1.5px solid #e2e8f0'}}>
              <label style={{fontSize:'12px', fontWeight:'700'}}>Max Family Members</label>
              <input className="input" style={{marginTop:'6px'}} type="number" value={settings.maxFamilyMembers} onChange={e=>setSettings({...settings, maxFamilyMembers:e.target.value})}/>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'10px', background:'#f8fafc', padding:'12px', borderRadius:'10px', border:'1.5px solid #e2e8f0'}}>
              <label style={{display:'flex', gap:'8px', alignItems:'center', fontSize:'13px', cursor:'pointer'}}><input type="checkbox" checked={settings.autoVerify} onChange={e=>setSettings({...settings, autoVerify:e.target.checked})}/> Auto-verify new registrations</label>
              <label style={{display:'flex', gap:'8px', alignItems:'center', fontSize:'13px', cursor:'pointer'}}><input type="checkbox" checked={settings.requireEmergencyContact} onChange={e=>setSettings({...settings, requireEmergencyContact:e.target.checked})}/> Require Emergency Contact</label>
              <label style={{display:'flex', gap:'8px', alignItems:'center', fontSize:'13px', cursor:'pointer'}}><input type="checkbox" checked={settings.maintenanceMode} onChange={e=>setSettings({...settings, maintenanceMode:e.target.checked})}/> Maintenance Mode</label>
            </div>

            <button className="btn" onClick={saveSettings} style={{justifyContent:'center'}}><Save size={14}/> Save Settings</button>
          </div>
        )}
      </div>

      {showCatModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'12px'}}>
          <div style={{background:'#fff', padding:'16px', borderRadius:'12px', width:'100%', maxWidth:'400px', border:'1.5px solid #FACC15'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><b>{editingCat?'Edit':'Add'} Category</b><X size={16} style={{cursor:'pointer'}} onClick={()=>setShowCatModal(false)}/></div>
            <input className="input" placeholder="Code e.g. a1" value={catForm.code} onChange={e=>setCatForm({...catForm, code:e.target.value})}/>
            <input className="input" style={{marginTop:'8px'}} placeholder="Title" value={catForm.title} onChange={e=>setCatForm({...catForm, title:e.target.value})}/>
            <textarea className="input" style={{marginTop:'8px', height:'90px'}} placeholder="Requirements (one per line)" value={catForm.requirements} onChange={e=>setCatForm({...catForm, requirements:e.target.value})}/>
            <button className="btn" style={{width:'100%', marginTop:'10px', justifyContent:'center'}} onClick={saveCategory}><Save size={14}/>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminConfigTab;