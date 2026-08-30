/// <reference path="../src/types/express.d.ts" />
import "dotenv/config";
import { describe, expect, it } from "vitest";
import request from "supertest";
import express from "express";
import authMiddleware from "../src/modules/auth/auth.middleware.js";
import { createAuthToken } from "../src/modules/auth/auth.token.js";
import errorMiddleware from "../src/middleware/error.middleware.js";

function createTestApp() {
    const app = express();

    app.use(authMiddleware);

    app.get("/protected", (req, res) => {
        res.status(200).json({
            user: req.user,
        });
    });

    app.use(errorMiddleware);

    return app;
}
describe("auth middleware", () => {
    it("allows a request with a valid JWT", async () => {
        const app = createTestApp();

        const token = createAuthToken({
            userId: "user-123",
            username: "testuser",
        });

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            user: {
                userId: "user-123",
                username: "testuser",
            },
        });
    });

    it("rejects a request without an Authorization header", async () => {
        const app = createTestApp();

        const response = await request(app).get("/protected");

        expect(response.status).toBe(401);
    });
    it("rejects an invalid JWT", async () => {
        const app = createTestApp();

        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "Invalid authentication token",
                code: "INVALID_TOKEN",
            },
        });
    });

    it("rejects an empty Bearer token", async () => {
        const app = createTestApp();

        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer ");

        expect(response.status).toBe(401);
        expect(response.body).toMatchObject({
            success: false,
            error: {
                message: "Authentication required",
                code: "AUTHENTICATION_REQUIRED",
            },
        });
    });
});