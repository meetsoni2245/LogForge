export function parseLogLine(
    line: string,
): {
    timestamp: Date;
    level: "INFO" | "WARN" | "ERROR";
    message: string;
} {
    const parts = line.trim().split(" ");

    if (parts.length < 3) {
        throw new Error("Invalid log line format");
    }

    const timestamp = new Date(parts[0]);

    if (isNaN(timestamp.getTime())) {
        throw new Error("Invalid timestamp format");
    }

    const level = parts[1] as "INFO" | "WARN" | "ERROR";

    if (!["INFO", "WARN", "ERROR"].includes(level)) {
        throw new Error(`Unsupported log level: ${level}`);
    }

    const message = parts.slice(2).join(" ");

    if (!message) {
        throw new Error("Log message cannot be empty");
    }

    return {
        timestamp,
        level,
        message,
    };
}