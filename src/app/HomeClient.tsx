'use client';

import Button from '@/components/btn';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function HomeClient({ admin }: { admin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNav, setShowNav] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowNav(window.scrollY > window.innerHeight * 0.1);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const Buttons = ({ onClick }: { onClick?: () => void } = {}) => (
    <>
      <Link href="/writings">
        <Button
          text="writings"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
          onClick={onClick}
        />
      </Link>
      <Link href="/thoughts">
        <Button
          text="thoughts"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
          onClick={onClick}
        />
      </Link>
      <Link href="/programs">
        <Button
          text="programs"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
          onClick={onClick}
        />
      </Link>
      <Link href="/playground">
        <Button
          text="playground"
          variant="outline"
          size="medium"
          icon={<ArrowRightIcon className="h-3 w-3" />}
          iconPosition="right"
          onClick={onClick}
        />
      </Link>
    </>
  );

  const ScrollUpArrow = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 mb-4 text-red-800 dark:text-gray-400 blink"
      aria-hidden="true"
    >
      <path d="M12 4l-6 6h4v8h4v-8h4l-6-6z" />
    </svg>
  );

  return (
    <>
      <nav
        className={`fixed top-0 w-full bg-[rgba(var(--background-rgb),0.8)] backdrop-blur-sm flex justify-center sm:justify-center gap-4 py-2 z-40 transition-opacity ${showNav ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="hidden sm:flex gap-4">
          <Buttons />
        </div>
        <div className="flex sm:hidden justify-between w-full px-4">
          <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>
      {menuOpen && showNav && (
        <div className="sm:hidden fixed top-10 left-0 right-0 bg-[rgba(var(--background-rgb),0.95)] backdrop-blur-md flex flex-col items-center gap-2 py-4 z-40">
          <Buttons onClick={() => setMenuOpen(false)} />
        </div>
      )}
      <section className="flex flex-col items-center justify-end min-h-screen pb-16 md:pb-20">
        {!showNav && (
          <>
            <ScrollUpArrow />
            <div className="flex justify-center gap-4">
              <Buttons />
            </div>
          </>
        )}
      </section>
      <section className="max-w-3xl mx-auto mt-20 space-y-6 bg-[rgba(var(--background-rgb),0.6)] backdrop-blur-md p-6 text-red-700 dark:text-gray-300">
        <div className="text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-semibold text-red-800 dark:text-gray-400">hello.</h1>
          <h2 className="mt-2 text-xl sm:text-2xl" style={{ color: 'rgba(180, 90, 70, 0.9)' }}>
            research analyst @ UW Computational Neuroscience Center | RPI CS &apos;23
          </h2>
          <p className="mt-1 text-base text-red-700/80 dark:text-gray-400">previously: software engineer @ AWS</p>
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
