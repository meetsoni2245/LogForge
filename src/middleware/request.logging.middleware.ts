import type { RequestHandler } from "express";

interface RequestLogEntry {
    timestamp: string;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    requestId: string;
}

const requestLoggingMiddleware: RequestHandler = (req, res, next) => {
    const startedAt = Date.now();

    res.once("finish", () => {
        const entry: RequestLogEntry = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Math.max(0, Date.now() - startedAt),
            requestId: req.requestId,
        };

        console.log(JSON.stringify(entry));
    });

    next();
};

export default requestLoggingMiddleware;
