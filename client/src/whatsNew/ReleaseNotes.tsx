import { useState } from 'react';
import { Badge, Button, Group, Text, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronUp, IconClock } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useLocalized } from '../lesson/useLocalized';
import { FIX, RELEASES, UPCOMING, isFix } from './changelog';
import classes from './WhatsNew.module.css';

/** The newest releases shown at first. */
const RECENT = 4;
/** A topic before the colon («Klavi liest vor: …»), short enough to read as a title. */
const TOPIC = /^([^:.]{2,40}):\s+/;

function Change({ text }: { text: string }) {
  const { t } = useTranslation();
  const fix = isFix(text);
  const rest = text.replace(FIX, '');
  const topic = rest.match(TOPIC);
  const body = topic ? rest.slice(topic[0].length) : rest;
  return (
    <li className={classes.change}>
      <Badge
        size="sm"
        variant="light"
        color={fix ? 'orange' : 'teal'}
        className={classes.kind}
        // the badges are dark enough on their light background (contrast)
        styles={{
          label: { color: fix ? '#9c3608' : 'var(--mantine-color-teal-9)' },
        }}
      >
        {fix ? t('whatsNew.fix') : t('whatsNew.new')}
      </Badge>
      <Text span>
        {topic && <strong>{topic[1]}: </strong>}
        {body}
      </Text>
    </li>
  );
}

/**
 * What is new, version by version: the newest open, the others folded with
 * how many changes they bring. Changes not released yet are marked «Kommt bald».
 */
export function ReleaseNotes() {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState(
    () =>
      new Set(RELEASES.slice(0, RELEASES[0]?.version === UPCOMING ? 2 : 1).map((r) => r.version)),
  );
  const toggle = (version: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  const latest = RELEASES.findIndex((r) => r.version !== UPCOMING);
  const shown = all ? RELEASES : RELEASES.slice(0, RECENT);

  return (
    <div className={classes.releases}>
      {shown.map((release, index) => {
        const upcoming = release.version === UPCOMING;
        const isOpen = open.has(release.version);
        const texts = release.changes.map(loc);
        const fixes = texts.filter(isFix).length;
        const id = `release-${release.version.replace(/\W+/g, '-')}`;
        return (
          <section
            key={release.version}
            className={classes.release}
            data-upcoming={upcoming || undefined}
            data-testid={`release-${release.version}`}
          >
            <UnstyledButton
              className={classes.head}
              aria-expanded={isOpen}
              aria-controls={id}
              onClick={() => toggle(release.version)}
            >
              <Text fw={900} fz="lg" className={classes.version}>
                {upcoming
                  ? t('whatsNew.upcoming')
                  : t('whatsNew.version', { version: release.version })}
              </Text>
              {upcoming ? (
                <Badge color="#b34209" variant="filled" leftSection={<IconClock size={14} />}>
                  {t('whatsNew.soon')}
                </Badge>
              ) : (
                index === latest && (
                  <Badge color="indigo" variant="filled">
                    {t('whatsNew.latest')}
                  </Badge>
                )
              )}
              <Text size="sm" c="dimmed" className={classes.count}>
                {t('whatsNew.countNew', { count: texts.length - fixes })}
                {fixes > 0 && ` · ${t('whatsNew.countFix', { count: fixes })}`}
              </Text>
              {isOpen ? <IconChevronUp aria-hidden /> : <IconChevronDown aria-hidden />}
            </UnstyledButton>
            {isOpen && (
              <ul id={id} className={classes.changes}>
                {texts.map((text) => (
                  <Change key={text} text={text} />
                ))}
              </ul>
            )}
          </section>
        );
      })}
      {RELEASES.length > RECENT && (
        <Group>
          <Button
            variant="default"
            size="sm"
            leftSection={all ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={() => setAll((v) => !v)}
          >
            {all ? t('whatsNew.fewer') : t('whatsNew.all', { count: RELEASES.length })}
          </Button>
        </Group>
      )}
    </div>
  );
}
