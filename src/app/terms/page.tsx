import Link from "next/link";
import { ChevronLeft, FileText, Scale, Zap, AlertCircle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-[#11253E] p-8 text-white">
          <Link href="/" className="inline-flex items-center text-slate-300 hover:text-white transition-colors mb-6 group">
            <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-outfit">Terms of Service</h1>
          </div>
          <p className="text-slate-300">Last updated: May 16, 2026</p>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-12">
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <Scale className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">1. Acceptance of Terms</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              By accessing or using JobVanta, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <Zap className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">2. Use License</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              Permission is granted to temporarily use the materials (information or software) on JobVanta's platform for personal, non-commercial transitory viewing and use only.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4 font-semibold">You may not:</p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Modify or copy the materials;</li>
              <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
              <li>Attempt to decompile or reverse engineer any software contained on JobVanta's website;</li>
              <li>Remove any copyright or other proprietary notations from the materials;</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">3. Disclaimer</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              The materials on JobVanta's platform are provided on an 'as is' basis. JobVanta makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">4. Limitations</h2>
            <p className="text-slate-600 leading-relaxed">
              In no event shall JobVanta or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on JobVanta's platform, even if JobVanta or a JobVanta authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">5. Governing Law</h2>
            <p className="text-slate-600 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which JobVanta operates and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">6. Contact Information</h2>
            <p className="text-slate-600 leading-relaxed">
              Questions about the Terms of Service should be sent to us at:
              <br />
              <span className="font-semibold text-[#11253E]">legal@jobvanta.com</span>
            </p>
          </section>
        </div>
        
        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-8 text-center">
          <p className="text-slate-500 text-sm">
            &copy; 2026 JobVanta. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
