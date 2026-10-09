import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, Mail, Smartphone, MapPin, LogOut, Volume2, RefreshCw, Shield, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { auth } from '../../../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const SettingsTab = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  // SOFT DARK - DI MASAKIT SA MATA BES!
  const [darkMode, setDarkMode] = useState(localStorage.getItem('sp_dark') === 'true');
  const [notif, setNotif] = useState(() => {
    const saved = localStorage.getItem('staff_notif');
    return saved? JSON.parse(saved) : { email: true, sms: false, inApp: true, sound: true, autoRefresh: true };
  });

  useEffect(() => {
    localStorage.setItem('staff_notif', JSON.stringify(notif));
  }, [notif]);

  const theme = darkMode? {
    bg: '#12151e',
    card: '#1e222e',
    card2: '#252a38',
    text: '#cbd5e1',
    textMuted: '#94a3b8',
    border: '#2a2f40',
    accent: '#1e3a8a'
  } : {
    bg: '#f8fafc',
    card: '#ffffff',
    card2: '#f8fafc',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    accent: '#1e3a8a'
  };

  const toggleTheme = () => {
    const n =!darkMode;
    setDarkMode(n);
    localStorage.setItem('sp_dark', n? 'true' : 'false');
    localStorage.setItem('theme', n? 'dark' : 'light');
    window.dispatchEvent(new Event('sp_theme_changed'));
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const cardStyle = {
    background: theme.card,
    color: theme.text,
    borderRadius: '16px',
    padding: '16px',
    border: `1px solid ${theme.border}`,
    transition: 'all 0.3s ease',
    boxShadow: darkMode? 'none' : '0 2px 12px rgba(0,0,0,0.04)'
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: '14px', color: theme.text, background: theme.bg, minHeight: '100%', padding: '4px', transition: 'all 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap');
       .hover-card:hover{ transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12)!important; }
      `}</style>

      <div style={cardStyle} className="hover-card">
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', display: 'flex', gap: '8px', color: darkMode? theme.text : '#1E3A8A' }}><Shield size={18}/> Staff Settings</h2>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: theme.textMuted, display: 'flex', gap: '6px', alignItems: 'center' }}><User size={10}/> {userData?.username || 'Staff'} • <MapPin size={10}/> {userData?.assignedBarangay || userData?.barangay || 'All Barangays'}</p>
      </div>

      <div style={cardStyle} className="hover-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ background: darkMode? theme.card2 : '#dbeafe', padding: '8px', borderRadius: '10px', border: `1px solid ${theme.border}` }}>
              {darkMode? <Moon size={16} color={theme.text}/> : <Sun size={16} color="#1E3A8A"/>}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '12px', fontWeight: '800' }}>Dark / Light Mode</p>
              <p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{darkMode? 'Soft dark - di masakit sa mata' : 'Light mode'}</p>
            </div>
          </div>
          <button onClick={toggleTheme} style={{ width: '48px', height: '26px', borderRadius: '20px', background: darkMode? '#FACC15' : '#e2e8f0', border: 'none', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: darkMode? '#1e222e' : 'white', position: 'absolute', top: '3px', left: darkMode? '24px' : '3px', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}></div>
          </button>
        </div>
      </div>

      <div style={cardStyle} className="hover-card">
        <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '800', display: 'flex', gap: '6px', alignItems: 'center' }}><Bell size={14} color={theme.text}/> Notification Preferences - New Solo Parent Application</h3>
        {[
          { key: 'email', label: 'Email Alerts', desc: 'Email pag may bagong application', icon: Mail },
          { key: 'sms', label: 'SMS Alerts', desc: 'SMS pag may urgent application', icon: Smartphone },
          { key: 'inApp', label: 'In-App Alerts', desc: 'Pop-up sa system', icon: Bell },
          { key: 'sound', label: 'Sound Alert', desc: 'Tumunog pag may bago', icon: Volume2 },
          { key: 'autoRefresh', label: 'Auto-Refresh (5 mins)', desc: 'Auto kuha ng bagong data', icon: RefreshCw },
        ].map(i => (
          <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: theme.card2, borderRadius: '12px', marginBottom: '8px', border: `1px solid ${theme.border}`, transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><i.icon size={16} color={theme.textMuted}/><div><p style={{ margin: 0, fontSize: '12px', fontWeight: '700', color: theme.text }}>{i.label}</p><p style={{ margin: 0, fontSize: '10px', color: theme.textMuted }}>{i.desc}</p></div></div>
            <button onClick={() => setNotif({...notif, [i.key]:!notif[i.key] })} style={{ width: '44px', height: '24px', borderRadius: '20px', background: notif[i.key]? '#FACC15' : theme.border, border: 'none', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
              <div style={{ width: '18px', height: '18px', background: notif[i.key]? '#1e222e' : 'white', borderRadius: '50%', position: 'absolute', top: '3px', left: notif[i.key]? '22px' : '3px', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
            </button>
          </div>
        ))}
      </div>

      
    </div>
  );
};

export default SettingsTab;