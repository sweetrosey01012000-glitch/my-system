import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import PublicRegisterPage from './PublicRegisterPage';
import LoginPage from './LoginPage';
import { soloParentCategories } from './CategoriesPage';

// ==========================================
// FRONT PAGE NAV CONFIGURATION DATA (PLACEHOLDERS)
// ==========================================
const navConfig = {
  aboutUs: {
    whoWeAre: { title: "Who We Are", videoPlaceholder: "Video coming soon" },
    missionVision: { title: "Mission & Vision", textPlaceholder: "Mission and Vision content will be placed here." }
  },
  innovations: {
    recentProjects: [
      { title: "Project Title 1", desc: "Project description coming soon." },
      { title: "Project Title 2", desc: "Project description coming soon." }
    ],
    techSolutions: { title: "Tech Solutions", textPlaceholder: "Tech Solutions content will be placed here." }
  },
  programsAndServices: ["Program 1", "Program 2", "Program 3"],
  categoriesAndCodes: [
    {
      code: "a1", title: "Birth of a Child",
      documents: ["Birth certificate/s of the child or children.", "Complaint affidavit.", "Medical record on the incident of rape.",
        "Sworn affidavit declaring that the solo parent has the sole parental care and support of the child or children at the time of the execution of affidavit: Provided, that for purposes of issuance of subsequent SPIC and booklet, only the sworn affidavit shall be submitted every year.",
        "Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and the child or children is/are under the parental care and support of the solo parent.",
        "Solo Parents Orientation Seminar Certificate of Attendance."]
    },

    {
      code: "a2", title: "Widow/Widower",
      documents: ['Birth certificate/s of the child or children.', 'Marriage certificate.', 'Death certificate of the spouse.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent, and has the sole parental care and support of the child or children: Provided, that for purposes of issuance of subsequent SPIC and booklet, only the sworn affidavit shall be submitted every year.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "a3", title: "Spouse of person deprived of liberty",
      documents: ['Birth certificate/s of the child or children.', 'Marriage certificate.',
        'Certificate of detention or a certification that the spouse is serving sentence for at least three (3) months issued by the law-enforcement agency having actual custody of the detained spouse or commitment order by the court pursuant to a conviction of the spouse.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent, and has the sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement numbers (3) and (4) under this paragraph shall be submitted every year.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "a4", title: "Spouse of person with physical or mental incapacity",
      documents: ['Birth certificate/s of the child or children.', 'Marriage certificate or affidavit of cohabitation.',
        'Medical records, medical abstract, or a certificate of confinement in the National Center for Mental Health or any medical hospital or facility as a result of the spouse\'s physical or mental incapacity, which record, medical abstract or certificate of confinement of the incapacitated spouse should have been issued not more than three (3) months before the submission, or a valid Person With Disability ID issued pursuant to Republic Act No. 10754 and Republic Act No. 7277, or the Magna Carta for Disabled Persons.',
        'Sworn affidavit that the solo parent is not cohabiting with a partner or co-parent and has sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement numbers (3) and (4) under this paragraph shall be submitted every year.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "a5", title: "Due to legal separation or de facto separation",
      documents: ['Birth certificate/s of the child or children.', 'Marriage certificate.',
        'Judicial decree of legal separation of the spouses or, in the case of de facto separation, an affidavit of two (2) disinterested persons attesting to the fact of separation of the spouses.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent, and has sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement numbers (3) and (4) under this paragraph shall be submitted every year.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "a6", title: "Due to nullity or annulment of marriage",
      documents: ['Birth certificate/s of the child or children.',
        'Marriage certificate, annotated with the fact of declaration of nullity of marriage or annulment of marriage.',
        'Judicial decree of nullity or annulment of marriage or judicial recognition of foreign divorce.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent and has sole parental care and support of the child or children: Provided, that for purposes of issuance of subsequent SPIC and booklet, only the sworn affidavit shall be submitted every year.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "a7", title: "Abandonment by the spouse",
      documents: ['Birth certificate/s of the child or children.',
        'Marriage certificates or affidavit of the applicant solo parent.',
        'Affidavit of two (2) disinterested persons attesting to the fact of abandonment of the spouse.',
        'Police or barangay record of the fact of abandonment.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent, and has sole parental care and support of the child or children: Provided, that for purposes of issuance of subsequent SPIC and booklet, only sworn affidavit shall be submitted every year, and.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "b1", title: "Spouse of OFW",
      documents: ['Birth certificate/s of dependents.',
        'Marriage certificate, if the applicant is the spouse of the OFW, or birth certificate or the other competent proof of the relationship between the applicant and the OFW, if the applicant is a family member of the OFW.',
        'Philippine Overseas Employment Administration Standard Employment Contract (POEA-SEC) or its equivalent document.',
        'Photocopy of the OFW\'s passport with stamps showing continuous twelve (12) months of overseas work, or a certification from the Bureau of Immigration.',
        'Proof of income of the OFW\'s spouse or family member.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent and has sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement numbers (3), (4), (5), and (6) under this paragraph shall be submitted every year, and.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "c", title: "Unmarried person",
      documents: ['Birth certificate/s of the child or children.',
        'Certificate of No Marriage (CENOMAR).',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent and has sole parental care and support of the child or children: Provided, That for the purposes of issuance of subsequent SPIC and booklet, requirement numbers (2), (3) and (4) under this paragraph shall be submitted every year, and.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "d", title: "Legal guardian / Adoptive parent / Foster parent",
      documents: ['Birth certificate/s of the child or children.',
        'Proof of guardianship, such as the decision granting legal guardianship issued by a court; proof of adoption, such as the decree of adoption issued by a court, or order of Adoption issued by the DSWD or the National Authority on Child Care (NACC); proof of foster care such as the Foster Parent License issued by the DSWD or the NACC.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent and has sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement number (3) and (4) under this paragraph shall be submitted every year, and.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "e", title: "Relative within the fourth (4th) civil degree of consanguinity or affinity",
      documents: ['Birth certificate/s of the child or children.',
        'Death certificate, certificate of incapacity, or judicial declaration of absence or presumptive death of the parents or legal guardian; police or barangay records evidencing the fact of disappearance or absence of the parent or legal guardian for at least six (6) months.',
        'Proof of relationship of the relative to the parent or legal guardian, such as birth certificate, marriage certificate, family records, or other similar or analogous proof of relationship.',
        'Sworn affidavit declaring that the solo parent has sole parental care and support of the child or children: Provided, That for purposes of issuance of subsequent SPIC and booklet, requirement numbers (3) and (4) under this paragraph shall be submitted every year, and.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay and that the child or children is/are under the parental care and support of the solo parent, and.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    },

    {
      code: "f", title: "Pegnant woman", documents: ['Medical record of her pregnancy.',
        'Affidavit of a barangay official attesting that the solo parent is a resident of the barangay, and.',
        'Sworn affidavit declaring that the solo parent is not cohabiting with a partner or co-parent who is providing support to the pregnant woman.',
        'Solo Parents Orientation Seminar Certificate of Attendance.']
    }

  ],
  contactUs: {
    address: "Address: Naic, Cavite",
    phone: "Phone: (046) 890 2435",
    email: "Email: dswdnaiccavite@yahoo.com"
  }
};

// ==========================================
// FRONT PAGE HERO CONFIGURATION DATA
// ==========================================
const heroConfig = {
  backgroundImages: [
    "/vids/pic1.jpg",
    "/vids/pic2.jpg",
    "/vids/pic3.jpg",
    "/vids/pic4.jpg"
  ],
  posterImg: "/vids/soloparent-logo.png",
  title: "",
  subtitle: ""
};

// ==========================================
// LANDING PAGE COMPONENT
// ==========================================
function LandingPage() {
  const navigate = useNavigate();
  const { userRole, userData } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroConfig.backgroundImages.length);
    }, 4000); // 4 seconds bawat image
    return () => clearInterval(interval);
  }, []);

  const [showDropdown, setShowDropdown] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hero Modal & Login States
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);


  // Securely redirect based on AuthContext state
  useEffect(() => {
    if (userRole && userData) {
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'staff') navigate('/staff');
      else if (userRole === 'soloparent') {
        if (userData.status === 'pending' || userData.status === 'denied') navigate('/status');
        else navigate('/soloparent');
      } else navigate('/unauthorized');
    }
  }, [userRole, userData, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error during login:', error);
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    alert("Register clicked! Email: " + email); // pang test muna
    setShowRegisterModal(false);
  };

  const handleForgotPassword = async () => {
    const resetEmail = window.prompt("Please enter your email address to reset your password:", email);
    if (!resetEmail) return;
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert(`Password reset email sent to ${resetEmail}! Please check your inbox.`);
    } catch (error) {
      console.error("Error sending reset email:", error);
      alert("Failed to send reset email: " + error.message);
    }
  };

  const toggleDropdown = (menuName) => {
    if (showDropdown === menuName) {
      setShowDropdown(null);
    } else {
      setShowDropdown(menuName);
      setExpandedCode(null);
    }
  };

  const styles = {
    body: { fontFamily: 'Poppins, sans-serif', background: '#f4f7fc', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'auto', overflowY: 'auto' },
    header: { background: '#ffffff', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', borderBottom: '4px solid #fbbf24', position: 'relative', zIndex: 10, flexWrap: 'wrap', flexDirection: 'row' },
    logoTitle: { color: '#1e3a8a', margin: 0, fontSize: '24px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '10px', minWidth: 'max-content' },
    navContainer: { display: 'flex', gap: '35px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', flex: 1, flexDirection: 'row', position: 'relative' },
    mobileMenuBtn: { display: 'none', background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#1e3a8' },
    navItem: { position: 'relative', cursor: 'pointer', color: '#1e3a8a', fontWeight: 'bold', fontSize: '14px', padding: '10px 12px', userSelect: 'none' },
    dropdownMenu: { position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#1e3a8a', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px 20px', width: 'auto', minWidth: '250px', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', scrollbarWidth: 'none', zIndex: 1000, whiteSpace: 'normal' },
    dropdownMenuRight: { position: 'absolute', top: '100%', right: '0', background: '#1e3a8a', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px 20px', width: 'auto', minWidth: '500px', maxWidth: '90vw', zIndex: 1000, whiteSpace: 'normal' },
    dropdownMenuRightWide: { position: 'absolute', top: '100%', right: '0', background: '#1e3a8a', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px 0', width: 'auto', minWidth: '850px', maxWidth: '95vw', maxHeight: '70vh', overflowY: 'auto', zIndex: 1000, whiteSpace: 'normal' },
    dropdownMenuCentered: { position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', background: '#1e3a8a', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', padding: '15px 20px', minWidth: '280px', zIndex: 1000, whiteSpace: 'normal' },
    cardContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
    dropdownSection: { padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' },
    videoPlaceholder: { background: '#94a3b8', height: '120px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e293b', fontSize: '14px', marginTop: '10px', fontWeight: 'bold' },
    placeholderText: { fontSize: '13px', margin: '5px 0 0 0', color: '#cbd5e1' },
    imageCardPlaceholder: { background: '#f1f5f9', padding: '15px', borderRadius: '6px', color: '#334155' },
    eventCard: { background: 'rgba(255,255,255,0.1)', padding: '15px', margin: '10px 15px', borderRadius: '6px', color: '#fffff' },
    dropdownItem: { padding: '12px 20px', color: '#ffffff', fontSize: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'left', whiteSpace: 'normal', wordWrap: 'break-word' },
    accordionContent: { marginTop: '12px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', borderLeft: '3px solid #fbbf24' },
    navButtons: { display: 'flex', gap: '10px', minWidth: 'max-content' },
    navItemWhite: { color: '#fff', fontSize: '15px', fontWeight: '700', cursor: 'pointer', position: 'relative', padding: '15px 20px', transition: 'opacity 0.2s', display: 'block' },
    main: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0', zIndex: 1, position: 'relative' },
    heroTitle: { color: '#1e3a8a', fontSize: '48px', fontWeight: '900', marginBottom: '20px' },
    heroSub: { color: '#475569', fontSize: '18px', maxWidth: '600px', marginBottom: '40px', lineHeight: '1.6' },
    btnGroup: { display: 'flex', gap: '20px', justifyContent: 'center' },
    btnPrimary: { background: '#fbbf24', color: '#1e3a8a', padding: '15px 40px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '18px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    btnSecondary: { background: '#ffffff', color: '#1e3a8a', padding: '15px 40px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: '2px solid #1e3a8a', cursor: 'pointer', fontSize: '18px' },
    infoBox: { background: '#f8fafc', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #fbbf24', margin: '10px', textAlign: 'left', color: '#334155', fontSize: '14px', lineHeight: '1.6' }
  };

  return (
    <div style={styles.body} className="anim-fade-in landing-page-wrapper">

      <style>{`
  /* ===== MOBILE RESPONSIVE FIX ===== */
  @media (max-width: 980px) {
    body { overflow-x: hidden !important; }
    
    /* HEADER - gawing pababa */
    .main-header { 
      flex-direction: column !important; 
      padding: 15px 20px !important; 
      align-items: center !important;
      gap: 12px !important;
      text-align: center !important;
    }
    .main-header img { width: 70px !important; height: 70px !important; }
    .main-header > div:last-child { 
      width: 100% !important; 
      justify-content: center !important; 
      gap: 10px !important;
    }

    /* NAV - gawing wrap at center */
    .main-nav {
      flex-wrap: wrap !important;
      justify-content: center !important;
      padding: 10px 5px !important;
      gap: 10px 15px !important;
      height: auto !important; /* alisin yung 50px na fixed */
    }
    .main-nav .nav-item { 
      font-size: 13px !important; 
      padding: 6px 10px !important; 
      white-space: nowrap !important;
    }

    /* DROPDOWN - full width sa mobile */
    .nav-item-dropdown { 
      position: fixed !important;
      top: 170px !important; /* baba ng header+nav */
      left: 0 !important;
      width: 100% !important;
      border-radius: 0 !important;
      border-top: 3px solid #fbbf24 !important;
      z-index: 9999 !important;
      max-height: 70vh !important;
      overflow-y: auto !important;
    }

    /* BANNER - fit sa screen */
    .banner-img {
      width: 100% !important;
      height: 240px !important; /* binaba ko para di humaba */
      object-fit: cover !important;
      display: block !important;
    }
  }
`}</style>
      {/* ===== HEADER PUTI ===== */}
      <header className="main-header" style={{
        background: '#ffffff',
        padding: '12px 60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>


        {/* KALIWA: Logo + Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={heroConfig.posterImg}
            alt="Solo Parent Logo"
            style={{ width: '50px', height: '50px', objectFit: 'cover' }}
          />
          <div>
            <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: '900' }}>SOLO PARENT SYSTEM</h3>
            <p style={{ margin: 0, color: '#b45309', fontSize: '11px', fontWeight: '700' }}>DEPARTMENT OF SOCIAL WELFARE AND DEVELOPMENT</p>
            <p style={{ margin: 0, color: '#64748b', fontSize: '10px' }}>Republic of the Philippines</p>
          </div>
        </div>

        {/* KAN: Buttons lang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={{
            padding: '8px 18px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            background: '#fff',
            color: '#1e3a8a',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }} onClick={() => setShowLoginModal(true)}>
            Log In
          </button>

          <button style={{
            padding: '8px 18px',
            border: 'none',
            borderRadius: '6px',
            background: '#d97706',
            color: '#fff',
            fontWeight: '700',
            fontSize: '14px',
            cursor: 'pointer'
          }} onClick={() => setShowRegisterModal(true)}>
            Register
          </button>
        </div>
      </header>

      <nav className="main-nav" style={{
        background: 'linear-gradient(90deg, #1e40af 0%, #2563eb 100%)', /* DARK BLUE GAYA SA PIC MO */
        padding: '0 60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50px',
        gap: '50px',
        position: 'relative',
        zIndex: 50,
      }} onClick={() => setShowDropdown(null)}>

        <div className="nav-item" style={styles.navItemWhite} onClick={() => navigate('/')}>
          Home
        </div>

        <div className="nav-item" style={styles.navItemWhite} onClick={(e) => { e.stopPropagation(); toggleDropdown('about') }}>
          About Us ▼
          {showDropdown === 'about' && (
            <div style={styles.dropdownMenu} className="anim-slide-up nav-item-dropdown" onClick={(e) => e.stopPropagation()}>
              <div style={styles.dropdownSection}>
                <strong>{navConfig.aboutUs.whoWeAre.title}</strong>
                <div style={styles.videoPlaceholder}>{navConfig.aboutUs.whoWeAre.videoPlaceholder}</div>
              </div>
              <div style={styles.dropdownSection}>
                <strong>{navConfig.aboutUs.missionVision.title}</strong>
                <p style={styles.placeholderText}>{navConfig.aboutUs.missionVision.textPlaceholder}</p>
              </div>
            </div>
          )}
        </div>

        <div className="nav-item" style={styles.navItemWhite} onClick={(e) => { e.stopPropagation(); toggleDropdown('innovations') }}>
          Innovations ▼
          {showDropdown === 'innovations' && (
            <div style={styles.dropdownMenu} className="anim-slide-up nav-item-dropdown" onClick={(e) => e.stopPropagation()}>
              <div style={styles.dropdownSection}>
                <strong>{navConfig.innovations.techSolutions.title}</strong>
                <p style={styles.placeholderText}>{navConfig.innovations.techSolutions.textPlaceholder}</p>
              </div>
              <div style={styles.dropdownSection}>
                <strong>Recent Projects</strong>
                <div style={styles.cardContainer}>
                  {navConfig.innovations.recentProjects.map((proj, i) => (
                    <div key={i} style={styles.imageCardPlaceholder}>
                      <strong>{proj.title}</strong>
                      <p>{proj.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="nav-item" style={styles.navItemWhite} onClick={(e) => { e.stopPropagation(); toggleDropdown('programs') }}>
          Programs and Services ▼
          {showDropdown === 'programs' && (
            <div style={styles.dropdownMenu} className="anim-slide-up nav-item-dropdown" onClick={(e) => e.stopPropagation()}>
              {navConfig.programsAndServices.map((prog, i) => (
                <div key={i} style={styles.dropdownItem}>{prog}</div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-item" style={styles.navItemWhite} onClick={(e) => { e.stopPropagation(); toggleDropdown('categories') }}>
          Categories and Codes ▼
          {showDropdown === 'categories' && (
            <div style={styles.dropdownMenuRightWide} className="anim-slide-up nav-item-dropdown" onClick={(e) => e.stopPropagation()}>
              {navConfig.categoriesAndCodes.map((cat, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* ROW */}
                  <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px' }}>
                    <div onClick={() => setExpandedCode(expandedCode === cat.code ? null : cat.code)} style={{ cursor: 'pointer', fontWeight: 'bold', display: 'flex', gap: '15px', flex: 1 }}>
                      <span style={{ minWidth: '100px', flexShrink: 0 }}>Code {cat.code.toUpperCase()}</span>
                      <span style={{ flex: 1 }}>- {cat.title}</span>
                    </div>
                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{expandedCode === cat.code ? '−' : '+'}</span>
                  </div>

                  {/* ACCORDION - NILABAS KO NA DITO */}
                  {expandedCode === cat.code && (
                    <div style={{ ...styles.accordionContent, margin: '0 20px 15px 20px' }}>
                      <div style={{ fontSize: '12px', marginBottom: '5px', color: '#fbbf24', fontWeight: 'bold' }}>Required Documents:</div>
                      {cat.documents.map((doc, j) => (<div key={j} style={{ fontSize: '12px', marginLeft: '10px', marginBottom: '4px' }}>• {doc}</div>))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="nav-item" style={styles.navItemWhite} onClick={(e) => { e.stopPropagation(); toggleDropdown('contact') }}>
          Contact Us ▼
          {showDropdown === 'contact' && (
            <div style={{ ...styles.dropdownMenuRight, minWidth: '200px' }} className="anim-slide-up nav-item-dropdown" onClick={(e) => e.stopPropagation()}>
              <div style={styles.dropdownSection}>
                <strong>{navConfig.contactUs.address}</strong>
                <p style={styles.placeholderText}>{navConfig.contactUs.phone}</p>
                <p style={styles.placeholderText}>{navConfig.contactUs.email}</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* HERO SECTION */}
        <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
          {heroConfig.backgroundImages.map((img, index) => (
            <img
              key={index}
              className="banner-img"
              src={img}
              alt={`Slide ${index + 1}`}
              style={{
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                opacity: index === currentSlide ? 1 : 0,
                transition: 'opacity 1s ease-in-out'
              }}
            />
          ))}
        </div>
      </main>

      {showLoginModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowLoginModal(false)}>

          <div style={{
            background: 'rgba(255, 255, 255, 0.95)', // WHITE GLASS NA
            backdropFilter: 'blur(25px)',
            borderRadius: '24px',
            padding: '45px 40px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 70px rgba(0,0,0,0.4)',
            border: '1px solid rgba(37, 99, 235, 0.2)', // blue border
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>

            {/* CLOSE BUTTON */}
            <button style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0,0,0,0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer',
              color: '#1e40af', // BLUE
              fontSize: '20px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
              onClick={() => setShowLoginModal(false)}>✕</button>

            {/* TITLE */}
            <div style={{ textAlign: 'center', marginBottom: '35px' }}>
              <h2 style={{
                color: '#1e40af', // BLUE
                fontSize: '32px',
                fontWeight: '800',
                marginBottom: '8px'
              }}>Welcome Back</h2>
            </div>

            <form onSubmit={handleLogin}>
              {/* EMAIL - FLOATING LABEL */}
              <div style={{ marginBottom: '22px', position: 'relative' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '18px 18px 10px 18px',
                    borderRadius: '14px',
                    border: '2px solid #e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#1e293b', // BLACK TEXT
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
                <label style={{
                  position: 'absolute',
                  left: '18px',
                  top: email ? '8px' : '50%', // aakyat pag may laman
                  transform: email ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: email ? '12px' : '15px',
                  color: email ? '#2563eb' : '#64748b',
                  fontWeight: '600',
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease'
                }}>
                  Email Address
                </label>
              </div>

              {/* PASSWORD - FLOATING LABEL */}
              <div style={{ marginBottom: '12px', position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '18px 50px 10px 18px',
                    borderRadius: '14px',
                    border: '2px solid #e2e8f0',
                    fontSize: '15px',
                    outline: 'none',
                    background: '#f8fafc',
                    color: '#1e293b'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563eb'; e.target.style.background = '#fff' }}
                  onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.background = '#f8fafc' }}
                />
                <label style={{
                  position: 'absolute',
                  left: '18px',
                  top: password ? '8px' : '50%',
                  transform: password ? 'translateY(0)' : 'translateY(-50%)',
                  fontSize: password ? '12px' : '15px',
                  color: password ? '#2563eb' : '#64748b',
                  fontWeight: '600',
                  pointerEvents: 'none',
                  transition: 'all 0.2s ease'
                }}>
                  Password
                </label>

                {/* EYE ICON */}
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    fontSize: '22px',
                    userSelect: 'none',
                    transition: 'transform 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                >
                  {showPassword ? '👁️' : '🙈'}
                </span>

                <div style={{ textAlign: 'right', marginTop: '12px', fontSize: '14px', color: '#2563eb', cursor: 'pointer', fontWeight: '600' }} onClick={handleForgotPassword}>
                  Forgot Password?
                </div>
              </div>

              {/* BUTTON - YELLOW WITH HOVER */}
              <button type="submit" style={{
                background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)', // YELLOW
                color: '#1e40af', // BLUE TEXT
                padding: '16px',
                border: 'none',
                borderRadius: '14px',
                fontSize: '17px',
                fontWeight: '800',
                cursor: 'pointer',
                width: '100%',
                marginTop: '20px',
                boxShadow: '0 8px 25px rgba(251,191,36,0.4)',
                transition: 'all 0.2s'
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(251,191,36,0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(251,191,36,0.4)';
                }}>
                Login
              </button>

              <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                No account? <span style={{ color: '#2563eb', fontWeight: '700', cursor: 'pointer' }} onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }}>Register here</span>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', zIndex: 9999, // GINAWANG 9999
            display: 'flex', justifyContent: 'center', alignItems: 'center', // CENTER NA
            padding: '20px', overflowY: 'auto'
          }}
          onClick={() => setShowRegisterModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '550px',
              maxHeight: '90vh', // PARA SCROLLABLE PAG MAHABA
              overflowY: 'auto',
              background: '#fff', // PARA MAY PUTING BOX
              borderRadius: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <PublicRegisterPage onClose={() => setShowRegisterModal(false)} /> {/* DAGDAG ONCLOSE */}
          </div>
        </div>
      )} {/* <-- ITO YUNG KULANG SAYO */}

    </div>
  );
}

export default LandingPage;