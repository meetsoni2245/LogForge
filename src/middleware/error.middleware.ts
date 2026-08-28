import type { ErrorRequestHandler } from "express";

const errorMiddleware: ErrorRequestHandler = (
    err,
    _req,
    res,
    _next,
) => {
    console.error(err);

    res.status(500).json({
        success: false,
        error: {
            message: "Internal server error",
        },
    });
};

export default errorMiddleware;