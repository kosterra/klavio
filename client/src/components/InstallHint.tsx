import { useEffect, useState } from 'react';
import { Alert, Button, Group, Text } from '@mantine/core';
import { IconDeviceMobileDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { KEYS, readJson, writeJson } from '../offline/storage';

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

/**
 * Suggests installing the app (home screen, full screen, works offline).
 * Chrome/Edge/Android: native install prompt. iOS: how to do it via "Share".
 */
export function InstallHint() {
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
  if (!prompt && !ios) return null;

  const dismiss = () => {
    writeJson(KEYS.installDismissed, true);
    setDismissed(true);
  };

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
      <Text size="sm">{ios ? t('install.ios') : t('install.text')}</Text>
      {prompt && (
        <Group mt="xs">
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
        </Group>
      )}
    </Alert>
  );
}
