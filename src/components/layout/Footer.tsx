import { Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="text-lg font-bold text-white">
              Golden<span className="text-yellow-400">XI</span>
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            © {new Date().getFullYear()} GoldenXI. Built for soccer fans.
          </p>
        </div>
      </div>
    </footer>
  );
}
