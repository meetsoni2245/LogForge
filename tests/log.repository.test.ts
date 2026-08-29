import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import prisma from "../src/config/database.js";
import {
    createLog,
    createLogs,
    deleteLog,
    findLogById,
    findLogs,
    getLogStats,
    type CreateLogData,
} from "../src/modules/logs/log.repository.js";

const testPrefix = "__logforge_repository_integration_test__";

function makeLog(
    name: string,
    level: CreateLogData["level"],
    timestamp: string,
): CreateLogData {
    return {
        timestamp: new Date(timestamp),
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

describe("log repository integration", () => {
    it("creates and retrieves a log by id", async () => {
        const data = makeLog("create-log", "INFO", "2026-01-15T12:00:00.000Z");

        const created = await createLog(data);
        const found = await findLogById(created.id);

        expect(found).toMatchObject({
            ...data,
            id: created.id,
        });
    });

    it("creates multiple logs and returns the created count", async () => {
        const data = [
            makeLog("bulk-1", "INFO", "2026-01-15T12:00:00.000Z"),
            makeLog("bulk-2", "WARN", "2026-01-15T12:01:00.000Z"),
            makeLog("bulk-3", "ERROR", "2026-01-15T12:02:00.000Z"),
        ];

        const count = await createLogs(data);

        expect(count).toBe(3);
        const messages = await prisma.log.findMany({
            where: { message: { startsWith: testPrefix } },
            select: { message: true },
        });
        expect(messages.map(({ message }) => message).sort()).toEqual(
            data.map(({ message }) => message).sort(),
        );
    });

    it("finds logs by level", async () => {
        await createLogs([
            makeLog("level-info", "INFO", "2026-01-15T12:00:00.000Z"),
            makeLog("level-warn", "WARN", "2026-01-15T12:01:00.000Z"),
            makeLog("level-error", "ERROR", "2026-01-15T12:02:00.000Z"),
        ]);

        const result = await findLogs({ level: "WARN" });

        expect(result.total).toBe(1);
        expect(result.logs).toHaveLength(1);
        expect(result.logs[0].message).toBe(`${testPrefix}:level-warn`);
    });

    it("finds logs by a case-insensitive message search", async () => {
        await createLogs([
            makeLog("search-match", "INFO", "2026-01-15T12:00:00.000Z"),
            {
                ...makeLog("search-other", "INFO", "2026-01-15T12:01:00.000Z"),
                message: `${testPrefix}:A different message`,
            },
        ]);

        const result = await findLogs({ search: "SEARCH-MATCH" });

        expect(result.total).toBe(1);
        expect(result.logs[0].message).toBe(`${testPrefix}:search-match`);
    });

    it("filters logs by from and to timestamps", async () => {
        await createLogs([
            makeLog("date-before", "INFO", "2026-01-01T00:00:00.000Z"),
            makeLog("date-inside", "WARN", "2026-01-15T12:00:00.000Z"),
            makeLog("date-after", "ERROR", "2026-02-01T00:00:00.000Z"),
        ]);

        const result = await findLogs({
            from: new Date("2026-01-15T00:00:00.000Z"),
            to: new Date("2026-01-31T23:59:59.999Z"),
        });

        expect(result.total).toBe(1);
        expect(result.logs[0].message).toBe(`${testPrefix}:date-inside`);
    });

    it("paginates results while preserving the total count", async () => {
        await createLogs([
            makeLog("page-1", "INFO", "2026-01-15T12:00:00.000Z"),
            makeLog("page-2", "INFO", "2026-01-15T12:01:00.000Z"),
            makeLog("page-3", "INFO", "2026-01-15T12:02:00.000Z"),
            makeLog("page-4", "INFO", "2026-01-15T12:03:00.000Z"),
            makeLog("page-5", "INFO", "2026-01-15T12:04:00.000Z"),
        ]);

        const result = await findLogs({ page: 2, limit: 2 });

        expect(result.total).toBe(5);
        expect(result.logs.map(({ message }) => message)).toEqual([
            `${testPrefix}:page-3`,
            `${testPrefix}:page-2`,
        ]);
    });

    it("deletes a log by id", async () => {
        const created = await createLog(
            makeLog("delete-log", "ERROR", "2026-01-15T12:00:00.000Z"),
        );

        const deleted = await deleteLog(created.id);
        const found = await findLogById(created.id);

        expect(deleted.id).toBe(created.id);
        expect(found).toBeNull();
    });

    it("returns statistics grouped by level", async () => {
        await createLogs([
            makeLog("stats-info-1", "INFO", "2026-01-15T12:00:00.000Z"),
            makeLog("stats-info-2", "INFO", "2026-01-15T12:01:00.000Z"),
            makeLog("stats-warn", "WARN", "2026-01-15T12:02:00.000Z"),
            makeLog("stats-error", "ERROR", "2026-01-15T12:03:00.000Z"),
        ]);

        const result = await getLogStats({
            from: new Date("2026-01-15T00:00:00.000Z"),
            to: new Date("2026-01-15T23:59:59.999Z"),
        });

        expect(result.totalLogs).toBe(4);
        expect(result.logLevels).toEqual(
            expect.arrayContaining([
                { level: "INFO", _count: { _all: 2 } },
                { level: "WARN", _count: { _all: 1 } },
                { level: "ERROR", _count: { _all: 1 } },
            ]),
        );
        expect(result.logLevels).toHaveLength(3);
    });

    it("applies date ranges to statistics", async () => {
        await createLogs([
            makeLog("stats-range-before", "INFO", "2026-01-01T00:00:00.000Z"),
            makeLog("stats-range-inside-1", "INFO", "2026-01-15T12:00:00.000Z"),
            makeLog("stats-range-inside-2", "ERROR", "2026-01-15T12:01:00.000Z"),
            makeLog("stats-range-after", "WARN", "2026-02-01T00:00:00.000Z"),
        ]);

        const result = await getLogStats({
            from: new Date("2026-01-15T00:00:00.000Z"),
            to: new Date("2026-01-15T23:59:59.999Z"),
        });

        expect(result.totalLogs).toBe(2);
        expect(result.logLevels).toEqual(
            expect.arrayContaining([
                { level: "INFO", _count: { _all: 1 } },
                { level: "ERROR", _count: { _all: 1 } },
            ]),
        );
        expect(result.logLevels).toHaveLength(2);
    });
});
