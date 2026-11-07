import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/nunito';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './theme/global.css';
import './i18n';
import { APP_CONFIG } from '@klavio/shared';
import { App } from './App';

document.title = APP_CONFIG.name;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
