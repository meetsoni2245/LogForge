import "dotenv/config";
import { env } from "./env.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
});

const prisma = new PrismaClient({
    adapter,
});

export default prisma;