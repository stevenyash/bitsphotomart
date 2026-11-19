import { NextResponse } from "next/server";
import { getLogger } from "@/lib/logger";
import { auth } from "@/lib/auth";

/**
 * Debug endpoint to view application logs
 * Only accessible in development or by admin users in production
 */
export async function GET() {
  const session = await auth();
  
  // Only allow in development or admin users
  const isDev = process.env.NODE_ENV !== 'production';
  const isAdmin = session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN';
  
  if (!isDev && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const logger = getLogger();
  const logs = logger.getAllLogs();
  
  return NextResponse.json({
    success: true,
    count: logs.length,
    logs,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      dbPoolSize: process.env.DB_POOL_SIZE || '20',
      debug: process.env.DEBUG || 'false',
    },
  });
}

/**
 * Clear logs endpoint
 */
export async function DELETE() {
  const session = await auth();
  
  // Only allow in development or admin users
  const isDev = process.env.NODE_ENV !== 'production';
  const isAdmin = session?.user?.role === 'SUPERADMIN' || session?.user?.role === 'ADMIN';
  
  if (!isDev && !isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const logger = getLogger();
  logger.clear();
  
  return NextResponse.json({
    success: true,
    message: "Logs cleared"
  });
}
