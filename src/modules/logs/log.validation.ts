import { z } from "zod";

export const createLogSchema = z.object({
    timestamp: z.coerce.date(),
    level: z.enum(["INFO", "WARN", "ERROR"]),
    message: z.string().trim().min(1, "Message is required"),
});

export type CreateLogInput = z.infer<typeof createLogSchema>;