import "dotenv/config";
import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import {
    createAuthToken,
    verifyAuthToken,
} from "../src/modules/auth/auth.token.js";

describe("auth token", () => {
    const payload = {
        userId: "user-123",
        username: "testuser",
    };

    it("creates a token that can be verified", () => {
        const token = createAuthToken(payload);

        expect(token).toEqual(expect.any(String));
        expect(token.split(".")).toHaveLength(3);
        expect(verifyAuthToken(token)).toEqual(payload);
    });

    it("rejects an invalid token", () => {
        expect(() => verifyAuthToken("not-a-valid-token")).toThrow();
    });

    it("rejects a token signed with the wrong secret", () => {
        const token = jwt.sign(payload, "wrong-secret");

        expect(() => verifyAuthToken(token)).toThrow();
    });

    it("rejects a token signed with an unsupported algorithm", () => {
        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
            algorithm: "HS384",
        });

        expect(() => verifyAuthToken(token)).toThrow();
    });

    it("rejects a token with an invalid payload", () => {
        const token = jwt.sign(
            { userId: 123, username: "testuser" },
            process.env.JWT_SECRET!
        );

        expect(() => verifyAuthToken(token)).toThrow(
            "Invalid authentication token",
        );
    });

    it("rejects an expired token", () => {
        const token = jwt.sign(payload, process.env.JWT_SECRET!, {
            expiresIn: -1,
        });

        expect(() => verifyAuthToken(token)).toThrow();
    });

    it("rejects a token missing userId", () => {
        const token = jwt.sign(
            { username: "testuser" },
            process.env.JWT_SECRET!,
        );

        expect(() => verifyAuthToken(token)).toThrow(
            "Invalid authentication token",
        );
    });

    it("rejects a token missing username", () => {
        const token = jwt.sign(
            { userId: "user-123" },
            process.env.JWT_SECRET!,
        );

        expect(() => verifyAuthToken(token)).toThrow(
            "Invalid authentication token",
        );
    });

});