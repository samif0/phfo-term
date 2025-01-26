export interface ThoughtData {
  slug: string;
  content: string;
  date: string;
}

export const thoughts: ThoughtData[] = [
  {
    slug: '2025-01-25',
    date: '2025-01-25',
    content: 'i want to be nameless'
  }
];

export function getThought(slug: string): ThoughtData | undefined {
  return thoughts.find(thought => thought.slug === slug);
}

export function getAllThoughts(): ThoughtData[] {
  return thoughts;
}