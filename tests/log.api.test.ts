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
import { createAuthToken } from "../src/modules/auth/auth.token.js";

const testAuthToken = createAuthToken({ userId: "test-user-id", username: "testuser" });

const testPrefix = "__logforge_api_integration_test__";
const baseTimestamp = "2099-07-15T12:00:00.000Z";

function makeLog(
    name: string,
    level: "INFO" | "WARN" | "ERROR",
    timestamp = baseTimestamp,
) {
    return {
        timestamp,
        level,
        message: `${testPrefix}:${name}`,
    };
}

async function removeTestLogs() {
    await prisma.log.deleteMany({
        where: {
            message: {
                startsWith: testPrefix,
            },
        },
    });
}

beforeAll(async () => {
    await prisma.$connect();
});

beforeEach(async () => {
    await removeTestLogs();
});

afterEach(async () => {
    await removeTestLogs();
});

afterAll(async () => {
    await removeTestLogs();
    await prisma.$disconnect();
});

describe("Logs HTTP API integration", () => {
    describe("POST /api/logs", () => {
        it("creates a valid log and returns 201 with the success/data response", async () => {
            const log = makeLog("create", "INFO");

            const response = await request(app)
                .post("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send(log);

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    level: log.level,
                    message: log.message,
                    timestamp: log.timestamp,
                },
            });
            expect(response.body.data.id).toEqual(expect.any(String));
        });

        it("rejects invalid log data with 400", async () => {
            const response = await request(app)
                .post("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    ...makeLog("invalid", "INFO"),
                    level: "DEBUG",
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid log data",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
    });

    describe("POST /api/logs/bulk", () => {
        it("creates multiple valid logs and returns the created count", async () => {
            const logs = [
                makeLog("bulk-info", "INFO"),
                makeLog("bulk-warn", "WARN", "2099-07-15T12:01:00.000Z"),
                makeLog("bulk-error", "ERROR", "2099-07-15T12:02:00.000Z"),
            ];

            const response = await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({ logs });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({
                success: true,
                data: { created: 3 },
            });
        });

        it.each([
            ["an empty array", { logs: [] }],
            ["more than 100 logs", { logs: Array.from({ length: 101 }, () => makeLog("too-many", "INFO")) }],
            ["invalid nested log data", { logs: [makeLog("nested-valid", "INFO"), { ...makeLog("nested-invalid", "INFO"), level: "DEBUG" }] }],
        ])("rejects %s with 400", async (_description, body) => {
            const response = await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send(body);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.message).toBe("Invalid bulk log data");
            expect(response.body.error.requestId).toBe(response.headers["x-request-id"]);
        });

        it("handles concurrent bulk ingestion requests", async () => {
            const requests = Array.from({ length: 5 }, (_, requestIndex) =>
                request(app)
                    .post("/api/logs/bulk")
                    .set("Authorization", `Bearer ${testAuthToken}`)
                    .send({
                        logs: Array.from({ length: 10 }, (_, logIndex) =>
                            makeLog(`concurrent-${requestIndex}-${logIndex}`, "INFO"),
                        ),
                    }),
            );

            const responses = await Promise.all(requests);

            expect(responses).toHaveLength(5);

            for (const response of responses) {
                expect(response.status).toBe(201);
                expect(response.body).toEqual({
                    success: true,
                    data: { created: 10 },
                });
            }
        });
    });

    describe("GET /api/logs", () => {
        it("returns 200 with data and pagination metadata", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [
                        makeLog("list-one", "INFO"),
                        makeLog("list-two", "WARN", "2099-07-15T12:01:00.000Z"),
                        makeLog("list-three", "ERROR", "2099-07-15T12:02:00.000Z"),
                    ],
                });

            const response = await request(app)
                .get("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({ search: testPrefix, page: 1, limit: 2 });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination).toEqual({
                page: 1,
                limit: 2,
                total: 3,
                totalPages: 2,
            });
        });

        it("filters logs by level", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [makeLog("level-info", "INFO"), makeLog("level-warn", "WARN", "2099-07-15T12:01:00.000Z")],
                });

            const response = await request(app)
                .get("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({ search: testPrefix, level: "warn" });

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].message).toBe(`${testPrefix}:level-warn`);
        });

        it("filters logs by message search", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [makeLog("search-match", "INFO"), makeLog("other", "INFO", "2099-07-15T12:01:00.000Z")],
                });

            const response = await request(app)
                .get("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({ search: "SEARCH-MATCH" });

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].message).toBe(`${testPrefix}:search-match`);
        });

        it("filters logs by from and to timestamps", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [
                        makeLog("date-before", "INFO", "2099-07-14T23:59:59.000Z"),
                        makeLog("date-inside", "WARN", "2099-07-15T12:00:00.000Z"),
                        makeLog("date-after", "ERROR", "2099-07-16T00:00:00.000Z"),
                    ],
                });

            const response = await request(app)
                .get("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({
                    search: testPrefix,
                    from: "2099-07-15T00:00:00.000Z",
                    to: "2099-07-15T23:59:59.999Z",
                });

            expect(response.status).toBe(200);
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.data[0].message).toBe(`${testPrefix}:date-inside`);
        });

        it("rejects a from date later than to", async () => {
            const response = await request(app)
                .get("/api/logs")
                .query({
                    from: "2099-07-16T00:00:00.000Z",
                    to: "2099-07-15T00:00:00.000Z",
                })
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid query parameters",
                    requestId: response.headers["x-request-id"],
                },
            });
        });

        it("rejects invalid page and limit values with 400", async () => {
            const response = await request(app)
                .get("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({ page: 0, limit: 101 });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid query parameters",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
    });

    describe("GET /api/logs/:id", () => {
        it("returns an existing log with 200", async () => {
            const createResponse = await request(app)
                .post("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send(makeLog("get-by-id", "ERROR"));

            const response = await request(app)
                .get(`/api/logs/${createResponse.body.data.id}`)
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    id: createResponse.body.data.id,
                    message: `${testPrefix}:get-by-id`,
                    level: "ERROR",
                },
            });
        });

        it("returns 404 for a nonexistent ID", async () => {
            const response = await request(app)
                .get("/api/logs/00000000-0000-0000-0000-000000000000")
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                success: false,
                error: {
                    message: "Log not found",
                    requestId: response.headers["x-request-id"],
                },
            });
        });

        it("rejects a malformed ID with 400", async () => {
            const response = await request(app)
                .get("/api/logs/not-a-valid-uuid")
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid log ID",
                    code: "INVALID_LOG_ID",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
    });

    describe("GET /api/logs/stats", () => {
        it("returns 200 with totalLogs and byLevel", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [
                        makeLog("stats-info-1", "INFO"),
                        makeLog("stats-info-2", "INFO", "2099-07-15T12:01:00.000Z"),
                        makeLog("stats-warn", "WARN", "2099-07-15T12:02:00.000Z"),
                        makeLog("stats-error", "ERROR", "2099-07-15T12:03:00.000Z"),
                    ],
                });

            const response = await request(app)
                .get("/api/logs/stats")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({
                    from: "2099-07-15T12:00:00.000Z",
                    to: "2099-07-15T12:03:00.000Z",
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                success: true,
                data: {
                    totalLogs: 4,
                    byLevel: { INFO: 2, WARN: 1, ERROR: 1 },
                },
            });
        });

        it("applies from and to date filtering", async () => {
            await request(app)
                .post("/api/logs/bulk")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    logs: [
                        makeLog("stats-before", "INFO", "2099-07-14T23:59:59.000Z"),
                        makeLog("stats-inside-info", "INFO", "2099-07-15T12:00:00.000Z"),
                        makeLog("stats-inside-error", "ERROR", "2099-07-15T12:01:00.000Z"),
                        makeLog("stats-after", "WARN", "2099-07-16T00:00:00.000Z"),
                    ],
                });

            const response = await request(app)
                .get("/api/logs/stats")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .query({
                    from: "2099-07-15T00:00:00.000Z",
                    to: "2099-07-15T23:59:59.999Z",
                });

            expect(response.status).toBe(200);
            expect(response.body.data).toEqual({
                totalLogs: 2,
                byLevel: { INFO: 1, WARN: 0, ERROR: 1 },
            });
        });
    });

    describe("DELETE /api/logs/:id", () => {
        it("deletes an existing log and subsequent GET returns 404", async () => {
            const createResponse = await request(app)
                .post("/api/logs")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send(makeLog("delete", "WARN"));
            const id = createResponse.body.data.id as string;

            const deleteResponse = await request(app)
                .delete(`/api/logs/${id}`)
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(deleteResponse.status).toBe(200);
            expect(deleteResponse.body).toEqual({
                success: true,
                data: { message: "Log deleted successfully" },
            });

            const getResponse = await request(app)
                .get(`/api/logs/${id}`)
                .set("Authorization", `Bearer ${testAuthToken}`);
            expect(getResponse.status).toBe(404);
        });

        it("rejects a malformed ID with 400", async () => {
            const response = await request(app)
                .delete("/api/logs/not-a-valid-uuid")
                .set("Authorization", `Bearer ${testAuthToken}`);

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: "Invalid log ID",
                    code: "INVALID_LOG_ID",
                    requestId: response.headers["x-request-id"],
                },
            });
        });
    });

    describe("POST /api/logs/raw", () => {
        it("creates a log from a raw log line", async () => {
            const response = await request(app)
                .post("/api/logs/raw")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    line: `2099-07-15T12:00:00.000Z ERROR ${testPrefix}:raw-test`,
                });

            expect(response.status).toBe(201);
            expect(response.body).toMatchObject({
                success: true,
                data: {
                    level: "ERROR",
                    message: `${testPrefix}:raw-test`,
                    timestamp: "2099-07-15T12:00:00.000Z",
                },
            });
            expect(response.body.data.id).toEqual(expect.any(String));
        });
        it("rejects an invalid raw log line with 400", async () => {
            const response = await request(app)
                .post("/api/logs/raw")
                .set("Authorization", `Bearer ${testAuthToken}`)
                .send({
                    line: "this is not a valid log line",
                });

            expect(response.status).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    message: expect.any(String),
                    requestId: expect.any(String),
                },
            });
        });


    });
});
