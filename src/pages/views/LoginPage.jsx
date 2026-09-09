import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { X, Eye, EyeOff, Mail, Lock, KeyRound, AlertTriangle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LOGO_IMG = "/vids/soloparent-logo.png";

function LoginPage({ onClose, setShowRegisterModal }) {
  const navigate = useNavigate();
  const { userRole, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ITO YUNG WALA SA CODE MO - AUTO REDIRECT
  useEffect(() => {
    if (!loading && userRole) {
      if (userRole === 'MSWD Staff') {
        if (onClose) onClose();
        navigate('/staff', { replace: true });
      } else if (userRole === 'admin' || userRole === 'Admin') {
        if (onClose) onClose();
        navigate('/admin', { replace: true });
      } else if (userRole === 'soloparent') {
        if (onClose) onClose();
        navigate('/soloparent', { replace: true });
      }
    }
  }, [userRole, loading, navigate, onClose]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // HAYAAN MO YUNG useEffect MAG-NAVIGATE, WAG MO I-CLOSE AGAD
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password');
      } else {
        setErrorMsg(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const resetEmail = window.prompt("Enter your email to reset password:", email);
    if (!resetEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert(`Password reset email sent to ${resetEmail}!`);
    } catch (error) {
      alert("Failed: " + error.message);
    }
  };

  return (
  <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 70px rgba(0,0,0,0.4)', position: 'relative', overflow:'hidden', border:'2px solid #FBBF24' }}>
    <div style={{background:'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
        <img src={LOGO_IMG} alt="Solo Parent Logo" style={{width:'36px', height:'36px', background:'#fff', padding:'3px', borderRadius:'8px', objectFit:'contain', boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}/>
        <div>
          <p style={{margin:0, color:'#FBBF24', fontWeight:'900', fontSize:'13px', letterSpacing:'0.5px'}}>SOLO PARENT SYSTEM</p>
          <p style={{margin:0, color:'#dbeafe', fontSize:'9px', fontWeight:'600'}}>DSWD - NAIC, CAVITE</p>
        </div>
      </div>
      <button style={{ background:'rgba(255,255,255,0.15)', border:'1.5px solid rgba(255,255,255,0.2)', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}} onClick={onClose}>
        <X size={16} color="#fff"/>
      </button>
    </div>
    <div style={{padding:'24px 22px 22px'}}>
      {errorMsg && <div style={{background:'#fef2f2', border:'1.5px solid #fecaca', color:'#dc2626', padding:'10px 12px', borderRadius:'10px', fontSize:'12px', fontWeight:'600', marginBottom:'14px', display:'flex', alignItems:'center', gap:'6px'}}><AlertTriangle size={14}/> {errorMsg}</div>}
      <div style={{ textAlign:'center', marginBottom:'22px'}}>
        <div style={{display:'flex', justifyContent:'center', marginBottom:'12px'}}>
          <div style={{width:'64px', height:'64px', background:'linear-gradient(135deg, #eff6ff, #fff)', borderRadius:'16px', padding:'8px', border:'2px solid #dbeafe', boxShadow:'0 4px 12px rgba(30,58,138,0.15)', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <img src={LOGO_IMG} alt="Logo" style={{width:'100%', height:'100%', objectFit:'contain'}}/>
          </div>
        </div>
        <h2 style={{ color:'#1E3A8A', fontSize:'24px', fontWeight:'900', margin:0}}>Welcome Back</h2>
        <p style={{color:'#64748b', fontSize:'11px', margin:'4px 0 0', fontWeight:'600'}}>Support. Benefits. Community.</p>
      </div>
      <form onSubmit={handleLogin} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
        <div style={{ position:'relative'}}>
          <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color: emailFocus? '#1E3A8A' : '#9ca3af', background: emailFocus? '#dbeafe' : '#f1f5f9', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1}}><Mail size={16}/></div>
          <label style={{ position:'absolute', left:'50px', top: email || emailFocus ? '-8px' : '50%', transform: email || emailFocus ? 'translateY(0)' : 'translateY(-50%)', fontSize: email || emailFocus ? '10px' : '13px', color: email || emailFocus ? '#1E3A8A' : '#94a3b8', fontWeight:'800', pointerEvents:'none', transition:'all 0.2s ease', background:'#fff', padding:'0 6px', zIndex:2, borderRadius:'4px'}}>Email Address *</label>
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} onFocus={()=>setEmailFocus(true)} onBlur={()=>setEmailFocus(false)} required autoComplete="off" style={{ width:'100%', padding:'16px 18px 16px 54px', borderRadius:'12px', border:`${email || emailFocus ? '2px solid #1E3A8A' : '1.5px solid #e0e7ff'}`, fontSize:'14px', background: emailFocus? '#eff6ff' : '#fff', outline:'none', boxSizing:'border-box', height:'52px', fontWeight:'500', boxShadow: emailFocus? '0 0 0 4px rgba(30,58,138,0.1)' : '0 1px 2px rgba(0,0,0,0.04)'}} />
        </div>
        <div style={{ position:'relative'}}>
          <div style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color: passFocus? '#1E3A8A' : '#9ca3af', background: passFocus? '#dbeafe' : '#f1f5f9', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1}}><Lock size={16}/></div>
          <label style={{ position:'absolute', left:'50px', top: password || passFocus ? '-8px' : '50%', transform: password || passFocus ? 'translateY(0)' : 'translateY(-50%)', fontSize: password || passFocus ? '10px' : '13px', color: password || passFocus ? '#1E3A8A' : '#94a3b8', fontWeight:'800', pointerEvents:'none', transition:'all 0.2s ease', background:'#fff', padding:'0 6px', zIndex:2, borderRadius:'4px'}}>Password *</label>
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e)=>setPassword(e.target.value)} onFocus={()=>setPassFocus(true)} onBlur={()=>setPassFocus(false)} required autoComplete="new-password" style={{ width:'100%', padding:'16px 42px 16px 54px', borderRadius:'12px', border:`${password || passFocus ? '2px solid #1E3A8A' : '1.5px solid #e0e7ff'}`, fontSize:'14px', background: passFocus? '#eff6ff' : '#fff', outline:'none', boxSizing:'border-box', height:'52px', fontWeight:'500', boxShadow: passFocus? '0 0 0 4px rgba(30,58,138,0.1)' : '0 1px 2px rgba(0,0,0,0.04)'}} />
          <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'#f1f5f9', border:'none', cursor:'pointer', display:'flex', width:'28px', height:'28px', borderRadius:'6px', alignItems:'center', justifyContent:'center'}}>
            {showPassword ? <EyeOff size={16} color="#64748b"/> : <Eye size={16} color="#64748b"/>}
          </button>
        </div>
        <div style={{ textAlign:'right', fontSize:'11px', color:'#1E3A8A', cursor:'pointer', fontWeight:'700', marginTop:'-8px', display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'4px'}} onClick={handleForgotPassword}><KeyRound size={14}/> Forgot Password?</div>
        <button type="submit" disabled={isLoading} style={{ background: isLoading? '#9ca3af' : 'linear-gradient(135deg, #1E3A8A 0%, #2563eb 100%)', color:'#fff', padding:'14px', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'900', cursor: isLoading? 'not-allowed':'pointer', width:'100%', marginTop:'4px', boxShadow: isLoading? 'none' : '0 4px 14px rgba(30,58,138,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
          {isLoading? 'Logging in...' : <><LogIn size={16}/> LOG IN</>}
        </button>
        <div style={{ textAlign:'center', fontSize:'12px', color:'#64748b', background:'#f8fafc', padding:'10px', borderRadius:'10px', marginTop:'2px'}}>
          No account? <span style={{ color:'#1E3A8A', fontWeight:'800', cursor:'pointer', textDecoration:'underline'}} onClick={()=>{ onClose(); if(setShowRegisterModal) setShowRegisterModal(true); else navigate('/signup');}}>Register here</span>
        </div>
      </form>
    </div>
  </div>
  );
}

export default LoginPage;