import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';

/** Turns any thrown error into a translated, user-facing sentence. */
export function useErrorText() {
  const { t } = useTranslation();
  return (err: unknown): string => {
    const code = err instanceof ApiError ? err.code : 'UNKNOWN';
    return t(`errors.${code}`, { defaultValue: t('common.error') });
  };
}
