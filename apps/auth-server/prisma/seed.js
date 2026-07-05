import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DAuth PostgreSQL database...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@dauth.io';
  const plainPassword = 'Password123';
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: 'Admin Developer',
    },
  });
  console.log(`- Admin User seeded: ${admin.email}`);

  // 2. Create Default OAuth Client Profile
  const clientName = 'Sample OIDC Client';
  const clientId = 'dauth_cli_sample_client';
  const rawSecret = 'dauth_sec_89dfj19h0fas89d12fjlkjas';
  const secretHash = await bcrypt.hash(rawSecret, saltRounds);

  const client = await prisma.oAuthClient.upsert({
    where: { id: clientId },
    update: {
      redirectUris: ['http://localhost:5174/callback', 'http://localhost:5173/playground'],
      allowedScopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    create: {
      id: clientId,
      name: clientName,
      clientSecret: secretHash,
      redirectUris: ['http://localhost:5174/callback', 'http://localhost:5173/playground'],
      allowedScopes: ['openid', 'profile', 'email', 'offline_access'],
    },
  });
  console.log(`- OAuth Client seeded: ${client.name} (ID: ${client.id})`);

  console.log('Database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during database seed execution:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
