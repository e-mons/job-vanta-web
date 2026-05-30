"use client";

import Link from 'next/link';
import { Briefcase, Mail, Phone, ExternalLink, Globe } from 'lucide-react';

const Facebook = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
);

const Youtube = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.56 49.56 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" /></svg>
);


export default function Footer() {
  return (
    <footer className="relative bg-[#020617] border-t border-white/5 pt-24 pb-12 overflow-hidden">

      {/* Background Decor */}
      <div className="absolute inset-0 ribbed-background opacity-[0.03]" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Background Watermark */}
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 select-none pointer-events-none opacity-[0.02] transition-opacity">
        <h1 className="text-[12rem] md:text-[25rem] font-black tracking-tighter text-white whitespace-nowrap">
          JobVanta
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 items-start">

          {/* Brand Info (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="JobVanta Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-600/20" />
              <span className="text-2xl font-black text-white tracking-tight">JobVanta</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium max-w-sm">
              Empowering professionals to land their dream careers through AI-driven optimization, secure ATS parsing, and intelligent job matching.
            </p>
            <div className="flex items-center gap-3.5">
              {[
                { icon: <Facebook className="w-5 h-5" />, href: "#" },
                { icon: <Linkedin className="w-5 h-5" />, href: "#" },
                { icon: <Youtube className="w-5 h-5" />, href: "#" },
                { icon: <Twitter className="w-5 h-5" />, href: "#" }
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10 hover:bg-blue-600 hover:border-blue-500 hover:scale-115 transition-all duration-300 shadow-md"
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <div className="text-slate-500 text-xs font-bold tracking-wide">
              © Copyright {new Date().getFullYear()} JobVanta App. All rights reserved.
            </div>
          </div>

          {/* Column 2: Platform (1 Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              <li><Link href="#templates" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Resume Templates</Link></li>
              <li><Link href="/jobs" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Job Search</Link></li>
              <li><Link href="/pricing" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Pricing</Link></li>
              <li><Link href="/login" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Web App Login</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources (1 Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5">
              <li><Link href="#faq" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Help Center</Link></li>
              <li><Link href="#templates" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Resume Guide</Link></li>
              <li><Link href="#faq" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">ATS FAQ</Link></li>
              <li><Link href="#ai-features" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">AI Helper</Link></li>
            </ul>
          </div>

          {/* Column 4: Company (1 Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="#about" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">About Us</Link></li>
              <li><Link href="#about" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Team Transparency</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Contact Us</Link></li>
              <li>
                <a href="mailto:support@jobvanta.ai" className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 font-bold text-sm transition-all group">
                  Support <ExternalLink className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 5: Legal (1 Column) */}
          <div className="lg:col-span-1 space-y-4">
            <h4 className="text-sm font-black text-white uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link href="/privacy" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Terms of Service</Link></li>
              <li><Link href="/refund" className="text-slate-400 hover:text-blue-400 font-bold text-sm transition-all">Refund Policy</Link></li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
}

