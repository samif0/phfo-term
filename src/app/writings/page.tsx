import Link from 'next/link';
import GoBack from '@/components/goback';
import { getAllWritings } from '@/lib/data/writings';

export default async function WritingsPage() {
  const writings = await getAllWritings();
  
  return (
    <div className="min-h-screen relative">
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {writings.map((writing) => (
          <Link 
            key={writing.slug}
            href={`/writings/${writing.slug}`} 
            className="text-white hover:text-gray-300"
          >
            {writing.title}
          </Link>
        ))}
      </div>
      <GoBack />
    </div>
  )
}
