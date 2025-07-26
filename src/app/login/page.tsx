'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Button from '@/components/btn';

// Client-side login form that posts credentials to NextAuth. If the password
// matches the one stored in Secrets Manager, the user receives a session cookie.

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      redirect: false,
      password,
    });
    if (res?.ok) {
      // Successful login - NextAuth has set a session cookie so we can navigate
      // to the protected admin page.
      router.push('/admin');
    } else {
      setError('Invalid password');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="border p-2 rounded"
        />
        <Button text="Login" variant="primary" />
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
