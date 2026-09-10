import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
  title: 'Explore Topics — WorldKnows',
  description:
    'Explore knowledge topics on WorldKnows and discover connected ideas, entities, relationships, and research.',
};

export default async function TopicsPage() {
  const topics = await prisma.topic.findMany({
    select: {
      slug: true,
      name: true,
      description: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 1000,
  });

  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <header className="border-b border-[#27272A]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <Link
            href="/"
            className="text-sm font-semibold text-[#FAFAFA] hover:text-indigo-400 transition-colors"
          >
            WorldKnows
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-3xl mb-12">
          <p className="text-xs uppercase tracking-widest text-indigo-400 font-medium mb-3">
            Knowledge Directory
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
            Explore Topics
          </h1>

          <p className="text-base sm:text-lg text-[#A1A1AA] leading-relaxed">
            Discover knowledge topics, connected entities, relationships, and
            research paths across WorldKnows.
          </p>
        </div>

        {topics.length === 0 ? (
          <div className="rounded-2xl border border-[#27272A] bg-[#111113] p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">
              No topics yet
            </h2>
            <p className="text-sm text-[#A1A1AA]">
              Knowledge topics will appear here as they are added to
              WorldKnows.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/topics/${topic.slug}`}
                className="group rounded-2xl border border-[#27272A] bg-[#111113] p-6 hover:border-indigo-500/50 hover:bg-[#141417] transition-all"
              >
                <h2 className="text-lg font-semibold text-[#FAFAFA] group-hover:text-indigo-300 transition-colors">
                  {topic.name}
                </h2>

                {topic.description && (
                  <p className="mt-3 text-sm text-[#A1A1AA] leading-relaxed line-clamp-3">
                    {topic.description}
                  </p>
                )}

                <span className="inline-block mt-5 text-xs font-medium text-indigo-400">
                  Explore topic →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}