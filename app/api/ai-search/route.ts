import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS, getClientIp } from '@/lib/rate-limit';

// AI-powered search endpoint
// Provides enhanced search with smart suggestions and natural language processing

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`search:${clientIp}`, RATE_LIMITS.SEARCH);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later." },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'photos'; // photos, videos, all
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        results: [], 
        suggestions: [],
        message: 'Query too short' 
      });
    }

    const lowerQuery = query.toLowerCase();
    const results: Record<string, unknown> = {};

    // Search photos
    if (type === 'photos' || type === 'all') {
      const photos = await prisma.photo.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: lowerQuery } },
            { category: { contains: lowerQuery } },
          ],
        },
        include: {
          photographer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      results.photos = photos;
    }

    // Search videos
    if (type === 'videos' || type === 'all') {
      const videos = await prisma.video.findMany({
        where: {
          status: 'APPROVED',
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: lowerQuery } },
            { category: { contains: lowerQuery } },
          ],
        },
        include: {
          photographer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });
      results.videos = videos;
    }

    // Generate AI-powered suggestions based on search patterns
    const suggestions: string[] = [];
    
    // Category-based suggestions
    const categories = ['landscape', 'portrait', 'wildlife', 'urban', 'events', 'product', 'nature', 'architecture'];
    categories.forEach(cat => {
      if (cat.includes(lowerQuery)) {
        suggestions.push(cat);
      }
    });

    // Tag-based suggestions  
    const tags = ['sunset', 'mountain', 'ocean', 'city', 'street', 'wedding', 'abstract', 'minimalist', 'vintage', 'modern'];
    tags.forEach(tag => {
      if (tag.includes(lowerQuery)) {
        suggestions.push(tag);
      }
    });

    // Smart suggestions based on query patterns
    if (/\d+\s*(\$|dollar|usd)/i.test(query)) {
      suggestions.push(`Budget-friendly ${lowerQuery.replace(/\d+\s*(\$|dollar|usd)/i, '').trim()}`);
    }
    
    if (/(red|blue|green|yellow|orange|purple|black|white)/i.test(query)) {
      suggestions.push(`${lowerQuery} - popular colors`);
    }

    if (suggestions.length === 0) {
      // Default suggestions
      suggestions.push(
        `Best ${lowerQuery} photos`,
        `Premium ${lowerQuery} collection`,
        `Trending ${lowerQuery} images`
      );
    }

    results.suggestions = suggestions.slice(0, 5);

    return NextResponse.json({
      success: true,
      query,
      count: ((results.photos as unknown[])?.length || 0) + ((results.videos as unknown[])?.length || 0),
      ...results,
    });

  } catch (error) {
    console.error('AI Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}

// POST endpoint for more complex AI search queries
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`search:${clientIp}`, RATE_LIMITS.SEARCH);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many search requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { 
      query, 
      filters = {}, 
      type = 'photos',
      limit = 20,
      aiEnhanced = true 
    } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const lowerQuery = query.toLowerCase();
    const where: Record<string, unknown> = {
      status: 'APPROVED',
    };

    // Build search conditions
    const searchConditions = [
      { title: { contains: query } },
      { description: { contains: query } },
      { tags: { contains: lowerQuery } },
    ];

    // AI-enhanced search with additional patterns
    if (aiEnhanced) {
      // Extract price range if present
      const priceMatch = query.match(/\$?(\d+)\s*-\s*\$?(\d+)/i);
      if (priceMatch) {
        where.price = {
          gte: parseFloat(priceMatch[1]),
          lte: parseFloat(priceMatch[2]),
        };
      }

      // Extract category if present
      const categories = ['landscape', 'portrait', 'wildlife', 'urban', 'events', 'product', 'nature', 'architecture', 'food', 'travel'];
      categories.forEach(cat => {
        if (lowerQuery.includes(cat)) {
          where.category = cat;
        }
      });
    }

    // Apply filters
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.photographerId) {
      where.photographerId = filters.photographerId;
    }
    if (filters.minPrice || filters.maxPrice) {
      where.price = {
        ...(filters.minPrice && { gte: filters.minPrice }),
        ...(filters.maxPrice && { lte: filters.maxPrice }),
      };
    }

    where.OR = searchConditions;

    let results;

    if (type === 'photos') {
      results = await prisma.photo.findMany({
        where,
        include: {
          photographer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } else if (type === 'videos') {
      results = await prisma.video.findMany({
        where,
        include: {
          photographer: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Search both
      const [photos, videos] = await Promise.all([
        prisma.photo.findMany({
          where: { ...where, status: 'APPROVED' },
          include: {
            photographer: {
              select: { id: true, user: { select: { name: true } } },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.video.findMany({
          where: { ...where, status: 'APPROVED' },
          include: {
            photographer: {
              select: { id: true, user: { select: { name: true } } },
            },
          },
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      results = { photos, videos };
    }

    return NextResponse.json({
      success: true,
      query,
      aiEnhanced,
      filters,
      count: Array.isArray(results) ? results.length : ((results as { photos?: unknown[] }).photos?.length || 0) + ((results as { videos?: unknown[] }).videos?.length || 0),
      results,
    });

  } catch (error) {
    console.error('AI Search POST error:', error);
    return NextResponse.json(
      { error: 'Search failed', message: 'An error occurred while searching' },
      { status: 500 }
    );
  }
}
