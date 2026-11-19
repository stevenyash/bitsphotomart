import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Query all roles
    const roles = await prisma.adminRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return NextResponse.json({
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        isSuperRole: r.isSuperRole,
        permissionCount: r.permissions.length,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
