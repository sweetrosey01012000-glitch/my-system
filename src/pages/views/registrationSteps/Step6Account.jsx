import { User, Lock, Eye, EyeOff, Mail, ShieldCheck, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase'; // <--- PALITAN MO NG PATH NG FIREBASE MO BES!

function Step6({ formData, setFormData, errors, setErrors, setSubmitError, FloatingField }) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [timer, setTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const clearErr = (f) => { setErrors(p => ({...p, [f]: '' })); setSubmitError(''); };

  useEffect(()=>{
    if(timer>0){ const t=setTimeout(()=>setTimer(timer-1),1000); return ()=>clearTimeout(t); }
  },[timer]);

  const checkDuplicateEmail = async (emailLower) => {
    // Check sa pending_users
    const q1 = query(collection(db, "pending_users"), where("emailLower", "==", emailLower));
    const snap1 = await getDocs(q1);
    // Check sa final soloparent
    const q2 = query(collection(db, "soloparent"), where("emailLower", "==", emailLower));
    const snap2 = await getDocs(q2);

    // Pag rejected yung nasa pending at sya mismo nag-eedit, payagan pa rin
    if(!snap1.empty){
      const isOwnRejected = snap1.docs.some(d => d.data().status === 'REJECTED_BY_STAFF' && d.id === formData.id);
      if(!isOwnRejected) return true; // may duplicate
    }
    if(!snap2.empty) return true; // may duplicate sa final
    return false; // wala, pwede
  };

  const handleSendCode = async () => {
    if(!formData.email ||!formData.email.includes('@')){
      setErrors(p=>({...p, email:'Enter valid email first'})); return;
    }
    setSending(true);
    const emailLower = formData.email.toLowerCase().trim();

    try {
      const isDuplicate = await checkDuplicateEmail(emailLower);
      if(isDuplicate){
        setErrors(p=>({...p, email:'Email already used Bes! Bawal na gamitin ulit!'}));
        setSending(false);
        return;
      }

      const newOtp = Math.floor(100000 + Math.random()*900000).toString();
      setGeneratedOtp(newOtp);
      console.log('OTP MO BES:', newOtp);

      // DITO MO LAGAY EmailJS MO BES
      // await emailjs.send(...)

      setTimeout(()=>{
        setOtpSent(true);
        setSending(false);
        setTimer(60);
        setFormData(prev=>({...prev, emailLower, emailVerified:false }));
        alert(`OTP mo Bes (testing): ${newOtp}`);
      }, 800);

    } catch(err){
      console.error(err);
      setErrors(p=>({...p, email:'Error checking email, try again'}));
      setSending(false);
    }
  };

  const handleVerify = () => {
    if(otp === generatedOtp){
      setFormData(prev=>({...prev, emailVerified: true, emailLower: prev.email.toLowerCase().trim() }));
      setErrors(p=>({...p, email:''}));
      alert('Email Verified na Bes! ✅ Pwede na yan i-link sa FB/Gmail later!');
    } else {
      setErrors(p=>({...p, email:'Wrong OTP code Bes!'}));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="section-header" style={{ background: '#e0e7ff', color: '#3730a3', border: '1.5px solid #c7d2fe' }}>
        <User size={18} /> VII. ACCOUNT INFORMATION
      </div>

      <div style={{ background:'#FFFFFF', padding:'14px', borderRadius:'12px', border:errors.email?'2px solid #ef4444':'1.5px solid #c7d2fe', display:'flex', flexDirection:'column', gap:'10px' }}>
        <div style={{ display:'flex', gap:'8px', alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <FloatingField id="email" label="Email Address" required icon={Mail} value={formData.email} error={errors.email} onChange={e => { setFormData({...formData, email: e.target.value, emailVerified:false, emailLower:'' }); clearErr('email'); setOtpSent(false); }} />
          </div>
          <button type="button" onClick={handleSendCode} disabled={sending || timer>0 || formData.emailVerified} style={{ height:'44px', padding:'0 14px', borderRadius:'10px', border:'none', background: formData.emailVerified? '#22c55e' : '#3730a3', color:'#fff', fontSize:'11px', fontWeight:'800', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', opacity: (sending||timer>0)?0.6:1 }}>
            {formData.emailVerified? <ShieldCheck size={16}/> : <Send size={16}/>}
            {formData.emailVerified? 'VERIFIED' : timer>0? `${timer}s` : sending? 'CHECKING...' : otpSent? 'RESEND' : 'SEND CODE'}
          </button>
        </div>

        {otpSent &&!formData.emailVerified && (
          <div style={{ display:'flex', gap:'8px' }}>
            <input placeholder="Enter 6-digit code" value={otp} onChange={e=>setOtp(e.target.value)} maxLength={6} style={{ flex:1, padding:'10px 12px', borderRadius:'8px', border:'1.5px solid #c7d2fe', fontSize:'13px', fontWeight:'700', letterSpacing:'2px' }} />
            <button type="button" onClick={handleVerify} style={{ padding:'0 18px', borderRadius:'8px', border:'none', background:'#16a34a', color:'#fff', fontWeight:'800', fontSize:'12px', cursor:'pointer' }}>VERIFY</button>
          </div>
        )}

        {formData.emailVerified && (
          <div style={{ background:'#dcfce7', padding:'8px 10px', borderRadius:'8px', fontSize:'11px', fontWeight:'700', color:'#065f46', border:'1.5px solid #bbf7d0' }}>
            ✅ Email verified & unique
          </div>
        )}
      </div>

      <FloatingField id="username" label="Username" required icon={User} value={formData.username} error={errors.username} onChange={e => { setFormData({...formData, username: e.target.value }); clearErr('username'); }} />

      <div style={{ position: 'relative' }}>
        <FloatingField id="password" label="Password (Min. 8 characters)" required icon={Lock} type={showPass? "text" : "password"} value={formData.password} error={errors.password} onChange={e => { setFormData({...formData, password: e.target.value }); clearErr('password'); }} />
        <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {showPass? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <FloatingField id="confirmPassword" label="Confirm Password" required icon={Lock} type={showConfirm? "text" : "password"} value={formData.confirmPassword} error={errors.confirmPassword} onChange={e => { setFormData({...formData, confirmPassword: e.target.value }); clearErr('confirmPassword'); }} />
        <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer' }}>
          {showConfirm? <EyeOff size={18} color="#64748b" /> : <Eye size={18} color="#64748b" />}
        </button>
      </div>

      <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1.5px solid #bbf7d0', fontSize: '10px', color: '#065f46', fontWeight: '600' }}>
        Password min 8: Uppercase, Lowercase, Number {formData.emailVerified? '• Email Unique & Verified ✅' : '• Need unique verified email'}
      </div>
    </div>
  );
}

export default Step6;