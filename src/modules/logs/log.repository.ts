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

    return prisma.log.findMany({
        where,
        orderBy: {
            timestamp: "desc",
        },
        skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
        take: filters.limit ?? 20,
    });
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
