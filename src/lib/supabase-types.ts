export interface Database {
  public: {
    Tables: {
      content_items: {
        Row: {
          id: string;
          content_type: 'writing' | 'thought' | 'program';
          slug: string;
          title: string | null;
          content: string;
          date: string | null;
          video_name: string | null;
          github_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_type: 'writing' | 'thought' | 'program';
          slug: string;
          title?: string | null;
          content: string;
          date?: string | null;
          video_name?: string | null;
          github_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content_type?: 'writing' | 'thought' | 'program';
          slug?: string;
          title?: string | null;
          content?: string;
          date?: string | null;
          video_name?: string | null;
          github_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
