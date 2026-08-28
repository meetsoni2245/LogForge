import express from "express";
import logRoutes from "./modules/logs/log.routes.js";
import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());

app.use("/api/logs", logRoutes);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "LogForge",
  });
});
app.use(errorMiddleware);

export default app;