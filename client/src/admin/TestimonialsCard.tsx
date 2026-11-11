import { useEffect, useState } from 'react';
import { Badge, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { TestimonialDto } from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { notify } from '../components/notify';

/** Admins read what families wrote and decide what the public page shows. */
export function TestimonialsCard() {
  const { t } = useTranslation();
  const errorText = useErrorText();
  const [list, setList] = useState<TestimonialDto[] | null>(null);
  useEffect(() => {
    endpoints.allTestimonials().then(setList, () => setList([]));
  }, []);
  const set = async (id: string, status: TestimonialDto['status']) => {
    try {
      const saved = await endpoints.setTestimonialStatus(id, status);
      setList((l) => (l ?? []).map((x) => (x.id === id ? saved : x)));
    } catch (err) {
      notify(errorText(err), 'red');
    }
  };
  return (
    <Card withBorder radius="lg" padding="lg" data-testid="admin-testimonials">
      <Stack gap="sm">
        <Title order={2} size="h3">
          {t('testimonial.adminTitle')}
        </Title>
        <Text size="sm">{t('testimonial.adminHint')}</Text>
        {list?.length === 0 && <Text c="dimmed">{t('testimonial.none')}</Text>}
        {list?.map((m) => (
          <Card key={m.id} withBorder radius="md" padding="sm">
            <Text size="sm">«{m.text}»</Text>
            <Text size="sm" fw={700} mt={4}>
              – {m.author}
              {m.role ? `, ${m.role}` : ''}
            </Text>
            <Group gap="xs" mt="xs" wrap="wrap">
              <Badge
                variant="light"
                color={m.status === 'approved' ? 'teal' : m.status === 'rejected' ? 'gray' : 'blue'}
              >
                {t(`testimonial.status.${m.status}`)}
              </Badge>
              {m.status !== 'approved' && (
                <Button size="xs" onClick={() => void set(m.id, 'approved')}>
                  {t('testimonial.approve')}
                </Button>
              )}
              {m.status !== 'rejected' && (
                <Button size="xs" variant="default" onClick={() => void set(m.id, 'rejected')}>
                  {t('testimonial.reject')}
                </Button>
              )}
            </Group>
          </Card>
        ))}
      </Stack>
    </Card>
  );
}
