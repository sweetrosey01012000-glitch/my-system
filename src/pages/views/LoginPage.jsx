import React, { useState, useEffect } from 'react';
if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
  window.global = window;
}
import { signInWithEmailAndPassword, signOut, FacebookAuthProvider, GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { X, Eye, EyeOff, User, Lock, AlertTriangle, LogIn, Check, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LOGO_IMG = "/vids/soloparent-logo.png";

function LoginPage({ onClose, setShowRegisterModal }) {
  const navigate = useNavigate();
  const { userRole, loading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [passFocus, setPassFocus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFbLoading, setIsFbLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // FORGOT PASSWORD SMS STATES BES!
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotName, setForgotName] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotUid, setForgotUid] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [popup, setPopup] = useState({ show: false, title: '', msg: '', type: 'success' });
  const showPopup = (title, msg, type = 'success') => setPopup({ show: true, title, msg, type });

  useEffect(() => {
    if (!loading && userRole) {
      if (userRole === 'MSWD Staff' || userRole === 'MSWD staff') { if (onClose) onClose(); navigate('/staff', { replace: true }); }
      else if (userRole === 'admin' || userRole === 'Admin') { if (onClose) onClose(); navigate('/admin', { replace: true }); }
      else if (userRole === 'soloparent') { if (onClose) onClose(); navigate('/soloparent', { replace: true }); }
    }
  }, [userRole, loading, navigate, onClose]);

  const checkUserStatus = async (uid) => {
    let staffSnap = await getDoc(doc(db, 'staff', uid));
    if (staffSnap.exists()) return;
    let adminSnap = await getDoc(doc(db, 'admin', uid));
    if (adminSnap.exists()) return;
    const pendingSnap = await getDoc(doc(db, 'pending_users', uid));
    if (pendingSnap.exists()) {
      const pdata = pendingSnap.data();
      if (pdata.status === 'pending') { await signOut(auth); throw new Error('Unable to Login, Waiting for approval'); }
      if (pdata.status === 'declined' || pdata.status === 'rejected') { await signOut(auth); throw new Error(`Registration declined: ${pdata.declineReason || 'Contact MSWDO'}`); }
    }
    const spSnap = await getDoc(doc(db, 'soloparent', uid));
    if (spSnap.exists()) {
      const sdata = spSnap.data();
      if (sdata.status === 'declined') { await signOut(auth); throw new Error(`Registration declined`); }
      if (sdata.status === 'pending' || sdata.isApproved === false) { await signOut(auth); throw new Error('Unable to Login, Waiting for approval'); }
    }
  };

  const getAccountByName = async (nameInput) => {
    const qLower = nameInput.trim().toLowerCase();
    const qName = nameInput.trim();
    for (const col of ['staff', 'admin', 'soloparent', 'pending_users']) {
      let snap = await getDocs(query(collection(db, col), where('nameLower', '==', qLower)));
      if (!snap.empty) return { data: snap.docs[0].data(), id: snap.docs[0].id, col };
      snap = await getDocs(query(collection(db, col), where('name', '==', qName)));
      if (!snap.empty) return { data: snap.docs[0].data(), id: snap.docs[0].id, col };
    }
    return null;
  };

  const formatPhone = (num) => {
    if (!num) return '';
    let n = num.toString().replace(/\D/g, '');
    if (n.startsWith('0')) n = '63' + n.substring(1);
    if (n.length === 10 && n.startsWith('9')) n = '63' + n;
    if (!n.startsWith('63')) n = '63' + n.replace(/^63/, '');
    return '+' + n;
  };
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(''); setIsLoading(true);
    try {
      const acc = await getAccountByName(fullName);
      if (!acc) throw new Error(`Name "${fullName.trim()}" not found. Register first.`);
      const cred = await signInWithEmailAndPassword(auth, acc.data.email, password);
      await checkUserStatus(cred.user.uid);
      showPopup('Success', `Welcome back ${fullName.trim()}!`, 'success');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') setErrorMsg('Invalid name or password');
      else setErrorMsg(error.message);
    } finally { setIsLoading(false); }
  };

  // STEP 1 BES: SEND SMS OTP GAMIT FIREBASE PHONE AUTH!
  const handleSendSmsOtp = async () => {
    if (!forgotName.trim()) { showPopup('Required', 'Enter Full Name', 'error'); return; }
    setIsSendingSms(true); setErrorMsg('');
    try {
      const acc = await getAccountByName(forgotName);
      if (!acc) throw new Error(`Name "${forgotName.trim()}" not found.`);

      const phoneRaw = acc.data.phone || acc.data.mobile || acc.data.phoneNumber || acc.data.contactNumber || '';
      if (!phoneRaw) throw new Error('No phone number found in your account. Contact MSWD to update your profile.');

      const emailFound = acc.data.email;
      const formatted = formatPhone(phoneRaw);

      // FIX RECATCHA BES - TANGGALIN LUMA
      if (window.recaptchaVerifier) { try { window.recaptchaVerifier.clear(); } catch (e) { } window.recaptchaVerifier = null; }

      // INVISIBLE RECAPTCHA - FIREBASE LANG BES!
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-forgot', { size: 'invisible' });

      const confirmation = await signInWithPhoneNumber(auth, formatted, window.recaptchaVerifier);
      setConfirmResult(confirmation);
      setForgotPhone(formatted);
      setForgotEmail(emailFound);
      setForgotUid(acc.id);
      setForgotStep(2);
      showPopup('OTP Sent!', `SMS OTP sent to ${formatted}. Free quota: 10/day. Check SMS! (For test number use 123456)`, 'success');
      //Testing for SMS
    } catch (err) {
      console.log(err);
      if (err.code === 'auth/billing-not-enabled') showPopup('Billing Needed', 'Enable Blaze Plan muna Bes sa Firebase Console -> Upgrade. Tapos set test phone numbers para free.', 'error');
      else showPopup('Failed', err.message, 'error');
      try { if (window.recaptchaVerifier) { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; } } catch (e) { }
    } finally { setIsSendingSms(false); }
  };

  // STEP 2 BES: VERIFY SMS OTP + NEW PASSWORD!
  const handleVerifySmsAndReset = async () => {
    if (otp.length < 6) { showPopup('Invalid', 'Enter 6-digit OTP from SMS', 'error'); return; }
    if (newPass.length < 6) { showPopup('Invalid', 'New password min 6 characters', 'error'); return; }
    setIsVerifying(true);
    try {
      const result = await confirmResult.confirm(otp);
      // SUCCESS NA VERIFY BES! NAKA-LOGIN NA SIYA AS PHONE USER!

      // NGAYON BES - DITO KAILANGAN CLOUD FUNCTION PARA PALITAN PASSWORD NG EMAIL ACCOUNT!
      // Kasi yung naka-login ngayon is phone user, hindi email user.
      // Pag may function ka na Bes:
      // const resetFunc = httpsCallable(functions, 'resetPasswordWithOtp');
      // await resetFunc({ email: forgotEmail, newPassword: newPass, uid: forgotUid });

      // TEMPORARY FOR THESIS DEMO BES - MARK AS VERIFIED LANG!
      // Sa final mo Bes, dito mo tawagin yung Cloud Function!
      await signOut(auth); // Logout phone user

      showPopup('Verified!', `Phone verified! Password of ${forgotEmail} should be updated to new password via Cloud Function.\n\nFor thesis demo without function: Manually update password in Firebase Console -> Auth -> ${forgotEmail} -> change password to: ${newPass}\n\nOr deploy this function:\nexports.resetPasswordWithOtp = functions.https.onCall(async (data) => {\n  const user = await admin.auth().getUserByEmail(data.email);\n  await admin.auth().updateUser(user.uid, { password: data.newPassword });\n  return {success:true};\n});`, 'success');

      setShowForgotModal(false); setForgotStep(1); setOtp(''); setNewPass(''); setForgotName('');

    } catch (err) {
      showPopup('Wrong OTP', err.message + ' (For test numbers, OTP is 123456)', 'error');
    } finally { setIsVerifying(false); }
  };

  const handleSocialCheck = async (user, providerType = null) => {
    const uid = user.uid; const emailLower = user.email?.toLowerCase() || '';
    const staffSnap = await getDoc(doc(db, 'staff', uid));
    const adminSnap = await getDoc(doc(db, 'admin', uid));
    if (staffSnap.exists() || adminSnap.exists()) return true;
    if (providerType === 'facebook') {
      const qFb = query(collection(db, 'soloparent'), where('facebookId', '==', uid));
      if (!(await getDocs(qFb)).empty) return true;
    }
    if (providerType === 'google') {
      const qG = query(collection(db, 'soloparent'), where('googleId', '==', uid));
      if (!(await getDocs(qG)).empty) return true;
    }
    if (emailLower) {
      const [snapP, snapS] = await Promise.all([getDocs(query(collection(db, 'pending_users'), where('emailLower', '==', emailLower))), getDocs(query(collection(db, 'soloparent'), where('emailLower', '==', emailLower)))]);
      if (!snapP.empty || !snapS.empty) {
        let docToLink = !snapS.empty ? snapS.docs[0] : snapP.docs[0];
        let colName = !snapS.empty ? 'soloparent' : 'pending_users';
        try {
          if (providerType === 'facebook') await updateDoc(doc(db, colName, docToLink.id), { facebookId: uid, facebookEmail: user.email || '' });
          else if (providerType === 'google') await updateDoc(doc(db, colName, docToLink.id), { googleId: uid, googleEmail: user.email || '' });
        } catch (e) { }
        await checkUserStatus(uid); return true;
      }
    }
    await signOut(auth); throw new Error('Account not found. Register first as Solo Parent, then connect FB/Google in Settings after approval.');
  };

  const handleFacebookLogin = async () => {
    setErrorMsg(''); setIsFbLoading(true);
    const provider = new FacebookAuthProvider(); provider.addScope('email');
    try { const result = await signInWithPopup(auth, provider); await handleSocialCheck(result.user, 'facebook'); showPopup('Success', `Logged in via Facebook!`, 'success'); }
    catch (error) { if (error.code !== 'auth/popup-closed-by-user') { setErrorMsg(error.message); showPopup('Facebook Failed', error.message, 'error'); } try { await signOut(auth); } catch (e) { } }
    finally { setIsFbLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(''); setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try { const result = await signInWithPopup(auth, provider); await handleSocialCheck(result.user, 'google'); showPopup('Success', `Logged in via Google as ${result.user.email}!`, 'success'); }
    catch (error) { if (error.code !== 'auth/popup-closed-by-user') { setErrorMsg(error.message); showPopup('Google Failed', error.message, 'error'); } try { await signOut(auth); } catch (e) { } }
    finally { setIsGoogleLoading(false); }
  };
  return (
    <div style={{ background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 70px rgba(0,0,0,0.4)', position: 'relative', overflow: 'hidden', border: '2px solid #FBBF24' }}>
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src={LOGO_IMG} alt="logo" style={{ width: '36px', height: '36px', background: '#fff', padding: '3px', borderRadius: '8px' }} />
          <div><p style={{ margin: 0, color: '#FBBF24', fontWeight: '900', fontSize: '13px' }}>SOLO PARENT SYSTEM</p><p style={{ margin: 0, color: '#dbeafe', fontSize: '9px' }}>DSWD - NAIC, CAVITE</p></div>
        </div>
        <button style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}><X size={16} color="#fff" /></button>
      </div>

      <div style={{ padding: '24px 22px 22px' }}>
        <div id="recaptcha-forgot"></div>
        {errorMsg && <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626', padding: '10px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: '700', marginBottom: '14px', display: 'flex', gap: '6px' }}><AlertTriangle size={14} /> <span>{errorMsg}</span></div>}

        <div style={{ textAlign: 'center', marginBottom: '18px' }}><h2 style={{ color: '#1E3A8A', fontSize: '24px', fontWeight: '900', margin: 0 }}>Welcome Back</h2><p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0', fontWeight: '600' }}>Support. Benefits. Community.</p></div>

        <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* PANG LITO KAY CHROME BES */}
          <input type="text" style={{ display: 'none' }} autoComplete="off" tabIndex={-1} />
          <input type="password" style={{ display: 'none' }} autoComplete="off" tabIndex={-1} />

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: nameFocus ? '#1E3A8A' : '#9ca3af', background: nameFocus ? '#dbeafe' : '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={16} /></div>
            <label style={{ position: 'absolute', left: '50px', top: fullName || nameFocus ? '-8px' : '50%', transform: fullName || nameFocus ? 'translateY(0)' : 'translateY(-50%)', fontSize: fullName || nameFocus ? '10px' : '13px', color: fullName || nameFocus ? '#1E3A8A' : '#94a3b8', fontWeight: '800', pointerEvents: 'none', transition: 'all 0.2s', background: '#fff', padding: '0 6px' }}>Full Name</label>
            <input
              type="text"
              name="sp_fullname_9x7_random"
              autoComplete="new-password"
              data-lpignore="true"
              readOnly
              onFocus={(e) => { e.target.removeAttribute('readOnly'); setNameFocus(true); }}
              onBlur={() => setNameFocus(false)}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder={nameFocus ? "Ex: Juan Dela Cruz" : ""}
              style={{ width: '100%', padding: '16px 18px 16px 54px', borderRadius: '12px', border: `${fullName || nameFocus ? '2px solid #1E3A8A' : '1.5px solid #e0e7ff'}`, fontSize: '14px', outline: 'none', height: '52px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: passFocus ? '#1E3A8A' : '#9ca3af', background: passFocus ? '#dbeafe' : '#f1f5f9', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={16} /></div>
            <label style={{ position: 'absolute', left: '50px', top: password || passFocus ? '-8px' : '50%', transform: password || passFocus ? 'translateY(0)' : 'translateY(-50%)', fontSize: password || passFocus ? '10px' : '13px', color: password || passFocus ? '#1E3A8A' : '#94a3b8', fontWeight: '800', pointerEvents: 'none', transition: 'all 0.2s', background: '#fff', padding: '0 6px' }}>Password</label>
            <input
              type={showPassword ? "text" : "password"}
              name="sp_pass_9x7_random"
              autoComplete="new-password"
              data-lpignore="true"
              readOnly
              onFocus={(e) => { e.target.removeAttribute('readOnly'); setPassFocus(true); }}
              onBlur={() => setPassFocus(false)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '16px 42px 16px 54px', borderRadius: '12px', border: `${password || passFocus ? '2px solid #1E3A8A' : '1.5px solid #e0e7ff'}`, fontSize: '14px', outline: 'none', height: '52px', boxSizing: 'border-box' }}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', width: '28px', height: '28px', borderRadius: '6px', alignItems: 'center', justifyContent: 'center' }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          </div>

          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <span onClick={() => { setForgotName(fullName); setForgotStep(1); setShowForgotModal(true); }} style={{ fontSize: '11px', color: '#1E3A8A', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}><Smartphone size={12} /> Forgot Password via SMS?</span>
          </div>

          <button type="submit" disabled={isLoading} style={{ background: isLoading ? '#9ca3af' : 'linear-gradient(135deg, #1E3A8A 0%, #2563eb 100%)', color: '#fff', padding: '14px', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '900', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'center', gap: '6px' }}>{isLoading ? 'Logging in...' : <><LogIn size={16} /> LOG IN</>}</button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '18px 0 14px' }}><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div><span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '800' }}>OR LOGIN WITH</span><div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div></div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '16px' }}>
          <button onClick={handleFacebookLogin} disabled={isFbLoading} style={{ width: '50px', height: '50px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isFbLoading ? 0.6 : 1 }}>{isFbLoading ? '...' : <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>}</button>
          <button onClick={handleGoogleLogin} disabled={isGoogleLoading} style={{ width: '50px', height: '50px', background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isGoogleLoading ? 0.6 : 1 }}>{isGoogleLoading ? '...' : <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 29.7 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c2.7 0 5.2 0.9 7.2 2.5l6-6C33.5 5.1 28.9 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20.5-7.5 20.5-21 0-1.4-0.1-2.7-0.3-3.5z" /></svg>}</button>
        </div>

        <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
          No account? <span style={{ color: '#1E3A8A', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => { onClose(); setShowRegisterModal(true); }}>Register here</span>
        </div>
      </div>

      {showForgotModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '360px', border: '2px solid #e0e7ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, color: '#1E3A8A', fontWeight: '900', fontSize: '16px', display: 'flex', gap: '6px', alignItems: 'center' }}><Smartphone size={18} /> Forgot via SMS</h3>
              <button onClick={() => { setShowForgotModal(false); setForgotStep(1); }} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}><X size={14} /></button>
            </div>

            {forgotStep === 1 ? (
              <>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px' }}>Enter Full Name</p>
                <input value={forgotName} onChange={e => setForgotName(e.target.value)} placeholder="Full Name Ex: Marijoy Retanal" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <button onClick={handleSendSmsOtp} disabled={isSendingSms} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: 'none', background: isSendingSms ? '#9ca3af' : '#1E3A8A', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>{isSendingSms ? 'Sending SMS...' : 'Send SMS OTP'}</button>
                <p style={{ fontSize: '9px', color: '#94a3b8', marginTop: '8px' }}>Tip: Add test numbers in Firebase Console for free unlimited testing! Ex: +639123456789 = 123456</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px' }}>OTP sent to <b>{forgotPhone}</b> for <b>{forgotEmail}</b></p>
                <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter 6-digit SMS OTP" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', marginBottom: '10px', boxSizing: 'border-box', letterSpacing: '4px', textAlign: 'center', fontWeight: '900' }} />
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New Password (min 6)" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '13px', marginBottom: '12px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setForgotStep(1)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #e2e8f0', background: '#fff', fontWeight: '800' }}>Back</button>
                  <button onClick={handleVerifySmsAndReset} disabled={isVerifying} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: isVerifying ? '#9ca3af' : '#16a34a', color: '#fff', fontWeight: '800' }}>{isVerifying ? 'Verifying...' : 'Reset Password'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {popup.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '22px', width: '90%', maxWidth: '340px', textAlign: 'center', borderTop: `5px solid ${popup.type === 'success' ? '#16a34a' : '#dc2626'}` }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: popup.type === 'success' ? '#dcfce7' : '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{popup.type === 'success' ? <Check size={24} color="#16a34a" /> : <AlertTriangle size={24} color="#dc2626" />}</div>
            <h3 style={{ margin: '0 0 6px', fontWeight: '900', color: '#1e293b' }}>{popup.title}</h3>
            <p style={{ margin: '0 0 16px', fontSize: '12px', color: '#475569', whiteSpace: 'pre-wrap' }}>{popup.msg}</p>
            <button onClick={() => setPopup({ ...popup, show: false })} style={{ background: popup.type === 'success' ? '#16a34a' : '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: '800', cursor: 'pointer', width: '100%' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
export default LoginPage;