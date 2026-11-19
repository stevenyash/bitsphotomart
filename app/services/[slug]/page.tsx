import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { theme } from "@/lib/admin-theme";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  
  const service = await prisma.bpmService.findUnique({
    where: { slug },
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/services" 
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← Back to Services
        </Link>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-4">{service.name}</h1>
          
          {service.description && (
            <p className="text-gray-600 mb-6">{service.description}</p>
          )}
          
          {service.cta && (
            <Link 
              href={service.link || '#'}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              {service.cta}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
