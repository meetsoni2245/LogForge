import AppError from "../errors/app.error.js";
export function parseLogLine(
    line: string,
): {
    timestamp: Date;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
} {
    const parts = line.trim().split(" ");

    if (parts.length < 3) {
        throw new AppError(400, "Invalid log line format");
    }

    const timestamp = new Date(parts[0]);

    if (isNaN(timestamp.getTime())) {
        throw new AppError(400, "Invalid timestamp format");
    }

    const level = parts[1] as "INFO" | "WARN" | "ERROR";

    if (!["INFO", "WARN", "ERROR"].includes(level)) {
        throw new AppError(400, `Unsupported log level: ${level}`);
    }

    const message = parts.slice(2).join(" ");

    if (!message) {
        throw new AppError(400, "Log message cannot be empty");
    }

    return {
        timestamp,
        level,
        message,
    };
}