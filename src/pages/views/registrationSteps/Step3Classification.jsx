import { FileText } from 'lucide-react';

function Step3({ formData, setFormData, errors, setErrors, setSubmitError }) {
  const clearErr = (f) => { setErrors(p=>({...p,[f]:''})); setSubmitError(''); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
      <div className="section-header" style={{ background:'#dbeafe', color:'#1E3A8A', border:'1.5px solid #bfdbfe' }}>
        <FileText size={18}/> III & IV. CLASSIFICATION & NEEDS
      </div>

      <div style={{ background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #dbeafe' }}>
        <label style={{ fontSize:'11px', fontWeight:'800', color:'#1E3A8A' }}>
          Dahilan bakit naging solo parent? 
        </label>
        <textarea
          value={formData.classification}
          onChange={e=>{ setFormData({...formData,classification:e.target.value}); clearErr('classification'); }}
          placeholder="Ikwento kung bakit ka naging solo parent..."
          style={{ width:'100%', minHeight:'110px', padding:'12px', borderRadius:'10px', border:'1.5px solid #dbeafe', marginTop:'6px', boxSizing:'border-box', background:'#FFFFFF', fontSize:'13px', outline:'none' }}
        />
        {errors.classification && <div style={{ color:'#ef4444', fontSize:'11px', fontWeight:'700', marginTop:'4px' }}>⚠️ {errors.classification}</div>}
      </div>

      <div style={{ background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:'1.5px solid #fde68a' }}>
        <label style={{ fontSize:'11px', fontWeight:'800', color:'#92400e' }}>
          Kinakailangan / Problema na kinakaharap? 
        </label>
        <textarea
          value={formData.needs}
          onChange={e=>{ setFormData({...formData,needs:e.target.value}); clearErr('needs'); }}
          placeholder="Ano ang pangangailangan mo bilang solo parent? (Financial, Educational, Livelihood, etc.)"
          style={{ width:'100%', minHeight:'110px', padding:'12px', borderRadius:'10px', border:'1.5px solid #fde68a', marginTop:'6px', boxSizing:'border-box', background:'#FFFFFF', fontSize:'13px', outline:'none' }}
        />
        {errors.needs && <div style={{ color:'#ef4444', fontSize:'11px', fontWeight:'700', marginTop:'4px' }}>⚠️ {errors.needs}</div>}
      </div>
    </div>
  )
}

export default Step3;