'use client';
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

import "./components.css";

export default function HomeButton() {
  const router = useRouter();

  return (
    <div className="fixed top-4 left-4 z-50">
      <button
        onClick={() => router.push('/')}
        className="p-2 bg-gray-800 text-white hover:bg-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2"
        aria-label="Go to home"
      >
        <Home className="w-5 h-5" />
      </button>
    </div>
  );
}