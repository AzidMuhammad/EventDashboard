import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from '@/models/User'; // Sesuaikan alias ini kalau belum diatur di tsconfig

dotenv.config();

// Ganti ini jika ingin hardcoded:
// const MONGO_URI = 'mongodb+srv://user:123@cluster0.rdvqidt.mongodb.net/17Agustus?...'
const MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  throw new Error('❌ MONGO_URI is not defined in .env file');
}

const seed = async () => {
  try {
    // Connect ke DB spesifik: 17Agustus
    await mongoose.connect(MONGO_URI, {
      dbName: '17Agustus',
    });
    console.log('✅ Connected to MongoDB (17Agustus)');

    // Kosongkan koleksi users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Buat password terenkripsi
    const adminPassword = await bcrypt.hash('admin123', 12);
    const guestPassword = await bcrypt.hash('guest123', 12);

    // Insert data user
    await User.insertMany([
      {
        email: 'admin@lomba17.com',
        name: 'Administrator',
        password: adminPassword,
        role: 'admin',
      },
      {
        email: 'guest@lomba17.com',
        name: 'Guest User',
        password: guestPassword,
        role: 'guest',
      },
    ]);

    console.log('🌱 Seed data inserted successfully');
    await mongoose.disconnect(); // Opsional tapi rapi
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
};

seed();
