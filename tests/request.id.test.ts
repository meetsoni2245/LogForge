import express from "express";
import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import errorMiddleware from "../src/middleware/error.middleware.js";
import requestIdMiddleware from "../src/middleware/request.id.middleware.js";
import requestLoggingMiddleware from "../src/middleware/request.logging.middleware.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createErrorApp() {
    const testApp = express();

    testApp.use(requestIdMiddleware);
    testApp.use(requestLoggingMiddleware);
    testApp.get("/unexpected-error", () => {
        throw new Error("internal failure");
    });
    testApp.use(errorMiddleware);

    return testApp;
}

describe("request IDs", () => {
    it("generates and returns a UUID when no request ID is supplied", async () => {
        const response = await request(app).get("/health");

        expect(response.headers["x-request-id"]).toMatch(UUID_PATTERN);
    });

    it("preserves a trimmed supplied request ID", async () => {
        const response = await request(app)
            .get("/health")
            .set("X-Request-Id", "  test-request-123  ");

        expect(response.headers["x-request-id"]).toBe("test-request-123");
    });

    it.each([
        ["whitespace", "   "],
        ["excessively long", "x".repeat(129)],
    ])("replaces %s request IDs with a generated UUID", async (_description, value) => {
        const response = await request(app)
            .get("/health")
            .set("X-Request-Id", value);

        expect(response.headers["x-request-id"]).toMatch(UUID_PATTERN);
    });

    it("returns the request ID on a 404 response", async () => {
        const response = await request(app)
            .get("/missing")
            .set("X-Request-Id", "test-request-123");

        expect(response.status).toBe(404);
        expect(response.headers["x-request-id"]).toBe("test-request-123");
        expect(response.body.error.requestId).toBe("test-request-123");
    });

    it("returns the request ID in unexpected error responses", async () => {
        const response = await request(createErrorApp())
            .get("/unexpected-error")
            .set("X-Request-Id", "test-request-123");

        expect(response.status).toBe(500);
        expect(response.headers["x-request-id"]).toBe("test-request-123");
        expect(response.body.error.requestId).toBe("test-request-123");
        expect(JSON.stringify(response.body)).not.toContain("internal failure");
    });

    it("includes the response request ID in structured request logs", async () => {
        const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

        try {
            const response = await request(app)
                .get("/health")
                .set("X-Request-Id", "test-request-123");
            const entry = JSON.parse(String(consoleLogSpy.mock.calls[0][0]));

            expect(entry.requestId).toBe(response.headers["x-request-id"]);
        } finally {
            vi.restoreAllMocks();
        }
    });

    it("assigns a different generated request ID to each request", async () => {
        const first = await request(app).get("/health");
        const second = await request(app).get("/health");

        expect(first.headers["x-request-id"]).toMatch(UUID_PATTERN);
        expect(second.headers["x-request-id"]).toMatch(UUID_PATTERN);
        expect(first.headers["x-request-id"]).not.toBe(second.headers["x-request-id"]);
    });
});