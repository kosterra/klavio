import {
  Alert,
  Button,
  Card,
  Center,
  CopyButton,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconCopy, IconPrinter } from '@tabler/icons-react';
import { Navigate, useNavigate } from 'react-router';
import { useSession } from '../auth/session';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import classes from './RecoveryCodesPage.module.css';

/** Shown exactly once after the codes were generated (registration or regeneration). */
export function RecoveryCodesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pendingRecoveryCodes, setPendingRecoveryCodes } = useSession();
  if (!pendingRecoveryCodes) return <Navigate to="/" replace />;
  const { codes, next } = pendingRecoveryCodes;

  return (
    <Center mih="100dvh" p="md">
      <Card
        withBorder
        shadow="sm"
        padding="xl"
        radius="xl"
        maw={560}
        w="100%"
        className={classes.printable}
      >
        <Stack gap="md">
          <Title order={1} size="h2">
            {t('recoveryCodes.title')}
          </Title>
          <Text className={classes.printOnly}>{APP_CONFIG.name}</Text>
          <Text>{t('recoveryCodes.intro')}</Text>
          <Alert color="orange" className={classes.noPrint}>
            {t('recoveryCodes.warning')}
          </Alert>
          <SimpleGrid cols={2} spacing="xs" component="ol" className={classes.codes}>
            {codes.map((c) => (
              <Text component="li" key={c} ff="monospace" fz="xl" fw={700}>
                {c}
              </Text>
            ))}
          </SimpleGrid>
          <Group grow className={classes.noPrint}>
            <Button variant="default" leftSection={<IconPrinter />} onClick={() => window.print()}>
              {t('recoveryCodes.print')}
            </Button>
            <CopyButton value={codes.join('\n')}>
              {({ copied, copy }) => (
                <Button variant="default" leftSection={<IconCopy />} onClick={copy}>
                  {copied ? t('recoveryCodes.copied') : t('recoveryCodes.copy')}
                </Button>
              )}
            </CopyButton>
          </Group>
          <Button
            className={classes.noPrint}
            onClick={() => {
              setPendingRecoveryCodes(null);
              navigate(next, { replace: true });
            }}
          >
            {t('recoveryCodes.confirm')}
          </Button>
        </Stack>
      </Card>
    </Center>
  );
}
