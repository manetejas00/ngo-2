import React, { useEffect, useState } from 'react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    document.title = 'Admin Dashboard — Avinya Care Foundation';
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    // Default admin credentials per setup: admin@gmail.com / Admin@1230
    if (email === 'admin@gmail.com' && password === 'Admin@1230') {
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Invalid login credentials. Please check admin email & password.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B1313', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: '#F8FAFC' }}>
        <div style={{ background: 'rgba(18, 30, 29, 0.95)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '20px', padding: '3rem 2.5rem', width: '100%', maxWidth: '450px' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <img src="assets/logo-emblem.png" alt="Avinya Care Logo" style={{ width: '48px', height: '48px', marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Portal Login</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Avinya Care Foundation Dashboard</p>
          </div>

          {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#EF4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{errorMsg}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#CBD5E1' }}>Admin Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.4)', color: '#FFFFFF', outline: 'none' }} />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#CBD5E1' }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(0, 0, 0, 0.4)', color: '#FFFFFF', outline: 'none' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', background: '#087F73' }}>
              <span>Authenticate &amp; Enter Dashboard →</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0B1313', color: '#F8FAFC', padding: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="assets/logo-emblem.png" alt="Avinya Care Logo" style={{ width: '40px' }} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Avinya Care Admin Console</h1>
            <span style={{ fontSize: '0.8rem', color: '#10B981' }}>● Live Staging Data Ledger</span>
          </div>
        </div>
        <button onClick={() => setIsAuthenticated(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>Logout</button>
      </header>

      <main style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(18, 30, 29, 0.85)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Total Form Submissions</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#087F73', marginTop: '0.5rem' }}>148</div>
          </div>
          <div style={{ background: 'rgba(18, 30, 29, 0.85)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Pending Patient Calls</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#F59E0B', marginTop: '0.5rem' }}>12</div>
          </div>
          <div style={{ background: 'rgba(18, 30, 29, 0.85)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Confirmed Diagnostic Slots</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', marginTop: '0.5rem' }}>64</div>
          </div>
        </div>
      </main>
    </div>
  );
}
