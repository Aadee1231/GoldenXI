import type { Metadata } from "next";
import { Trophy, Mail, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact - GoldenXI",
  description: "Get in touch with the GoldenXI team.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">
              Contact <span className="text-yellow-400">Us</span>
            </h1>
          </div>
          <p className="text-lg text-zinc-400">
            Have questions or feedback? We'd love to hear from you.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-6 text-2xl font-bold text-white">Get in Touch</h2>
            <p className="mb-6 text-base leading-relaxed text-zinc-400">
              We're a small team passionate about bringing you the best World Cup 2026 bracket 
              experience. Whether you have questions, found a bug, or just want to say hello, 
              reach out to us.
            </p>
            
            <div className="space-y-4">
              <a
                href="mailto:support@goldenxi.vercel.app"
                className="group flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-yellow-400/50 hover:bg-yellow-400/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-400/15 ring-2 ring-yellow-400/40">
                  <Mail className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-yellow-400 transition-colors">
                    Email Us
                  </div>
                  <div className="text-sm text-zinc-400">
                    support@goldenxi.vercel.app
                  </div>
                </div>
              </a>

              <a
                href="https://twitter.com/goldenxi"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-lg border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-yellow-400/50 hover:bg-yellow-400/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-400/15 ring-2 ring-blue-400/40">
                  <MessageSquare className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Twitter / X
                  </div>
                  <div className="text-sm text-zinc-400">
                    @goldenxi
                  </div>
                </div>
              </a>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Feedback & Bug Reports</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              Found a bug or have a feature suggestion? We're constantly improving GoldenXI and 
              appreciate your feedback. Please include as much detail as possible when reporting 
              issues, including steps to reproduce and screenshots if applicable.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Business Inquiries</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              For partnership opportunities, media inquiries, or other business-related questions, 
              please use the email address above with the subject line "Business Inquiry."
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.02] p-8">
            <h2 className="mb-4 text-2xl font-bold text-white">Response Time</h2>
            <p className="text-base leading-relaxed text-zinc-400">
              We're a small team and do our best to respond to all inquiries within 1-2 business 
              days. During peak tournament times, response times may be longer. Thank you for your 
              patience and support!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
