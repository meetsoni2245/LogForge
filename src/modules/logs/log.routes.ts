import { Router } from "express";
import {
    createLogController,
    deleteLogController,
    getLogByIdController,
    getLogsController,
} from "./log.controller.js";

const router = Router();

router.post("/", createLogController);
router.get("/", getLogsController);
router.get("/:id", getLogByIdController);
router.delete("/:id", deleteLogController);

export default router;