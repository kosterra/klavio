import { useState } from 'react';
import { Accordion, Anchor, Button, Container, Group, Text, ThemeIcon, Title } from '@mantine/core';
import {
  IconArrowRight,
  IconCode,
  IconDeviceTablet,
  IconGift,
  IconHeadphones,
  IconLogin2,
  IconPiano,
  IconShieldLock,
  IconUserPlus,
} from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../components/usePageTitle';
import { APP_CONFIG, CURRICULUM, LESSONS } from '@klavio/shared';
import { useSession } from '../auth/session';
import { playMelody } from '../audio/synth';
import { Landmark } from '../lesson/Landmarks';
import { WorldPanorama } from '../lesson/WorldPanorama';
import { CHAPTER_COLORS, chapterVars, type KidsWorldId } from '../lesson/worlds';
import { LoginCard } from '../landing/LoginCard';
import { TryKeyboard } from '../landing/TryKeyboard';
import { ThemeSwitch } from '../landing/ThemeSwitch';
import { LanguageSwitch } from '../landing/LanguageSwitch';
import { DuckParade, NoteRain } from '../landing/Effects';
import { tapCounter, useKonami } from '../landing/easterEggs';
import { SiteFooter } from '../components/SiteFooter';
import { InstallHint } from '../components/InstallHint';
import classes from '../landing/Landing.module.css';

const STEPS = [
  { key: 'profile', icon: IconUserPlus },
  { key: 'stand', icon: IconDeviceTablet },
  { key: 'play', icon: IconHeadphones },
] as const;

/** What Klavio does, each with a real screenshot from a phone. */
const SHOWCASE = [
  { key: 'listen', shot: 'phone-reading' },
  { key: 'duet', shot: 'phone-duet' },
  { key: 'rain', shot: 'phone-rain' },
  { key: 'dream', shot: 'dream' },
] as const;

/** A few of the children's worlds – the rest are discovered on the way. */
const KIDS_WORLDS: KidsWorldId[] = ['keys', 'sea', 'circus', 'garden'];

const FAQ = ['cost', 'adults', 'piano', 'devices', 'offline', 'host'] as const;

/** Für Elise, the opening – Klavi's little party piece. */
const ELISE = [76, 75, 76, 75, 76, 71, 74, 72, 69];

