import prisma from "../../config/database.js";
import type { LogLevel } from "../../generated/prisma/enums.js";

export interface CreateLogData {
    timestamp: Date;
    level: LogLevel;
    message: string;
}

export interface LogFilters {
    level?: LogLevel;
    search?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
}

export async function createLog(data: CreateLogData) {
    return prisma.log.create({
        data,
    });
}

export async function createLogs(data: CreateLogData[]) {
    const result = await prisma.log.createMany({
        data,
    });

    return result.count;
}

export async function findLogs(filters: LogFilters) {
    const where = {
        ...(filters.level && {
            level: filters.level,
        }),
        ...(filters.search && {
            message: {
                contains: filters.search,
                mode: "insensitive" as const,
            },
        }),
        ...(filters.from || filters.to
            ? {
                timestamp: {
                    ...(filters.from && { gte: filters.from }),
                    ...(filters.to && { lte: filters.to }),
                },
            }
            : {}),
    };

    const [logs, total] = await Promise.all([
        prisma.log.findMany({
            where,
            orderBy: [
                {
                    timestamp: "desc",
                },
                {
                    id: "desc",
                },
            ],
            skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
            take: filters.limit ?? 20,
        }),
        prisma.log.count({ where }),
    ]);

    return {
        logs,
        total,
    };
}

export async function findLogById(id: string) {
    return prisma.log.findUnique({
        where: { id },
    });
}

export async function deleteLog(id: string) {
    return prisma.log.delete({
        where: { id },
    });
}

export async function getLogStats(
    filters: Pick<LogFilters, "from" | "to"> = {},
) {
    const where = filters.from || filters.to
        ? {
            timestamp: {
                ...(filters.from && { gte: filters.from }),
                ...(filters.to && { lte: filters.to }),
            },
        }
        : undefined;

    const [totalLogs, logLevels] = await Promise.all([
        prisma.log.count({ where }),
        prisma.log.groupBy({
            by: ["level"],
            where,
            _count: {
                _all: true,
            },
        }),
    ]);

    return {
        totalLogs,
        logLevels,
    };
}

export async function getHourlyLogStats(
    filters: Pick<LogFilters, "from" | "to"> = {},
) {
    const where = filters.from || filters.to
        ? {
            timestamp: {
                ...(filters.from && { gte: filters.from }),
                ...(filters.to && { lte: filters.to }),
            },
        }
        : undefined;

    const logs = await prisma.log.findMany({
        where,
        select: {
            timestamp: true,
            level: true,
        },
        orderBy: {
            timestamp: "asc",
        },
    });

    const hourly = new Map<
        string,
        { info: number; warn: number; error: number }
    >();

    for (const log of logs) {
        const hour = new Date(log.timestamp);
        hour.setUTCMinutes(0, 0, 0);

        const key = hour.toISOString();

        if (!hourly.has(key)) {
            hourly.set(key, {
                info: 0,
                warn: 0,
                error: 0,
            });
        }

        const bucket = hourly.get(key)!;

        if (log.level === "INFO") {
            bucket.info += 1;
        } else if (log.level === "WARN") {
            bucket.warn += 1;
        } else if (log.level === "ERROR") {
            bucket.error += 1;
        }
    }

    return Array.from(hourly.entries()).map(([hour, counts]) => ({
        hour,
        ...counts,
    }));
}