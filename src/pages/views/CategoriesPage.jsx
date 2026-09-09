import React from 'react';
import { useNavigate } from 'react-router-dom';
import { soloParentCategories } from '../../data/soloParentCategories';

function CategoriesPage() { 
  const navigate = useNavigate(); 
  const styles = { 
    body: { fontFamily: 'Arial, sans-serif', background: '#f8fafc', minHeight: '100vh', padding: '40px 20px' }, 
    container: { maxWidth: '1000px', margin: '0 auto', background: '#ffffff', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', borderTop: '6px solid #fbbf24' }, 
    title: { color: '#1e3a8a', fontSize: '36px', marginBottom: '10px', textAlign: 'center', fontWeight: '900' }, 
    subtitle: { color: '#475569', fontSize: '16px', textAlign: 'center', marginBottom: '40px' }, 
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }, 
    categoryCard: { background: '#ffffff', padding: '25px', borderRadius: '12px', borderLeft: '6px solid #1e3a8a', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }, 
    catHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }, 
    codeBadge: { background: '#fbbf24', color: '#1e3a8a', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '14px', textTransform: 'lowercase' }, 
    catTitle: { margin: 0, color: '#1e3a8a', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4' }, 
    reqBox: { background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', flex: 1 }, 
    reqLabel: { margin: '0 0 10px 0', fontWeight: 'bold', color: '#1e3a8a', fontSize: '14px' }, 
    list: { color: '#475569', fontSize: '13px', lineHeight: '1.6', paddingLeft: '20px', margin: 0 }, 
    btnPrimary: { background: '#1e3a8a', color: '#ffffff', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '15px', width: '100%', textAlign: 'center' }, 
    backBtn: { background: '#f1f5f9', color: '#475569', padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'block', margin: '40px auto 0' } 
  }; 
  
  return ( 
    <div style={styles.body} className="anim-fade-in"> 
      <div style={styles.container} className="anim-slide-up"> 
        <h2 style={styles.title}>Select Your Category</h2> 
        <p style={styles.subtitle}>Review the Solo Parent categories below. Select the one that matches your situation to proceed with registration.</p> 
        <div style={styles.grid}> 
          {soloParentCategories.map((cat) => ( 
            <div key={cat.code} style={styles.categoryCard} className="hover-card"> 
              <div> 
                <div style={styles.catHeader}> 
                  <span style={styles.codeBadge}>{cat.code}</span> 
                  <h4 style={styles.catTitle}>{cat.title}</h4> 
                </div> 
                <div style={styles.reqBox}> 
                  <p style={styles.reqLabel}>Required Documents:</p> 
                  <ul style={styles.list}> 
                    {cat.requirements.map((req, idx) => ( 
                      <li key={idx} style={{marginBottom: '5px'}}>{req}</li> 
                    ))} 
                  </ul> 
                </div> 
              </div> 
              <button style={styles.btnPrimary} onClick={() => navigate('/signup', { state: { selectedCategory: cat.code } })} className="hover-btn" > 
                Register as {cat.code} 
              </button> 
            </div> 
          ))} 
        </div> 
        <button style={styles.backBtn} className="hover-btn" onClick={() => navigate('/')}>Back to Home</button> 
      </div> 
    </div> 
  ); 
} 

export default CategoriesPage;