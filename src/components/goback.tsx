'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import "./components.css";
import Button from "./btn";
import { ArrowLeft } from "lucide-react";

export default function GoBack() {
  const router = useRouter();
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    // Check if there's a referrer and if it's from the same domain
    const referrer = document.referrer;
    if (referrer) {
      try {
        const referrerUrl = new URL(referrer);
        const currentUrl = new URL(window.location.href);
        
        // Show back button only if referrer is from the same origin
        setShowBackButton(referrerUrl.origin === currentUrl.origin);
      } catch {
        setShowBackButton(false);
      }
    } else {
      setShowBackButton(false);
    }
  }, []);

  if (!showBackButton) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={() => router.back()}
        text="go back"
        variant="outline"
        size="small"
        icon={<ArrowLeft className="h-3 w-3" />}
      />
    </div>
  );
}
  