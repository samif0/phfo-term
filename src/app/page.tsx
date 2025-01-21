import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Link href="/writings" className="text-white hover:text-gray-300">
        writings
      </Link>
      <Link href="/thoughts" className="text-white hover:text-gray-300">
        thoughts
      </Link>
      <Link href="/programs" className="text-white hover:text-gray-300">
        programs
      </Link>
    </div>
  );
}
