import {
    createLog,
    deleteLog,
    findLogById,
    findLogs,
    getLogStats,
    type CreateLogData,
    type LogFilters,
} from "./log.repository.js";
import type { LogLevel } from "../../generated/prisma/enums.js";

export async function createLogService(data: CreateLogData) {
    return createLog(data);
}

export async function getLogsService(filters: LogFilters) {
    return findLogs(filters);
}

export async function getLogByIdService(id: string) {
    return findLogById(id);
}

export async function deleteLogService(id: string) {
    return deleteLog(id);
}

export async function getStatsService() {
    const stats = await getLogStats();
    const byLevel: Record<LogLevel, number> = {
        INFO: 0,
        WARN: 0,
        ERROR: 0,
    };

    for (const logLevel of stats.logLevels) {
        byLevel[logLevel.level] = logLevel._count._all;
    }

    return {
        totalLogs: stats.totalLogs,
        byLevel,
    };
}