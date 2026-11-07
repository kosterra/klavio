import '../src/i18n';

// jsdom lacks these browser APIs used by Mantine (skipped in `@vitest-environment node` files)
if (typeof window !== 'undefined') installDomStubs();

function installDomStubs() {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = window.ResizeObserver ?? RO;
}
