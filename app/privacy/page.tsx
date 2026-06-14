import type { Metadata } from "next";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - GoldenXI",
  description: "Privacy policy for GoldenXI, the World Cup 2026 bracket builder.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">
              Privacy <span className="text-yellow-400">Policy</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400">
            Last updated: June 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Information We Collect</h2>
            <p className="mb-4 text-base leading-relaxed text-zinc-400">
              GoldenXI collects the following information to provide our services:
            </p>
            <ul className="space-y-2 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Account information:</strong> Email address, display name (optional)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Game data:</strong> Your bracket predictions, goalie game scores, and group memberships</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span><strong className="text-white">Technical data:</strong> IP address, browser type, device information for security and analytics</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">How We Use Your Information</h2>
            <p className="mb-4 text-base leading-relaxed text-zinc-400">
              We use your information to:
            </p>
            <ul className="space-y-2 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Provide and improve our bracket builder and game features</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Calculate and display leaderboard rankings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Enable group functionality and sharing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Analyze usage patterns to improve the user experience</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Prevent fraud and maintain platform security</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Data Sharing</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              We do not sell your personal data. We may share data with service providers who 
              assist in operating our platform (such as hosting and analytics providers), subject 
              to strict confidentiality obligations. Your bracket predictions and game scores are 
              displayed publicly on leaderboards and within your groups as intended by the game features.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Donations</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              Donations to GoldenXI are voluntary and entirely optional. They are not required to 
              use any features of the site. Donation transactions are processed through third-party 
              payment providers, and we do not store your payment information. Donations help cover 
              hosting and development costs but do not grant any special privileges or advantages 
              in the game.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Your Rights</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              You have the right to access, correct, or delete your personal data at any time. 
              You may also request to export your data or close your account. To exercise these 
              rights, please contact us through the information provided below.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Disclaimer</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is an independent fan-made game. It is not affiliated with, endorsed by, 
              sponsored by, or officially connected to FIFA, the FIFA World Cup, or any tournament 
              organizer. All trademarks, team names, and player names are the property of their 
              respective owners.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Contact</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              For privacy-related questions or requests, please contact us through our 
              <a href="/contact" className="text-yellow-400 hover:underline"> contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
