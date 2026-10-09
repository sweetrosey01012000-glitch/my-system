import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { soloParentCategories } from '../../data/soloParentCategories';
import { Heart, X, Check, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import FloatingField from './registrationSteps/FloatingField';
import Step1 from './registrationSteps/Step1Identifying';
import Step2 from './registrationSteps/Step2Family';
import Step3 from './registrationSteps/Step3Classification';
import Step4 from './registrationSteps/Step4Emergency';
import Step5 from './registrationSteps/Step5Requirements';
import Step6 from './registrationSteps/Step6Account';

const NAIC_BARANGAYS = ["Bagong Kalsada", "Bancaan", "Bucana Malaki", "Bucana Sasahan", "Calubcob", "Capt. C. Nazareno (Pob.)", "Gombalza (Pob.)", "Halang", "Humbac", "Ibayo Estacion", "Ibayo Silangan", "Kanluran", "Labac", "Latoria", "Maquina", "Malainen Bago", "Malainen Luma", "Molino", "Munting Mapino", "Muzon", "Palangue 1", "Palangue 2 & 3", "Sabang", "San Roque", "Santulan", "Sapa", "Timalan Balsahan", "Timalan Concepcion"];
const toCapital = (str) => { if (!str) return ''; return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' '); };
const onlyLetters = (v) => v.replace(/[^a-zA-Z\s\.\-]/g, '');
const compressImage = (file) => new Promise((resolve) => {
  if (!file.type.startsWith('image/') || file.size < 500 * 1024) { resolve(file); return; }
  const img = new Image(); img.src = URL.createObjectURL(file);
  img.onload = () => {
    const canvas = document.createElement('canvas'); const maxW = 800;
    const scale = Math.min(1, maxW / img.width); canvas.width = img.width * scale; canvas.height = img.height * scale;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.5);
  };
});
const toBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });

