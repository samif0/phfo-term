import Grid from '@/components/grid';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen gap-4">
      <Link href="/writings" className="text-white hover:text-gray-300 z-10">
        writings
      </Link>
      <Link href="/thoughts" className="text-white hover:text-gray-300 z-10">
        thoughts
      </Link>
      <Link href="/programs" className="text-white hover:text-gray-300 z-10">
        programs
      </Link>
      <Grid
      rows={20} 
      cols={20}>
      </Grid>
    </div>
  );
}
