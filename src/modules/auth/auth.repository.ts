import prisma from "../../config/database.js";

export async function findUserByUsername(username: string) {
    return prisma.user.findUnique({
        where: { username },
    });
}

export async function findUserById(id: string) {
    return prisma.user.findUnique({
        where: { id },
    });
}

export async function createUser(
    username: string,
    passwordHash: string,
) {
    return prisma.user.create({
        data: {
            username,
            passwordHash,
        },
    });
}