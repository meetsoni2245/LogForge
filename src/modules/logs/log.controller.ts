import type { Request, Response } from "express";
import {
    createLogService,
    deleteLogService,
    getLogByIdService,
    getLogsService,
} from "./log.service.js";
import { createLogSchema } from "./log.validation.js";

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

    const logs = await getLogsService({
        page,
        limit,
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