import { Phone, User, MapPin, HeartHandshake } from 'lucide-react';

function Step4({ formData, setFormData, errors, setErrors, setSubmitError, onlyLetters, toCapital, FloatingField }) {

  const clearErr = (f) => {
    setErrors(p => ({...p, [f]: '' }));
    setSubmitError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      <div className="section-header" style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fde68a' }}>
        <Phone size={18} /> V. EMERGENCY CONTACT
      </div>
      
      <FloatingField
        id="emergencyName"
        label="Emergency Contact Name"
        required
        icon={User}
        value={formData.emergencyName}
        error={errors.emergencyName}
        onChange={e => {
          setFormData({...formData, emergencyName: onlyLetters(toCapital(e.target.value)) });
          clearErr('emergencyName');
        }}
      />

      <FloatingField
        id="emergencyAddress"
        label="Emergency Contact Address"
        required
        icon={MapPin}
        value={formData.emergencyAddress}
        error={errors.emergencyAddress}
        onChange={e => {
          setFormData({...formData, emergencyAddress: toCapital(e.target.value) });
          clearErr('emergencyAddress');
        }}
      />

      <FloatingField
        id="emergencyRelationship"
        label="Relationship to Applicant"
        required
        icon={HeartHandshake}
        placeholder="e.g. Mother, Father, Spouse"
        value={formData.emergencyRelationship}
        error={errors.emergencyRelationship}
        onChange={e => {
          setFormData({...formData, emergencyRelationship: onlyLetters(toCapital(e.target.value)) });
          clearErr('emergencyRelationship');
        }}
      />

      <FloatingField
        id="emergencyContact"
        label="Emergency Contact Number (09...)"
        required
        icon={Phone}
        value={formData.emergencyContact}
        error={errors.emergencyContact}
        onChange={e => {
          let v = e.target.value.replace(/\D/g, '').slice(0, 11);
          if (v.length > 0 && v[0]!== '0') v = '0' + v.slice(0, 10);
          if (v.length > 1 && v[1]!== '9') v = '09' + v.slice(2);
          setFormData({...formData, emergencyContact: v });
          clearErr('emergencyContact');
        }}
      />

    </div>
  );
}

export default Step4;