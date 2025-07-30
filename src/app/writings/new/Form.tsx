'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/btn';

export default function NewWritingForm() {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/writings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title, content }),
    });
    router.push('/writings');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug" className="border p-2 text-black" />
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="title" className="border p-2 text-black" />
      <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="content" className="border p-2 text-black" rows={10} />
      <Button text="save" variant="outline" />
    </form>
  );
}
