import bcrypt from "bcrypt";
import { createAuthToken } from "./auth.token.js";
import {
    createUser,
    findUserByUsername,
} from "./auth.repository.js";
import type { LoginInput, RegisterInput } from "./auth.validation.js";
import AppError from "../../errors/app.error.js";

const SALT_ROUNDS = 12;

export async function registerUser(input: RegisterInput) {
    const existingUser = await findUserByUsername(input.username);

    if (existingUser) {
        throw new AppError(
            409,
            "Username already exists",
            undefined,
            "USERNAME_EXISTS",
        );
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    return createUser(input.username, passwordHash);
}

export async function authenticateUser(input: LoginInput) {
    const user = await findUserByUsername(input.username);

    if (!user) {
        throw new AppError(
            401,
            "Invalid username or password",
            undefined,
            "INVALID_CREDENTIALS",
        );
    }

    const passwordMatches = await bcrypt.compare(
        input.password,
        user.passwordHash,
    );

    if (!passwordMatches) {
        throw new AppError(
            401,
            "Invalid username or password",
            undefined,
            "INVALID_CREDENTIALS",
        );
    }

    const token = createAuthToken({ userId: user.id, username: user.username });

    return {
        user,
        token,
    };
}