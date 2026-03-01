import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";

// GET /api/service-options - Fetch service options by category or bpmServiceId
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const bpmServiceId = searchParams.get('bpmServiceId');
    const slug = searchParams.get('slug'); // BPM service slug

    // Build where clause
    const where: any = {
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    // Handle bpmServiceId - can be empty string to get job_types (null bpmServiceId)
    if (bpmServiceId !== null) {
      if (bpmServiceId === '' || bpmServiceId === 'null') {
        where.bpmServiceId = null;
      } else {
        where.bpmServiceId = bpmServiceId;
      }
    }

    // If slug is provided, get the BPM service first
    if (slug) {
      const bpmService = await prisma.bpmService.findUnique({
        where: { slug },
        select: { id: true }
      });
      
      if (bpmService) {
        where.bpmServiceId = bpmService.id;
      }
    }

    const options = await prisma.serviceOption.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' }
      ]
    });

    // Group by category if no specific category requested
    if (!category) {
      const grouped: Record<string, typeof options> = {};
      options.forEach(option => {
        if (!grouped[option.category]) {
          grouped[option.category] = [];
        }
        grouped[option.category].push(option);
      });
      return NextResponse.json(grouped);
    }

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error fetching service options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service options' },
      { status: 500 }
    );
  }
}
