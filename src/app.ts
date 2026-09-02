import express from "express";
import logRoutes from "./modules/logs/log.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import errorMiddleware, {
  notFoundMiddleware,
} from "./middleware/error.middleware.js";
import requestIdMiddleware from "./middleware/request.id.middleware.js";
import requestLoggingMiddleware from "./middleware/request.logging.middleware.js";
import swaggerUi from "swagger-ui-express";
import openApiDocument from "./docs/openapi.js";
import apiRateLimiter from "./middleware/rate.limit.middleware.js";
import authMiddleware from "./modules/auth/auth.middleware.js";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(requestIdMiddleware);
app.use(express.json());
app.use(requestLoggingMiddleware);
app.use("/api/logs", apiRateLimiter, authMiddleware, logRoutes);
app.use("/api/auth", authRoutes);
app.get("/docs/openapi.json", (_req, res) => {
  res.status(200).json(openApiDocument);
});
const docsHtml = swaggerUi
  .generateHTML(openApiDocument, {
    customSiteTitle: "LogForge API documentation",
  })
  .replaceAll('="./', '="/docs/');
// swaggerUi.serve uses express.static first, which redirects /docs to /docs/.
// Explicit HTML keeps both documented URLs directly available with 200 responses.
app.get(["/docs", "/docs/"], (_req, res) => {
  res.type("html").send(docsHtml);
});
app.use("/docs", swaggerUi.serve);
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "LogForge",
  });
});
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;