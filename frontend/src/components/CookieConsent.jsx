import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Check language
    try {
      const storedLang = localStorage.getItem('language');
      if (storedLang) setLang(storedLang);
    } catch (e) {
      console.warn('Could not read language from localStorage:', e.message);
    }

    // Check if consent already given
    try {
      const consent = localStorage.getItem('2g2b_cookie_consent');
      if (!consent) {
        setTimeout(() => setShow(true), 1000);
      }
    } catch (e) {
      console.warn('Could not read cookie consent from localStorage:', e.message);
      // Show consent dialog as fallback when localStorage is unavailable
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('2g2b_cookie_consent', 'accepted');
    } catch (e) {
      console.warn('Could not save cookie consent:', e.message);
    }
    setShow(false);
  };

  const handleReject = () => {
    try {
      localStorage.setItem('2g2b_cookie_consent', 'rejected');
    } catch (e) {
      console.warn('Could not save cookie rejection:', e.message);
    }
    setShow(false);
  };

  if (!show) return null;

  const isFr = lang === 'fr';

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 9998
        }}
        onClick={handleAccept}
      />
      
      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '480px',
          backgroundColor: '#18181b',
          borderRadius: '16px',
          border: '1px solid #3f3f46',
          padding: '32px',
          zIndex: 9999,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Cookie Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(165, 83, 190, 0.2)',
              borderRadius: '16px'
            }}
          >
            <span style={{ fontSize: '32px' }}>🍪</span>
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: '0 0 12px 0'
          }}
        >
          {isFr ? 'Paramètres des Cookies' : 'Cookie Settings'}
        </h2>

        {/* Description */}
        <p
          style={{
            color: '#a1a1aa',
            fontSize: '14px',
            textAlign: 'center',
            lineHeight: '1.6',
            margin: '0 0 24px 0'
          }}
        >
          {isFr
            ? 'Nous utilisons des cookies pour améliorer votre expérience de navigation, analyser le trafic du site et personnaliser le contenu.'
            : 'We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.'}
        </p>

        {/* Learn More Link */}
        <p style={{ textAlign: 'center', marginBottom: '24px' }}>
          <a
            href="/cookies"
            style={{
              color: '#a553be',
              fontSize: '14px',
              textDecoration: 'underline'
            }}
          >
            {isFr ? 'En savoir plus sur notre politique de cookies' : 'Learn more about our cookie policy'}
          </a>
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleReject}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: '500',
              color: '#d4d4d8',
              backgroundColor: 'transparent',
              border: '1px solid #52525b',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            {isFr ? 'Refuser' : 'Reject'}
          </button>
          <button
            onClick={handleAccept}
            style={{
              flex: 1,
              padding: '14px 20px',
              fontSize: '15px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: '#a553be',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer'
            }}
          >
            {isFr ? 'Accepter' : 'Accept'}
          </button>
        </div>
      </div>
    </>
  );
};

export default CookieConsent;
