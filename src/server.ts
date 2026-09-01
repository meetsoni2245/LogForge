/**
 * server.ts
 *
 * Entry point for the application.
 *
 * Responsibilities:
 *  1. Load environment variables from .env before anything else.
 *  2. Validate that all required env vars are present (via env.ts).
 *  3. Start the HTTP server on the configured port.
 *
 * This file should NOT contain any business logic.
 * It exists purely to boot the process.
 */

// Load .env file into process.env.
// This must happen before importing env.ts, which reads process.env.
import "dotenv/config";

import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/database.js";
const server = app.listen(env.PORT, () => {
  console.log(`[LogForge] Server running in ${env.NODE_ENV} mode`);
  console.log(`[LogForge] Listening on http://localhost:${env.PORT}`);
  console.log(`[LogForge] Health check: http://localhost:${env.PORT}/health`);
});

// Graceful shutdown: close the server cleanly on SIGTERM (e.g. from a process manager).
process.on("SIGTERM", async () => {
  console.log("[LogForge] SIGTERM received — shutting down gracefully");

  server.close(async () => {
    console.log("[LogForge] Server closed");

    await prisma.$disconnect();

    console.log("[LogForge] Database disconnected");
    process.exit(0);
  });
});
