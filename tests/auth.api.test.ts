import "dotenv/config";
import {
    afterAll,
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    it,
} from "vitest";
import request from "supertest";
import app from "../src/app.js";
import prisma from "../src/config/database.js";

const testPrefix = "__logforge_auth_api_test__";

async function removeTestUsers() {
    await prisma.user.deleteMany({
        where: {
            username: {
                startsWith: testPrefix,
            },
        },
    });
}

beforeAll(async () => {
    await prisma.$connect();
});

beforeEach(async () => {
    await removeTestUsers();
});

afterEach(async () => {
    await removeTestUsers();
});

afterAll(async () => {
    await removeTestUsers();
    await prisma.$disconnect();
});

describe("Auth HTTP API integration", () => {
    describe("POST /api/auth/register", () => {
        it("registers a user and does not expose the password hash", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    username: `${testPrefix}_register`,
                    password: "password123",
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    username: `${testPrefix}_register`,
                    createdAt: expect.any(String),
                },
            });
            expect(response.body.data.id).toEqual(expect.any(String));
            expect(response.body.data).not.toHaveProperty("passwordHash");
        });
        it("rejects a duplicate username with 409", async () => {
            const username = `${testPrefix}_duplicate`;

            await request(app)
                .post("/api/auth/register")
                .send({
                    username,
                    password: "password123",
                });

            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    username,
                    password: "password456",
                });

            expect(response.status).toBe(409);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Username already exists",
                    code: "USERNAME_EXISTS",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
        it("rejects invalid registration data with 400", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    username: "ab",
                    password: "short",
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid registration data",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
    });
    describe("POST /api/auth/login", () => {
        it("authenticates a registered user and returns a JWT", async () => {
            const username = `${testPrefix}_login`;
            const password = "password123";

            await request(app)
                .post("/api/auth/register")
                .send({
                    username,
                    password,
                });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    username,
                    password,
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    token: expect.any(String),
                    user: {
                        username,
                    },
                },
            });

            expect(response.body.data.user.id).toEqual(expect.any(String));
            expect(response.body.data.user.createdAt).toEqual(expect.any(String));
            expect(response.body.data.user).not.toHaveProperty("passwordHash");
        });
        it("rejects an incorrect password with 401", async () => {
            const username = `${testPrefix}_wrong_password`;

            await request(app)
                .post("/api/auth/register")
                .send({
                    username,
                    password: "password123",
                });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    username,
                    password: "wrong-password",
                });

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid username or password",
                    code: "INVALID_CREDENTIALS",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
        it("rejects an unknown username with 401", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    username: `${testPrefix}_does_not_exist`,
                    password: "password123",
                });

            expect(response.status).toBe(401);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid username or password",
                    code: "INVALID_CREDENTIALS",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
        it("rejects invalid login data with 400", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    username: "",
                    password: "",
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid login data",
                    requestId: response.headers["x-request-id"],
                },
            });
        });

        it("rate limits excessive login attempts with 429", async () => {
            const username = `${testPrefix}_rate_limit`;

            await request(app)
                .post("/api/auth/register")
                .send({
                    username,
                    password: "password123",
                });

            const responses = await Promise.all(
                Array.from({ length: 11 }, () =>
                    request(app)
                        .post("/api/auth/login")
                        .send({
                            username,
                            password: "wrong-password",
                        }),
                ),
            );

            const rateLimitedResponses = responses.filter(
                (response) => response.status === 429,
            );

            expect(rateLimitedResponses.length).toBeGreaterThan(0);

            for (const response of rateLimitedResponses) {
                expect(response.body).toMatchObject({
                    success: false,
                    error: {
                        message: "Too many requests, please try again later.",
                        code: "RATE_LIMIT_EXCEEDED",
                        requestId: expect.any(String),
                    },
                });
            }
        });
    });
});