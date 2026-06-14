import type { Metadata } from "next";
import { Trophy } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - GoldenXI",
  description: "Terms of service for GoldenXI, the World Cup 2026 bracket builder.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">
              Terms of <span className="text-yellow-400">Service</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400">
            Last updated: June 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Acceptance of Terms</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              By accessing or using GoldenXI, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Description of Service</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is a free World Cup 2026 bracket builder and prediction game that allows 
              users to create tournament predictions, compete on leaderboards, join private groups, 
              and play mini-games. The service is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">User Responsibilities</h2>
            <p className="mb-4 text-base leading-relaxed text-zinc-400">
              By using GoldenXI, you agree to:
            </p>
            <ul className="space-y-2 text-base text-zinc-400">
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Provide accurate information when creating your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Maintain the security of your account credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Not use the service for any illegal or unauthorized purpose</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Not attempt to manipulate leaderboards, game scores, or other users' data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                <span>Respect other users and refrain from harassment or abusive behavior</span>
              </li>
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Donations</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              Donations to GoldenXI are voluntary and entirely optional. They are not required to 
              access or use any features of the service. Donations are non-refundable and do not 
              confer any ownership rights, special privileges, or competitive advantages in the 
              game. Donations are used to cover hosting and development costs.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Intellectual Property</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is an independent fan-made game. It is not affiliated with, endorsed by, 
              sponsored by, or officially connected to FIFA, the FIFA World Cup, or any tournament 
              organizer. All trademarks, team names, player names, and tournament logos are the 
              property of their respective owners. The GoldenXI name, logo, and original code are 
              the property of the GoldenXI developers.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Limitation of Liability</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              GoldenXI is provided on an "as is" and "as available" basis. We make no warranties, 
              express or implied, regarding the service. In no event shall GoldenXI or its 
              developers be liable for any indirect, incidental, special, or consequential damages 
              arising from your use of the service.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Account Termination</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              We reserve the right to suspend or terminate accounts that violate these terms of 
              service, engage in fraudulent activity, or attempt to manipulate the platform. 
              Users may also close their accounts at any time through their account settings or 
              by contacting us.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Changes to Terms</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              We may update these terms of service from time to time. Continued use of the service 
              after changes constitutes acceptance of the new terms. We will notify users of 
              significant changes through the platform.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Contact</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              For questions about these terms, please contact us through our 
              <a href="/contact" className="text-yellow-400 hover:underline"> contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
