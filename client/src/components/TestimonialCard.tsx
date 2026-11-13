import { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TestimonialDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { notify } from './notify';

/**
 * «Erzähl anderen von Klavio»: a few words for the public page – only with
 * consent, shown once an admin has read them, and taken back at any time.
 */
export function TestimonialCard() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [mine, setMine] = useState<TestimonialDto[]>([]);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [role, setRole] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    endpoints.myTestimonials().then(setMine, () => undefined);
  }, []);

  const send = async () => {
    setBusy(true);
    try {
      const saved = await endpoints.addTestimonial({
        text: text.trim(),
        author: author.trim(),
        role: role.trim() || undefined,
        consent: true,
      });
      setMine((m) => [saved, ...m]);
      setText('');
      setConsent(false);
      notify(t('testimonial.thanks'));
    } catch (err) {
      notify(errorText(err), 'red');
    } finally {
      setBusy(false);
    }
  };

  const takeBack = async (id: string) => {
    try {
      await endpoints.deleteTestimonial(id);
      setMine((m) => m.filter((x) => x.id !== id));
    } catch (err) {
      notify(errorText(err), 'red');
    }
  };

  const ready = text.trim().length >= 10 && author.trim().length > 0 && consent;

  return (
    <Card withBorder radius="lg" padding="lg" data-testid="testimonial">
      <Stack gap="sm">
        <Title order={2} size="h3">
          {t('testimonial.title')}
        </Title>
        <Text size="sm">{t('testimonial.hint')}</Text>
        <Textarea
          label={t('testimonial.text')}
          value={text}
          onChange={(e) => setText(e.currentTarget.value)}
          maxLength={400}
          autosize
          minRows={3}
          size="md"
        />
        {/* side by side only where both fit; on phones one below the other */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label={t('testimonial.author')}
            description={t('testimonial.authorHint')}
            value={author}
            onChange={(e) => setAuthor(e.currentTarget.value)}
            maxLength={60}
            size="md"
          />
          <TextInput
            label={t('testimonial.role')}
            description={t('testimonial.roleHint')}
            value={role}
            onChange={(e) => setRole(e.currentTarget.value)}
            maxLength={60}
            size="md"
          />
        </SimpleGrid>
        <Checkbox
          checked={consent}
          onChange={(e) => setConsent(e.currentTarget.checked)}
          label={t('testimonial.consent')}
        />
        <Button onClick={() => void send()} disabled={!ready} loading={busy} w="fit-content">
          {t('testimonial.send')}
        </Button>
        {mine.map((m) => (
          <Card key={m.id} withBorder radius="md" padding="sm">
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <div style={{ minWidth: 0 }}>
                <Text size="sm">«{m.text}»</Text>
                <Badge
                  mt={6}
                  variant="light"
                  color={
                    m.status === 'approved' ? 'teal' : m.status === 'rejected' ? 'gray' : 'blue'
                  }
                >
                  {t(`testimonial.status.${m.status}`)}
                </Badge>
              </div>
              <Button variant="subtle" color="gray" size="xs" onClick={() => void takeBack(m.id)}>
                {t('testimonial.takeBack')}
              </Button>
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}
