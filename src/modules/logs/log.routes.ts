import { Router } from "express";
import {
    createLogsController,
    createLogController,
    createRawLogController,
    deleteLogController,
    getLogByIdController,
    getLogsController,
    getStatsController,
} from "./log.controller.js";

const router = Router();

router.post("/", createLogController);
router.post("/bulk", createLogsController);
router.get("/", getLogsController);
router.post("/raw", createRawLogController);
router.get("/stats", getStatsController);
router.get("/:id", getLogByIdController);
router.delete("/:id", deleteLogController);

export default router;