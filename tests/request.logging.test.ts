import express from "express";
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from "vitest";
import request from "supertest";
import errorMiddleware, {
    notFoundMiddleware,
} from "../src/middleware/error.middleware.js";
import requestIdMiddleware from "../src/middleware/request.id.middleware.js";
import requestLoggingMiddleware from "../src/middleware/request.logging.middleware.js";

function createRequestLoggingTestApp() {
    const testApp = express();

    testApp.use(requestIdMiddleware);
    testApp.use(express.json());
    testApp.use(requestLoggingMiddleware);
    testApp.get("/success", (_req, res) => {
        res.status(200).json({ success: true });
    });
    testApp.post("/logs", (req, res) => {
        res.status(201).json({ received: Boolean(req.body.message) });
    });
    testApp.get("/unexpected-error", () => {
        throw new Error("unexpected internal failure");
    });
    testApp.use(notFoundMiddleware);
    testApp.use(errorMiddleware);

    return testApp;
}

describe("HTTP request logging middleware", () => {
    let consoleLogSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
        consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("logs a successful request with method, path, status, and duration", async () => {
        await request(createRequestLoggingTestApp()).get("/success");

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(consoleLogSpy.mock.calls[0][0]))).toEqual({
            timestamp: expect.any(String),
            method: "GET",
            path: "/success",
            statusCode: 200,
            durationMs: expect.any(Number),
            requestId: expect.any(String),
        });
        expect(JSON.parse(String(consoleLogSpy.mock.calls[0][0])).durationMs).toBeGreaterThanOrEqual(0);
    });

    it("logs POST requests without including the request body", async () => {
        await request(createRequestLoggingTestApp())
            .post("/logs")
            .set("Authorization", "Bearer do-not-log-this")
            .send({ message: "private request body" });

        const logOutput = String(consoleLogSpy.mock.calls[0][0]);
        const entry = JSON.parse(logOutput);

        expect(entry).toMatchObject({
            method: "POST",
            path: "/logs",
            statusCode: 201,
        });
        expect(logOutput).not.toContain("private request body");
        expect(logOutput).not.toContain("Authorization");
        expect(logOutput).not.toContain("do-not-log-this");
    });

    it("logs an unmatched request with status 404", async () => {
        await request(createRequestLoggingTestApp()).get("/missing");

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(consoleLogSpy.mock.calls[0][0]))).toMatchObject({
            method: "GET",
            path: "/missing",
            statusCode: 404,
            requestId: expect.any(String),
        });
    });

    it("logs an unexpected error response with status 500", async () => {
        await request(createRequestLoggingTestApp()).get("/unexpected-error");

        expect(consoleLogSpy).toHaveBeenCalledTimes(1);
        expect(JSON.parse(String(consoleLogSpy.mock.calls[0][0]))).toMatchObject({
            method: "GET",
            path: "/unexpected-error",
            statusCode: 500,
            requestId: expect.any(String),
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                message: "unexpected internal failure",
            }),
        );
    });

    it("produces exactly one request log per request", async () => {
        const testApp = createRequestLoggingTestApp();

        await request(testApp).get("/success");
        await request(testApp).get("/missing");

        expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });
});
