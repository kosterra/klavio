import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Button, Drawer, Group, List, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconBolt,
  IconDeviceMobileDown,
  IconDotsVertical,
  IconMaximize,
  IconShare2,
  IconSquarePlus,
  IconWifiOff,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KEYS, readJson, writeJson } from '../offline/storage';
import classes from './InstallHint.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** «Später»: asked again after this many days. */
const SNOOZE_DAYS = 7;
/** the popup comes a moment after the page – never in the learner's face right away */
const POPUP_DELAY_MS = 2500;

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad (iPadOS reports itself as a Mac with touch). */
function isIos(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.userAgent.includes('Macintosh') && navigator.maxTouchPoints > 1)
  );
}

/** A phone or small tablet (not a laptop with a touch screen). */
function isMobile(): boolean {
  const ua = navigator.userAgent;
  return (
    /Android|iPhone|iPod|Mobi/i.test(ua) ||
    (isIos() && Math.min(screen.width, screen.height) < 820) ||
    (window.matchMedia?.('(pointer: coarse)').matches &&
      Math.min(screen.width, screen.height) < 600)
  );
}

function snoozed(): boolean {
  const until = readJson<number>(KEYS.installSnoozedUntil);
  return typeof until === 'number' && Date.now() < until;
}

/** The browser's own install prompt (Chrome, Edge, Android), as soon as it offers one. */
function useInstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // our own hint instead of the browser's mini-infobar
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setPrompt(null);
    if (outcome === 'accepted') setInstalled(true);
  };
  return { prompt, installed, install };
}

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className={classes.step}>
      <span className={classes.stepNo} aria-hidden>
        {n}
      </span>
      <Text size="sm" className={classes.stepText}>
        {children}
      </Text>
      <span className={classes.stepIcon} aria-hidden>
        {icon}
      </span>
    </li>
  );
}

/**
 * Suggests installing the app (home screen, full screen, works offline).
 * `popup` (phones): a sheet from the bottom a moment after the page opens –
 * the browser's install button where there is one (Chrome, Edge, Android),
 * else the steps for Safari or the browser menu; «Später» asks again in a
 * week, «Nicht mehr zeigen» never again. `alert` (computers whose browser
 * can install): a small note inside the page.
 */
export function InstallHint({ variant = 'alert' }: { variant?: 'alert' | 'popup' }) {
  const { t } = useTranslation();
  const { prompt, installed, install } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => readJson<boolean>(KEYS.installDismissed) === true,
  );
  const [later, setLater] = useState(snoozed);
  const [due, setDue] = useState(false);
  const mobile = isMobile();
  const ios = isIos();

  useEffect(() => {
    if (variant !== 'popup') return;
    const timer = setTimeout(() => setDue(true), POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [variant]);

  if (installed || dismissed) return null;

  const never = () => {
    writeJson(KEYS.installDismissed, true);
    setDismissed(true);
  };

  if (variant === 'alert') {
    // phones get the popup; on a computer only where the browser can install
    if (mobile || !prompt) return null;
    return (
      <Alert
        color="indigo"
        variant="light"
        radius="lg"
        icon={<IconDeviceMobileDown />}
        withCloseButton
        closeButtonLabel={t('common.close')}
        onClose={never}
        title={t('install.title')}
        data-testid="install-hint"
        py="xs"
      >
        <Group mt={4}>
          <Button size="sm" onClick={() => void install()}>
            {t('install.button')}
          </Button>
        </Group>
      </Alert>
    );
  }

  if (!mobile || later) return null;
  const snooze = () => {
    writeJson(KEYS.installSnoozedUntil, Date.now() + SNOOZE_DAYS * 86_400_000);
    setLater(true);
  };

  return (
    <Drawer
      opened={due}
      onClose={snooze}
      position="bottom"
      size="auto"
      radius="lg"
      title={
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={40} radius="md" variant="gradient" aria-hidden>
            <IconDeviceMobileDown size={24} />
          </ThemeIcon>
          <Text fw={800} fz="lg">
            {t('install.title')}
          </Text>
        </Group>
      }
      closeButtonProps={{ 'aria-label': t('common.close') }}
      classNames={{ content: classes.sheet }}
      data-testid="install-hint"
    >
      <Stack gap="md" pb="xs">
        <List spacing={6} size="sm" center>
          <List.Item icon={<IconBolt size={18} className={classes.perk} />}>
            {t('install.perks.start')}
          </List.Item>
          <List.Item icon={<IconMaximize size={18} className={classes.perk} />}>
            {t('install.perks.full')}
          </List.Item>
          <List.Item icon={<IconWifiOff size={18} className={classes.perk} />}>
            {t('install.perks.offline')}
          </List.Item>
        </List>

        {prompt ? (
          <Button size="lg" fullWidth onClick={() => void install()} data-testid="install-now">
            {t('install.button')}
          </Button>
        ) : (
          <ol className={classes.steps} aria-label={t('install.how')}>
            {ios ? (
              <>
                <Step n={1} icon={<IconShare2 size={20} />}>
                  {t('install.ios1')}
                </Step>
                <Step n={2} icon={<IconSquarePlus size={20} />}>
                  {t('install.ios2')}
                </Step>
                <Step n={3} icon={null}>
                  {t('install.ios3')}
                </Step>
              </>
            ) : (
              <>
                <Step n={1} icon={<IconDotsVertical size={20} />}>
                  {t('install.menu1')}
                </Step>
                <Step n={2} icon={<IconDeviceMobileDown size={20} />}>
                  {t('install.menu2')}
                </Step>
              </>
            )}
          </ol>
        )}

        <Group justify="space-between" gap="xs">
          <Button variant="subtle" color="gray" onClick={never} data-testid="install-never">
            {t('install.never')}
          </Button>
          <Button variant="default" onClick={snooze} data-testid="install-later">
            {t('install.later')}
          </Button>
        </Group>
      </Stack>
    </Drawer>
  );
}
