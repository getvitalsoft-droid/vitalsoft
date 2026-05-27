const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = withSentryConfig(nextConfig, {
  org: "vitalsoft",
  project: "javascript-nextjs",

  // Solo subir source maps en CI/CD, no en local
  silent: !process.env.CI,

  // Source maps para mejor stack traces en Sentry
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,

  // No bloquear el build si Sentry falla
  automaticVercelMonitors: false,
});
