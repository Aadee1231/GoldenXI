import type { Metadata } from "next";
import GoalieModeGate from "@/src/components/goalie/GoalieModeGate";

export const metadata: Metadata = {
  title: "Goalkeeper Reaction — GoldenXI",
  description:
    "Test your reflexes in a fast penalty-save challenge. Dive left, center, or right before the ball beats you.",
};

export default function GoaliePage() {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-10 sm:px-6 sm:py-14">
      {/* Background atmosphere */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-64 w-64 rounded-full bg-green-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-red-500/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-red-300 ring-1 ring-red-400/20">
            Reflex Mini-Game
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Goalkeeper{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Reaction
            </span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-400 sm:text-base">
            Read the shot and dive the right way. 10 penalties, pure reflexes.
          </p>
        </div>

        <GoalieModeGate />
      </div>
    </div>
  );
}
