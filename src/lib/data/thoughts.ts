import { getContentRepository } from '@/lib/content-repository';
import { ThoughtData } from './types';

function normalizeDate(date?: string, createdAt?: string): string {
  return date ?? createdAt?.slice(0, 10) ?? '1970-01-01';
}

export async function getAllThoughts(): Promise<ThoughtData[]> {
  const repository = getContentRepository();

  try {
    const items = await repository.listByType('thought');

    return items.map((item) => ({
      slug: item.slug,
      content: item.content,
      date: normalizeDate(item.date, item.createdAt),
    }));
  } catch (error) {
    console.error('Failed to fetch thoughts:', error);
    return [];
  }
}

export async function getThought(slug: string): Promise<ThoughtData | undefined> {
  const repository = getContentRepository();

  try {
    const item = await repository.getBySlug('thought', slug);
    if (!item) {
      return undefined;
    }

    return {
      slug: item.slug,
      content: item.content,
      date: normalizeDate(item.date, item.createdAt),
    };
  } catch (error) {
    console.error(`Failed to fetch thought ${slug}:`, error);
    return undefined;
  }
}
