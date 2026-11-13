import { useState } from 'react';
import { Container, Group, Text, Title } from '@mantine/core';
import { IconPiano } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG } from '@klavio/shared';
import { playMelody } from '../audio/synth';
import { SiteFooter } from '../components/SiteFooter';
import { InstallHint } from '../components/InstallHint';
import { LoginCard } from './LoginCard';
import { ThemeSwitch } from './ThemeSwitch';
import { LanguageSwitch } from './LanguageSwitch';
import { NoteRain } from './Effects';
import { tapCounter } from './easterEggs';
import classes from './Landing.module.css';

/** Für Elise, the opening – Klavi's little party piece. */
const ELISE = [76, 75, 76, 75, 76, 71, 74, 72, 69];

/**
 * The start page as long as an admin hasn't switched the full one on: the
 * headline and the login card, nothing that advertises the instance. Klavi
 * still keeps the secret of the five taps.
 */
export function ShortWelcome() {
  const { t } = useTranslation();
  const [rain, setRain] = useState(0);
  const [secret, setSecret] = useState('');
  const [klaviTaps] = useState(() => tapCounter(5));

  return (
    <div className={classes.page} data-testid="welcome-short">
      <NoteRain run={rain} />
      <div role="status" className={classes.secret} aria-live="polite">
        {secret}
      </div>
      <header className={`${classes.hero} ${classes.heroShort}`}>
        <div className={classes.cornerTools}>
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
        <Container size="lg" w="100%">
          <div className={classes.heroGrid}>
            <div className={classes.heroText}>
              <Group gap="xs" className={classes.logo}>
                <IconPiano size={30} aria-hidden />
                <Text fw={900} fz="xl">
                  {APP_CONFIG.name}
                </Text>
              </Group>
              <Title order={1} className={classes.headline}>
                {t('landing.headline')}
              </Title>
              <Text fz="lg" className={classes.lead}>
                {t('landing.leadShort')}
              </Text>
            </div>
            <div className={classes.heroCard}>
              <LoginCard
                onMascotTap={() => {
                  if (klaviTaps()) {
                    playMelody(
                      ELISE.map((midi) => ({ midi, beats: 0.5 })),
                      140,
                    );
                    setRain((r) => r + 1);
                    setSecret(t('landing.eggKlavi'));
                    setTimeout(() => setSecret(''), 4500);
                  }
                }}
              />
            </div>
          </div>
        </Container>
      </header>
      <SiteFooter />
      <InstallHint variant="popup" />
    </div>
  );
}
