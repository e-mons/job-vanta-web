"use client";

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Shield, Rocket, Sparkles, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

import { createClient } from '@/utils/supabase/client';
import { useSubscriptionStore } from '@/store/useSubscription';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: "Free",
    price: "0",
    dodoProductId: null,
    desc: "Perfect for exploring the platform",
    features: [
      "ATS-Friendly Resume Builder",
      "Limited AI Suggestions",
      "Job Search & Matching",
      "3 Saved Resumes",
      "Basic Support"
    ],
    cta: "Start for Free",
    href: "/signup",
    highlight: false,
    icon: <Shield className="w-6 h-6 text-slate-400" />
  },
  {
    name: "Pro",
    price: "29",
    dodoProductId: "pdt_0Newfu26VwAPCKJBoT8z5",
    desc: "Most popular for active job seekers",
    features: [
      "Everything in Free",
      "Unlimited AI Resume Optimization",
      "Priority Job Matching",
      "Unlimited Resume Storage",
      "Priority Email Support",
      "Advanced Career Insights"
    ],
    cta: "Get Started Pro",
    href: "/signup?plan=pro",
    highlight: true,
    icon: <Zap className="w-6 h-6 text-blue-500" />
  },
  {
    name: "Enterprise",
    price: "99",
    dodoProductId: "pdt_0NewgKeXYMkBEofXpxy9Z",
    desc: "Executive-level career management",
    features: [
      "Everything in Pro",
      "Dedicated Career Coach (AI)",
      "Portfolio Website Builder",
      "Direct Recruiter Network",
      "24/7 Premium Support",
      "Interview Coaching (AI Video)"
    ],
    cta: "Go Enterprise",
    href: "/signup?plan=enterprise",
    highlight: false,
    icon: <Crown className="w-6 h-6 text-amber-500" />
  }
];

export default function PricingPage() {
  const router = useRouter();
  const { createCheckoutSession, isLoading } = useSubscriptionStore();

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!plan.dodoProductId) {
      router.push(plan.href);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push(`${plan.href}&redirect=/pricing`);
      return;
    }

    await createCheckoutSession(plan.dodoProductId);
  };

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-40 pb-24 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03),transparent_70%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 mb-6"
            >
              <Rocket className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Simple Pricing</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-6">
              Invest in your <span className="text-blue-600">Future.</span>
            </h1>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Choose the plan that fits your career goals. Whether you're just starting out or targeting executive roles, we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative p-8 md:p-10 rounded-[3rem] bg-white border transition-all duration-500 group ${plan.highlight
                    ? 'border-blue-200 shadow-2xl shadow-blue-600/10 md:scale-105 z-20'
                    : 'border-slate-100 shadow-xl shadow-slate-200/50 hover:border-blue-100'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:bg-blue-50 transition-colors">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-500 font-medium">{plan.desc}</p>
                </div>

                <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">${plan.price}</span>
                  <span className="text-slate-400 font-bold text-sm">/month</span>
                </div>

                <div className="space-y-4 mb-12">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading}
                  className={`w-full py-5 rounded-2xl font-black text-center transition-all block disabled:opacity-50 ${plan.highlight
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:-translate-y-1'
                      : 'bg-slate-50 text-slate-900 hover:bg-slate-100'
                    }`}
                >
                  {isLoading ? "Processing..." : plan.cta}
                </button>
              </motion.div>
            ))}
          </div>


          {/* FAQ Link / Help */}
          <div className="mt-20 text-center">
            <div className="glass p-6 sm:p-8 rounded-[2.5rem] inline-flex flex-col md:flex-row items-center gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-4 border-white bg-slate-200" />
                ))}
              </div>
              <div className="text-center md:text-left">
                <p className="text-slate-900 font-bold text-base sm:text-lg">Need a custom plan for your team?</p>
                <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">Join 500+ companies hiring through JobVanta.</p>
              </div>
              <Link
                href="/contact"
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors shrink-0"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
