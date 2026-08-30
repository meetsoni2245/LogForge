import { describe, expect, it } from "vitest";
import {
    loginSchema,
    registerSchema,
} from "../src/modules/auth/auth.validation.js";

describe("auth validation", () => {
    describe("registerSchema", () => {
        it("accepts valid registration data", () => {
            const result = registerSchema.safeParse({
                username: "testuser",
                password: "password123",
            });

            expect(result.success).toBe(true);
        });

        it("rejects a username shorter than 3 characters", () => {
            const result = registerSchema.safeParse({
                username: "ab",
                password: "password123",
            });

            expect(result.success).toBe(false);
        });

        it("rejects a password shorter than 8 characters", () => {
            const result = registerSchema.safeParse({
                username: "testuser",
                password: "short",
            });

            expect(result.success).toBe(false);
        });

        it("trims the username", () => {
            const result = registerSchema.safeParse({
                username: "  testuser  ",
                password: "password123",
            });

            expect(result.success).toBe(true);

            if (result.success) {
                expect(result.data.username).toBe("testuser");
            }
        });
    });

    describe("loginSchema", () => {
        it("accepts valid login data", () => {
            const result = loginSchema.safeParse({
                username: "testuser",
                password: "password123",
            });

            expect(result.success).toBe(true);
        });

        it("rejects an empty username", () => {
            const result = loginSchema.safeParse({
                username: "",
                password: "password123",
            });

            expect(result.success).toBe(false);
        });

        it("rejects an empty password", () => {
            const result = loginSchema.safeParse({
                username: "testuser",
                password: "",
            });

            expect(result.success).toBe(false);
        });
    });
});