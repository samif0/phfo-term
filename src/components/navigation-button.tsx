'use client';
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home } from "lucide-react";

import "./components.css";
import Button from "./btn";

export default function NavigationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Check if user came from home page
    const cameFromHome = sessionStorage.getItem('cameFromHome') === 'true';
    setShowBackButton(cameFromHome);
  }, [pathname]);

  // Don't show any button on home page
  if (pathname === '/') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      {showBackButton && (
        <Button
          onClick={() => {
            sessionStorage.removeItem('cameFromHome');
            router.back();
          }}
          className="text-white hover:text-gray-300"
          text="go back"
        />
      )}
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