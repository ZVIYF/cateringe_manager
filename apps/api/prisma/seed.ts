import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Passw0rd!', 10);

  const users = [
    { email: 'admin@dev.local', role: Role.ADMIN, name: 'Admin User' },
    { email: 'office@dev.local', role: Role.OFFICE, name: 'Office User' },
    { email: 'chef@dev.local', role: Role.KITCHEN_MANAGER, name: 'Chef User' },
    { email: 'cook@dev.local', role: Role.KITCHEN_STAFF, name: 'Cook User' },
    { email: 'driver@dev.local', role: Role.DRIVER, name: 'Driver User' },
  ];

  console.log('Seeding users...');
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, role: u.role, name: u.name, active: true },
      create: { email: u.email, passwordHash, role: u.role, name: u.name, active: true },
    });
    console.log(`Upserted user: ${u.email}`);
  }
  console.log('Done!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

