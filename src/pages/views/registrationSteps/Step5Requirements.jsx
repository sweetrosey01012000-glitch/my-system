import { Upload, FileCheck, X } from 'lucide-react';

function Step5({ selectedCategory, requiredDocs, reqFiles, errors, handleDocFileChange, removeDocFile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="section-header" style={{ background: '#dcfce7', color: '#065f46', border: '1.5px solid #bbf7d0' }}>
        <FileCheck size={18} /> VI. REQUIREMENTS - {selectedCategory? requiredDocs.length + ' files needed' : 'Select category first'}
      </div>

      {!selectedCategory && (
        <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '10px', border: '1.5px solid #fde68a', fontSize: '12px', fontWeight: '700', color: '#92400e' }}>
          ⚠ Pumili muna ng category sa Step 1 para lumabas requirements
        </div>
      )}

      {selectedCategory && requiredDocs.map((docName, idx) => (
        <div key={idx} style={{ background: '#FFFFFF', padding: '14px', borderRadius: '12px', border: '1.5px solid #dbeafe' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#1E3A8A', display: 'flex', justifyContent: 'space-between' }}>
            <span>{idx + 1}. {docName} </span>
            {reqFiles[idx] && <span style={{ color: '#10b981' }}>✓ Uploaded</span>}
          </label>

          {!reqFiles[idx]? (
            <label style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', borderRadius: '10px', border: '2px dashed #bfdbfe', background: '#f8fafc', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#1E3A8A' }}>
              <Upload size={16} /> Click to upload file
              <input type="file" accept="image/,application/pdf" hidden onChange={e => handleDocFileChange(idx, e.target.files[0])} />
            </label>
          ) : (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '10px', background: '#dcfce7', border: '1.5px solid #bbf7d0' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCheck size={14} /> {reqFiles[idx].name.slice(0, 30)}
              </span>
              <button type="button" onClick={() => removeDocFile(idx)} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <X size={12} color="#fff" />
              </button>
            </div>
          )}

          {errors[`doc_${idx}`] && (
            <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '4px' }}>
              ⚠️ Required
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default Step5;