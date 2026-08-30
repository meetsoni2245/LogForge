import { rateLimit } from "express-rate-limit";
import AppError from "../errors/app.error.js";

export const createApiRateLimiter = (options?: {
    windowMs?: number;
    limit?: number;
}) =>
    rateLimit({
        windowMs: options?.windowMs ?? 15 * 60 * 1000,
        limit: options?.limit ?? 100,
        standardHeaders: "draft-8",
        legacyHeaders: false,
        handler: (req, _res, next) => {
            next(
                new AppError(
                    429,
                    "Too many requests, please try again later.",
                    undefined,
                    "RATE_LIMIT_EXCEEDED",
                ),
            );
        },
    });

const apiRateLimiter = createApiRateLimiter();

export default apiRateLimiter;