"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useJobStore } from '@/store/useJobStore';
import { useResumeStore } from '@/store/useResumeStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, User, LogOut, LayoutDashboard, Search, FileText, Star, Briefcase } from 'lucide-react';
import { useSubscriptionStore } from '@/store/useSubscription';

interface NavbarProps {
  user?: any;
  isDark?: boolean;
}

export default function Navbar({ user: initialUser, isDark = false }: NavbarProps) {
  const [user, setUser] = useState<any>(initialUser);
  const [isScrolled, setIsScrolled] = useState(isDark);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const resetJobs = useJobStore(s => s.reset);
  const resetResumes = useResumeStore(s => s.reset);
  const { status: subStatus, fetchSubscription } = useSubscriptionStore();

  useEffect(() => {
    if (!initialUser) {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          fetchSubscription();
        }
      });
    } else {
      fetchSubscription();
    }
  }, [initialUser, fetchSubscription]);

  useEffect(() => {
    const handleScroll = () => {
      if (isDark) {
        setIsScrolled(true);
      } else {
        setIsScrolled(window.scrollY > 20);
      }
    };
    handleScroll(); // Initial check
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    resetJobs();
    resetResumes();
    router.refresh();
  };

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'Templates', href: '/#templates' },
    { name: 'Testimonials', href: '/#testimonials' },
  ];

  const authLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Search Jobs', href: '/jobs', icon: <Search className="w-4 h-4" /> },
    { name: 'Applications', href: '/jobs/history', icon: <Briefcase className="w-4 h-4" /> },
    { name: 'Resume Builder', href: '/builder', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled ? 'py-4' : 'py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-16">
        <div 
          className={`relative flex items-center justify-between px-8 py-3 rounded-full transition-all duration-500 ${
            isScrolled ? 'glass shadow-premium' : 'bg-transparent'
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="JobVanta Logo" className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform duration-300" />
            <span className={`text-xl font-bold tracking-tight transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
              JobVanta
            </span>
          </Link>

          {/* Desktop Nav - Centered */}
          <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className={`px-5 py-2 text-sm font-bold transition-all rounded-full ${
                  isScrolled 
                    ? 'text-slate-500 hover:text-blue-600 hover:bg-blue-50' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full transition-all border ${
                    isScrolled 
                      ? 'bg-slate-50 border-slate-100 hover:border-blue-200' 
                      : 'bg-white/10 border-white/10 hover:bg-white/20'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-blue-600/20">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className={`hidden lg:flex flex-col items-start transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight opacity-50">Account</span>
                    <span className="text-xs font-bold leading-tight">{user.email?.split('@')[0]}</span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 origin-top-right z-[60]"
                    >
                      <div className="bg-white/80 backdrop-blur-2xl shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] rounded-[2.5rem] border border-white overflow-hidden ring-1 ring-black/5">
                        {/* Profile Header */}
                        <div className="p-8 bg-gradient-to-br from-blue-600/5 via-transparent to-indigo-600/5 border-b border-slate-100/50">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-600/30">
                                {user.email?.[0].toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full" title="Active Account" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-black text-slate-900 truncate tracking-tight leading-none mb-1">{user.email?.split('@')[0]}</p>
                              <p className="text-[11px] font-bold text-slate-400 truncate uppercase tracking-widest">{user.email}</p>
                              <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${
                                subStatus === 'active' || subStatus === 'trialing' 
                                  ? 'bg-blue-600 text-white shadow-blue-600/20' 
                                  : 'bg-slate-100 text-slate-500 shadow-slate-200/20'
                              }`}>
                                <Star className={`w-3 h-3 ${subStatus === 'active' || subStatus === 'trialing' ? 'fill-white' : 'fill-slate-400'}`} />
                                {subStatus === 'active' || subStatus === 'trialing' ? 'Premium' : 'Free Plan'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Sections */}
                        <div className="p-4">
                          <div className="px-4 pt-2 pb-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.25em]">Main Navigation</div>
                          <div className="space-y-1.5">
                            {authLinks.map((link) => (
                              <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsUserDropdownOpen(false)}
                                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-black text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                              >
                                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-300">
                                  {link.icon}
                                </div>
                                <span className="flex-1 tracking-tight">{link.name}</span>
                                <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-400" />
                              </Link>
                            ))}
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-100/50">
                            <button
                              onClick={handleSignOut}
                              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-black text-rose-500 hover:bg-rose-50 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-white group-hover:text-rose-600 group-hover:shadow-xl group-hover:shadow-rose-500/10 transition-all duration-300">
                                <LogOut className="w-4 h-4" />
                              </div>
                              <span className="flex-1 text-left tracking-tight">Sign Out</span>
                            </button>
                          </div>
                        </div>

                        {/* Quick Action Footer */}
                        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100/10">
                          <p className="text-[10px] text-center font-bold text-slate-400 italic">"Your career, our mission."</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className={`hidden sm:block px-5 py-2 text-sm font-bold transition-colors ${
                    isScrolled ? 'text-slate-600 hover:text-slate-900' : 'text-white/80 hover:text-white'
                  }`}
                >
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className={`hidden sm:inline-flex px-7 py-2.5 rounded-full text-sm font-black transition-all transform active:scale-95 ${
                    isScrolled 
                      ? 'bg-blue-600 text-white shadow-glow-blue hover:bg-blue-700' 
                      : 'bg-white text-blue-600 hover:bg-blue-50 shadow-xl shadow-white/10'
                  }`}
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile Toggle */}
            <button 
              className={`md:hidden p-2 transition-colors ${isScrolled ? 'text-slate-900' : 'text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full px-6 py-8 glass border-b border-slate-100 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {(user ? [...navLinks, ...authLinks] : navLinks).map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-bold text-slate-900 flex items-center justify-between group"
                >
                  {link.name}
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </Link>
              ))}
              {user && (
                <div className="pt-4 mt-4 border-t border-slate-100/50">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between py-4 text-lg font-black text-red-600 group"
                  >
                    <span>Sign Out</span>
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-400 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      <LogOut className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              )}
              {!user && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 rounded-2xl border border-slate-200 text-center font-bold text-slate-600"
                  >
                    Login
                  </Link>
                  <Link 
                    href="/signup" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="py-3 rounded-2xl bg-blue-600 text-white text-center font-bold shadow-lg shadow-blue-600/20"
                  >
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
