import { describe, expect, it, vi } from "vitest";


describe("env", () => {
    it("parses a valid PORT", async () => {
        const originalPort = process.env.PORT;

        process.env.PORT = "4000";
        process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
        process.env.JWT_SECRET = "test-secret";

        const { env } = await import("../src/config/env.js");

        expect(env.PORT).toBe(4000);

        process.env.PORT = originalPort;
    });

    it("throws when required env vars are missing", async () => {
        vi.resetModules();
        const originalPort = process.env.PORT;
        const originalDatabaseUrl = process.env.DATABASE_URL;
        const originalJwtSecret = process.env.JWT_SECRET;

        delete process.env.PORT;
        delete process.env.DATABASE_URL;
        delete process.env.JWT_SECRET;

        await expect(import("../src/config/env.js")).rejects.toThrow(
            "Missing required environment variable: DATABASE_URL",
        );

        process.env.PORT = originalPort;
        process.env.DATABASE_URL = originalDatabaseUrl;
        process.env.JWT_SECRET = originalJwtSecret;
    });
});