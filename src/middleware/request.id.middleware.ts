import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const REQUEST_ID_HEADER = "X-Request-Id";
const MAX_REQUEST_ID_LENGTH = 128;

const requestIdMiddleware: RequestHandler = (req, res, next) => {
    const suppliedRequestId = req.get(REQUEST_ID_HEADER)?.trim();
    const requestId =
        suppliedRequestId && suppliedRequestId.length <= MAX_REQUEST_ID_LENGTH
            ? suppliedRequestId
            : randomUUID();

    req.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
};

export default requestIdMiddleware;