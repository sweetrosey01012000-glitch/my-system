import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { X, Eye, EyeOff } from 'lucide-react';

function LoginPage({ onClose, setShowRegisterModal }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false); // PARA SA COLOR
  const [passFocus, setPassFocus] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    onClose();
    window.location.reload();
  };
  
  const handleForgotPassword = async () => {
    const resetEmail = window.prompt("Please enter your email address to reset your password:", email);
    if (!resetEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert(`Password reset email sent to ${resetEmail}!`);
    } catch (error) {
      alert("Failed to send reset email: " + error.message);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: '24px', padding: '45px 40px', width: '100%', maxWidth: '440px', boxShadow: '0 25px 70px rgba(0,0,0,0.4)', position: 'relative' }}>
      
      <button style={{ position: 'absolute', top: '20px', right: '20px', background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
        <X size={18} />
      </button>

      <div style={{ textAlign: 'center', marginBottom: '35px' }}>
        <h2 style={{ color: '#1e40af', fontSize: '32px', fontWeight: '800', margin: 0 }}>Welcome Back</h2>
      </div>

      <form onSubmit={handleLogin}>
        
        {/* EMAIL */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <label style={{ 
            position: 'absolute', 
            left: '16px', 
            top: email || emailFocus ? '-10px' : '50%', 
            transform: email || emailFocus ? 'translateY(0)' : 'translateY(-50%)', 
            fontSize: email || emailFocus ? '13px' : '15px', 
            color: email || emailFocus ? '#2563eb' : '#94a3b8', 
            fontWeight: '700', 
            pointerEvents: 'none', 
            transition: 'all 0.2s ease',
            background: '#fff',
            padding: '0 6px',
            zIndex: 2
          }}>
            Email Address
          </label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            onFocus={() => setEmailFocus(true)}
            onBlur={() => setEmailFocus(false)}
            required 
            style={{ 
              width: '100%', 
              padding: '16px 18px', 
              borderRadius: '12px', 
              border: `2px solid ${email || emailFocus ? '#2563eb' : '#e2e8f0'}`, 
              fontSize: '15px', 
              background: email || emailFocus ? '#fff' : '#f8fafc', 
              color: '#1e293b', 
              outline: 'none', 
              boxSizing: 'border-box',
              transition: 'all 0.2s ease'
            }} 
          />
        </div>

        {/* PASSWORD */}
        <div style={{ marginBottom: '10px', position: 'relative' }}>
          <label style={{ 
            position: 'absolute', 
            left: '16px', 
            top: password || passFocus ? '-10px' : '50%', 
            transform: password || passFocus ? 'translateY(0)' : 'translateY(-50%)', 
            fontSize: password || passFocus ? '13px' : '15px', 
            color: password || passFocus ? '#2563eb' : '#94a3b8', 
            fontWeight: '700', 
            pointerEvents: 'none', 
            transition: 'all 0.2s ease',
            background: '#fff',
            padding: '0 6px',
            zIndex: 2
          }}>
            Password
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              onFocus={() => setPassFocus(true)}
              onBlur={() => setPassFocus(false)}
              required 
              style={{ 
                width: '100%', 
                padding: '16px 45px 16px 18px', 
                borderRadius: '12px', 
                border: `2px solid ${password || passFocus ? '#2563eb' : '#e2e8f0'}`, 
                fontSize: '15px', 
                background: password || passFocus ? '#fff' : '#f8fafc', 
                color: '#1e293b', 
                outline: 'none', 
                boxSizing: 'border-box',
                transition: 'all 0.2s ease'
              }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
              {showPassword ? <EyeOff size={20} color="#94a3b8" /> : <Eye size={20} color="#94a3b8" />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: '25px', fontSize: '14px', color: '#2563eb', cursor: 'pointer', fontWeight: '600' }} onClick={handleForgotPassword}>
          Forgot Password?
        </div>

        <button type="submit" style={{ background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', color: '#1e40af', padding: '16px', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>
          Login
        </button>

        <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          No account? <span style={{ color: '#38bdf8', fontWeight: '700', cursor: 'pointer' }} onClick={() => { onClose(); setShowRegisterModal(true); }}>Register here</span>
        </div>
      </form>
    </div>
  );
}
export default LoginPage;