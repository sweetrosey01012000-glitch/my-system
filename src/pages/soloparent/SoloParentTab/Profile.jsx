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
    if(!userId) {
      alert("ERROR: Walang userId. Hindi ma-sasave.");
      return;
    }
    try {
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
      const docRef = doc(db, "soloparent", userId);
      await updateDoc(docRef, cleanData);
      setIsEditing(false);
      alert("Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      console.error("FULL ERROR OBJECT: ", err);
      alert("Error updating: " + err.message);
    }
  }

  const handleCancel = () => {
    setFormData(soloparentData);
    setIsEditing(false);
  }

  const d = formData;

  const styles = {
    container: {
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: "'Poppins', system-ui, sans-serif",
      background: '#F8FAFC'
    },
    card: {
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '28px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '16px',
      borderBottom: '2px solid #1E3A8A',
      marginBottom: '24px',
      flexWrap: 'wrap',
      gap: '12px'
    },
    title: {
      fontSize: '20px',
      fontWeight: '700',
      color: '#1E3A8A',
      letterSpacing: '0.5px',
      margin: 0
    },
    // BAGONG LAYOUT: PIC + NAME/ID = 1 GROUP
    topSection: {
      display: 'grid',
      gridTemplateColumns: 'auto 1fr', // auto for pic+name, 1fr for details
      gap: '32px',
      marginBottom: '28px',
      paddingBottom: '24px',
      borderBottom: '1px solid #E2E8F0',
      alignItems: 'start'
    },
    profileIdentity: { // PIC + NAME/ID DITO MAGKASAMA
      display: 'flex',
      gap: '20px',
      alignItems: 'flex-start'
    },
    avatar: {
      width: '130px',
      height: '150px',
      borderRadius: '10px',
      border: '2px solid #1E3A8A',
      objectFit: 'cover',
      flexShrink: 0
    },
    nameIdBlock: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      paddingTop: '4px'
    },
    detailsGrid: { // 3 COLUMNS SA DESKTOP
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '18px 24px'
    },
    label: {
      fontSize: '11px',
      fontWeight: '600',
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: '0.6px',
      marginBottom: '4px'
    },
    value: {
      fontSize: '15px',
      fontWeight: '500',
      color: '#1E293B'
    },
    valueName: {
      fontSize: '24px',
      fontWeight: '700',
      color: '#1E3A8A',
      lineHeight: '1.2'
    },
    valueId: {
      fontSize: '18px',
      fontWeight: '700',
      color: '#1E3A8A'
    },
    valueWarning: {
      color: '#DC2626',
      fontWeight: '700'
    },
    section: {
      marginBottom: '32px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      color: '#1E3A8A',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #E2E8F0'
    },
    tableWrapper: {
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      overflowX: 'auto'
    },
    table: {
      width: '100%',
      minWidth: '500px',
      borderCollapse: 'collapse',
      fontSize: '14px'
    },
    thead: {
      background: '#FEF3C7'
    },
    th: {
      textAlign: 'left',
      padding: '12px 16px',
      fontWeight: '700',
      fontSize: '12px',
      color: '#1E3A8A',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: {
      padding: '14px 16px',
      borderTop: '1px solid #E2E8F0',
      color: '#334155'
    },
    emergencyCard: {
      background: '#EFF6FF',
      border: '1px solid #BFDBFE',
      borderRadius: '12px',
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px'
    },
    input: {
      width: '100%',
      padding: '8px 10px',
      border: '1px solid #CBD5E1',
      borderRadius: '6px',
      fontSize: '14px',
      fontFamily: "'Poppins', system-ui, sans-serif"
    }
  };

  // MOBILE: STACK LAHAT
  const isMobile = typeof window!== 'undefined' && window.innerWidth < 900;
  if(isMobile) {
    styles.topSection.gridTemplateColumns = '1fr';
    styles.profileIdentity.flexDirection = 'row';
    styles.profileIdentity.alignItems = 'center';
    styles.detailsGrid.gridTemplateColumns = '1fr 1fr';
    styles.emergencyCard.gridTemplateColumns = '1fr';
    styles.avatar.width = '100px';
    styles.avatar.height = '120px';
    styles.valueName.fontSize = '20px';
  }
  if(typeof window!== 'undefined' && window.innerWidth < 500) {
    styles.detailsGrid.gridTemplateColumns = '1fr';
  }

  const btnBase = {
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: "'Poppins', system-ui, sans-serif"
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={styles.title}>PROFILE INFORMATION</h2>
          {!isEditing?
            <button onClick={() => setIsEditing(true)} style={{...btnBase, background: '#1E3A8A', color: '#FACC15'}}><Edit size={14}/> Edit</button>
            :
            <div style={{display: 'flex', gap: '8px'}}>
              <button onClick={handleSave} style={{...btnBase, background: '#16A34A', color: 'white'}}><Save size={14}/> Save</button>
              <button onClick={handleCancel} style={{...btnBase, background: '#DC2626', color: 'white'}}><X size={14}/> Cancel</button>
            </div>
          }
        </div>

        {/* TOP SECTION */}
        <div style={styles.topSection}>
          {/* LEFT: PIC + NAME/ID NA MAGKASAMA */}
          <div style={styles.profileIdentity}>
            <img src={d.profilePic} alt="Profile" style={styles.avatar} />
            <div style={styles.nameIdBlock}>
              <div>
                <div style={styles.label}>Name</div>
                <div style={styles.valueName}>{d.name}</div>
              </div>
              <div>
                <div style={styles.label}>ID Number</div>
                <div style={styles.valueId}>{d.idNumber}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS 3 COLUMNS */}
          <div style={styles.detailsGrid}>
            <div>
              <div style={styles.label}>Birth Date</div>
              {isEditing? <input type="text" placeholder="MM/DD/YYYY" name="birthDate" value={d.birthDate || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.birthDate}</div>}
            </div>
            <div>
              <div style={styles.label}>Birth Place</div>
              {isEditing? <input name="birthPlace" value={d.birthPlace || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.birthPlace}</div>}
            </div>
            <div>
              <div style={styles.label}>Address</div>
              {isEditing? <input name="address" value={d.address || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.address}</div>}
            </div>
            <div>
              <div style={styles.label}>Category</div>
              {isEditing? <input name="category" value={d.category || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.category}</div>}
            </div>
            <div>
              <div style={styles.label}>BQC</div>
              {isEditing? <input name="bqc" value={d.bqc || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.bqc}</div>}
            </div>
            <div>
              <div style={styles.label}>Valid Until</div>
              {isEditing? <input type="text" placeholder="MM/DD/YYYY" name="validUntil" value={d.validUntil || ''} onChange={handleChange} style={styles.input}/> : <div style={{...styles.value,...styles.valueWarning}}>{d.validUntil}</div>}
            </div>
          </div>
        </div>

        {/* DEPENDENTS SECTION */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>DEPENDENTS</h3>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.thead}>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Date of Birth</th>
                  <th style={styles.th}>Age</th>
                  <th style={styles.th}>Relationship</th>
                </tr>
              </thead>
              <tbody>
                {d.dependents?.map((dep, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{isEditing? <input value={dep.name} onChange={e => handleDependentChange(i,'name',e.target.value)} style={styles.input}/> : dep.name}</td>
                    <td style={styles.td}>{isEditing? <input type="text" placeholder="MM/DD/YYYY" value={dep.dob} onChange={e => handleDependentChange(i,'dob',e.target.value)} style={styles.input}/> : dep.dob}</td>
                    <td style={styles.td}>{dep.age}</td>
                    <td style={styles.td}>{isEditing? <input value={dep.relationship} onChange={e => handleDependentChange(i,'relationship',e.target.value)} style={styles.input}/> : dep.relationship}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EMERGENCY CONTACT SECTION */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>EMERGENCY CONTACT</h3>
          <div style={styles.emergencyCard}>
            <div>
              <div style={styles.label}>Name</div>
              {isEditing? <input name="emergencyName" value={d.emergencyName || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.emergencyName}</div>}
            </div>
            <div>
              <div style={styles.label}>Contact</div>
              {isEditing? <input name="emergencyContact" value={d.emergencyContact || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.emergencyContact}</div>}
            </div>
            <div>
              <div style={styles.label}>Address</div>
              {isEditing? <input name="emergencyAddress" value={d.emergencyAddress || ''} onChange={handleChange} style={styles.input}/> : <div style={styles.value}>{d.emergencyAddress}</div>}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfileSP;