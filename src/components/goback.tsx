'use client';
import { useRouter } from "next/navigation";

import "./components.css";
import Button from "./btn";

export default function GoBack() {
  const router = useRouter();

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <Button
        onClick={() => router.back()}
        className="text-white hover:text-gray-300"
        text="go back"
      />
    </div>
  );
}
  