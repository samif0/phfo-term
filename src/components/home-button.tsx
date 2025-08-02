'use client';
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

import "./components.css";

export default function HomeButton() {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => router.push('/')}
        className="p-2 border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] rounded-md transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]"
        aria-label="Go to home"
      >
        <Home className="w-4 h-4" />
      </button>
    </div>
  );
}