import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be at most 50 characters"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
    username: z
        .string()
        .trim()
        .min(1, "Username is required")
        .max(50, "Username must be at most 50 characters"),

    password: z
        .string()
        .min(1, "Password is required")
        .max(128, "Password must be at most 128 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;