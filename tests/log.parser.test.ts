import { describe, expect, it } from "vitest";
import { parseLogLine } from "../src/parsers/log.parser.js";

describe("log parser", () => {
    it("parses a valid INFO log line", () => {
        const result = parseLogLine(
            "2026-08-30T13:23:26.828Z INFO Server started",
        );

        expect(result).toEqual({
            timestamp: new Date("2026-08-30T13:23:26.828Z"),
            level: "INFO",
            message: "Server started",
        });
    });

    it("parses a valid WARN log line", () => {
        const result = parseLogLine(
            "2026-08-30T13:23:26.828Z WARN High memory usage",
        );

        expect(result).toEqual({
            timestamp: new Date("2026-08-30T13:23:26.828Z"),
            level: "WARN",
            message: "High memory usage",
        });
    });

    it("parses a valid ERROR log line", () => {
        const result = parseLogLine(
            "2026-08-30T13:23:26.828Z ERROR Database connection failed",
        );

        expect(result).toEqual({
            timestamp: new Date("2026-08-30T13:23:26.828Z"),
            level: "ERROR",
            message: "Database connection failed",
        });
    });

    it("preserves the complete message", () => {
        const result = parseLogLine(
            "2026-08-30T13:23:26.828Z ERROR Database connection failed: timeout after 30 seconds",
        );

        expect(result.message).toBe(
            "Database connection failed: timeout after 30 seconds",
        );
    });

    it("rejects a malformed timestamp", () => {
        expect(() =>
            parseLogLine("not-a-date ERROR Something failed"),
        ).toThrow();
    });

    it("rejects an unsupported log level", () => {
        expect(() =>
            parseLogLine(
                "2026-08-30T13:23:26.828Z DEBUG Debug message",
            ),
        ).toThrow();
    });

    it("rejects a line with no message", () => {
        expect(() =>
            parseLogLine(
                "2026-08-30T13:23:26.828Z ERROR",
            ),
        ).toThrow();
    });
});