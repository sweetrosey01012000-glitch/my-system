import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { soloParentCategories } from '../../data/soloParentCategories';
import { User, Calendar, MapPin, Home, Mail, Phone, Lock, Eye, EyeOff, X, ChevronRight, ChevronLeft, IdCard, Users, FileText, Check, Heart } from 'lucide-react';

const NAIC_BARANGAYS = ["Bagong Kalsada","Balsahan","Bancaan","Bucana Malaki","Bucana Sasahan","Calubcob","Capt. C. Nazareno (Pob.)","Gombalza (Pob.)","Halang","Humbac","Ibayo Estacion","Ibayo Silangan","Kanluran","Labac","Latoria","Maquina","Malainen Bago","Malainen Luma","Molino","Munting Mapino","Muzon","Palangue 1","Palangue 2 & 3","Sabang","San Roque","Santulan","Sapa","Timalan Balsahan","Timalan Concepcion"];

const FloatingField = ({ id, label, value="", onChange, error, required, icon: Icon, children, type="text" }) => {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasValue = value!== "" && value!== null && value!== undefined;
  const isActive = focused || hasValue;
  return (
    <div style={{width:'100%'}}>
      <div onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)} style={{position:'relative', display:'flex', alignItems:'center', border: error? '2px solid #ef4444' : focused? '2px solid #1E3A8A' : hovered? '2px solid #1E3A8A' : '1.5px solid #dbeafe', borderRadius:'12px', background:'#FFFFFF', height:'52px', transition:'all 0.2s ease', boxShadow: focused? '0 0 0 4px rgba(30,58,138,0.1)' : 'none', overflow:'hidden'}}>
        {Icon && <div style={{paddingLeft:'14px', paddingRight:'10px', color: focused||hovered? '#1E3A8A':'#64748b', display:'flex', alignItems:'center', height:'100%', flexShrink:0}}><Icon size={18}/></div>}
        <div style={{flex:1, position:'relative', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <label htmlFor={id} style={{position:'absolute', left: Icon?'2px':'0px', top: isActive?'6px':'50%', transform: isActive?'none':'translateY(-50%)', fontSize: isActive?'10px':'13px', color: error?'#ef4444': focused?'#1E3A8A':'#64748b', fontWeight: isActive?'800':'500', transition:'all 0.2s ease', pointerEvents:'none', lineHeight:'1'}}>{label} {required && <span style={{color:'#ef4444'}}>*</span>}</label>
          {children? <div style={{height:'100%', display:'flex', alignItems:'flex-end', paddingTop:'14px', paddingBottom:'6px', paddingRight:'10px'}}>{children}</div> : (<input id={id} type={type} autoComplete="off" value={value} onChange={onChange} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontWeight:'600', color:'#1E3A8A', padding: isActive? '16px 10px 2px 2px' : '2px 10px 2px 2px'}} />)}
        </div>
      </div>
      {error && <div style={{color:'#ef4444', fontSize:'11px', fontWeight:'700', marginTop:'3px'}}>⚠ {error}</div>}
    </div>
  )
}

