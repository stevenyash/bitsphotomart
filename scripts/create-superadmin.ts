import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/lib/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 20
});

const prisma = new PrismaClient({ adapter });

async function createSuperAdmin() {
  const email = process.env.SUPERADMIN_EMAIL || 'superadmin@bitsphotomart.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin@123';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('SuperAdmin user already exists');
      
      // Update to SuperAdmin role if not already
      if (existingUser.role !== 'SUPERADMIN') {
        await prisma.user.update({
          where: { email },
          data: { role: 'SUPERADMIN' },
        });
        
        // Create admin profile if not exists
        await prisma.adminProfile.upsert({
          where: { userId: existingUser.id },
          create: {
            userId: existingUser.id,
            title: 'Super Administrator',
            department: 'Administration',
          },
          update: {},
        });
        
        console.log('Updated existing user to SuperAdmin');
      }
      
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create SuperAdmin user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPERADMIN',
        isVerified: true,
      },
    });

    // Create admin profile
    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        title: 'Super Administrator',
        department: 'Administration',
      },
    });

    console.log(`SuperAdmin created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`\nPlease change the password after first login!`);
    
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
