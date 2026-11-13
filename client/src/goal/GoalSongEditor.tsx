import { useState } from 'react';
import {
  Alert,
  Anchor,
  Autocomplete,
  Button,
  Card,
  Chip,
  FileButton,
  Group,
  Select,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconMusicHeart, IconSparkles, IconUpload } from '@tabler/icons-react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BASE_SKILLS,
  GOAL_STYLES,
  GOAL_STYLE_SKILLS,
  SKILL_IDS,
  SKILL_NAMES,
  isSkillTaught,
  recognizeSong,
  searchSongs,
  songLabel,
  type GoalSong,
  type GoalStyle,
  type OwnPieceDto,
  type SkillId,
} from '@klavio/shared';
import { endpoints } from '../api/endpoints';
import { useErrorText } from '../auth/useErrorText';
import { PieceReadError, readPieceFile } from '../import/readPiece';
import { useLocalized } from '../lesson/useLocalized';
import { GoalSongPicks } from './GoalSongPicks';

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
  const errorText = useErrorText();
  const [title, setTitle] = useState(initial?.title ?? '');
  // an own piece uploaded here: the dream song itself, not just a title
  const [piece, setPiece] = useState<Pick<OwnPieceDto, 'id' | 'title'> | null>(
    initial?.pieceId ? { id: initial.pieceId, title: initial.title } : null,
  );
  const [uploaded, setUploaded] = useState<OwnPieceDto | null>(null);
  const [uploadProblem, setUploadProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [style, setStyle] = useState<GoalStyle>(initial?.style ?? 'ballad');
  const [skills, setSkills] = useState<SkillId[]>(initial?.skills ?? GOAL_STYLE_SKILLS.ballad);
  const choosable = SKILL_IDS.filter((s) => !BASE_SKILLS.includes(s));
  const guess = recognizeSong(title);
  const suggestions = searchSongs(title);
  const guessKey = (g: typeof guess) => (g ? (g.song?.title ?? `words:${g.skills.join()}`) : '');
  // the suggestion last applied – a saved goal keeps its own choice until the title changes
  const [applied, setApplied] = useState(() => guessKey(recognizeSong(initial?.title ?? '')));

  const upload = async (file: File | null) => {
    if (!file) return;
    setUploadProblem(null);
    setUploading(true);
    try {
      const draft = await readPieceFile(file);
      const saved = await endpoints.addPiece({
        title: draft.title.slice(0, 120),
        composer: draft.composer?.slice(0, 120) ?? null,
        exercise: draft.exercise,
        keyboard: draft.keyboard,
      });
      setUploaded(saved);
      setPiece(saved);
      setTitle(saved.title.slice(0, 80));
      setApplied('');
    } catch (err) {
      setUploadProblem(
        err instanceof PieceReadError ? t(`own.errors.${err.key}`, err.params) : errorText(err),
      );
    } finally {
      setUploading(false);
    }
  };

  const changeTitle = (value: string) => {
    setTitle(value);
    if (piece && value !== piece.title) setPiece(null); // another title: no longer the uploaded piece
    const next = recognizeSong(value);
    const key = guessKey(next);
    if (next && key !== applied) {
      setStyle(next.style);
      setSkills(next.skills);
    }
    setApplied(key);
  };

  return (
    <Card withBorder radius="lg" padding="lg" id="goal">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim())
            onSave({ title: title.trim(), style, skills, ...(piece ? { pieceId: piece.id } : {}) });
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
          <div>
            <Text fw={500} mb="xs">
              {t('goal.picks.title')}
            </Text>
            <GoalSongPicks value={title} onPick={(song) => changeTitle(song.title)} />
          </div>
          <Autocomplete
            label={t('goal.songTitle')}
            description={t('goal.songTitleHint')}
            placeholder={t('goal.songTitlePlaceholder')}
            maxLength={80}
            value={title}
            onChange={changeTitle}
            // our own search: typos, German titles and artists – no further filtering
            data={suggestions.map(songLabel)}
            filter={({ options }) => options}
            limit={8}
            comboboxProps={{ shadow: 'md' }}
            renderOption={({ option }) => {
              const song = suggestions.find((s) => songLabel(s) === option.value);
              return (
                <div>
                  <Text size="sm" fw={600}>
                    {song?.title ?? option.value}
                  </Text>
                  {song?.artist && (
                    <Text size="xs" c="dimmed">
                      {song.artist}
                    </Text>
                  )}
                </div>
              );
            }}
          />
          <Text size="sm" component="div" aria-live="polite" data-testid="goal-recognized" mt={-8}>
            {title.trim().length >= 3 &&
              (guess?.song && guess.fuzzy ? (
                <Group gap={6} align="baseline">
                  <span>
                    <IconSparkles size={14} aria-hidden />{' '}
                    {t(guess.song.artist ? 'goal.fuzzy' : 'goal.fuzzyNoArtist', {
                      title: guess.song.title,
                      artist: guess.song.artist,
                    })}
                  </span>
                  <Button
                    size="compact-sm"
                    variant="outline"
                    color="pink.8"
                    onClick={() => changeTitle(songLabel(guess.song!))}
                  >
                    {t('goal.useTitle')}
                  </Button>
                </Group>
              ) : guess?.song ? (
                <>
                  <IconSparkles size={14} aria-hidden />{' '}
                  {t(guess.song.artist ? 'goal.recognized' : 'goal.recognizedNoArtist', {
                    title: guess.song.title,
                    artist: guess.song.artist,
                  })}
                </>
              ) : guess ? (
                t('goal.guessed')
              ) : (
                <Text span c="dimmed" inherit>
                  {t('goal.unknown')}
                </Text>
              ))}
          </Text>
          <div data-testid="goal-upload">
            <Text fw={500}>{t('goal.upload.title')}</Text>
            <Text size="sm" c="dimmed" mb="xs">
              {t('goal.upload.hint')}
            </Text>
            <FileButton onChange={(f) => void upload(f)} accept=".musicxml,.xml,.mxl,.mid,.midi">
              {(props) => (
                <Button
                  {...props}
                  variant="default"
                  leftSection={<IconUpload size={18} />}
                  loading={uploading}
                >
                  {t('goal.upload.button')}
                </Button>
              )}
            </FileButton>
            {uploaded && piece?.id === uploaded.id && (
              <Alert color="pink" variant="light" mt="xs" data-testid="goal-uploaded">
                {t('goal.upload.done', { title: uploaded.title })}{' '}
                <Anchor component={Link} to={`/own/${uploaded.id}`} fw={700}>
                  {t('goal.upload.open')}
                </Anchor>
              </Alert>
            )}
            {uploadProblem && (
              <Alert color="red" variant="light" mt="xs" data-testid="goal-upload-problem">
                {uploadProblem}
              </Alert>
            )}
          </div>
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
