export default class AppError extends Error {
    readonly statusCode: number;
    readonly details?: unknown;
    readonly code?: string;

    constructor(
        statusCode: number,
        message: string,
        details?: unknown,
        code?: string,
    ) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.details = details;
        this.code = code;
    }
}
