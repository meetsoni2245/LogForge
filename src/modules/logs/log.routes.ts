import { Router } from "express";
import {
    createLogsController,
    createLogController,
    deleteLogController,
    getLogByIdController,
    getLogsController,
    getStatsController,
} from "./log.controller.js";

const router = Router();

router.post("/", createLogController);
router.post("/bulk", createLogsController);
router.get("/", getLogsController);
router.get("/stats", getStatsController);
router.get("/:id", getLogByIdController);
router.delete("/:id", deleteLogController);

export default router;