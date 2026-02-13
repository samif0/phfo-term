import type { ContentType } from '@/lib/content-repository';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function parseString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  return value.trim();
}

function parseOptionalString(value: unknown): string | undefined {
  const parsed = parseString(value);
  if (parsed === undefined || parsed.length === 0) {
    return undefined;
  }
  return parsed;
}

function validateSlug(slug: string): ValidationResult<string> {
  if (!SLUG_REGEX.test(slug)) {
    return {
      ok: false,
      error: 'invalid slug: use lowercase letters, numbers, and dashes only',
    };
  }

  if (slug.length > 120) {
    return {
      ok: false,
      error: 'invalid slug: max length is 120 characters',
    };
  }

  return { ok: true, value: slug };
}

function validateDate(date: string): ValidationResult<string> {
  if (!DATE_REGEX.test(date)) {
    return { ok: false, error: 'invalid date: expected YYYY-MM-DD' };
  }

  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false, error: 'invalid date: expected calendar date' };
  }

  return { ok: true, value: date };
}

function validateOptionalUrl(url: string | undefined): ValidationResult<string | undefined> {
  if (!url) {
    return { ok: true, value: undefined };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { ok: false, error: 'invalid githubUrl: expected http or https URL' };
    }
    return { ok: true, value: url };
  } catch {
    return { ok: false, error: 'invalid githubUrl: malformed URL' };
  }
}

function validateContent(content: string): ValidationResult<string> {
  if (content.length === 0) {
    return { ok: false, error: 'content is required' };
  }

  return { ok: true, value: content };
}

export interface WritingPayload {
  slug: string;
  title: string;
  content: string;
  date: string;
}

export function validateWritingPayload(body: unknown): ValidationResult<WritingPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'invalid request body' };
  }

  const slug = parseString(body.slug);
  const title = parseString(body.title);
  const content = parseString(body.content);
  const date = parseOptionalString(body.date) ?? new Date().toISOString().slice(0, 10);

  if (!slug) return { ok: false, error: 'slug is required' };
  if (!title) return { ok: false, error: 'title is required' };
  if (!content) return { ok: false, error: 'content is required' };

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) return slugCheck;

  const contentCheck = validateContent(content);
  if (!contentCheck.ok) return contentCheck;

  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return dateCheck;

  return {
    ok: true,
    value: {
      slug,
      title,
      content,
      date,
    },
  };
}

export interface ThoughtPayload {
  slug: string;
  content: string;
  date: string;
}

export function validateThoughtPayload(body: unknown): ValidationResult<ThoughtPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'invalid request body' };
  }

  const slug = parseString(body.slug);
  const content = parseString(body.content);
  const date = parseOptionalString(body.date) ?? new Date().toISOString().slice(0, 10);

  if (!slug) return { ok: false, error: 'slug is required' };
  if (!content) return { ok: false, error: 'content is required' };

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) return slugCheck;

  const contentCheck = validateContent(content);
  if (!contentCheck.ok) return contentCheck;

  const dateCheck = validateDate(date);
  if (!dateCheck.ok) return dateCheck;

  return {
    ok: true,
    value: {
      slug,
      content,
      date,
    },
  };
}

export interface ProgramPayload {
  slug: string;
  content: string;
  videoName?: string;
  githubUrl?: string;
}

export function validateProgramPayload(body: unknown): ValidationResult<ProgramPayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'invalid request body' };
  }

  const slug = parseString(body.slug);
  const content = parseString(body.content);
  const videoName = parseOptionalString(body.videoName);
  const githubUrl = parseOptionalString(body.githubUrl);

  if (!slug) return { ok: false, error: 'slug is required' };
  if (!content) return { ok: false, error: 'content is required' };

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) return slugCheck;

  const contentCheck = validateContent(content);
  if (!contentCheck.ok) return contentCheck;

  const urlCheck = validateOptionalUrl(githubUrl);
  if (!urlCheck.ok) return urlCheck;

  return {
    ok: true,
    value: {
      slug,
      content,
      videoName,
      githubUrl: urlCheck.value,
    },
  };
}

export interface DeletePayload {
  slug: string;
}

export function validateDeletePayload(body: unknown): ValidationResult<DeletePayload> {
  if (!isRecord(body)) {
    return { ok: false, error: 'invalid request body' };
  }

  const slug = parseString(body.slug);
  if (!slug) {
    return { ok: false, error: 'slug is required' };
  }

  const slugCheck = validateSlug(slug);
  if (!slugCheck.ok) {
    return slugCheck;
  }

  return {
    ok: true,
    value: { slug },
  };
}

export function isKnownContentType(type: string): type is ContentType {
  return type === 'writing' || type === 'thought' || type === 'program';
}
