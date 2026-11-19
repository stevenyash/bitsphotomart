import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { theme } from "@/lib/admin-theme";

// Force dynamic rendering - don't try to pre-render at build time
// This prevents database connection pool exhaustion during build
export const dynamic = 'force-dynamic';

export default async function PhotographersPage() {
  const photographers = await prisma.photographer.findMany({
    where: { status: 'APPROVED' },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Our Photographers</h1>
        
        {photographers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No photographers found yet.</p>
            <Link 
              href="/register" 
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Join as a Photographer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {photographers.map((photographer) => (
              <div 
                key={photographer.id} 
                className="bg-[var(--card)] rounded-lg shadow-md p-6"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {photographer.user.name || 'Unnamed Photographer'}
                </h2>
                {photographer.bio && (
                  <p className="text-gray-600 mb-4">{photographer.bio}</p>
                )}
                {photographer.location && (
                  <p className="text-gray-500 text-sm mb-2">{photographer.location}</p>
                )}
                {photographer.skills && (
                  <div className="flex flex-wrap gap-2">
                    {photographer.skills.split(',').map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
