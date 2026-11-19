import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Debug endpoint to test database connection
 */
export async function GET() {
  try {
    // Test the connection
    const startTime = Date.now();
    
    // Try a simple query
    await prisma.$queryRaw`SELECT 1 as test`;
    
    const connectionTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      connectionTime: `${connectionTime}ms`,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.DEBUG === 'true' ? (error as Error).stack : undefined,
    }, { status: 500 });
  }
}
