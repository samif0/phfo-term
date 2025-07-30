'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/btn';

export default function NewThoughtForm() {
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/thoughts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, content }),
    });
    router.push('/thoughts');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug" className="border p-2 text-black" />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="content" className="border p-2 text-black" rows={10} />
      <Button text="save" variant="outline" />
    </form>
  );
}
