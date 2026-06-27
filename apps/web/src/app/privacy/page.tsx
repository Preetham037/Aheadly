import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-gray-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[0%] right-[0%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px]" />
      </div>

      <header className="w-full z-10 glass border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <LogoIcon className="w-5 h-5" color="#8b3dff" />
            <span className="font-bold tracking-tight text-white">Aheadly</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 relative z-10 w-full">
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: June 2026 (VIBE2SHIP Hackathon)</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed mb-4">
              We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us.
            </p>
            <p className="leading-relaxed">
              When you use our AI features, we temporarily process your tasks, schedules, and text inputs to generate personalized productivity recommendations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Use of Information</h2>
            <p className="leading-relaxed mb-4">
              We may use the information we collect about you to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Provide, maintain, and improve our Services</li>
              <li>Provide and deliver the products and services you request</li>
              <li>Send you related information, including confirmations and reminders</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Services</li>
              <li>Personalize and improve the Services and provide content or features that match user profiles or interests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Google Calendar Integration</h2>
            <p className="leading-relaxed mb-4">
              Our application integrates with Google Calendar to read your schedule and create new events for your tasks. We only access the calendar data necessary to provide our core functionality.
            </p>
            <p className="leading-relaxed">
              We do not sell your calendar data, nor do we use it for advertising purposes. Your authentication tokens are securely stored and you can revoke access at any time from your Google Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
            <p className="leading-relaxed">
              We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contact Us</h2>
            <p className="leading-relaxed">
              Since this is a hackathon project, this is not a real privacy policy. But if it were, we'd love to hear from you at <a href="mailto:privacy@aheadly.app" className="text-purple-400 hover:text-purple-300 underline">privacy@aheadly.app</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
