import type { ErrorRequestHandler, RequestHandler } from "express";
import AppError from "../errors/app.error.js";

export const notFoundMiddleware: RequestHandler = (_req, _res, next) => {
    next(new AppError(404, "Route not found", undefined, "NOT_FOUND"));
};

const errorMiddleware: ErrorRequestHandler = (
    err,
    req,
    res,
    next,
) => {
    if (res.headersSent) {
        next(err);
        return;
    }

    if (err instanceof AppError) {
        const error: {
            message: string;
            code?: string;
            details?: unknown;
            requestId: string;
        } = {
            message: err.message,
            requestId: req.requestId,
        };

        if (err.code !== undefined) {
            error.code = err.code;
        }
        if (err.details !== undefined) {
            error.details = err.details;
        }

        res.status(err.statusCode).json({
            success: false,
            error,
        });
        return;
    }

    console.error(err);

    res.status(500).json({
        success: false,
        error: {
            message: "Internal server error",
            requestId: req.requestId,
        },
    });
};

export default errorMiddleware;