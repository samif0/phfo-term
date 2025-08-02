'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/btn';

type Props = {
  initialData: {
    slug: string;
    content: string;
    date: string;
  };
};

export default function EditThoughtForm({ initialData }: Props) {
  const [content, setContent] = useState(initialData.content);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/thoughts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: initialData.slug, content, date: initialData.date }),
    });
    router.push(`/thoughts/${initialData.slug}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-4">
      <input value={initialData.slug} disabled className="border p-2 text-black" />
      <textarea value={content} onChange={e => setContent(e.target.value)} className="border p-2 text-black" rows={10} />
      <Button text="save" variant="outline" />
    </form>
  );
}

