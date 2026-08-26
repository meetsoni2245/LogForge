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
}

export async function createLog(data: CreateLogData) {
    return prisma.log.create({
        data,
    });
}

export async function findLogs(filters: LogFilters) {
    return prisma.log.findMany({
        where: {
            ...(filters.level && {
                level: filters.level,
            }),
            ...(filters.search && {
                message: {
                    contains: filters.search,
                    mode: "insensitive",
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
        },
        orderBy: {
            timestamp: "desc",
        },
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