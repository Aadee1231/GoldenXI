"use client";

import dynamic from "next/dynamic";

const PoseOffGame = dynamic(() => import("./PoseOffGame"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <p className="animate-pulse text-sm text-zinc-500">Loading Pose-Off…</p>
    </div>
  ),
});

export default function PoseOffGate() {
  return <PoseOffGame />;
}
