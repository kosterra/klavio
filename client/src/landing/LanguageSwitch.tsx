import { Button } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './Landing.module.css';

/** One tap to the other language – labelled in the language it switches to. */
export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const toEnglish = !i18n.language.startsWith('en');
  return (
    <Button
      variant="white"
      size="md"
      className={classes.cornerButton}
      leftSection={<IconLanguage size={20} aria-hidden />}
      lang={toEnglish ? 'en' : 'de-CH'}
      onClick={() => void i18n.changeLanguage(toEnglish ? 'en' : 'de-CH')}
    >
      {toEnglish ? 'English' : 'Deutsch'}
    </Button>
  );
}
