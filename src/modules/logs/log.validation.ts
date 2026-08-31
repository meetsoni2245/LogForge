import { z } from "zod";

export const createLogSchema = z.object({
    timestamp: z.coerce.date(),
    level: z.enum(["INFO", "WARN", "ERROR"]),
    message: z.string().trim().min(1, "Message is required"),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;

export const bulkCreateLogsSchema = z.object({
    logs: z.array(createLogSchema).min(1).max(100),
});

export const logLevelSchema = z.enum(["INFO", "WARN", "ERROR"]);
export const getLogsQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        level: z
            .string()
            .transform((value) => value.toUpperCase())
            .pipe(logLevelSchema)
            .optional(),
        search: z.string().trim().optional(),
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    })
    .refine(
        ({ from, to }) => !from || !to || from <= to,
        "The from date must be earlier than or equal to the to date",
    );

export const getStatsQuerySchema = z
    .object({
        from: z.coerce.date().optional(),
        to: z.coerce.date().optional(),
    })
    .refine(
        ({ from, to }) => !from || !to || from <= to,
        "The from date must be earlier than or equal to the to date",
    );