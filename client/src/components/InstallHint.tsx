import { useEffect, useState } from 'react';
import { ActionIcon, Alert, Button, Group, Text } from '@mantine/core';
import { IconDeviceMobileDown, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KEYS, readJson, writeJson } from '../offline/storage';
import classes from './InstallHint.module.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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

/**
 * Suggests installing the app (home screen, full screen, works offline).
 * Chrome/Edge/Android: native install prompt. iOS: how to do it via "Share".
 * Phones whose browser offers no prompt (Firefox, Samsung Internet …) get the
 * way through the browser menu. `banner`: a card at the bottom of the screen,
 * only on phones (start page); `alert`: inside the page (dashboard).
 */
export function InstallHint({ variant = 'alert' }: { variant?: 'alert' | 'banner' }) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => readJson<boolean>(KEYS.installDismissed) === true,
  );
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // show our own button instead of the browser's mini-infobar
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

  if (installed || dismissed) return null;
  const ios = isIos();
  const mobile = isMobile();
  if (variant === 'banner' && !mobile) return null;
  if (!prompt && !ios && !mobile) return null;
  const text = prompt ? t('install.text') : ios ? t('install.ios') : t('install.android');

  const dismiss = () => {
    writeJson(KEYS.installDismissed, true);
    setDismissed(true);
  };

  const installButton = prompt && (
    <Button
      size="sm"
      onClick={async () => {
        await prompt.prompt();
        const { outcome } = await prompt.userChoice;
        setPrompt(null);
        if (outcome === 'accepted') setInstalled(true);
      }}
    >
      {t('install.button')}
    </Button>
  );

  if (variant === 'banner') {
    return (
      <aside className={classes.banner} aria-labelledby="install-title" data-testid="install-hint">
        <span className={classes.icon} aria-hidden>
          <IconDeviceMobileDown size={26} />
        </span>
        <div className={classes.body}>
          <Text fw={800} id="install-title">
            {t('install.title')}
          </Text>
          <Text size="sm">{text}</Text>
          {installButton && <Group mt="xs">{installButton}</Group>}
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={dismiss}
          aria-label={t('common.close')}
        >
          <IconX size={20} />
        </ActionIcon>
      </aside>
    );
  }

  return (
    <Alert
      color="indigo"
      variant="light"
      radius="lg"
      icon={<IconDeviceMobileDown />}
      withCloseButton
      closeButtonLabel={t('common.close')}
      onClose={dismiss}
      title={t('install.title')}
      data-testid="install-hint"
    >
      <Text size="sm">{text}</Text>
      {installButton && <Group mt="xs">{installButton}</Group>}
    </Alert>
  );
}
