import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    createLog,
    createLogs,
    deleteLog,
    findLogById,
    findLogs,
    getLogStats,
} from "../src/modules/logs/log.repository.js";
import {
    createLogService,
    createLogsService,
    deleteLogService,
    getLogByIdService,
    getLogsService,
    getStatsService,
} from "../src/modules/logs/log.service.js";

vi.mock("../src/modules/logs/log.repository.js", () => ({
    createLog: vi.fn(),
    createLogs: vi.fn(),
    deleteLog: vi.fn(),
    findLogById: vi.fn(),
    findLogs: vi.fn(),
    getLogStats: vi.fn(),
}));

const mockedCreateLog = vi.mocked(createLog);
const mockedCreateLogs = vi.mocked(createLogs);
const mockedDeleteLog = vi.mocked(deleteLog);
const mockedFindLogById = vi.mocked(findLogById);
const mockedFindLogs = vi.mocked(findLogs);
const mockedGetLogStats = vi.mocked(getLogStats);

const logs = [
    {
        id: "log-1",
        timestamp: new Date("2026-01-15T12:00:00.000Z"),
        level: "INFO" as const,
        message: "Application started",
    },
];

const filters = {
    level: "ERROR" as const,
    search: "database",
    from: new Date("2026-01-01T00:00:00.000Z"),
    to: new Date("2026-01-31T23:59:59.000Z"),
    page: 2,
    limit: 10,
};

describe("getLogsService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedFindLogs.mockResolvedValue({ logs, total: 20 });
    });

    it("returns logs from the repository", async () => {
        const result = await getLogsService(filters);

        expect(result.logs).toBe(logs);
    });

    it("preserves the supplied page and limit", async () => {
        const result = await getLogsService(filters);

        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(10);
    });

    it("calculates totalPages when total is evenly divisible by limit", async () => {
        mockedFindLogs.mockResolvedValue({ logs, total: 20 });

        const result = await getLogsService({ page: 1, limit: 10 });

        expect(result.pagination.totalPages).toBe(2);
    });

    it("calculates totalPages when total is not evenly divisible by limit", async () => {
        mockedFindLogs.mockResolvedValue({ logs, total: 47 });

        const result = await getLogsService({ page: 1, limit: 20 });

        expect(result.pagination.totalPages).toBe(3);
    });

    it("uses page 1 when page is missing", async () => {
        const result = await getLogsService({ limit: 10 });

        expect(result.pagination.page).toBe(1);
    });

    it("uses limit 20 when limit is missing", async () => {
        const result = await getLogsService({ page: 3 });

        expect(result.pagination.limit).toBe(20);
    });

    it("passes the supplied filters to the repository", async () => {
        await getLogsService(filters);

        expect(mockedFindLogs).toHaveBeenCalledWith(filters);
    });
});

describe("getStatsService", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("preserves totalLogs and maps each level count", async () => {
        mockedGetLogStats.mockResolvedValue({
            totalLogs: 6,
            logLevels: [
                { level: "INFO", _count: { _all: 2 } },
                { level: "WARN", _count: { _all: 1 } },
                { level: "ERROR", _count: { _all: 3 } },
            ],
        });

        const result = await getStatsService();

        expect(result).toEqual({
            totalLogs: 6,
            byLevel: { INFO: 2, WARN: 1, ERROR: 3 },
        });
    });

    it("fills missing levels with 0", async () => {
        mockedGetLogStats.mockResolvedValue({
            totalLogs: 2,
            logLevels: [{ level: "ERROR", _count: { _all: 2 } }],
        });

        const result = await getStatsService();

        expect(result.byLevel).toEqual({ INFO: 0, WARN: 0, ERROR: 2 });
    });

    it("returns zero counts for an empty logLevels array", async () => {
        mockedGetLogStats.mockResolvedValue({ totalLogs: 0, logLevels: [] });

        const result = await getStatsService();

        expect(result).toEqual({
            totalLogs: 0,
            byLevel: { INFO: 0, WARN: 0, ERROR: 0 },
        });
    });
});

describe("createLogsService", () => {
    it("delegates to createLogs and passes through the created count", async () => {
        const data = logs.map(({ id: _id, ...log }) => log);
        mockedCreateLogs.mockResolvedValue(1);

        const result = await createLogsService(data);

        expect(mockedCreateLogs).toHaveBeenCalledWith(data);
        expect(result).toBe(1);
    });
});

describe("createLogService", () => {
    it("delegates to createLog and passes through the returned value", async () => {
        const data = logs[0];
        mockedCreateLog.mockResolvedValue(data as never);

        const result = await createLogService(data);

        expect(mockedCreateLog).toHaveBeenCalledWith(data);
        expect(result).toBe(data);
    });
});

describe("getLogByIdService", () => {
    it("delegates to findLogById and passes through the returned value", async () => {
        mockedFindLogById.mockResolvedValue(logs[0] as never);

        const result = await getLogByIdService("log-1");

        expect(mockedFindLogById).toHaveBeenCalledWith("log-1");
        expect(result).toBe(logs[0]);
    });
});

describe("deleteLogService", () => {
    it("delegates to deleteLog and passes through the returned value", async () => {
        mockedDeleteLog.mockResolvedValue(logs[0] as never);

        const result = await deleteLogService("log-1");

        expect(mockedDeleteLog).toHaveBeenCalledWith("log-1");
        expect(result).toBe(logs[0]);
    });
});
