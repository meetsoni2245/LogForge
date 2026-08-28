import type { Request, Response } from "express";
import { LogLevel } from "../../generated/prisma/enums.js";
import { createLogSchema, logLevelSchema } from "./log.validation.js";
import {
    createLogService,
    deleteLogService,
    getLogByIdService,
    getLogsService,
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
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (!Number.isInteger(page) || page < 1) {
        res.status(400).json({
            success: false,
            error: {
                message: "Page must be a positive integer",
            },
        });
        return;
    }

    if (!Number.isInteger(limit) || limit < 1) {
        res.status(400).json({
            success: false,
            error: {
                message: "Limit must be a positive integer",
            },
        });
        return;
    }

    const search = req.query.search
        ? String(req.query.search).trim()
        : undefined;
    const from = req.query.from
        ? new Date(String(req.query.from))
        : undefined;

    const to = req.query.to
        ? new Date(String(req.query.to))
        : undefined;
    if (from && Number.isNaN(from.getTime())) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid from date",
            },
        });
        return;
    }

    if (to && Number.isNaN(to.getTime())) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid to date",
            },
        });
        return;
    }
    const levelValue = req.query.level
        ? String(req.query.level).toUpperCase()
        : undefined;

    const parsedLevel = levelValue
        ? logLevelSchema.safeParse(levelValue)
        : undefined;

    if (parsedLevel && !parsedLevel.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid log level",
            },
        });
        return;
    }

    const level = parsedLevel?.data
        ? LogLevel[parsedLevel.data]
        : undefined;

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