import { getContentRepository } from '@/lib/content-repository';
import { ProgramData } from './types';

export async function getAllPrograms(): Promise<ProgramData[]> {
  const repository = getContentRepository();

  try {
    const items = await repository.listByType('program');

    return items.map((item) => ({
      slug: item.slug,
      content: item.content,
      videoName: item.videoName,
      githubUrl: item.githubUrl,
    }));
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    return [];
  }
}

export async function getProgram(slug: string): Promise<ProgramData | undefined> {
  const repository = getContentRepository();

  try {
    const item = await repository.getBySlug('program', slug);
    if (!item) {
      return undefined;
    }

    return {
      slug: item.slug,
      content: item.content,
      videoName: item.videoName,
      githubUrl: item.githubUrl,
    };
  } catch (error) {
    console.error(`Failed to fetch program ${slug}:`, error);
    return undefined;
  }
}
