import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export interface AuthTokenPayload {
    userId: string;
    username: string;
}

export function createAuthToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
    const payload = jwt.verify(token, env.JWT_SECRET, {
        algorithms: ["HS256"],
    });

    if (
        typeof payload !== "object" ||
        payload === null ||
        typeof payload.userId !== "string" ||
        typeof payload.username !== "string"
    ) {
        throw new Error("Invalid authentication token");
    }

    return {
        userId: payload.userId,
        username: payload.username,
    };
}