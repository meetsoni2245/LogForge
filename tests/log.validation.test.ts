import { describe, expect, it } from "vitest";
import {
    bulkCreateLogsSchema,
    createLogSchema,
    getLogsQuerySchema,
    getStatsQuerySchema,
} from "../src/modules/logs/log.validation.js";

const validLog = {
    timestamp: "2026-01-15T12:00:00.000Z",
    level: "INFO" as const,
    message: "Application started",
};

describe("createLogSchema", () => {
    it("accepts a valid log and parses its timestamp", () => {
        const result = createLogSchema.safeParse(validLog);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.level).toBe("INFO");
            expect(result.data.message).toBe("Application started");
            expect(result.data.timestamp).toEqual(
                new Date("2026-01-15T12:00:00.000Z"),
            );
        }
    });

    it("rejects an invalid level", () => {
        const result = createLogSchema.safeParse({
            ...validLog,
            level: "DEBUG",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an empty message", () => {
        const result = createLogSchema.safeParse({
            ...validLog,
            message: "   ",
        });

        expect(result.success).toBe(false);
    });

    it("rejects an invalid timestamp", () => {
        const result = createLogSchema.safeParse({
            ...validLog,
            timestamp: "not-a-date",
        });

        expect(result.success).toBe(false);
    });
});

describe("bulkCreateLogsSchema", () => {
    it("accepts one valid log", () => {
        const result = bulkCreateLogsSchema.safeParse({ logs: [validLog] });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.logs).toHaveLength(1);
            expect(result.data.logs[0].timestamp).toEqual(
                new Date("2026-01-15T12:00:00.000Z"),
            );
        }
    });

    it("accepts multiple valid logs", () => {
        const result = bulkCreateLogsSchema.safeParse({
            logs: [validLog, { ...validLog, level: "ERROR", message: "Failed" }],
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.logs).toHaveLength(2);
            expect(result.data.logs[1].level).toBe("ERROR");
        }
    });

    it("rejects an empty logs array", () => {
        const result = bulkCreateLogsSchema.safeParse({ logs: [] });

        expect(result.success).toBe(false);
    });

    it("rejects more than 100 logs", () => {
        const result = bulkCreateLogsSchema.safeParse({
            logs: Array.from({ length: 101 }, () => validLog),
        });

        expect(result.success).toBe(false);
    });

    it("rejects an invalid log inside the array", () => {
        const result = bulkCreateLogsSchema.safeParse({
            logs: [validLog, { ...validLog, level: "DEBUG" }],
        });

        expect(result.success).toBe(false);
    });
});

describe("getLogsQuerySchema", () => {
    it("applies default page and limit values", () => {
        const result = getLogsQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.page).toBe(1);
            expect(result.data.limit).toBe(20);
        }
    });

    it.each([
        ["page", "abc"],
        ["page", "1.5"],
        ["limit", "Infinity"],
        ["limit", "NaN"],
    ])("rejects malformed numeric %s=%s", (field, value) => {
        const result = getLogsQuerySchema.safeParse({ [field]: value });

        expect(result.success).toBe(false);
    });

    it("accepts a valid level", () => {
        const result = getLogsQuerySchema.safeParse({ level: "ERROR" });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.level).toBe("ERROR");
        }
    });

    it("normalizes a lowercase level to uppercase", () => {
        const result = getLogsQuerySchema.safeParse({ level: "warn" });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.level).toBe("WARN");
        }
    });

    it.each([
        ["page", 0],
        ["limit", 0],
        ["limit", 101],
    ])("rejects %s=%s when it is outside the allowed range", (field, value) => {
        const result = getLogsQuerySchema.safeParse({ [field]: value });

        expect(result.success).toBe(false);
    });

    it("accepts valid from and to dates and parses them", () => {
        const result = getLogsQuerySchema.safeParse({
            from: "2026-01-01T00:00:00.000Z",
            to: "2026-01-31T23:59:59.000Z",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.from).toEqual(
                new Date("2026-01-01T00:00:00.000Z"),
            );
            expect(result.data.to).toEqual(
                new Date("2026-01-31T23:59:59.000Z"),
            );
        }
    });
});

describe("getStatsQuerySchema", () => {
    it("accepts no dates", () => {
        const result = getStatsQuerySchema.safeParse({});

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({});
        }
    });

    it("accepts from only", () => {
        const result = getStatsQuerySchema.safeParse({
            from: "2026-01-01T00:00:00.000Z",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.from).toEqual(
                new Date("2026-01-01T00:00:00.000Z"),
            );
            expect(result.data.to).toBeUndefined();
        }
    });

    it("accepts to only", () => {
        const result = getStatsQuerySchema.safeParse({
            to: "2026-01-31T23:59:59.000Z",
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.from).toBeUndefined();
            expect(result.data.to).toEqual(
                new Date("2026-01-31T23:59:59.000Z"),
            );
        }
    });

    it("accepts a valid from/to range", () => {
        const result = getStatsQuerySchema.safeParse({
            from: "2026-01-01T00:00:00.000Z",
            to: "2026-01-31T23:59:59.000Z",
        });

        expect(result.success).toBe(true);
    });

    it("rejects invalid dates", () => {
        const result = getStatsQuerySchema.safeParse({ from: "invalid" });

        expect(result.success).toBe(false);
    });

    it("rejects a from date later than to", () => {
        const result = getStatsQuerySchema.safeParse({
            from: "2026-02-01T00:00:00.000Z",
            to: "2026-01-01T00:00:00.000Z",
        });

        expect(result.success).toBe(false);
    });
});
