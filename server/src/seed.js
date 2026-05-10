require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  const hash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { id: uuidv4(), name: 'Alice Johnson', email: 'alice@example.com', passwordHash: hash, phone: '555-0101', bio: 'I have a spacious garage I rent out on weekends.' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: { id: uuidv4(), name: 'Bob Smith', email: 'bob@example.com', passwordHash: hash, phone: '555-0102', bio: 'Downtown property owner with multiple parking spots.' },
  });

  const spaces = [
    { id: uuidv4(), ownerId: alice.id, title: 'Secure Garage – Downtown', description: 'Climate-controlled single-car garage in the heart of downtown. Electric charger available.', address: '123 Main St', city: 'Austin', state: 'TX', zipCode: '78701', type: 'garage', pricePerHour: 5, pricePerDay: 30, amenities: JSON.stringify(['EV Charger', 'Security Camera', 'Covered']), images: JSON.stringify([]) },
    { id: uuidv4(), ownerId: alice.id, title: 'Shaded Driveway Near Stadium', description: 'Two-car driveway, perfect for event parking. Walking distance to the stadium.', address: '456 Oak Ave', city: 'Austin', state: 'TX', zipCode: '78702', type: 'driveway', pricePerHour: 8, pricePerDay: 45, amenities: JSON.stringify(['Shaded', 'Wide Access']), images: JSON.stringify([]) },
    { id: uuidv4(), ownerId: bob.id, title: 'Private Carport – Midtown', description: 'Covered carport with 24/7 access. Perfect for monthly commuters.', address: '789 Elm St', city: 'Austin', state: 'TX', zipCode: '78703', type: 'carport', pricePerHour: 4, pricePerDay: 22, amenities: JSON.stringify(['Covered', '24/7 Access', 'Well Lit']), images: JSON.stringify([]) },
    { id: uuidv4(), ownerId: bob.id, title: 'Open Parking Lot – Tech District', description: 'Large open lot with 5 available spaces. Easy in/out.', address: '321 Tech Blvd', city: 'Austin', state: 'TX', zipCode: '78704', type: 'parking_lot', pricePerHour: 3, pricePerDay: 18, amenities: JSON.stringify(['Open 24/7', 'Multiple Spots']), images: JSON.stringify([]) },
    { id: uuidv4(), ownerId: alice.id, title: 'Garage – Quiet Neighborhood', description: 'Spacious one-car garage in a quiet residential area. Great for overnight parking.', address: '55 Maple Ln', city: 'Houston', state: 'TX', zipCode: '77002', type: 'garage', pricePerHour: 3.5, pricePerDay: 20, amenities: JSON.stringify(['Covered', 'Quiet Area']), images: JSON.stringify([]) },
  ];

  for (const s of spaces) {
    await prisma.space.upsert({ where: { id: s.id }, update: {}, create: s });
  }

  console.log(`Seeded ${spaces.length} spaces and 2 users.`);
  console.log('Login: alice@example.com / password123  or  bob@example.com / password123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
