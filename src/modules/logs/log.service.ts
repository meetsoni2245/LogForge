import {
    createLog,
    deleteLog,
    findLogById,
    findLogs,
    getLogStats,
    type CreateLogData,
    type LogFilters,
} from "./log.repository.js";

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
    return getLogStats();
}