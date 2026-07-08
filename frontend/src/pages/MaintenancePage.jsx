import React, { useState, useEffect } from 'react';

const MaintenancePage = () => {
  console.log('MaintenancePage loaded');
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(2, 0, 0, 0);

      const difference = target - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        padding: '48px',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.12)',
        textAlign: 'center',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{
          color: '#324158',
          fontSize: '32px',
          marginBottom: '16px'
        }}>
          Under Maintenance
        </h1>
        <p style={{
          color: '#64748b',
          fontSize: '16px',
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          We are currently performing scheduled maintenance. The portal will be available again soon!
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {Object.entries(timeLeft).map(([unit, value]) => {
            const paddedValue = String(value).padStart(2, '0');
            return (
              <div key={unit} style={{
                background: '#324158',
                color: '#ffffff',
                padding: '16px 24px',
                borderRadius: '8px',
                minWidth: '80px'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  marginBottom: '4px'
                }}>
                  {paddedValue}
                </div>
                <div style={{
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {unit}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#94a3b8'
        }}>
          We apologize for any inconvenience caused.
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
