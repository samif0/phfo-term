'use client';
import { useRouter } from "next/navigation";
import "./components.css";

export default function GoBack() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.back()}
      className="gobackbtn absolute bottom-4 left-4 text-white hover:text-gray-300 mb-4"
    >
      go back
    </button>
  );
}
  