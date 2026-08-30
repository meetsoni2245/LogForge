import type { Request, Response } from "express";
import {
    loginSchema,
    registerSchema,
} from "./auth.validation.js";
import {
    authenticateUser,
    registerUser,
} from "./auth.service.js";

export async function registerController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid registration data",
                details: parsed.error.flatten(),
                requestId: req.requestId,
            },
        });
        return;
    }

    const user = await registerUser(parsed.data);

    res.status(201).json({
        success: true,
        data: {
            id: user.id,
            username: user.username,
            createdAt: user.createdAt,
        },
    });
}

export async function loginController(
    req: Request,
    res: Response,
): Promise<void> {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({
            success: false,
            error: {
                message: "Invalid login data",
                details: parsed.error.flatten(),
                requestId: req.requestId,
            },
        });
        return;
    }

    const { user, token } = await authenticateUser(parsed.data);

    res.status(200).json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                username: user.username,
                createdAt: user.createdAt,
            },
        },
    });
}