import "dotenv/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import {
    authenticateUser,
    registerUser,
} from "../src/modules/auth/auth.service.js";
import * as authRepository from "../src/modules/auth/auth.repository.js";

vi.mock("../src/modules/auth/auth.repository.js", () => ({
    createUser: vi.fn(),
    findUserByUsername: vi.fn(),
}));

vi.mock("bcrypt", () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

describe("auth service", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("registerUser", () => {
        it("creates a user with a hashed password", async () => {
            vi.mocked(authRepository.findUserByUsername).mockResolvedValue(null);
            vi.mocked(bcrypt.hash).mockResolvedValue("hashed-password" as never);
            vi.mocked(authRepository.createUser).mockResolvedValue({
                id: "user-1",
                username: "testuser",
                passwordHash: "hashed-password",
                createdAt: new Date(),
            });

            const result = await registerUser({
                username: "testuser",
                password: "password123",
            });

            expect(bcrypt.hash).toHaveBeenCalledWith("password123", 12);
            expect(authRepository.createUser).toHaveBeenCalledWith(
                "testuser",
                "hashed-password",
            );
            expect(result.passwordHash).toBe("hashed-password");
        });

        it("rejects an existing username", async () => {
            vi.mocked(authRepository.findUserByUsername).mockResolvedValue({
                id: "user-1",
                username: "testuser",
                passwordHash: "existing-hash",
                createdAt: new Date(),
            });

            await expect(
                registerUser({
                    username: "testuser",
                    password: "password123",
                }),
            ).rejects.toThrow("Username already exists");

            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(authRepository.createUser).not.toHaveBeenCalled();
        });
    });

    describe("authenticateUser", () => {
        it("returns the user when the password is correct", async () => {
            const user = {
                id: "user-1",
                username: "testuser",
                passwordHash: "hashed-password",
                createdAt: new Date(),
            };

            vi.mocked(authRepository.findUserByUsername).mockResolvedValue(user);
            vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

            const result = await authenticateUser({
                username: "testuser",
                password: "password123",
            });

            expect(bcrypt.compare).toHaveBeenCalledWith(
                "password123",
                "hashed-password",
            );
            expect(result.user).toEqual(user);
            expect(result.token).toEqual(expect.any(String));
        });

        it("rejects an unknown username", async () => {
            vi.mocked(authRepository.findUserByUsername).mockResolvedValue(null);

            await expect(
                authenticateUser({
                    username: "unknown",
                    password: "password123",
                }),
            ).rejects.toThrow("Invalid username or password");

            expect(bcrypt.compare).not.toHaveBeenCalled();
        });

        it("rejects an incorrect password", async () => {
            vi.mocked(authRepository.findUserByUsername).mockResolvedValue({
                id: "user-1",
                username: "testuser",
                passwordHash: "hashed-password",
                createdAt: new Date(),
            });
            vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

            await expect(
                authenticateUser({
                    username: "testuser",
                    password: "wrong-password",
                }),
            ).rejects.toThrow("Invalid username or password");
        });
    });
});