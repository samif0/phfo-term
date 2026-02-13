'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from '@/components/btn';
import NavigationButton from '@/components/navigation-button';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      router.push('/');
    } else if (res.status === 500) {
      setError('server error: check admin password configuration');
    } else {
      setError('invalid password');
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Image
          src="/images/pixelated-sami.png"
          alt="Sami"
          width={120}
          height={120}
          style={{ width: 'auto', height: 'auto' }}
          className="rounded-lg shadow-lg"
        />
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
          <input
            type="password"
            className="border rounded p-2 text-black"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button text="login" variant="outline" />
          {error && <p className="text-red-500">{error}</p>}
        </form>
      </div>
      <NavigationButton />
    </>
  );
}
