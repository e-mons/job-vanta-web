"use client";

import { motion } from "framer-motion";
import { Bot, Zap, ShieldCheck } from "lucide-react";

export default function Features() {
  const features = [
    {
      title: "AI-Powered Generation",
      description: "Our Gemini-powered engine instantly crafts professional bullet points tailored to your industry and experience.",
      icon: <Bot className="w-8 h-8 text-blue-500" />,
    },
    {
      title: "Lightning Fast",
      description: "Go from a blank page to a complete, beautiful resume in under 5 minutes without writing a single line.",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
    },
    {
      title: "ATS Optimized",
      description: "Our templates are structurally designed to pass through Applicant Tracking Systems flawlessly.",
      icon: <ShieldCheck className="w-8 h-8 text-emerald-500" />,
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Why choose JobVanta?</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to create the perfect resume and secure your next big opportunity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-card p-8 rounded-2xl flex flex-col items-start text-left hover:-translate-y-2 transition-transform duration-300"
            >
              <div className="p-4 rounded-xl bg-white/5 mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
