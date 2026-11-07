import {
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
  SimpleGrid,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { avatarSchema, displayNameSchema, type Avatar, type UiMode } from '@klavio/shared';
import type { ProfileInput } from '../api/endpoints';
import { ProfileAvatar } from './ProfileAvatar';
import classes from './ProfileForm.module.css';

interface Props {
  initial?: Partial<ProfileInput>;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (values: ProfileInput) => void;
  onCancel: () => void;
}

export function ProfileForm({ initial, submitLabel, busy, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const form = useForm<ProfileInput>({
    mode: 'controlled',
    initialValues: {
      name: initial?.name ?? '',
      avatar: initial?.avatar ?? 'klavi',
      uiMode: initial?.uiMode ?? 'kids',
      dailyGoalMinutes: initial?.dailyGoalMinutes ?? 10,
    },
    validate: {
      name: (v) => (displayNameSchema.safeParse(v).success ? null : t('validation.name')),
    },
  });

  return (
    <form onSubmit={form.onSubmit((v) => onSubmit({ ...v, name: v.name.trim() }))} noValidate>
      <Stack gap="md">
        <TextInput
          label={t('profiles.name')}
          maxLength={40}
          data-autofocus
          {...form.getInputProps('name')}
        />

        <Stack gap={6} role="radiogroup" aria-label={t('profiles.avatar')}>
          <Text fw={500}>{t('profiles.avatar')}</Text>
          <SimpleGrid cols={{ base: 4, xs: 7 }} spacing="xs">
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
                <ProfileAvatar avatar={a} size={56} />
                <Text size="xs" fw={700} aria-hidden>
                  {t(`avatars.names.${a}`)}
                </Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>
        </Stack>

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
            onChange={(v) => form.setFieldValue('uiMode', v as UiMode)}
          />
          <Text size="sm" c="dimmed">
            {t('profiles.modeHint')}
          </Text>
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
            onChange={(v) => form.setFieldValue('dailyGoalMinutes', Number(v))}
          />
        </Stack>

        <Group grow>
          <Button variant="default" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={busy}>
            {submitLabel}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}
