// Global error logger — captures uncaught exceptions and unhandled rejections
window.addEventListener('error', (event) => {
  console.error('[Global Error]', event.error?.message || event.message, event.error?.stack || '');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Rejection]', event.reason?.message || event.reason, event.reason?.stack || '');
});
