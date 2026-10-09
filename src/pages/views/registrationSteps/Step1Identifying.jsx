import { FileText, IdCard, User, Calendar, MapPin, Home, VenusAndMars, HeartHandshake, Banknote, Users, Briefcase, Building2, Mail, Phone, BookOpen, Cross } from 'lucide-react';
import { useState } from 'react';

function Step1({ formData, setFormData, selectedCategory, setSelectedCategory, errors, setErrors, setSubmitError, soloParentCategories, NAIC_BARANGAYS, toCapital, handleDobChange, FloatingField }) {
  const [dobFocused, setDobFocused] = useState(false);
  const [dobHovered, setDobHovered] = useState(false);
  const clearErr = (f) => { setErrors(p => ({...p, [f]: ''})); setSubmitError(''); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="section-header" style={{ background: 'linear-gradient(90deg, #dbeafe, #eff6ff)', color: '#1E3A8A', border: '1.5px solid #bfdbfe' }}>
        <FileText size={18}/> I. IDENTIFYING INFORMATION
      </div>

      <FloatingField id="category" label="Solo Parent Category" required error={errors.category} icon={IdCard} value={selectedCategory}>
        <select value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); clearErr('category'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', fontWeight: '600', color: '#1E3A8A' }}>
          <option value=""></option>{soloParentCategories.map(c => <option key={c.code} value={c.code}>{String(c.code).toUpperCase()} - {c.title}</option>)}
        </select>
      </FloatingField>

      <FloatingField id="fullName" label="Full Name (Last, First, Middle)" required icon={User} value={formData.fullName} error={errors.fullName} onChange={e => { setFormData({...formData, fullName: toCapital(e.target.value)}); clearErr('fullName'); }} />

      <div className="grid-2">
        <div style={{ width: '100%' }}>
          <div onMouseEnter={() => setDobHovered(true)} onMouseLeave={() => setDobHovered(false)} style={{ position: 'relative', display: 'flex', alignItems: 'center', border: dobFocused? '2px solid #1E3A8A' : dobHovered? '2px solid #1E3A8A' : '1.5px solid #dbeafe', borderRadius: '12px', background: '#FFFFFF', height: '52px', overflow: 'hidden' }}>
            <div style={{ padding: '0 10px 0 14px', color: dobFocused || dobHovered? '#1E3A8A' : '#64748b', display: 'flex', alignItems: 'center' }}><Calendar size={18}/></div>
            <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label style={{ position: 'absolute', left: '2px', top: formData.dob || dobFocused? '6px' : '50%', transform: formData.dob || dobFocused? 'none' : 'translateY(-50%)', fontSize: formData.dob || dobFocused? '10px' : '13px', color: dobFocused? '#1E3A8A' : '#64748b', fontWeight: formData.dob || dobFocused? '800' : '500', transition: 'all 0.2s ease', pointerEvents: 'none' }}>Date of Birth </label>
              <input type="text" inputMode="numeric" value={formData.dob} onChange={e => { handleDobChange(e.target.value); clearErr('dob'); clearErr('age'); }} onFocus={() => setDobFocused(true)} onBlur={() => setDobHovered(false)} placeholder={dobFocused? "MM/DD/YYYY" : ""} style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', fontWeight: '600', color: '#1E3A8A', padding: formData.dob || dobFocused? '16px 10px 2px 2px' : '2px 10px 2px 2px' }} />
            </div>
          </div>
          {errors.dob && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ {errors.dob}</div>}
        </div>
        <FloatingField id="age" label="Age" required value={formData.age} error={errors.age} />
      </div>

      <div className="grid-2">
        <FloatingField id="placeOfBirth" label="Place of Birth" icon={MapPin} value={formData.placeOfBirth} error={errors.placeOfBirth} onChange={e => { setFormData({...formData, placeOfBirth: toCapital(e.target.value)}); clearErr('placeOfBirth'); }} />
        <FloatingField id="sex" label="Sex" required icon={VenusAndMars} value={formData.sex} error={errors.sex}>
          <select value={formData.sex || ''} onChange={e => { setFormData({...formData, sex: e.target.value}); clearErr('sex'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option><option value="Female">Female</option><option value="Male">Male</option>
          </select>
        </FloatingField>
      </div>

      <div className="grid-2">
        <FloatingField id="barangay" label="Barangay / Address" required icon={Home} value={formData.barangay} error={errors.barangay}>
          <select value={formData.barangay} onChange={e => { setFormData({...formData, barangay: e.target.value}); clearErr('barangay'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option>{NAIC_BARANGAYS.map((b,i)=><option key={i} value={b}>{b}</option>)}
          </select>
        </FloatingField>
        <FloatingField id="houseNo" label="House No. + Street" icon={Home} value={formData.houseNo} error={errors.houseNo} onChange={e => { setFormData({...formData, houseNo: toCapital(e.target.value)}); clearErr('houseNo'); }} />
      </div>

      <FloatingField id="educationalAttainment" label="Educational Attainment" required icon={BookOpen} value={formData.educationalAttainment} error={errors.educationalAttainment}>
        <select value={formData.educationalAttainment || ''} onChange={e => { setFormData({...formData, educationalAttainment: e.target.value}); clearErr('educationalAttainment'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A', fontSize:'12px' }}>
          <option value=""></option>
          <option value="Elementary Graduate">Elementary Graduate</option>
          <option value="High School Graduate">High School Graduate / Secondary Graduate</option>
          <option value="College Undergraduate">College Undergraduate</option>
          <option value="College Graduate">College Graduate / Bachelor's Degree</option>
          <option value="Vocational / Technical Graduate">Vocational / Technical Graduate</option>
        </select>
      </FloatingField>

      <div className="grid-2">
        <FloatingField id="civilStatus" label="Civil Status" required icon={HeartHandshake} value={formData.civilStatus} error={errors.civilStatus}>
          <select value={formData.civilStatus || ''} onChange={e => { setFormData({...formData, civilStatus: e.target.value}); clearErr('civilStatus'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option><option>Single</option><option>Married</option><option>Widowed</option><option>Legally Separated</option><option>Annulled</option>
          </select>
        </FloatingField>
        <FloatingField id="religion" label="Religion" icon={Cross} value={formData.religion} onChange={e => { setFormData({...formData, religion: toCapital(e.target.value)}); }} />
      </div>

      <FloatingField id="occupation" label="Occupation" icon={Briefcase} value={formData.occupation} onChange={e => setFormData({...formData, occupation: toCapital(e.target.value)})} />
      <FloatingField id="companyAgency" label="Company/Agency" icon={Building2} value={formData.companyAgency} onChange={e => setFormData({...formData, companyAgency: toCapital(e.target.value)})} />

      <div className="grid-2">
        <FloatingField id="monthlyIncome" label="Monthly Income" required icon={Banknote} value={formData.monthlyIncome} error={errors.monthlyIncome}>
          <select value={formData.monthlyIncome || ''} onChange={e => { setFormData({...formData, monthlyIncome: e.target.value}); clearErr('monthlyIncome'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A', fontSize:'11px' }}>
            <option value=""></option><option>No income</option><option>Below minimum wage</option><option>Minimum wage +1 to PHP 20833</option><option>PHP 20834 and above</option>
          </select>
        </FloatingField>
        <FloatingField id="employmentStatus" label="Employment Status" required icon={Briefcase} value={formData.employmentStatus} error={errors.employmentStatus}>
          <select value={formData.employmentStatus || ''} onChange={e => { setFormData({...formData, employmentStatus: e.target.value}); clearErr('employmentStatus'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option><option>Employed</option><option>Self-employed</option><option>Not employed</option>
          </select>
        </FloatingField>
      </div>

      <div className="grid-2">
        <FloatingField id="contact" label="Contact Number/s" required icon={Phone} value={formData.contact} error={errors.contact} onChange={e => { setFormData({...formData, contact: e.target.value.replace(/\D/g,'').slice(0,11)}); clearErr('contact'); }} />
        <FloatingField id="email" label="Email Address" icon={Mail} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
      </div>

      <div className="grid-2">
        <FloatingField id="pantawid" label="Pantawid Beneficiary?" required icon={Users} value={formData.pantawidBeneficiary} error={errors.pantawidBeneficiary}>
          <select value={formData.pantawidBeneficiary || ''} onChange={e => { setFormData({...formData, pantawidBeneficiary: e.target.value}); clearErr('pantawidBeneficiary'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option><option>Yes</option><option>No</option>
          </select>
        </FloatingField>
        <FloatingField id="indigenous" label="Indigenous Person?" required value={formData.indigenousPerson} error={errors.indigenousPerson}>
          <select value={formData.indigenousPerson || ''} onChange={e => { setFormData({...formData, indigenousPerson: e.target.value}); clearErr('indigenousPerson'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
            <option value=""></option><option>Yes</option><option>No</option>
          </select>
        </FloatingField>
      </div>

      <FloatingField id="lgbtq" label="LGBTQ+?" required value={formData.lgbtq} error={errors.lgbtq}>
        <select value={formData.lgbtq || ''} onChange={e => { setFormData({...formData, lgbtq: e.target.value}); clearErr('lgbtq'); }} style={{ width: '100%', height: '100%', border: 'none', outline: 'none', background: 'transparent', fontWeight: '600', color: '#1E3A8A' }}>
          <option value=""></option><option>Yes</option><option>No</option>
        </select>
      </FloatingField>
    </div>
  )
}
export default Step1;