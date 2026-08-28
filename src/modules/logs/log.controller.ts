import type { Request, Response } from "express";
import { createLogSchema, getLogsQuerySchema } from "./log.validation.js";
import {
    createLogService,
    deleteLogService,
    getLogByIdService,
    getLogsService,
    getStatsService,
} from "./log.service.js";


export async function createLogController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = createLogSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid log data",
                details: parsed.error.flatten(),
            },
        });
        return;
    }

    const log = await createLogService(parsed.data);

    res.status(201).json({
        success: true,
        data: log,
    });
}

export async function getLogsController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsedQuery = getLogsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid query parameters",
                details: parsedQuery.error.flatten(),
            },
        });
        return;
    }

    const { page, limit, level, search, from, to } = parsedQuery.data;

    const logs = await getLogsService({
        page,
        limit,
        level,
        search,
        from,
        to,
    });

    res.status(200).json({
        success: true,
        data: logs,
    });
}

export async function getLogByIdController(
    req: Request,
    res: Response,
): Promise<void> {
    const log = await getLogByIdService(String(req.params.id));

    if (!log) {
        res.status(404).json({
            success: false,
            error: {
                message: "Log not found",
            },
        });
        return;
    }

    res.status(200).json({
        success: true,
        data: log,
    });
}

export async function deleteLogController(
    req: Request,
    res: Response,
): Promise<void> {
    const log = await getLogByIdService(String(req.params.id));

    if (!log) {
        res.status(404).json({
            success: false,
            error: {
                message: "Log not found",
            },
        });
        return;
    }

    await deleteLogService(String(req.params.id));

    res.status(200).json({
        success: true,
        data: {
            message: "Log deleted successfully",
        },
    });
}

export async function getStatsController(
    _: Request,
    res: Response,
): Promise<void> {
    const stats = await getStatsService();

    res.status(200).json({
        success: true,
        data: stats,
    });
}

