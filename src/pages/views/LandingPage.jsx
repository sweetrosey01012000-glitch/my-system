import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { soloParentCategories } from '../../data/soloParentCategories';
import LoginPage from './LoginPage';
import PublicRegisterPage from './PublicRegisterPage';

const navConfig = {
  home: { title: "Welcome", desc: "Welcome to Solo Parent System of Naic, Cavite. Empowering Solo Parents through support and benefits." },
  aboutUs: {
    whoWeAre: { title: "Who We Are", videoPlaceholder: "Video coming soon" },
    missionVision: { title: "Mission & Vision", textPlaceholder: "Mission and Vision content will be placed here." }
  },
  innovations: {
    recentProjects: [{ title: "Project Title 1", desc: "Project description coming soon." }, { title: "Project Title 2", desc: "Project description coming soon." }],
    techSolutions: { title: "Tech Solutions", textPlaceholder: "Tech Solutions content will be placed here." }
  },
  programsAndServices: [], // TINANGGAL LAMAN - COMING SOON
  categoriesAndCodes: soloParentCategories,
  contactUs: { address: "Address: Naic, Cavite", phone: "Phone: (046) 890 2435", email: "Email: dswdnaiccavite@yahoo.com" }
};

const heroConfig = {
  backgroundImages: ["/vids/pic1.jpg", "/vids/pic2.jpg", "/vids/pic3.jpg", "/vids/pic4.jpg"],
  posterImg: "/vids/soloparent-logo.png"
};

