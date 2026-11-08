import { useState } from 'react';
import {
  Accordion,
  Button,
  Container,
  Group,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  IconArrowRight,
  IconBrandGithub,
  IconBulb,
  IconCode,
  IconDeviceTablet,
  IconHeadphones,
  IconMap2,
  IconMedal,
  IconMicrophone,
  IconPiano,
  IconRepeat,
  IconShieldLock,
  IconUserPlus,
  IconUsers,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { APP_CONFIG, CURRICULUM } from '@klavio/shared';
import { useSession } from '../auth/session';
import { playMelody } from '../audio/synth';
import { Landmark } from '../lesson/Landmarks';
import { WorldPanorama } from '../lesson/WorldPanorama';
import { CHAPTER_COLORS, chapterVars, worldOf } from '../lesson/worlds';
import { useLocalized } from '../lesson/useLocalized';
import { LoginCard } from '../landing/LoginCard';
import { TryKeyboard } from '../landing/TryKeyboard';
import { ThemeSwitch } from '../landing/ThemeSwitch';
import { LanguageSwitch } from '../landing/LanguageSwitch';
import { DuckParade, NoteRain } from '../landing/Effects';
import { tapCounter, useKonami } from '../landing/easterEggs';
import classes from '../landing/Landing.module.css';

const FEATURES = [
  { key: 'listen', icon: IconMicrophone, color: 'indigo' },
  { key: 'worlds', icon: IconMap2, color: 'teal' },
  { key: 'discover', icon: IconBulb, color: 'yellow' },
  { key: 'review', icon: IconRepeat, color: 'lime' },
  { key: 'medals', icon: IconMedal, color: 'orange' },
  { key: 'family', icon: IconUsers, color: 'grape' },
] as const;

const STEPS = [
  { key: 'profile', icon: IconUserPlus },
  { key: 'stand', icon: IconDeviceTablet },
  { key: 'play', icon: IconHeadphones },
] as const;

/** Für Elise, the opening – Klavi's little party piece. */
const ELISE = [76, 75, 76, 75, 76, 71, 74, 72, 69];

/**
 * Public landing page: what Klavio is, how it works, all the worlds and the
 * privacy promise – with the login card in the hero. A few easter eggs hide
 * here: the Konami code, tapping Klavi and a children's song on the keyboard.
 */
export function WelcomePage() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const { config } = useSession();
  const registrationOpen = config?.registrationOpen ?? true;
  const [rain, setRain] = useState(0);
  const [ducks, setDucks] = useState(0);
  const [secret, setSecret] = useState('');
  const [klaviTaps] = useState(() => tapCounter(5));

  const announce = (message: string) => {
    setSecret(message);
    setTimeout(() => setSecret(''), 4500);
  };
  const party = (message: string) => {
    setRain((r) => r + 1);
    announce(message);
  };
  useKonami(() => party(t('landing.eggKonami')));

  const cta = registrationOpen && (
    <Button
      component={Link}
      to="/register"
      size="xl"
      rightSection={<IconArrowRight />}
      className={classes.cta}
    >
      {t('landing.cta')}
    </Button>
  );

  return (
    <div className={classes.page}>
      <NoteRain run={rain} />
      <DuckParade run={ducks} />
      <div role="status" className={classes.secret} aria-live="polite">
        {secret}
      </div>

      {/* ----------------------------------------------------------- hero */}
      <header className={classes.hero}>
        <div className={classes.cornerTools}>
          <LanguageSwitch />
          <ThemeSwitch />
        </div>
        <Container size="lg">
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
              <Text fz="xl" className={classes.lead}>
                {t('landing.lead')}
              </Text>
              <Group gap="sm" mt="lg">
                {cta}
                <Button
                  component="a"
                  href="#how"
                  variant="white"
                  size="xl"
                  className={classes.ghost}
                >
                  {t('landing.how')}
                </Button>
              </Group>
              <Group gap="lg" mt="lg" className={classes.badges}>
                <span>
                  <IconShieldLock size={18} aria-hidden /> {t('landing.badgeAudio')}
                </span>
                <span>
                  <IconCode size={18} aria-hidden /> {t('landing.badgeOpen')}
                </span>
              </Group>
            </div>
            <div className={classes.heroCard}>
              <LoginCard
                onMascotTap={() => {
                  if (klaviTaps()) {
                    playMelody(
                      ELISE.map((midi) => ({ midi, beats: 0.5 })),
                      140,
                    );
                    party(t('landing.eggKlavi'));
                  }
                }}
              />
            </div>
          </div>
        </Container>
        <WorldPanorama />
      </header>

      {/* ---------------------------------------------------- how it works */}
      <section id="how" className={classes.section} aria-labelledby="how-title">
        <Container size="lg">
          <Title order={2} ta="center" id="how-title" className={classes.sectionTitle}>
            {t('landing.howTitle')}
          </Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl" mt="xl">
            {STEPS.map((s, i) => (
              <div key={s.key} className={classes.step}>
                <span className={classes.stepNumber} aria-hidden>
                  {i + 1}
                </span>
                <ThemeIcon size={64} radius="xl" variant="light" aria-hidden>
                  <s.icon size={34} />
                </ThemeIcon>
                <Title order={3} size="h4" mt="sm">
                  {t(`landing.steps.${s.key}.title`)}
                </Title>
                <Text>{t(`landing.steps.${s.key}.text`)}</Text>
              </div>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* -------------------------------------------------------- features */}
      <section className={`${classes.section} ${classes.tinted}`} aria-labelledby="features-title">
        <Container size="lg">
          <Title order={2} ta="center" id="features-title" className={classes.sectionTitle}>
            {t('landing.featuresTitle')}
          </Title>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="lg" mt="xl">
            {FEATURES.map((f) => (
              <div
                key={f.key}
                className={classes.feature}
                style={{ '--feature': `var(--mantine-color-${f.color}-6)` } as React.CSSProperties}
              >
                <ThemeIcon size={52} radius="xl" color={f.color} aria-hidden>
                  <f.icon size={28} />
                </ThemeIcon>
                <Title order={3} size="h4" mt="sm">
                  {t(`landing.features.${f.key}.title`, { count: CURRICULUM.length })}
                </Title>
                <Text>{t(`landing.features.${f.key}.text`)}</Text>
              </div>
            ))}
          </SimpleGrid>
        </Container>
      </section>

      {/* ---------------------------------------------------------- worlds */}
      <section className={classes.section} aria-labelledby="worlds-title">
        <Container size="lg">
          <Title order={2} ta="center" id="worlds-title" className={classes.sectionTitle}>
            {t('landing.worldsTitle', { count: CURRICULUM.length })}
          </Title>
          <Text ta="center" fz="lg" maw={640} mx="auto">
            {t('landing.worldsText')}
          </Text>
          <div className={classes.worlds}>
            {CURRICULUM.map((c, i) => {
              const world = worldOf(c.id, i);
              return (
                <div
                  key={c.id}
                  className={classes.world}
                  style={chapterVars(CHAPTER_COLORS[i % CHAPTER_COLORS.length]!)}
                >
                  <Landmark
                    world={world.id}
                    name={t(`path.worlds.${world.id}`)}
                    style={{ position: 'static' }}
                  />
                  <Text fw={800} ta="center">
                    {t('path.chapter', { n: i + 1 })} · {loc(c.title)}
                  </Text>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* -------------------------------------------------------- try it */}
      <section className={`${classes.section} ${classes.tinted}`} aria-labelledby="try-title">
        <Container size="sm">
          <Title order={2} ta="center" id="try-title" className={classes.sectionTitle}>
            {t('landing.tryTitle')}
          </Title>
          <Text ta="center" mb="md">
            {t('landing.tryText')}
          </Text>
          <TryKeyboard
            onDucks={() => {
              setDucks((d) => d + 1);
              announce(t('landing.eggDucks'));
            }}
          />
        </Container>
      </section>

      {/* --------------------------------------------------------- privacy */}
      <section className={classes.section} aria-labelledby="privacy-title">
        <Container size="lg">
          <div className={classes.privacy}>
            <ThemeIcon size={72} radius="xl" color="teal" aria-hidden>
              <IconShieldLock size={40} />
            </ThemeIcon>
            <div>
              <Title order={2} id="privacy-title" className={classes.sectionTitle}>
                {t('landing.privacyTitle')}
              </Title>
              <ul className={classes.checks}>
                {(['audio', 'ads', 'data', 'open'] as const).map((k) => (
                  <li key={k}>{t(`landing.privacy.${k}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className={`${classes.section} ${classes.tinted}`} aria-labelledby="faq-title">
        <Container size="sm">
          <Title order={2} ta="center" id="faq-title" className={classes.sectionTitle}>
            {t('landing.faqTitle')}
          </Title>
          <Accordion variant="separated" radius="lg" mt="lg">
            {(['piano', 'who', 'devices', 'offline'] as const).map((k) => (
              <Accordion.Item key={k} value={k}>
                <Accordion.Control>{t(`landing.faq.${k}.q`)}</Accordion.Control>
                <Accordion.Panel>{t(`landing.faq.${k}.a`)}</Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* ------------------------------------------------------ final cta */}
      <section className={classes.final} aria-labelledby="final-title">
        <Container size="sm" ta="center">
          <Title order={2} id="final-title" className={classes.sectionTitle}>
            {t('landing.finalTitle')}
          </Title>
          <Group justify="center" mt="lg">
            {cta}
            <Button component="a" href="#login" variant="white" size="xl" className={classes.ghost}>
              {t('landing.login')}
            </Button>
          </Group>
        </Container>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer className={classes.footer}>
        <Container size="lg">
          <Group justify="space-between" gap="sm">
            <Group gap="xs">
              <IconPiano size={20} aria-hidden />
              <Text fw={800}>{APP_CONFIG.name}</Text>
              <Text size="sm">{t('about.license', { license: APP_CONFIG.license })}</Text>
            </Group>
            <Group gap="lg">
              <Link to="/whats-new" className={classes.footerLink}>
                {t('whatsNew.link')}
              </Link>
              <a
                href={APP_CONFIG.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.footerLink}
              >
                <IconBrandGithub size={18} aria-hidden /> {t('about.source')}
              </a>
            </Group>
          </Group>
        </Container>
      </footer>
    </div>
  );
}
