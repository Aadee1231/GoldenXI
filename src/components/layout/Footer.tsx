"use client";

import Link from "next/link";
import { Trophy, X } from "lucide-react";
import { useState } from "react";

export default function Footer() {
  const [showModal, setShowModal] = useState(false);
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL;
  const venmoUrl = process.env.NEXT_PUBLIC_VENMO_URL;

  const hasDonationOption = donationUrl || venmoUrl;

  return (
    <footer className="border-t border-white/10 bg-gradient-to-b from-[#0a0a0a] to-black py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Donation CTA Section */}
        <div className="mb-8 sm:mb-12 flex flex-col items-center text-center">
          <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-bold text-white">
            World Cup 2026 Bracket Builder
          </h3>

          {hasDonationOption ? (
            <button
              onClick={() => setShowModal(true)}
              className="group mb-3 inline-flex items-center gap-2 rounded-xl border-2 border-yellow-400/50 bg-yellow-400/10 px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base font-bold text-yellow-400 shadow-lg shadow-yellow-400/10 transition-all hover:border-yellow-400 hover:bg-yellow-400/20 hover:shadow-yellow-400/20 hover:scale-105"
            >
              💛 Support GoldenXI
            </button>
          ) : null}

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

      {/* Donation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-yellow-400/20 bg-gradient-to-b from-zinc-900 to-black p-6 sm:p-8 shadow-2xl shadow-yellow-400/10">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-zinc-400 transition-colors hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="mb-6 text-xl font-bold text-white text-center">
              Support GoldenXI
            </h3>

            <div className="flex flex-col gap-3">
              {donationUrl && (
                <a
                  href={donationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-500/50 bg-blue-500/10 px-6 py-3 font-bold text-blue-400 transition-all hover:border-blue-500 hover:bg-blue-500/20 hover:scale-105"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.771.771 0 0 1 .763-.644h6.892c2.317 0 4.134.577 5.203 1.654.997 1.005 1.356 2.425 1.072 4.224-.016.099-.033.2-.053.303-.763 4.026-3.328 5.848-8.32 5.848H8.622l-.992 5.226a.771.771 0 0 1-.763.644h-.291zm6.41-11.595c.09-.536.099-.854.099-1.086 0-1.184-.5-1.705-1.58-1.705h-1.44l-.956 5.03h1.536c1.936 0 2.69-.668 3.341-2.239z" />
                  </svg>
                  Donate with PayPal
                </a>
              )}

              {venmoUrl && (
                <a
                  href={venmoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#008CFF]/50 bg-[#008CFF]/10 px-6 py-3 font-bold text-[#008CFF] transition-all hover:border-[#008CFF] hover:bg-[#008CFF]/20 hover:scale-105"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.5 3h-15C3.12 3 2 4.12 2 5.5v13C2 19.88 3.12 21 4.5 21h15c1.38 0 2.5-1.12 2.5-2.5v-13C22 4.12 20.88 3 19.5 3zm-5.5 12h-2v-5h-2v5h-2V9h6v6zm4 0h-2V9h2v6z" />
                  </svg>
                  Donate with Venmo
                </a>
              )}
            </div>

            <p className="mt-6 text-center text-xs text-zinc-500">
              GoldenXI is free and ad-free. Support is optional and helps cover hosting/development costs.
            </p>
          </div>
        </div>
      )}
    </footer>
  );
}
