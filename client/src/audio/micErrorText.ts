import { useTranslation } from 'react-i18next';
import type { MicErrorCode } from './microphone';

export function useMicErrorText() {
  const { t } = useTranslation();
  return (code: MicErrorCode | null) => (code ? t(`mic.errors.${code}`) : null);
}
