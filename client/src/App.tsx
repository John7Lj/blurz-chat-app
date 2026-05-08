import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';
import AppShell from './components/layout/AppShell';
import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

// Lazy loaded pages
const LoginPage = lazy(() => import('./features/auth/LoginPage'));
const SignupPage = lazy(() => import('./features/auth/SignupPage'));
const ChatLayout = lazy(() => import('./features/chat/ChatLayout'));
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'));
const ContactsPage = lazy(() => import('./features/contacts/ContactsPage'));
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'));
const NotificationsPage = lazy(() => import('./features/notifications/NotificationsPage'));
const NotFoundPage = lazy(() => import('./features/notifications/NotFoundPage'));

// ── Loading Fallback ────────────────────────────────────────────────
function LoadingFallback() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-primary)',
      }}
    >
      <div
        className="animate-fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          className="animate-spin"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid var(--color-accent)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    </div>
  );
}

// ── Route Guards ────────────────────────────────────────────────────
function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/chat" replace />;
  return <>{children}</>;
}

// ── Main App ────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const theme = useUIStore((s) => s.theme);

  // ── Sync theme to DOM ──────────────────────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleAuthError = () => {
      logout();
      navigate('/login');
    };
    window.addEventListener('auth-error', handleAuthError);
    return () => window.removeEventListener('auth-error', handleAuthError);
  }, [logout, navigate]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />

        {/* Protected App Shell Layout */}
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/chat" replace />} />
          <Route path="chat" element={<ChatLayout />} />
          <Route path="chat/:id" element={<ChatLayout />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
