import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  __prismaClient: PrismaClient | undefined;
};

// Use getLogger to avoid Edge Runtime issues
import { getLogger } from "./logger";
const logger = getLogger();

logger.info('Prisma client initializing', {
  nodeEnv: process.env.NODE_ENV,
  dbHost: process.env.DATABASE_HOST || 'not set',
  dbUser: process.env.DATABASE_USER ? 'set' : 'not set',
  dbName: process.env.DATABASE_NAME || 'not set',
  dbPort: process.env.DATABASE_PORT || '3306',
});

const connectionLimit = process.env.NODE_ENV === 'production' 
  ? parseInt(process.env.DB_POOL_SIZE || '5', 10)
  : 10;

logger.info('Creating Prisma MariaDB adapter', { connectionLimit });

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'bitsphotomart',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit,
  connectTimeout: 10000,
});

logger.info('Prisma adapter created successfully');

const prismaClient = globalForPrisma.__prismaClient ?? new PrismaClient({
  adapter,
});

logger.info('Prisma client instance created', { 
  isNew: !globalForPrisma.__prismaClient,
  isProduction: process.env.NODE_ENV === 'production' 
});

globalForPrisma.__prismaClient = prismaClient;

const shutdown = async () => {
  logger.info('Shutting down Prisma client...');
  try {
    await prismaClient.$disconnect();
    globalForPrisma.__prismaClient = undefined;
    logger.info('Prisma client disconnected successfully');
  } catch (error) {
    logger.error('Error during Prisma shutdown', { error: error as Error });
  }
};

declare const EdgeRuntime: string | undefined;

if (typeof EdgeRuntime === 'undefined') {
  process.on('beforeExit', shutdown);
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export { logger };
export const prisma = prismaClient;
export default prismaClient;
