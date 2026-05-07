import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router';
import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';
import AppShell from './components/layout/AppShell';
import type { ReactNode } from 'react';

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
    <div className="min-h-dvh flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="flex flex-col items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
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
