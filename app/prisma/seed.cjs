const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // Registers
  const register1 = await prisma.register.upsert({
    where: { id: 1 },
    update: { name: 'Kassa 1', active: true },
    create: { name: 'Kassa 1' }
  });

  await prisma.register.upsert({
    where: { id: 2 },
    update: { name: 'Kassa 2', active: true },
    create: { name: 'Kassa 2' }
  });

  // Users
  const adminUsername = 'admin';
  const cashierUsername = 'kassa';

  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('kassa123', 10);

  await prisma.user.upsert({
    where: { username: adminUsername },
    update: { passwordHash: adminHash, role: 'ADMIN', active: true },
    create: { username: adminUsername, passwordHash: adminHash, role: 'ADMIN' }
  });

  await prisma.user.upsert({
    where: { username: cashierUsername },
    update: { passwordHash: cashierHash, role: 'CASHIER', active: true },
    create: { username: cashierUsername, passwordHash: cashierHash, role: 'CASHIER' }
  });

  // Products
  const products = [
    { name: 'Cola', priceCents: 150, barcode: '100000000001', imageUrl: '/images/cola.svg', sortOrder: 10 },
    { name: 'Fanta', priceCents: 150, barcode: '100000000002', imageUrl: '/images/fanta.svg', sortOrder: 20 },
    { name: 'Water', priceCents: 100, barcode: '100000000003', imageUrl: '/images/water.svg', sortOrder: 30 },
    { name: 'Koffie', priceCents: 120, barcode: '100000000004', imageUrl: '/images/coffee.svg', sortOrder: 40 },
    { name: 'Chips groot', priceCents: 200, barcode: '100000000005', imageUrl: '/images/chips.svg', sortOrder: 50 },
    { name: 'Borrelnoot', priceCents: 200, barcode: '100000000006', imageUrl: '/images/nuts.svg', sortOrder: 60 }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: { name: p.name, priceCents: p.priceCents, imageUrl: p.imageUrl, active: true, sortOrder: p.sortOrder },
      create: p
    });
  }

  // Demo account for barcode flow (optioneel)
  await prisma.account.upsert({
    where: { barcode: '900000000001' },
    update: { name: 'Test Account', active: true, balanceCents: 0 },
    create: { barcode: '900000000001', name: 'Test Account', balanceCents: 0 }
  });

  console.log('Seed klaar.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
