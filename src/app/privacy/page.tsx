import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ShieldCheck, Lock, Eye, Server } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar isDark={true} />
      <div className="max-w-3xl mx-auto pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Header */}
          <div className="bg-[#11253E] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Privacy <span className="text-blue-400">Policy</span></h1>
            </div>
            <p className="text-slate-400 font-medium relative z-10">Last updated: May 16, 2026</p>
          </div>

        {/* Content */}
        <div className="p-8 sm:p-12">
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <Eye className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">1. Information We Collect</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              At JobVanta, we collect information that helps us provide a personalized career platform. This includes:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li><strong>Account Information:</strong> Your name, email address, and profile details when you sign up.</li>
              <li><strong>Resume Data:</strong> Any information you upload or input into our AI Resume Builder.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our job search and resume tools.</li>
              <li><strong>Payment Information:</strong> Handled securely by our payment partner, Dodo Payments. We do not store your full card details.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <Server className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">2. How We Use Your Data</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Optimize your resume for Applicant Tracking Systems (ATS).</li>
              <li>Match you with verified job opportunities that fit your profile.</li>
              <li>Provide personalized career insights using AI technology.</li>
              <li>Process your subscription payments via Dodo Payments.</li>
              <li>Improve our algorithms to provide better search results.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <Lock className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">3. Data Security</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We take the security of your data seriously. We use industry-standard encryption and security protocols to protect your information. Your data is stored securely using Supabase infrastructure, and all payment processing is handled by Dodo Payments, an industry leader in secure payment infrastructure.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">4. Your Rights</h2>
            <p className="text-slate-600 leading-relaxed">
              You have the right to access, correct, or delete your personal information at any time. You can manage your account settings directly through the JobVanta dashboard or contact our support team for assistance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">5. Contact Us</h2>
            <p className="text-slate-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              <span className="font-semibold text-[#11253E]">privacy@jobvanta.ai</span>
            </p>
          </section>
        </div>
      </div>
    </div>
    <Footer />
  </div>
  );
}
