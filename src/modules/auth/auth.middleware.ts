import type { RequestHandler } from "express";
import { verifyAuthToken } from "./auth.token.js";
import AppError from "../../errors/app.error.js";

const authMiddleware: RequestHandler = (req, _res, next) => {
    const authorization = req.get("Authorization");

    if (!authorization?.startsWith("Bearer ")) {
        next(
            new AppError(
                401,
                "Authentication required",
                undefined,
                "AUTHENTICATION_REQUIRED",
            ),
        );
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        next(
            new AppError(
                401,
                "Authentication required",
                undefined,
                "AUTHENTICATION_REQUIRED",
            ),
        );
        return;
    }

    try {
        req.user = verifyAuthToken(token);
        next();
    } catch {
        next(
            new AppError(
                401,
                "Invalid authentication token",
                undefined,
                "INVALID_TOKEN",
            ),
        );
    }
};

export default authMiddleware;