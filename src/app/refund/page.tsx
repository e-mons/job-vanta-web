import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { CreditCard, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";

export default function RefundPage() {
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
                <RefreshCcw className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tight">Refund <span className="text-blue-400">Policy</span></h1>
            </div>
            <p className="text-slate-400 font-medium relative z-10">Last updated: May 16, 2026</p>
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
      </div>
    </div>
    <Footer />
  </div>
  );
}
