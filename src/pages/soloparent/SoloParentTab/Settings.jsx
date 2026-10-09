import React, { useState, useEffect } from 'react';
// FIX FOR GLOBAL IS NOT DEFINED ERROR BES!
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}
import { LogOut, X, Sun, Moon, User, Shield, Bell, Type, Check, Eye, EyeOff, Mail, Link2, AlertCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { updatePassword, updateEmail, sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, FacebookAuthProvider, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../../../firebase';

function Settings({ onClose, onLogout, userData, userName, soloParentId, profilePic, setSoloparentData }) {
  const [isDark, setIsDark] = useState(localStorage.getItem('sp_dark') === 'true');
  const [fontSize, setFontSize] = useState(localStorage.getItem('sp_font') || 'medium');
  const [notif, setNotif] = useState(JSON.parse(localStorage.getItem('sp_notif') || '{"email":true,"sms":false,"inapp":true}'));
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newUsername, setNewUsername] = useState(userName);
  const [phoneNumber, setPhoneNumber] = useState(userData?.phone || '');
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPass, setNewPass] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // POPUP NA BES HINDI NA TOAST!
  const [popup, setPopup] = useState({ show: false, msg: '', type: 'success', title: '' });
  const showPopup = (title, msg, type='success') => { setPopup({ show: true, title, msg, type }); };

  const formatPhone = (num) => { let n = num.replace(/\D/g, ''); if (n.startsWith('0')) n = '63' + n.substring(1); if (!n.startsWith('63')) n = '63' + n; return '+' + n; };

  useEffect(() => {
    localStorage.setItem('sp_dark', isDark);
    localStorage.setItem('sp_font', fontSize);
    localStorage.setItem('sp_notif', JSON.stringify(notif));
    const root = document.documentElement;
    if (fontSize === 'small') root.style.fontSize = '13px';
    if (fontSize === 'medium') root.style.fontSize = '15px';
    if (fontSize === 'large') root.style.fontSize = '18px';
    if (isDark) { document.body.style.background = '#0f172a'; document.body.style.color = '#e2e8f0'; root.classList.add('dark'); } else { document.body.style.background = '#ffffff'; document.body.style.color = '#0f172a'; root.classList.remove('dark'); }
    window.dispatchEvent(new Event('sp_theme_changed'));
  }, [isDark, fontSize, notif]);

  const theme = isDark ? { bg: '#0f172a', card: '#1e293b', card2: '#0f172a', text: '#e2e8f0', textMuted: '#94a3b8', border: '#334155', inputBg: '#1e293b' } : { bg: '#ffffff', card: '#ffffff', card2: '#f8fafc', text: '#0f172a', textMuted: '#64748b', border: '#e2e8f0', inputBg: '#ffffff' };
  const Toggle = ({ active, onToggle }) => ( <div onClick={onToggle} style={{ width: '46px', height: '26px', background: active ? '#1e3a8a' : '#e2e8f0', borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s', border: `1px solid ${active ? '#FACC15' : 'transparent'}` }}> <div style={{ width: '20px', height: '20px', background: active ? '#FACC15' : 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: active ? '23px' : '2px', transition: '0.3s' }} /> </div> );

  const isFbConnected =!!userData?.facebookId;
  const isGoogleConnected =!!userData?.googleId;

  const handleConnectFacebook = async () => {
    try {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      const result = await signInWithPopup(auth, provider);
      if (userData?.id) await updateDoc(doc(db, 'soloparent', userData.id), { facebookId: result.user.uid, facebookEmail: result.user.email || '' });
      if (setSoloparentData) setSoloparentData(prev => ({...prev, facebookId: result.user.uid }));
      showPopup('Success', 'Facebook account has been successfully connected. You can now log in using Facebook.', 'success');
    } catch (err) { showPopup('Error', err.message, 'error'); }
  };
  const handleConnectGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (userData?.id) await updateDoc(doc(db, 'soloparent', userData.id), { googleId: result.user.uid, googleEmail: result.user.email || '' });
      if (setSoloparentData) setSoloparentData(prev => ({...prev, googleId: result.user.uid }));
      showPopup('Success', 'Google account has been successfully connected.', 'success');
    } catch (err) { showPopup('Error', err.message, 'error'); }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) return showPopup('Required Field', 'Please input your new username.', 'error');
    if (newUsername.length < 3) return showPopup('Invalid Username', 'Username must be at least 3 characters.', 'error');
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return showPopup('Not Logged In', 'You are not currently logged in.', 'error');
      if (userData?.id) await updateDoc(doc(db, 'soloparent', userData.id), { name: newUsername, displayName: newUsername, username: newUsername });
      try { await updateDoc(doc(db, 'users', uid), { name: newUsername, displayName: newUsername }); } catch(e) {}
      if (setSoloparentData) setSoloparentData(prev => ({ ...prev, name: newUsername, displayName: newUsername }));
      localStorage.setItem('sp_username', newUsername);
      setShowUserModal(false);
      showPopup('Success', `Username successfully changed to ${newUsername}.`, 'success');
    } catch (err) { showPopup('Error', err.message, 'error'); }
  };
  const handleSendOtp = async () => {
    if (!phoneNumber) return showPopup('Required Field', 'Please input your phone number. Example: 09XX XXX XXXX', 'error');
    if (!newPass && !otpSent) return showPopup('Required Field', 'Please input your new password first.', 'error');
    if (newPass.length < 6 && !otpSent) return showPopup('Invalid Password', 'Password must be at least 6 characters.', 'error');
    setLoadingOtp(true);
    try {
      if (!window.recaptchaVerifier) { window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' }); }
      const result = await signInWithPhoneNumber(auth, formatPhone(phoneNumber), window.recaptchaVerifier);
      setConfirmationResult(result); setOtpSent(true);
      showPopup('OTP Sent', `Verification code has been sent to ${formatPhone(phoneNumber)} via SMS.`, 'success');
    } catch (err) { console.error(err); showPopup('Failed to Send OTP', err.message + ' (Please enable Phone Authentication in Firebase)', 'error'); window.recaptchaVerifier = null; }
    setLoadingOtp(false);
  };
  const handleResendOtp = () => { window.recaptchaVerifier = null; setConfirmationResult(null); setOtpSent(false); setOtpInput(''); setTimeout(() => handleSendOtp(), 500); };
  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length < 6) return showPopup('Invalid OTP', 'Please input the 6-digit code.', 'error');
    try { await confirmationResult.confirm(otpInput); setOtpVerified(true); showPopup('Verified', 'OTP verified successfully. You can now change your password.', 'success'); } catch (err) { showPopup('Invalid Code', 'Incorrect OTP. Please try again or resend the code.', 'error'); }
  };
  const handleChangePassword = async () => {
    if (!otpVerified) return showPopup('Verification Required', 'Please verify OTP first.', 'error');
    if (newPass.length < 6) return showPopup('Invalid Password', 'Password must be at least 6 characters.', 'error');
    try { await updatePassword(auth.currentUser, newPass); showPopup('Success', 'Password changed successfully. Please use your new password for your next login.', 'success'); setShowPassModal(false); setOtpSent(false); setOtpVerified(false); setOtpInput(''); setNewPass(''); setConfirmationResult(null); window.recaptchaVerifier = null; } catch (err) { showPopup('Error', err.message + ' Please re-login and try again.', 'error'); }
  };
  const handleChangeEmail = async () => {
    if (!newEmail.includes('@')) return showPopup('Invalid Email', 'Please input a valid email address.', 'error');
    try { await updateEmail(auth.currentUser, newEmail); await sendEmailVerification(auth.currentUser); if (userData?.id) await updateDoc(doc(db, 'soloparent', userData.id), { email: newEmail, emailLower: newEmail.toLowerCase().trim() }); showPopup('Verification Sent', `Verification email has been sent to ${newEmail}. Please check your inbox.`, 'success'); setShowEmailModal(false); setNewEmail(''); } catch (err) { showPopup('Error', err.message, 'error'); }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: theme.bg, color: theme.text, borderRadius: '18px', overflow: 'hidden' }}>
      <div id="recaptcha-container"></div>
      <div style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${theme.border}`, background: theme.card }}>
        <div style={{ fontWeight: '800', fontSize: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}><div style={{ width: '28px', height: '28px', background: '#FACC15', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} color="#1e3a8a" /></div>Settings</div>
        <div onClick={onClose} style={{ width: '30px', height: '30px', background: theme.card2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `1px solid ${theme.border}` }}><X size={16} /></div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto', background: theme.bg }}>
        {/* PROFILE CARD - BINALIK KO BES! */}
        <div style={{ background: theme.card2, borderRadius: '14px', padding: '14px', display: 'flex', gap: '12px', alignItems: 'center', border: `1px solid ${theme.border}` }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', border: '2px solid #FACC15', background: '#1e3a8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'white', overflow: 'hidden' }}>{profilePic ? <img src={profilePic} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : userName?.[0]}</div>
          <div><div style={{ fontWeight: '700', fontSize: '13px' }}>{userName}</div><div style={{ fontSize: '11px', color: theme.textMuted }}>ID: {soloParentId}</div></div>
        </div>

        {/* APPEARANCE - BINALIK KO BES! */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '14px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '12px', display: 'flex', gap: '6px' }}>{isDark ? <Moon size={14} color="#FACC15"/> : <Sun size={14} color="#f59e0b"/>} Appearance - Buong Page</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>{isDark ? <Moon size={16} /> : <Sun size={16} />} {isDark ? 'Dark Mode' : 'Light Mode'} <span style={{ fontSize: '10px', background: '#FACC15', color: '#000', padding: '2px 6px', borderRadius: '10px', fontWeight: '800' }}>{isDark ? 'ON' : 'OFF'}</span></div>
            <Toggle active={isDark} onToggle={() => setIsDark(!isDark)} />
          </div>
          <div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '6px', display: 'flex', gap: '6px' }}><Type size={12}/> Font Size - {fontSize}</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['small','medium','large'].map(s => (<button key={s} onClick={() => setFontSize(s)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: `1.5px solid ${fontSize===s ? '#1e3a8a' : theme.border}`, background: fontSize===s ? '#1e3a8a' : theme.card2, color: fontSize===s ? 'white' : theme.text, fontWeight: '700', fontSize: '11px', cursor: 'pointer' }}>{s.toUpperCase()}</button>))}
          </div>
          <div style={{ marginTop: '10px', padding: '8px', background: isDark ? '#0f172a' : '#fef9c3', borderRadius: '8px', fontSize: '10px', color: isDark ? '#fde68a' : '#854d0e', border: `1px solid ${isDark ? '#334155' : '#fde68a'}` }}>Preview: The quick brown fox jumps over the lazy dog.</div>
        </div>

        {/* ACCOUNT - BINALIK KO LAHAT BES + CONNECTED ACCOUNTS */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '14px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', display: 'flex', gap: '6px' }}><Shield size={14}/> Account</div>
          <div onClick={() => setShowUserModal(true)} style={{ padding: '11px 12px', background: theme.card2, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '8px', border: `1px solid ${theme.border}` }}><div><div style={{ fontSize: '12px', fontWeight: '600' }}>Change Username</div><div style={{ fontSize: '10px', color: theme.textMuted }}>{userName}</div></div><div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Edit</div></div>
          <div onClick={() => setShowPassModal(true)} style={{ padding: '11px 12px', background: theme.card2, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '8px', border: `1px solid ${theme.border}` }}><div><div style={{ fontSize: '12px', fontWeight: '600' }}>Password + SMS OTP + Eye</div><div style={{ fontSize: '10px', color: theme.textMuted }}>Real SMS sa number</div></div><div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Change</div></div>
          <div onClick={() => setShowEmailModal(true)} style={{ padding: '11px 12px', background: theme.card2, borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: `1px solid ${theme.border}` }}><div><div style={{ fontSize: '12px', fontWeight: '600' }}>Email Verification</div><div style={{ fontSize: '10px', color: theme.textMuted }}>{userData?.email || 'No email'}</div></div><div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Verify</div></div>

          <div style={{ marginTop:'14px', paddingTop:'14px', borderTop:`1px dashed ${theme.border}` }}>
            <div style={{ fontWeight:'800', fontSize:'12px', marginBottom:'10px', display:'flex', alignItems:'center', gap:'6px' }}><Link2 size={14}/> Connected Accounts</div>
            <div style={{ padding:'11px 12px', background: theme.card2, borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', border:`1px solid ${theme.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div style={{ width:'28px', height:'28px', background:'#1877F2', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'800' }}>f</div><div><div style={{ fontSize:'12px', fontWeight:'700' }}>Facebook</div><div style={{ fontSize:'10px', color: theme.textMuted }}>{isFbConnected? userData.facebookEmail || 'Connected' : 'Not connected'}</div></div></div>
              {isFbConnected? <span style={{ fontSize:'10px', background:'#dcfce7', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontWeight:'800', display:'flex', alignItems:'center', gap:'3px' }}><Check size={10}/> CONNECTED</span> : <button onClick={handleConnectFacebook} style={{ fontSize:'11px', background:'#1877F2', color:'#fff', border:'none', padding:'6px 14px', borderRadius:'8px', fontWeight:'800', cursor:'pointer' }}>CONNECT</button>}
            </div>
            <div style={{ padding:'11px 12px', background: theme.card2, borderRadius:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${theme.border}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}><div style={{ width:'28px', height:'28px', background:'#fff', border:`1px solid ${theme.border}`, borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center' }}><Mail size={14} color="#ea4335"/></div><div><div style={{ fontSize:'12px', fontWeight:'700' }}>Gmail / Google</div><div style={{ fontSize:'10px', color: theme.textMuted }}>{isGoogleConnected? userData.googleEmail || userData.email : 'Not connected'}</div></div></div>
              {isGoogleConnected? <span style={{ fontSize:'10px', background:'#dcfce7', color:'#065f46', padding:'4px 8px', borderRadius:'12px', fontWeight:'800', display:'flex', alignItems:'center', gap:'3px' }}><Check size={10}/> CONNECTED</span> : <button onClick={handleConnectGoogle} style={{ fontSize:'11px', background:'#fff', color:'#000', border:`1px solid ${theme.border}`, padding:'6px 14px', borderRadius:'8px', fontWeight:'800', cursor:'pointer' }}>CONNECT</button>}
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS - BINALIK KO BES! */}
        <div style={{ background: theme.card, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '14px' }}>
          <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px', display: 'flex', gap: '6px' }}><Bell size={14}/> Notifications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>📧 Email</span><Toggle active={notif.email} onToggle={() => setNotif({...notif, email:!notif.email})} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>📱 SMS</span><Toggle active={notif.sms} onToggle={() => setNotif({...notif, sms:!notif.sms})} /></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span>🔔 In-App</span><Toggle active={notif.inapp} onToggle={() => setNotif({...notif, inapp:!notif.inapp})} /></div>
          </div>
        </div>

        <button onClick={() => { onClose(); onLogout(); }} style={{ width: '100%', padding: '12px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><LogOut size={16}/> Logout</button>
      </div>

      {showUserModal && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}><div style={{ background: theme.card, borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', border: `1px solid ${theme.border}` }}><div style={{ fontWeight: '800', marginBottom: '12px' }}>Change Username</div><input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Input your new username" style={{ width: '100%', padding: '12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text, marginBottom: '14px' }}/><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setShowUserModal(false)} style={{ flex: 1, padding: '11px', background: theme.card2, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: '700', color: theme.text }}>Cancel</button><button onClick={handleChangeUsername} style={{ flex: 1, padding: '11px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Save Changes</button></div></div></div>)}
      
      {showPassModal && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}><div style={{ background: theme.card, borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', border: `1px solid ${theme.border}` }}><div style={{ fontWeight: '800', marginBottom: '12px' }}>Change Password via SMS OTP</div> {!otpSent ? ( <> <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Input your phone number (09XX XXX XXXX)" style={{ width: '100%', padding: '12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text, marginBottom: '10px' }}/> <div style={{ position: 'relative', marginBottom: '12px' }}> <input value={newPass} onChange={e => setNewPass(e.target.value)} type={showNewPass ? "text" : "password"} placeholder="Input your new password (min. 6 characters)" style={{ width: '100%', padding: '12px 40px 12px 12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text }} /> <div onClick={() => setShowNewPass(!showNewPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>{showNewPass ? <EyeOff size={18} color={theme.textMuted}/> : <Eye size={18} color={theme.textMuted}/>}</div> </div> <button onClick={handleSendOtp} disabled={loadingOtp} style={{ width: '100%', padding: '11px', background: '#FACC15', color: '#000', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', opacity: loadingOtp?0.6:1 }}>{loadingOtp ? 'Sending verification code...' : 'Send Verification Code'}</button> </> ) : !otpVerified ? ( <> <div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '8px' }}>Code sent to {formatPhone(phoneNumber)}</div> <input value={otpInput} onChange={e => setOtpInput(e.target.value)} placeholder="Input the 6-digit verification code" style={{ width: '100%', padding: '12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text, marginBottom: '12px', letterSpacing: '4px', textAlign: 'center', fontWeight: '800' }}/> <button onClick={handleVerifyOtp} style={{ width: '100%', padding: '11px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Verify Code</button> <button onClick={handleResendOtp} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text, fontWeight: '600' }}>Resend Code</button> </> ) : ( <> <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={14}/> Code verified successfully.</div> <div style={{ position: 'relative', marginBottom: '12px' }}> <input value={newPass} onChange={e => setNewPass(e.target.value)} type={showConfirmPass ? "text" : "password"} placeholder="Confirm your new password" style={{ width: '100%', padding: '12px 40px 12px 12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text }} /> <div onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }}>{showConfirmPass ? <EyeOff size={18} color={theme.textMuted}/> : <Eye size={18} color={theme.textMuted}/>}</div> </div> <button onClick={handleChangePassword} style={{ width: '100%', padding: '11px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Update Password</button> </> )} <button onClick={() => { setOtpSent(false); setOtpVerified(false); setShowPassModal(false); setConfirmationResult(null); if(window.recaptchaVerifier) window.recaptchaVerifier = null; }} style={{ width: '100%', marginTop: '8px', padding: '10px', background: theme.card2, border: `1px solid ${theme.border}`, borderRadius: '10px', color: theme.text }}>Cancel</button></div></div>)}
      
      {showEmailModal && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}><div style={{ background: theme.card, borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', border: `1px solid ${theme.border}` }}><div style={{ fontWeight: '800', marginBottom: '8px' }}>Update Email Address</div><div style={{ fontSize: '11px', color: theme.textMuted, marginBottom: '10px' }}>A verification link will be sent to your new email address.</div><input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Input your new email address" style={{ width: '100%', padding: '12px', border: `1.5px solid ${theme.border}`, borderRadius: '10px', background: theme.inputBg, color: theme.text, marginBottom: '14px' }}/><div style={{ display: 'flex', gap: '8px' }}><button onClick={() => setShowEmailModal(false)} style={{ flex: 1, padding: '11px', background: theme.card2, border: `1px solid ${theme.border}`, borderRadius: '10px', fontWeight: '700', color: theme.text }}>Cancel</button><button onClick={handleChangeEmail} style={{ flex: 1, padding: '11px', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700' }}>Send Verification</button></div></div></div>)}

      {popup.show && (<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}><div style={{ background: theme.card, borderRadius: '18px', padding: '24px', width: '100%', maxWidth: '360px', border: `1px solid ${theme.border}`, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}><div style={{ width: '48px', height: '48px', borderRadius: '50%', background: popup.type==='success' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>{popup.type==='success' ? <Check size={24} color="#16a34a"/> : <AlertCircle size={24} color="#dc2626"/>}</div><div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '6px', color: theme.text }}>{popup.title}</div><div style={{ fontSize: '12px', color: theme.textMuted, marginBottom: '18px', lineHeight: '1.5' }}>{popup.msg}</div><button onClick={() => setPopup({ show: false, msg: '', type: 'success', title: '' })} style={{ width: '100%', padding: '11px', background: popup.type==='success' ? '#1e3a8a' : '#dc2626', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>{popup.type==='success' ? 'Continue' : 'Try Again'}</button></div></div>)}
    </div>
  );
}
export default Settings;