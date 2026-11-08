import { ActionIcon, Menu, useMantineColorScheme } from '@mantine/core';
import { IconCheck, IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './Landing.module.css';

const ICONS = { auto: IconDeviceDesktop, light: IconSun, dark: IconMoon } as const;

/** Light, dark or automatic – the same choice as in the app menu, for visitors. */
export function ThemeSwitch() {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const Current = ICONS[colorScheme];
  return (
    <Menu position="bottom-end" shadow="md" withinPortal>
      <Menu.Target>
        <ActionIcon
          size="xl"
          variant="white"
          className={classes.themeSwitch}
          aria-label={`${t('nav.colorScheme')}: ${t(`nav.scheme.${colorScheme}`)}`}
        >
          <Current size={22} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{t('nav.colorScheme')}</Menu.Label>
        {(['auto', 'light', 'dark'] as const).map((scheme) => {
          const Icon = ICONS[scheme];
          return (
            <Menu.Item
              key={scheme}
              role="menuitemradio"
              aria-checked={colorScheme === scheme}
              leftSection={<Icon size={18} />}
              rightSection={colorScheme === scheme ? <IconCheck size={16} /> : null}
              onClick={() => setColorScheme(scheme)}
            >
              {t(`nav.scheme.${scheme}`)}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
