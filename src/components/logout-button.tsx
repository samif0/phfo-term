'use client';

import { UserIcon } from '@heroicons/react/24/outline';

export default function LogoutButton() {
  return (
    <div className="fixed bottom-4 right-16 z-50">
      <form action="/api/logout" method="post">
        <button
          aria-label="Logout"
          className="p-2 border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] rounded-md transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
        >
          <UserIcon className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

