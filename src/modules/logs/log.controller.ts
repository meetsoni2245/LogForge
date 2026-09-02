import type { Request, Response } from "express";
import { parseLogLine } from "../../parsers/log.parser.js";
import {
    bulkCreateLogsSchema,
    createLogSchema,
    getLogsQuerySchema,
    getStatsQuerySchema,
} from "./log.validation.js";
import {
    createLogsService,
    createLogService,
    deleteLogService,
    getLogByIdService,
    getLogsService,
    getStatsService,
    getHourlyStatsService,
} from "./log.service.js";

function isValidUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
    );
}


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
                requestId: req.requestId,
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

export async function createLogsController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = bulkCreateLogsSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid bulk log data",
                details: parsed.error.flatten(),
                requestId: req.requestId,
            },
        });
        return;
    }

    const created = await createLogsService(parsed.data.logs);

    res.status(201).json({
        success: true,
        data: {
            created,
        },
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
                requestId: req.requestId,
            },
        });
        return;
    }

    const { page, limit, level, search, from, to } = parsedQuery.data;

    const result = await getLogsService({
        page,
        limit,
        level,
        search,
        from,
        to,
    });

    res.status(200).json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
    });
}

export async function getLogByIdController(
    req: Request,
    res: Response,
): Promise<void> {
    const id = String(req.params.id);

    if (!isValidUuid(id)) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid log ID",
                code: "INVALID_LOG_ID",
                requestId: req.requestId,
            },
        });
        return;
    }

    const log = await getLogByIdService(id);

    if (!log) {
        res.status(404).json({
            success: false,
            error: {
                message: "Log not found",
                requestId: req.requestId,
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
    const id = String(req.params.id);

    if (!isValidUuid(id)) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid log ID",
                code: "INVALID_LOG_ID",
                requestId: req.requestId,
            },
        });
        return;
    }

    const log = await getLogByIdService(id);

    if (!log) {
        res.status(404).json({
            success: false,
            error: {
                message: "Log not found",
                requestId: req.requestId,
            },
        });
        return;
    }

    await deleteLogService(id);

    res.status(200).json({
        success: true,
        data: {
            message: "Log deleted successfully",
        },
    });
}

export async function getStatsController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsedQuery = getStatsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid query parameters",
                details: parsedQuery.error.flatten(),
                requestId: req.requestId,
            },
        });
        return;
    }

    const stats = await getStatsService(parsedQuery.data);

    res.status(200).json({
        success: true,
        data: stats,
    });
}

export async function getHourlyStatsController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsedQuery = getStatsQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid query parameters",
                details: parsedQuery.error.flatten(),
                requestId: req.requestId,
            },
        });
        return;
    }

    const stats = await getHourlyStatsService(parsedQuery.data);

    res.status(200).json({
        success: true,
        data: stats,
    });
}

export async function createRawLogController(
    req: Request,
    res: Response,
): Promise<void> {
    if (
        typeof req.body !== "object" ||
        req.body === null ||
        typeof req.body.line !== "string"
    ) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid raw log data",
                requestId: req.requestId,
            },
        });
        return;
    }
    const parsed = parseLogLine(req.body.line);
    const log = await createLogService(parsed);

    res.status(201).json({
        success: true,
        data: log,
    });
}