'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/btn';

type Props = {
  initialData: {
    slug: string;
    content: string;
    videoName?: string;
    githubUrl?: string;
  };
};

export default function EditProgramForm({ initialData }: Props) {
  const [content, setContent] = useState(initialData.content);
  const [videoName, setVideoName] = useState(initialData.videoName || '');
  const [githubUrl, setGithubUrl] = useState(initialData.githubUrl || '');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/programs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: initialData.slug, content, videoName, githubUrl }),
    });
    router.push(`/programs/${initialData.slug}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      <input value={initialData.slug} disabled className="border p-2 text-black" />
      <textarea value={content} onChange={e => setContent(e.target.value)} className="border p-2 text-black" rows={5} />
      <input value={videoName} onChange={e => setVideoName(e.target.value)} placeholder="video name" className="border p-2 text-black" />
      <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="github url" className="border p-2 text-black" />
      <Button text="save" variant="outline" />
    </form>
  );
}

