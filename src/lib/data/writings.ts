import { getContentRepository } from '@/lib/content-repository';
import { WritingData } from './types';

function normalizeDate(date?: string, createdAt?: string): string {
  return date ?? createdAt?.slice(0, 10) ?? '1970-01-01';
}

export async function getAllWritings(): Promise<WritingData[]> {
  const repository = getContentRepository();

  try {
    const items = await repository.listByType('writing');

    return items.map((item) => ({
      slug: item.slug,
      title: item.title ?? item.slug,
      content: item.content,
      date: normalizeDate(item.date, item.createdAt),
    }));
  } catch (error) {
    console.error('Failed to fetch writings:', error);
    return [];
  }
}

export async function getWriting(slug: string): Promise<WritingData | undefined> {
  const repository = getContentRepository();

  try {
    const item = await repository.getBySlug('writing', slug);
    if (!item) {
      return undefined;
    }

    return {
      slug: item.slug,
      title: item.title ?? item.slug,
      content: item.content,
      date: normalizeDate(item.date, item.createdAt),
    };
  } catch (error) {
    console.error(`Failed to fetch writing ${slug}:`, error);
    return undefined;
  }
}
