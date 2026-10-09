import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { soloParentCategories } from '../../data/soloParentCategories';
import LoginPage from './LoginPage';
import PublicRegisterPage from './PublicRegisterPage';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, Target, Video, Mic, Heart, Lightbulb, GraduationCap, HandCoins, AlertTriangle, CheckCircle, Star, Monitor, Gift, PersonStanding, Rocket, Users, ChevronDown, ChevronUp, FileText, Folder, MapPin, Phone, Mail } from 'lucide-react';

const navConfig = {
  home: { desc: "Welcome to Solo Parent System of Naic, Cavite." },
  contactUs: { address: "Naic, Cavite", phone: "(046) 890 2435", email: "dswdnaiccavite@yahoo.com" },
  categoriesAndCodes: soloParentCategories
};

const heroConfig = {
  backgroundImages: ["/vids/pic1.jpg", "/vids/pic2.jpg", "/vids/pic3.jpg", "/vids/pic4.jpg"],
  posterImg: "/vids/soloparent-logo.png"
};

function LandingPage() {
  const navigate = useNavigate();
  const { userRole, userData } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setCurrentSlide(p => (p + 1) % heroConfig.backgroundImages.length), 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (showLoginModal || showRegisterModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showLoginModal, showRegisterModal]);

  useEffect(() => {
    if (userRole && userData) {
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'staff') navigate('/staff');
      else if (userRole === 'soloparent') {
        if (userData.status === 'pending' || userData.status === 'denied') navigate('/status');
        else navigate('/soloparent');
      }
    }
  }, [userRole, userData, navigate]);

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
  };

  const styles = {
    body: { fontFamily: '"Inter", sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', overflowY: 'auto', overflowX: 'hidden' },
    headerTop: { background: '#1E3A8A', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #FBBF24', position: 'sticky', top: 0, zIndex: 1001 },
    navBar: { background: '#fff', padding: '12px 20px', display: 'flex', justifyContent: 'center', gap: '32px', borderBottom: '2px solid #FBBF24', flexWrap: 'wrap', position: 'sticky', top: '62px', zIndex: 1000 },
    navItem: { cursor: 'pointer', color: '#1E3A8A', fontWeight: '800', fontSize: '11px', padding: '8px 4px', textTransform: 'uppercase', letterSpacing: '0.5px' },
    heroWrap: { position: 'relative', minHeight: '85vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  };

  return (
    <div style={styles.body}>
      <style>{`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  html { scroll-behavior: smooth; }
    * { font-family: 'Inter', sans-serif !important; box-sizing: border-box; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: #FACC15; border-radius: 10px; }
  
  @media (max-width: 900px) {
    .nav-bar { 
      display: ${isMobileMenuOpen ? 'flex' : 'none'}!important; 
      flex-direction: column!important; 
      gap:0!important; 
      padding: 0 12px 10px!important; 
      background: #f8fafc!important; 
      top: 62px!important; 
    }
    .nav-item { width: 100%; padding: 14px 0!important; border-bottom: 1px solid #e2e8f0; }
    .mobile-toggle { display: block!important; }
    .desktop-auth { display: none!important; }
    .mobile-hero-auth { display: flex!important; }
    .mobile-overlay { display: block!important; }
    .about-grid { grid-template-columns: 1fr!important; }
    .values-grid { grid-template-columns: 1fr 1fr!important; }
  }
  
  @media (min-width: 901px) {
    .mobile-toggle { display: none!important; }
    .mobile-hero-auth { display: none!important; }
    .mobile-overlay { display: none!important; }
  }
`}</style>

      <header style={styles.headerTop}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => scrollTo('home')}>
          <img src={heroConfig.posterImg} alt="" style={{ width: '38px', height: '38px', background: '#fff', padding: '2px', borderRadius: '6px' }} />
          <div>
            <h1 style={{ color: '#FBBF24', margin: 0, fontSize: '14px', fontWeight: '900' }}>SOLO PARENT SYSTEM</h1>
            <p style={{ color: '#fff', fontSize: '8px', margin: 0, fontWeight: '700' }}>MSWD - NAIC, CAVITE</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* SA DESKTOP LANG LALABAS TO BES, SA MOBILE NAKATAGO! */}
          <div className="desktop-auth" style={{ display: isMobile ? 'none' : 'flex', gap: '8px' }}>
            <button style={{ background: 'transparent', color: '#fff', padding: '7px 16px', borderRadius: '8px', border: '1.5px solid #fff', fontWeight: '800', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => setShowLoginModal(true)}>
              <LogIn size={14} /> LOG IN
            </button>
            <button style={{ background: '#FBBF24', color: '#1E3A8A', padding: '7px 18px', borderRadius: '8px', border: 'none', fontWeight: '900', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }} onClick={() => navigate('/signup')}>
              <UserPlus size={14} /> REGISTER
            </button>
          </div>
          <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: '#FBBF24', color: '#1E3A8A', border: 'none', borderRadius: '8px', padding: '6px 12px', fontWeight: '900', display: isMobile ? 'block' : 'none' }}>{isMobileMenuOpen ? '✕' : '☰'}</button>
        </div>
      </header>

      <nav style={styles.navBar} className="nav-bar">
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('home')}>HOME</div>
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('about')}>ABOUT US</div>
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('innovations')}>INNOVATIONS</div>
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('programs')}>PROGRAMS</div>
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('categories')}>CATEGORIES</div>
        <div style={styles.navItem} className="nav-item" onClick={() => scrollTo('contact')}>CONTACT</div>

        <div className="mobile-auth-buttons" style={{ display: 'none', flexDirection: 'column', gap: '8px', padding: '14px 0', width: '100%' }}>
          <button onClick={() => { setIsMobileMenuOpen(false); setShowLoginModal(true); }} style={{ width: '100%', background: '#1E3A8A', color: '#fff', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '800', fontSize: '13px', cursor: 'pointer' }}>LOG IN</button>
          <button onClick={() => { setIsMobileMenuOpen(false); setShowRegisterModal(true); }} style={{ width: '100%', background: '#FACC15', color: '#1E3A8A', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: '900', fontSize: '13px', cursor: 'pointer' }}>REGISTER</button>
        </div>
      </nav>

      <div id="home" style={{ width: '100%', background: '#fff', padding: 0, margin: 0, display: 'block' }}>
        {/* PICTURE - ISANG PICTURE LANG BES PARA WALANG GULO! */}
        <img
          src={heroConfig.backgroundImages[currentSlide]}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            display: 'block',
            margin: 0,
            padding: 0,
          }}
        />

        {/* SA MOBILE LANG LALABAS SA BABA NG PICTURE - SAME STYLE NG HEADER BES! */}
        {isMobile && (
          <div style={{ width: '100%', background: '#fff', display: 'flex', justifyContent: 'center', gap: '10px', padding: '16px' }}>
            <button
              style={{ background: 'transparent', color: '#1E3A8A', padding: '10px 22px', borderRadius: '8px', border: '1.5px solid #1E3A8A', fontWeight: '800', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => setShowLoginModal(true)}
            > <LogIn size={14} /> LOG IN
            </button>
            <button
              style={{ background: '#FBBF24', color: '#1E3A8A', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: '900', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => navigate('/signup')}
            > <UserPlus size={14} /> REGISTER
            </button>
          </div>
        )}
      </div>

      <section id="about" style={{ fontFamily: "'Inter', sans-serif", background: '#ffffff', padding: '70px 20px', borderTop: '4px solid #FACC15' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ISA NALANG BES KAGAYA NG IBA BES 24px BES */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '24px',
              fontWeight: '900',
              padding: '8px 24px',
              borderRadius: '20px',
              border: '1px solid #fde68a',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 8px 0',
              letterSpacing: '0.5px'
            }}>
              About Us
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#64748b', margin: '10px auto 0 auto', maxWidth: '500px' }}>
              Empowering solo parents in Naic, Cavite through accessible information and support
            </p>
            <div style={{ width: '60px', height: '5px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)', margin: '16px auto 0', borderRadius: '10px' }} />
          </div>

          {/* MISSION & VISION */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '40px' }} className="about-grid">
            <div style={{ background: 'white', border: '1.5px solid #dbeafe', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(30,58,138,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(30,58,138,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30,58,138,0.05)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' }} />
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Target size={20} color="#FACC15" />
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '15px', fontWeight: '900', color: '#1E3A8A' }}>Our Mission</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', lineHeight: '1.7', color: '#475569' }}>SoloParent InfoLink is a comprehensive multimedia guide platform created to assist solo parents in Naic, Cavite. We aim to make accessing information, benefits, and support from the MSWD easier, faster, and more accessible.</p>
            </div>
            <div style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '24px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(250,204,21,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(250,204,21,0.2)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(250,204,21,0.1)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #FACC15 0%, #1E3A8A 100%)' }} />
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FACC15 0%, #fde047 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <Eye size={20} color="#1E3A8A" />
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '15px', fontWeight: '900', color: '#1E3A8A' }}>Our Vision</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', lineHeight: '1.7', color: '#475569' }}><b style={{ color: '#1E3A8A' }}>MSWD of Naic, Cavite where no solo parent is left behind.</b> A platform where, with just one click, there are answers, assistance, and a community.</p>
            </div>
          </div>

          {/* WHO WE ARE - INAYOS KO NA BES WALA NA DUPLICATE BES */}
          <div style={{ background: 'white', border: '1.5px solid #1E3A8A', borderRadius: '16px', padding: '24px', marginBottom: '40px', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(30,58,138,0.08)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(30,58,138,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30,58,138,0.08)' }} className="about-grid" >
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 50%, #1E3A8A 100%)' }} />
            <div>
              <span style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', color: '#FBBF24', fontSize: '10px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px', fontFamily: "'Inter', sans-serif" }}>WHO WE ARE</span>
              <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '12px 0 10px 0', fontSize: '18px', fontWeight: '900', color: '#1E3A8A' }}>IT Students + MSWD Naic</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', lineHeight: '1.7', color: '#475569' }}>We are IT students from <b style={{ color: '#1E3A8A' }}>Cavite State University, Naic Campus</b> who have partnered with MSWD of Naic, Cavite to digitize and enhance services for solo parents through multimedia.</p>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Meet our team - 4 passionate developers Bes!</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: '12px', border: '2px dashed #cbd5e1', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ fontSize: '20px' }}>👤</div><p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '9px', fontWeight: '800', color: '#94a3b8' }}>MEMBER 1</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)', borderRadius: '12px', border: '2px dashed #fde68a', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ fontSize: '20px' }}>👤</div><p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '9px', fontWeight: '800', color: '#92400e' }}>MEMBER 2</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', borderRadius: '12px', border: '2px dashed #cbd5e1', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ fontSize: '20px' }}>👤</div><p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '9px', fontWeight: '800', color: '#94a3b8' }}>MEMBER 3</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)', borderRadius: '12px', border: '2px dashed #fde68a', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div style={{ fontSize: '20px' }}>👤</div><p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '9px', fontWeight: '800', color: '#92400e' }}>MEMBER 4</p>
              </div>
            </div>
          </div>

          {/* WHAT MAKES US DIFFERENT */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: '900', color: '#1E3A8A', margin: '0 0 6px 0', textAlign: 'center' }}>What Makes Us Different</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", textAlign: 'center', color: '#64748b', fontSize: '12px', margin: '0 0 20px 0' }}>Comprehensive Multimedia Guide</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }} className="about-grid">
              {[
                { icon: Video, title: 'Video Guides', desc: 'Step-by-step instructions on applying for benefits - watch from home', grad: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' },
                { icon: Mic, title: 'Audio / Podcast', desc: 'Listen while cooking or working - for busy solo parents', grad: 'linear-gradient(90deg, #FACC15 0%, #1E3A8A 100%)' },
                { icon: Users, title: 'Community Hub', desc: 'Connect with fellow solo parents - you are not alone', grad: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' },
              ].map((item, i) => (
                <div key={i} style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '14px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)' }} >
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: item.grad }} />
                  <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', border: '1px solid #fde68a' }}>
                    <item.icon size={22} color="#1E3A8A" />
                  </div>
                  <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 8px 0', fontSize: '13px', fontWeight: '900', color: '#1E3A8A' }}>{i + 1}. {item.title}</h4>
                  <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.5' }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section id="innovations" style={{ fontFamily: "'Inter', sans-serif", background: '#f8fafc', padding: '70px 20px', borderTop: '4px solid #FACC15' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* ISA NALANG BES KAGAYA NG CATEGORIES AND CODES BES */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '24px',
              fontWeight: '900',
              padding: '8px 24px',
              borderRadius: '20px',
              border: '1px solid #fde68a',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 8px 0',
              letterSpacing: '0.5px'
            }}>
              Innovations
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#64748b', margin: '10px auto 0 auto', maxWidth: '500px' }}>
              Solving real problems for solo parents in Naic, Cavite
            </p>
            <div style={{ width: '60px', height: '5px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)', margin: '16px auto 0', borderRadius: '10px' }} />
          </div>

          {/* PROBLEM & SOLUTION WITH HOVER + GRADIENT */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }} className="about-grid">
            <div style={{ background: 'white', border: '1.5px solid #fecaca', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(220,38,38,0.06)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(220,38,38,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(220,38,38,0.06)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #dc2626 0%, #f87171 100%)' }} />
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid #fecaca' }}>
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: '#991b1b' }}>Problem</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', color: '#7f1d1d', lineHeight: '1.6' }}>Difficulty of finding important information and services in one place. </p>
            </div>
            <div style={{ background: 'white', border: '1.5px solid #bbf7d0', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(22,163,74,0.06)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(22,163,74,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(22,163,74,0.06)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #16a34a 0%, #4ade80 100%)' }} />
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid #bbf7d0' }}>
                <CheckCircle size={20} color="#16a34a" />
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '14px', fontWeight: '900', color: '#166534' }}>Solution</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', color: '#14532d', lineHeight: '1.6' }}>Simple digital platform where users can easily find useful information and resources - lahat nasa iisang app na!</p>
            </div>
          </div>

          {/* UNIQUE FEATURES, TECHNOLOGY, BENEFITS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }} className="about-grid">
            {[
              { icon: Star, title: 'Unique Features', grad: 'linear-gradient(90deg, #FACC15 0%, #1E3A8A 100%)', items: ['Organized information by category & barangay', 'Multimedia - video guides & audio podcast', 'Announcements & community hub'] },
              { icon: Monitor, title: 'Technology', grad: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)', isText: true, text: 'We use modern technology to make information easier to access through a user-friendly digital platform.' },
              { icon: Gift, title: 'Benefits', grad: 'linear-gradient(90deg, #16a34a 0%, #FACC15 100%)', items: ['Save time - hindi na pipila', 'Easy to find info & resources', 'Convenient & accessible 24/7'] },
            ].map((card, idx) => (
              <div key={idx} style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '20px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)' }} >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: card.grad }} />
                <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', border: '1px solid #fde68a' }}>
                  <card.icon size={20} color="#1E3A8A" />
                </div>
                <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: '#1E3A8A' }}>{card.title}</h4>
                {card.isText ? (
                  <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '11.5px', color: '#475569', lineHeight: '1.6' }}>{card.text}</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {card.items.map((it, i) => <li key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '11.5px', color: '#475569' }}>{it}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* ACCESSIBILITY & FUTURE */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', marginBottom: '28px' }} className="about-grid">
            <div style={{ background: 'white', border: '1.5px solid #1E3A8A', borderRadius: '16px', padding: '22px', display: 'flex', gap: '16px', alignItems: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(30,58,138,0.06)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(30,58,138,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30,58,138,0.06)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' }} />
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PersonStanding size={28} color="#FACC15" />
              </div>
              <div>
                <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 6px 0', fontSize: '14px', fontWeight: '900', color: '#1E3A8A' }}>Accessibility</h4>
                <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12px', color: '#475569', lineHeight: '1.6' }}>Simple and easy to use, even for users with limited technical knowledge.</p>
              </div>
            </div>
            <div style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '22px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(250,204,21,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(250,204,21,0.18)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(250,204,21,0.1)' }} >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #FACC15 0%, #f59e0b 100%)' }} />
              <div style={{ width: '40px', height: '40px', background: 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                <Rocket size={20} color="#92400e" />
              </div>
              <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '13px', fontWeight: '900', color: '#92400e' }}>Future Improvements</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '11px', color: '#78350f', lineHeight: '1.6' }}>Adding more features, services, and resources based on needs of users - livelihood, scholarship, atbp.</p>
            </div>
          </div>

          {/* BOTTOM BANNER */}
          <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #1E3A8A 100%)', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 25px rgba(30,58,138,0.2)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #FACC15 0%, #fde047 50%, #FACC15 100%)' }} />
            <div style={{ width: '48px', height: '48px', background: 'rgba(250,204,21,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto', border: '1px solid rgba(250,204,21,0.3)' }}>
              <Lightbulb size={24} color="#FACC15" />
            </div>
            <h3 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 10px 0', fontSize: '16px', fontWeight: '900', color: '#FACC15' }}>Innovation</h3>
            <p style={{ fontFamily: "'Inter', sans-serif", margin: '0 auto', fontSize: '12.5px', color: '#e0e7ff', lineHeight: '1.7', maxWidth: '750px' }}>
              Our project uses technology to make important information easier to access and understand. It combines digital information, multimedia content, and user-friendly features in one platform.
            </p>
          </div>

        </div>
      </section>

      <section id="categories" style={{ fontFamily: "'Inter', sans-serif", background: '#f8fafc', padding: '70px 20px', borderTop: '4px solid #FACC15' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            {/* H2 NALANG BES - KAGAYA NG CONTACT US BES BILOG BES */}
            <h2 style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '24px',
              fontWeight: '900',
              padding: '8px 24px',
              borderRadius: '9999px',
              border: '1px solid #fde68a',
              fontFamily: "'Inter', sans-serif",
              margin: '0 0 8px 0',
              letterSpacing: '0.5px'
            }}>
              Categories and Codes
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#64748b', margin: '10px auto 0 auto', maxWidth: '500px' }}>
              Official codes and requirements for solo parent registration
            </p>
            <div style={{ width: '60px', height: '5px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)', margin: '16px auto 0', borderRadius: '10px' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {navConfig.categoriesAndCodes.map((cat, i) => {
              const isOpen = expandedCategory === i;
              return (
                <div key={i} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', position: 'relative', transition: 'all 0.3s ease', boxShadow: isOpen ? '0 10px 25px rgba(30,58,138,0.10)' : '0 4px 12px rgba(0,0,0,0.04)' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: isOpen ? 'linear-gradient(90deg, #FACC15 0%, #1E3A8A 100%)' : 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', cursor: 'pointer', background: isOpen ? 'linear-gradient(135deg, #FFFBEB 0%, #fef3c7 100%)' : '#fff' }} onClick={() => setExpandedCategory(isOpen ? null : i)}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1 }}>
                      <span style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', color: '#FACC15', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: '900', fontFamily: "'Inter', sans-serif" }}>{cat.code}</span>
                      <b style={{ fontFamily: "'Inter', sans-serif", fontSize: '13.5px', color: '#0f172a', fontWeight: '800' }}>{cat.title}</b>
                    </div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: isOpen ? 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)' : 'linear-gradient(135deg, #FACC15 0%, #fde047 100%)', color: isOpen ? '#FACC15' : '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', transition: 'all 0.3s ease' }}>
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 20px 20px 20px', background: 'linear-gradient(135deg, #FFFBEB 0%, #fffef5 100%)', borderTop: '2px solid #fde68a' }}>
                      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(cat.documents || cat.requirements || []).map((doc, j) => (
                          <div key={j} style={{ background: '#fff', border: '1.5px solid #fde68a', borderLeft: '4px solid #1E3A8A', borderRadius: '10px', padding: '12px 14px', display: 'flex', gap: '10px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                            <div style={{ width: '24px', height: '24px', background: '#eff6ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FileText size={14} color="#1E3A8A" />
                            </div>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: '900', fontSize: '12px', color: '#1E3A8A' }}>{j + 1}.</span>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: '#334155' }}>{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" style={{ fontFamily: "'Inter', sans-serif", background: '#ffffff', padding: '70px 20px', borderTop: '4px solid #FACC15' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* H2 NALANG BES PERO STYLE KAGAYA NG SPAN SA ABOUT US BES */}
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <h2 style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '24px',
              fontWeight: '900',
              padding: '8px 24px',
              borderRadius: '9999px',
              border: '1px solid #fde68a',
              fontFamily: "'Inter', sans-serif",
              margin: '0',
              letterSpacing: '0.5px',
              lineHeight: '1.2'
            }}>
              CONTACT US
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#64748b', margin: '12px auto 0 auto', maxWidth: '500px' }}>
              Get in touch with MSWDO Naic, Cavite for assistance
            </p>
            <div style={{ width: '60px', height: '5px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)', margin: '16px auto 0', borderRadius: '10px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }} className="about-grid">
            <div style={{ background: 'white', border: '1.5px solid #dbeafe', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(30,58,138,0.06)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(30,58,138,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30,58,138,0.06)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #1E3A8A 0%, #FACC15 100%)' }} />
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                <MapPin size={26} color="#FACC15" />
              </div>
              <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 8px 0', fontSize: '13px', fontWeight: '900', color: '#1E3A8A' }}>Address</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>Naic, Cavite</p>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>MSWDO Office</p>
            </div>

            <div style={{ background: 'white', border: '1.5px solid #fde68a', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(250,204,21,0.1)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(250,204,21,0.18)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(250,204,21,0.1)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #FACC15 0%, #1E3A8A 100%)' }} />
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #FACC15 0%, #fde047 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto' }}>
                <Phone size={26} color="#1E3A8A" />
              </div>
              <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 8px 0', fontSize: '13px', fontWeight: '900', color: '#1E3A8A' }}>Phone</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '13px', color: '#475569', fontWeight: '600' }}>(046) 890 2435</p>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>Mon-Fri 8AM-5PM</p>
            </div>

            <div style={{ background: 'white', border: '1.5px solid #dbeafe', borderRadius: '16px', padding: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(30,58,138,0.06)' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(30,58,138,0.12)' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(30,58,138,0.06)' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #1E3A8A 0%, #16a34a 100%)' }} />
              <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px auto', border: '1px solid #dbeafe' }}>
                <Mail size={26} color="#1E3A8A" />
              </div>
              <h4 style={{ fontFamily: "'Inter', sans-serif", margin: '0 0 8px 0', fontSize: '13px', fontWeight: '900', color: '#1E3A8A' }}>Email</h4>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12px', color: '#475569', fontWeight: '600', wordBreak: 'break-all' }}>dswdnaiccavite@yahoo.com</p>
              <p style={{ fontFamily: "'Inter', sans-serif", margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>We reply within 24hrs</p>
            </div>
          </div>

          <div style={{ marginTop: '28px', background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%)', borderRadius: '16px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: 'linear-gradient(90deg, #FACC15 0%, #fde047 100%)' }} />
            <p style={{ fontFamily: "'Inter', sans-serif", margin: 0, fontSize: '12.5px', color: '#e0e7ff' }}>Need help? Visit us at <b style={{ color: '#FACC15' }}>MSWDO Naic, Cavite</b> or message us online!</p>
          </div>
        </div>
      </section>
      <footer style={{ background: '#1E3A8A', color: '#fff', padding: '18px', textAlign: 'center', fontSize: '10px', borderTop: '4px solid #FACC15' }}>
        © 2026 SoloParent InfoLink - MSWD Naic, Cavite
      </footer>

      {/* LOGIN MODAL - AYOS HINDI NA FADED / DOUBLE BORDER */}
      {showLoginModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }} onClick={() => setShowLoginModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px' }}>
            <LoginPage onClose={() => setShowLoginModal(false)} setShowRegisterModal={() => { setShowLoginModal(false); setShowRegisterModal(true); }} />
          </div>
        </div>
      )}


      {showRegisterModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }} onClick={() => setShowRegisterModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '780px', margin: '20px auto', background: '#fff', borderRadius: '20px', border: '2.5px solid #FACC15', overflow: 'hidden', boxShadow: '0 25px 80px rgba(0,0,0,0.4)' }}>
            <PublicRegisterPage isModal={true} onClose={() => setShowRegisterModal(false)} onSwitchToLogin={() => { setShowRegisterModal(false); setShowLoginModal(true); }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;