import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find the old permission
    const oldPerm = await prisma.permission.findUnique({
        where: { permissionCode: 'SCREEN_CERTIFIED_CHECKS' }
    });

    if (!oldPerm) {
        console.log('Old permission SCREEN_CERTIFIED_CHECKS not found.');
        return;
    }

    // 2. Find new permissions
    const printPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_CERTIFIED_PRINT' } });
    const booksPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_CERTIFIED_BOOKS' } });
    const reportsPerm = await prisma.permission.findUnique({ where: { permissionCode: 'SCREEN_CERTIFIED_REPORTS' } });

    if (!printPerm || !booksPerm || !reportsPerm) {
        console.log('New permissions not fully found. Make sure to run sync-permissions first.');
        return;
    }

    // 3. Find users who have the old permission
    const userPerms = await prisma.userPermission.findMany({
        where: { permissionId: oldPerm.id }
    });

    console.log(`Found ${userPerms.length} users with old permission.`);

    for (const up of userPerms) {
        console.log(`Upgrading user ID: ${up.userId}`);

        // Assign new permissions if not already assigned
        const newCodes = [printPerm.id, booksPerm.id, reportsPerm.id];
        for (const pid of newCodes) {
            await prisma.userPermission.upsert({
                where: { userId_permissionId: { userId: up.userId, permissionId: pid } },
                update: {},
                create: { userId: up.userId, permissionId: pid }
            });
        }
    }

    console.log('✅ Upgrade completed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
