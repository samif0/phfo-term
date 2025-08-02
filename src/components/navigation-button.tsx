'use client';
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, ArrowLeft } from "lucide-react";

export default function NavigationButton() {
  const router = useRouter();
  const pathname = usePathname();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    const cameFromHome = sessionStorage.getItem('cameFromHome') === 'true';

    let fromSameOrigin = false;
    const referrer = document.referrer;
    if (referrer) {
      try {
        const refUrl = new URL(referrer);
        fromSameOrigin = refUrl.origin === window.location.origin;
      } catch {
        fromSameOrigin = false;
      }
    }

    const hasHistory = window.history.length > 1;

    setShowBackButton(cameFromHome || fromSameOrigin || hasHistory);
  }, [pathname]);

  // Don't show any button on home page
  if (pathname === '/') {
    return null;
  }

  const commonClass =
    'p-2 border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] rounded-md transition-colors duration-200 hover:bg-[var(--foreground)] hover:text-[var(--background)]';

  return (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2">
      {showBackButton && (
        <button
          onClick={() => {
            sessionStorage.removeItem('cameFromHome');
            router.back();
          }}
          className={commonClass}
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      <button
        onClick={() => router.push('/')}
        className={commonClass}
        aria-label="Go to home"
      >
        <Home className="w-4 h-4" />
      </button>
    </div>
  );
}