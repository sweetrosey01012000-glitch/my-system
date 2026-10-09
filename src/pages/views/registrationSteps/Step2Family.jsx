import { Users, Calendar } from 'lucide-react';
import { useState } from 'react';

function Step2({ family, setFamily, errors, setErrors, setSubmitError, toCapital }) {
  const clearErr = (field) => { setErrors(p => ({ ...p, [field]: '' })); setSubmitError(''); };
  const [focusedIdx, setFocusedIdx] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const calcAge = (dobStr) => {
    if (!dobStr) return '';
    let d;
    if (dobStr.includes('/')) { const [mm, dd, yyyy] = dobStr.split('/'); if (!yyyy || yyyy.length !== 4) return ''; d = new Date(`${yyyy}-${mm}-${dd}`); } else d = new Date(dobStr);
    if (isNaN(d)) return '';
    const today = new Date(); let age = today.getFullYear() - d.getFullYear(); const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--; return age >= 0 ? String(age) : '';
  };

  return (
    <div>
      <div className="section-header" style={{ background: 'linear-gradient(90deg, #fef3c7, #fffbeb)', color: '#92400e', border: '1.5px solid #fde68a' }}>
        <Users size={18} /> II. FAMILY COMPOSITION
      </div>

      {family.map((f, i) => {
        const isFocused = focusedIdx === i;
        const isHovered = hoveredIdx === i;
        const hasValue = !!f.dob;
        const showLabelFloat = hasValue || isFocused;

        return (
          <div key={i} style={{ border: '1.5px solid #fde68a', borderRadius: '14px', padding: '14px', marginBottom: '12px', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', background: '#FBBF24', color: '#1E3A8A', padding: '3px 10px', borderRadius: '20px' }}>Member {i + 1} </span>
              {family.length > 1 && <span onClick={() => setFamily(family.filter((_, idx) => idx !== i))} style={{ fontSize: '11px', color: '#fff', cursor: 'pointer', background: '#ef4444', padding: '3px 10px', borderRadius: '20px', fontWeight: '700' }}>Remove</span>}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <input placeholder="Name " value={f.name} onChange={e => { const n = [...family]; n[i].name = toCapital(e.target.value); setFamily(n); clearErr(`familyName_${i}`); }} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1.5px solid #dbeafe', boxSizing: 'border-box', background: '#FFFFFF', fontWeight: '600', color: '#1E3A8A' }} />
              {errors[`familyName_${i}`] && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ {errors[`familyName_${i}`]}</div>}
            </div>

            <div className="grid-2" style={{ gap: '8px', marginBottom: '8px' }}>
              <div>
                <select value={f.relationship} onChange={e => { const n = [...family]; n[i].relationship = e.target.value; setFamily(n); clearErr(`familyRel_${i}`); clearErr(`familyRelationship_${i}`); }} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1.5px solid #dbeafe', boxSizing: 'border-box', background: '#FFFFFF', fontWeight: '600', color: '#1E3A8A' }}>
                  <option value="">Relationship</option><option value="Son">Son</option><option value="Daughter">Daughter</option>
                </select>
                {(errors[`familyRel_${i}`] || errors[`familyRelationship_${i}`]) && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ Required</div>}
              </div>

              <div>
                <div
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ position: 'relative', display: 'flex', alignItems: 'center', border: isFocused ? '2px solid #1E3A8A' : isHovered ? '2px solid #1E3A8A' : '1.5px solid #dbeafe', borderRadius: '10px', background: '#FFFFFF', height: '48px', overflow: 'hidden' }}
                >
                  <div style={{ padding: '0 10px 0 12px', color: isFocused || isHovered ? '#1E3A8A' : '#64748b', display: 'flex', alignItems: 'center' }}><Calendar size={16} /></div>
                  <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label style={{ position: 'absolute', left: '2px', top: showLabelFloat ? '6px' : '50%', transform: showLabelFloat ? 'none' : 'translateY(-50%)', fontSize: showLabelFloat ? '10px' : '12px', color: isFocused ? '#1E3A8A' : '#64748b', fontWeight: showLabelFloat ? '800' : '500', transition: 'all 0.2s ease', pointerEvents: 'none' }}>Date of Birth </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={f.dob || ''}
                      onFocus={() => setFocusedIdx(i)}
                      onBlur={() => { setFocusedIdx(null); setHoveredIdx(null); }}
                      onChange={e => {
                        let raw = e.target.value;
                        let digits = raw.replace(/\D/g, '').slice(0, 8);
                        let formatted = digits;
                        if (digits.length >= 5) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4);
                        else if (digits.length >= 3) formatted = digits.slice(0, 2) + '/' + digits.slice(2);
                        let parts = formatted.split('/');
                        if (parts[0]?.length === 2) { let mm = parseInt(parts[0]); if (mm > 12) parts[0] = '12'; if (mm === 0) parts[0] = '01'; }
                        if (parts[1]?.length === 2) { let dd = parseInt(parts[1]); if (dd > 31) parts[1] = '31'; if (dd === 0) parts[1] = '01'; }
                        if (parts[2]?.length === 4) { let yy = parseInt(parts[2]); const maxY = new Date().getFullYear(); if (yy > maxY) parts[2] = String(maxY); }
                        formatted = parts.join('/').slice(0, 10);
                        const age = calcAge(formatted);
                        // MAX 22 CHECK
                        if (age && parseInt(age) > 22) {
                          setErrors(p => ({ ...p, [`familyDob_${i}`]: 'Max 22 yrs old only' }));
                          const n = [...family]; n[i].dob = formatted; n[i].age = ''; setFamily(n);
                          return;
                        }
                        const n = [...family]; n[i].dob = formatted; n[i].age = age; setFamily(n);
                        clearErr(`familyDob_${i}`); clearErr(`familyAge_${i}`);
                      }}
                      placeholder={isFocused ? "MM/DD/YYYY" : ""}
                      style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '13px', fontWeight: '600', color: '#1E3A8A', padding: showLabelFloat ? '14px 10px 2px 2px' : '2px 10px 2px 2px' }}
                    />
                  </div>
                </div>
                {errors[`familyDob_${i}`] && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ {errors[`familyDob_${i}`]}</div>}
              </div>
            </div>

            <div className="grid-2" style={{ gap: '8px', marginBottom: '8px' }}>
              <div>
                <input placeholder="Age (Auto)" value={f.age || ''} readOnly style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1.5px solid #dbeafe', boxSizing: 'border-box', background: '#f8fafc', fontWeight: '600', color: '#1E3A8A' }} />
              </div>

              <div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', border: '1.5px solid #dbeafe', borderRadius: '10px', background: '#f8fafc', height: '48px', padding: '0 12px' }}>
                  <label style={{ position: 'absolute', top: '6px', left: '12px', fontSize: '10px', fontWeight: '800', color: '#64748b' }}>Civil Status</label>
                  <input value="Single" readOnly style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '700', color: '#1E3A8A', fontSize: '13px', paddingTop: '14px' }} />
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '8px' }}>
              <div>
                <select value={f.educational || ''} onChange={e => { const n = [...family]; n[i].educational = e.target.value; setFamily(n); clearErr(`familyEducational_${i}`); }} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1.5px solid #dbeafe', boxSizing: 'border-box', background: '#FFFFFF', fontWeight: '600', color: '#1E3A8A', fontSize: '12px' }}>
                  <option value="">Educational </option><option value="N/A">N/A</option><option value="Kindergarten">Kindergarten</option><option value="Elementary Level">Elementary Level</option><option value="High School Level">High School Level</option><option value="Senior High School Level">Senior High School Level</option><option value="College Level">College Level</option>
                </select>
                {errors[`familyEducational_${i}`] && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ Required</div>}
              </div>
              <div>
                <select value={f.occupation || ''} onChange={e => { const n = [...family]; n[i].occupation = e.target.value; setFamily(n); clearErr(`familyOccupation_${i}`); }} style={{ width: '100%', padding: '13px', borderRadius: '10px', border: '1.5px solid #dbeafe', boxSizing: 'border-box', background: '#FFFFFF', fontWeight: '600', color: '#1E3A8A' }}>
                  <option value="">Occupation </option><option value="N/A">N/A</option><option value="Student">Student</option><option value="Unemployed">Unemployed</option>
                </select>
                {errors[`familyOccupation_${i}`] && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ Required</div>}
              </div>
            </div>
          </div>
        )
      })}

      <button type="button" onClick={() => setFamily([...family, { name: '', relationship: '', dob: '', age: '', civilStatus: 'Single', educational: '', occupation: '' }])} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px dashed #FBBF24', background: '#fffbeb', cursor: 'pointer', fontSize: '12px', fontWeight: '800', color: '#92400e' }}>+ Add Member</button>
    </div>
  )
}
export default Step2;