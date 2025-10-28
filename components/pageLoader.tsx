// en haut du fichier (ou dans components/PageLoader.tsx)
import { Loader2 } from "lucide-react";

export const PageLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div
        className="rounded-full p-3"
        style={{
          background: "conic-gradient(from 0deg, rgba(59,130,246,0.15), rgba(139,92,246,0.15))"
        }}
      >
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
      <div className="mt-4 text-purple-600 font-medium">Chargement</div>
    </div>
  );
};
