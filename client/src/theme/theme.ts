import { createTheme, type MantineThemeOverride } from '@mantine/core';
import type { UiMode } from '@klavio/shared';

/**
 * Two looks, same content:
 *  - kids:    warm, more colour, mascot everywhere (round cards, but buttons and
 *             inputs with the same moderate radius as in classic)
 *  - classic: calm, neutral, mascot only for feedback
 * Both use large sizes by default: the device sits on the piano's music
 * stand ~50 cm away and is operated with a single finger.
 */
const shared: MantineThemeOverride = {
  fontFamily: '"Nunito Variable", system-ui, -apple-system, "Segoe UI", sans-serif',
  headings: { fontFamily: '"Nunito Variable", system-ui, sans-serif', fontWeight: '800' },
  fontSizes: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.3rem', xl: '1.6rem' },
  components: {
    Button: { defaultProps: { size: 'lg' } },
    TextInput: { defaultProps: { size: 'lg' } },
    Autocomplete: { defaultProps: { size: 'lg' } },
    PinInput: { defaultProps: { size: 'lg' } },
    ActionIcon: { defaultProps: { size: 'xl' } },
    Switch: { defaultProps: { size: 'lg' } },
  },
};

const kids = createTheme({
  ...shared,
  primaryColor: 'indigo',
  primaryShade: 7, // white text on indigo-7 ≈ 5:1 (WCAG AA)
  defaultRadius: 'md',
  other: { mascotPresence: 'high' },
});

const classic = createTheme({
  ...shared,
  primaryColor: 'blue',
  primaryShade: 8, // white text on blue-8 ≈ 5:1 (WCAG AA)
  defaultRadius: 'md',
  other: { mascotPresence: 'low' },
});

export const themes: Record<UiMode, MantineThemeOverride> = { kids, classic };
