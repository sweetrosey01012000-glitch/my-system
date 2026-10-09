import React, { useState } from 'react';

function FloatingField({ id, label, value = "", onChange, error, required, icon: Icon, children, type = "text" }) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const hasValue = value !== "" && value !== null;
  const isActive = focused || hasValue;
  const hasIcon = !!Icon || !!children;
  
  return (
    <div style={{ width: '100%' }}>
      <div 
        onMouseEnter={() => setHovered(true)} 
        onMouseLeave={() => setHovered(false)} 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          // FIXED: KAHIT MAY ERROR BLUE/GRAY LANG, HINDI NA PULA
          border: focused ? '2px solid #1E3A8A' : hovered ? '2px solid #1E3A8A' : '1.5px solid #dbeafe', 
          borderRadius: '12px', 
          background: '#FFFFFF', 
          height: '52px', 
          transition: 'all 0.2s ease', 
          boxShadow: focused ? '0 0 0 4px rgba(30,58,138,0.1)' : 'none', 
          overflow: 'hidden' 
        }}
      >
        {Icon && (
          <div style={{ 
            paddingLeft: '14px', 
            paddingRight: '10px', 
            color: focused || hovered ? '#1E3A8A' : '#64748b', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <Icon size={18} />
          </div>
        )}
        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <label htmlFor={id} style={{ 
            position: 'absolute', 
            left: hasIcon ? '2px' : '14px', 
            top: isActive ? '6px' : '50%', 
            transform: isActive ? 'none' : 'translateY(-50%)', 
            fontSize: isActive ? '10px' : '13px', 
            // FIXED: HINDI NA PULA KAHIT MAY ERROR
            color: focused ? '#1E3A8A' : '#64748b', 
            fontWeight: isActive ? '800' : '500', 
            transition: 'all 0.2s ease', 
            pointerEvents: 'none' 
          }}>
            {label} {required && <span style={{ color: '#ef4444' }}></span>}
          </label>
          {children ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'flex-end', paddingTop: '14px', paddingBottom: '6px', paddingRight: '10px', paddingLeft: !Icon ? '6px' : '0px' }}>
              {children}
            </div>
          ) : (
            <input 
              id={id} 
              type={type} 
              autoComplete="off" 
              value={value} 
              onChange={onChange} 
              onFocus={() => setFocused(true)} 
              onBlur={() => setFocused(false)} 
              style={{ 
                width: '100%', 
                border: 'none', 
                outline: 'none', 
                background: 'transparent', 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#1E3A8A', 
                padding: isActive ? `16px 10px 2px ${hasIcon ? '2px' : '6px'}` : `2px 10px 2px ${hasIcon ? '2px' : '6px'}` 
              }} 
            />
          )}
        </div>
      </div>
      {/* ITO NA LANG MATITIRA: TEXT NA ⚠️ Required */}
      {error && <div style={{ color: '#ef4444', fontSize: '11px', fontWeight: '700', marginTop: '3px' }}>⚠️ {error}</div>}
    </div>
  )
}

export default FloatingField;