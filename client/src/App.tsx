import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import {
  Button,
  Center,
  Loader,
  MantineProvider,
  Stack,
  Text,
  localStorageColorSchemeManager,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router';
import { useTranslation } from 'react-i18next';
import { SessionProvider } from './auth/SessionContext';
import { useSession } from './auth/session';
import { ParentGate } from './auth/parent';
import { themes } from './theme/theme';
import { AppLayout } from './components/AppLayout';
import { ReloadPrompt } from './components/ReloadPrompt';
import { Mascot } from './components/Mascot';
import { WhatsNewPage } from './whatsNew/WhatsNewPage';
import { PrivacyPage } from './privacy/PrivacyPage';
import { WelcomePage } from './pages/WelcomePage';
import { EmailLoginPage } from './pages/EmailLoginPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { DashboardPage } from './pages/DashboardPage';
import { useMidi } from './input/useMidi';

// Loaded on demand (they pull in audio, notation, …); the service worker
// precaches them, so they also open offline.
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage })),
);
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
const MicTestPage = lazy(() =>
  import('./pages/MicTestPage').then((m) => ({ default: m.MicTestPage })),
);
const MicSetupPage = lazy(() =>
  import('./pages/MicSetupPage').then((m) => ({ default: m.MicSetupPage })),
);
const InputPage = lazy(() => import('./pages/InputPage').then((m) => ({ default: m.InputPage })));
const ProfileSettingsPage = lazy(() =>
  import('./pages/ProfileSettingsPage').then((m) => ({ default: m.ProfileSettingsPage })),
);
const QuickRoundPage = lazy(() =>
  import('./pages/QuickRoundPage').then((m) => ({ default: m.QuickRoundPage })),
);
const KnowledgePage = lazy(() =>
  import('./pages/KnowledgePage').then((m) => ({ default: m.KnowledgePage })),
);
const FamilyPage = lazy(() =>
  import('./family/FamilyPage').then((m) => ({ default: m.FamilyPage })),
);
const MetronomePage = lazy(() =>
  import('./pages/MetronomePage').then((m) => ({ default: m.MetronomePage })),
);
const FreePlayPage = lazy(() =>
  import('./pages/FreePlayPage').then((m) => ({ default: m.FreePlayPage })),
);
const RainGamePage = lazy(() =>
  import('./pages/RainGamePage').then((m) => ({ default: m.RainGamePage })),
);
const SongsPage = lazy(() => import('./pages/SongsPage').then((m) => ({ default: m.SongsPage })));
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const LessonPage = lazy(() =>
  import('./pages/LessonPage').then((m) => ({ default: m.LessonPage })),
);

/** Reconnects a previously allowed MIDI device as soon as the app starts. */
function MidiAutoConnect() {
  useMidi();
  return null;
}

/** Light / dark / automatic (follows the device) – remembered on this device. */
const colorSchemeManager = localStorageColorSchemeManager({ key: 'klavio-color-scheme' });

/** Theme follows the active profile's Kids/Classic choice. */
function ThemedApp({ children }: { children: ReactNode }) {
  const { activeProfile } = useSession();
  const mode = activeProfile?.uiMode ?? 'kids';
  useEffect(() => {
    document.documentElement.dataset.uiMode = mode;
  }, [mode]);
  return (
    <MantineProvider
      theme={themes[mode]}
      defaultColorScheme="auto"
      colorSchemeManager={colorSchemeManager}
    >
      <Notifications position="top-center" />
      <MidiAutoConnect />
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
        <Button onClick={() => void refresh()}>{t('common.retry')}</Button>
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
          <Suspense fallback={<FullPageLoader />}>
            <Routes>
              <Route element={<AnonymousOnly />}>
                <Route path="/welcome" element={<WelcomePage />} />
                <Route path="/login/email" element={<EmailLoginPage intent="login" />} />
                <Route path="/register" element={<EmailLoginPage intent="register" />} />
              </Route>
              <Route element={<RequireAuth />}>
                <Route path="/profiles" element={<ProfilesPage />} />
                <Route element={<RequireProfile />}>
                  <Route path="/lesson/:lessonId" element={<LessonPage />} />
                  <Route path="/quick" element={<QuickRoundPage />} />
                  <Route path="/start" element={<OnboardingPage />} />
                </Route>
                <Route element={<AppLayout />}>
                  <Route
                    path="/account"
                    element={
                      <ParentGate>
                        <AccountPage />
                      </ParentGate>
                    }
                  />
                  <Route
                    path="/family"
                    element={
                      <ParentGate>
                        <FamilyPage />
                      </ParentGate>
                    }
                  />
                  <Route element={<RequireAdmin />}>
                    <Route
                      path="/admin"
                      element={
                        <ParentGate>
                          <AdminPage />
                        </ParentGate>
                      }
                    />
                  </Route>
                  <Route element={<RequireProfile />}>
                    <Route path="/" element={<DashboardPage />} />
                    {/* learning and the microphone setup need no PIN */}
                    <Route path="/mic-test" element={<MicTestPage />} />
                    <Route path="/mic-setup" element={<MicSetupPage />} />
                    <Route
                      path="/input"
                      element={
                        <ParentGate>
                          <InputPage />
                        </ParentGate>
                      }
                    />
                    <Route path="/profile" element={<ProfileSettingsPage />} />
                    <Route path="/knowledge" element={<KnowledgePage />} />
                    <Route path="/songs" element={<SongsPage />} />
                    <Route path="/play" element={<FreePlayPage />} />
                    <Route path="/play/rain" element={<RainGamePage />} />
                    <Route path="/play/metronome" element={<MetronomePage />} />
                    <Route path="/metronome" element={<Navigate to="/play/metronome" replace />} />
                  </Route>
                </Route>
              </Route>
              {/* for visitors and learners alike */}
              <Route path="/whats-new" element={<WhatsNewPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemedApp>
    </SessionProvider>
  );
}
