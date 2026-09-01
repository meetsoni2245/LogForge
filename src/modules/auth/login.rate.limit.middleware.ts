import { createApiRateLimiter } from "../../middleware/rate.limit.middleware.js";

export const loginRateLimiter = createApiRateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 10,
});

export default loginRateLimiter;