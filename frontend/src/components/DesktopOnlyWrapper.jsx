import { useState, useEffect } from 'react';

function DesktopOnlyWrapper({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const checkDevice = () => {
      // 1. Check User Agent for mobile signatures
      const userAgentMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      
      // 2. Check viewport width (typically < 1024px is tablet/mobile)
      const viewportMobile = window.innerWidth < 1024;

      setIsMobile(userAgentMobile || viewportMobile);
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Initial check
    checkDevice();

    // Event listener for screen resize
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  if (isMobile) {
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    return (
      <div className="desktop-restriction-page">
        <div className="restriction-card">
          <div className="restriction-header">
            <div className="brand-badge">PROGRENTURES</div>
            
            {/* Custom SVG showing clean Laptop vs Mobile restriction */}
            <div className="restriction-icon-wrapper">
              <svg className="device-svg" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
                {/* Desktop Monitor Screen */}
                <rect x="20" y="10" width="120" height="76" rx="8" fill="none" stroke="#0f172a" strokeWidth="2.5" />
                <rect x="25" y="15" width="110" height="66" rx="4" fill="#f8fafc" className="laptop-screen" />
                
                {/* Desktop Stand */}
                <path d="M70,86 L74,102 L86,102 L90,86 Z" fill="#475569" />
                <rect x="64" y="102" width="32" height="4" rx="2" fill="#334155" />

                {/* Mobile Device */}
                <g className="mobile-device-group">
                  <rect x="135" y="45" width="36" height="64" rx="6" fill="#ffffff" stroke="#dc2626" strokeWidth="2.5" />
                  {/* Phone Screen content placeholder */}
                  <rect x="139" y="51" width="28" height="46" rx="2" fill="rgba(220, 38, 38, 0.05)" />
                  {/* Speaker and Button */}
                  <line x1="149" y1="48" x2="157" y2="48" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="153" cy="102" r="2.5" fill="#cbd5e1" />
                  
                  {/* Restriction Slash Over Phone */}
                  <line x1="130" y1="110" x2="175" y2="40" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="153" cy="77" r="14" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                </g>
              </svg>
            </div>

            <h1 className="restriction-title">Desktop Access Required</h1>
            <p className="restriction-subtitle">
              This portal is restricted to desktop and laptop devices.
            </p>
          </div>

          <div className="restriction-body">
            <p className="restriction-description">
              To ensure session security, data integrity, and optimal workspace layout, the 
              <strong> Progrentures PRS Portal</strong> can only be accessed on screens with a width of 1024px or wider.
            </p>

            <div className="spec-table">
              <div className="spec-row">
                <span className="spec-label">Detected Device:</span>
                <span className={`spec-val ${isMobileAgent ? 'val-fail' : 'val-pass'}`}>
                  {isMobileAgent ? 'Mobile / Tablet Device' : 'Desktop Browser'}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Current Width:</span>
                <span className={`spec-val ${dimensions.width >= 1024 ? 'val-pass' : 'val-fail'}`}>
                  {dimensions.width}px (Required: >= 1024px)
                </span>
              </div>
            </div>

            <div className="action-hint">
              {isMobileAgent ? (
                <div className="hint-box hint-mobile">
                  <span className="hint-icon">💻</span>
                  <span>Please access this portal using a computer or laptop.</span>
                </div>
              ) : (
                <div className="hint-box hint-resize">
                  <span className="hint-icon">↕️</span>
                  <span>Please maximize your browser window or switch to a larger display.</span>
                </div>
              )}
            </div>
          </div>

          <div className="restriction-footer">
            &copy; 2026 Progrentures Solution Pvt. Ltd. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default DesktopOnlyWrapper;