function PublicRegisterPage({ isModal = false, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', dob: '', age: '', sex: '', placeOfBirth: '', houseNo: '', barangay: '',
    educationalAttainment: '', civilStatus: '', religion: '', occupation: '', companyAgency: '',
    monthlyIncome: '', employmentStatus: '', contact: '', email: '',
    username: '', password: '', confirmPassword: '',
    pantawidBeneficiary: '', indigenousPerson: '', lgbtq: '',
    emergencyName: '', emergencyAddress: '', emergencyRelationship: '', emergencyContact: '',
    classification: '', needs: ''
  });
  const [reqFiles, setReqFiles] = useState({});
  const [family, setFamily] = useState([{ name: '', relationship: '', dob: '', age: '', civilStatus: 'Single', educational: '', occupation: '' }]);
  const steps = [{ n: 1, label: 'Identifying' }, { n: 2, label: 'Family' }, { n: 3, label: 'Classification' }, { n: 4, label: 'Emergency' }, { n: 5, label: 'Requirements' }, { n: 6, label: 'Account' }];
  const selectedCatData = soloParentCategories.find(c => c.code === selectedCategory);
  const requiredDocs = selectedCatData ? selectedCatData.requirements : [];
  useEffect(() => { setReqFiles({}); }, [selectedCategory]);

  const calcAge = (dobStr) => {
    if (!dobStr) return ''; let d;
    if (dobStr.includes('/')) { const [mm, dd, yyyy] = dobStr.split('/'); if (!yyyy || yyyy.length !== 4) return ''; d = new Date(`${yyyy}-${mm}-${dd}`); } else d = new Date(dobStr);
    if (isNaN(d)) return ''; const today = new Date(); let age = today.getFullYear() - d.getFullYear(); const m = today.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--; return age >= 0 ? String(age) : '';
  };
  const handleDobChange = (raw) => {
    let digits = raw.replace(/\D/g, '').slice(0, 8); let formatted = digits;
    if (digits.length >= 5) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4); else if (digits.length >= 3) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
    let parts = formatted.split('/'); if (parts[0]?.length === 2) { let mm = parseInt(parts[0]); if (mm > 12) parts[0] = '12'; if (mm === 0) parts[0] = '01'; }
    if (parts[1]?.length === 2) { let dd = parseInt(parts[1]); if (dd > 31) parts[1] = '31'; if (dd === 0) parts[1] = '01'; }
    if (parts[2]?.length === 4) { let yy = parseInt(parts[2]); if (yy > new Date().getFullYear()) parts[2] = String(new Date().getFullYear()); if (yy < 1900) parts[2] = '1900'; }
    formatted = parts.join('/').slice(0, 10); const age = calcAge(formatted); setFormData({ ...formData, dob: formatted, age });
  };
  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Minimum 8 characters';
    if (!/[A-Z]/.test(pwd)) return 'Need uppercase';
    if (!/[a-z]/.test(pwd)) return 'Need lowercase';
    if (!/[0-9]/.test(pwd)) return 'Need number';
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd)) return 'Need special char';
    return '';
  };
  const validatePH = (num) => { if (!num) return 'Required'; if (!/^09\d{9}$/.test(num)) return '11 digits (09...)'; return ''; };
  const handleDocFileChange = async (idx, file) => { if (!file) return; const c = await compressImage(file); setReqFiles(p => ({ ...p, [idx]: c })); setErrors(p => ({ ...p, [`doc_${idx}`]: '', requirements: '' })); };
  const removeDocFile = (idx) => { const n = { ...reqFiles }; delete n[idx]; setReqFiles(n); };

  // FIXED - WALANG DOBLENG stepsValid
  const stepsValid = (checkStep = step) => {
    let e = {};
    if (checkStep === 1) {
      if (!selectedCategory) e.category = 'Required';
      if (!formData.fullName.trim()) e.fullName = 'Required';
      if (!formData.dob.trim()) e.dob = 'Required';
      else if (!/^\d{2}\/\d{2}\/\d{4}$/.test(formData.dob)) e.dob = 'MM/DD/YYYY';
      if (!formData.age.trim()) e.age = 'Required';
      if (!formData.sex) e.sex = 'Required';
      if (!formData.barangay) e.barangay = 'Required';
      if (!formData.educationalAttainment) e.educationalAttainment = 'Required';
      if (!formData.civilStatus) e.civilStatus = 'Required';
      if (!formData.monthlyIncome) e.monthlyIncome = 'Required';
      if (!formData.employmentStatus) e.employmentStatus = 'Required';
      if (!formData.contact.trim()) e.contact = 'Required'; else { const c = validatePH(formData.contact); if (c) e.contact = c; }
      if (!formData.pantawidBeneficiary) e.pantawidBeneficiary = 'Required';
      if (!formData.indigenousPerson) e.indigenousPerson = 'Required';
      if (!formData.lgbtq) e.lgbtq = 'Required';
    }
    if (checkStep === 2) {
      family.forEach((f, i) => {
        if (!f.name.trim()) e[`familyName_${i}`] = 'Required';
        if (!f.relationship) e[`familyRelationship_${i}`] = 'Required';
        if (!f.dob) e[`familyDob_${i}`] = 'Required';
        if (!f.educational) e[`familyEducational_${i}`] = 'Required';
        if (!f.occupation) e[`familyOccupation_${i}`] = 'Required';
      });
    }
    if (checkStep === 3) { if (!formData.classification.trim()) e.classification = 'Required'; if (!formData.needs.trim()) e.needs = 'Required'; }
    if (checkStep === 4) { if (!formData.emergencyName.trim()) e.emergencyName = 'Required'; const ph = validatePH(formData.emergencyContact); if (ph) e.emergencyContact = ph; }
    if (checkStep === 5) { if (!selectedCategory) e.requirements = 'Select category'; else { requiredDocs.forEach((_, idx) => { if (!reqFiles[idx]) e[`doc_${idx}`] = 'Required'; }); if (Object.keys(reqFiles).length < requiredDocs.length) e.requirements = `Need ${requiredDocs.length} files`; } }
    if (checkStep === 6) { if (!formData.email.trim()) e.email = 'Required'; else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid'; if (!formData.password) e.password = 'Required'; else { const p = validatePassword(formData.password); if (p) e.password = p; } }
    return e;
  };

  const nextStep = () => {
    const e = stepsValid(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setStep(s => Math.min(s + 1, 6));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let all = {};
    for (let s = 1; s <= 6; s++) all = { ...all, ...stepsValid(s) };
    setErrors(all);
    if (Object.keys(all).length > 0) {
      for (let s = 1; s <= 6; s++) {
        const se = stepsValid(s);
        if (Object.keys(se).length > 0) {
          setStep(s);
          return;
        }
      }
      return;
    }
    setIsSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = cred.user.uid;
      const uploaded = []; for (const [idx, file] of Object.entries(reqFiles)) { const b64 = await toBase64(file); uploaded.push({ index: parseInt(idx), docName: requiredDocs[idx], data: b64, name: file.name }); } uploaded.sort((a, b) => a.index - b.index);
      const fullNameVal = toCapital(formData.fullName);
      await setDoc(doc(db, 'pending_users', uid), {
        uid,
        fullName: fullNameVal,
        name: fullNameVal,
        firstName: fullNameVal.split(' ')[0] || fullNameVal,
        lastName: fullNameVal.split(' ').slice(-1).join(' ') || '',
        dob: formData.dob, age: formData.age, sex: formData.sex, placeOfBirth: toCapital(formData.placeOfBirth),
        barangay: formData.barangay, houseNo: toCapital(formData.houseNo),
        address: `${toCapital(formData.houseNo)}, ${formData.barangay}, Naic, Cavite`,
        educationalAttainment: formData.educationalAttainment, civilStatus: formData.civilStatus, religion: toCapital(formData.religion),
        occupation: toCapital(formData.occupation), companyAgency: toCapital(formData.companyAgency),
        monthlyIncome: formData.monthlyIncome, employmentStatus: formData.employmentStatus,
        pantawidBeneficiary: formData.pantawidBeneficiary, indigenousPerson: formData.indigenousPerson, lgbtq: formData.lgbtq,
        family: family.map(f => ({ name: toCapital(f.name), relationship: f.relationship })),
        classification: formData.classification, needs: formData.needs,
        emergencyName: onlyLetters(toCapital(formData.emergencyName)), emergencyContact: formData.emergencyContact,
        contact: formData.contact, email: formData.email.toLowerCase(),
        category: selectedCategory, categoryTitle: selectedCatData?.title || '',
        requiredDocuments: requiredDocs, requirementDetails: uploaded,
        signatureUrl: signatureData, role: 'solo_parent', status: 'pending', createdAt: serverTimestamp()
      });
      setShowSuccess(true);
      setTimeout(async () => { await signOut(auth); if (isModal && onClose) onClose(); navigate('/'); }, 2500);
    } catch (err) { setSubmitError(err.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#eff6ff 0%,#fffbeb 50%,#eff6ff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Segoe UI', width: '100%' }}>
      <style>{`
        .wrapper{width:100%;max-width:860px;padding:0 16px;box-sizing:border-box}
        .top-bar{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;width:100%;background:linear-gradient(90deg,#1E3A8A 0%,#1e40af 100%);border-radius:16px;margin-top:16px;box-sizing:border-box}
        .stepper{position:relative;display:flex;justify-content:space-between;padding:24px 12px;width:100%;background:#fff;border-radius:16px;margin-top:14px;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1.5px solid #e0e7ff}.stepper::before{content:'';position:absolute;top:42px;left:40px;right:40px;height:4px;background:linear-gradient(90deg,#dbeafe,#fef3c7);border-radius:10px;z-index:0}.step-item{flex:1;display:flex;flex-direction:column;align-items:center;z-index:1;min-width:60px}.step-circle{width:38px;height:38px;border-radius:50%;display:flex!important;align-items:center!important;justify-content:center!important;font-weight:900;font-size:13px;border:3px solid #e5e7eb;background:#fff;color:#9ca3af}.step-circle.active{background:linear-gradient(135deg,#1E3A8A,#2563eb);border-color:#1E3A8A;color:#fff;transform:scale(1.1)}.step-circle.done{background:linear-gradient(135deg,#FBBF24,#f59e0b);border-color:#FBBF24;color:#1E3A8A}.step-label{font-size:9px;font-weight:800;margin-top:6px;color:#6b7280;text-align:center}.step-label.active{color:#1E3A8A}.card{width:100%;background:#fff;border-radius:20px;padding:24px;box-sizing:border-box;margin-top:14px;box-shadow:0 10px 30px rgba(0,0,0,0.08);border:1.5px solid #e0e7ff;border-top:4px solid #FBBF24}.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px} .section-header{padding:12px 14px;border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;font-weight:900;font-size:13px} @media(max-width:600px){ .grid-2{grid-template-columns:1fr}}
      `}</style>

      <div className="wrapper">
        <div className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg,#FBBF24,#f59e0b)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Heart size={20} color="#1E3A8A" fill="#1E3A8A" />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: '900', fontSize: '14px', color: '#fff' }}>SOLO PARENT REGISTRATION</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#fde68a', fontWeight: '600' }}>Step {step} of 6 • DSWD NAIC</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="#fff" />
          </button>
        </div>
        <div className="stepper">
          {steps.map(s => {
            const done = step > s.n;
            const active = step === s.n;
            return (
              <div key={s.n} className="step-item">
                <div className={`step-circle ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                  {done ? <Check size={16} strokeWidth={3} /> : s.n}
                </div>
                <div className={`step-label ${active || done ? 'active' : ''}`}>{s.label}</div>
              </div>
            )
          })}
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} autoComplete="off">
            {step === 1 && <Step1 formData={formData} setFormData={setFormData} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} errors={errors} setErrors={setErrors} setSubmitError={setSubmitError} soloParentCategories={soloParentCategories} NAIC_BARANGAYS={NAIC_BARANGAYS} toCapital={toCapital} handleDobChange={handleDobChange} FloatingField={FloatingField} />}
            {step === 2 && <Step2 family={family} setFamily={setFamily} errors={errors} setErrors={setErrors} setSubmitError={setSubmitError} toCapital={toCapital} />}
            {step === 3 && <Step3 formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} setSubmitError={setSubmitError} FloatingField={FloatingField} />}
            {step === 4 && <Step4 formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} setSubmitError={setSubmitError} onlyLetters={onlyLetters} toCapital={toCapital} FloatingField={FloatingField} />}
            {step === 5 && <Step5 selectedCategory={selectedCategory} requiredDocs={requiredDocs} reqFiles={reqFiles} errors={errors} handleDocFileChange={handleDocFileChange} removeDocFile={removeDocFile} />}
            {step === 6 && <Step6 formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} setSubmitError={setSubmitError} showPassword={showPassword} setShowPassword={setShowPassword} FloatingField={FloatingField} />}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px' }}>
              {step < 6 ? <button type="button" onClick={nextStep} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#1E3A8A,#2563eb)', color: '#fff', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>Next <ChevronRight size={16} /></button> : <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', fontWeight: '800', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>}
            </div>
          </form>
        </div>
      </div>
      {showSuccess && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}><div style={{ background: '#fff', borderRadius: '20px', padding: '24px', maxWidth: '360px', width: '100%', textAlign: 'center', borderTop: '4px solid #10b981' }}><div style={{ width: '64px', height: '64px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><CheckCircle2 size={32} color="#10b981" /></div><h3 style={{ margin: 0, color: '#065f46', fontWeight: '900' }}>Success!</h3><p style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>Pending approval!</p></div></div>)}
    </div>
  );
}
export default PublicRegisterPage;