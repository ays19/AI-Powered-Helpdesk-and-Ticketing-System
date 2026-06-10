import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import { UserRole } from "./types";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        disableSignUp: true,
    },
    trustedOrigins: [
        process.env.CLIENT_URL || process.env.TRUSTED_ORIGINS || "http://localhost:5173"
    ],
    plugins: [
        admin({
            defaultRole: UserRole.AGENT,
        }),
    ],
});