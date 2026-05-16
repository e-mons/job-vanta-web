import Link from "next/link";
import { ChevronLeft, CreditCard, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";

export default function RefundPage() {
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
              <RefreshCcw className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold font-outfit">Refund Policy</h1>
          </div>
          <p className="text-slate-300">Last updated: May 16, 2026</p>
        </div>

        {/* Content */}
        <div className="p-8 sm:p-12">
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <CheckCircle2 className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">1. Satisfaction Guarantee</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              We want you to be completely satisfied with JobVanta. If you're not happy with our platform within the first 7 days of your initial subscription, we offer a full refund, no questions asked.
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <RefreshCcw className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">2. Refund Eligibility</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              To be eligible for a refund, you must meet the following criteria:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Request must be made within 7 days of the initial transaction.</li>
              <li>You have not used the platform to download more than 5 ATS-optimized resumes.</li>
              <li>Your account is in good standing and has not violated our Terms of Service.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <XCircle className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">3. Non-Refundable Items</h2>
            </div>
            <p className="text-slate-600 leading-relaxed mb-4">
              The following are generally non-refundable:
            </p>
            <ul className="list-disc pl-6 text-slate-600 space-y-2">
              <li>Renewal payments for monthly or annual plans.</li>
              <li>Promotional or discounted plans (unless stated otherwise).</li>
              <li>Enterprise or bulk licenses.</li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-3 mb-4 text-[#11253E]">
              <CreditCard className="w-6 h-6" />
              <h2 className="text-2xl font-bold font-outfit m-0">4. Processing Refunds</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Once approved, your refund will be processed via our payment partner, Dodo Payments. The funds will be returned to the original payment method used during purchase. Please note that it may take 5-10 business days for the refund to appear on your statement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-[#11253E] font-outfit mb-4">5. How to Request a Refund</h2>
            <p className="text-slate-600 leading-relaxed">
              To request a refund, please email our support team with your account details and order number at:
              <br />
              <span className="font-semibold text-[#11253E]">billing@jobvanta.com</span>
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
