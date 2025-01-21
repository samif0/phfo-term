export interface WritingData{
  slug: string;
  title: string;
  content: string;
  date: string;
}

export const writings: WritingData[] = [
  {
    slug: 'damning-lucidity',
    title: 'damning lucidity',
    content: "My incessant indolence and abulic nature of mind and body hide behind a facade of unwavering diffidence. How can a mind so feeble, unable, yet rather active thrive or dare to change? Am I to move forward willingly, cognizant of my inherent flaws, yet without the will-power to amend them? Alas, I've arrived; the circular trails of thought have brought me a newfound clarity discovered minutes prior, and before then, years prior. I fear my mind merely serves as an anchor to transformation, lifting briefly only to give me the illusion of growth. And so I stand, Sisyphean, it seems, against steep aspirations and with heavy feet. Perennially bound to the mockery of the provocative peaks.",
    date: '2024-09-05'
  }
  // Add more writings here
];

export function getWriting(slug: string): WritingData | undefined {
  return writings.find(writing => writing.slug === slug);
}

export function getAllWritings(): WritingData[] {
  return writings;
}