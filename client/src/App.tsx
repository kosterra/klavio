import { useEffect, type ReactNode } from 'react';
import { Button, Center, Loader, MantineProvider, Stack, Text } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SessionProvider } from './auth/SessionContext';
import { useSession } from './auth/session';
import { themes } from './theme/theme';
import { AppLayout } from './components/AppLayout';
import { ReloadPrompt } from './components/ReloadPrompt';
import { Mascot } from './components/Mascot';
import { WelcomePage } from './pages/WelcomePage';
import { EmailLoginPage } from './pages/EmailLoginPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { DashboardPage } from './pages/DashboardPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';

/** Theme follows the active profile's Kids/Classic choice. */
function ThemedApp({ children }: { children: ReactNode }) {
  const { activeProfile } = useSession();
  const mode = activeProfile?.uiMode ?? 'kids';
  useEffect(() => {
    document.documentElement.dataset.uiMode = mode;
  }, [mode]);
  return (
    <MantineProvider theme={themes[mode]} defaultColorScheme="light">
      <Notifications position="top-center" />
      {children}
      <ReloadPrompt />
    </MantineProvider>
  );
}

function FullPageLoader() {
  const { t } = useTranslation();
  return (
    <Center mih="100dvh">
      <Loader size="xl" aria-label={t('common.loading')} />
    </Center>
  );
}

function Offline() {
  const { t } = useTranslation();
  const { refresh } = useSession();
  return (
    <Center mih="100dvh" p="md">
      <Stack align="center">
        <Mascot mood="think" />
        <Text ta="center">{t('common.error')}</Text>
        <Button onClick={() => void refresh()}>{t('common.continue')}</Button>
      </Stack>
    </Center>
  );
}

function AnonymousOnly() {
  const { status } = useSession();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to="/profiles" replace />;
  return <Outlet />;
}

function RequireAuth() {
  const { status } = useSession();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'offline') return <Offline />;
  if (status !== 'authenticated') return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

function RequireProfile() {
  const { activeProfile } = useSession();
  if (!activeProfile) return <Navigate to="/profiles" replace />;
  return <Outlet />;
}

function RequireAdmin() {
  const { me } = useSession();
  if (me?.user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

export function App() {
  return (
    <SessionProvider>
      <ThemedApp>
        <BrowserRouter>
          <Routes>
            <Route element={<AnonymousOnly />}>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/login/email" element={<EmailLoginPage intent="login" />} />
              <Route path="/register" element={<EmailLoginPage intent="register" />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="/profiles" element={<ProfilesPage />} />
              <Route element={<AppLayout />}>
                <Route path="/account" element={<AccountPage />} />
                <Route element={<RequireAdmin />}>
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
                <Route element={<RequireProfile />}>
                  <Route path="/" element={<DashboardPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemedApp>
    </SessionProvider>
  );
}
