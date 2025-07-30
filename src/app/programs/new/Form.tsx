'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/btn';

export default function NewProgramForm() {
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [videoName, setVideoName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, content, videoName, githubUrl }),
    });
    router.push('/programs');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug" className="border p-2 text-black" />
      <input value={videoName} onChange={e => setVideoName(e.target.value)} placeholder="video name" className="border p-2 text-black" />
      <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="github url" className="border p-2 text-black" />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="content" className="border p-2 text-black" rows={10} />
      <Button text="save" variant="outline" />
    </form>
  );
}
