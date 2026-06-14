import { db } from "./src/db";

async function checkRoles() {
    const users = await db.user.findMany({
        select: {
            email: true,
            role: true,
        }
    });
    console.log("Users and their roles:");
    console.table(users);
}

checkRoles().catch(console.error);
