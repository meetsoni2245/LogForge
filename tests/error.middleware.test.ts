import express from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import AppError from "../src/errors/app.error.js";
import errorMiddleware from "../src/middleware/error.middleware.js";
import requestIdMiddleware from "../src/middleware/request.id.middleware.js";

function createErrorTestApp() {
    const testApp = express();

    testApp.use(requestIdMiddleware);
    testApp.get("/known-error", (_req, _res, next) => {
        next(new AppError(422, "The request cannot be processed", {
            field: "message",
        }, "REQUEST_INVALID"));
    });
    testApp.get("/unexpected-error", () => {
        throw new Error("database password=secret should not be exposed");
    });
    testApp.use(errorMiddleware);

    return testApp;
}

describe("centralized HTTP error handling", () => {
    it("returns an AppError status, message, code, and details", async () => {
        const response = await request(createErrorTestApp()).get("/known-error");

        expect(response.status).toBe(422);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "The request cannot be processed",
                code: "REQUEST_INVALID",
                details: { field: "message" },
                requestId: response.headers["x-request-id"],
            },
        });
    });

    it("converts unexpected errors to a generic 500 response", async () => {
        const response = await request(createErrorTestApp()).get("/unexpected-error");

        expect(response.status).toBe(500);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "Internal server error",
                requestId: response.headers["x-request-id"],
            },
        });
        expect(JSON.stringify(response.body)).not.toContain("database");
        expect(JSON.stringify(response.body)).not.toContain("secret");
    });

    it("returns the standard 404 response for an unmatched route", async () => {
        const response = await request(app).get("/route-that-does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "Route not found",
                code: "NOT_FOUND",
                requestId: response.headers["x-request-id"],
            },
        });
    });
});
