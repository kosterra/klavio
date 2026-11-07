import { useState } from 'react';
import { Button, Card, Chip, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { IconMusicHeart } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  BASE_SKILLS,
  GOAL_STYLES,
  GOAL_STYLE_SKILLS,
  SKILL_IDS,
  SKILL_NAMES,
  isSkillTaught,
  type GoalSong,
  type GoalStyle,
  type SkillId,
} from '@klavio/shared';
import { useLocalized } from '../lesson/useLocalized';

/**
 * «Mein Traumlied»: the title of the song the learner wants to play one day,
 * its style (which suggests the skills it needs) and the adjustable skill list.
 * Only this text is stored – never notes of the song.
 */
export function GoalSongEditor({
  initial,
  busy,
  onSave,
}: {
  initial: GoalSong | null;
  busy: boolean;
  onSave: (goal: GoalSong | null) => void;
}) {
  const { t } = useTranslation();
  const loc = useLocalized();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [style, setStyle] = useState<GoalStyle>(initial?.style ?? 'ballad');
  const [skills, setSkills] = useState<SkillId[]>(initial?.skills ?? GOAL_STYLE_SKILLS.ballad);
  const choosable = SKILL_IDS.filter((s) => !BASE_SKILLS.includes(s));

  return (
    <Card withBorder radius="lg" padding="lg" id="goal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) onSave({ title: title.trim(), style, skills });
        }}
      >
        <Stack gap="md">
          <Group gap="xs">
            <IconMusicHeart color="var(--mantine-color-pink-7)" aria-hidden />
            <Title order={2} size="h3">
              {t('goal.editorTitle')}
            </Title>
          </Group>
          <Text>{t('goal.editorIntro')}</Text>
          <TextInput
            label={t('goal.songTitle')}
            description={t('goal.songTitleHint')}
            placeholder={t('goal.songTitlePlaceholder')}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.currentTarget.value)}
          />
          <Select
            label={t('goal.style')}
            data={GOAL_STYLES.map((s) => ({ value: s, label: t(`goal.styles.${s}`) }))}
            value={style}
            allowDeselect={false}
            onChange={(v) => {
              if (!v) return;
              setStyle(v as GoalStyle);
              setSkills(GOAL_STYLE_SKILLS[v as GoalStyle]); // a fresh suggestion for the style
            }}
          />
          <div>
            <Text fw={500}>{t('goal.needs')}</Text>
            <Text size="sm" c="dimmed" mb="xs">
              {t('goal.needsHint')}
            </Text>
            <Chip.Group multiple value={skills} onChange={(v) => setSkills(v as SkillId[])}>
              <Group gap="xs">
                {choosable.map((s) => (
                  <Chip key={s} value={s} color="pink.7" variant="outline">
                    {loc(SKILL_NAMES[s])}
                    {!isSkillTaught(s) && ` · ${t('goal.later')}`}
                  </Chip>
                ))}
              </Group>
            </Chip.Group>
          </div>
          <Text size="sm" c="dimmed">
            {t('goal.copyright')}
          </Text>
          <Group justify="space-between">
            {initial ? (
              <Button variant="subtle" color="gray" onClick={() => onSave(null)} disabled={busy}>
                {t('goal.remove')}
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" loading={busy} disabled={!title.trim()} color="pink.8">
              {t('goal.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Card>
  );
}
