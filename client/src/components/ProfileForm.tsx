import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import {
  Button,
  Collapse,
  Group,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_JOURNEY_MIN_AGE,
  ageIn,
  avatarSchema,
  birthYearSchema,
  canChooseWorld,
  displayNameSchema,
  type Avatar,
  type UiMode,
  type WorldSet,
} from '@klavio/shared';
import { useSession } from '../auth/session';
import type { ProfileInput } from '../api/endpoints';
import { ProfileAvatar } from './ProfileAvatar';
import classes from './ProfileForm.module.css';

/** From this age a new profile starts in the Classic view. */
const ADULT_VIEW_AGE = 16;

interface Props {
  initial?: Partial<ProfileInput>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (values: ProfileInput) => void;
  onCancel?: () => void;
  /** Only the figure can be changed (parent area locked). */
  figureOnly?: boolean;
}

export function ProfileForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
  figureOnly = false,
}: Props) {
  const { t } = useTranslation();
  const { config } = useSession();
  const minAge = config?.journeyMinAge ?? DEFAULT_JOURNEY_MIN_AGE;
  // new profiles need a birth year; older ones may add it later
  const creating = initial === undefined;
  const [more, setMore] = useState(false);
  const [modeTouched, setModeTouched] = useState(false);
  const form = useForm<ProfileInput>({
    mode: 'controlled',
    initialValues: {
      name: initial?.name ?? '',
      avatar: initial?.avatar ?? 'klavi',
      uiMode: initial?.uiMode ?? 'kids',
      dailyGoalMinutes: initial?.dailyGoalMinutes ?? 10,
      birthYear: initial?.birthYear ?? null,
      world: initial?.world ?? null,
    },
    validate: {
      name: (v) => (displayNameSchema.safeParse(v).success ? null : t('validation.name')),
      birthYear: (v) =>
        v === null
          ? creating
            ? t('profiles.birthYearRequired')
            : null
          : birthYearSchema.safeParse(v).success
            ? null
            : t('profiles.birthYearInvalid', { year: new Date().getFullYear() }),
    },
  });
  const { birthYear, uiMode, world } = form.values;
  const yearValid = birthYear !== null && birthYearSchema.safeParse(birthYear).success;
  const choose = yearValid && canChooseWorld(birthYear, minAge);
  // without a choice yet, the view decides (Classic → journey)
  const shownWorld: WorldSet = world ?? (uiMode === 'classic' ? 'journey' : 'kids');

  const submit = (v: ProfileInput) =>
    onSubmit({
      ...v,
      name: v.name.trim(),
      world: choose ? shownWorld : v.world === 'journey' ? null : v.world,
    });

  return (
    <form onSubmit={form.onSubmit(submit)} noValidate>
      <Stack gap="md">
        <TextInput
          label={t('profiles.name')}
          maxLength={40}
          data-autofocus
          disabled={figureOnly}
          {...form.getInputProps('name')}
        />

        <NumberInput
          label={t('profiles.birthYear')}
          description={
            yearValid
              ? t('profiles.birthYearAge', { count: ageIn(birthYear) })
              : t('profiles.birthYearHint')
          }
          placeholder={t('profiles.birthYearPlaceholder')}
          min={1900}
          max={new Date().getFullYear()}
          allowDecimal={false}
          allowNegative={false}
          hideControls
          inputMode="numeric"
          maxLength={4}
          size="lg"
          withAsterisk={creating}
          disabled={figureOnly}
          {...form.getInputProps('birthYear')}
          value={birthYear ?? ''}
          onChange={(v) => {
            const year = typeof v === 'number' ? v : null;
            form.setFieldValue('birthYear', year);
            // new profiles: grown-ups start in the calmer Classic view (until changed by hand)
            if (
              creating &&
              !modeTouched &&
              year !== null &&
              birthYearSchema.safeParse(year).success
            ) {
              form.setFieldValue('uiMode', ageIn(year) >= ADULT_VIEW_AGE ? 'classic' : 'kids');
            }
          }}
        />

        <Stack gap={6} role="radiogroup" aria-label={t('profiles.avatar')}>
          <Text fw={500}>{t('profiles.avatar')}</Text>
          <SimpleGrid cols={{ base: 3, xs: 4, sm: 7 }} spacing={6}>
            {avatarSchema.options.map((a: Avatar) => (
              <UnstyledButton
                key={a}
                role="radio"
                aria-checked={form.values.avatar === a}
                aria-label={t('avatars.label', {
                  name: t(`avatars.names.${a}`),
                  kind: t(`avatars.${a}`),
                })}
                className={classes.avatar}
                data-selected={form.values.avatar === a || undefined}
                onClick={() => form.setFieldValue('avatar', a)}
              >
                <ProfileAvatar
                  avatar={a}
                  size={68}
                  alive
                  mood={form.values.avatar === a ? 'cheer' : 'happy'}
                />
                <Text size="xs" fw={700} aria-hidden>
                  {t(`avatars.names.${a}`)}
                </Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>

        {creating && (
          <Button
            variant="subtle"
            size="md"
            onClick={() => setMore((m) => !m)}
            aria-expanded={more}
            rightSection={<IconChevronDown size={18} className={more ? classes.flip : undefined} />}
            data-testid="profile-more"
          >
            {t('profiles.more')}
          </Button>
        )}
        <Collapse expanded={!creating || more}>
          <Stack gap="md">
            <Stack gap={6}>
              <Text fw={500} id="mode-label">
                {t('profiles.mode')}
              </Text>
              <SegmentedControl
                aria-labelledby="mode-label"
                size="lg"
                data={[
                  { value: 'kids', label: t('profiles.modeKids') },
                  { value: 'classic', label: t('profiles.modeClassic') },
                ]}
                value={form.values.uiMode}
                disabled={figureOnly}
                onChange={(v) => {
                  setModeTouched(true);
                  form.setFieldValue('uiMode', v as UiMode);
                }}
              />
              <Text size="sm" c="dimmed">
                {uiMode === 'classic' ? t('profiles.modeHintClassic') : t('profiles.modeHintKids')}
              </Text>
            </Stack>

            <Stack gap={6}>
              <Text fw={500} id="world-label">
                {t('profiles.world')}
              </Text>
              {choose ? (
                <>
                  <SegmentedControl
                    aria-labelledby="world-label"
                    size="lg"
                    data={[
                      { value: 'kids', label: t('profiles.worldKids') },
                      { value: 'journey', label: t('profiles.worldJourney') },
                    ]}
                    value={shownWorld}
                    disabled={figureOnly}
                    onChange={(v) => form.setFieldValue('world', v as WorldSet)}
                    data-testid="world-choice"
                  />
                  <Text size="sm" c="dimmed">
                    {shownWorld === 'journey'
                      ? t('profiles.worldJourneyHint')
                      : t('profiles.worldKidsHint')}
                  </Text>
                </>
              ) : (
                <Text size="sm" c="dimmed" data-testid="world-locked">
                  {t('profiles.worldLocked', { age: minAge })}
                </Text>
              )}
            </Stack>

            <Stack gap={6}>
              <Text fw={500} id="goal-label">
                {t('profiles.dailyGoal')}
              </Text>
              <SegmentedControl
                aria-labelledby="goal-label"
                size="lg"
                data={['5', '10', '15', '20', '30']}
                value={String(form.values.dailyGoalMinutes)}
                disabled={figureOnly}
                onChange={(v) => form.setFieldValue('dailyGoalMinutes', Number(v))}
              />
            </Stack>
          </Stack>
        </Collapse>

        <Group grow preventGrowOverflow={false}>
          {onCancel && (
            <Button variant="default" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" loading={busy}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
