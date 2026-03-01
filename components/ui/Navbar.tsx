"use client";

import { RotateCcw } from "lucide-react";
import { Badge } from "./Badge";

interface NavbarProps {
  onUploadNew?: () => void;
}

export function Navbar({ onUploadNew }: NavbarProps) {
  return (
    <header className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-900 tracking-tight">
            Mog.GPT
          </span>
          <Badge variant="muted">Beta</Badge>
        </div>

        {onUploadNew && (
          <button
            onClick={onUploadNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-150"
          >
            <RotateCcw size={12} />
            New Upload
          </button>
        )}
      </div>
    </header>
  );
}
