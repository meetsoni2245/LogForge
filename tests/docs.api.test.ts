import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("OpenAPI documentation", () => {
    it("serves the interactive documentation UI", async () => {
        const responses = await Promise.all([
            request(app).get("/docs"),
            request(app).get("/docs/"),
        ]);

        for (const response of responses) {
            expect(response.status).toBe(200);
            expect(response.headers["content-type"]).toMatch(/html/);
        }
    });

    it("serves the static assets referenced by the UI", async () => {
        const [cssResponse, bundleResponse, presetResponse, initResponse, faviconResponse] =
            await Promise.all([
                request(app).get("/docs/swagger-ui.css"),
                request(app).get("/docs/swagger-ui-bundle.js"),
                request(app).get("/docs/swagger-ui-standalone-preset.js"),
                request(app).get("/docs/swagger-ui-init.js"),
                request(app).get("/docs/favicon-32x32.png"),
            ]);

        expect(cssResponse.status).toBe(200);
        expect(bundleResponse.status).toBe(200);
        expect(presetResponse.status).toBe(200);
        expect(initResponse.status).toBe(200);
        expect(faviconResponse.status).toBe(200);
    });

    it("serves the OpenAPI 3 document with the implemented API contract", async () => {
        const response = await request(app).get("/docs/openapi.json");
        const document = response.body;

        expect(response.status).toBe(200);
        expect(document.openapi).toMatch(/^3\./);
        expect(document.paths).toEqual(expect.objectContaining({
            "/health": expect.any(Object),
            "/api/logs": expect.any(Object),
            "/api/logs/bulk": expect.any(Object),
            "/api/logs/{id}": expect.any(Object),
            "/api/logs/stats": expect.any(Object),
        }));
        expect(document.components.schemas.LogLevel.enum).toEqual([
            "INFO",
            "WARN",
            "ERROR",
        ]);
        expect(document.components.schemas.Log).toEqual(expect.objectContaining({
            type: "object",
            properties: expect.objectContaining({
                id: expect.any(Object),
                timestamp: expect.any(Object),
                level: expect.any(Object),
                message: expect.any(Object),
                createdAt: expect.any(Object),
            }),
        }));
        expect(document.components.schemas.ErrorResponse).toEqual(expect.any(Object));
        expect(document.components.schemas.ErrorResponse.properties.error.required)
            .toEqual(expect.arrayContaining(["message", "requestId"]));
        expect(document.components.schemas.Pagination).toEqual(expect.any(Object));
        expect(document.components.schemas.Stats).toEqual(expect.any(Object));
        expect(document.components.headers["X-Request-Id"]).toEqual(expect.any(Object));
        expect(document.paths["/api/logs"].post.parameters).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    name: "X-Request-Id",
                    in: "header",
                }),
            ]),
        );
        expect(document.paths["/api/logs"].post.responses["201"].headers["X-Request-Id"])
            .toEqual({ $ref: "#/components/headers/X-Request-Id" });
    });
});
