import React, { useState, useEffect } from 'react';
import { Edit, Save, X } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

function ProfileSP({ soloparentData, userId }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const defaultDependents = Array(5).fill(null).map(() => ({ name: '', dob: '', age: '', relationship: '' }));

  useEffect(() => {
    if(soloparentData) {
      const deps = soloparentData.dependents && soloparentData.dependents.length > 0 
     ? [...soloparentData.dependents,...defaultDependents].slice(0,5)
        : defaultDependents;
      
      setFormData({...soloparentData, dependents: deps});
    }
  }, [soloparentData]);

  if(!soloparentData) return <p style={{textAlign: 'center', padding: '20px'}}>Loading...</p>

  const handleChange = (e) => {
    setFormData(prev => ({...prev, [e.target.name]: e.target.value || ""}));
  }

  const handleDependentChange = (index, field, value) => {
    const newDeps = [...formData.dependents];
    newDeps[index] = {...newDeps[index], [field]: value || ""};
    
    if(field === 'dob' && value) {
      const birth = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      newDeps[index].age = age > 0? age.toString() : "";
    }
    
    setFormData({...formData, dependents: newDeps});
  }

  const handleSave = async () => {
    // DEBUG: Check muna kung may userId
    if(!userId) {
      alert("ERROR: Walang userId. Hindi ma-sasave.");
      console.error("userId is undefined");
      return;
    }

    try {
      // Gawing super clean. Tanggalin lahat ng undefined
      const cleanData = {};
      for(const key in formData) {
        if(key === 'dependents') {
          cleanData[key] = formData[key].map(dep => ({
            name: String(dep.name || ""),
            dob: String(dep.dob || ""),
            age: String(dep.age || ""),
            relationship: String(dep.relationship || "")
          }))
        } else {
          cleanData[key] = String(formData[key] || "");
        }
      }

      console.log("Saving to:", userId);
      console.log("Data:", cleanData);

      const docRef = doc(db, "soloparent", userId);
      await updateDoc(docRef, cleanData);

      setIsEditing(false);
      alert("Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("FULL ERROR OBJECT: ", err);
      alert("Error updating: " + err.message + "\n\nCheck console F12 for details");
    }
  }

  const handleCancel = () => {
    setFormData(soloparentData);
    setIsEditing(false);
  }

  const d = formData;

  return ( 
    <div style={{
      background: 'white', 
      border: '1px solid #E2E8F0', 
      borderRadius: '8px', 
      padding: '16px', 
      maxWidth: '900px', 
      margin: '0 auto',
      width: '100%', // DAGDAG
      boxSizing: 'border-box' // DAGDAG
    }}> 
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '2px solid #1E3A8A', paddingBottom: '10px', flexWrap: 'wrap', gap: '8px'}}> 
        <h2 style={{margin: 0, fontSize: '16px', color: '#1E3A8A', fontWeight: '700'}}>PROFILE INFORMATION</h2> 
        {!isEditing? 
          <button onClick={() => setIsEditing(true)} style={btnEdit}><Edit size={14}/> Edit</button> 
          : 
          <div style={{display: 'flex', gap: '8px'}}>
            <button onClick={handleSave} style={btnSave}><Save size={14}/> Save</button> 
            <button onClick={handleCancel} style={btnCancel}><X size={14}/> Cancel</button> 
          </div> 
        } 
      </div> 
  
      {/* PROFILE PIC + INFO */}
      <div style={{display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap'}}>
        <div><img src={d.profilePic} style={{width: '100px', height: '120px', border: '1px solid #000', objectFit: 'cover'}}/></div>
        <div style={{flex: 1, minWidth: '250px'}}>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px 12px', fontSize: '12px'}}>
            <div><label style={labelStyle}>NAME</label>{isEditing? <input name="name" value={d.name || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.name}</span>}</div>
            <div><label style={labelStyle}>ID NUMBER</label>{isEditing? <input name="idNumber" value={d.idNumber || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.idNumber}</span>}</div>
          </div>
        </div>
      </div>
  
      {/* MAIN INFO GRID - AUTO STACK SA MOBILE */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px 12px', fontSize: '12px', marginBottom: '16px'}}>
        <div><label style={labelStyle}>BIRTH DATE</label>{isEditing? <input type="text" placeholder="MM/DD/YYYY" name="birthDate" value={d.birthDate || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.birthDate}</span>}</div>
        <div><label style={labelStyle}>BIRTH PLACE</label>{isEditing? <input name="birthPlace" value={d.birthPlace || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.birthPlace}</span>}</div>
        <div><label style={labelStyle}>ADDRESS</label>{isEditing? <input name="address" value={d.address || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.address}</span>}</div>
        <div><label style={labelStyle}>CATEGORY</label>{isEditing? <input name="category" value={d.category || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.category}</span>}</div>
        <div><label style={labelStyle}>BQC</label>{isEditing? <input name="bqc" value={d.bqc || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.bqc}</span>}</div>
        <div><label style={labelStyle}>VALID UNTIL</label>{isEditing? <input type="text" placeholder="MM/DD/YYYY" name="validUntil" value={d.validUntil || ''} onChange={handleChange} style={inputStyle}/> : <span style={{color: 'red', fontWeight: '700'}}>{d.validUntil}</span>}</div>
      </div>
  
      <h3 style={sectionTitle}>DEPENDENTS</h3> 
      {/* SCROLLABLE TABLE SA MOBILE */}
      <div style={{overflowX: 'auto', marginBottom: '16px'}}>
        <table style={{width: '100%', minWidth: '500px', borderCollapse: 'collapse', fontSize: '11px'}}> 
          <thead><tr style={{background: '#F1F5F9'}}><th style={thStyle}>NAME</th><th style={thStyle}>DATE OF BIRTH</th><th style={thStyle}>AGE</th><th style={thStyle}>RELATIONSHIP</th></tr></thead> 
          <tbody> 
            {d.dependents?.map((dep, i) => ( 
              <tr key={i}> 
                <td style={tdStyle}>{isEditing? <input value={dep.name} onChange={e => handleDependentChange(i,'name',e.target.value)} style={inputStyle}/> : dep.name}</td> 
                <td style={tdStyle}>{isEditing? <input type="text" placeholder="MM/DD/YYYY" value={dep.dob} onChange={e => handleDependentChange(i,'dob',e.target.value)} style={inputStyle}/> : dep.dob}</td> 
                <td style={tdStyle}>{dep.age}</td> 
                <td style={tdStyle}>{isEditing? <input value={dep.relationship} onChange={e => handleDependentChange(i,'relationship',e.target.value)} style={inputStyle}/> : dep.relationship}</td> 
              </tr> 
            ))} 
          </tbody> 
        </table> 
      </div>
  
      <h3 style={sectionTitle}>EMERGENCY CONTACT</h3> 
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px 12px', fontSize: '12px'}}>
        <div><label style={labelStyle}>NAME</label>{isEditing? <input name="emergencyName" value={d.emergencyName || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.emergencyName}</span>}</div>
        <div><label style={labelStyle}>CONTACT</label>{isEditing? <input name="emergencyContact" value={d.emergencyContact || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.emergencyContact}</span>}</div>
        <div style={{gridColumn: '1 / -1'}}><label style={labelStyle}>ADDRESS</label>{isEditing? <input name="emergencyAddress" value={d.emergencyAddress || ''} onChange={handleChange} style={inputStyle}/> : <span>{d.emergencyAddress}</span>}</div>
      </div> 
    </div> 
  )
  }
const labelStyle = {fontWeight: '700', color: '#1E3A8A'}
const inputStyle = {width: '100%', padding: '4px 6px', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '12px', height: '26px'}
const thStyle = {border: '1px solid #CBD5E1', padding: '4px', textAlign: 'center', fontWeight: '700', background: '#F1F5F9'}
const tdStyle = {border: '1px solid #CBD5E1', padding: '2px'}
const sectionTitle = {marginTop: '20px', fontSize: '13px', color: '#1E3A8A', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', fontWeight: '700'}
const btnEdit = {background: '#1E3A8A', color: '#FACC15', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'}
const btnSave = {background: '#16A34A', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'}
const btnCancel = {background: '#DC2626', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px'}

export default ProfileSP;