function PublicRegisterPage({ isModal = false, onClose, onSwitchToLogin }){
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [dobFocused, setDobFocused] = useState(false);
  const [dobHovered, setDobHovered] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [passHovered, setPassHovered] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ firstName:'', lastName:'', middleName:'', dob:'', age:'', houseNo:'', barangay:'', contact:'', email:'', password:'', emergencyName:'', emergencyContact:'', classification:'', needs:'' });
  const [family, setFamily] = useState([{name:'', relationship:''}]);
  const steps = [{n:1,label:'Identifying'},{n:2,label:'Family'},{n:3,label:'Classification'},{n:4,label:'Emergency'},{n:5,label:'Account'}];
  const isDobActive = dobFocused || formData.dob;

  const validateStep = (checkStep = step) => {
    let e = {};
    if (checkStep === 1) {
      if (!selectedCategory) e.category = 'Required';
      if (!formData.lastName.trim()) e.lastName = 'Required';
      if (!formData.firstName.trim()) e.firstName = 'Required';
      if (!formData.dob.trim()) e.dob = 'Required';
      else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) e.dob = 'MM/DD/YYYY only';
      if (!formData.age.trim()) e.age = 'Required';
      if (!formData.barangay) e.barangay = 'Required';
      if (!formData.houseNo.trim()) e.houseNo = 'Required';
    }
    if (checkStep === 2) { family.forEach((f, i) => { if (!f.name.trim()) e[`familyName_${i}`] = 'Required'; if (!f.relationship.trim()) e[`familyRel_${i}`] = 'Required'; }); }
    if (checkStep === 3) { if (!formData.classification.trim()) e.classification = 'Required'; if (!formData.needs.trim()) e.needs = 'Required'; }
    if (checkStep === 4) { if (!formData.emergencyName.trim()) e.emergencyName = 'Required'; if (!formData.emergencyContact.trim()) e.emergencyContact = 'Required'; }
    if (checkStep === 5) { if (!formData.contact.trim()) e.contact = 'Required'; if (!formData.email.trim()) e.email = 'Required'; else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email'; if (!formData.password) e.password = 'Required'; else if (formData.password.length < 6) e.password = 'Min 6 chars'; }
    return e;
  };
  const isCurrentStepValid = () => Object.keys(validateStep(step)).length === 0;
  const isAllStepsValid = () => { for (let s = 1; s <= 5; s++) { if (Object.keys(validateStep(s)).length > 0) return false; } return true; };
  const nextStep = () => { const e = validateStep(step); setErrors(e); if (Object.keys(e).length > 0) return; setStep(s => Math.min(s + 1, 5)); window.scrollTo(0, 0); };
  const prevStep = () => { setStep(s => Math.max(s - 1, 1)); window.scrollTo(0, 0); };
  const handleSubmit = async (e) => {
    e.preventDefault(); let allErrors = {}; for (let s = 1; s <= 5; s++) { allErrors = {...allErrors,...validateStep(s) }; } setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) { for (let s = 1; s <= 5; s++) { if (Object.keys(validateStep(s)).length > 0) { setStep(s); alert(`Step ${s} - kumpletuhin muna!`); window.scrollTo(0,0); return; } } return; }
    setIsSubmitting(true);
    try { const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password); await sendEmailVerification(cred.user); await setDoc(doc(db, 'pending_users', cred.user.uid), {...formData, family, category: selectedCategory, status:'pending', registrationDate: new Date().toISOString() }); alert('Registered!'); await signOut(auth); if(isModal && onClose) onClose(); navigate('/'); } catch (err) { alert(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{minHeight: isModal? 'auto' : '100vh', background: isModal? '#fff' : 'linear-gradient(135deg, #eff6ff 0%, #fffbeb 50%, #eff6ff 100%)', display:'flex', flexDirection:'column', alignItems:'center', fontFamily:'Segoe UI', width:'100%'}}>
      <style>{`
     .wrapper{width:100%; max-width:760px; padding:0 16px; box-sizing:border-box}
     .top-bar{display:flex; justify-content:space-between; align-items:center; padding:16px 20px; width:100%; background: linear-gradient(90deg, #1E3A8A 0%, #1e40af 100%); border-radius:16px; margin-top:${isModal? '0' : '16px'}; box-shadow:0 4px 15px rgba(30,58,138,0.2)}
     .stepper{position:relative; display:flex; justify-content:space-between; padding:24px 12px; width:100%; background:#fff; border-radius:16px; margin-top:14px; box-shadow:0 2px 10px rgba(0,0,0,0.05); border:1.5px solid #e0e7ff}
     .stepper::before{content:''; position:absolute; top:42px; left:40px; right:40px; height:4px; background: linear-gradient(90deg, #dbeafe, #fef3c7); border-radius:10px; z-index:0}
     .step-item{flex:1; display:flex; flex-direction:column; align-items:center; z-index:1}
     .step-circle{
        width:44px; height:44px; border-radius:50%;
        display:flex!important; align-items:center!important; justify-content:center!important;
        font-weight:900; font-size:15px;
        border:3px solid #e5e7eb; background:#fff; color:#9ca3af;
        transition:0.3s; box-shadow:0 2px 6px rgba(0,0,0,0.05);
        line-height:1!important; text-align:center!important;
        padding:0!important; margin:0!important;
      }
     .step-circle.active{background: linear-gradient(135deg, #1E3A8A, #2563eb); border-color:#1E3A8A; color:#fff; transform:scale(1.15); box-shadow:0 0 0 5px rgba(30,58,138,0.15), 0 4px 12px rgba(30,58,138,0.3)}
     .step-circle.done{background: linear-gradient(135deg, #FBBF24, #f59e0b); border-color:#FBBF24; color:#1E3A8A; box-shadow:0 2px 8px rgba(251,191,36,0.4)}
     .step-label{font-size:11px; font-weight:800; margin-top:8px; color:#6b7280; text-align:center}
     .step-label.active{color:#1E3A8A}
     .card{width:100%; background:#fff; border-radius:20px; padding:24px; box-sizing:border-box; margin-top:14px; box-shadow:0 10px 30px rgba(0,0,0,0.08); border:1.5px solid #e0e7ff; border-top:4px solid #FBBF24; position:relative; overflow:hidden}
     .card::before{content:''; position:absolute; top:0; left:0; right:0; height:4px; background: linear-gradient(90deg, #1E3A8A 0%, #FBBF24 50%, #1E3A8A 100%)}
     .grid-2{display:grid; grid-template-columns:1fr 1fr; gap:12px}
     .section-header{padding:12px 14px; border-radius:12px; margin-bottom:12px; display:flex; align-items:center; gap:8px; font-weight:900; font-size:13px}
      input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, input:-webkit-autofill:active{ -webkit-box-shadow: 0 0 0 30px #FFFFFF inset!important; -webkit-text-fill-color: #1E3A8A!important; transition: background-color 5000s ease-in-out 0s!important; }
      input, select, textarea { background: #FFFFFF!important; }
      @media(max-width:600px){.grid-2{grid-template-columns:1fr}}
      `}</style>

      <div className="wrapper">
        <div className="top-bar">
          <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
            <div style={{width:'40px', height:'40px', background:'linear-gradient(135deg, #FBBF24, #f59e0b)', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center'}}><Heart size={20} color="#1E3A8A" fill="#1E3A8A"/></div>
            <div><p style={{margin:0, fontWeight:'900', fontSize:'14px', color:'#fff'}}>SOLO PARENT</p><p style={{margin:0, fontSize:'10px', color:'#fde68a', fontWeight:'600'}}>DSWD • NAIC, CAVITE 💛</p></div>
          </div>
          <button onClick={()=> isModal? onClose() : navigate('/')} style={{background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.3)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}><X size={18} color="#fff"/></button>
        </div>

        <div className="stepper">
          {steps.map(s=>{ const isDone = step > s.n; const isActive = step === s.n; return (<div key={s.n} className="step-item"><div className={`step-circle ${isDone?'done':''} ${isActive?'active':''}`}><span style={{display:'flex', alignItems:'center', justifyContent:'center', width:'100%', height:'100%'}}>{isDone? <Check size={18} strokeWidth={3}/> : s.n}</span></div><div className={`step-label ${isActive||isDone?'active':''}`}>{s.label}</div></div>) })}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} autoComplete="off">
            {step===1 && (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div className="section-header" style={{background:'linear-gradient(90deg, #dbeafe, #eff6ff)', color:'#1E3A8A', border:'1.5px solid #bfdbfe'}}><FileText size={18}/> I. IDENTIFYING INFORMATION <span style={{marginLeft:'auto', background:'#1E3A8A', color:'#fff', padding:'2px 8px', borderRadius:'20px', fontSize:'10px'}}>REQUIRED</span></div>
                <FloatingField id="category" label="Solo Parent Category" required error={errors.category} icon={IdCard} value={selectedCategory}>
                  <select value={selectedCategory} onChange={e=>{setSelectedCategory(e.target.value); setErrors(p=>({...p,category:''}))}} style={{width:'100%', height:'100%', border:'none', outline:'none', background:'transparent', fontSize:'13px', fontWeight:'600', color:'#1E3A8A'}}><option value=""></option>{soloParentCategories.map(c=><option key={c.code} value={c.code}>{String(c.code).toLowerCase()} - {c.title}</option>)}</select>
                </FloatingField>
                <div className="grid-2">
                  <FloatingField id="lastName" label="Last Name" required value={formData.lastName} error={errors.lastName} onChange={e=>setFormData({...formData, lastName:e.target.value})} />
                  <FloatingField id="firstName" label="First Name" required icon={User} value={formData.firstName} error={errors.firstName} onChange={e=>setFormData({...formData, firstName:e.target.value})} />
                </div>
                <FloatingField id="middleName" label="Middle Name" value={formData.middleName} onChange={e=>setFormData({...formData, middleName:e.target.value})} />
                <div className="grid-2">
                  <div style={{width:'100%'}}>
                    <div onMouseEnter={()=>setDobHovered(true)} onMouseLeave={()=>setDobHovered(false)} style={{position:'relative', display:'flex', alignItems:'center', border: errors.dob? '2px solid #ef4444' : dobFocused? '2px solid #1E3A8A' : dobHovered? '2px solid #1E3A8A' : '1.5px solid #dbeafe', borderRadius:'12px', background:'#FFFFFF', height:'52px', transition:'all 0.2s ease', boxShadow: dobFocused? '0 0 0 4px rgba(30,58,138,0.1)' : 'none', overflow:'hidden'}}>
                      <div style={{padding:'0 10px 0 14px', color: dobFocused||dobHovered? '#1E3A8A':'#64748b', display:'flex', alignItems:'center'}}><Calendar size={18}/></div>
                      <div style={{flex:1, position:'relative', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                        <label htmlFor="dob" style={{position:'absolute', left:'2px', top: isDobActive? '6px':'50%', transform: isDobActive? 'none':'translateY(-50%)', fontSize: isDobActive? '10px':'13px', color: errors.dob? '#ef4444' : dobFocused? '#1E3A8A':'#64748b', fontWeight: isDobActive? '800':'500', transition:'all 0.2s ease', pointerEvents:'none', lineHeight:'1'}}>Date of Birth <span style={{color:'#ef4444'}}>*</span></label>
                        <input id="dob" type="text" autoComplete="off" value={formData.dob} onChange={(e)=>{ let v = e.target.value.replace(/\D/g,'').slice(0,8); if(v.length >= 5) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4); else if(v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2); setFormData({...formData, dob: v}); }} onFocus={()=>setDobFocused(true)} onBlur={()=>setDobFocused(false)} placeholder={isDobActive? "MM/DD/YYYY" : ""} style={{width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', fontWeight:'600', color:'#1E3A8A', padding: isDobActive? '16px 8px 2px 2px' : '2px 8px 2px 2px'}}/>
                      </div>
                    </div>
                    {errors.dob && <div style={{color:'#ef4444', fontSize:'11px', fontWeight:'700', marginTop:'3px'}}>⚠ {errors.dob}</div>}
                  </div>
                  <FloatingField id="age" label="Age" required value={formData.age} error={errors.age} onChange={e=>setFormData({...formData, age:e.target.value.replace(/\D/g,'')})} />
                </div>
                <FloatingField id="barangay" label="Barangay" required icon={MapPin} value={formData.barangay} error={errors.barangay}><select value={formData.barangay} onChange={e=>setFormData({...formData, barangay:e.target.value})} style={{width:'100%', height:'100%', border:'none', outline:'none', background:'transparent', fontWeight:'600', color:'#1E3A8A'}}><option value=""></option>{NAIC_BARANGAYS.map((b,i)=><option key={i} value={b}>{b}</option>)}</select></FloatingField>
                <FloatingField id="houseNo" label="House No. + Street" required icon={Home} value={formData.houseNo} error={errors.houseNo} onChange={e=>setFormData({...formData, houseNo:e.target.value})} />
              </div>
            )}
            {step===2 && (
              <div>
                <div className="section-header" style={{background:'linear-gradient(90deg, #fef3c7, #fffbeb)', color:'#92400e', border:'1.5px solid #fde68a'}}><Users size={18}/> II. FAMILY COMPOSITION</div>
                {family.map((f,i)=>(
                  <div key={i} style={{border:'1.5px solid #fde68a', borderRadius:'14px', padding:'14px', marginBottom:'12px', background:'#fff'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}><span style={{fontSize:'11px', fontWeight:'800', background:'#FBBF24', color:'#1E3A8A', padding:'3px 10px', borderRadius:'20px'}}>Member {i+1} *</span>{family.length>1 && <span onClick={()=>setFamily(family.filter((_,idx)=>idx!==i))} style={{fontSize:'11px', color:'#fff', cursor:'pointer', background:'#ef4444', padding:'3px 10px', borderRadius:'20px', fontWeight:'700'}}>Remove</span>}</div>
                    <div className="grid-2">
                      <input placeholder="👤 Name *" value={f.name} onChange={e=>{ const n=[...family]; n[i].name=e.target.value; setFamily(n); }} style={{width:'100%', padding:'13px', borderRadius:'10px', border:'1.5px solid #e5e7eb', boxSizing:'border-box', background:'#FFFFFF'}}/>
                      <input placeholder="❤️ Relationship *" value={f.relationship} onChange={e=>{ const n=[...family]; n[i].relationship=e.target.value; setFamily(n); }} style={{width:'100%', padding:'13px', borderRadius:'10px', border:'1.5px solid #e5e7eb', boxSizing:'border-box', background:'#FFFFFF'}}/>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={()=>setFamily([...family, {name:'', relationship:''}])} style={{width:'100%', padding:'14px', borderRadius:'12px', border:'2px dashed #FBBF24', background:'#fffbeb', cursor:'pointer', fontSize:'12px', fontWeight:'800', color:'#92400e'}}>+ Add Member</button>
              </div>
            )}
            {step===3 && (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div className="section-header" style={{background:'#dbeafe', color:'#1E3A8A', border:'1.5px solid #bfdbfe'}}>📝 III & IV. CLASSIFICATION & NEEDS</div>
                <div style={{background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #dbeafe'}}>
                  <label style={{fontSize:'11px', fontWeight:'800', color:'#1E3A8A'}}>Dahilan bakit naging solo parent? *</label>
                  <textarea value={formData.classification} onChange={e=>setFormData({...formData, classification:e.target.value})} placeholder="Ikwento..." style={{width:'100%', minHeight:'90px', padding:'12px', borderRadius:'10px', border:'1.5px solid #bfdbfe', marginTop:'6px', boxSizing:'border-box', background:'#FFFFFF'}}/>
                </div>
                <div style={{background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #fde68a'}}>
                  <label style={{fontSize:'11px', fontWeight:'800', color:'#92400e'}}>Kinakailangan / Problema? *</label>
                  <textarea value={formData.needs} onChange={e=>setFormData({...formData, needs:e.target.value})} placeholder="Ano pangangailangan..." style={{width:'100%', minHeight:'90px', padding:'12px', borderRadius:'10px', border:'1.5px solid #fde68a', marginTop:'6px', boxSizing:'border-box', background:'#FFFFFF'}}/>
                </div>
              </div>
            )}
            {step===4 && (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div className="section-header" style={{background:'#fee2e2', color:'#991b1b', border:'1.5px solid #fecaca'}}>🚨 V. IN CASE OF EMERGENCY</div>
                <div style={{background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #fecaca'}}>
                  <FloatingField id="emName" label="Emergency Name" required error={errors.emergencyName} icon={User} value={formData.emergencyName} onChange={e=>setFormData({...formData, emergencyName:e.target.value})} />
                  <div style={{height:'12px'}}></div>
                  <FloatingField id="emContact" label="Emergency Contact" required error={errors.emergencyContact} icon={Phone} value={formData.emergencyContact} onChange={e=>setFormData({...formData, emergencyContact:e.target.value.replace(/\D/g,'')})} />
                </div>
              </div>
            )}
            {step===5 && (
              <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                <div className="section-header" style={{background:'#d1fae5', color:'#065f46', border:'1.5px solid #a7f3d0'}}>🔐 ACCOUNT SETUP</div>
                <div style={{background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #a7f3d0', display:'flex', flexDirection:'column', gap:'12px'}}>
                  <FloatingField id="contact" label="Contact Number" required error={errors.contact} icon={Phone} value={formData.contact} onChange={e=>setFormData({...formData, contact:e.target.value.replace(/\D/g,'')})} />
                  <FloatingField id="email" label="Email Address" required icon={Mail} type="email" value={formData.email} error={errors.email} onChange={e=>setFormData({...formData, email:e.target.value})} />
                  <div style={{width:'100%'}}>
                    <div onMouseEnter={()=>setPassHovered(true)} onMouseLeave={()=>setPassHovered(false)} style={{position:'relative', display:'flex', alignItems:'center', border: errors.password? '2px solid #ef4444': passFocused? '2px solid #1E3A8A' : passHovered? '2px solid #1E3A8A' : '1.5px solid #a7f3d0', borderRadius:'12px', background:'#FFFFFF', height:'52px', transition:'all 0.2s ease', boxShadow: passFocused? '0 0 0 4px rgba(30,58,138,0.1)' : 'none', overflow:'hidden'}}>
                      <div style={{paddingLeft:'14px', paddingRight:'10px', color: passFocused||passHovered? '#1E3A8A':'#059669', display:'flex', alignItems:'center'}}><Lock size={18}/></div>
                      <div style={{flex:1, position:'relative', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center'}}>
                        <label htmlFor="password" style={{position:'absolute', left:'2px', top: formData.password||passFocused? '6px':'50%', transform: formData.password||passFocused? 'none':'translateY(-50%)', fontSize: formData.password||passFocused? '10px':'13px', color: errors.password?'#ef4444':'#065f46', fontWeight: formData.password||passFocused? '800':'500', pointerEvents:'none', transition:'all 0.2s ease', lineHeight:'1'}}>Password <span style={{color:'#ef4444'}}>*</span></label>
                        <input id="password" type={showPassword?'text':'password'} autoComplete="new-password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} onFocus={()=>setPassFocused(true)} onBlur={()=>setPassFocused(false)} style={{width:'100%', border:'none', outline:'none', background:'transparent', fontSize:'14px', color:'#1E3A8A', fontWeight:'600', padding: formData.password||passFocused? '16px 8px 2px 2px' : '2px 8px 2px 2px'}}/>
                      </div>
                      <div style={{paddingRight:'12px', cursor:'pointer', color:'#059669', display:'flex', alignItems:'center'}} onClick={()=>setShowPassword(!showPassword)}>{showPassword? <EyeOff size={18}/> : <Eye size={18}/>}</div>
                    </div>
                    {errors.password && <div style={{color:'#ef4444', fontSize:'11px', fontWeight:'700', marginTop:'3px'}}>⚠ {errors.password}</div>}
                  </div>
                </div>
              </div>
            )}
            <div style={{display:'flex', gap:'12px', marginTop:'24px'}}>
              {step>1? <button type="button" onClick={prevStep} style={{flex:1, padding:'15px', borderRadius:'14px', border:'2px solid #1E3A8A', background:'#fff', color:'#1E3A8A', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><ChevronLeft size={18}/> Back</button> : <div style={{flex:1}}/>}
              {step<5 && <button type="button" onClick={nextStep} style={{flex:1, padding:'15px', borderRadius:'14px', border:'none', background: isCurrentStepValid()? '#1E3A8A' : '#9ca3af', color:'#fff', fontWeight:'900', cursor: isCurrentStepValid()? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>Next <ChevronRight size={18}/></button>}
              {step===5 && <button type="submit" disabled={isSubmitting ||!isAllStepsValid()} style={{flex:1, padding:'15px', borderRadius:'14px', border:'none', background: isAllStepsValid()? '#FACC15' : '#9ca3af', color: isAllStepsValid()? '#1E3A8A' : '#fff', fontWeight:'900', cursor: isAllStepsValid()? 'pointer' : 'not-allowed'}}>{isSubmitting?'Submitting...':'🚀 Submit'}</button>}
            </div>
            <p style={{textAlign:'center', fontSize:'12px', marginTop:'20px', color:'#64748b', background:'#f8fafc', padding:'10px', borderRadius:'10px'}}> Already have an account? <span onClick={()=>{ if(isModal && onSwitchToLogin) onSwitchToLogin(); else navigate('/'); }} style={{color:'#1E3A8A', fontWeight:'800', cursor:'pointer', textDecoration:'underline', marginLeft:'4px'}}>Login here </span> </p>
          </form>
        </div>
      </div>
    </div>
  );
}
export default PublicRegisterPage;