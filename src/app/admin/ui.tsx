'use client';
import { useState } from 'react';
import Button from '@/components/btn';

// Simple client-side forms for posting new thoughts and writings. The fetch
// requests hit our protected API routes which in turn validate the NextAuth
// session.

export default function AdminForms() {
  const [thought, setThought] = useState({ slug: '', content: '', date: '' });
  const [writing, setWriting] = useState({ slug: '', title: '', content: '', date: '' });
  const [message, setMessage] = useState('');

  const submitThought = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/thoughts/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(thought),
    });
    if (res.ok) {
      setMessage('Thought created');
      setThought({ slug: '', content: '', date: '' });
    } else {
      setMessage('Failed to create thought');
    }
  };

  const submitWriting = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/writings/new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(writing),
    });
    if (res.ok) {
      setMessage('Writing created');
      setWriting({ slug: '', title: '', content: '', date: '' });
    } else {
      setMessage('Failed to create writing');
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8">
      {message && <p>{message}</p>}
      <form onSubmit={submitThought} className="flex flex-col gap-2 border p-4 rounded w-80">
        <h2 className="font-bold">New Thought</h2>
        <input placeholder="Slug" value={thought.slug} onChange={e => setThought({ ...thought, slug: e.target.value })} className="border p-2 rounded" />
        <textarea placeholder="Content" value={thought.content} onChange={e => setThought({ ...thought, content: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Date" value={thought.date} onChange={e => setThought({ ...thought, date: e.target.value })} className="border p-2 rounded" />
        <Button text="Create Thought" />
      </form>
      <form onSubmit={submitWriting} className="flex flex-col gap-2 border p-4 rounded w-80">
        <h2 className="font-bold">New Writing</h2>
        <input placeholder="Slug" value={writing.slug} onChange={e => setWriting({ ...writing, slug: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Title" value={writing.title} onChange={e => setWriting({ ...writing, title: e.target.value })} className="border p-2 rounded" />
        <textarea placeholder="Content" value={writing.content} onChange={e => setWriting({ ...writing, content: e.target.value })} className="border p-2 rounded" />
        <input placeholder="Date" value={writing.date} onChange={e => setWriting({ ...writing, date: e.target.value })} className="border p-2 rounded" />
        <Button text="Create Writing" />
      </form>
    </div>
  );
}
