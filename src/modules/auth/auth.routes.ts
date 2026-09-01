import { Router } from "express";
import {
    loginController,
    registerController,
} from "./auth.controller.js";
import loginRateLimiter from "./login.rate.limit.middleware.js";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginRateLimiter, loginController);

export default router;