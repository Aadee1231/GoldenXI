import Link from "next/link";
import { Trophy } from "lucide-react";

export default function Footer() {
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL;

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-[#0a0a0a] to-black py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Donation CTA Section */}
        <div className="mb-8 sm:mb-12 flex flex-col items-center text-center">
          <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-white">
            World Cup 2026 Bracket Builder
          </h3>

          {donationUrl ? (
            <a
              href={donationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-yellow-400/50 bg-yellow-400/10 px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold text-yellow-400 shadow-lg shadow-yellow-400/10 transition-all hover:border-yellow-400 hover:bg-yellow-400/20 hover:shadow-yellow-400/20 hover:scale-105"
            >
              💛 Support GoldenXI
            </a>
          ) : (
            <button
              disabled
              className="mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-yellow-400/30 bg-yellow-400/5 px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold text-yellow-400/50 cursor-not-allowed"
            >
              💛 Support GoldenXI
            </button>
          )}

          <p className="text-xs sm:text-sm text-zinc-500">
            Free and ad-free. Donations help cover hosting and development costs.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
          <Link
            href="/about"
            className="text-zinc-400 transition-colors hover:text-yellow-400"
          >
            About
          </Link>
          <Link
            href="/how-it-works"
            className="text-zinc-400 transition-colors hover:text-yellow-400"
          >
            How It Works
          </Link>
          <Link
            href="/privacy"
            className="text-zinc-400 transition-colors hover:text-yellow-400"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-zinc-400 transition-colors hover:text-yellow-400"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-zinc-400 transition-colors hover:text-yellow-400"
          >
            Contact
          </Link>
        </div>

        {/* Copyright and Disclaimer */}
        <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-8">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <span className="text-lg font-bold text-white">
              Golden<span className="text-yellow-400">XI</span>
            </span>
          </div>
          <p className="text-sm text-zinc-500">
            © 2026 GoldenXI. Independent fan-made game. Not affiliated with FIFA.
          </p>
        </div>
      </div>
    </footer>
  );
}
