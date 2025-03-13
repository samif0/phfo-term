export interface ThoughtData {
  slug: string;
  content: string;
  date: string;
}


export interface WritingData {
  slug: string;
  title: string;
  content: string;
  date: string;
}

export interface ProgramData {
  slug: string;
  content: string;
  videoName?: string; //TODO: move resources from public assets to S3 in the future
}