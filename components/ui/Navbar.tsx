"use client";

import { RotateCcw } from "lucide-react";
import { Badge } from "./Badge";

interface NavbarProps {
  onUploadNew?: () => void;
}

export function Navbar({ onUploadNew }: NavbarProps) {
  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-zinc-200 tracking-tight">
            Mog.GPT
          </span>
          <Badge variant="muted">Beta</Badge>
        </div>

        {onUploadNew && (
          <button
            onClick={onUploadNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
          >
            <RotateCcw size={12} />
            New Upload
          </button>
        )}
      </div>
    </header>
  );
}
