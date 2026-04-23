import * as Sentry from "@sentry/nestjs";

Sentry.init({
    dsn: "https://f092de913b1628cd1a1f3fec2a20a062@o4510135846764544.ingest.de.sentry.io/4510135848206416",
    integrations: [
        // send console.log, console.warn, and console.error calls as logs to Sentry
        Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] })
    ],
    // Send structured logs to Sentry
    enableLogs: true,
    // Tracing
    tracesSampleRate: 0.05, //  Capture 5% of the transactions
    // Setting this option to true will send default PII data to Sentry.
    sendDefaultPii: true
});
