import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LogoIcon } from "@/components/LogoIcon";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden text-gray-300">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[30%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px]" />
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
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: June 2026 (VIBE2SHIP Hackathon)</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed mb-4">
              By accessing and using Aheadly ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="leading-relaxed mb-4">
              Aheadly is an AI-powered productivity companion designed to help users plan tasks, manage schedules, and improve productivity. The Service integrates with third-party platforms like Google Calendar to provide these features.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. AI and Automated Scheduling</h2>
            <p className="leading-relaxed mb-4">
              Our Service utilizes artificial intelligence (AI) to make schedule recommendations and automatically create calendar events. While we strive for accuracy, AI-generated schedules and priorities may occasionally be incorrect or suboptimal.
            </p>
            <p className="leading-relaxed">
              <strong>Disclaimer:</strong> You are solely responsible for reviewing and verifying important deadlines and tasks. We are not liable for any missed deadlines, lost productivity, or academic/professional consequences resulting from your reliance on the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Accounts and Security</h2>
            <p className="leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Modifications to the Service</h2>
            <p className="leading-relaxed">
              We reserve the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice. We shall not be liable to you or to any third party for any modification, suspension or discontinuance of the Service.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
