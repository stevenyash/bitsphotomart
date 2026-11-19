import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Debug endpoint to list all tables in the database
 */
export async function GET() {
  try {
    // Try to get all tables using MySQL SHOW TABLES
    const tables = await prisma.$queryRaw`
      SHOW TABLES
    `;
    
    return NextResponse.json({
      success: true,
      tables,
      database: process.env.DATABASE_NAME,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      database: process.env.DATABASE_NAME,
    }, { status: 500 });
  }
}
