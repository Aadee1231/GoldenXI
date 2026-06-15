import type { Metadata } from "next";
import PoseOffGate from "@/src/components/pose-off/PoseOffGate";

export const metadata: Metadata = {
  title: "Celebration Pose-Off — Match Soccer Celebrations with Your Camera",
  description:
    "GoldenXI's Celebration Pose-Off: match famous soccer celebration poses using your webcam and MediaPipe body tracking. All detection runs locally — no video uploaded.",
  alternates: {
    canonical: "https://goldenxi.vercel.app/pose-off",
  },
  openGraph: {
    title: "Celebration Pose-Off — GoldenXI",
    description:
      "Match soccer celebration poses with your body. AI-powered pose detection, no uploads, runs in your browser.",
    url: "https://goldenxi.vercel.app/pose-off",
  },
};

export default function PoseOffPage() {
  return <PoseOffGate />;
}
