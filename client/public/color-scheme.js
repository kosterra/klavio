/* global window, document, localStorage */
// Sets light or dark before the app starts, so a dark device doesn't flash
// light first. Same key and values as the app (Mantine's colour scheme manager).
(function () {
  var scheme = 'auto';
  try {
    scheme = (localStorage.getItem('klavio-color-scheme') || 'auto').replace(/"/g, '');
  } catch {
    // storage blocked: follow the device
  }
  if (scheme !== 'light' && scheme !== 'dark') {
    scheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-mantine-color-scheme', scheme);
})();