function LandingPage() {
  const navigate = useNavigate();
  const { userRole, userData } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showDropdown, setShowDropdown] = useState(null);
  const [expandedCode, setExpandedCode] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    const i = setInterval(()=> setCurrentSlide(p=>(p+1)%heroConfig.backgroundImages.length),4000);
    return()=>clearInterval(i);
  },[]);

  useEffect(()=>{
    if(showLoginModal || showRegisterModal){
      document.body.style.overflow='hidden';
      document.documentElement.style.overflow='hidden';
    } else {
      document.body.style.overflow='';
      document.documentElement.style.overflow='';
    }
    return()=>{document.body.style.overflow=''; document.documentElement.style.overflow='';}
  },[showLoginModal, showRegisterModal]);

  useEffect(()=>{
    if(userRole&&userData){
      if(userRole==='admin')navigate('/admin');
      else if(userRole==='staff')navigate('/staff');
      else if(userRole==='soloparent'){
        if(userData.status==='pending'||userData.status==='denied')navigate('/status');
        else navigate('/soloparent');
      }
    }
  },[userRole,userData,navigate]);

  const toggle = (name) => setShowDropdown(showDropdown===name?null:name);

  const styles = {
    body: { fontFamily:'"Segoe UI", Arial, sans-serif', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden', background:'#fff' },
    headerTop: { background:'#1E3A8A', padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'3px solid #FBBF24' },
    navBar: { background:'#fff', padding:'12px 20px', display:'flex', justifyContent:'center', gap:'42px', borderBottom:'2px solid #FBBF24', flexWrap:'wrap' },
    navItem: { position:'relative', cursor:'pointer', color:'#1E3A8A', fontWeight:'700', fontSize:'12px', padding:'8px 4px', textTransform:'uppercase', letterSpacing:'0.3px' },
    dropdown: { position:'absolute', top:'100%', left:'0', background:'#1E3A8A', borderRadius:'10px', boxShadow:'0 12px 30px rgba(0,0,0,0.35)', padding:'14px', width:'340px', maxWidth:'calc(100vw - 24px)', zIndex:999, marginTop:'12px', border:'2px solid #FBBF24', boxSizing:'border-box' },
    dropdownWide: { position:'absolute', top:'100%', left:'0', background:'#1E3A8A', borderRadius:'10px', boxShadow:'0 12px 30px rgba(0,0,0,0.35)', padding:'12px', width:'460px', maxWidth:'calc(100vw - 20px)', maxHeight:'68vh', overflowY:'auto', zIndex:999, marginTop:'12px', border:'2px solid #FBBF24', boxSizing:'border-box' },
    dropdownRight: { position:'absolute', top:'100%', right:'0', left:'auto', background:'#1E3A8A', borderRadius:'10px', boxShadow:'0 12px 30px rgba(0,0,0,0.35)', padding:'12px', width:'460px', maxWidth:'calc(100vw - 20px)', maxHeight:'68vh', overflowY:'auto', zIndex:999, marginTop:'12px', border:'2px solid #FBBF24', boxSizing:'border-box' },
    heroWrap: { flex:1, position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' },
  };

  return (
    <div style={styles.body} onClick={()=>setShowDropdown(null)}>
      <style>{`
        @media (max-width: 1100px) {.nav-bar { gap: 28px!important; } }
        @media (max-width: 900px) {
        .nav-bar { display: ${isMobileMenuOpen? 'flex' : 'none'}!important; flex-direction: column!important; align-items: stretch!important; gap:0!important; padding: 0 12px 10px!important; background: #f8fafc!important; }
        .nav-item { width: 100%; padding: 14px 0!important; border-bottom: 1px solid #e2e8f0; font-size: 12px!important; }
        .drop { position: static!important; width: 100%!important; max-width: 100%!important; margin-top: 10px!important; }
        .mobile-toggle { display: block!important; }
        .desktop-auth { display: none!important; }
        .mobile-hero-auth { display: flex!important; }
        }
        @media (min-width: 901px) {
        .mobile-toggle { display: none!important; }
        .mobile-hero-auth { display: none!important; }
        }
       .drop-wide::-webkit-scrollbar { width: 4px; }
       .drop-wide::-webkit-scrollbar-thumb { background: #FBBF24; border-radius: 10px; }
      `}</style>

      <header style={styles.headerTop} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          <img src={heroConfig.posterImg} alt="" style={{width:'38px', height:'38px', background:'#fff', padding:'2px', borderRadius:'6px'}}/>
          <div><h1 style={{color:'#FBBF24', margin:0, fontSize:'14px', fontWeight:'900'}}>SOLO PARENT SYSTEM</h1><p style={{color:'#fff', fontSize:'8px', margin:0}}>DSWD - NAIC, CAVITE</p></div>
        </div>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <div className="desktop-auth" style={{display:'flex', gap:'8px'}}>
            <button style={{background:'transparent', color:'#fff', padding:'6px 14px', borderRadius:'5px', border:'1.5px solid #fff', fontWeight:'800', fontSize:'11px', cursor:'pointer'}} onClick={()=>setShowLoginModal(true)}>LOG IN</button>
            <button style={{background:'#FBBF24', color:'#1E3A8A', padding:'6px 16px', borderRadius:'5px', border:'none', fontWeight:'800', fontSize:'11px', cursor:'pointer'}} onClick={()=>setShowRegisterModal(true)}>REGISTER</button>
          </div>
          <button className="mobile-toggle" onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} style={{background:'#FBBF24', color:'#1E3A8A', border:'none', borderRadius:'6px', padding:'6px 12px', fontWeight:'900'}}>{isMobileMenuOpen?'✕':'☰'}</button>
        </div>
      </header>

      <nav style={styles.navBar} className="nav-bar" onClick={e=>e.stopPropagation()}>
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('home')}>Home ▼{showDropdown==='home'&&<div style={styles.dropdown} className="drop"><p style={{color:'#e0e7ff', fontSize:'10px', whiteSpace:'normal', wordBreak:'break-word', lineHeight:'1.5'}}>{navConfig.home.desc}</p></div>}</div>
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('about')}>About Us ▼{showDropdown==='about'&&<div style={styles.dropdown} className="drop"><div style={{color:'#fff', marginBottom:'10px'}}><strong style={{color:'#FBBF24', fontSize:'11px'}}>WHO WE ARE</strong><div style={{background:'#e2e8f0', height:'70px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:'10px', marginTop:'6px'}}>Video coming soon</div></div><div style={{color:'#fff'}}><strong style={{color:'#FBBF24', fontSize:'11px'}}>MISSION & VISION</strong><p style={{fontSize:'10px', color:'#e0e7ff', marginTop:'4px', whiteSpace:'normal', lineHeight:'1.4'}}>{navConfig.aboutUs.missionVision.textPlaceholder}</p></div></div>}</div>
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('innov')}>Innovations ▼{showDropdown==='innov'&&<div style={styles.dropdownWide} className="drop drop-wide"><p style={{color:'#FBBF24', fontSize:'10px', fontWeight:'800'}}>RECENT PROJECTS</p>{navConfig.innovations.recentProjects.map((p,i)=><div key={i} style={{background:'#fff', padding:'7px 8px', borderRadius:'5px', marginTop:'5px', borderLeft:'3px solid #FBBF24'}}><b style={{fontSize:'10px', color:'#1e3a8a', display:'block', whiteSpace:'normal'}}>{p.title}</b><p style={{fontSize:'9px', color:'#475569', whiteSpace:'normal', margin:'2px 0 0'}}>{p.desc}</p></div>)}</div>}</div>
        {/* PROGRAMS - WALANG LAMAN */}
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('programs')}>Programs and Services ▼{showDropdown==='programs'&&<div style={styles.dropdown} className="drop"><p style={{color:'#FBBF24', fontSize:'10px', fontWeight:'800', margin:'0 0 8px'}}>PROGRAMS & SERVICES</p><div style={{background:'rgba(255,255,255,0.08)', borderRadius:'8px', padding:'16px', textAlign:'center', border:'1.5px dashed rgba(251,191,36,0.4)'}}><p style={{color:'#94a3b8', fontSize:'11px', margin:0, fontStyle:'italic'}}>Content coming soon</p><p style={{color:'#64748b', fontSize:'9px', margin:'6px 0 0'}}>Programs will be added soon.</p></div></div>}</div>
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('categories')}>Categories and Codes ▼ {showDropdown==='categories' && ( <div style={styles.dropdownRight} className="drop drop-wide"> {navConfig.categoriesAndCodes.map((cat,i)=>( <div key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'6px 0'}}> <div onClick={(e)=>{e.stopPropagation(); setExpandedCode(expandedCode===String(cat.code).toLowerCase()?null:String(cat.code).toLowerCase())}} style={{display:'flex', justifyContent:'space-between', gap:'8px', cursor:'pointer', alignItems:'center'}}> <div style={{display:'flex', gap:'6px', flex:1, minWidth:0, alignItems:'center'}}> <span style={{background:'#FBBF24', color:'#1E3A8A', padding:'2px 6px', borderRadius:'3px', fontSize:'9px', fontWeight:'900', flexShrink:0, textTransform:'lowercase'}}>{String(cat.code).toLowerCase()}</span> <span style={{color:'#fff', fontSize:'10px', fontWeight:'600', whiteSpace:'normal', wordBreak:'break-word', lineHeight:'1.3', flex:1}}>{cat.title}</span> </div> <span style={{color:'#FBBF24', fontSize:'14px', flexShrink:0}}>{expandedCode===String(cat.code).toLowerCase()? '−':'+'}</span> </div> {expandedCode===String(cat.code).toLowerCase() && ( <div style={{marginTop:'6px', background:'rgba(0,0,0,0.3)', padding:'8px', borderRadius:'5px', border:'1px solid rgba(251,191,36,0.25)'}}> {(cat.documents||cat.requirements||[]).map((d,j)=>( <div key={j} style={{fontSize:'9px', color:'#dbeafe', marginBottom:'5px', display:'flex', gap:'5px', lineHeight:'1.4', whiteSpace:'normal', wordBreak:'break-word', overflowWrap:'anywhere'}}> <span style={{color:'#FBBF24', flexShrink:0}}>•</span><span style={{flex:1}}>{d}</span> </div> ))} </div> )} </div> ))} </div> )} </div>
        <div style={styles.navItem} className="nav-item" onClick={()=>toggle('contact')}>Contact Us ▼{showDropdown==='contact'&&<div style={styles.dropdownRight} className="drop"><div style={{color:'#dbeafe', fontSize:'10px', whiteSpace:'normal', lineHeight:'1.5'}}><p style={{color:'#FBBF24', fontWeight:'800'}}>{navConfig.contactUs.address}</p><p>{navConfig.contactUs.phone}</p><p>{navConfig.contactUs.email}</p></div></div>}</div>
      </nav>

      <div style={styles.heroWrap}>
        {heroConfig.backgroundImages.map((img, idx)=><img key={idx} src={img} alt="" style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity: idx===currentSlide?1:0, transition:'opacity 1s'}}/>)}
        <div style={{position:'absolute', inset:0, background:'rgba(30,58,138,0.35)'}}></div>
        <div className="mobile-hero-auth" style={{display:'none', position:'relative', zIndex:2, flexDirection:'column', width:'88%', maxWidth:'300px'}}>
          <div style={{background:'rgba(255,255,255,0.96)', padding:'18px', borderRadius:'14px', border:'2px solid #FBBF24', textAlign:'center'}}>
            <h2 style={{margin:'0 0 4px', color:'#1E3A8A', fontSize:'16px', fontWeight:'900'}}>Solo Parent System</h2>
            <p style={{margin:'0 0 12px', color:'#64748b', fontSize:'11px'}}>Support. Benefits. Community.</p>
            <div style={{display:'flex', gap:'8px'}}>
              <button style={{flex:1, background:'#1E3A8A', color:'#fff', padding:'11px', borderRadius:'8px', border:'none', fontWeight:'800', fontSize:'12px'}} onClick={()=>setShowLoginModal(true)}>LOG IN</button>
              <button style={{flex:1, background:'#FBBF24', color:'#1E3A8A', padding:'11px', borderRadius:'8px', border:'none', fontWeight:'800', fontSize:'12px'}} onClick={()=>setShowRegisterModal(true)}>REGISTER</button>
            </div>
          </div>
        </div>
      </div>

      {showLoginModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px'}} onClick={()=>setShowLoginModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%', maxWidth:'400px'}}>
            <LoginPage onClose={()=>setShowLoginModal(false)} setShowRegisterModal={()=>{setShowLoginModal(false); setShowRegisterModal(true);}} />
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(6px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', overflowY:'auto'}} onClick={()=>setShowRegisterModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%', maxWidth:'760px', maxHeight:'90vh', overflowY:'auto', background:'#fff', borderRadius:'20px'}}>
            <PublicRegisterPage isModal={true} onClose={()=>setShowRegisterModal(false)} onSwitchToLogin={()=>{setShowRegisterModal(false); setShowLoginModal(true);}} />
          </div>
        </div>
      )}
    </div>
  );
}

export default LandingPage;