import Link from 'next/link';
import { getAllPlaygroundPrograms } from '@/lib/playground-registry';
import Button from '@/components/btn';
import NavigationButton from '@/components/navigation-button';

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const programs = getAllPlaygroundPrograms();

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">playground programs</h2>
        <ul className="space-y-2">
          {programs.map((program) => (
            <li key={program.id}>
              <Link href={`/playground/${program.id}`}>
                <Button text={program.name} variant="outline" size="medium" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-2/3 p-4">
        {children}
      </div>
      <NavigationButton />
    </div>
  );
}