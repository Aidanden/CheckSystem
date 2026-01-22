import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const permissions = await prisma.permission.findMany();
    console.log('Current Permissions:', JSON.stringify(permissions, null, 2));

    const users = await prisma.user.findMany({
        include: {
            permissions: {
                include: {
                    permission: true
                }
            }
        }
    });

    users.forEach(user => {
        console.log(`User: ${user.username} (Admin: ${user.isAdmin})`);
        console.log('Permissions:', user.permissions.map(p => p.permission.permissionCode).join(', '));
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
