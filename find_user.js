const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== ADMINS & USERS ===");
    const admins = await prisma.member.findMany({
        where: {
            OR: [
                { isAdmin: true },
                { isSuperAdmin: true }
            ]
        }
    });

    console.log(`Found ${admins.length} admin members:`);
    for (const a of admins) {
        console.log(`- ID: ${a.id}, Name: ${a.fullName}, Email: ${a.email}, SuperAdmin: ${a.isSuperAdmin}, Admin: ${a.isAdmin}, Role: ${a.role}`);
    }

    console.log("\n=== ALL MEMBERS SUMMARY ===");
    const allMembers = await prisma.member.findMany();
    console.log(`Total members: ${allMembers.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