/** A screenshot in a phone frame. */
function Phone({ shot, alt, eager = false }: { shot: string; alt: string; eager?: boolean }) {
  return (
    <div className={classes.phone}>
      <img
        src={`/screens/${shot}.webp`}
        alt={alt}
        width={600}
        height={1298}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

/**
 * Public landing page: what Klavio is, shown on a phone; a mini lesson to try
 * right away; what it does (listen, play along, note rain, dream song); the
 * two ways for children and adults; the privacy promise in a few honest
 * numbers; the questions; and the login at the end. A few easter eggs hide
 * here: the Konami code and tapping Klavi on the login card.
 */
export function WelcomePage() {
  const { t } = useTranslation();
  usePageTitle(null, '/welcome');
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

  // honest numbers, straight from the curriculum
  const stats = [
    { n: CURRICULUM.length, label: t('landing.stats.worlds') },
    { n: LESSONS.length, label: t('landing.stats.lessons') },
    { n: LESSONS.filter((l) => l.kind === 'song').length, label: t('landing.stats.songs') },
    { n: 0, label: t('landing.stats.cost') },
  ];

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
          <Button
            component="a"
            href="#login"
            variant="white"
            size="md"
            leftSection={<IconLogin2 size={20} />}
            className={classes.cornerButton}
            data-testid="hero-login"
          >
            {t('landing.login')}
          </Button>
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
              <Text fz="xl" className={`${classes.lead} ${classes.leadLong}`}>
                {t('landing.lead')}
              </Text>
              <Text fz="lg" className={`${classes.lead} ${classes.leadShort}`}>
                {t('landing.leadShort')}
              </Text>
              <Group gap="sm" mt="lg">
                {cta}
                <Button
                  component="a"
                  href="#try"
                  variant="white"
                  size="xl"
                  className={classes.ghost}
                >
                  {t('landing.tryButton')}
                </Button>
              </Group>
              <Group gap="lg" mt="lg" className={classes.badges}>
                <span>
                  <IconGift size={18} aria-hidden /> {t('landing.badgeFree')}
                </span>
                <span>
                  <IconShieldLock size={18} aria-hidden /> {t('landing.badgeAudio')}
                </span>
                <span>
                  <IconCode size={18} aria-hidden /> {t('landing.badgeOpen')}
                </span>
              </Group>
            </div>
            <div className={classes.heroPhone}>
              <Phone shot="phone-path" alt={t('landing.heroAlt')} eager />
            </div>
          </div>
        </Container>
        <WorldPanorama />
      </header>

      {/* --------------------------------------------------- try it, right away */}
      <section
        id="try"
        className={`${classes.section} ${classes.tinted}`}
        aria-labelledby="try-title"
      >
        <Container size="sm">
          <Title order={2} ta="center" id="try-title" className={classes.sectionTitle}>
            {t('landing.tryTitle')}
          </Title>
          <Text ta="center" mb="md" fz="lg">
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

      {/* ---------------------------------------------------- how it works */}
      <section id="how" className={classes.section} aria-labelledby="how-title">
        <Container size="lg">
          <Title order={2} ta="center" id="how-title" className={classes.sectionTitle}>
            {t('landing.howTitle')}
          </Title>
          <ol className={classes.steps}>
            {STEPS.map((s, i) => (
              <li key={s.key} className={classes.step}>
                <ThemeIcon size={52} radius="xl" variant="light" aria-hidden>
                  <s.icon size={28} />
                </ThemeIcon>
                <div>
                  <Title order={3} size="h4">
                    {i + 1}. {t(`landing.steps.${s.key}.title`)}
                  </Title>
                  <Text>{t(`landing.steps.${s.key}.text`)}</Text>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* ------------------------------------------------------ what it does */}
      <section className={`${classes.section} ${classes.tinted}`} aria-labelledby="showcase-title">
        <Container size="lg">
          <Title order={2} ta="center" id="showcase-title" className={classes.sectionTitle}>
            {t('landing.showcaseTitle')}
          </Title>
          <Text ta="center" fz="lg" maw={680} mx="auto">
            {t('landing.showcaseText')}
          </Text>
          <div className={classes.showcase}>
            {SHOWCASE.map((s) => (
              <article key={s.key} className={classes.row} data-shot={s.shot}>
                <div className={classes.rowText}>
                  <Text
                    fw={800}
                    tt="uppercase"
                    fz={{ base: 'xs', sm: 'sm' }}
                    className={classes.kicker}
                  >
                    {t(`landing.show.${s.key}.kicker`)}
                  </Text>
                  <Title order={3} className={classes.rowTitle}>
                    {t(`landing.show.${s.key}.title`)}
                  </Title>
                  <Text fz={{ base: 'md', sm: 'lg' }}>{t(`landing.show.${s.key}.text`)}</Text>
                </div>
                {s.shot === 'dream' ? (
                  <figure className={`${classes.shot} ${classes.rowCard}`}>
                    <img
                      src="/screens/dream.webp"
                      alt={t(`landing.show.${s.key}.alt`)}
                      width={640}
                      height={655}
                      loading="lazy"
                      decoding="async"
                    />
                  </figure>
                ) : (
                  <Phone shot={s.shot} alt={t(`landing.show.${s.key}.alt`)} />
                )}
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------- children and adults */}
      <section className={classes.section} aria-labelledby="ways-title">
        <Container size="lg">
          <Title order={2} ta="center" id="ways-title" className={classes.sectionTitle}>
            {t('landing.waysTitle')}
          </Title>
          <div className={classes.ways}>
            <div className={classes.way}>
              <Text fw={800} tt="uppercase" size="sm" className={classes.kicker}>
                {t('landing.ways.kidsKicker')}
              </Text>
              <Title order={3} className={classes.rowTitle}>
                {t('landing.ways.kidsTitle', { count: CURRICULUM.length })}
              </Title>
              <Text fz={{ base: 'md', sm: 'lg' }}>{t('landing.ways.kidsText')}</Text>
              <div className={classes.worlds}>
                {KIDS_WORLDS.map((w, i) => (
                  <div
                    key={w}
                    className={classes.world}
                    style={chapterVars(CHAPTER_COLORS[(i * 2) % CHAPTER_COLORS.length]!)}
                  >
                    <Landmark
                      world={w}
                      name={t(`path.worlds.${w}`)}
                      style={{ position: 'static' }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={classes.way}>
              <Text fw={800} tt="uppercase" size="sm" className={classes.kicker}>
                {t('landing.ways.adultsKicker')}
              </Text>
              <Title order={3} className={classes.rowTitle}>
                {t('landing.ways.adultsTitle')}
              </Title>
              <Text fz={{ base: 'md', sm: 'lg' }}>{t('landing.ways.adultsText')}</Text>
              <figure className={classes.shot}>
                <img
                  src="/screens/journey.webp"
                  alt={t('landing.journeyAlt')}
                  width={1100}
                  height={391}
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            </div>
          </div>
        </Container>
      </section>

      {/* ---------------------------------------------------------- trust */}
      <section className={`${classes.section} ${classes.tinted}`} aria-labelledby="privacy-title">
        <Container size="lg">
          <div className={classes.privacy}>
            <Title order={2} id="privacy-title" className={classes.sectionTitle}>
              {t('landing.privacyTitle')}
            </Title>
            <dl className={classes.stats}>
              {stats.map((s) => (
                <div key={s.label}>
                  <dt>{s.label}</dt>
                  <dd>{s.n}</dd>
                </div>
              ))}
            </dl>
            <ul className={classes.checks}>
              {(['audio', 'ads', 'data', 'open'] as const).map((k) => (
                <li key={k}>{t(`landing.privacy.${k}`)}</li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className={classes.section} aria-labelledby="faq-title">
        <Container size="sm">
          <Title order={2} ta="center" id="faq-title" className={classes.sectionTitle}>
            {t('landing.faqTitle')}
          </Title>
          <Accordion variant="separated" radius="lg" mt="lg">
            {FAQ.map((k) => (
              <Accordion.Item key={k} value={k}>
                <Accordion.Control>{t(`landing.faq.${k}.q`)}</Accordion.Control>
                <Accordion.Panel>
                  {t(`landing.faq.${k}.a`)}
                  {k === 'host' && (
                    <Text mt="xs">
                      <Anchor
                        href={`${APP_CONFIG.sourceUrl}#readme`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {t('landing.hostGuide')}
                      </Anchor>
                      {' · '}
                      <Anchor
                        href="https://hub.docker.com/r/kosterra/klavio"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Docker Hub
                      </Anchor>
                    </Text>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </Container>
      </section>

      {/* ------------------------------------------- final cta and the login */}
      <section className={classes.final} aria-labelledby="final-title">
        <Container size="lg">
          <div className={classes.finalGrid}>
            <div>
              <Title order={2} id="final-title" className={classes.sectionTitle}>
                {t('landing.finalTitle')}
              </Title>
              <Text fz="lg" mt="sm" className={classes.finalText}>
                {t('landing.finalText')}
              </Text>
              <Group mt="lg">{cta}</Group>
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
      </section>

      <SiteFooter />
      <InstallHint variant="popup" />
    </div>
  );
}
