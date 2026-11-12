import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Code,
  Group,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { IconDeviceFloppy, IconMailForward, IconRestore } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import {
  CODE_MAILS,
  MAIL_PLACEHOLDERS,
  mailTextSchema,
  renderMail,
  type MailLang,
  type MailTemplateDto,
  type MailTemplateId,
  type MailText,
} from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { notify } from '../components/notify';
import classes from './Admin.module.css';

const FIELDS = ['subject', 'heading', 'intro', 'outro'] as const;

/**
 * The texts of the code mails, in German and English: edited here, previewed
 * exactly as they go out (same renderer as the server), tested by a mail to
 * oneself, and reset to the built-in texts.
 */
export function MailTemplatesCard() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [templates, setTemplates] = useState<MailTemplateDto[] | null>(null);
  const [id, setId] = useState<MailTemplateId>('login-code');
  const [lang, setLang] = useState<MailLang>('de');
  const [drafts, setDrafts] = useState<Partial<Record<MailTemplateId, MailTemplateDto['texts']>>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'save' | 'test' | 'reset' | null>(null);
  // the preview of the warning shows a deletion date 30 days ahead
  const [deletionSample] = useState(() => Date.now() + 30 * 864e5);

  useEffect(() => {
    endpoints.mailTemplates().then(setTemplates, (e) => setError(errorText(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saved = templates?.find((tpl) => tpl.id === id);
  const texts = drafts[id] ?? saved?.texts;
  const current = texts?.[lang];
  const dirty = !!drafts[id] && JSON.stringify(drafts[id]) !== JSON.stringify(saved?.texts);
  const invalid = texts
    ? (['de', 'en'] as const).filter((l) => !mailTextSchema.safeParse(texts[l]).success)
    : [];

  const preview = useMemo(
    () =>
      current
        ? renderMail(current, lang, {
            ...(CODE_MAILS.includes(id)
              ? { code: '123456' }
              : id === 'weekly-report'
                ? {
                    week: lang === 'en' ? '2 November' : '2. November',
                    report: [
                      {
                        name: 'Lina',
                        lines:
                          lang === 'en'
                            ? [
                                '25 minutes practised, on 3 days',
                                '2 lessons played',
                                'Next: «D and E»',
                              ]
                            : [
                                '25 Minuten geübt, an 3 Tagen',
                                '2 Lektionen gespielt',
                                'Als Nächstes: «D und E»',
                              ],
                      },
                    ],
                  }
                : {
                    months: 24,
                    date: new Date(deletionSample).toLocaleDateString(
                      lang === 'en' ? 'en-GB' : 'de-CH',
                      { day: 'numeric', month: 'long', year: 'numeric' },
                    ),
                  }),
            origin: location.origin,
            images: { logo: '/mail/logo.png', klavi: '/mail/klavi.png' },
          })
        : null,
    [current, lang, id, deletionSample],
  );

  const edit = (field: keyof MailText, value: string) => {
    if (!texts) return;
    setDrafts((d) => ({ ...d, [id]: { ...texts, [lang]: { ...texts[lang], [field]: value } } }));
  };

  const run = async (kind: 'save' | 'test' | 'reset', action: () => Promise<void>) => {
    setError(null);
    setBusy(kind);
    try {
      await action();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  };

  const store = (tpl: MailTemplateDto) => {
    setTemplates((all) => all?.map((x) => (x.id === tpl.id ? tpl : x)) ?? null);
    setDrafts(({ [tpl.id]: _gone, ...rest }) => rest);
  };

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="mail-templates">
      <Stack gap="md">
        <div>
          <Title order={2} size="h3">
            {t('admin.mail.title')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('admin.mail.hint')}
          </Text>
        </div>
        {error && <Alert color="red">{error}</Alert>}

        <Group gap="sm">
          <SegmentedControl
            value={id}
            onChange={(v) => setId(v as MailTemplateId)}
            data={[
              { value: 'login-code', label: t('admin.mail.loginCode') },
              { value: 'verify-email', label: t('admin.mail.verifyEmail') },
              { value: 'pin-reset', label: t('admin.mail.pinReset') },
              { value: 'inactive-warning', label: t('admin.mail.inactiveWarning') },
              { value: 'weekly-report', label: t('admin.mail.weeklyReport') },
            ]}
            aria-label={t('admin.mail.which')}
          />
          <SegmentedControl
            value={lang}
            onChange={(v) => setLang(v as MailLang)}
            data={[
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' },
            ]}
            aria-label={t('admin.mail.language')}
          />
          {saved && (
            <Badge variant="light" color={saved.customized ? 'grape' : 'gray'}>
              {saved.customized ? t('admin.mail.customized') : t('admin.mail.builtIn')}
            </Badge>
          )}
        </Group>

        {current && (
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            <Stack gap="sm">
              {FIELDS.map((field) =>
                field === 'intro' || field === 'outro' ? (
                  <Textarea
                    key={`${id}-${lang}-${field}`}
                    label={t(`admin.mail.fields.${field}`)}
                    value={current[field]}
                    onChange={(e) => edit(field, e.currentTarget.value)}
                    autosize
                    minRows={3}
                    maxLength={2000}
                    size="md"
                  />
                ) : (
                  <TextInput
                    key={`${id}-${lang}-${field}`}
                    label={t(`admin.mail.fields.${field}`)}
                    value={current[field]}
                    onChange={(e) => edit(field, e.currentTarget.value)}
                    maxLength={160}
                    size="md"
                    error={!current[field].trim() ? t('admin.mail.required') : undefined}
                  />
                ),
              )}
              <Text size="sm">
                {t('admin.mail.placeholders')}{' '}
                {MAIL_PLACEHOLDERS.map((p) => (
                  <Code key={p} mr={6}>{`{{${p}}}`}</Code>
                ))}
              </Text>
              <Text size="xs" c="dimmed">
                {t('admin.mail.paragraphs')}
              </Text>
              {invalid.length > 0 && (
                <Alert color="orange" variant="light">
                  {t('admin.mail.incomplete', {
                    languages: invalid.map((l) => (l === 'de' ? 'Deutsch' : 'English')).join(', '),
                  })}
                </Alert>
              )}
              <Group gap="sm">
                <Button
                  size="md"
                  leftSection={<IconDeviceFloppy size={18} />}
                  disabled={!dirty || invalid.length > 0}
                  loading={busy === 'save'}
                  onClick={() =>
                    run('save', async () => {
                      store(await endpoints.saveMailTemplate(id, texts!));
                      notify(t('admin.mail.saved'));
                    })
                  }
                >
                  {t('common.save')}
                </Button>
                <Button
                  size="md"
                  variant="light"
                  leftSection={<IconMailForward size={18} />}
                  disabled={dirty}
                  loading={busy === 'test'}
                  onClick={() =>
                    run('test', async () => {
                      await endpoints.testMailTemplate(id, lang);
                      notify(t('admin.mail.testSent'));
                    })
                  }
                >
                  {t('admin.mail.test')}
                </Button>
                {(saved?.customized || dirty) && (
                  <Button
                    size="md"
                    variant="subtle"
                    color="gray"
                    leftSection={<IconRestore size={18} />}
                    loading={busy === 'reset'}
                    onClick={() =>
                      run('reset', async () => {
                        if (saved?.customized) store(await endpoints.resetMailTemplate(id));
                        else setDrafts(({ [id]: _gone, ...rest }) => rest);
                      })
                    }
                  >
                    {t('admin.mail.reset')}
                  </Button>
                )}
              </Group>
              {dirty && (
                <Text size="xs" c="dimmed">
                  {t('admin.mail.saveFirst')}
                </Text>
              )}
            </Stack>

            {preview && (
              <div>
                <Text size="sm" fw={700} mb={4}>
                  {t('admin.mail.preview')}
                </Text>
                <div className={classes.mailSubject} data-testid="mail-preview-subject">
                  {preview.subject}
                </div>
                {/* our own renderer escapes every text an admin types */}
                <div
                  className={classes.mailPreview}
                  data-testid="mail-preview"
                  dangerouslySetInnerHTML={{ __html: preview.bodyHtml }}
                />
              </div>
            )}
          </SimpleGrid>
        )}
      </Stack>
    </Card>
  );
}
