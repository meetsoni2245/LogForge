import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import errorMiddleware from "../src/middleware/error.middleware.js";
import requestIdMiddleware from "../src/middleware/request.id.middleware.js";
import requestLoggingMiddleware from "../src/middleware/request.logging.middleware.js";
import { createApiRateLimiter } from "../src/middleware/rate.limit.middleware.js";

function createRateLimitTestApp() {
    const testApp = express();

    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.use(requestLoggingMiddleware);

    testApp.use(
        "/api/logs",
        createApiRateLimiter({
            windowMs: 60_000,
            limit: 2,
        }),
    );

    testApp.get("/api/logs", (_req, res) => {
        res.status(200).json({
            success: true,
            data: [],
        });
    });

    testApp.get("/health", (_req, res) => {
        res.status(200).json({
            status: "ok",
        });
    });

    testApp.use(errorMiddleware);

    return testApp;
}

describe("API rate limiting", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("allows requests under the configured limit", async () => {
        const app = createRateLimitTestApp();

        const first = await request(app).get("/api/logs");
        const second = await request(app).get("/api/logs");

        expect(first.status).toBe(200);
        expect(second.status).toBe(200);
    });

    it("returns 429 after the configured limit is exceeded", async () => {
        const app = createRateLimitTestApp();

        await request(app).get("/api/logs");
        await request(app).get("/api/logs");

        const response = await request(app).get("/api/logs");

        expect(response.status).toBe(429);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "Too many requests, please try again later.",
                code: "RATE_LIMIT_EXCEEDED",
                requestId: expect.any(String),
            },
        });
    });

    it("returns the same request ID in the header and error body", async () => {
        const app = createRateLimitTestApp();

        await request(app).get("/api/logs");
        await request(app).get("/api/logs");

        const response = await request(app)
            .get("/api/logs")
            .set("X-Request-Id", "rate-limit-test-id");

        expect(response.status).toBe(429);
        expect(response.headers["x-request-id"]).toBe("rate-limit-test-id");
        expect(response.body.error.requestId).toBe("rate-limit-test-id");
    });

    it("returns standard rate-limit headers", async () => {
        const app = createRateLimitTestApp();

        const response = await request(app).get("/api/logs");

        expect(response.headers["ratelimit"]).toBeDefined();
    });

    it("logs the 429 response", async () => {
        const app = createRateLimitTestApp();

        await request(app).get("/api/logs");
        await request(app).get("/api/logs");
        await request(app).get("/api/logs");

        const entries = consoleLogSpy.mock.calls.map(([value]) =>
            JSON.parse(String(value)),
        );

        const rateLimitedEntry = entries.find(
            (entry) => entry.statusCode === 429,
        );

        expect(rateLimitedEntry).toMatchObject({
            method: "GET",
            path: "/api/logs",
            statusCode: 429,
            requestId: expect.any(String),
            durationMs: expect.any(Number),
            timestamp: expect.any(String),
        });
    });

    it("does not rate-limit the health endpoint", async () => {
        const app = createRateLimitTestApp();

        const responses = await Promise.all(
            Array.from({ length: 5 }, () => request(app).get("/health")),
        );

        expect(responses.every((response) => response.status === 200)).toBe(
            true,
        );
    });
});