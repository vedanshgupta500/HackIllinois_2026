import { Badge } from "./Badge";

export function Navbar() {
  return (
    <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container flex items-center justify-between h-14">
        <span className="text-sm font-semibold text-zinc-200 tracking-tight">
          Frame
        </span>
        <Badge variant="muted">Beta</Badge>
      </div>
    </header>
  );
}
