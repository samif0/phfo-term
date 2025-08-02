'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

type AdminPanelProps = {
  addHref?: string;
  editHref?: string;
  deleteEndpoint?: string;
  deleteSlug?: string;
};

export default function AdminPanel({ addHref, editHref, deleteEndpoint, deleteSlug }: AdminPanelProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!deleteEndpoint || !deleteSlug) return;
    await fetch(deleteEndpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: deleteSlug }),
    });
    router.push(`/${deleteEndpoint.split('/').pop()}`);
  };

  const commonClass =
    'p-2 border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] rounded-md transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]';

  return (
    <div className="fixed bottom-4 right-28 z-50 flex gap-2">
      {addHref && (
        <Link href={addHref} className={commonClass} aria-label="Add">
          <PlusIcon className="h-4 w-4" />
        </Link>
      )}
      {editHref && (
        <Link href={editHref} className={commonClass} aria-label="Edit">
          <PencilIcon className="h-4 w-4" />
        </Link>
      )}
      {deleteEndpoint && deleteSlug && (
        <button onClick={handleDelete} className={commonClass} aria-label="Delete">
          <TrashIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

