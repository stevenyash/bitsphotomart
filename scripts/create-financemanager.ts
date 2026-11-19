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

async function createFinanceManager() {
  const email = process.env.FINANCE_EMAIL || 'finance@bitsphotomart.com';
  const password = process.env.FINANCE_PASSWORD || 'Finance@123';
  const name = process.env.FINANCE_NAME || 'Finance Manager';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Finance Manager user already exists');
      
      // Update to Finance Manager role if not already
      if (existingUser.role !== 'FINANCE_MANAGER') {
        await prisma.user.update({
          where: { email },
          data: { role: 'FINANCE_MANAGER' },
        });
        
        // Create admin profile if not exists
        await prisma.adminProfile.upsert({
          where: { userId: existingUser.id },
          create: {
            userId: existingUser.id,
            title: 'Finance Manager',
            department: 'Finance',
          },
          update: {},
        });
        
        console.log('Updated existing user to Finance Manager');
      }
      
      return;
    }

    // Get Finance Manager role
    const financeRole = await prisma.adminRole.findUnique({
      where: { name: 'FinanceManager' },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create Finance Manager user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'FINANCE_MANAGER',
        isVerified: true,
      },
    });

    // Create admin profile
    await prisma.adminProfile.create({
      data: {
        userId: user.id,
        adminRoleId: financeRole?.id,
        title: 'Finance Manager',
        department: 'Finance',
      },
    });

    console.log(`Finance Manager created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (error) {
    console.error('Error creating Finance Manager:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFinanceManager();
