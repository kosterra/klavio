import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import i18n from '../i18n';

const RELOADED_KEY = 'klavio-chunk-reload';

/** A page's code could not be loaded (an update replaced it, or the connection dropped). */
const isLoadFailure = (err: unknown) =>
  err instanceof Error &&
  /dynamically imported module|Importing a module script failed|Failed to fetch|error loading dynamically|ChunkLoadError/i.test(
    err.message + err.name,
  );

interface State {
  error: Error | null;
}

/**
 * Instead of an empty page when something breaks while showing a page (an
 * older browser, a page whose code went away with an update): a page that
 * says so, with «Neu laden». A page that could not be loaded is loaded again
 * once by itself.
 */
export class PageErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('page failed', error, info.componentStack);
    if (!isLoadFailure(error)) return;
    let reloaded = false;
    try {
      reloaded = sessionStorage.getItem(RELOADED_KEY) === '1';
      sessionStorage.setItem(RELOADED_KEY, '1');
    } catch {
      reloaded = true; // no storage: do not risk reloading in a loop
    }
    if (!reloaded) location.reload();
  }

  override render() {
    const { error } = this.state;
    // (the «reloaded once» mark stays for the session: a page that fails again does not loop)
    if (!error) return this.props.children;
    return (
      <Center mih="100dvh" p="md">
        <Stack align="center" gap="md" maw={480} data-testid="page-error">
          <Title order={1} size="h2" ta="center">
            {i18n.t('pageError.title')}
          </Title>
          <Text ta="center">{i18n.t('pageError.text')}</Text>
          <Button size="lg" onClick={() => location.reload()}>
            {i18n.t('update.reload')}
          </Button>
          <Text size="xs" c="dimmed" ta="center" style={{ wordBreak: 'break-word' }}>
            {error.name}: {error.message}
          </Text>
        </Stack>
      </Center>
    );
  }
}
