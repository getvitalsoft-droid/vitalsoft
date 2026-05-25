import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Captura el 100% de errores, 10% de transacciones (performance)
  tracesSampleRate: 0.1,

  // Session replay — graba sesiones con errores
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.05,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // No enviar errores en desarrollo local
  enabled: process.env.NODE_ENV === "production",
});
