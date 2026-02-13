import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/supabase-types';

export type ContentType = 'writing' | 'thought' | 'program';

export interface ContentItem {
  contentType: ContentType;
  slug: string;
  title?: string;
  content: string;
  date?: string;
  videoName?: string;
  githubUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

type DbContentItem = Database['public']['Tables']['content_items']['Row'];

export interface ContentRepository {
  listByType(type: ContentType): Promise<ContentItem[]>;
  getBySlug(type: ContentType, slug: string): Promise<ContentItem | undefined>;
  upsert(item: ContentItem): Promise<void>;
  delete(type: ContentType, slug: string): Promise<void>;
}

function mapDbRow(row: DbContentItem): ContentItem {
  return {
    contentType: row.content_type,
    slug: row.slug,
    title: row.title ?? undefined,
    content: row.content,
    date: row.date ?? undefined,
    videoName: row.video_name ?? undefined,
    githubUrl: row.github_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseContentRepository implements ContentRepository {
  async listByType(type: ContentType): Promise<ContentItem[]> {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', type)
      .order('date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list ${type} entries: ${error.message}`);
    }

    const rows = (data ?? []) as DbContentItem[];
    return rows.map(mapDbRow);
  }

  async getBySlug(type: ContentType, slug: string): Promise<ContentItem | undefined> {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from('content_items')
      .select('*')
      .eq('content_type', type)
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch ${type}:${slug}: ${error.message}`);
    }

    if (!data) {
      return undefined;
    }

    return mapDbRow(data as DbContentItem);
  }

  async upsert(item: ContentItem): Promise<void> {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from('content_items').upsert(
      {
        content_type: item.contentType,
        slug: item.slug,
        title: item.title ?? null,
        content: item.content,
        date: item.date ?? null,
        video_name: item.videoName ?? null,
        github_url: item.githubUrl ?? null,
      },
      {
        onConflict: 'content_type,slug',
      }
    );

    if (error) {
      throw new Error(`Failed to upsert ${item.contentType}:${item.slug}: ${error.message}`);
    }
  }

  async delete(type: ContentType, slug: string): Promise<void> {
    const supabase = getSupabaseServerClient();

    const { error } = await supabase.from('content_items').delete().eq('content_type', type).eq('slug', slug);

    if (error) {
      throw new Error(`Failed to delete ${type}:${slug}: ${error.message}`);
    }
  }
}

let repository: ContentRepository | null = null;

export function getContentRepository(): ContentRepository {
  if (repository) {
    return repository;
  }

  repository = new SupabaseContentRepository();
  return repository;
}
