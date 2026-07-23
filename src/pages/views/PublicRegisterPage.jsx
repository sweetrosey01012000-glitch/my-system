import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { soloParentCategories } from './CategoriesPage';

function PublicRegisterPage({ onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState(location.state?.selectedCategory || '');
  const [documentFiles, setDocumentFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', middleInitial: '', dob: '', age: '', sex: '', 
    placeOfBirth: '', address: '', educationalAttainment: '', civilStatus: '', 
    religion: '', occupation: '', company: '', monthlyIncome: '', employmentStatus: '', 
    contact: '', email: '', pantawid: 'N', indigenous: 'N', lgbtq: 'N', childrenCount: '', 
    classification: '', needs: '', emergencyName: '', emergencyRelationship: '', 
    emergencyAddress: '', emergencyContact: '', password: ''
  });

  const [familyMembers, setFamilyMembers] = useState([
    {name: '', relationship: '', age: '', birthday: '', civil: '', educational: '', occupation: '', monthly: ''}
  ]);

  const activeCategoryObj = soloParentCategories.find(c => c.code === selectedCategory);
  const totalSteps = 5;

  // STYLES
  const styles = {
    container: { width: '100%', padding: '25px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(25px)', boxShadow: '0 25px 70px rgba(0,0,0,0.4)', border: '1px solid rgba(37, 99, 235, 0.2)', position: 'relative', maxHeight: '85vh', overflowY: 'auto' },
    title: { color: '#1e3a8a', marginTop: '0', fontSize: '22px', fontWeight: '900', marginBottom: '5px', textAlign: 'center' },
    stepText: { textAlign: 'center', color: '#64748b', fontSize: '13px', marginBottom: '15px' },
    progressBar: { width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '10px', marginBottom: '20px', overflow: 'hidden' },
    progressFill: { height: '100%', background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', transition: 'width 0.3s' },
    sectionTitle: { gridColumn: '1 / -1', fontSize: '16px', fontWeight: '800', color: '#1e3a8a', borderBottom: '2px solid #fbbf24', paddingBottom: '8px', marginBottom: '15px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    fullWidth: { gridColumn: '1 / -1' },
    formGroup: { marginBottom: '8px', position: 'relative' },
    label: { position: 'absolute', left: '12px', pointerEvents: 'none', top: '14px', fontSize: '14px', color: '#64748b', fontWeight: '600', transition: 'all 0.2s ease-out', background: 'transparent', padding: '0', zIndex: 1 },
    input: { width: '100%', padding: '14px 12px', borderRadius: '10px', border: '2px solid #e2e8f0', boxSizing: 'border-box', background: '#f8fafc', fontSize: '14px', outline: 'none' },
    select: { width: '100%', padding: '14px 12px', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', appearance: 'none' },
    textarea: { width: '100%', padding: '14px 12px', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#f8fafc', fontSize: '14px', minHeight: '80px', resize: 'vertical' },
    fileBox: { border: '2px dashed #1e3a8a', padding: '10px', textAlign: 'center', borderRadius: '10px', background: '#eff6ff' },
    buttonGroup: { display: 'flex', gap: '10px', marginTop: '20px' },
    btnBack: { flex: 1, background: '#e2e8f0', color: '#1e3a8a', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' },
    btnNext: { flex: 2, background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', color: '#1e3a8a', padding: '14px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' },
    linkText: { textAlign: 'center', marginTop: '12px', display: 'block', color: '#1e3a8a', textDecoration: 'none', fontWeight: 'bold', fontSize: '13px' },
    addBtn: { background: '#2563eb', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '12px' },
    th: { background: '#eff6ff', padding: '8px', border: '1px solid #dbeafe' },
    td: { padding: '5px', border: '1px solid #dbeafe' }
  };

  // FLOATING LABEL
  const FloatingInput = ({id, label, type = "text", required = false}) => {
    const isActive = formData[id]!== '';
    return(
      <div style={styles.formGroup}>
        <input id={id} type={type} required={required} placeholder=" " 
          style={{...styles.input, borderColor: isActive? '#2563eb' : '#e2e8f0', boxShadow: isActive? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none' }} 
          value={formData[id] || ''} 
          onChange={(e) => setFormData({...formData, [id]: e.target.value})} 
        />
        <label htmlFor={id} style={{...styles.label, top: isActive? '-10px' : '14px', left: '12px', fontSize: isActive? '12px' : '14px', color: isActive? '#2563eb' : '#64748b', background: isActive? '#f8fafc' : 'transparent', padding: isActive? '0 6px' : '0' }} >
          {label}
        </label>
      </div>
    )
  }

  const handleFileChange = (e, reqName) => {
    const file = e.target.files[0];
    if (file) setDocumentFiles(prev => ({...prev, [reqName]: file }));
  };

  const validatePassword = (pwd) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(pwd);
  
  const handleFamilyChange = (index, field, value) => {
    const newMembers = [...familyMembers];
    newMembers[index][field] = value;
    setFamilyMembers(newMembers);
  };
  
  const addFamilyMember = () => setFamilyMembers([...familyMembers, {name: '', relationship: '', age: '', birthday: '', civil: '', educational: '', occupation: '', monthly: ''}]);
  
  const nextStep = () => {
    if (step === 1 &&!selectedCategory) return alert("Please select a category first.");
    if (step === 4 &&!validatePassword(formData.password)) {
      setPasswordError("Password must be 8+ chars, 1 uppercase, 1 lowercase, 1 number.");
      return;
    }
    setPasswordError('');
    setStep(prev => prev + 1);
  }
  
  const prevStep = () => setStep(prev => prev - 1);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await sendEmailVerification(user);

      const uploadedDocs = {};
      const cloudName = 'dfcemnno8';
      const uploadPreset = 'soloparent_uploads';
      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      const uploadPromises = Object.entries(documentFiles).map(async ([reqName, file]) => {
        const fetchFormData = new FormData();
        fetchFormData.append('file', file);
        fetchFormData.append('upload_preset', uploadPreset);
        fetchFormData.append('folder', `requirements/${user.uid}`);
        const response = await fetch(cloudinaryUrl, { method: 'POST', body: fetchFormData });
        const data = await response.json();
        return { reqName, downloadURL: data.secure_url };
      });

      const uploadedResults = await Promise.all(uploadPromises);
      uploadedResults.forEach(result => { uploadedDocs[result.reqName] = result.downloadURL; });

      const fullName = `${formData.firstName} ${formData.middleInitial || ''}. ${formData.lastName}`;
      
      await setDoc(doc(db, 'pending_users', user.uid), {
        name: fullName,
       ...formData, 
        familyComposition: familyMembers,
        category: selectedCategory, 
        documents: uploadedDocs, 
        role: 'soloparent',
        status: 'pending', 
        denyReason: '', 
        emailVerified: false, 
        registrationDate: new Date().toISOString()
      });

      alert(`Registration submitted! Check ${formData.email} for verification.`);
      await signOut(auth);
      onClose();
      navigate('/');
      
    } catch (error) {
      alert('Failed to register. ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container} className="anim-slide-up">
      <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }} >✕</button>
      <h2 style={styles.title}>Solo Parent Registration</h2>
      <p style={styles.stepText}>Step {step} of {totalSteps}</p>
      <div style={styles.progressBar}><div style={{...styles.progressFill, width: `${(step/totalSteps)*100}%`}}></div></div>
      
      <form onSubmit={handleSubmit}>
        <div style={styles.grid}>
          {step === 1 && <>
            <h3 style={styles.sectionTitle}>Category & Basic Info</h3>
            <div style={styles.fullWidth}>
              <select style={styles.select} value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setDocumentFiles({}); }} required >
                <option value="" disabled>-- Select Solo Parent Category --</option>
                {soloParentCategories.map(cat => ( <option key={cat.code} value={cat.code}> Code {cat.code.toUpperCase()} - {cat.title} </option> ))}
              </select>
            </div>
            <FloatingInput id="firstName" label="First Name" required />
            <FloatingInput id="lastName" label="Last Name" required />
            <FloatingInput id="middleInitial" label="M.I." />
            <FloatingInput id="dob" label="Date of Birth" type="date" required />
            <FloatingInput id="age" label="Age" type="number" />
            <FloatingInput id="placeOfBirth" label="Place of Birth" />
            <div style={styles.fullWidth}><FloatingInput id="address" label="Home Address" required /></div>
          </>}

          {step === 2 && <>
            <h3 style={styles.sectionTitle}>Personal & Employment Details</h3>
            <div style={styles.formGroup}>
              <select style={styles.select} value={formData.sex} onChange={(e) => setFormData({...formData, sex: e.target.value})} required>
                <option value="" disabled>Sex</option><option>Male</option><option>Female</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <select style={styles.select} value={formData.educationalAttainment} onChange={(e) => setFormData({...formData, educationalAttainment: e.target.value})}>
                <option value="" disabled>Educational Attainment</option><option>Elementary</option><option>High School</option><option>College</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <select style={styles.select} value={formData.civilStatus} onChange={(e) => setFormData({...formData, civilStatus: e.target.value})}>
                <option value="" disabled>Civil Status</option><option>Single</option><option>Married</option><option>Widowed</option>
              </select>
            </div>
            <FloatingInput id="religion" label="Religion" />
            <FloatingInput id="occupation" label="Occupation" />
            <FloatingInput id="company" label="Company/Agency" />
            <FloatingInput id="monthlyIncome" label="Monthly Income" type="number" />
            <div style={styles.formGroup}>
              <select style={styles.select} value={formData.employmentStatus} onChange={(e) => setFormData({...formData, employmentStatus: e.target.value})}>
                <option value="" disabled>Employment Status</option><option>Regular</option><option>Casual</option><option>Self-Employed</option>
              </select>
            </div>
            <FloatingInput id="contact" label="Contact Number" required />
            <FloatingInput id="email" label="Email Address" type="email" required />
          </>}

          {step === 3 && <>
            <h3 style={styles.sectionTitle}>Family Composition & Needs</h3>
            <div style={styles.fullWidth}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Name</th><th style={styles.th}>Relationship</th><th style={styles.th}>Age</th></tr></thead>
                <tbody>{familyMembers.map((member, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}><input style={styles.input} value={member.name} onChange={e=>handleFamilyChange(idx,'name',e.target.value)} /></td>
                    <td style={styles.td}><input style={styles.input} value={member.relationship} onChange={e=>handleFamilyChange(idx,'relationship',e.target.value)} /></td>
                    <td style={styles.td}><input style={styles.input} type="number" value={member.age} onChange={e=>handleFamilyChange(idx,'age',e.target.value)} /></td>
                  </tr>
                ))}</tbody>
              </table>
              <button type="button" style={styles.addBtn} onClick={addFamilyMember}>+ Add Member</button>
            </div>
            <div style={styles.fullWidth}><textarea style={styles.textarea} placeholder="Brief Description: Why are you a solo parent?" value={formData.classification} onChange={e=>setFormData({...formData, classification:e.target.value})} /></div>
            <div style={styles.fullWidth}><textarea style={styles.textarea} placeholder="Needs / Problems" value={formData.needs} onChange={e=>setFormData({...formData, needs:e.target.value})} /></div>
          </>}

          {step === 4 && <>
            <h3 style={styles.sectionTitle}>Account Setup & Requirements</h3>
            <div style={{...styles.formGroup,...styles.fullWidth}}>
              <input type={showPassword? "text" : "password"} placeholder=" " style={{...styles.input, borderColor: formData.password? '#2563eb' : '#e2e8f0', paddingRight: '40px'}} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <label style={{...styles.label, top: formData.password? '-10px' : '14px', background: formData.password? '#f8fafc' : 'transparent', padding: formData.password? '0 6px' : '0'}}>Password</label>
              <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '14px', cursor: 'pointer', zIndex: 2 }} > {showPassword? '👁️' : '🔒'} </span>
              {passwordError && <div style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px' }}> {passwordError} </div>}
            </div>
            <div style={styles.fullWidth}>
              <label style={{fontSize: '13px', color: '#1e3a8a', fontWeight: 'bold'}}> Upload Requirements for: {activeCategoryObj?.title} </label>
              {activeCategoryObj && (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginTop: '8px'}}>
                  {activeCategoryObj.requirements.map((req, idx) => (
                    <div key={idx} style={styles.fileBox}>
                      <span style={{fontSize: '11px', color: '#1e3a8a', display: 'block', marginBottom: '6px', fontWeight: 'bold'}}>{req}</span>
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileChange(e, req)} required />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>}

          {step === 5 && <>
            <h3 style={styles.sectionTitle}>Emergency Contact</h3>
            <FloatingInput id="emergencyName" label="Name" />
            <FloatingInput id="emergencyRelationship" label="Relationship" />
            <div style={styles.fullWidth}><FloatingInput id="emergencyAddress" label="Address" /></div>
            <FloatingInput id="emergencyContact" label="Contact Number" />
          </>}
        </div>

        <div style={styles.buttonGroup}>
          {step > 1 && <button type="button" style={styles.btnBack} onClick={prevStep}>Back</button>}
          {step < totalSteps && <button type="button" style={styles.btnNext} onClick={nextStep}>Next</button>}
          {step === totalSteps && <button type="submit" style={styles.btnNext} disabled={isSubmitting}>{isSubmitting? 'Submitting...' : 'Submit Registration'}</button>}
        </div>
        <Link to="/login" style={styles.linkText}>Already have an account? Login here</Link>
      </form>
    </div>
  )
}
export default PublicRegisterPage;