import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Members } from './pages/Members';
import { Notifications } from './pages/Notifications';
import { Announcements } from './pages/Announcements';
import { Events } from './pages/Events';
import { Dashboard } from './pages/Dashboard';
import { Guidance } from './pages/Guidance';
import { ResetPassword } from './pages/ResetPassword';
import { adminApi, clearAdminSession } from './lib/api';


export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_jwt'));
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('admin_jwt'));

  // Keep React auth state in sync with localStorage (logout / 401 clears).
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('admin_jwt'));
    window.addEventListener('storage', sync);
    window.addEventListener('admin-auth-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('admin-auth-changed', sync);
    };
  }, []);

  // Drop stale/expired tokens on boot so dashboard does not show a fake session.
  useEffect(() => {
    const existing = localStorage.getItem('admin_jwt');
    if (!existing) {
      setAuthReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await adminApi.get('/admin/auth/me');
        if (!cancelled) {
          setToken(existing);
          setAuthReady(true);
        }
      } catch {
        clearAdminSession();
        if (!cancelled) {
          setToken(null);
          setAuthReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLoginSuccess = (newToken: string) => {
    localStorage.setItem('admin_jwt', newToken);
    setToken(newToken);
    window.dispatchEvent(new Event('admin-auth-changed'));
  };

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F2F7] text-[#1A2744] font-semibold">
        Checking admin session…
      </div>
    );
  }

  const requireAuth = (node: React.ReactNode) =>
    token ? <>{node}</> : <Navigate to="/login" replace />;

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/" replace />
            ) : (
              <Login
                onLoginSuccess={(newToken) => {
                  handleLoginSuccess(newToken);
                }}
              />
            )
          }
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/members" element={requireAuth(<Members />)} />

        <Route path="/notifications" element={requireAuth(<Notifications />)} />
        <Route path="/announcements" element={requireAuth(<Announcements />)} />
        <Route path="/events" element={requireAuth(<Events />)} />
        <Route path="/guidance" element={requireAuth(<Guidance />)} />
        <Route path="/" element={requireAuth(<Dashboard />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
