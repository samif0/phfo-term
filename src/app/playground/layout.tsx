import Link from 'next/link';
import { getAllPlaygroundPrograms } from '@/lib/playground-registry';
import Button from '@/components/btn';
import NavigationButton from '@/components/navigation-button';

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  const programs = getAllPlaygroundPrograms();

  // Phones stack the program list above the program instead of squeezing a sidebar
  return (
    <div className="flex flex-col md:flex-row" style={{ minHeight: '100vh' }}>
      <div className="md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">playground programs</h2>
        <ul className="flex flex-wrap gap-2 md:block md:space-y-2">
          {programs.map((program) => (
            <li key={program.id}>
              <Link href={`/playground/${program.id}`}>
                <Button text={program.name} variant="outline" size="medium" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 md:w-2/3 p-4">
        {children}
      </div>
      <NavigationButton />
    </div>
  );
}
