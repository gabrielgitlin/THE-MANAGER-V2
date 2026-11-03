import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/**
 * Initializes error monitoring. No-op when VITE_SENTRY_DSN is not set,
 * so local development and preview builds work without a Sentry project.
 */
export function initMonitoring() {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (dsn) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  } else {
    console.error(error, context);
  }
}

export function setMonitoringUser(user: { id: string; email?: string | null } | null) {
  if (!dsn) return;
  Sentry.setUser(user ? { id: user.id } : null);
}
