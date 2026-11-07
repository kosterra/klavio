import { notifications } from '@mantine/notifications';
import i18n from '../i18n';

/** Toast with an accessible close button (Mantine's has no label by default). */
export function notify(message: string, color: 'teal' | 'red' | 'blue' = 'teal') {
  notifications.show({
    color,
    message,
    closeButtonProps: { 'aria-label': i18n.t('common.close') },
  });
}
