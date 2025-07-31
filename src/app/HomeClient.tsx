'use client';

import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function HomeClient({ admin }: { admin: boolean }) {
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowNav(window.scrollY > window.innerHeight * 0.1);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const Buttons = () => (
    <>
      <Link href="/writings">
        <Button
          text="writings"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
        />
      </Link>
      <Link href="/thoughts">
        <Button
          text="thoughts"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
        />
      </Link>
      <Link href="/programs">
        <Button
          text="programs"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
        />
      </Link>
      <Link href="/playground">
        <Button
          text="playground"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
        />
      </Link>
    </>
  );

  return (
    <>
      <nav
        className={`fixed top-0 w-full bg-background/80 backdrop-blur-sm flex justify-center gap-4 py-2 z-40 transition-opacity ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <Buttons />
      </nav>
      <section className="flex flex-col items-center justify-end min-h-screen pb-16 md:pb-20">
        <div className={`flex justify-center gap-4 transition-opacity ${showNav ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}> 
          <Buttons />
        </div>
      </section>
      <section className="max-w-3xl mx-auto mt-20 space-y-6 bg-background/60 backdrop-blur-md p-6 text-red-700 dark:text-gray-300">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold text-red-800 dark:text-gray-400">hello.</h1>
          <h2 className="mt-2 text-xl sm:text-2xl" style={{ color: 'rgba(180, 90, 70, 0.9)' }}>
            software engineer @ AWS | RPI CS &apos;23
          </h2>
          <p className="mt-4 text-red-800 dark:text-gray-400">
            self-organizing systems, self-replication, and mechanistic interpretability.
          </p>
        </div>
        <p className="text-red-800 dark:text-gray-400">
          welcome to my corner of the internet. more content will gradually fill this page as i figure out what belongs here.
        </p>
        <p className="text-red-800 dark:text-gray-400">
          in the meantime, explore the links above or check back soon for new thoughts and programs.
        </p>
        {!admin && (
          <div className="mt-4 flex justify-center">
            <Link href="/login">
              <Button text="login" variant="outline" size="small" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
